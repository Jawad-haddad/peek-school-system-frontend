'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define all possible menu items
const ALL_MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠', roles: ['ADMIN', 'TEACHER', 'PARENT'] },
  { name: 'Chat', href: '/dashboard/chat', icon: '💬', roles: ['ADMIN', 'PARENT', 'TEACHER'] },

  // Admin
  { name: 'Classes', href: '/dashboard/classes', icon: '🏫', roles: ['ADMIN'] },
  { name: 'Teachers', href: '/dashboard/teachers', icon: '👨‍🏫', roles: ['ADMIN'] },
  { name: 'Subjects', href: '/dashboard/subjects', icon: '📚', roles: ['ADMIN'] },
  { name: 'Timetable', href: '/dashboard/timetable', icon: '🗓️', roles: ['ADMIN'] },
  { name: 'Exams', href: '/dashboard/exams', icon: '📝', roles: ['ADMIN'] },
  { name: 'Reports', href: '/dashboard/reports', icon: '📊', roles: ['ADMIN'] },
  { name: 'Broadcast', href: '/dashboard/broadcast', icon: '📢', roles: ['ADMIN'] },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', roles: ['ADMIN'] },

  // Teacher
  { name: 'My Schedule', href: '/dashboard/schedule', icon: '📅', roles: ['TEACHER'] },
  { name: 'Attendance', href: '/dashboard/attendance', icon: '✅', roles: ['TEACHER'] },
  { name: 'Homework', href: '/dashboard/homework', icon: '📚', roles: ['TEACHER', 'PARENT'] },
  { name: 'Gradebook', href: '/dashboard/exams/gradebook', icon: '💯', roles: ['TEACHER'] },

  // Parent
  { name: 'Results', href: '/dashboard/results', icon: '📊', roles: ['PARENT'] },
  { name: 'Shop', href: '/dashboard/shop', icon: '🛒', roles: ['PARENT'] },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    // Get role from localStorage
    const storedRole = localStorage.getItem('role') || localStorage.getItem('userRole'); // Check both keys just in case
    const normalizedRole = storedRole ? storedRole.toUpperCase() : null;
    setRole(normalizedRole);

    if (normalizedRole) {
      const filteredItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(normalizedRole));
      setMenuItems(filteredItems);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[calc(100vh-2rem)] w-64 flex-col glass-panel text-gray-800 transition-transform duration-300 md:relative md:translate-x-0 m-4 rounded-3xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 text-center border-b border-white/20">
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Peek</h2>
          {role && <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-violet-100 text-violet-600 tracking-wider shadow-sm border border-violet-200">{role}</span>}
        </div>

        <nav className="flex-1 space-y-3 p-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose()}
              className="group flex items-center rounded-xl px-4 py-3 text-gray-600 transition-all hover:bg-white/60 hover:shadow-md hover:text-violet-700 hover:scale-105 active:scale-95"
            >
              <span className="mr-4 text-xl group-hover:animate-bounce shadow-sm p-2 bg-white rounded-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/20">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center justify-center rounded-xl px-4 py-3 text-white bg-gradient-to-r from-red-400 to-red-500 shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-600 transition-all transform hover:-translate-y-1"
          >
            <span className="mr-2 text-lg">🚪</span>
            <span className="font-bold">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
