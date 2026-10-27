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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const authUser = getReservationAuthUser(req);
    const reservation = await (Reservation as any).findById(params.id);

    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    const body = await req.json();
    const roomId = body.roomId ? String(body.roomId) : null;

    if (!roomId) {
      reservation.roomId = null;
      reservation.status = "unassigned";
      reservation.updatedBy = authUser.id;
      await reservation.save();

      try {
        await syncReservationToGoogleSheets(reservation.toObject(), "upsert");
      } catch (syncError) {
        console.error("Google Sheets sync failed after unassigning room:", syncError);
      }

      return NextResponse.json({ success: true, data: reservation });
    }

    const room = await (Room as any).findById(roomId).lean();
    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    const conflict = await findReservationConflict({
      roomId,
      checkIn: parseReservationDate(reservation.checkIn),
      checkOut: parseReservationDate(reservation.checkOut),
      excludeReservationId: params.id,
    });

    if (conflict) {
      return NextResponse.json(
        { success: false, error: "The selected room already has a reservation in that range" },
        { status: 409 }
      );
    }

    reservation.roomId = roomId;
    reservation.roomNumberSnapshot = room.roomNumber;
    reservation.roomTypeSnapshot = room.roomType;
    reservation.hotel = room.hotel;
    reservation.status = body.status || "confirmed";
    reservation.updatedBy = authUser.id;
    await reservation.save();

    try {
      await syncReservationToGoogleSheets(reservation.toObject(), "upsert");
    } catch (syncError) {
      console.error("Google Sheets sync failed after assigning room:", syncError);
    }

    return NextResponse.json({ success: true, data: reservation });
  } catch (error: any) {
    console.error("Calendar reservation assign-room error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
