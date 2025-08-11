'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const UnauthorizedPage = () => {
  const router = useRouter();

  const handleLoginRedirect = async () => {
    try {
      // Call the logout API to clear the token/session
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Sesión cerrada. Redirigiendo al inicio de sesión...');
      } else {
        toast.error('Error al cerrar la sesión. Redirigiendo de todas formas...');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error de red al intentar cerrar sesión. Redirigiendo...');
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso No Autorizado</h1>
        <p className="text-gray-700 mb-6">
          Para acceder a esta página, por favor, solicita autorización al administrador.
        </p>
        <button
          onClick={handleLoginRedirect}
          className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;