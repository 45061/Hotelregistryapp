"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import OpenBoxModal from './OpenBoxModal';
import { formatInTimeZone } from 'date-fns-tz';

export interface BoxData {
  _id: string;
  activeBox: boolean;
  nameBox: string;
  lastClosingBalance?: number;
  timesOpen: number;
  lastOpening: string;
  lastClosing: string;
  userIdOpenBox: { _id: string; firstName: string; lastName: string };
  isHidden?: boolean;
}

interface BoxListProps {
  refreshTrigger: number;
  onEdit: (box: BoxData) => void;
  user: any;
}

const BoxList: React.FC<BoxListProps> = ({
  refreshTrigger,
  onEdit,
  user,
}) => {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingBoxId, setOpeningBoxId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [updatingBoxId, setUpdatingBoxId] = useState<string | null>(null);
  const router = useRouter();

  const isSuperUser = Boolean(user && user.isSuperUser);

  const fetchBoxes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/boxes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setBoxes(data.data);
      } else {
        setError(data.error || 'Error al cargar cajas.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
  }, [refreshTrigger]);

  const handleOpenBox = (boxId: string) => {
    setOpeningBoxId(boxId);
  };

  const handleCloseModal = () => {
    setOpeningBoxId(null);
  };

  const handleOpenSuccess = () => {
    setOpeningBoxId(null);
    fetchBoxes();
    router.push(`/box/${openingBoxId}`);
  };

  const handleToggleHide = async (boxId: string, currentHiddenStatus: boolean) => {
    setUpdatingBoxId(boxId);
    const newHiddenStatus = !currentHiddenStatus;

    try {
      const response = await fetch(`/api/boxes/${boxId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHidden: newHiddenStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          newHiddenStatus
            ? 'Caja ocultada (solo visible para Super Admin).'
            : 'Caja visible para todos los usuarios.'
        );
        fetchBoxes();
      } else {
        toast.error(data.error || 'Error al cambiar la visibilidad de la caja.');
      }
    } catch (err) {
      console.error('Error toggling box visibility:', err);
      toast.error('Error de red al actualizar la caja.');
    } finally {
      setUpdatingBoxId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta caja?')) {
      return;
    }
    try {
      const response = await fetch(`/api/boxes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Caja eliminada con éxito!');
        fetchBoxes(); // Refresh the list
      } else {
        toast.error(data.error || 'Error al eliminar la caja.');
      }
    } catch (error) {
      console.error('Error deleting box:', error);
      toast.error('Error de red o del servidor.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatInTimeZone(new Date(dateString), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  const filteredBoxes = useMemo(() => {
    if (!isSuperUser || visibilityFilter === "all") {
      return boxes;
    }
    if (visibilityFilter === "hidden") {
      return boxes.filter((box) => Boolean(box.isHidden));
    }
    return boxes.filter((box) => !box.isHidden);
  }, [boxes, isSuperUser, visibilityFilter]);

  const counts = useMemo(() => {
    const hiddenCount = boxes.filter((box) => Boolean(box.isHidden)).length;
    const visibleCount = boxes.length - hiddenCount;
    return { all: boxes.length, visible: visibleCount, hidden: hiddenCount };
  }, [boxes]);

  if (loading) {
    return <div className="text-center py-6 text-stone-600">Cargando cajas...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      {/* Super Admin Filter Tabs */}
      {isSuperUser && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Filtro Super Admin:
            </span>
            <button
              type="button"
              onClick={() => setVisibilityFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                visibilityFilter === "all"
                  ? "bg-verde-principal text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Todas ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("visible")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                visibilityFilter === "visible"
                  ? "bg-verde-principal text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Visibles ({counts.visible})
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("hidden")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                visibilityFilter === "hidden"
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Ocultas ({counts.hidden})
            </button>
          </div>

          <p className="text-xs text-stone-500">
            * Las cajas marcadas como <span className="font-semibold text-amber-700">Ocultas</span> no son visibles para otros usuarios.
          </p>
        </div>
      )}

      {filteredBoxes.length === 0 ? (
        <p className="text-center py-6 text-stone-500">
          {visibilityFilter === "hidden"
            ? "No hay cajas ocultas."
            : visibilityFilter === "visible"
              ? "No hay cajas visibles."
              : "No hay cajas registradas."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Nombre Caja
                </th>
                {isSuperUser && (
                  <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Visibilidad
                  </th>
                )}
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Último Saldo
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Veces Abierta
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Última Apertura
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Último Cierre
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Abierta Por
                </th>
                <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBoxes.map((box) => (
                <tr
                  key={box._id}
                  className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${
                    box.isHidden ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-sm">
                    {box.activeBox ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-stone-800">
                    <div className="flex items-center gap-2">
                      <span>{box.nameBox}</span>
                      {box.isHidden && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Oculta
                        </span>
                      )}
                    </div>
                  </td>
                  {isSuperUser && (
                    <td className="py-3 px-4 text-sm">
                      {box.isHidden ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.375l1.091 1.091a4 4 0 00-5.557-5.557z"
                              clipRule="evenodd"
                            />
                            <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 014.12 6.131l2.062 2.062a4.003 4.003 0 004.566 5.738z" />
                          </svg>
                          Oculta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path
                              fillRule="evenodd"
                              d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Visible
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-stone-700">
                    {box.lastClosingBalance !== undefined && box.lastClosingBalance !== null
                      ? `$${Number(box.lastClosingBalance).toLocaleString('es-CO')}`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-stone-700">{box.timesOpen || 0}</td>
                  <td className="py-3 px-4 text-sm text-stone-600">{formatDate(box.lastOpening)}</td>
                  <td className="py-3 px-4 text-sm text-stone-600">{formatDate(box.lastClosing)}</td>
                  <td className="py-3 px-4 text-sm text-stone-700">
                    {box.userIdOpenBox
                      ? `${box.userIdOpenBox.firstName} ${box.userIdOpenBox.lastName}`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {box.activeBox ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/box/${box._id}`)}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition"
                        >
                          Ir a Caja
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenBox(box._id)}
                          className="px-3 py-1 bg-verde-principal hover:bg-verde-oscuro text-white rounded-lg text-xs font-medium transition disabled:bg-stone-300"
                        >
                          Abrir Caja
                        </button>
                      )}

                      {/* Super Admin Actions */}
                      {isSuperUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(box)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-medium transition"
                            title="Editar datos de la caja"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={updatingBoxId === box._id}
                            onClick={() => handleToggleHide(box._id, Boolean(box.isHidden))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 ${
                              box.isHidden
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-stone-600 hover:bg-stone-700"
                            }`}
                            title={
                              box.isHidden
                                ? "Hacer visible para otros usuarios"
                                : "Ocultar a otros usuarios"
                            }
                          >
                            {updatingBoxId === box._id
                              ? "..."
                              : box.isHidden
                                ? "Mostrar"
                                : "Ocultar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(box._id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openingBoxId && (
        <OpenBoxModal
          boxId={openingBoxId}
          onClose={handleCloseModal}
          onSuccess={handleOpenSuccess}
        />
      )}
    </>
  );
};

export default BoxList;
