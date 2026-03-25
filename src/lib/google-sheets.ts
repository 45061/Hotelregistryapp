import Reservation from "@/lib/models/reservation.model";

type ReservationLike = {
  _id: string;
  guestName: string;
  phoneNumber?: string;
  email?: string;
  travelerId?: string | null;
  roomId?: string | null;
  roomNumberSnapshot?: string;
  hotel: string;
  roomTypeSnapshot: string;
  checkIn: Date | string;
  checkOut: Date | string;
  status: string;
  source?: string;
  notes?: string;
  sheetRowId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SyncAction = "upsert" | "delete" | "bulk_upsert";

function toIsoString(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(url: string, payload: unknown) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Sheets webhook responded with ${response.status}: ${message}`);
      }

      return;
    } catch (error: any) {
      lastError = error;

      if (attempt < 3) {
        await delay(attempt * 800);
      }
    }
  }

  throw lastError || new Error("Unknown Google Sheets sync error");
}

function mapReservationPayload(reservation: ReservationLike) {
  return {
    reservationId: String(reservation._id),
    guestName: reservation.guestName,
    phoneNumber: reservation.phoneNumber || "",
    email: reservation.email || "",
    guestCount: (reservation as any).guestCount ?? 1,
    roomPrice: (reservation as any).roomPrice ?? 0,
    travelerId: reservation.travelerId ? String(reservation.travelerId) : null,
    roomId: reservation.roomId ? String(reservation.roomId) : null,
    roomNumber: reservation.roomNumberSnapshot || null,
    hotel: reservation.hotel,
    roomType: reservation.roomTypeSnapshot,
    checkIn: toIsoString(reservation.checkIn),
    checkOut: toIsoString(reservation.checkOut),
    status: reservation.status,
    source: reservation.source || "",
    notes: reservation.notes || "",
    sheetRowId: reservation.sheetRowId || "",
    createdAt: toIsoString(reservation.createdAt),
    updatedAt: toIsoString(reservation.updatedAt),
  };
}

export function hasGoogleSheetsWebhook() {
  return Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
}

export async function syncReservationToGoogleSheets(
  reservation: ReservationLike,
  action: SyncAction = "upsert"
) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return { skipped: true, reason: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" };
  }

  const payload = {
    action,
    sentAt: new Date().toISOString(),
    reservation: mapReservationPayload(reservation),
  };

  await postWithRetry(webhookUrl, payload);
  return { skipped: false };
}

export async function syncReservationsBatchToGoogleSheets(
  reservations: ReservationLike[],
  action: SyncAction = "bulk_upsert"
) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return { skipped: true, reason: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" };
  }

  const payload = {
    action,
    sentAt: new Date().toISOString(),
    reservations: reservations.map(mapReservationPayload),
  };

  await postWithRetry(webhookUrl, payload);
  return { skipped: false };
}

export async function getReservationsForSheetsSync(filter: Record<string, unknown> = {}) {
  return (Reservation as any).find(filter).sort({ checkIn: 1, roomNumberSnapshot: 1 }).lean();
}
