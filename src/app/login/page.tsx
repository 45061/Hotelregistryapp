"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AtamsaLogo from "@/components/AtamsaLogo";
import { useDispatch } from "react-redux";
import { incrementCharge } from "@/store/actions/dateAction";

import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        dispatch(incrementCharge());
        router.push("/");
      } else {
        const data = await res.json();
        toast.error(data.error || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (!forgotPasswordEmail) {
      toast.error("Debes ingresar tu correo.");
      return;
    }

    setSendingResetEmail(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo enviar el correo de recuperación.");
        return;
      }

      toast.success(
        data.message || "Si el correo existe, enviaremos un enlace de recuperación."
      );
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      toast.error("Ocurrió un error al enviar el correo de recuperación.");
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <AtamsaLogo />
        </div>
        <h1 className="font-heading text-3xl font-bold text-center text-gray-900">
          Registro Viajero Login
        </h1>
        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label
                htmlFor="forgot-password-email"
                className="text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                id="forgot-password-email"
                type="email"
                value={forgotPasswordEmail}
                onChange={(event) => setForgotPasswordEmail(event.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-verde-principal focus:border-verde-principal"
              />
              <p className="mt-2 text-sm text-gray-600">
                Te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={sendingResetEmail}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-verde-principal border border-transparent rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-verde-principal disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sendingResetEmail ? "Enviando..." : "Enviar correo de recuperación"}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full px-4 py-2 text-sm font-medium text-verde-principal border border-verde-principal rounded-md shadow-sm hover:bg-gray-50"
              >
                Volver al login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-verde-principal focus:border-verde-principal"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-verde-principal focus:border-verde-principal"
              />
            </div>
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-verde-principal border border-transparent rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-verde-principal"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordEmail(email);
                  setShowForgotPassword(true);
                }}
                className="w-full text-sm font-medium text-verde-principal hover:text-opacity-80"
              >
                Recuperar contraseña
              </button>
            </div>
          </form>
        )}
        <p className="mt-4 text-sm text-center text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-verde-principal hover:text-opacity-80"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
