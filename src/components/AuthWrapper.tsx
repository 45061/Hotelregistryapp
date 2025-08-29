"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openBox, setOpenBox] = useState<any>(null);
  const router = useRouter();
  const { charge } = useSelector((state: any) => state.dateReducer);

  const fetchUserAndBoxes = useCallback(async () => {
    setLoading(true);
    
    try {
      const userRes = await fetch('/api/auth/me');
      
      if (userRes.ok) {
        const userData = await userRes.json();
        
        if (userData.success) {
          setUser(userData.data);
          
          
          const openBoxRes = await fetch('/api/boxes/openBoxForUser');
          
          if (openBoxRes.ok) {
            const openBoxData = await openBoxRes.json();
            
            setOpenBox(openBoxData.data);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user or boxes in AuthWrapper:', error);
      setUser(null);
    } finally {
      setLoading(false);
      
    }
  }, []);

  useEffect(() => {
    fetchUserAndBoxes();
  }, [charge, fetchUserAndBoxes]);

  

  const handleLogout = async () => {
    if (loading) {
      console.log("Logout prevented: still loading.");
      return; // Prevent logout if still loading
    }

    try {
      if (openBox) {
        const lastOpeningDate = new Date(openBox.lastOpening);

        const cashReseivedInThisBox = (openBox?.cashReseived || [])
          .filter((pay: any) => new Date(pay.createdAt) > lastOpeningDate)
          .filter((pay: any) => pay.typePayment === "Efectivo")
          .map((pay: any) => pay.cash)
          .reduce((total: any, value: any) => total + value, 0);

        const cashWithdrawedInThisBox = (openBox?.cashWithdrawn || [])
          .filter((pay: any) => new Date(pay.createdAt) > lastOpeningDate)
          .map((pay: any) => pay.cash)
          .reduce((total: any, value: any) => total + value, 0);

        const existingBalance = cashReseivedInThisBox + openBox.initialBalance - cashWithdrawedInThisBox;

        console.log("Sending PUT request to close box with data:", {
          activeBox: false,
          lastClosingBalance: existingBalance,
          lastClosing: new Date().toISOString(),
          userIdCloseBox: user.id,
        });

        const closeBoxRes = await fetch(`/api/boxes/${openBox._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activeBox: false,
            lastClosingBalance: existingBalance,
            lastClosing: new Date().toISOString(),
            userIdCloseBox: user.id,
          }),
        });

        console.log("closeBoxRes.ok:", closeBoxRes.ok);
        if (!closeBoxRes.ok) {
          const errorData = await closeBoxRes.json();
          console.error("Error closing box:", errorData);
          toast.error('No se pudo cerrar la caja abierta antes de salir.');
          console.log("Returning after close box error.");
          return;
        }
        console.log("Box closed successfully, proceeding with logout.");
      }

      const logoutRes = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      const logoutData = await logoutRes.json();
      if (logoutData.success) {
        toast.success('Sesión cerrada con éxito!');
        setUser(null);
        setOpenBox(null);
        router.push('/login');
      } else {
        toast.error(logoutData.error || 'Error al cerrar sesión.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error de red o del servidor al cerrar sesión.');
    }
  };

  
  return (
    <>
      <Navbar user={user} onLogout={handleLogout} loading={loading} />
      {children}
    </>
  );
};

export default AuthWrapper;