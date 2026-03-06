import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';

interface Props {
  travelers: TravelerRecord[];
  onEdit: (traveler: TravelerRecord) => void;
}

const PendingPaymentsList: React.FC<Props> = ({ travelers, onEdit }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    const dateObject = new Date(dateString);
    if (isNaN(dateObject.getTime())) return "N/A";
    return formatInTimeZone(dateObject, "UTC", "yyyy-MM-dd");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Pagos Pendientes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-collapse">
          <thead>
            <tr className="bg-green-800 text-white">
              <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider">Nombre</th>
              <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider">Fecha</th>
              <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider">Habitación</th>
              <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider">Monto que Adeuda</th>
              <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {travelers.map((traveler, index) => (
              <tr key={traveler._id || index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-green-100 transition-colors duration-200`}>
                <td className="py-3 px-4 whitespace-nowrap">{traveler.name}</td>
                <td className="py-3 px-4 whitespace-nowrap">{formatDate(traveler.date)}</td>
                <td className="py-3 px-4 whitespace-nowrap">{traveler.roomNumber}</td>
                <td className="py-3 px-4 whitespace-nowrap">{formatCurrency(traveler.amountPaid)}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(traveler)}
                    className="px-3 py-1 bg-verde-principal text-white rounded-md hover:bg-opacity-90 text-xs"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingPaymentsList;
