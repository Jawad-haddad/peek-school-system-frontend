// src/app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex bg-gray-100 min-h-screen flex-col md:flex-row">
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-0 md:p-0 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}