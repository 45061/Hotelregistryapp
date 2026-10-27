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

          <div
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm"
            title="Indica que la reserva tiene saldo pendiente por pagar"
          >
            <span className="flex items-center justify-center rounded-full bg-rose-600 p-1 text-white">
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
            </span>
            <span>Con deuda pendiente</span>
          </div>
        </div>
      </div>
    </div>
  );
};
