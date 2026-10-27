import React from "react";
import FormField from "@/components/FormField";

interface CompanionRegistrationFormProps {
  searchId: string;
  setSearchId: (val: string) => void;
  handleSearch: () => void;
  companionForm: {
    mainTravelerId: string;
    name: string;
    idNumber: string;
    idType: string;
    expeditionPlace: string;
  };
  handleCompanionChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleCompanionSubmit: (e: React.FormEvent) => void;
  idTypes: string[];
  companionFieldLabels: Record<string, string>;
}

export const CompanionRegistrationForm: React.FC<CompanionRegistrationFormProps> = ({
  searchId,
  setSearchId,
  handleSearch,
  companionForm,
  handleCompanionChange,
  handleCompanionSubmit,
  idTypes,
  companionFieldLabels,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Registro de Acompañante
      </h2>
      <div className="flex items-end space-x-4 mb-4">
        <div className="flex-grow">
          <FormField
            label="Buscar Viajero por ID"
            name="searchId"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Ingresar Número de ID de Viajero"
          />
        </div>
        <button
          onClick={handleSearch}
          type="button"
          className="px-6 py-2 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro transition-colors duration-200 font-semibold"
        >
          Buscar
        </button>
      </div>
      <form
        onSubmit={handleCompanionSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <FormField
          label={companionFieldLabels.mainTravelerId}
          name="mainTravelerId"
          value={companionForm.mainTravelerId}
          onChange={handleCompanionChange}
          readOnly
          required
        />
        <FormField
          label={companionFieldLabels.name}
          name="name"
          value={companionForm.name}
          onChange={handleCompanionChange}
          required
        />
        <FormField
          label={companionFieldLabels.idType}
          name="idType"
          value={companionForm.idType}
          onChange={handleCompanionChange}
          type="select"
          options={idTypes}
          required
        />
        <FormField
          label={companionFieldLabels.idNumber}
          name="idNumber"
          value={companionForm.idNumber}
          onChange={handleCompanionChange}
          required
        />
        <FormField
          label={companionFieldLabels.expeditionPlace}
          name="expeditionPlace"
          value={companionForm.expeditionPlace}
          onChange={handleCompanionChange}
          required
        />
        <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-amarillo text-gray-900 rounded-md hover:bg-opacity-90 transition-colors duration-200 font-semibold shadow-sm"
          >
            Añadir Acompañante
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanionRegistrationForm;
