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
  "actions",
];

type TravelerDisplayFields = Omit<Traveler, "_id">;

const fieldLabels: Record<keyof TravelerDisplayFields, string> = {
  roomNumber: "Room No.",
  date: "Date",
  name: "Name",
  nationality: "Nationality",
  headquarters: "Headquarters",
  origin: "Origin",
  reservedNights: "Reserved Nights",
  reservationLocation: "Reservation Location",
  arrivalTime: "Arrival Time",
  destination: "Destination",
  idType: "ID Type",
  idNumber: "ID Number",
  expeditionPlace: "Place of Expedition",
  breakfast: "Breakfast",
  amountPaid: "Amount Paid",
  paymentMethod: "Payment Method",
  actions: "Actions",
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

  return record[field];
};

interface TravelerListProps {
  refreshTrigger: number;
  onEdit: (traveler: Traveler) => void;
}

const TravelerList: React.FC<TravelerListProps> = ({
  refreshTrigger,
  onEdit,
}) => {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

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
          setError(data.error || "Failed to fetch travelers");
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
      <h1 className="text-2xl font-bold mb-4">Lista de Viajeros</h1>
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
                      className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
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
                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                              >
                                Edit
                              </button>

                              <Link
                                href={`/travelers/${id}`}
                                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                                prefetch={false}
                              >
                                View
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
                    ? "bg-green-700 text-white"
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
