import {
  addDays,
  createLocalDateFromDayString,
  formatReservationDateInput,
} from "@/lib/reservation-dates";
import {
  ReservationBlock,
  ReservationFormState,
  ReservationExtraDraft,
  ReservationExtraPayload,
} from "./types";

export const DAY_COLUMN_WIDTH = 110;
export const ROOM_COLUMN_WIDTH = 170;

export function formatInputDate(date: Date) {
  return formatReservationDateInput(date);
}

export function colorClasses(colorKey: string) {
  switch (colorKey) {
    case "confirmed":
      return "bg-emerald-500 text-white border-emerald-700";
    case "checked_in":
      return "bg-red-500 text-white border-red-700";
    case "checked_out":
      return "bg-sky-300 text-sky-950 border-sky-500";
    case "noshow":
      return "bg-violet-300 text-violet-950 border-violet-500";
    case "cancelled":
      return "bg-slate-400 text-white border-slate-600 opacity-80";
    case "unassigned":
      return "bg-amber-500 text-white border-amber-700";
    default:
      return "bg-emerald-500 text-white border-emerald-700";
  }
}

export function getStatusColorKey(status: string) {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "checked_in":
      return "checked_in";
    case "checked_out":
      return "checked_out";
    case "noshow":
      return "noshow";
    case "cancelled":
      return "cancelled";
    case "unassigned":
      return "unassigned";
    default:
      return "confirmed";
  }
}

export function getReservationBlockStyle(reservation: ReservationBlock) {
  const blockInset = 4;
  const left =
    reservation.startOffsetDays * DAY_COLUMN_WIDTH +
    (reservation.isClippedStart ? blockInset : DAY_COLUMN_WIDTH / 2 + blockInset);

  const width =
    reservation.spanDays * DAY_COLUMN_WIDTH +
    (reservation.isClippedStart ? DAY_COLUMN_WIDTH / 2 : 0) +
    (reservation.isClippedEnd ? DAY_COLUMN_WIDTH / 2 : 0) -
    blockInset * 2;

  return {
    left,
    width: Math.max(32, width),
  };
}

export const statusLegend = [
  {
    key: "confirmed",
    label: "Confirmada",
    dotClass: "bg-emerald-500 border-emerald-700",
  },
  {
    key: "checked_in",
    label: "Check-in",
    dotClass: "bg-red-500 border-red-700",
  },
  {
    key: "checked_out",
    label: "Check-out",
    dotClass: "bg-sky-300 border-sky-500",
  },
  {
    key: "noshow",
    label: "No presentado",
    dotClass: "bg-violet-300 border-violet-500",
  },
  {
    key: "unassigned",
    label: "No asignada",
    dotClass: "bg-amber-500 border-amber-700",
  },
  {
    key: "cancelled",
    label: "Cancelada",
    dotClass: "bg-slate-400 border-slate-600",
  },
];

export const reservationSourceOptions = [
  "Directo",
  "Booking",
  "Expedia",
  "Airbnb",
  "Despegar",
  "BestTravel",
  "Otro",
];

export const paymentMethodOptions = [
  "Efectivo",
  "Datafono",
  "Transferencia Nequi",
  "Transferencia Banco",
  "Airbnb",
  "Ota Colect",
  "Debe",
];

export const reservationModalSections = [
  "DETALLES",
  "HUÉSPEDES",
  "SERVICIOS INCLUIDOS",
  "ELEMENTOS EXTRAS",
  "PAGOS",
  "NOTAS",
  "FACTURAS",
];

export function createInitialReservationForm(startDate: string, hotelFilter: string): ReservationFormState {
  return {
    guestName: "",
    phoneNumber: "",
    email: "",
    hasIva: false,
    paymentMethod: "",
    guestCount: "1",
    roomPrice: "",
    roomId: "",
    hotel: hotelFilter || "Natural Sevgi",
    checkIn: startDate,
    checkOut: formatInputDate(addDays(createLocalDateFromDayString(startDate), 1)),
    status: "confirmed",
    source: "",
    notes: "",
  };
}

export function createEmptyReservationExtra(index: number): ReservationExtraDraft {
  return {
    id: `${Date.now()}-${index}`,
    name: "",
    unitValue: "0",
    quantity: "1",
  };
}

export function mapExtrasToDrafts(extras: unknown): ReservationExtraDraft[] {
  if (!Array.isArray(extras)) {
    return [];
  }

  return extras.map((extra, index) => {
    const item = extra as Record<string, unknown>;
    return {
      id: String(item.id || item._id || `${Date.now()}-${index}`),
      name: String(item.name || ""),
      unitValue: String(item.unitValue ?? 0),
      quantity: String(item.quantity ?? 1),
    };
  });
}

export function serializeReservationExtras(extras: ReservationExtraDraft[]): ReservationExtraPayload[] {
  return extras
    .map((extra) => {
      const name = extra.name.trim();
      const unitValue = Math.max(0, Number(extra.unitValue || 0));
      const quantity = Math.max(0, Number(extra.quantity || 0));

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
    .filter(Boolean) as ReservationExtraPayload[];
}
