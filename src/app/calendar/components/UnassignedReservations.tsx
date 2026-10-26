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
            className={`rounded-lg border px-3 py-2 text-sm shadow-sm transition ${colorClasses(
              reservation.colorKey
            )}`}
          >
            {reservation.guestName} · {reservation.checkIn.slice(0, 10)}
          </button>
        ))}
      </div>
    </div>
  );
};
