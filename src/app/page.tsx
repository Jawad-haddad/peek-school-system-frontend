'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // DEMO LOGIN BYPASS (Optional - kept for convenience if API is down)
      if (password === 'demo123') {
        let role = 'ADMIN';
        if (email.includes('teacher')) role = 'TEACHER';
        if (email.includes('parent')) role = 'PARENT';

        console.log(`Demo login: ${role}`);
        localStorage.setItem('token', 'demo-token-' + role.toLowerCase());
        localStorage.setItem('role', role);
        localStorage.setItem('user', JSON.stringify({ name: 'Demo User', role }));

        router.push('/dashboard');
        return;
      }

      // 1. API Request
      // Use full URL or setup a proxy in next.config.mjs to avoid CORS if backend is on different port
      // But assuming localhost:3000/api is correct for Next.js API routes or proxied backend
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log("Login Response:", data);

      if (response.ok) {
        // 2. Success Logic
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('user', JSON.stringify(data.user));

        // 3. Redirect
        router.push('/dashboard');
      } else {
        // 4. Failure Logic
        alert("Login Failed: " + (data.message || 'Unknown error'));
        setError(data.message || 'Login failed');
      }

    } catch (err: any) {
      console.error('Login Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Centered Login Card */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-gray-100">

        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">PEEK System</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage your school</p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="block w-full rounded-lg border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 text-base"
              placeholder="name@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="block w-full rounded-lg border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 text-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center border border-red-100 animate-pulse">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-3 px-4 text-base font-bold text-white shadow-md transition-all 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}
              `}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-gray-400 hover:text-blue-500 transition-colors">
            Forgot password?
          </a>
        </div>

      </div>
    </main>
  );
}