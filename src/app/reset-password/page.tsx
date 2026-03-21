"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AtamsaLogo from "@/components/AtamsaLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasValidParams = useMemo(() => Boolean(token && email), [token, email]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasValidParams) {
      toast.error("El enlace de recuperación es inválido.");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo restablecer la contraseña.");
        return;
      }

      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.push("/login");
    } catch (error) {
      toast.error("Ocurrió un error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="flex justify-center">
          <AtamsaLogo />
        </div>

        <h1 className="mt-6 text-center font-heading text-3xl font-bold text-gray-900">
          Restablecer contraseña
        </h1>

        {!hasValidParams ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-gray-600">
              El enlace de recuperación es inválido o incompleto.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-md bg-verde-principal px-4 py-2 text-sm font-medium text-white"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-verde-principal"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-verde-principal"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-verde-principal px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Actualizando..." : "Guardar nueva contraseña"}
            </button>

            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="font-medium text-verde-principal hover:text-opacity-80">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
