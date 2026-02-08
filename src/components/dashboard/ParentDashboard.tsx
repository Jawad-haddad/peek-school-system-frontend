'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock user type
type User = {
    name: string;
    role: string;
};

export default function ParentDashboard() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Fetch user from localStorage or API
        const storedUser = localStorage.getItem('user'); // Assuming you might have a user object
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Fallback if parsing fails
                const role = localStorage.getItem('role') || 'Parent';
                setUser({ name: 'Guardian', role: role });
            }
        } else {
            // Default Fallback
            const role = localStorage.getItem('role') || 'Parent';
            setUser({ name: 'Guardian', role: role });
        }
    }, []);

    return (
        <div className="min-h-screen">
            {/* 1. HEADER SECTION - Floating Glass Panel */}
            <div className="mb-8">
                <div className="glass-panel p-8 rounded-3xl text-center md:text-left flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h5 className="text-violet-500 font-bold uppercase tracking-widest text-sm mb-2">Welcome back</h5>
                        <h2 className="text-4xl font-black text-gray-800 tracking-tight">{user?.name || 'Parent'}</h2>
                    </div>

                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-violet-200/50 to-fuchsia-200/50 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* 2. MAIN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">

                {/* CARD 1: SCHEDULE */}
                <Link href="/dashboard/schedule" className="glass-card p-6 rounded-3xl group relative overflow-hidden hover:scale-105 transition-transform duration-300">
                    <div className="absolute top- right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">📅</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100/50 flex items-center justify-center text-2xl text-indigo-600 shadow-sm">
                            📅
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-green-200">ACTIVE</span>
                    </div>
                    <h5 className="font-extrabold text-xl text-gray-800 mb-1">Schedule</h5>
                    <p className="text-gray-500 text-sm font-medium">Next: Math (8:00 AM)</p>
                </Link>

                {/* CARD 2: ATTENDANCE */}
                <div className="glass-card p-6 rounded-3xl group relative overflow-hidden hover:scale-105 transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">✅</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-100/50 flex items-center justify-center text-2xl text-teal-600 shadow-sm">
                            ✅
                        </div>
                    </div>
                    <h5 className="font-extrabold text-xl text-gray-800 mb-1">Attendance</h5>
                    <p className="text-gray-500 text-sm font-medium">Present Today</p>
                </div>

                {/* CARD 3: BUS */}
                <Link href="/dashboard/bus" className="glass-card p-6 rounded-3xl group relative overflow-hidden hover:scale-105 transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">🚌</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100/50 flex items-center justify-center text-2xl text-amber-600 shadow-sm">
                            🚌
                        </div>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-amber-200">TRACKING</span>
                    </div>
                    <h5 className="font-extrabold text-xl text-gray-800 mb-1">Bus</h5>
                    <p className="text-gray-500 text-sm font-medium">Live Location</p>
                </Link>

                {/* CARD 4: SHOP (New) */}
                <div className="glass-card p-6 rounded-3xl group relative overflow-hidden hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100/50 flex items-center justify-center text-2xl text-purple-600 shadow-sm">
                            👕
                        </div>
                    </div>
                    <h5 className="font-extrabold text-xl text-gray-800 mb-1">Shop</h5>
                    <p className="text-gray-500 text-sm font-medium">Buy Uniforms</p>
                </div>

                {/* CARD 5: HOMEWORK */}
                <Link href="/dashboard/homework" className="glass-card p-6 rounded-3xl group relative overflow-hidden hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100/50 flex items-center justify-center text-2xl text-blue-600 shadow-sm">
                            📚
                        </div>
                    </div>
                    <h5 className="font-extrabold text-xl text-gray-800 mb-1">Homework</h5>
                    <p className="text-gray-500 text-sm font-medium">Check Assignments</p>
                </Link>

            </div>
        </div>
    );
}
