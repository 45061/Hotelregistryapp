"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface BoxData {
  _id: string;
  name: string;
  description?: string;
  user: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

interface BoxListProps {
  refreshTrigger: number;
  onEdit: (box: BoxData) => void;
}

const BoxList: React.FC<BoxListProps> = ({
  refreshTrigger,
  onEdit,
}) => {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Nombre</th>
            <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Descripción</th>
            <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Creado Por</th>
            <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Fecha Creación</th>
            <th className="py-3 px-4 border-b border-gray-200 bg-verde-principal text-left text-xs font-semibold text-white uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((box) => (
            <tr key={box._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.name}</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.description || 'N/A'}</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{box.user ? `${box.user.firstName} ${box.user.lastName}` : 'N/A'}</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{new Date(box.createdAt).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(box)}
                    className="px-3 py-1 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(box._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BoxList;
