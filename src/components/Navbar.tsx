import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AtamsaLogo from "./AtamsaLogo";

interface NavbarProps {
  user: any;
  onLogout: () => Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
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
        <AtamsaLogo />
        <h1 className="ml-4 font-heading text-2xl font-bold text-gray-900">
          Traveler Registry
        </h1>
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
          </div>
        </nav>
      )}
      {user && user.authorized && (
        <button
          onClick={onLogout}
          className="px-4 py-2 font-bold text-white rounded bg-verde-principal hover:bg-opacity-90"
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default Navbar;
