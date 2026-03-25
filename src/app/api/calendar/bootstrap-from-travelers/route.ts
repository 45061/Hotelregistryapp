import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db";
import Traveler from "@/lib/models/traveler.model";
import Room from "@/lib/models/room.model";
import Reservation from "@/lib/models/reservation.model";
import { syncReservationsBatchToGoogleSheets } from "@/lib/google-sheets";
import { addDays, getReservationAuthUser, parseReservationDate } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const authUser = getReservationAuthUser(req);
    const travelers = await (Traveler as any).find({}).lean();
    const rooms = await (Room as any).find({}).lean();
    const roomsByNumber = new Map<string, any>(rooms.map((room: any) => [room.roomNumber, room]));

    let created = 0;
    let skipped = 0;
    const createdReservations = [];

    for (const traveler of travelers) {
      const existingReservation = await (Reservation as any).findOne({
        travelerId: traveler._id,
      });

      if (existingReservation) {
        skipped += 1;
        continue;
      }

      const room = roomsByNumber.get(traveler.roomNumber);
      const checkIn = parseReservationDate(traveler.date);
      const checkOut = addDays(checkIn, Math.max(1, Number(traveler.reservedNights) || 1));

      const reservation = await (Reservation as any).create({
        guestName: traveler.name,
        phoneNumber: traveler.phoneNumber || traveler.cellPhone || traveler.telephone || "",
        email: traveler.email || "",
        guestCount: 1 + (traveler.companions?.length || 0),
        roomPrice: Number(traveler.amountPaid || 0),
        travelerId: traveler._id,
        roomId: room?._id || null,
        roomNumberSnapshot: traveler.roomNumber,
        hotel: room?.hotel || traveler.headquarters || "Sin sede",
        roomTypeSnapshot: room?.roomType || "Sin categoría",
        checkIn,
        checkOut,
        status: room ? "checked_in" : "unassigned",
        source: traveler.reservationLocation || "",
        notes: "Migrated from traveler records",
        createdBy: authUser.id,
        updatedBy: authUser.id,
      });

      createdReservations.push(reservation.toObject());
      created += 1;
    }

    if (createdReservations.length > 0) {
      try {
        await syncReservationsBatchToGoogleSheets(createdReservations, "bulk_upsert");
      } catch (syncError) {
        console.error("Google Sheets sync failed after bootstrap:", syncError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created,
        skipped,
        totalTravelers: travelers.length,
      },
    });
  } catch (error: any) {
    console.error("Calendar bootstrap error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
