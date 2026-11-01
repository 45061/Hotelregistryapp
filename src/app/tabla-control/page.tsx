"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReceptionControlTable from "@/components/ReceptionControlTable";

export default function TablaControlPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const currentUser = data.data;
          setUser(currentUser);

          const isAllowed = Boolean(
            currentUser &&
            !currentUser.isWaitress &&
            (currentUser.authorized || currentUser.isAdmin || currentUser.isSuperUser)
          );

          if (!isAllowed) {
            router.push("/unauthorized");
          }
        } else if (response.status === 401) {
          router.push("/login");
        } else {
          router.push("/unauthorized");
        }
      } catch (error) {
        console.error("Error al verificar credenciales:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUserAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-verde-principal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-stone-600">
            Verificando autorización de acceso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-stone-100/60 pb-16">
      {/* Barra superior institucional */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center text-xs text-stone-500 gap-1.5">
            <Link href="/" className="hover:text-verde-principal transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/box" className="hover:text-verde-principal transition-colors">
              Cajas
            </Link>
            <span>/</span>
            <span className="font-semibold text-stone-800">Caja Recepción</span>
          </nav>

          <span className="text-xs bg-emerald-50 text-verde-principal font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            {user.username || user.email || "Usuario Autorizado"}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ReceptionControlTable />
      </div>
    </main>
  );
}
