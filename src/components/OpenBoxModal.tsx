import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { incrementCharge } from '@/store/actions/dateAction';

interface OpenBoxModalProps {
  boxId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OpenBoxModal: React.FC<OpenBoxModalProps> = ({ boxId, onClose, onSuccess }) => {
  const [initialBalance, setInitialBalance] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/box/open`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ boxId, initialBalance: parseFloat(initialBalance) || 0 }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Caja abierta con éxito!');
        dispatch(incrementCharge());
        onSuccess();
      } else {
        toast.error(data.error || 'Error al abrir la caja.');
      }
    } catch (error) {
      console.error('Error opening box:', error);
      toast.error('Error de red o del servidor.');
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold font-heading mb-4">Abrir Caja</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700">Saldo Inicial</label>
            <input
              id="initialBalance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-verde-principal focus:border-verde-principal sm:text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-verde-principal text-white rounded-md hover:bg-verde-oscuro">Abrir Caja</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenBoxModal;
