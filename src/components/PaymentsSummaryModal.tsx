'use client';

import { useMemo } from 'react';

interface Payment {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  cash: number;
  typePayment: string;
}

interface Withdrawal {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  cash: number;
  reasonOfWithdraw: string;
}

interface Summary {
  [key: string]: {
    name: string;
    totalCash: number;
    totalWithdrawn: number;
    payments: Record<string, number>;
  };
}

interface PaymentsSummaryModalProps {
  payments: Payment[];
  withdrawals: Withdrawal[];
  onClose: () => void;
}

export default function PaymentsSummaryModal({ payments, withdrawals, onClose }: PaymentsSummaryModalProps) {
  const summary: Summary = useMemo(() => {
    const summaryData = payments.reduce((acc, payment) => {
      const userId = payment.user._id;
      const userName = `${payment.user.firstName} ${payment.user.lastName}`;
      const { cash, typePayment } = payment;

      if (!acc[userId]) {
        acc[userId] = {
          name: userName,
          totalCash: 0,
          totalWithdrawn: 0,
          payments: {},
        };
      }

      if (typePayment === 'Efectivo') {
        acc[userId].totalCash += cash;
      } else {
        if (!acc[userId].payments[typePayment]) {
          acc[userId].payments[typePayment] = 0;
        }
        acc[userId].payments[typePayment] += cash;
      }

      return acc;
    }, {} as Summary);

    withdrawals.forEach(withdrawal => {
      const userId = withdrawal.user._id;
      const userName = `${withdrawal.user.firstName} ${withdrawal.user.lastName}`;
      const { cash } = withdrawal;

      if (!summaryData[userId]) {
        summaryData[userId] = {
          name: userName,
          totalCash: 0,
          totalWithdrawn: 0,
          payments: {},
        };
      }

      summaryData[userId].totalWithdrawn += cash;
    });

    return summaryData;
  }, [payments, withdrawals]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Resumen de Pagos y Retiros por Usuario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="space-y-6">
          {Object.values(summary).map((userSummary) => (
            <div key={userSummary.name} className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{userSummary.name}</h3>
              <p className="text-lg">
                <strong>Total Efectivo:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(userSummary.totalCash)}
              </p>
              <p className="text-lg text-red-600">
                <strong>Total Retirado:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(userSummary.totalWithdrawn)}
              </p>
              <div className="mt-2">
                <h4 className="font-bold">Otros Pagos:</h4>
                {Object.keys(userSummary.payments).length > 0 ? (
                  <ul className="list-disc list-inside">
                    {Object.entries(userSummary.payments).map(([type, amount]) => (
                      <li key={type}>
                        {type}: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay otros pagos registrados.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}