import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db";
import Room from "@/lib/models/room.model";
import Reservation from "@/lib/models/reservation.model";
import { syncReservationToGoogleSheets } from "@/lib/google-sheets";
import { calculateReservationAmounts, calculateReservationBalance } from "@/lib/reservation-pricing";
import {
  addDays,
  findReservationConflict,
  formatDayKey,
  formatReservationDateInput,
  getDayDiff,
  getDayOffset,
  getReservationAuthUser,
  getStatusColorKey,
  overlapsRange,
  parseReservationDate,
  startOfDay,
} from "@/lib/reservations";
import { normalizeStoredReservationDate } from "@/lib/reservation-dates";

function sanitizeReservationPayments(payments: unknown) {
  if (!Array.isArray(payments)) {
    return [];
  }

  return payments
    .map((p) => {
      const item = p as Record<string, unknown>;
      const amount = Math.max(0, Number(item?.amount || 0));
      const paymentMethod = String(item?.paymentMethod || "Efectivo").trim();

      return {
        _id: item?._id ? String(item._id) : undefined,
        amount,
        paymentMethod,
        date: item?.date ? new Date(String(item.date)) : new Date(),
        notes: String(item?.notes || "").trim(),
        registeredBy: String(item?.registeredBy || "").trim(),
      };
    })
    .filter(Boolean);
}

