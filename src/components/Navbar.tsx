import React, { useState } from "react";
import Link from "next/link";

interface NavbarProps {
  user: any;
  onLogout: () => Promise<void>;
  loading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, loading }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="flex items-center">
        <Link href="/">
          <h1 className="ml-4 font-heading text-2xl font-bold text-gray-900">
            Traveler Registry
          </h1>
        </Link>
      </div>
      {user && user.authorized && (
        <nav className="relative">
          <button
            onClick={toggleDropdown}
            className="px-4 py-2 font-bold text-white rounded bg-verde-principal hover:bg-opacity-90"
          >
            Navigation
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${
              isDropdownOpen ? "block" : "hidden"
            }`}
          >
            <Link
              href="/"
              className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
              onClick={closeDropdown}
            >
              Traveler Registry
            </Link>
            {user.isSuperUser && (
              <Link
                href="/admin/users"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                User Management
              </Link>
            )}
            {user.isAdmin && (
              <Link
                href="/admin/sales"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                Informe de Ventas
              </Link>
            )}
            {user.authorized && (
              <Link
                href="/box"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                Gestión de Cajas
              </Link>
            )}
            {user.authorized && (
              <Link
                href="/room-management"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                Room Management
              </Link>
            )}
          </div>
        </nav>
      )}
      {user && user.authorized && (
        <button
          onClick={onLogout}
          disabled={loading}
          className="px-4 py-2 font-bold text-white rounded bg-verde-principal hover:bg-opacity-90 disabled:bg-gray-400"
        >
          {loading ? 'Cerrando...' : 'Logout'}
        </button>
      )}
    </header>
  );
};

export default Navbar;