import React from "react";

interface CalendarToolbarProps {
  hotel: string;
  setHotel: (hotel: string) => void;
  start: string;
  setStart: (date: string) => void;
  daysToShow: number;
  setDaysToShow: (days: number) => void;
  goToday: () => void;
  goPreviousRange: () => void;
  goNextRange: () => void;
  openNewReservationModal: () => void;
  handleSyncSheets: () => void;
  syncingSheets: boolean;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  hotel,
  setHotel,
  start,
  setStart,
  daysToShow,
  setDaysToShow,
  goToday,
  goPreviousRange,
  goNextRange,
  openNewReservationModal,
  handleSyncSheets,
  syncingSheets,
}) => {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-heading text-verde-principal">Calendario de reservas</h1>
          <p className="mt-1 text-sm text-stone-600">
            Vista inicial de planeación por habitación, agrupada por tipo y lista para crecer hacia sincronización con Google Sheets.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <button
            type="button"
            onClick={openNewReservationModal}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Nueva reserva
          </button>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Hotel
            </label>
            <select
              value={hotel}
              onChange={(event) => setHotel(event.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="Oporto 83">Oporto 83</option>
              <option value="Natural Sevgi">Natural Sevgi</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Inicio
            </label>
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Rango
            </label>
            <select
              value={daysToShow}
              onChange={(event) => setDaysToShow(Number(event.target.value))}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={21}>21 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>

          <button
            type="button"
            onClick={goToday}
            className="rounded-lg bg-verde-principal px-4 py-2 text-sm font-semibold text-white transition hover:bg-verde-oscuro"
          >
            Hoy
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPreviousRange}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={goNextRange}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Siguiente
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncSheets}
            disabled={syncingSheets}
            className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 disabled:cursor-not-allowed disabled:opacity-70 transition hover:bg-sky-100"
          >
            {syncingSheets ? "Sincronizando..." : "Sincronizar Sheets"}
          </button>
        </div>
      </div>
    </div>
  );
};
