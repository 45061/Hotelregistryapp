"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AtamsaLogo from "@/components/AtamsaLogo";
import Navbar from "@/components/Navbar";

interface TravelerRecord {
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
  companions?: any[]; // Assuming companions will be populated
}

const labelTranslations: Record<keyof TravelerRecord, string> = {
  _id: "ID",
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
  companions: "Acompañantes",
};

export default function TravelerDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [traveler, setTraveler] = useState<TravelerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.data);
          if (!userData.data.authorized) {
            router.push("/unauthorized");
          }
        } else if (res.status === 401) {
          router.push("/login");
        } else {
          router.push("/unauthorized"); // Fallback for other non-2xx statuses
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loadingUser && user && user.authorized && id) {
      const fetchTraveler = async () => {
        try {
          const res = await fetch(`/api/travelers/${id}`);
          const data = await res.json();
          if (data.success) {
            setTraveler(data.data);
          } else {
            toast.error(data.error || "Error al cargar los detalles del viajero.");
          }
        } catch (error) {
          toast.error("Ocurrió un error al cargar los detalles del viajero.");
        } finally {
          setLoading(false);
        }
      };
      fetchTraveler();
    }
  }, [id, loadingUser, user]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/unauthorized");
      } else {
        toast.error("Error al cerrar sesión.");
      }
    } catch (error) {
      toast.error("Ocurrió un error durante el cierre de sesión.");
    }
  };

  if (loadingUser || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user || !user.authorized) {
    return null;
  }

  if (!traveler) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Viajero no encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="p-8">
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="mb-6 text-3xl font-heading text-verde-principal text-center">
            Información del Viajero
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(traveler).map(([key, value]) => {
              if (
                key === "_id" ||
                key === "__v" ||
                key === "createdAt" ||
                key === "updatedAt"
              )
                return null;
              if (key === "companions") {
                return (
                  <div
                    key={key}
                    className="col-span-full mt-4 p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <h3 className="text-xl font-heading text-verde-principal mb-3">
                      Acompañantes:
                    </h3>
                    {value.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {value.map((companion: any) => (
                          <li key={companion._id} className="text-gray-800">
                            {companion.name} (ID: {companion.idNumber})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-800">No hay acompañantes registrados.</p>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={key}
                  className="bg-gray-50 p-4 rounded-md border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-600 capitalize mb-1">
                    {labelTranslations[key as keyof TravelerRecord] || key.replace(/([A-Z])/g, " $1")}:
                  </p>
                  <p className="text-gray-900 font-semibold text-lg">
                    {typeof value === "boolean"
                      ? value
                        ? "Sí"
                        : "No"
                      : value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
