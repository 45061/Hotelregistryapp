import React from "react";
import { statusLegend } from "../utils";

export const CalendarLegend: React.FC = () => {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-heading text-slate-800">Leyenda del calendario</h2>
          <p className="text-sm text-stone-600">
            Los colores identifican el estado operativo de cada reserva y ayudan a detectar rápido qué está ocupando cada habitación.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {statusLegend.map((item) => (
            <div
              key={item.key}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
            >
              <span className={`h-3 w-3 rounded-full border ${item.dotClass}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
