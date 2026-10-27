import React from "react";
import { ReservationBlock } from "../types";
import { colorClasses } from "../utils";

interface UnassignedReservationsProps {
  unassigned: ReservationBlock[];
  isUnassignedDropActive: boolean;
  setIsUnassignedDropActive: (active: boolean) => void;
  draggedReservationId: string | null;
  handleMoveReservation: (
    id: string,
    target: { roomId: string | null; dayIndex?: number; unassign?: boolean }
  ) => void;
  openEditReservationModal: (reservation: ReservationBlock) => void;
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
}

export const UnassignedReservations: React.FC<UnassignedReservationsProps> = ({
  unassigned,
  isUnassignedDropActive,
  setIsUnassignedDropActive,
  draggedReservationId,
  handleMoveReservation,
  openEditReservationModal,
  handleDragStart,
  handleDragEnd,
}) => {
  if (unassigned.length === 0) {
    return null;
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsUnassignedDropActive(true);
      }}
      onDragLeave={() => setIsUnassignedDropActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsUnassignedDropActive(false);
        if (draggedReservationId) {
          handleMoveReservation(draggedReservationId, { roomId: null, unassign: true });
        }
      }}
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isUnassignedDropActive
          ? "border-amber-400 bg-amber-100"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <h2 className="text-lg font-heading text-amber-800">Reservas no asignadas</h2>
      <p className="mt-1 text-sm text-amber-700">
        Arrastra aquí una reserva para quitarle la habitación actual.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {unassigned.map((reservation) => (
          <button
            type="button"
            key={reservation.id}
            onClick={() => openEditReservationModal(reservation)}
            draggable
            onDragStart={() => handleDragStart(reservation.id)}
            onDragEnd={handleDragEnd}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm shadow-sm transition ${colorClasses(
              reservation.colorKey
            )}`}
            title={`${reservation.guestName} · ${reservation.checkIn.slice(0, 10)}${
              reservation.hasPendingDebt
                ? ` · 🚩 Deuda pendiente: $${reservation.pendingDebt?.toLocaleString("es-CO")}`
                : ""
            }`}
          >
            <span>
              {reservation.guestName} · {reservation.checkIn.slice(0, 10)}
            </span>
            {reservation.hasPendingDebt ? (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white"
                title={`Deuda pendiente: $${reservation.pendingDebt?.toLocaleString("es-CO")}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-2.5 w-2.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.5V14a.75.75 0 0 1-.75.75H4.5v6.5a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                Deuda
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};
