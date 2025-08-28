"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import OpenBoxModal from './OpenBoxModal';

interface BoxData {
  _id: string;
  activeBox: boolean;
  nameBox: string;
  lastClosingBalance?: number;
  timesOpen: number;
  lastOpening: string;
  lastClosing: string;
  userIdOpenBox: { _id: string; firstName: string; lastName: string };
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
  const router = useRouter();

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

  if (loading) {
    return <div className="text-center py-4">Cargando cajas...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (boxes.length === 0) {
    return <p className="text-center">No hay cajas registradas.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Activa o Inactiva</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Nombre Caja</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Ultimo Saldo de Cierre</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Veces Abierta</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Última Apertura</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Último Cierre</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Caja Abierta Por</th>
              <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box) => (
              <tr key={box._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.activeBox ? 'Activa' : 'Inactiva'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.nameBox}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.lastClosingBalance || 'N/A'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.timesOpen || 'N/A'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.lastOpening || 'N/A'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.lastClosing || 'N/A'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.userIdOpenBox ? `${box.userIdOpenBox.firstName} ${box.userIdOpenBox.lastName}` : 'N/A'}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                  <div className="flex space-x-2">
                    {box.activeBox ? (
                      <button
                        onClick={() => router.push(`/box/${box._id}`)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                      >
                        Ir a Caja
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBox(box._id)}
                        className="px-3 py-1 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro text-xs disabled:bg-gray-400"
                      >
                        Abrir Caja
                      </button>
                    )}
                    {user && user.isSuperUser && (
                      <button
                        onClick={() => handleDelete(box._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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