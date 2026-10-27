import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db";
import { getReservationAuthUser, parseReservationDate } from "@/lib/reservations";
import {
  getReservationsForSheetsSync,
  getSheetsAllowedDateRange,
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

    // Filtrar estrictamente: solo mes actual y los 2 meses siguientes (nada anterior)
    const { startDate, endDate } = getSheetsAllowedDateRange();
    filter.checkOut = { $gt: startDate };
    filter.checkIn = { $lt: endDate };

    const reservations = await getReservationsForSheetsSync(filter);
    const syncResult = await syncReservationsBatchToGoogleSheets(reservations, "bulk_upsert");

    return NextResponse.json({
      success: true,
      data: {
        synced: reservations.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        skipped: syncResult.skipped ?? false,
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
