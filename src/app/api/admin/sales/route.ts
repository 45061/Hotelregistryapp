import { NextRequest, NextResponse } from 'next/server';
import TravelerRecord, { ITraveler } from '@/lib/models/traveler.model';
import dbConnect from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ICompanion } from '@/lib/models/companion.model';

const roomsByHeadquarters = {
  "Natural Sevgi": ["201", "202", "203", "204", "301", "302", "303", "304", "401", "402", "403", "404"],
  "Oporto 83": ["221", "222", "223", "224", "225", "321", "322", "323", "324", "325", "421", "423", "424"],
};

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const headquarters = searchParams.get('headquarters') as keyof typeof roomsByHeadquarters | null;

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Please provide a date range' }, { status: 400 });
    }

    let allRooms: string[] = [];
    if (headquarters) {
      allRooms = roomsByHeadquarters[headquarters] || [];
    } else {
      allRooms = Object.values(roomsByHeadquarters).flat();
    }

    const salesFilter: any = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (headquarters) {
      salesFilter.headquarters = headquarters;
    }

    const salesData =
      await TravelerRecord
        .find<ITraveler<ICompanion>>(salesFilter)
        .populate<{ companions: ICompanion[] }>('companions');

    const totalIncome = salesData.reduce((acc, traveler) => acc + traveler.amountPaid, 0);

    const incomeByRoom = allRooms.reduce((acc, roomNumber) => {
      acc[roomNumber] = 0;
      return acc;
    }, {} as Record<string, number>);

    const mainTravelersByIdType = {};
    const companionsByIdType = {};
    const paymentsByMethod = {} as Record<string, number>;
    const breakfastsByDate = {} as Record<string, number>;

    // Initialize breakfast counts for each day in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      breakfastsByDate[key] = 0;
    }

    salesData.forEach(traveler => {
      const { roomNumber, amountPaid, idType, companions, paymentMethod, breakfast, date } = traveler;
      if (incomeByRoom.hasOwnProperty(roomNumber)) {
        incomeByRoom[roomNumber] += amountPaid;
      }

      // Count traveler
      mainTravelersByIdType[idType] = (mainTravelersByIdType[idType] || 0) + 1;

      // Count payment methods
      paymentsByMethod[paymentMethod] = (paymentsByMethod[paymentMethod] || 0) + 1;

      // Count companions
      if (companions && companions.length > 0) {
        companions.forEach(companion => {
          companionsByIdType[companion.idType] = (companionsByIdType[companion.idType] || 0) + 1;
        });
      }

      // Count breakfasts by day
      if (breakfast) {
        const key = new Date(date).toISOString().split('T')[0];
        const totalBreakfasts = 1 + (companions ? companions.length : 0);
        breakfastsByDate[key] = (breakfastsByDate[key] || 0) + totalBreakfasts;
      }
    });

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const lastFiveDaysFilter: any = {
      date: {
        $gte: fiveDaysAgo,
        $lte: new Date(),
      },
    };
    if (headquarters) {
      lastFiveDaysFilter.headquarters = headquarters;
    }

    const lastFiveDaysSales = await TravelerRecord.find<ITraveler>(lastFiveDaysFilter);

    const roomSalesCount = allRooms.reduce((acc, room) => {
      acc[room] = 0;
      return acc;
    }, {} as Record<string, number>);

    lastFiveDaysSales.forEach(traveler => {
      const { roomNumber } = traveler;
      if (roomSalesCount.hasOwnProperty(roomNumber)) {
        roomSalesCount[roomNumber] += 1;
      }
    });

    let topRoomLast5Days: string | null = null;
    let maxSales = 0;
    Object.entries(roomSalesCount).forEach(([room, count]) => {
      if (count > maxSales) {
        maxSales = count as number;
        topRoomLast5Days = room;
      }
    });

    const unsoldRoomsLast5Days = Object.entries(roomSalesCount)
      .filter(([_, count]) => count === 0)
      .map(([room]) => room);

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        incomeByRoom,
        mainTravelersByIdType,
        companionsByIdType,
        paymentsByMethod,
        breakfastsByDate,
        topRoomLast5Days,
        unsoldRoomsLast5Days,
        salesData,
      },
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
