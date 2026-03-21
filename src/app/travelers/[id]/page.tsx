"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PublicModal from "@/components/PublicModal";

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
  documentImageUrl?: string;
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
  documentImageUrl: "Documento",
  companions: "Acompañantes",
};

export default function TravelerDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [traveler, setTraveler] = useState<TravelerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
  }, [router]);

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

  const compressImageForUpload = async (file: File) => {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No se pudo leer la imagen."));
        img.src = imageUrl;
      });

      const maxDimension = 1800;
      const largestSide = Math.max(image.width, image.height);
      const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
      const targetWidth = Math.round(image.width * scale);
      const targetHeight = Math.round(image.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("No se pudo procesar la imagen.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      const compressedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.82);
      });

      if (!compressedBlob) {
        throw new Error("No se pudo comprimir la imagen.");
      }

      return new File([compressedBlob], `${file.name.replace(/\.[^.]+$/, "") || "documento"}.jpg`, {
        type: "image/jpeg",
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !id) {
      return;
    }

    setUploadingImage(true);

    try {
      const compressedFile = await compressImageForUpload(selectedFile);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await fetch(`/api/travelers/${id}/image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo subir la imagen.");
        return;
      }

      setTraveler((currentTraveler) =>
        currentTraveler
          ? {
              ...currentTraveler,
              documentImageUrl: data.data.documentImageUrl,
            }
          : currentTraveler
      );
      toast.success("Imagen subida correctamente.");
    } catch (error) {
      toast.error("Ocurrió un error al subir la imagen.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
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
      <main className="p-8">
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="mb-6 text-3xl font-heading text-verde-principal text-center">
            Información del Viajero
          </h2>
          <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-heading text-verde-principal">
                  Documento o política firmada
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sube una imagen y quedará guardada en Cloudinary para este viajero.
                </p>
              </div>
              <label className="inline-flex items-center justify-center px-4 py-2 bg-verde-principal text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60">
                <span>{uploadingImage ? "Subiendo..." : "Subir imagen"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {traveler.documentImageUrl ? (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="group text-left"
                >
                  <img
                    src={traveler.documentImageUrl}
                    alt={`Documento de ${traveler.name}`}
                    className="h-36 w-36 rounded-lg border border-gray-200 object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
                  />
                  <span className="mt-2 block text-sm text-verde-principal font-medium">
                    Click para ampliar
                  </span>
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                Aún no hay una imagen cargada para este viajero.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(traveler).map(([key, value]) => {
              if (
                key === "_id" ||
                key === "__v" ||
                key === "createdAt" ||
                key === "updatedAt" ||
                key === "documentImageUrl"
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
                            {companion.name} ({companion.idType}: {companion.idNumber})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-800">No hay acompañantes registrados.</p>
                    )}
                  </div>
                );
              }
              if (key === "user") {
                return (
                  <div
                    key={key}
                    className="bg-gray-50 p-4 rounded-md border border-gray-200"
                  >
                    <p className="text-sm font-medium text-gray-600 capitalize mb-1">
                      {labelTranslations[key as keyof TravelerRecord] || key.replace(/([A-Z])/g, " $1")}:
                    </p>
                    <p className="text-gray-900 font-semibold text-lg">
                      {(value as any).name || "N/A"}
                    </p>
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

      <PublicModal
        opened={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        size="xl"
        title="Vista previa del documento"
      >
        {traveler.documentImageUrl ? (
          <img
            src={traveler.documentImageUrl}
            alt={`Documento ampliado de ${traveler.name}`}
            className="w-full h-auto rounded-lg"
          />
        ) : null}
      </PublicModal>
    </div>
  );
}
