'use client';

import { useState, useEffect } from 'react';
import api, { request, ApiEnvelopeError } from '@/lib/api';

// ─── Configuration ─────────────────────────────────────────────
const CURRENCY = 'JOD'; // Change this to localize: 'USD', 'EUR', etc.

/** Safely coerce a Prisma Decimal (string | number) to a JS number */
const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Types ─────────────────────────────────────────────────────
type FeeStats = {
    totalOutstanding: number;
    totalStudents: number;
    classes: {
        id: string;
        name: string;
        outstanding: number;
    }[];
};

type StudentFee = {
    id: string;
    name: string;
    outstanding: number;
};

// ─── Component ─────────────────────────────────────────────────
export default function AdminStats() {
    const [view, setView] = useState<'overview' | 'classes' | 'students'>('overview');
    const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);

    const [stats, setStats] = useState<FeeStats | null>(null);
    const [classStudents, setClassStudents] = useState<StudentFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentsError, setStudentsError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await request<FeeStats>(() =>
                api.get('/school/stats/fees', { params: { _t: Date.now() } })
            );

            // Normalize Prisma Decimal fields to JS numbers
            setStats({
                totalOutstanding: toNum(data.totalOutstanding),
                totalStudents: toNum(data.totalStudents),
                classes: (data.classes || []).map((cls: any) => ({
                    id: cls.id,
                    name: cls.name || 'Unknown',
                    outstanding: toNum(cls.outstanding),
                })),
            });
        } catch (error: any) {
            console.error('Failed to fetch admin stats', error);
            // 404 means no finance data exists yet — show empty state, not a hard error
            if (error instanceof ApiEnvelopeError && error.code === 'NOT_FOUND') {
                setStats({ totalOutstanding: 0, totalStudents: 0, classes: [] });
            } else {
                setError(error.message || 'Failed to load stats');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchClassStudents = async (classId: string) => {
        setStudentsLoading(true);
        setStudentsError(null);
        // Clear stale data immediately before fetching new data
        setClassStudents([]);
        try {
            const data = await request<{ students?: any[] } | any[]>(() =>
                api.get(`/school/stats/fees/class/${classId}`, { params: { _t: Date.now() } })
            );
            const students = (Array.isArray(data) ? data : (data as any)?.students ?? []);
            // Normalize Decimal values
            setClassStudents(students.map((s: any) => ({
                id: s.id,
                name: s.name || s.fullName || 'Unknown',
                outstanding: toNum(s.outstanding),
            })));
        } catch (error: any) {
            console.error('Failed to load class students:', error);
            // 404 means no outstanding fees for this class — show empty list
            if (error instanceof ApiEnvelopeError && error.code === 'NOT_FOUND') {
                setClassStudents([]);
            } else {
                setStudentsError(error.message || 'Failed to load student data for this class.');
            }
            setClassStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <h3 className="text-red-800 font-semibold mb-2">Error Loading Stats</h3>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => fetchStats()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4">

            {/* Navigation / Breadcrumb */}
            {view !== 'overview' && (
                <button
                    onClick={() => {
                        if (view === 'students') {
                            setView('classes');
                            setClassStudents([]);     // Clear stale student data
                            setStudentsError(null);
                        } else {
                            setView('overview');
                        }
                    }}
                    className="group flex items-center text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors mb-6 bg-white/50 px-4 py-2 rounded-full w-fit backdrop-blur-sm shadow-sm"
                >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                    Back to {view === 'students' ? 'Classes' : 'Overview'}
                </button>
            )}

            {view === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Fee Card - Premium Viola Gradient */}
                    <div
                        onClick={() => setView('classes')}
                        className="glass-card p-8 rounded-3xl cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform">
                            <span className="text-9xl">💰</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-violet-500 text-sm font-black uppercase tracking-widest mb-1">Outstanding Fees</h3>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                                    {fmt(stats.totalOutstanding)}
                                </span>
                                <span className="text-xl font-bold text-gray-400">{CURRENCY}</span>
                            </div>
                            <div className="mt-6 flex items-center text-violet-600 text-sm font-bold bg-violet-50 w-fit px-3 py-1 rounded-full group-hover:bg-violet-100 transition-colors">
                                <span>View Breakdown</span>
                                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </div>

                    {/* Students Card */}
                    <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <span className="text-9xl">👥</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-cyan-500 text-sm font-black uppercase tracking-widest mb-1">Total Students</h3>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                                    {stats.totalStudents || 0}
                                </span>
                            </div>
                            <p className="mt-6 text-sm text-gray-500 font-medium">Active academic enrollments</p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'classes' && stats && (
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-white/30 bg-white/40">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center">
                            <span className="mr-3 text-2xl">🏫</span> Fee Breakdown by Class
                        </h2>
                    </div>
                    <div className="p-4">
                        <table className="min-w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Class Name</th>
                                    <th className="px-6 py-4 text-right">Outstanding Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {stats.classes?.length > 0 ? (
                                    stats.classes.map((cls) => (
                                        <tr
                                            key={cls.id}
                                            onClick={() => {
                                                setSelectedClass(cls);
                                                fetchClassStudents(cls.id);
                                                setView('students');
                                            }}
                                            className="hover:bg-violet-50/50 cursor-pointer transition-all hover:scale-[1.01] rounded-lg group"
                                        >
                                            <td className="px-6 py-5 text-lg font-bold text-gray-700 group-hover:text-violet-700 transition-colors">{cls.name}</td>
                                            <td className="px-6 py-5 text-lg text-right font-black text-red-500 bg-red-50/0 group-hover:bg-red-50/30 rounded-r-lg transition-colors">
                                                {fmt(cls.outstanding)} <span className="text-xs text-red-300">{CURRENCY}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-gray-400 font-medium">No class data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'students' && selectedClass && (
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-white/30 bg-white/40 flex justify-between items-center">
                        <h2 className="text-2xl font-black text-gray-800">Outstanding: {selectedClass.name}</h2>
                        <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-inner">Unpaid List</span>
                    </div>
                    <div className="p-4">
                        {studentsLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mr-3"></div>
                                <span className="text-gray-500 font-medium">Loading students...</span>
                            </div>
                        ) : studentsError ? (
                            <div className="py-8 text-center">
                                <p className="text-red-500 font-bold mb-3">{studentsError}</p>
                                <button
                                    onClick={() => fetchClassStudents(selectedClass.id)}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-bold"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4 text-right">Amount Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {classStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5 font-bold text-gray-800">{student.name}</td>
                                            <td className="px-6 py-5 text-right font-bold text-red-500">{fmt(student.outstanding)} {CURRENCY}</td>
                                        </tr>
                                    ))}
                                    {classStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-12 text-center text-gray-400 font-medium">No students found with outstanding fees.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
