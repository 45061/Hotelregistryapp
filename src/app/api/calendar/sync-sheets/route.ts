import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db";
import { getReservationAuthUser, parseReservationDate } from "@/lib/reservations";
import {
  getReservationsForSheetsSync,
  hasGoogleSheetsWebhook,
  syncReservationsBatchToGoogleSheets,
} from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    getReservationAuthUser(req);

    if (!hasGoogleSheetsWebhook()) {
      return NextResponse.json(
        {
          success: false,
          error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured",
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const filter: any = {};

    if (body.hotel) {
      filter.hotel = String(body.hotel);
    }

    if (body.start || body.end) {
      filter.checkIn = {};

      if (body.end) {
        filter.checkIn.$lt = parseReservationDate(body.end);
      }

      if (body.start) {
        filter.checkOut = { $gt: parseReservationDate(body.start) };
      }
    }

    const reservations = await getReservationsForSheetsSync(filter);
    await syncReservationsBatchToGoogleSheets(reservations, "bulk_upsert");

    return NextResponse.json({
      success: true,
      data: {
        synced: reservations.length,
      },
    });
  } catch (error: any) {
    console.error("Calendar sync-sheets error:", error);

    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