function sanitizeReservationExtras(extras: unknown) {
  if (!Array.isArray(extras)) {
    return [];
  }

  return extras
    .map((extra) => {
      const item = extra as Record<string, unknown>;
      const name = String(item?.name || "").trim();
      const unitValue = Math.max(0, Number(item?.unitValue || 0));
      const quantity = Math.max(0, Number(item?.quantity || 0));

      if (!name) {
        return null;
      }

      return {
        name,
        unitValue,
        quantity,
        totalValue: unitValue * quantity,
      };
    })
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    getReservationAuthUser(req);
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const hotelParam = searchParams.get("hotel");

    const startDate = startParam ? parseReservationDate(startParam) : startOfDay(new Date());
    const endDate = endParam ? parseReservationDate(endParam) : addDays(startDate, 14);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: "Invalid date range" },
        { status: 400 }
      );
    }

    const roomQuery = hotelParam ? { hotel: hotelParam } : {};
    const rooms = await (Room as any).find(roomQuery).sort({ hotel: 1, roomType: 1, roomNumber: 1 }).lean();
    const days = [];
    for (let current = new Date(startDate); current < endDate; current = addDays(current, 1)) {
      days.push({
        key: formatDayKey(current),
        iso: formatReservationDateInput(current),
        dayNumber: current.getDate(),
        weekDayShort: current.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "").toUpperCase(),
        monthShort: current.toLocaleDateString("es-CO", { month: "short" }).replace(".", "").toUpperCase(),
      });
    }

    const reservationQuery: any = {
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    };

    if (hotelParam) {
      reservationQuery.hotel = hotelParam;
    }

    const persistedReservations = await (Reservation as any)
      .find(reservationQuery)
      .populate("roomId", "roomNumber roomType hotel")
      .lean();

    const reservationsByRoomId = new Map<string, any[]>();
    const unassigned: any[] = [];

    persistedReservations.forEach((reservation: any) => {
      const checkIn = normalizeStoredReservationDate(reservation.checkIn);
      const checkOut = normalizeStoredReservationDate(reservation.checkOut);

      if (!overlapsRange(checkIn, checkOut, startDate, endDate)) {
        return;
      }

      const blockStart = checkIn < startDate ? startDate : checkIn;
      const blockEnd = checkOut > endDate ? endDate : checkOut;
      const startsBeforeRange = checkIn < startDate;
      const endsAfterRange = checkOut > endDate;
      const roomId =
        typeof reservation.roomId === "object" && reservation.roomId !== null
          ? String(reservation.roomId._id || reservation.roomId)
          : reservation.roomId
            ? String(reservation.roomId)
            : null;

      const roomNumber =
        reservation.roomId && typeof reservation.roomId === "object"
          ? reservation.roomId.roomNumber
          : reservation.roomNumberSnapshot;

      const roomType =
        reservation.roomId && typeof reservation.roomId === "object"
          ? reservation.roomId.roomType
          : reservation.roomTypeSnapshot;

      const balance = calculateReservationBalance(reservation);

      const block = {
        id: String(reservation._id),
        guestName: reservation.guestName,
        phoneNumber: reservation.phoneNumber || "",
        email: reservation.email || "",
        hasIva: Boolean(reservation.hasIva),
        hasIvaExtras: Boolean(reservation.hasIvaExtras),
        paymentMethod: reservation.paymentMethod || "",
        notes: reservation.notes || "",
        guestCount: Number(reservation.guestCount || 1),
        roomPrice: Number(reservation.roomPrice || 0),
        travelerId: reservation.travelerId ? String(reservation.travelerId) : null,
        isPersisted: reservation.isPersisted !== undefined ? reservation.isPersisted : true,
        roomId,
        roomNumber,
        roomType,
        hotel:
          reservation.roomId && typeof reservation.roomId === "object"
            ? reservation.roomId.hotel
            : reservation.hotel,
        status: reservation.status,
        source: reservation.source || null,
        checkIn: formatReservationDateInput(checkIn),
        checkOut: formatReservationDateInput(checkOut),
        startOffsetDays: getDayOffset(startDate, blockStart),
        spanDays: getDayDiff(blockStart, blockEnd),
        isClippedStart: startsBeforeRange,
        isClippedEnd: endsAfterRange,
        colorKey: getStatusColorKey(reservation.status),
        payments: reservation.payments || [],
        totalPrice: balance.totalPrice,
        totalPaid: balance.totalPaid,
        pendingDebt: balance.pendingDebt,
        hasPendingDebt: balance.hasPendingDebt,
      };

      if (!roomId) {
        unassigned.push(block);
        return;
      }

      const existing = reservationsByRoomId.get(roomId) || [];
      existing.push(block);
      reservationsByRoomId.set(roomId, existing);
    });

    const groupedMap = new Map<string, { roomType: string; rooms: any[] }>();

    rooms.forEach((room: any) => {
      const roomType = room.roomType || "Sin categoría";
      if (!groupedMap.has(roomType)) {
        groupedMap.set(roomType, { roomType, rooms: [] });
      }

      groupedMap.get(roomType)!.rooms.push({
        roomId: String(room._id),
        roomNumber: room.roomNumber,
        hotel: room.hotel,
        state: room.state,
        reservations: (reservationsByRoomId.get(String(room._id)) || []).sort(
          (left, right) => left.startOffsetDays - right.startOffsetDays
        ),
      });
    });

    const groups = Array.from(groupedMap.values()).map((group) => ({
      ...group,
      rooms: group.rooms.sort((left, right) => left.roomNumber.localeCompare(right.roomNumber, undefined, { numeric: true })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          totalDays: days.length,
        },
        filters: {
          hotel: hotelParam || null,
        },
        days,
        groups,
        unassigned: unassigned.sort((left, right) => left.checkIn.localeCompare(right.checkIn)),
      },
    });
  } catch (error: any) {
    console.error("Calendar reservations error:", error);
    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const authUser = getReservationAuthUser(req);
    const body = await req.json();

    const guestName = String(body.guestName || "").trim();
    const phoneNumber = String(body.phoneNumber || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const hasIva = Boolean(body.hasIva);
    const hasIvaExtras = Boolean(body.hasIvaExtras);
    const hotel = String(body.hotel || "").trim();
    const guestCount = Math.max(1, Number(body.guestCount || 1));
    const roomPrice = Math.max(0, Number(body.roomPrice || 0));
    const pricing = calculateReservationAmounts(roomPrice, hasIva);
    const checkIn = parseReservationDate(body.checkIn);
    const checkOut = parseReservationDate(body.checkOut);
    const roomId = body.roomId ? String(body.roomId) : null;
    const extras = sanitizeReservationExtras(body.extras);
    const payments = sanitizeReservationPayments(body.payments);
    const methodsFromPayments = Array.from(
      new Set(
        payments
          .map((p: any) => String(p.paymentMethod || "").trim())
          .filter(Boolean)
      )
    );
    const paymentMethod = methodsFromPayments.length > 0
      ? methodsFromPayments.join(", ")
      : String(body.paymentMethod || "").trim();

    if (!guestName || !hotel || Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { success: false, error: "guestName, hotel, checkIn and checkOut are required" },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { success: false, error: "Check-out must be later than check-in" },
        { status: 400 }
      );
    }

    let roomData: any = null;
    if (roomId) {
      roomData = await (Room as any).findById(roomId).lean();

      if (!roomData) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      const conflict = await findReservationConflict({ roomId, checkIn, checkOut });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "The selected room already has a reservation in that range" },
          { status: 409 }
        );
      }
    }

    const reservation = await (Reservation as any).create({
      guestName,
      phoneNumber,
      email,
      hasIva,
      hasIvaExtras,
      paymentMethod,
      guestCount,
      roomPrice,
      ivaAmount: pricing.ivaAmount,
      roomPriceWithoutIva: pricing.roomPriceWithoutIva,
      roomPriceWithIva: pricing.roomPriceWithIva,
      travelerId: body.travelerId || null,
      roomId,
      roomNumberSnapshot: roomData?.roomNumber || body.roomNumberSnapshot || "",
      hotel: roomData?.hotel || hotel,
      roomTypeSnapshot: roomData?.roomType || body.roomTypeSnapshot || "Sin categoría",
      checkIn,
      checkOut,
      status: roomId ? body.status || "confirmed" : "unassigned",
      source: body.source || "",
      notes: body.notes || "",
      extras,
      payments,
      createdBy: authUser.id,
      updatedBy: authUser.id,
    });

    const freshReservation = await (Reservation as any)
      .findById(reservation._id)
      .populate("roomId", "roomNumber roomType hotel")
      .populate("travelerId", "name roomNumber");

    try {
      await syncReservationToGoogleSheets((freshReservation || reservation).toObject(), "upsert");
    } catch (syncError) {
      console.error("Google Sheets sync failed after reservation create:", syncError);
    }

    return NextResponse.json({ success: true, data: freshReservation || reservation }, { status: 201 });
  } catch (error: any) {
    console.error("Calendar reservation create error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
