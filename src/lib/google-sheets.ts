import Reservation from "@/lib/models/reservation.model";

type ReservationLike = {
  _id: string;
  guestName: string;
  phoneNumber?: string;
  email?: string;
  hasIva?: boolean;
  hasIvaExtras?: boolean;
  paymentMethod?: string;
  payments?: Array<{
    amount?: number;
    paymentMethod?: string;
    date?: Date | string;
    notes?: string;
    registeredBy?: string;
  }>;
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

function getPaymentMethodFromPayments(reservation: ReservationLike): string {
  if (Array.isArray(reservation.payments) && reservation.payments.length > 0) {
    const methods = Array.from(
      new Set(
        reservation.payments
          .map((p) => String(p?.paymentMethod || "").trim())
          .filter(Boolean)
      )
    );
    if (methods.length > 0) {
      return methods.join(", ");
    }
  }
  return reservation.paymentMethod || "";
}

function mapReservationPayload(reservation: ReservationLike) {
  return {
    reservationId: String(reservation._id),
    guestName: reservation.guestName,
    phoneNumber: reservation.phoneNumber || "",
    email: reservation.email || "",
    hasIva: reservation.hasIva ?? false,
    hasIvaExtras: reservation.hasIvaExtras ?? false,
    paymentMethod: getPaymentMethodFromPayments(reservation),
    guestCount: (reservation as any).guestCount ?? 1,
    roomPrice: (reservation as any).roomPrice ?? 0,
    ivaAmount: (reservation as any).ivaAmount ?? 0,
    roomPriceWithoutIva: (reservation as any).roomPriceWithoutIva ?? (reservation as any).roomPrice ?? 0,
    roomPriceWithIva: (reservation as any).roomPriceWithIva ?? (reservation as any).roomPrice ?? 0,
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

const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzZX7r6seA3zHaoIwTOF_3yo38v2-HDgpTh-RyfmrR3q8RXOjcv3IbNvvDnj_9KcTghHQ/exec";

export function getGoogleSheetsWebhookUrl(): string {
  return (process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL).trim();
}

export function hasGoogleSheetsWebhook(): boolean {
  return Boolean(getGoogleSheetsWebhookUrl());
}

/**
 * Obtiene el rango de fechas permitido para sincronización con Google Sheets:
 * - Mes actual (desde el día 1 a las 00:00:00)
 * - Dos meses siguientes (hasta el final del mes + 2)
 * - Nada anterior al inicio del mes actual
 */
export function getSheetsAllowedDateRange(referenceDate: Date = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 3, 1, 0, 0, 0, 0);
  return { startDate, endDate };
}

export function isReservationEligibleForSheets(
  reservation: { checkIn: Date | string; checkOut?: Date | string },
  referenceDate: Date = new Date()
): boolean {
  const { startDate, endDate } = getSheetsAllowedDateRange(referenceDate);
  const checkIn = reservation.checkIn instanceof Date ? reservation.checkIn : new Date(reservation.checkIn);
  if (Number.isNaN(checkIn.getTime())) return false;

  if (reservation.checkOut) {
    const checkOut = reservation.checkOut instanceof Date ? reservation.checkOut : new Date(reservation.checkOut);
    if (!Number.isNaN(checkOut.getTime())) {
      return checkOut > startDate && checkIn < endDate;
    }
  }

  return checkIn >= startDate && checkIn < endDate;
}

export function isReservationInSheetsWindow(
  reservation: { checkIn: Date | string; checkOut: Date | string },
  referenceDate: Date = new Date()
): boolean {
  const { startDate, endDate } = getSheetsAllowedDateRange(referenceDate);
  const checkIn = reservation.checkIn instanceof Date ? reservation.checkIn : new Date(reservation.checkIn);
  const checkOut = reservation.checkOut instanceof Date ? reservation.checkOut : new Date(reservation.checkOut);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return false;
  }

  return checkOut > startDate && checkIn < endDate;
}

export async function syncReservationToGoogleSheets(
  reservation: ReservationLike,
  action: SyncAction = "upsert"
) {
  const webhookUrl = getGoogleSheetsWebhookUrl();

  if (!webhookUrl) {
    return { skipped: true, reason: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" };
  }

  if (action === "upsert" && !isReservationEligibleForSheets(reservation)) {
    return {
      skipped: true,
      reason: "Reservation is beyond the 2 months following the current month",
    };
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
  const webhookUrl = getGoogleSheetsWebhookUrl();

  if (!webhookUrl) {
    return { skipped: true, reason: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" };
  }

  const filteredReservations = reservations.filter((r) => isReservationEligibleForSheets(r));

  if (filteredReservations.length === 0) {
    return {
      skipped: true,
      reason: "No reservations fall into the eligible window",
    };
  }

  const payload = {
    action,
    sentAt: new Date().toISOString(),
    reservations: filteredReservations.map(mapReservationPayload),
  };

  await postWithRetry(webhookUrl, payload);
  return { skipped: false, count: filteredReservations.length };
}

export async function getReservationsForSheetsSync(filter: Record<string, unknown> = {}) {
  return (Reservation as any).find(filter).sort({ checkIn: 1, roomNumberSnapshot: 1 }).lean();
}
