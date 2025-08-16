'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import FormField from '@/components/FormField';
import { getUserFromToken } from '@/lib/auth';

const initialForm = {
  type: 'Ingreso',
  concept: '',
  amount: 0,
  paymentMethod: '',
  room: '',
};

const initialFilters = {
  tipo: '',
  medioPago: '',
  habitacion: '',
  fechaInicio: '',
  fechaFin: '',
};

export default function CashPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const router = useRouter();

  useEffect(() => {
    const userData = getUserFromToken();
    if (!userData) {
      router.push('/login');
      setLoadingUser(false);
      return;
    }
    if (!userData.authorized || !userData.cashRole) {
      toast.error('Acceso no autorizado.');
      router.push('/unauthorized');
      setLoadingUser(false);
      return;
    }
    setUser(userData);
    Promise.all([fetchPaymentMethods(), fetchTransactions()]).finally(() => {
      setLoadingUser(false);
    });
  }, [router]);

  const fetchPaymentMethods = async () => {
    const res = await fetch('/api/caja/medios');
    const data = await res.json();
    if (data.success) {
      setPaymentMethods(data.data);
    }
  };

  const fetchTransactions = async (query: string = '') => {
    const res = await fetch(`/api/caja/transacciones${query}`);
    const data = await res.json();
    if (data.success) {
      setTransactions(data.data);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      } else {
        toast.error('Error al cerrar sesión.');
      }
    } catch (error) {
      toast.error('Ocurrió un error durante el cierre de sesión.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'amount' ? Number(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paymentMethod || !form.concept || form.amount <= 0) {
      toast.error('Completa el formulario correctamente.');
      return;
    }
    try {
      const res = await fetch('/api/caja/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.type,
          concepto: form.concept,
          monto: form.amount,
          medioPago: form.paymentMethod,
          habitacion: form.room || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Transacción registrada.');
        setForm(initialForm);
        fetchTransactions();
      } else {
        toast.error(data.error || 'Error al registrar la transacción.');
      }
    } catch (error) {
      toast.error('Ocurrió un error.');
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = async () => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.medioPago) {
      const method = paymentMethods.find(m => m.name === filters.medioPago);
      if (method?._id) params.append('medioPago', method._id);
    }
    if (filters.habitacion) params.append('habitacion', filters.habitacion);
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    const query = params.toString() ? `?${params.toString()}` : '';
    fetchTransactions(query);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Caja</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Registrar Movimiento
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <FormField
              label="Tipo"
              name="type"
              value={form.type}
              onChange={handleChange}
              type="select"
              options={['Ingreso', 'Salida']}
              required
            />
            <FormField
              label="Concepto"
              name="concept"
              value={form.concept}
              onChange={handleChange}
              required
            />
            <FormField
              label="Monto"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              type="number"
              required
            />
            <FormField
              label="Medio de Pago"
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              type="select"
              options={paymentMethods.map((m) => m.name)}
              required
            />
            <FormField
              label="Habitación"
              name="room"
              value={form.room}
              onChange={handleChange}
            />
            <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-verde-principal text-white rounded-md hover:bg-opacity-90"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Transacciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <FormField
              label="Tipo"
              name="tipo"
              value={filters.tipo}
              onChange={handleFilterChange}
              type="select"
              options={['Ingreso', 'Salida']}
            />
            <FormField
              label="Medio de Pago"
              name="medioPago"
              value={filters.medioPago}
              onChange={handleFilterChange}
              type="select"
              options={paymentMethods.map((m) => m.name)}
            />
            <FormField
              label="Habitación"
              name="habitacion"
              value={filters.habitacion}
              onChange={handleFilterChange}
            />
            <FormField
              label="Fecha Inicio"
              name="fechaInicio"
              value={filters.fechaInicio}
              onChange={handleFilterChange}
              type="date"
            />
            <FormField
              label="Fecha Fin"
              name="fechaFin"
              value={filters.fechaFin}
              onChange={handleFilterChange}
              type="date"
            />
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-verde-principal text-white rounded-md hover:bg-opacity-90"
            >
              Filtrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medio de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Habitación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(txn.dateTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.concept}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof txn.paymentMethod === 'string'
                        ? txn.paymentMethod
                        : txn.paymentMethod.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.room || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

