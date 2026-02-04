'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define all possible menu items
const ALL_MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠', roles: ['ADMIN', 'TEACHER', 'PARENT'] },
  { name: 'Chat', href: '/dashboard/chat', icon: '💬', roles: ['ADMIN', 'PARENT', 'TEACHER'] }, // Assuming chat is for everyone
  { name: 'Students', href: '/dashboard/students', icon: '🎓', roles: ['ADMIN'] },
  { name: 'Teachers', href: '/dashboard/teachers', icon: '👨‍🏫', roles: ['ADMIN'] },
  { name: 'Classes', href: '/dashboard/classes', icon: '🏫', roles: ['ADMIN'] },
  { name: 'Subjects', href: '/dashboard/subjects', icon: '📚', roles: ['ADMIN'] },
  { name: 'Timetable', href: '/dashboard/timetable', icon: '🗓️', roles: ['ADMIN'] },
  { name: 'Exams', href: '/dashboard/exams', icon: '📝', roles: ['ADMIN'] },
  { name: 'Reports', href: '/dashboard/reports', icon: '📊', roles: ['ADMIN'] },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', roles: ['ADMIN'] },

  // Teacher Specific
  // Note: If teacher dashboard is separate, these might link to subsections or just be part of the main dash
  { name: 'My Schedule', href: '/dashboard/schedule', icon: '📅', roles: ['TEACHER'] },
  { name: 'Attendance', href: '/dashboard/attendance', icon: '✅', roles: ['TEACHER'] },
  { name: 'Homework', href: '/dashboard/homework', icon: '📚', roles: ['TEACHER', 'PARENT'] }, // Parent view vs Teacher manage
  { name: 'Gradebook', href: '/dashboard/gradebook', icon: '💯', roles: ['TEACHER'] },

  // Parent Specific (Some overlap with features, but explicit links)
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
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gray-800 text-white transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="border-b border-gray-700 p-4 text-center">
          <h2 className="text-2xl font-bold">Peek System</h2>
          {role && <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{role}</p>}
        </div>

        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose()}
              className="flex items-center rounded-md px-3 py-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <span className="mr-3 text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
