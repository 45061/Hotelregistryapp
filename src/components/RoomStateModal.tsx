"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface RoomStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  onStateUpdated: () => void;
}

const RoomStateModal: React.FC<RoomStateModalProps> = ({ isOpen, onClose, room, onStateUpdated }) => {
  const [selectedState, setSelectedState] = useState(room?.state || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setSelectedState(room.state);
    }
  }, [room]);

  const roomStates = [
    { value: 'Disponible', label: 'Disponible' },
    { value: 'Ocupada', label: 'Ocupada' },
    { value: 'CheckOut Ya Salio', label: 'CheckOut Ya Salio' },
    { value: 'CheckOut no ha Salido', label: 'CheckOut no ha Salido' },
    { value: 'Repaso', label: 'Repaso' },
    { value: 'Revisar', label: 'Revisar' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: selectedState }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Estado de la habitación actualizado con éxito!');
        onStateUpdated();
      } else {
        toast.error(data.message || 'Error al actualizar el estado de la habitación.');
      }
    } catch (error) {
      console.error('Error updating room state:', error);
      toast.error('Error de red o del servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-verde-principal">
        <h2 className="text-2xl font-bold mb-4 text-verde-principal">Actualizar Estado de Habitación</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="roomNumber" className="block text-verde-oscuro text-sm font-bold mb-2">
              Habitación:
            </label>
            <input
              type="text"
              id="roomNumber"
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
              value={room.roomNumber}
              disabled
            />
          </div>
          <div className="mb-4">
            <label htmlFor="roomState" className="block text-verde-oscuro text-sm font-bold mb-2">
              Estado:
            </label>
            <select
              id="roomState"
              className="shadow appearance-none border border-verde-principal rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-verde-principal"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              required
            >
              {roomStates.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-verde-oscuro font-bold py-2 px-4 rounded mr-2"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-verde-principal hover:bg-verde-oscuro text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomStateModal;