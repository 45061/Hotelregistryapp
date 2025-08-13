'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Navbar from '@/components/Navbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesData {
  totalIncome: number;
  incomeByRoom: Record<string, number>;
}

export default function SalesReportPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          if (!userData.data.isAdmin) {
            toast.error('Acceso no autorizado.');
            router.push('/unauthorized');
          } else {
            setUser(userData.data);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleFetchData = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, selecciona un rango de fechas.');
      return;
    }
    setLoading(true);
    try {
      let url = `/api/admin/sales?startDate=${startDate}&endDate=${endDate}`;
      if (headquarters) {
        url += `&headquarters=${headquarters}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSalesData(data.data);
      } else {
        toast.error(data.error || 'Error al cargar los datos.');
      }
    } catch (error) {
      toast.error('Ocurrió un error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const barChartData = {
    labels: salesData ? Object.keys(salesData.incomeByRoom) : [],
    datasets: [
      {
        label: 'Ingresos por Habitación',
        data: salesData ? Object.values(salesData.incomeByRoom) : [],
        backgroundColor: 'rgba(30, 108, 70, 0.6)',
        borderColor: '#1E6C46',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: salesData ? Object.keys(salesData.incomeByRoom) : [],
    datasets: [
      {
        data: salesData ? Object.values(salesData.incomeByRoom) : [],
        backgroundColor: [
          '#1E6C46',
          '#FFE600',
          '#2a9d8f',
          '#e9c46a',
          '#f4a261',
          '#e76f51',
        ],
        hoverBackgroundColor: [
          '#1E6C46',
          '#FFE600',
          '#2a9d8f',
          '#e9c46a',
          '#f4a261',
          '#e76f51',
        ],
      },
    ],
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null; // Or a redirect component
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={() => router.push('/login')} />
      <main className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Informe de Ventas</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Fecha de Fin
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleFetchData}
              disabled={loading}
              className="px-4 py-2 bg-verde-principal text-white rounded-md hover:bg-opacity-90 transition-colors duration-200 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Generar Informe'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setHeadquarters('')} className={`px-4 py-2 rounded-md ${!headquarters ? 'bg-verde-principal text-white' : 'bg-gray-200'}`}>Todos</button>
            <button onClick={() => setHeadquarters('Oporto 83')} className={`px-4 py-2 rounded-md ${headquarters === 'Oporto 83' ? 'bg-verde-principal text-white' : 'bg-gray-200'}`}>Oporto 83</button>
            <button onClick={() => setHeadquarters('Natural Sevgi')} className={`px-4 py-2 rounded-md ${headquarters === 'Natural Sevgi' ? 'bg-verde-principal text-white' : 'bg-gray-200'}`}>Natural Sevgi</button>
          </div>
        </div>

        {salesData && (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ingresos Totales: ${salesData.totalIncome.toFixed(2)}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ingresos por Habitación (Barras)</h3>
                <Bar data={barChartData} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ingresos por Habitación (Circular)</h3>
                <Pie data={pieChartData} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}