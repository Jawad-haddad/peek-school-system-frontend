// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// You can replace these with actual icons from a library like 'react-icons' later
const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Students', href: '/dashboard/students', icon: '🎓' },
  { name: 'Teachers', href: '/dashboard/teachers', icon: '👨‍🏫' },
  { name: 'Classes', href: '/dashboard/classes', icon: '🏫' },
  // 🛑 🛑 🛑 أضف السطر التالي هنا 🛑 🛑 🛑
  { name: 'Subjects', href: '/dashboard/subjects', icon: '📚' },
  // 🛑 🛑 🛑 نهاية الإضافة 🛑 🛑 🛑
  { name: 'Timetable', href: '/dashboard/timetable', icon: '🗓️' },
  { name: 'Exams', href: '/dashboard/exams', icon: '📝' },
  { name: 'Reports', href: '/dashboard/reports', icon: '📊' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const router = useRouter(); 

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-800 text-white">
      <div className="border-b border-gray-700 p-4 text-center">
        <h2 className="text-2xl font-bold">Peek System</h2>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center rounded-md py-2 px-3 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-700 p-4">
        <button 
          onClick={handleLogout} 
          className="flex w-full items-center rounded-md py-2 px-3 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
        >
          <span className="mr-3 text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}