"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BoxFormProps {
  onBoxCreated: () => void;
  editingBox: {
    _id: string;
    nameBox: string;
    initialBalance?: number;
  } | null;
  onCancelEdit: () => void;
}

const BoxForm: React.FC<BoxFormProps> = ({
  onBoxCreated,
  editingBox,
  onCancelEdit,
}) => {
  const [nameBox, setNameBox] = useState(editingBox?.nameBox || '');
  const [initialBalance, setInitialBalance] = useState(editingBox?.initialBalance || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBox) {
      setNameBox(editingBox.nameBox);
      setInitialBalance(editingBox.initialBalance || 0);
    } else {
      setNameBox('');
      setInitialBalance(0);
    }
  }, [editingBox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editingBox ? 'PUT' : 'POST';
    const url = editingBox ? `/api/boxes/${editingBox._id}` : '/api/boxes';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nameBox, initialBalance }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingBox ? 'Caja actualizada con éxito!' : 'Caja creada con éxito!');
        setNameBox('');
        setInitialBalance(0);
        onBoxCreated(); // Notify parent to refresh list
      } else {
        toast.error(data.error || 'Error al guardar la caja.');
      }
    } catch (error) {
      console.error('Error saving box:', error);
      toast.error('Error de red o del servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nameBox" className="block text-sm font-medium text-gray-700">
          Nombre de la Caja
        </label>
        <input
          type="text"
          id="nameBox"
          value={nameBox}
          onChange={(e) => setNameBox(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-verde-principal focus:ring-verde-principal sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="initialBalance"
          className="block text-sm font-medium text-gray-700"
        >
          Saldo Inicial
        </label>
        <input
          type="number"
          id="initialBalance"
          value={initialBalance}
          onChange={(e) => setInitialBalance(Number(e.target.value))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-verde-principal focus:ring-verde-principal sm:text-sm"
        />
      </div>
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro focus:outline-none focus:ring-2 focus:ring-verde-principal focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : editingBox ? 'Actualizar Caja' : 'Crear Caja'}
        </button>
        {editingBox && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancelar Edición
          </button>
        )}
      </div>
    </form>
  );
};

export default BoxForm;