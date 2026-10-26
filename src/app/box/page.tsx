"use client";

import React, { useState, useEffect } from 'react';
import BoxForm from '@/components/BoxForm';
import BoxList, { BoxData } from '@/components/BoxList';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const BoxPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingBox, setEditingBox] = useState<BoxData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Basic check for authorization - more robust check in middleware
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          toast.error('No autorizado. Por favor, inicia sesión.');
          router.push('/login');
        } else {
          const data = await res.json();
          if (!data.data || !data.data.authorized) {
            toast.error('No tienes permisos para acceder a esta página.');
            router.push('/unauthorized');
          } else {
            setUser(data.data);
          }
        }
      } catch (error) {
        toast.error('Error de autenticación. Por favor, intenta de nuevo.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleBoxCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingBox(null); // Clear editing state after creation
  };

  const handleEdit = (box: BoxData) => {
    setEditingBox(box);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBox(null);
  };

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold font-heading mb-6 text-center text-stone-800">
        Gestión de Cajas
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-6">
        <h2 className="text-2xl font-semibold font-heading mb-4 text-verde-principal">
          {editingBox ? 'Editar Caja' : 'Crear Nueva Caja'}
        </h2>
        <BoxForm
          onBoxCreated={handleBoxCreated}
          editingBox={editingBox}
          onCancelEdit={handleCancelEdit}
          isSuperUser={Boolean(user?.isSuperUser)}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-semibold font-heading mb-4 text-verde-principal">
          Cajas Registradas
        </h2>
        <BoxList
          refreshTrigger={refreshTrigger}
          onEdit={handleEdit}
          user={user}
        />
      </div>
    </div>
  );
};

export default BoxPage;
