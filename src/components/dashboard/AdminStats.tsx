'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

export default function AdminStats() {
    const [view, setView] = useState<'overview' | 'classes' | 'students'>('overview');
    const [selectedClass, setSelectedClass] = useState<{ id: string, name: string } | null>(null);

    const [stats, setStats] = useState<FeeStats | null>(null);
    const [classStudents, setClassStudents] = useState<StudentFee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/stats/fees');
            setStats(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
            // Fallback for demo if API fails with empty state to avoid broken UI
            setStats({
                totalOutstanding: 0,
                totalStudents: 0,
                classes: []
            });
            setLoading(false);
        }
    };

    const fetchClassStudents = async (classId: string) => {
        try {
            // Placeholder: Connect to real endpoint when available
            // const res = await api.get(`/stats/fees/class/${classId}`);
            setClassStudents([]);
        } catch (error) {
            console.error("Failed to fetch class details", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

    return (
        <div className="space-y-6">

            {/* Navigation / Breadcrumb */}
            {view !== 'overview' && (
                <button
                    onClick={() => {
                        if (view === 'students') setView('classes');
                        else setView('overview');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4 font-medium transition-colors"
                >
                    ← Back to {view === 'students' ? 'Classes' : 'Overview'}
                </button>
            )}

            {view === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Fee Card - Viola Gradient */}
                    <div
                        onClick={() => setView('classes')}
                        className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl shadow-sm border border-red-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider">Outstanding Fees</h3>
                                <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.totalOutstanding?.toFixed(2) || '0.00'} <span className="text-lg text-gray-500 font-normal">JOD</span></p>
                            </div>
                            <div className="p-3 bg-white/80 rounded-xl shadow-sm text-xl backdrop-blur-sm">
                                💰
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-red-600 text-xs font-medium">
                            <span>View Breakdown</span>
                            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>

                    {/* Students Card - Viola Style */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-indigo-500 text-xs font-bold uppercase tracking-wider">Total Students</h3>
                                <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.totalStudents || 0}</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 text-xl">
                                👥
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                            Active enrollments
                        </div>
                    </div>
                </div>
            )}

            {view === 'classes' && stats && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800">Fee Breakdown by Class</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class Name</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {stats.classes.map((cls) => (
                                <tr
                                    key={cls.id}
                                    onClick={() => {
                                        setSelectedClass(cls);
                                        fetchClassStudents(cls.id);
                                        setView('students');
                                    }}
                                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 group-hover:text-indigo-700">{cls.name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-red-600 font-bold">{cls.outstanding.toFixed(2)} JOD</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'students' && selectedClass && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Outstanding: {selectedClass.name}</h2>
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Unpaid List</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {classStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-red-600 font-bold">{student.outstanding.toFixed(2)} JOD</td>
                                </tr>
                            ))}
                            {classStudents.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}
