"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isAdmin: boolean;
  isSuperUser: boolean;
  authorized: boolean;
  isWaitress: boolean; // Added
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData.data);
          if (!userData.data.isSuperUser) {
            router.push("/unauthorized");
          }
        } else if (res.status === 401) {
          router.push("/login");
        } else {
          router.push("/unauthorized");
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    if (!loadingUser && currentUser && currentUser.isSuperUser) {
      fetchUsers();
    }
  }, [loadingUser, currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch users.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleProperty = async (
    userId: string,
    property: "isAdmin" | "authorized" | "isWaitress", // Added "isWaitress"
    currentValue: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [property]: !currentValue }),
        }
      );

      if (res.ok) {
        toast.success(`User ${property} status updated!`);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || `Failed to update user ${property} status.`);
      }
    } catch (error) {
      toast.error(`An error occurred while updating user ${property} status.`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/unauthorized");
      } else {
        toast.error("Failed to logout.");
      }
    } catch (error) {
      toast.error("An error occurred during logout.");
    }
  };

  if (loadingUser || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Cargando...
      </div>
    );
  }

  if (!currentUser || !currentUser.isSuperUser) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SuperAdmin</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Autorizado</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mesero(a)</th> {/* Added */}
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.email}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.firstName} {user.lastName}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.phoneNumber}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={user.isAdmin}
                        onChange={() => handleToggleProperty(user._id, "isAdmin", user.isAdmin)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={user.isSuperUser}
                        disabled // SuperAdmin status should not be editable from here
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={user.authorized}
                        onChange={() => handleToggleProperty(user._id, "authorized", user.authorized)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={user.isWaitress}
                        onChange={() => handleToggleProperty(user._id, "isWaitress", user.isWaitress)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                      {/* Add any other actions here if needed */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
