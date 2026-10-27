import React from "react";
import FormField from "@/components/FormField";

interface TravelerRegistrationFormProps {
  form: Omit<TravelerRecord, "date" | "arrivalTime">;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleClear: () => void;
  editingId: string | null;
  roomNumbers: string[];
  idTypes: string[];
  paymentMethods: string[];
  reservationLocations: string[];
  fieldLabels: Record<string, string>;
}

export const TravelerRegistrationForm: React.FC<TravelerRegistrationFormProps> = ({
  form,
  handleChange,
  handleSubmit,
  handleClear,
  editingId,
  roomNumbers,
  idTypes,
  paymentMethods,
  reservationLocations,
  fieldLabels,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Registro de Viajero
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <FormField
          label={fieldLabels.roomNumber}
          name="roomNumber"
          value={form.roomNumber}
          onChange={handleChange}
          type="select"
          options={roomNumbers}
          required
        />
        <FormField
          label={fieldLabels.name}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <FormField
          label={fieldLabels.nationality}
          name="nationality"
          value={form.nationality}
          onChange={handleChange}
          required
        />

        <FormField
          label={fieldLabels.origin}
          name="origin"
          value={form.origin}
          onChange={handleChange}
          required
        />
        <FormField
          label={fieldLabels.reservedNights}
          name="reservedNights"
          value={form.reservedNights}
          onChange={handleChange}
          type="number"
          required
        />
        <FormField
          label={fieldLabels.reservationLocation}
          name="reservationLocation"
          value={form.reservationLocation}
          onChange={handleChange}
          type="select"
          options={reservationLocations}
          required
        />
        <FormField
          label={fieldLabels.destination}
          name="destination"
          value={form.destination}
          onChange={handleChange}
          required
        />
        <FormField
          label={fieldLabels.idType}
          name="idType"
          value={form.idType}
          onChange={handleChange}
          type="select"
          options={idTypes}
          required
        />
        <FormField
          label={fieldLabels.idNumber}
          name="idNumber"
          value={form.idNumber}
          onChange={handleChange}
          required
        />
        <FormField
          label={fieldLabels.expeditionPlace}
          name="expeditionPlace"
          value={form.expeditionPlace}
          onChange={handleChange}
          required
        />
        <FormField
          label={fieldLabels.amountPaid}
          name="amountPaid"
          value={form.amountPaid}
          onChange={handleChange}
          type="number"
          required
        />
        <FormField
          label={fieldLabels.paymentMethod}
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
          type="select"
          options={paymentMethods}
          required
        />
        <FormField
          label={fieldLabels.breakfast}
          name="breakfast"
          checked={form.breakfast}
          onChange={handleChange}
          type="checkbox"
        />
        <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro transition-colors duration-200 font-semibold"
          >
            {editingId ? "Actualizar Viajero" : "Registrar Viajero"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TravelerRegistrationForm;
