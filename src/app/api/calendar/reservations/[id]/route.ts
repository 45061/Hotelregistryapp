import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db";
import Reservation from "@/lib/models/reservation.model";
import Room from "@/lib/models/room.model";
import { syncReservationToGoogleSheets } from "@/lib/google-sheets";
import {
  findReservationConflict,
  getReservationAuthUser,
  parseReservationDate,
} from "@/lib/reservations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const reservation = await (Reservation as any)
      .findById(params.id)
      .populate("roomId", "roomNumber roomType hotel")
      .populate("travelerId", "name roomNumber");

    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reservation });
  } catch (error: any) {
    console.error("Calendar reservation detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const authUser = getReservationAuthUser(req);
    const reservation = await (Reservation as any).findById(params.id);

    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    const body = await req.json();
    const nextCheckIn = body.checkIn ? parseReservationDate(body.checkIn) : reservation.checkIn;
    const nextCheckOut = body.checkOut ? parseReservationDate(body.checkOut) : reservation.checkOut;
    const nextRoomId =
      body.roomId !== undefined
        ? body.roomId
          ? String(body.roomId)
          : null
        : reservation.roomId
          ? String(reservation.roomId)
          : null;

    if (nextCheckOut <= nextCheckIn) {
      return NextResponse.json(
        { success: false, error: "Check-out must be later than check-in" },
        { status: 400 }
      );
    }

    let roomData: any = null;
    if (nextRoomId) {
      roomData = await (Room as any).findById(nextRoomId).lean();
      if (!roomData) {
        return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
      }

      const conflict = await findReservationConflict({
        roomId: nextRoomId,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        excludeReservationId: params.id,
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: "The selected room already has a reservation in that range" },
          { status: 409 }
        );
      }
    }

    reservation.guestName = body.guestName !== undefined ? String(body.guestName).trim() : reservation.guestName;
    reservation.phoneNumber =
      body.phoneNumber !== undefined ? String(body.phoneNumber).trim() : reservation.phoneNumber;
    reservation.email =
      body.email !== undefined ? String(body.email).trim().toLowerCase() : reservation.email;
    reservation.hasIva =
      body.hasIva !== undefined ? Boolean(body.hasIva) : reservation.hasIva;
    reservation.paymentMethod =
      body.paymentMethod !== undefined ? String(body.paymentMethod).trim() : reservation.paymentMethod;
    reservation.guestCount =
      body.guestCount !== undefined ? Math.max(1, Number(body.guestCount || 1)) : reservation.guestCount;
    reservation.roomPrice =
      body.roomPrice !== undefined ? Math.max(0, Number(body.roomPrice || 0)) : reservation.roomPrice;
    reservation.travelerId = body.travelerId !== undefined ? body.travelerId || null : reservation.travelerId;
    reservation.roomId = nextRoomId;
    reservation.roomNumberSnapshot =
      roomData?.roomNumber || body.roomNumberSnapshot || reservation.roomNumberSnapshot;
    reservation.hotel = roomData?.hotel || body.hotel || reservation.hotel;
    reservation.roomTypeSnapshot =
      roomData?.roomType || body.roomTypeSnapshot || reservation.roomTypeSnapshot;
    reservation.checkIn = nextCheckIn;
    reservation.checkOut = nextCheckOut;
    reservation.status = nextRoomId
      ? body.status || reservation.status || "confirmed"
      : "unassigned";
    reservation.source = body.source !== undefined ? body.source : reservation.source;
    reservation.notes = body.notes !== undefined ? body.notes : reservation.notes;
    reservation.updatedBy = authUser.id;

    await reservation.save();

    const freshReservation = await (Reservation as any)
      .findById(params.id)
      .populate("roomId", "roomNumber roomType hotel")
      .populate("travelerId", "name roomNumber");

    try {
      await syncReservationToGoogleSheets((freshReservation || reservation).toObject(), "upsert");
    } catch (syncError) {
      console.error("Google Sheets sync failed after reservation update:", syncError);
    }

    return NextResponse.json({ success: true, data: freshReservation || reservation });
  } catch (error: any) {
    console.error("Calendar reservation update error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    getReservationAuthUser(req);

    const reservation = await (Reservation as any).findById(params.id);

    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    const reservationPayload = reservation.toObject();
    await reservation.deleteOne();

    try {
      await syncReservationToGoogleSheets(reservationPayload, "delete");
    } catch (syncError) {
      console.error("Google Sheets sync failed after reservation delete:", syncError);
    }

    return NextResponse.json({
      success: true,
      data: { id: params.id },
    });
  } catch (error: any) {
    console.error("Calendar reservation delete error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
