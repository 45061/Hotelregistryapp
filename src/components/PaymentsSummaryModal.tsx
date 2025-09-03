'use client';

import { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Payment {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  traveler?: {
    roomNumber: string;
    headquarters: string;
  };
  cash: number;
  typePayment: string;
  reasonOfPay: string;
}

interface Withdrawal {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  cash: number;
  concept: string;
  reasonOfWithdraw: string;
}

interface PaymentsSummaryModalProps {
  payments: Payment[];
  withdrawals: Withdrawal[];
  onClose: () => void;
}

export default function PaymentsSummaryModal({ payments, withdrawals, onClose }: PaymentsSummaryModalProps) {
  const totalIncome = useMemo(() => {
    return payments.reduce((acc, payment) => acc + payment.cash, 0);
  }, [payments]);

  const totalExpenses = useMemo(() => {
    return withdrawals.reduce((acc, withdrawal) => acc + withdrawal.cash, 0);
  }, [withdrawals]);

  const sortedPayments = useMemo(() => {
    const conceptOrder = {
      'Habitacion': 1,
      'Consumibles': 2,
      'Inyeccion': 3,
    };

    return [...payments].sort((a, b) => {
      const reasonA = a.reasonOfPay;
      const reasonB = b.reasonOfPay;
      const orderA = conceptOrder[reasonA] || 99;
      const orderB = conceptOrder[reasonB] || 99;

      if (orderA < orderB) return -1;
      if (orderA > orderB) return 1;

      const headquartersA = a.traveler?.headquarters || '';
      const headquartersB = b.traveler?.headquarters || '';
      if (headquartersA === 'Oporto 83' && headquartersB !== 'Oporto 83') return -1;
      if (headquartersA !== 'Oporto 83' && headquartersB === 'Oporto 83') return 1;

      const roomA = parseInt(a.traveler?.roomNumber || '0');
      const roomB = parseInt(b.traveler?.roomNumber || '0');
      if (roomA < roomB) return -1;
      if (roomA > roomB) return 1;

      return 0;
    });
  }, [payments]);

  const paymentMethodSummary = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const { typePayment, cash } = payment;
      if (!acc[typePayment]) {
        acc[typePayment] = 0;
      }
      acc[typePayment] += cash;
      return acc;
    }, {} as Record<string, number>);
  }, [payments]);

  const userIncomeSummary = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const { user, cash, typePayment } = payment;
      const userName = `${user.firstName}`;
      if (!acc[userName]) {
        acc[userName] = {
          total: 0,
          payments: {},
        };
      }
      acc[userName].total += cash;
      if (!acc[userName].payments[typePayment]) {
        acc[userName].payments[typePayment] = 0;
      }
      acc[userName].payments[typePayment] += cash;
      return acc;
    }, {} as Record<string, { total: number; payments: Record<string, number> }>);
  }, [payments]);

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.text("Resumen de Movimientos", 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [['Usuario', 'Habitación', 'Medio de pago', 'Concepto', 'Valor']],
      body: sortedPayments.map(p => [p.user.firstName, p.traveler?.roomNumber || 'N/A', p.typePayment, p.reasonOfPay, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.cash)]),
      foot: [[{
        content: 'Total ingresos',
        colSpan: 4,
        styles: { halign: 'right' },
      }, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalIncome)]],
    });

    autoTable(doc, {
      head: [['Usuario', 'Concepto', 'Medio de pago', 'Valor']],
      body: withdrawals.map(w => [w.user.firstName, w.concept, 'Efectivo', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(w.cash)]),
      foot: [[{
        content: 'Total egresos',
        colSpan: 3,
        styles: { halign: 'right' },
      }, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalExpenses)]],
    });

    autoTable(doc, {
      head: [['Medio de Pago', 'Total']],
      body: Object.entries(paymentMethodSummary).map(([method, total]) => [method, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)]),
    });

    autoTable(doc, {
      head: [['Usuario', 'Total Ingresos']],
      body: Object.entries(userIncomeSummary).map(([userName, summary]) => {
        const userRows = [[userName, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(summary.total)]];
        Object.entries(summary.payments).forEach(([method, total]) => {
          userRows.push([`  ${method}`, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)]);
        });
        return userRows;
      }).flat(),
    });

    doc.save("resumen_movimientos.pdf");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Resumen de Movimientos</h1>
          <div>
            <button onClick={generatePdf} className="mr-4 px-4 py-2 bg-blue-500 text-white rounded-md">Generar PDF</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingresos */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <h2 className="bg-green-200 text-green-900 font-semibold px-4 py-2">Ingresos recibidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Usuario</th>
                    <th className="px-4 py-2">Habitación</th>
                    <th className="px-4 py-2">Medio de pago</th>
                    <th className="px-4 py-2">Concepto</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map(payment => (
                    <tr key={payment._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{payment.user.firstName}</td>
                      <td className="px-4 py-2">{payment.traveler?.roomNumber || 'N/A'}</td>
                      <td className="px-4 py-2"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{payment.typePayment}</span></td>
                      <td className="px-4 py-2">{payment.reasonOfPay}</td>
                      <td className="px-4 py-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(payment.cash)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2">Total ingresos</td>
                    <td className="px-4 py-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalIncome)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-4">
              <h3 className="font-bold mb-2">Resumen por Medio de Pago</h3>
              <ul>
                {Object.entries(paymentMethodSummary).map(([method, total]) => (
                  <li key={method} className="flex justify-between">
                    <span>{method}</span>
                    <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              <h3 className="font-bold mb-2">Resumen por Usuario</h3>
              <ul>
                {Object.entries(userIncomeSummary).map(([userName, summary]) => (
                  <li key={userName} className="mb-2">
                    <div className="flex justify-between font-bold">
                      <span>{userName}</span>
                      <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(summary.total)}</span>
                    </div>
                    <ul className="list-disc list-inside ml-4">
                      {Object.entries(summary.payments).map(([method, total]) => (
                        <li key={method} className="flex justify-between">
                          <span>{method}</span>
                          <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Egresos */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <h2 className="bg-red-200 text-red-900 font-semibold px-4 py-2">Egresos efectuados</h2>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2">Usuario</th>
                  <th className="px-4 py-2">Concepto</th>
                  <th className="px-4 py-2">Medio de pago</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(withdrawal => (
                  <tr key={withdrawal._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">{withdrawal.user.firstName}</td>
                    <td className="px-4 py-2">{withdrawal.concept}</td>
                    <td className="px-4 py-2"><span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Efectivo</span></td>
                    <td className="px-4 py-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(withdrawal.cash)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={3} className="px-4 py-2">Total egresos</td>
                  <td className="px-4 py-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}