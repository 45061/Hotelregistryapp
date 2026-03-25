import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import Reservation from "@/lib/models/reservation.model";
import {
  addDays,
  createLocalDateFromDayString,
  DAY_IN_MS,
  formatDayKey,
  formatReservationDateInput,
  getDayDiff,
  getDayOffset,
  overlapsRange,
  parseReservationDate,
  startOfDay,
} from "@/lib/reservation-dates";

export type CalendarAuthUser = {
  id: string;
  authorized?: boolean;
  isAdmin?: boolean;
  isSuperUser?: boolean;
  isWaitress?: boolean;
};

export function getStatusColorKey(status: string) {
  switch (status) {
    case "checked_in":
      return "occupied";
    case "checked_out":
      return "checkout";
    case "cancelled":
      return "cancelled";
    case "unassigned":
      return "unassigned";
    default:
      return "confirmed";
  }
}

export {
  addDays,
  createLocalDateFromDayString,
  DAY_IN_MS,
  formatDayKey,
  formatReservationDateInput,
  getDayDiff,
  getDayOffset,
  overlapsRange,
  parseReservationDate,
  startOfDay,
};

export function getReservationAuthUser(req: NextRequest): CalendarAuthUser {
  const tokenCookie = req.cookies.get("token");

  if (!tokenCookie) {
    throw new Error("Unauthorized: No token provided");
  }

  const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!) as CalendarAuthUser;

  if (!decoded?.id || (!decoded.authorized && !decoded.isWaitress)) {
    throw new Error("Unauthorized: Invalid token");
  }

  return decoded;
}

export async function findReservationConflict({
  roomId,
  checkIn,
  checkOut,
  excludeReservationId,
}: {
  roomId?: string | null;
  checkIn: Date;
  checkOut: Date;
  excludeReservationId?: string;
}) {
  if (!roomId) {
    return null;
  }

  const query: any = {
    roomId,
    status: { $nin: ["cancelled"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  return (Reservation as any).findOne(query).lean();
}
