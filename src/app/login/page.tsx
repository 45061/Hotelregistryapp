
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AtamsaLogo from '@/components/AtamsaLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
      }
    } catch (error) {
      setError('Something went wrong.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        

        <div className="flex justify-center">
          <AtamsaLogo />
        </div>
        <h1 className="font-heading text-3xl font-bold text-center text-gray-900">ATAMSA Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-verde-principal border border-transparent rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-verde-principal"
            >
              Login
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-verde-principal hover:text-opacity-80">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
