import { useState, useEffect } from 'react';
import axios from 'axios';

type MobileHeaderProps = {
  onMenuClick: () => void;
};

// Internal component for status
function ConnectivityDot() {
  const [status, setStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/health', { timeout: 2000 });
        setStatus('online');
      } catch (e) {
        setStatus('offline');
      }
    };

    // Check every 30s
    const interval = setInterval(checkHealth, 30000);
    checkHealth(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`absolute -top-1 -right-2 w-3 h-3 rounded-full border-2 border-gray-800 ${status === 'online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
      title={status === 'online' ? "System Online" : "Backend Disconnected"}
    />
  );
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-gray-800 p-4 text-white md:hidden">
      <div className="flex items-center gap-3">
        <div className="relative">
          <h2 className="text-xl font-bold">Peek System</h2>
          <ConnectivityDot />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <a href="/dashboard/chat" className="p-2 text-white hover:text-gray-300">
          💬
        </a>
        <button
          onClick={onMenuClick}
          className="rounded p-2 hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {/* Hamburger Icon */}
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
