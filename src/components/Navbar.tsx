import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AtamsaLogo from "@/components/AtamsaLogo";

interface UserPropData {
  authorized: boolean;
  isWaitress: boolean;
  isAdmin: boolean;
  isSuperUser: boolean;
}

interface NavbarProps {
  user: UserPropData | null;
  onLogout: () => Promise<void>;
  loading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, loading }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openBoxes, setOpenBoxes] = useState<any[]>([]);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const fetchOpenBoxes = async () => {
    try {
      const res = await fetch("/api/boxes");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOpenBoxes(json.data.filter((b: any) => Boolean(b.activeBox)));
      }
    } catch (err) {
      console.error("Error fetching open boxes in navbar:", err);
    }
  };

  useEffect(() => {
    if (user && (user.authorized || user.isWaitress)) {
      fetchOpenBoxes();
      const interval = setInterval(fetchOpenBoxes, 30000);
      const handleFocus = () => fetchOpenBoxes();
      window.addEventListener("focus", handleFocus);
      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [user, pathname]);

  const handleGoToBox = () => {
    if (openBoxes.length === 1) {
      router.push(`/box/${openBoxes[0]._id}`);
    } else if (openBoxes.length > 1) {
      setIsBoxModalOpen(true);
    }
  };

  const handleSelectBox = (boxId: string) => {
    setIsBoxModalOpen(false);
    router.push(`/box/${boxId}`);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-stone-200 shadow-sm sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <AtamsaLogo size="small" />
          <div className="flex flex-col">
            <span className="font-heading text-2xl font-bold tracking-wider text-verde-principal group-hover:text-verde-oscuro transition-colors">
              ATAMSA
            </span>
            <span className="text-[11px] font-medium tracking-wide text-stone-500 uppercase -mt-1 hidden sm:block">
              Registro & Control Hotelero
            </span>
          </div>
        </Link>
      </div>

      {/* Actions & Navigation */}
      {user && (user.authorized || user.isWaitress) && (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Ir a Caja si hay cajas abiertas */}
          {openBoxes.length > 0 && (
            <button
              type="button"
              onClick={handleGoToBox}
              className="relative inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              title={
                openBoxes.length === 1
                  ? `Ir a ${openBoxes[0].nameBox} (Caja abierta)`
                  : `Ver las ${openBoxes.length} cajas abiertas`
              }
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>Ir a caja</span>
              {openBoxes.length > 1 && (
                <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] sm:text-[11px] font-extrabold text-white">
                  {openBoxes.length}
                </span>
              )}
            </button>
          )}

          <nav className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={toggleDropdown}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-sm text-white rounded-xl bg-verde-principal hover:bg-verde-oscuro transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-verde-principal/30"
              aria-expanded={isDropdownOpen}
            >
              <span>Navegación</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Módulos
                </div>

                {!user.isWaitress && (
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                    onClick={closeDropdown}
                  >
                    <span>Registro de Huéspedes</span>
                  </Link>
                )}

                <Link
                  href="/calendar"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                  onClick={closeDropdown}
                >
                  <span>Calendario de Reservas</span>
                </Link>

                {(user.authorized || user.isWaitress) && (
                  <Link
                    href="/room-management"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                    onClick={closeDropdown}
                  >
                    <span>Gestión de Habitaciones</span>
                  </Link>
                )}

                {user.authorized && (
                  <Link
                    href="/box"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                    onClick={closeDropdown}
                  >
                    <span>Gestión de Cajas</span>
                  </Link>
                )}

                {(user.isAdmin || user.isSuperUser) && (
                  <>
                    <div className="my-1.5 border-t border-stone-100" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Administración
                    </div>
                  </>
                )}

                {user.isAdmin && (
                  <Link
                    href="/admin/sales"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                    onClick={closeDropdown}
                  >
                    <span>Informe de Ventas</span>
                  </Link>
                )}

                {user.isSuperUser && (
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-verde-principal/10 hover:text-verde-principal font-medium transition-colors"
                    onClick={closeDropdown}
                  >
                    <span>Gestión de Usuarios</span>
                  </Link>
                )}
              </div>
            )}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            disabled={loading}
            className="px-3.5 py-2 font-semibold text-sm text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:bg-stone-200 disabled:opacity-60"
          >
            {loading ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </header>

    {/* Modal para seleccionar caja abierta si hay 2 o más */}
    {isBoxModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsBoxModalOpen(false);
        }}
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-stone-900">
                  Seleccionar Caja Abierta
                </h3>
                <p className="text-xs text-stone-500">
                  Hay {openBoxes.length} cajas activas en este momento
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBoxModalOpen(false)}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto p-5">
            <p className="mb-2 text-xs font-medium text-stone-600">
              Elige a cuál de las cajas abiertas deseas ingresar:
            </p>

            {openBoxes.map((box) => (
              <button
                key={box._id}
                type="button"
                onClick={() => handleSelectBox(box._id)}
                className="group flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white p-3.5 text-left shadow-sm transition hover:border-verde-principal hover:bg-verde-principal/5 focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate font-heading font-bold text-stone-900 transition-colors group-hover:text-verde-principal">
                      {box.nameBox}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {box.userIdOpenBox?.firstName
                      ? `Abierta por ${box.userIdOpenBox.firstName} ${box.userIdOpenBox.lastName || ""}`
                      : "Caja en funcionamiento"}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-1.5 text-xs font-bold text-verde-principal transition-transform group-hover:translate-x-0.5">
                  <span>Ingresar</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-stone-100 bg-stone-50/80 px-5 py-3">
            <button
              type="button"
              onClick={() => setIsBoxModalOpen(false)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 transition-colors hover:bg-stone-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default Navbar;
