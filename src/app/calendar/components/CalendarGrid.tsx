import React from "react";
import { CalendarDay, CalendarGroup, ReservationBlock } from "../types";
import {
  DAY_COLUMN_WIDTH,
  ROOM_COLUMN_WIDTH,
  colorClasses,
  getReservationBlockStyle,
} from "../utils";

interface CalendarGridProps {
  days: CalendarDay[];
  groups: CalendarGroup[];
  dragTargetRoomId: string | null;
  dragTargetDayIndex: number | null;
  draggedReservationId: string | null;
  setDragTargetRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  setDragTargetDayIndex: React.Dispatch<React.SetStateAction<number | null>>;
  handleMoveReservation: (
    id: string,
    target: { roomId: string | null; dayIndex?: number; unassign?: boolean }
  ) => void;
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
  toggleReservationPreview: (id: string) => void;
  openEditReservationModal: (reservation: ReservationBlock) => void;
  previewReservationId: string | null;
  previewLayerRef: React.RefObject<HTMLDivElement>;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  groups,
  dragTargetRoomId,
  dragTargetDayIndex,
  draggedReservationId,
  setDragTargetRoomId,
  setDragTargetDayIndex,
  handleMoveReservation,
  handleDragStart,
  handleDragEnd,
  toggleReservationPreview,
  openEditReservationModal,
  previewReservationId,
  previewLayerRef,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div
        className="min-w-max"
        style={{ width: ROOM_COLUMN_WIDTH + days.length * DAY_COLUMN_WIDTH }}
      >
        <div
          className="sticky top-0 z-20 grid border-b border-stone-200 bg-stone-50"
          style={{
            gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)`,
          }}
        >
          <div className="border-r border-stone-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Habitación
          </div>
          {days.map((day) => (
            <div key={day.key} className="border-r border-stone-200 px-2 py-3 text-center">
              <div className="text-xs font-semibold text-stone-500">{day.weekDayShort}</div>
              <div className="text-2xl font-semibold text-stone-800">{day.dayNumber}</div>
              <div className="text-xs text-stone-500">{day.monthShort}</div>
            </div>
          ))}
        </div>

        {groups.map((group) => (
          <div key={group.roomType} className="border-b border-stone-200 last:border-b-0">
            <div className="border-b border-stone-200 bg-sky-50 px-4 py-3 text-xl font-heading text-slate-700">
              {group.roomType}
            </div>

            {group.rooms.map((room) => (
              <div
                key={room.roomId}
                className="grid border-b border-stone-100 last:border-b-0"
                style={{
                  gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)`,
                }}
              >
                <div className="border-r border-stone-200 bg-stone-50 px-4 py-4">
                  <div className="text-xl font-semibold text-stone-800">{room.roomNumber}</div>
                  <div className="text-xs uppercase tracking-wide text-stone-500">{room.hotel}</div>
                </div>

                <div
                  className="relative col-span-full"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragTargetRoomId(room.roomId);
                    const rowRect = event.currentTarget.getBoundingClientRect();
                    const offsetX = Math.max(0, event.clientX - rowRect.left);
                    const dayIndex = Math.max(
                      0,
                      Math.min(days.length - 1, Math.floor(offsetX / DAY_COLUMN_WIDTH))
                    );
                    setDragTargetDayIndex(dayIndex);
                  }}
                  onDragLeave={() => {
                    setDragTargetRoomId((current) => (current === room.roomId ? null : current));
                    setDragTargetDayIndex((current) =>
                      dragTargetRoomId === room.roomId ? null : current
                    );
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragTargetRoomId(null);
                    const rowRect = event.currentTarget.getBoundingClientRect();
                    const offsetX = Math.max(0, event.clientX - rowRect.left);
                    const dayIndex = Math.max(
                      0,
                      Math.min(days.length - 1, Math.floor(offsetX / DAY_COLUMN_WIDTH))
                    );
                    setDragTargetDayIndex(null);
                    if (draggedReservationId) {
                      handleMoveReservation(draggedReservationId, {
                        roomId: room.roomId,
                        dayIndex,
                      });
                    }
                  }}
                  style={{
                    gridColumn: `2 / span ${days.length}`,
                    minHeight: 72,
                    backgroundImage: `linear-gradient(to right, rgba(203,213,225,0.7) 1px, transparent 1px)`,
                    backgroundSize: `${DAY_COLUMN_WIDTH}px 100%`,
                  }}
                >
                  {dragTargetRoomId === room.roomId ? (
                    <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/70" />
                  ) : null}
                  {dragTargetRoomId === room.roomId && dragTargetDayIndex !== null ? (
                    <div
                      className="pointer-events-none absolute inset-y-2 w-[110px] rounded-md border border-emerald-500 bg-emerald-200/60"
                      style={{ left: dragTargetDayIndex * DAY_COLUMN_WIDTH + 2 }}
                    />
                  ) : null}
                  {room.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      draggable
                      onDragStart={() => handleDragStart(reservation.id)}
                      onDragEnd={handleDragEnd}
                      className={`absolute top-3 flex h-12 overflow-visible rounded-md border-l-4 text-sm font-semibold shadow-sm ${colorClasses(
                        reservation.colorKey
                      )}`}
                      style={getReservationBlockStyle(reservation)}
                      title={`${reservation.guestName} · ${reservation.checkIn.slice(
                        0,
                        10
                      )} → ${reservation.checkOut.slice(0, 10)}`}
                    >
                      <button
                        type="button"
                        draggable={false}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleReservationPreview(reservation.id);
                        }}
                        className="flex h-full w-5 flex-none items-center justify-center bg-black/10 text-white/95 transition hover:bg-black/20"
                        aria-label={`Ver detalles de ${reservation.guestName}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        draggable={false}
                        onClick={() => openEditReservationModal(reservation)}
                        className="min-w-0 flex-1 px-2.5 text-left"
                      >
                        <span className="block truncate">{reservation.guestName}</span>
                        <span className="block truncate text-[11px] font-medium text-white/85">
                          {reservation.source || reservation.status}
                        </span>
                      </button>

                      {previewReservationId === reservation.id ? (
                        <div
                          ref={previewLayerRef}
                          className="absolute left-0 top-[calc(100%+10px)] z-40 w-80 select-text rounded-2xl border border-stone-200 bg-white p-4 text-left text-stone-700 shadow-2xl"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                                Reserva
                              </p>
                              <h3 className="mt-1 text-lg font-heading text-slate-800">
                                {reservation.guestName}
                              </h3>
                            </div>
                            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                              {reservation.status.replaceAll("_", " ")}
                            </span>
                          </div>

                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Habitación
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.roomNumber || "Sin asignar"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Hotel
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.hotel || "Sin hotel"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Check-in
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.checkIn}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Check-out
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.checkOut}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Teléfono
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.phoneNumber || "Sin dato"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Correo
                              </p>
                              <p className="mt-1 truncate font-medium text-stone-700">
                                {reservation.email || "Sin dato"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Personas
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.guestCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                Valor
                              </p>
                              <p className="mt-1 font-medium text-stone-700">
                                {reservation.roomPrice
                                  ? `$${reservation.roomPrice.toLocaleString("es-CO")}`
                                  : "Sin valor"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                  IVA
                                </p>
                                <p className="mt-1 font-medium text-stone-700">
                                  {reservation.hasIva ? "Sí" : "No"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                  Forma de pago
                                </p>
                                <p className="mt-1 font-medium text-stone-700">
                                  {reservation.paymentMethod || "Sin especificar"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                              Ubicación de la reserva
                            </p>
                            <p className="mt-1 font-medium text-stone-700">
                              {reservation.source || "Sin especificar"}
                            </p>
                          </div>

                          <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                              Notas
                            </p>
                            <p className="mt-1 whitespace-pre-wrap font-medium text-stone-700">
                              {reservation.notes || "Sin notas"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
