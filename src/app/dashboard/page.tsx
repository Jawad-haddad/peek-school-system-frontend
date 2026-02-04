'use client';

import { useState, useEffect } from 'react';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import AdminStats from '@/components/dashboard/AdminStats';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      setRole(storedRole);
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

  // Default Fallback
  return <ParentDashboard />;
}