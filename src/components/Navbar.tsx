import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
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
        <div className="flex items-center gap-3">
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
  );
};

export default Navbar;
