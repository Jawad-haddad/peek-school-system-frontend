// src/app/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // 👈 1. استيراد أداة الانتقال

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // 👈 2. تجهيز أداة الانتقال

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/users/login', {
        email,
        password,
      });

      // --- 👈 3. المنطق الجديد بعد النجاح ---
      const { token } = response.data;

      // حفظ الـ Token في ذاكرة المتصفح
      localStorage.setItem('authToken', token);

      // إظهار رسالة نجاح مؤقتة
      alert('Login Successful! Redirecting to dashboard...');

      // نقل المستخدم إلى صفحة لوحة التحكم
      router.push('/dashboard');
      // --- نهاية المنطق الجديد ---

    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        {/* ... باقي الكود يبقى كما هو ... */}
        {/* Form and inputs */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input id="email" type="email" required className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" required className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm font-medium text-red-700">{error}</p></div>}
          <div className="text-right"><a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</a></div>
          <div><button type="submit" className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Sign In</button></div>
        </form>
      </div>
    </main>
  );
}