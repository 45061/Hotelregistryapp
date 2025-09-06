"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRoomCreated }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [hotel, setHotel] = useState('');
  const [roomType, setRoomType] = useState(''); // Added
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber, hotel, roomType }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Habitación creada con éxito!');
        setRoomNumber('');
        setHotel('');
        onRoomCreated(); // Notify parent to refresh list
      } else {
        toast.error(data.message || 'Error al crear la habitación.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Error de red o del servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-verde-principal">
        <h2 className="text-2xl font-bold mb-4 text-verde-principal">Crear Nueva Habitación</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="roomNumber" className="block text-verde-oscuro text-sm font-bold mb-2">
              Número de Habitación:
            </label>
            <input
              type="text"
              id="roomNumber"
              className="shadow appearance-none border border-verde-principal rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-verde-principal"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="hotel" className="block text-verde-oscuro text-sm font-bold mb-2">
              Hotel:
            </label>
            <select
              id="hotel"
              className="shadow appearance-none border border-verde-principal rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-verde-principal"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
            >
              <option value="">Selecciona un hotel</option>
              <option value="Oporto 83">Oporto 83</option>
              <option value="Natural Sevgi">Natural Sevgi</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="roomType" className="block text-verde-oscuro text-sm font-bold mb-2">
              Tipo de Habitación:
            </label>
            <select
              id="roomType"
              className="shadow appearance-none border border-verde-principal rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-verde-principal"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="Single">Individual</option>
              <option value="Double">Doble</option>
              <option value="Aparta Estudio">Aparta Estudio</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Triple">Triple</option>
              <option value="Cuadruple">Cuadruple</option>
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
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
