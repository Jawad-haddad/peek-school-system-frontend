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
        <>
            {/* 1. HEADER SECTION */}
            <div className="dashboard-header">
                <div className="container mx-auto px-4">
                    <h5 className="opacity-75">Welcome back,</h5>
                    <h2 className="text-3xl font-bold">{user?.name || 'Parent'}</h2>
                    {/* Student Switcher / Info here */}
                </div>
            </div>

            {/* 2. MAIN GRID (With negative margin to overlap header) */}
            <div className="container mx-auto px-4 pb-20" style={{ marginTop: '-50px' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* CARD 1: SCHEDULE */}
                    <Link href="/dashboard/schedule" className="card-menu">
                        <div className="flex justify-between items-start">
                            <div className="icon-box bg-light-primary"><i className="fas fa-calendar-alt">📅</i></div>
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">Active</span>
                        </div>
                        <h5 className="font-bold text-lg mb-1">Schedule</h5>
                        <p className="text-gray-500 text-sm">Next: Math (8:00 AM)</p>
                    </Link>

                    {/* CARD 2: ATTENDANCE */}
                    <div className="card-menu">
                        <div className="flex justify-between items-start">
                            <div className="icon-box bg-light-info"><i className="fas fa-user-check">✅</i></div>
                        </div>
                        <h5 className="font-bold text-lg mb-1">Attendance</h5>
                        <p className="text-gray-500 text-sm">Present Today</p>
                    </div>

                    {/* CARD 3: BUS */}
                    <Link href="/dashboard/bus" className="card-menu">
                        <div className="flex justify-between items-start">
                            <div className="icon-box bg-light-warning text-yellow-600"><i className="fas fa-bus">🚌</i></div>
                            <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">Tracking</span>
                        </div>
                        <h5 className="font-bold text-lg mb-1">Bus</h5>
                        <p className="text-gray-500 text-sm">Live Location</p>
                    </Link>

                    {/* CARD 4: SHOP (New) */}
                    <div className="card-menu">
                        <div className="icon-box bg-purple-100 text-purple-600"><i className="fas fa-tshirt">👕</i></div>
                        <h5 className="font-bold text-lg mb-1">Shop</h5>
                        <p className="text-gray-500 text-sm">Buy Uniforms</p>
                    </div>

                    {/* CARD 5: HOMEWORK (Added from previous task integration) */}
                    <Link href="/dashboard/homework" className="card-menu">
                        <div className="icon-box bg-blue-100 text-blue-600"><i className="fas fa-book">📚</i></div>
                        <h5 className="font-bold text-lg mb-1">Homework</h5>
                        <p className="text-gray-500 text-sm">Check Assignments</p>
                    </Link>

                </div>
            </div>
        </>
    );
}
