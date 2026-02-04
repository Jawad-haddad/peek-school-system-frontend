'use client';

type MobileHeaderProps = {
  onMenuClick: () => void;
};

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-gray-800 p-4 text-white md:hidden">
      <h2 className="text-xl font-bold">Peek System</h2>
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
