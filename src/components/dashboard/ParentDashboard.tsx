'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WalletHistoryList from './WalletHistoryList';
import TopUpModal from './TopUpModal'; // NEW
import api, { academicApi, schoolApi } from '@/lib/api';
import { getSafeUser } from '@/lib/auth';

type User = {
    name: string;
    role: string;
    studentId?: string; // Added studentId to User type
};

export default function ParentDashboard() {
    const [user, setUser] = useState<User | null>(null);


    const [subjects, setSubjects] = useState<any[]>([]);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false); // NEW

    useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Get User/Student
            const parsedUser = getSafeUser();
            if (parsedUser) {
                setUser(parsedUser);

                // If user has a studentId (Parent/Student login), fetch their class teachers
                if (parsedUser.studentId) {
                    try {
                        // Fetch the student profile to get classId for loading teachers
                        const studentRes = await api.get(`/student/${parsedUser.studentId}/profile`);
                        const classId = studentRes.data?.classId;
                        if (classId) {
                            const teachersRes = await api.get(`/academics/classes/${classId}/teachers`);
                            // Teachers data can be used to display class teachers
                        }
                    } catch (err) {
                        // Non-critical — dashboard still usable without teacher list
                    }
                }
            }
        };
        fetchDashboardData();
    }, []);

    // NEW EFFECT for Teacher Fetching
    // NEW EFFECT for Teacher Fetching
    useEffect(() => {
        if (!user || (!user.studentId && user.role !== 'Student')) return;

        const loadTeachers = async () => {
            // Determine Student ID to use
            const targetStudentId = user.studentId || (user.role === 'Student' ? (user as any).id : null);
            if (!targetStudentId) return;

            try {
                // 1. Fetch Student Profile to get Class ID
                const studentRes = await schoolApi.fetchStudent(targetStudentId);
                const studentData = studentRes.data.student || studentRes.data;

                if (studentData && studentData.classId) {
                    // 2. Fetch Subjects for that Class (which contain teacher info)
                    const subjectsRes = await academicApi.fetchClassSubjects(studentData.classId);
                    setSubjects(subjectsRes.data.subjects || subjectsRes.data || []);
                }
            } catch (e) {
                console.error("Failed to load subjects", e);
            }
        };
        loadTeachers();
    }, [user]);

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
                    <p className="text-gray-500 text-sm font-medium">View Schedule</p>
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
                    <p className="text-gray-500 text-sm font-medium">View Attendance</p>
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



            {/* 2.5 MY TEACHERS (via Subjects) SECTION */}
            {
                subjects.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-xl">👨‍🏫</span>
                            My Teachers & Subjects
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjects.map((sub: any) => (
                                <div key={sub.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {sub.name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{sub.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {sub.teacher ? sub.teacher.fullName || sub.teacher.name : 'No Teacher Assigned'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* 3. WALLET HISTORY SECTION */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <span className="bg-green-100 text-green-600 p-1.5 rounded-lg text-xl">💳</span>
                        Wallet History
                    </h3>
                    <button
                        onClick={() => setIsTopUpOpen(true)}
                        className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span>+</span> Top Up
                    </button>
                </div>
                <WalletHistoryList studentId={user?.studentId || ''} />
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                studentId={user?.studentId || ''}
                onSuccess={() => {
                    // Start a refresh or just close
                    // Ideally we refresh the balance in the header if we had one
                    window.location.reload(); // Simple refresh to update balance everywhere
                }}
            />
        </div >
    );
}
