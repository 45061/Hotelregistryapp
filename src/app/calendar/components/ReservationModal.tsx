import React from "react";
import PublicModal from "@/components/PublicModal";
import {
  ReservationExtraDraft,
  ReservationFormState,
  RoomOption,
} from "../types";
import {
  paymentMethodOptions,
  reservationModalSections,
  reservationSourceOptions,
} from "../utils";

interface ReservationModalProps {
  opened: boolean;
  onClose: () => void;
  editingReservationId: string | null;
  isLegacyReservationDraft: boolean;
  reservationForm: ReservationFormState;
  setReservationForm: React.Dispatch<React.SetStateAction<ReservationFormState>>;
  activeReservationSection: string;
  setActiveReservationSection: (section: string) => void;
  handleReservationFormChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  availableRooms: RoomOption[];
  filledReservationExtras: ReservationExtraDraft[];
  reservationExtraDrafts: ReservationExtraDraft[];
  handleAddReservationExtra: () => void;
  handleRemoveReservationExtra: (id: string) => void;
  handleRemoveSavedReservationExtra: (id: string) => void;
  handleReservationExtraChange: (
    id: string,
    field: "name" | "unitValue" | "quantity",
    value: string
  ) => void;
  pricingPreview: {
    roomPriceWithoutIva: number;
    roomPriceWithIva: number;
    ivaAmount: number;
  };
  estimatedTaxValue: number;
  savedExtrasTotal: number;
  estimatedReservationGrandTotal: number;
  estimatedTotalValue: number;
  handleReservationSubmit: (event: React.FormEvent) => void;
  handleDeleteReservation: () => void;
  savingReservation: boolean;
  deletingReservation: boolean;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  opened,
  onClose,
  editingReservationId,
  isLegacyReservationDraft,
  reservationForm,
  setReservationForm,
  activeReservationSection,
  setActiveReservationSection,
  handleReservationFormChange,
  availableRooms,
  filledReservationExtras,
  reservationExtraDrafts,
  handleAddReservationExtra,
  handleRemoveReservationExtra,
  handleRemoveSavedReservationExtra,
  handleReservationExtraChange,
  pricingPreview,
  estimatedTaxValue,
  savedExtrasTotal,
  estimatedReservationGrandTotal,
  estimatedTotalValue,
  handleReservationSubmit,
  handleDeleteReservation,
  savingReservation,
  deletingReservation,
}) => {
  return (
    <PublicModal
      opened={opened}
      onClose={onClose}
      size="94rem"
      title={
        editingReservationId
          ? "Editar reserva"
          : isLegacyReservationDraft
            ? "Convertir bloque heredado en reserva"
            : "Nueva reserva"
      }
    >
      <form onSubmit={handleReservationSubmit} className="space-y-4">
        <div className="overflow-hidden rounded-[26px] border border-verde-principal/20 bg-white shadow-[0_26px_80px_-35px_rgba(21,128,61,0.28)]">
          <div className="border-b border-verde-principal bg-verde-principal px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                  Nueva reserva
                </p>
                <h3 className="mt-1 text-xl font-heading text-white">
                  {editingReservationId
                    ? "Editar reserva"
                    : isLegacyReservationDraft
                      ? "Convertir bloque heredado en reserva"
                      : "Nueva reserva"}
                </h3>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                {reservationForm.checkIn} → {reservationForm.checkOut}
              </div>
            </div>
          </div>

          <div className="border-b border-verde-principal/15 bg-verde-claro/20 px-4 py-0">
            <div className="flex flex-wrap gap-1 overflow-x-auto text-[11px] font-semibold uppercase tracking-wide text-verde-principal">
              {reservationModalSections.map((section) => (
                <div
                  key={section}
                  onClick={() => setActiveReservationSection(section)}
                  className={`rounded-t-xl px-4 py-3 ${
                    activeReservationSection === section
                      ? "bg-white text-verde-principal shadow-sm"
                      : "text-verde-principal/75"
                  } cursor-pointer transition-colors hover:text-verde-principal`}
                >
                  {section}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-50 p-6">
            <div className="mb-5 rounded-2xl border border-verde-principal/15 bg-verde-principal/10 px-4 py-3 text-sm font-medium text-verde-principal">
              Reserva creada correctamente.
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_380px]">
              <div className="space-y-5">
                {activeReservationSection === "DETALLES" ? (
                  <>
                    <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">
                            Entrada
                          </label>
                          <input
                            type="date"
                            name="checkIn"
                            value={reservationForm.checkIn}
                            onChange={handleReservationFormChange}
                            required
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">
                            Salida
                          </label>
                          <input
                            type="date"
                            name="checkOut"
                            value={reservationForm.checkOut}
                            onChange={handleReservationFormChange}
                            required
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">
                            Hotel
                          </label>
                          <select
                            name="hotel"
                            value={reservationForm.hotel}
                            onChange={(event) => {
                              handleReservationFormChange(event);
                              setReservationForm((current) => ({ ...current, roomId: "" }));
                            }}
                            required
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          >
                            <option value="Natural Sevgi">Natural Sevgi</option>
                            <option value="Oporto 83">Oporto 83</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">
                            Estado
                          </label>
                          <select
                            name="status"
                            value={reservationForm.status}
                            onChange={handleReservationFormChange}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          >
                            <option value="confirmed">Confirmada</option>
                            <option value="checked_in">Check-in</option>
                            <option value="checked_out">Check-out</option>
                            <option value="noshow">No presentado</option>
                            <option value="cancelled">Cancelada</option>
                            <option value="unassigned">No asignada</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                          Contacto principal
                        </h4>
                        <span className="text-xs font-medium text-slate-400">
                          Datos del huésped
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Nombre
                          </label>
                          <input
                            name="guestName"
                            value={reservationForm.guestName}
                            onChange={handleReservationFormChange}
                            required
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Número de teléfono
                          </label>
                          <input
                            name="phoneNumber"
                            value={reservationForm.phoneNumber}
                            onChange={handleReservationFormChange}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                            placeholder="3001234567"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Correo electrónico
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={reservationForm.email}
                            onChange={handleReservationFormChange}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                            placeholder="huesped@correo.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                          Detalles de la estancia
                        </h4>
                        <span className="text-xs font-medium text-slate-400">
                          Asignación y operación
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Habitación
                          </label>
                          <select
                            name="roomId"
                            value={reservationForm.roomId}
                            onChange={handleReservationFormChange}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          >
                            <option value="">Sin asignar</option>
                            {availableRooms.map((room) => (
                              <option key={room._id} value={room._id}>
                                {room.roomNumber} · {room.roomType}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Adultos / personas
                          </label>
                          <input
                            type="number"
                            min="1"
                            name="guestCount"
                            value={reservationForm.guestCount}
                            onChange={handleReservationFormChange}
                            required
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          />
                        </div>

                        <div className="xl:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Ubicación de la reserva
                          </label>
                          <select
                            name="source"
                            value={reservationForm.source}
                            onChange={handleReservationFormChange}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          >
                            <option value="">Select an option</option>
                            {reservationSourceOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2 xl:col-span-4">
                          <label className="mb-2 block text-sm font-medium text-stone-700">
                            Notas
                          </label>
                          <textarea
                            name="notes"
                            value={reservationForm.notes}
                            onChange={handleReservationFormChange}
                            rows={4}
                            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                            placeholder="Agrega observaciones de la reserva, llegada o condiciones especiales..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {activeReservationSection === "ELEMENTOS EXTRAS" ? (
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                          Elementos extras
                        </h4>
                        <p className="mt-2 text-sm text-stone-500">
                          Aquí puedes registrar y volver a ver los extras asociados a esta reserva.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddReservationExtra}
                        className="text-sm font-semibold text-[#ef7d57] transition hover:text-[#d9623c]"
                      >
                        + Añadir nuevo
                      </button>
                    </div>

                    {filledReservationExtras.length > 0 ? (
                      <div className="mt-5 rounded-2xl border border-verde-principal/10 bg-verde-claro/10 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                            Extras guardados
                          </h5>
                          <span className="text-xs font-medium text-stone-500">
                            {filledReservationExtras.length}{" "}
                            {filledReservationExtras.length === 1 ? "extra" : "extras"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {filledReservationExtras.map((extra) => {
                            const unitValue = Number(extra.unitValue || 0);
                            const quantity = Number(extra.quantity || 0);
                            const totalValue = unitValue * quantity;

                            return (
                              <div
                                key={`summary-${extra.id}`}
                                className="grid gap-2 rounded-xl border border-white/70 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm md:grid-cols-[minmax(0,1.6fr)_110px_110px_130px_52px]"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Extra
                                  </p>
                                  <p className="truncate font-medium text-stone-700">
                                    {extra.name}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Valor
                                  </p>
                                  <p className="font-medium text-stone-700">
                                    ${unitValue.toLocaleString("es-CO")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Cantidad
                                  </p>
                                  <p className="font-medium text-stone-700">{quantity}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Total
                                  </p>
                                  <p className="font-semibold text-verde-principal">
                                    ${totalValue.toLocaleString("es-CO")}
                                  </p>
                                </div>
                                <div className="flex items-start justify-end pt-5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSavedReservationExtra(extra.id)}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                                  >
                                    Borrar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 min-h-[120px] rounded-2xl border border-dashed border-stone-200 bg-white p-4">
                      <div className="space-y-4">
                        {reservationExtraDrafts.map((extra) => {
                          const unitValue = Number(extra.unitValue || 0);
                          const quantity = Number(extra.quantity || 0);
                          const totalValue = unitValue * quantity;

                          return (
                            <div
                              key={extra.id}
                              className="rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm"
                            >
                              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_170px_130px_110px] xl:items-end">
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReservationExtra(extra.id)}
                                    className="mb-1 text-lg font-bold leading-none text-rose-200 transition hover:text-rose-400"
                                    aria-label="Eliminar extra"
                                  >
                                    ×
                                  </button>
                                  <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                    Extra
                                  </label>
                                  <input
                                    type="text"
                                    value={extra.name}
                                    onChange={(event) =>
                                      handleReservationExtraChange(
                                        extra.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                                    placeholder="Escribe el nombre del extra"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                    Total de elementos
                                  </label>
                                  <div className="flex overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
                                    <input
                                      type="number"
                                      min="0"
                                      value={extra.unitValue}
                                      onChange={(event) =>
                                        handleReservationExtraChange(
                                          extra.id,
                                          "unitValue",
                                          event.target.value
                                        )
                                      }
                                      className="w-full border-0 px-3 py-2 text-right text-sm text-stone-700 focus:outline-none focus:ring-0"
                                    />
                                    <div className="flex items-center border-l border-stone-300 px-3 text-base text-stone-500">
                                      $
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                    Cantidad
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={extra.quantity}
                                    onChange={(event) =>
                                      handleReservationExtraChange(
                                        extra.id,
                                        "quantity",
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-right text-sm font-semibold uppercase tracking-wide text-stone-500">
                                    Total
                                  </label>
                                  <div className="pt-2 text-right text-lg font-semibold leading-none text-stone-700">
                                    ${totalValue.toLocaleString("es-CO")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {reservationExtraDrafts.length === 0 ? (
                          <div className="flex min-h-[80px] items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,0.95))] p-8">
                            <div className="max-w-md text-center">
                              <p className="text-base font-heading text-verde-principal">
                                No hay extras en edición
                              </p>
                              <p className="mt-2 text-sm leading-6 text-stone-500">
                                Usa{" "}
                                <span className="font-semibold text-[#ef7d57]">
                                  + Añadir nuevo
                                </span>{" "}
                                para abrir un nuevo input de extra.
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                        Resumen de su reserva
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Panel visual de valores</p>
                    </div>
                    <div className="rounded-full bg-verde-principal/10 px-3 py-1 text-xs font-semibold text-verde-principal">
                      Vista previa
                    </div>
                  </div>

                  <div className="space-y-3 border-b border-slate-100 pb-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        Tarifa de habitación
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        name="roomPrice"
                        value={reservationForm.roomPrice}
                        onChange={handleReservationFormChange}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        placeholder="0"
                      />
                    </div>

                    <div className="rounded-xl border border-verde-principal/10 bg-verde-principal/5 px-4 py-4">
                      <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                        <input
                          type="checkbox"
                          name="hasIva"
                          checked={reservationForm.hasIva}
                          onChange={handleReservationFormChange}
                          className="h-4 w-4 rounded border-stone-300 text-verde-principal focus:ring-verde-principal/30"
                        />
                        Incluir impuestos / IVA
                      </label>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        Forma de pago
                      </label>
                      <select
                        name="paymentMethod"
                        value={reservationForm.paymentMethod}
                        onChange={handleReservationFormChange}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                      >
                        <option value="">Selecciona una opción</option>
                        {paymentMethodOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-stone-700">
                    <div className="flex items-center justify-between gap-4">
                      <span>Precio sin IVA</span>
                      <span className="font-semibold">
                        ${pricingPreview.roomPriceWithoutIva.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Total de impuestos</span>
                      <span className="font-semibold">
                        ${estimatedTaxValue.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Total extras</span>
                      <span className="font-semibold">
                        ${savedExtrasTotal.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3 text-base font-semibold text-stone-900">
                      <span>Total reserva</span>
                      <span>${estimatedReservationGrandTotal.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-wide text-stone-500">
                      <span>Base con IVA</span>
                      <span>${estimatedTotalValue.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                    Estado actual
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {reservationForm.status === "confirmed"
                        ? "Confirmada"
                        : reservationForm.status.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {reservationForm.paymentMethod || "Sin forma de pago"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {reservationForm.hasIva ? "Con IVA" : "Sin IVA"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            {editingReservationId ? (
              <button
                type="button"
                onClick={handleDeleteReservation}
                disabled={deletingReservation || savingReservation}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70 transition hover:bg-red-100"
              >
                {deletingReservation ? "Eliminando..." : "Eliminar reserva"}
              </button>
            ) : (
              <span />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingReservation || deletingReservation}
              className="rounded-xl bg-verde-principal px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70 transition hover:bg-verde-oscuro"
            >
              {savingReservation
                ? "Guardando..."
                : editingReservationId
                  ? "Guardar cambios"
                  : isLegacyReservationDraft
                    ? "Convertir en reserva"
                    : "Crear reserva"}
            </button>
          </div>
        </div>
      </form>
    </PublicModal>
  );
};
