"use client";

import React, { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

interface Traveler {
  _id: string;
  roomNumber: string;
  date: string;
  name: string;
  nationality: string;
  headquarters: string;
  origin: string;
  reservedNights: number;
  reservationLocation: string;
  arrivalTime: string;
  destination: string;
  idType: string;
  idNumber: string;
  expeditionPlace: string;
  breakfast: boolean;
  amountPaid: number;
  paymentMethod: string;
  user: {
    _id: string;
    name: string;
  };
}

const allTableFields: (keyof Traveler | "actions")[] = [
  "roomNumber",
  "date",
  "name",
  "nationality",
  "headquarters",
  "origin",
  "reservedNights",
  "reservationLocation",
  "arrivalTime",
  "destination",
  "idType",
  "idNumber",
  "expeditionPlace",
  "breakfast",
  "amountPaid",
  "paymentMethod",
  "user",
  "actions",
];

type TravelerDisplayFields = Omit<Traveler, "_id">;

const fieldLabels: Record<keyof TravelerDisplayFields, string> = {
  roomNumber: "Número de Habitación",
  date: "Fecha",
  name: "Nombre",
  nationality: "Nacionalidad",
  headquarters: "Sede",
  origin: "Origen",
  reservedNights: "Noches Reservadas",
  reservationLocation: "Ubicación de Reserva",
  arrivalTime: "Hora de Llegada",
  destination: "Destino",
  idType: "Tipo de ID",
  idNumber: "Número de ID",
  expeditionPlace: "Lugar de Expedición",
  breakfast: "Desayuno",
  amountPaid: "Monto Pagado",
  paymentMethod: "Método de Pago",
  user: "Usuario",
  actions: "Acciones",
};

const getFieldValue = (record: Traveler, field: keyof Traveler) => {
  if (field === "date") {
    const dateString = record[field];
    if (dateString) {
      const dateObject = new Date(dateString);
      if (!isNaN(dateObject.getTime())) {
        return formatInTimeZone(dateObject, "America/Bogota", "yyyy-MM-dd");
      }
    }
    return "N/A";
  }
  if (field === "arrivalTime") {
    const timeString = record[field];
    const datePart = record.date ? record.date.split("T")[0] : "";
    if (timeString && datePart) {
      const combinedDateTimeString = `${datePart}T${timeString}:00`;
      const dateObject = new Date(combinedDateTimeString);
      if (!isNaN(dateObject.getTime())) {
        return formatInTimeZone(dateObject, "America/Bogota", "HH:mm");
      }
    }
    return "N/A";
  }
  if (typeof record[field] === "boolean") {
    return record[field] ? "Yes" : "No";
  }
  if (field === "user") {
    return record.user ? record.user.name : "N/A";
  }

  return record[field];
};

interface TravelerListProps {
  refreshTrigger: number;
  onEdit: (traveler: Traveler) => void;
  isAdmin: boolean;
}

const TravelerList: React.FC<TravelerListProps> = ({
  refreshTrigger,
  onEdit,
  isAdmin,
}) => {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  const handleDownloadCSV = () => {
    const fields = allTableFields.filter(
      (field): field is keyof Traveler => field !== "actions"
    );

    const header = fields
      .map((field) => fieldLabels[field as keyof typeof fieldLabels] || field)
      .join(",");

    const rows = travelers.map((traveler) =>
      fields
        .map((field) => {
          const raw = getFieldValue(traveler, field);
          const value = raw !== undefined && raw !== null ? String(raw) : "";
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reservas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchTravelers = async () => {
      try {
        const response = await fetch("/api/travelers");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          // Sort records by date (descending) and then by _id (descending) for consistent order
          const sortedRecords = data.data.sort((a: Traveler, b: Traveler) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
              return dateB - dateA; // Sort by date descending
            }
            return b._id.localeCompare(a._id); // Sort by _id descending for stable sort
          });
          setTravelers(sortedRecords);
        } else {
          setError(data.error || "Error al cargar viajeros");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelers();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="text-center py-4">Cargando viajeros...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = travelers.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(travelers.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lista de Viajeros</h1>
        {travelers.length > 0 && isAdmin && (
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2  bg-verde-principal text-white rounded-md hover:bg-green-700 text-sm"
          >
            Descargar CSV
          </button>
        )}
      </div>
      {travelers.length === 0 ? (
        <p className="text-center">No hay viajeros registrados.</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {allTableFields.map((field) => (
                    <th
                      key={field}
                      className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      {fieldLabels[field as keyof typeof fieldLabels] ||
                        field
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((traveler) => {
                  const id = traveler._id?.toString?.() ?? String(traveler._id);
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      {allTableFields.map((field) => (
                        <td
                          key={field}
                          className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700"
                        >
                          {field === "actions" ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => onEdit(traveler)}
                                className="px-3 py-1 bg-verde-principal text-white rounded-md hover:bg-opacity-90 text-xs"
                              >
                                Editar
                              </button>

                              <Link
                                href={`/travelers/${id}`}
                                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                                prefetch={false}
                              >
                                Ver
                              </Link>
                            </div>
                          ) : (
                            getFieldValue(traveler, field)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === i + 1
                    ? "bg-verde-principal text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerList;
