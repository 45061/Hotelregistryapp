"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BoxFormProps {
  onBoxCreated: () => void;
  editingBox: {
    _id: string;
    nameBox: string;
    initialBalance?: number;
    isHidden?: boolean;
  } | null;
  onCancelEdit: () => void;
  isSuperUser?: boolean;
}

const BoxForm: React.FC<BoxFormProps> = ({
  onBoxCreated,
  editingBox,
  onCancelEdit,
  isSuperUser = false,
}) => {
  const [nameBox, setNameBox] = useState(editingBox?.nameBox || '');
  const [initialBalance, setInitialBalance] = useState(editingBox?.initialBalance || 0);
  const [isHidden, setIsHidden] = useState(Boolean(editingBox?.isHidden));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBox) {
      setNameBox(editingBox.nameBox);
      setInitialBalance(editingBox.initialBalance || 0);
      setIsHidden(Boolean(editingBox.isHidden));
    } else {
      setNameBox('');
      setInitialBalance(0);
      setIsHidden(false);
    }
  }, [editingBox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editingBox ? 'PUT' : 'POST';
    const url = editingBox ? `/api/boxes/${editingBox._id}` : '/api/boxes';

    const payload: Record<string, unknown> = {
      nameBox,
      initialBalance,
    };

    if (isSuperUser) {
      payload.isHidden = isHidden;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingBox ? 'Caja actualizada con éxito!' : 'Caja creada con éxito!');
        setNameBox('');
        setInitialBalance(0);
        setIsHidden(false);
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

      {isSuperUser && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          <input
            type="checkbox"
            id="isHiddenBox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="isHiddenBox" className="text-sm font-medium text-amber-900 cursor-pointer">
            Ocultar caja a otros usuarios (Solo visible para Super Admin)
          </label>
        </div>
      )}

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
