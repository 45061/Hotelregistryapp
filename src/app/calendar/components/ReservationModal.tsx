import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import PublicModal from "@/components/PublicModal";
import {
  ReservationExtraDraft,
  ReservationFormState,
  ReservationPayment,
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
  reservationPayments: ReservationPayment[];
  onAddPayment: (payment: ReservationPayment) => void;
  onRemovePayment: (index: number) => void;
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
  reservationPayments,
  onAddPayment,
  onRemovePayment,
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentRoom, setPaymentRoom] = useState("000");
  const [paymentReason, setPaymentReason] = useState("Habitacion");
  const [paymentConcept, setPaymentConcept] = useState("");

  // Manejo de cajas
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Apertura de caja rápida si no hay ninguna abierta
  const [boxToOpenId, setBoxToOpenId] = useState("");
  const [openInitialBalance, setOpenInitialBalance] = useState("0");
  const [openingBox, setOpeningBox] = useState(false);

  const totalPayments = useMemo(() => {
    return (reservationPayments || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
  }, [reservationPayments]);

  const pendingDebt = Math.max(0, estimatedReservationGrandTotal - totalPayments);

  const currentRoomNumber = useMemo(() => {
    if (!reservationForm.roomId) return "000";
    const found = availableRooms.find((r) => r._id === reservationForm.roomId);
    return found ? found.roomNumber : "000";
  }, [availableRooms, reservationForm.roomId]);

  const openBoxes = useMemo(() => {
    return boxes.filter((b) => Boolean(b.activeBox));
  }, [boxes]);

  const closedBoxes = useMemo(() => {
    return boxes.filter((b) => !b.activeBox);
  }, [boxes]);

  const fetchBoxes = async () => {
    setLoadingBoxes(true);
    try {
      const res = await fetch("/api/boxes");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBoxes(json.data);
        const openList = json.data.filter((b: any) => Boolean(b.activeBox));
        if (openList.length === 1) {
          setSelectedBoxId(openList[0]._id);
        } else if (openList.length > 1) {
          setSelectedBoxId((prev) => (openList.some((b: any) => b._id === prev) ? prev : ""));
        } else {
          setSelectedBoxId("");
          const closed = json.data.filter((b: any) => !b.activeBox);
          if (closed.length > 0) {
            setBoxToOpenId(closed[0]._id);
            setOpenInitialBalance(String(closed[0].lastClosingBalance || 0));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching boxes:", err);
      toast.error("Error al consultar las cajas registradas.");
    } finally {
      setLoadingBoxes(false);
    }
  };

  const handleOpenPaymentModal = () => {
    const roomNum = currentRoomNumber;
    setPaymentAmount(pendingDebt > 0 ? String(pendingDebt) : "");
    setPaymentMethod(reservationForm.paymentMethod || "Efectivo");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes("");
    setPaymentRoom(roomNum);
    setPaymentReason("Habitacion");
    setPaymentConcept(
      `Pago reserva Hab. ${roomNum !== "000" ? roomNum : "Sin Asignar"} - ${
        reservationForm.guestName || "Huésped"
      }`
    );
    setIsPaymentModalOpen(true);
    fetchBoxes();
  };

  const handleOpenBoxSubmit = async () => {
    if (!boxToOpenId) {
      toast.error("Por favor selecciona una caja para abrir.");
      return;
    }
    setOpeningBox(true);
    try {
      const res = await fetch("/api/box/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boxId: boxToOpenId,
          initialBalance: parseFloat(openInitialBalance) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("¡Caja abierta con éxito!");
        const updatedRes = await fetch("/api/boxes");
        const updatedJson = await updatedRes.json();
        if (updatedJson.success && Array.isArray(updatedJson.data)) {
          setBoxes(updatedJson.data);
          setSelectedBoxId(boxToOpenId);
        }
      } else {
        toast.error(data.message || data.error || "Error al abrir la caja.");
      }
    } catch (err) {
      console.error("Error opening box:", err);
      toast.error("Error de red al abrir la caja.");
    } finally {
      setOpeningBox(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    if (openBoxes.length === 0) {
      toast.error("No hay ninguna caja abierta. Por favor abre una caja primero.");
      return;
    }

    if (!selectedBoxId) {
      toast.error("Por favor selecciona a cuál caja abierta debe ingresar el dinero.");
      return;
    }

    const targetBox = openBoxes.find((b) => b._id === selectedBoxId);
    if (!targetBox) {
      toast.error("La caja seleccionada no está disponible o no está abierta.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const now = new Date();
      const timeTransaction = `${paymentDate} ${now.toTimeString().split(" ")[0]}`;

      const boxPayload = {
        boxId: selectedBoxId,
        roomId: paymentRoom || currentRoomNumber || "000",
        concept: (
          paymentConcept.trim() ||
          `Pago reserva Hab. ${paymentRoom} - ${reservationForm.guestName || "Huésped"}`
        ).trim(),
        cash: amountNum,
        typePayment: paymentMethod || "Efectivo",
        reasonOfPay: paymentReason || "Habitacion",
        timeTransaction,
      };

      const res = await fetch("/api/box/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(boxPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || data.error || "Error al añadir el pago a la caja.");
        return;
      }

      const noteParts = [
        paymentConcept.trim(),
        paymentNotes.trim(),
        `Caja: ${targetBox.nameBox}`,
      ].filter(Boolean);

      onAddPayment({
        amount: amountNum,
        paymentMethod: paymentMethod || "Efectivo",
        date: paymentDate || new Date().toISOString().slice(0, 10),
        notes: noteParts.join(" | "),
      });

      toast.success(
        `Pago de $${amountNum.toLocaleString("es-CO")} guardado en "${targetBox.nameBox}" y registrado en la reserva.`
      );
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error("Error saving payment to box:", err);
      toast.error("Error al procesar el pago en caja.");
    } finally {
      setSubmittingPayment(false);
    }
  };

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

                {activeReservationSection === "PAGOS" ? (
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                          Pagos y Abonos
                        </h4>
                        <p className="mt-1 text-sm text-stone-500">
                          Registro de todos los pagos realizados para esta reserva.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenPaymentModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-verde-principal px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-verde-oscuro"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Registrar Pago
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Reserva</p>
                        <p className="mt-1 text-lg font-bold text-stone-800">
                          ${estimatedReservationGrandTotal.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Pagado</p>
                        <p className="mt-1 text-lg font-bold text-emerald-800">
                          ${totalPayments.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div
                        className={`rounded-xl border p-4 ${
                          pendingDebt > 0
                            ? "border-amber-200 bg-amber-50/60"
                            : "border-emerald-200 bg-emerald-50/60"
                        }`}
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            pendingDebt > 0 ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          {pendingDebt > 0 ? "Deuda Pendiente" : "Estado de Cuenta"}
                        </p>
                        <p
                          className={`mt-1 text-lg font-bold ${
                            pendingDebt > 0 ? "text-amber-900" : "text-emerald-900"
                          }`}
                        >
                          {pendingDebt > 0
                            ? `$${pendingDebt.toLocaleString("es-CO")}`
                            : "Totalmente Pagado"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      {reservationPayments && reservationPayments.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                          <table className="w-full text-left text-sm text-stone-600">
                            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
                              <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Método</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Notas / Ref</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {reservationPayments.map((payment, index) => (
                                <tr
                                  key={payment._id || `payment-${index}`}
                                  className="transition-colors hover:bg-stone-50/60"
                                >
                                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-stone-800">
                                    {payment.date ? String(payment.date).slice(0, 10) : "N/A"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3.5">
                                    <span className="inline-flex rounded-full bg-verde-principal/10 px-2.5 py-0.5 text-xs font-medium text-verde-principal">
                                      {payment.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-stone-900">
                                    ${Number(payment.amount || 0).toLocaleString("es-CO")}
                                  </td>
                                  <td className="max-w-xs truncate px-4 py-3.5 text-xs text-stone-500">
                                    {payment.notes || "-"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => onRemovePayment(index)}
                                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-verde-principal/10 text-verde-principal">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-stone-700">
                            No hay pagos registrados
                          </p>
                          <p className="mt-1 max-w-sm text-sm text-stone-500">
                            Aún no se ha registrado ningún abono para esta reserva. Puedes registrar abonos parciales o el pago total.
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenPaymentModal}
                            className="mt-4 rounded-xl bg-verde-principal px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-verde-oscuro"
                          >
                            Registrar primer pago
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {activeReservationSection === "HUÉSPEDES" ? (
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                      Información de Huéspedes
                    </h4>
                    <p className="mt-1 text-sm text-stone-500">
                      Datos de contacto y detalles de los huéspedes asociados.
                    </p>
                    <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 space-y-2">
                      <p>
                        <strong className="text-stone-900">Huésped principal:</strong>{" "}
                        {reservationForm.guestName || "No registrado"}
                      </p>
                      <p>
                        <strong className="text-stone-900">Teléfono:</strong>{" "}
                        {reservationForm.phoneNumber || "No registrado"}
                      </p>
                      <p>
                        <strong className="text-stone-900">Email:</strong>{" "}
                        {reservationForm.email || "No registrado"}
                      </p>
                      <p>
                        <strong className="text-stone-900">Cantidad de huéspedes:</strong>{" "}
                        {reservationForm.guestCount || 1}
                      </p>
                    </div>
                  </div>
                ) : null}

                {activeReservationSection === "NOTAS" ? (
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                      Notas y Observaciones
                    </h4>
                    <p className="mt-1 text-sm text-stone-500">
                      Escribe o edita anotaciones internas sobre esta reserva.
                    </p>
                    <div className="mt-4">
                      <textarea
                        name="notes"
                        value={reservationForm.notes}
                        onChange={handleReservationFormChange}
                        rows={6}
                        className="w-full rounded-xl border border-stone-300 bg-white p-4 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        placeholder="Observaciones de la estancia, requerimientos del huésped, check-in anticipado..."
                      />
                    </div>
                  </div>
                ) : null}

                {activeReservationSection === "SERVICIOS INCLUIDOS" ||
                activeReservationSection === "FACTURAS" ? (
                  <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-base font-semibold text-stone-700">
                      Sección {activeReservationSection}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Esta sección se encuentra en proceso de configuración para este hotel.
                    </p>
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
                      <label className="flex items-center gap-3 text-sm font-medium text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasIva"
                          checked={reservationForm.hasIva}
                          onChange={handleReservationFormChange}
                          className="h-4 w-4 rounded border-stone-300 text-verde-principal focus:ring-verde-principal/30"
                        />
                        Incluir impuestos / IVA en habitación
                      </label>
                    </div>

                    <div className="rounded-xl border border-verde-principal/10 bg-verde-principal/5 px-4 py-4">
                      <label className="flex items-center gap-3 text-sm font-medium text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasIvaExtras"
                          checked={Boolean(reservationForm.hasIvaExtras)}
                          onChange={handleReservationFormChange}
                          className="h-4 w-4 rounded border-stone-300 text-verde-principal focus:ring-verde-principal/30"
                        />
                        Extras llevan impuestos / IVA
                      </label>
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

                    <div className="flex items-center justify-between gap-4 border-t border-dashed border-stone-200 pt-3 text-sm font-semibold text-emerald-700">
                      <span>Total pagos realizados</span>
                      <span>${totalPayments.toLocaleString("es-CO")}</span>
                    </div>
                    <div
                      className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm font-bold ${
                        pendingDebt > 0
                          ? "border border-amber-200 bg-amber-50 text-amber-900"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      <span>Deuda pendiente</span>
                      <span>${pendingDebt.toLocaleString("es-CO")}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenPaymentModal}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-verde-principal px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-verde-oscuro focus:outline-none focus:ring-2 focus:ring-verde-principal/30"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Realizar Pago
                    </button>
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
                      {reservationPayments.length > 0
                        ? `Pago: ${Array.from(new Set(reservationPayments.map((p) => p.paymentMethod).filter(Boolean))).join(", ")}`
                        : "Sin pagos"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {reservationForm.hasIva ? "Hab: Con IVA" : "Hab: Sin IVA"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {reservationForm.hasIvaExtras ? "Extras: Con IVA" : "Extras: Sin IVA"}
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

      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-verde-principal/20 bg-white shadow-2xl animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-verde-principal bg-verde-principal px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Registrar Pago en Caja
                    </h3>
                    <p className="text-xs text-white/85">
                      Ingreso de dinero directo a la caja abierta
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-3 text-xs">
              <span className="max-w-[200px] truncate font-medium text-stone-600">
                {reservationForm.guestName || "Huésped"}
              </span>
              <span className="font-semibold text-stone-700">
                Deuda actual:{" "}
                <strong className="text-amber-700">
                  ${pendingDebt.toLocaleString("es-CO")}
                </strong>
              </span>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
              {/* Sección de Cajas */}
              {loadingBoxes ? (
                <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-500">
                  <svg className="mr-2 h-4 w-4 animate-spin text-verde-principal" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando estado de cajas...
                </div>
              ) : openBoxes.length === 0 ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-200 p-1.5 text-amber-800">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        No hay ninguna caja abierta
                      </h4>
                      <p className="mt-1 text-xs text-amber-700">
                        Para registrar este pago y guardarlo en el flujo de caja, es necesario que abras una caja primero.
                      </p>

                      {closedBoxes.length > 0 ? (
                        <div className="mt-3.5 space-y-3 rounded-xl border border-amber-200 bg-white p-3.5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-stone-700">
                            Abrir Caja Ahora
                          </p>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                              Selecciona la caja:
                            </label>
                            <select
                              value={boxToOpenId}
                              onChange={(e) => {
                                setBoxToOpenId(e.target.value);
                                const found = closedBoxes.find((b) => b._id === e.target.value);
                                if (found) {
                                  setOpenInitialBalance(String(found.lastClosingBalance || 0));
                                }
                              }}
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none"
                            >
                              <option value="">-- Selecciona una caja --</option>
                              {closedBoxes.map((b) => (
                                <option key={b._id} value={b._id}>
                                  {b.nameBox} {b.lastClosingBalance !== undefined ? `(Último cierre: $${b.lastClosingBalance.toLocaleString("es-CO")})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                              Saldo inicial ($):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={openInitialBalance}
                              onChange={(e) => setOpenInitialBalance(e.target.value)}
                              placeholder="0"
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleOpenBoxSubmit}
                            disabled={!boxToOpenId || openingBox}
                            className="w-full rounded-xl bg-verde-principal py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-verde-oscuro disabled:opacity-50"
                          >
                            {openingBox ? "Abriendo caja..." : "Abrir Caja y Continuar"}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-amber-800 font-medium">
                          No tienes cajas registradas en el sistema. Puedes crearlas en la sección de Caja.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : openBoxes.length > 1 ? (
                <div className="rounded-xl border border-verde-principal/30 bg-verde-principal/5 p-3.5">
                  <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-verde-principal">
                    <span>Caja Destino <span className="text-red-500">*</span></span>
                    <span className="rounded-full bg-verde-principal/15 px-2 py-0.5 text-[10px] text-verde-principal font-bold">
                      {openBoxes.length} cajas abiertas
                    </span>
                  </label>
                  <select
                    value={selectedBoxId}
                    onChange={(e) => setSelectedBoxId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  >
                    <option value="">-- Selecciona a cuál caja ingresar el dinero --</option>
                    {openBoxes.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.nameBox} {b.userIdOpenBox?.firstName ? `(Abierta por ${b.userIdOpenBox.firstName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-emerald-900">
                      Caja destino: <strong className="font-bold">{openBoxes[0]?.nameBox}</strong>
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Abierta
                  </span>
                </div>
              )}

              {/* Formulario de opciones de pago (similar a Añadir Dinero en Caja) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Dinero a Agregar ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-stone-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1000"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-8 pr-4 text-base font-bold text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  >
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Habitación del pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentRoom}
                    onChange={(e) => setPaymentRoom(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  >
                    <option value="000">000 - Oporto 83 / Sin habitación</option>
                    {availableRooms.map((r) => (
                      <option key={r._id} value={r.roomNumber}>
                        {r.roomNumber} ({r.hotel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Motivo del Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentReason}
                    onChange={(e) => setPaymentReason(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  >
                    <option value="Habitacion">Pago Habitación</option>
                    <option value="Consumibles">Pago Consumibles</option>
                    <option value="Inyeccion">Inyección Efectivo Caja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentConcept}
                  onChange={(e) => setPaymentConcept(e.target.value)}
                  placeholder="Ej: Pago reserva Juan Pérez"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Fecha del pago
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Notas / Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Nro de comprobante..."
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                  />
                </div>
              </div>

              {Number(paymentAmount) > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
                  <span>Nuevo saldo pendiente estimado:</span>
                  <span className="font-bold text-stone-900">
                    ${Math.max(0, pendingDebt - Number(paymentAmount)).toLocaleString("es-CO")}
                  </span>
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 transition hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={openBoxes.length === 0 || !selectedBoxId || submittingPayment}
                  className="flex-1 rounded-xl bg-verde-principal py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-verde-oscuro focus:outline-none focus:ring-2 focus:ring-verde-principal/30 disabled:opacity-50"
                >
                  {submittingPayment ? "Guardando en caja..." : "Confirmar Pago y Añadir a Caja"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PublicModal>
  );
};
