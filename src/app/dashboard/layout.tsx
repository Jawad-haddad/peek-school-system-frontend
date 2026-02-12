// src/app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import AuthGuard from '@/components/auth/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row relative">
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area - Taking remaining space */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-64px)] md:h-screen transition-all">
          <ErrorBoundary>
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </AuthGuard>
  );
}