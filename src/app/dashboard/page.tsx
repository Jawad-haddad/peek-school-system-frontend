'use client';

import { useState, useEffect } from 'react';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import AdminStats from '@/components/dashboard/AdminStats';
import { getSafeUser, logout } from '@/lib/auth';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getSafeUser();
      if (!user) return; // getSafeUser() will trigger the redirect internally if malformed

      setRole(user.role);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        <AdminStats />
      </div>
    );
  }

  if (role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  if (role === 'PARENT') {
    return <ParentDashboard />;
  }

  // Graceful degradation for unrecognised/missing roles
  return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <div className="text-center bg-red-50 p-8 rounded-3xl border border-red-100 max-w-lg shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-red-900 mb-2">Invalid Access Role</h2>
        <p className="text-red-700 mb-6">
          Your account does not have a recognized role assigned to it, or your session data is incomplete.
        </p>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}