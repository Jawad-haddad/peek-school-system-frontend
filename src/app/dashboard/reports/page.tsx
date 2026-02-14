'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, TrendingUp, UserCheck, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import api, { statsApi } from '@/lib/api';

type FeeClassBreakdown = {
    id: string;
    name: string;
    outstanding: number;
};

type FeeStats = {
    totalOutstanding: number;
    totalStudents: number;
    totalPaid: number;
    totalFees: number;
    classes: FeeClassBreakdown[];
};

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real data from existing endpoints
    const [teacherCount, setTeacherCount] = useState(0);
    const [classCount, setClassCount] = useState(0);
    const [feeStats, setFeeStats] = useState<FeeStats | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch from endpoints that ACTUALLY EXIST on the backend
                const [teacherRes, classRes, feeRes] = await Promise.allSettled([
                    api.get('/school/teachers', { params: { _t: Date.now() } }),
                    api.get('/school/classes', { params: { _t: Date.now() } }),
                    statsApi.fetchFeesStats().catch(() => null),
                ]);

                // Teachers
                if (teacherRes.status === 'fulfilled') {
                    const d = teacherRes.value.data;
                    const arr = Array.isArray(d) ? d : (d?.teachers || d?.data || []);
                    setTeacherCount(arr.length);
                }

                // Classes
                if (classRes.status === 'fulfilled') {
                    const d = classRes.value.data;
                    const arr = Array.isArray(d) ? d : (d?.classes || d?.data || []);
                    setClassCount(arr.length);
                }

                // Fee Stats
                if (feeRes.status === 'fulfilled' && feeRes.value?.data) {
                    const f = feeRes.value.data;
                    setFeeStats({
                        totalOutstanding: f.totalOutstanding ?? 0,
                        totalStudents: f.totalStudents ?? 0,
                        totalPaid: f.totalPaid ?? 0,
                        totalFees: f.totalFees ?? 0,
                        classes: f.classes ?? [],
                    });
                }
            } catch (err: any) {
                console.error('Reports fetch error:', err);
                setError(err.message || 'Failed to load report data.');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading reports...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 inline-block">
                    <AlertCircle size={24} className="mx-auto mb-2" />
                    <p className="font-bold">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const collectionRate = feeStats && feeStats.totalFees > 0
        ? Math.round((feeStats.totalPaid / feeStats.totalFees) * 100)
        : 0;

    const statCards = [
        { title: 'Total Students', value: String(feeStats?.totalStudents ?? 0), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Total Teachers', value: String(teacherCount), icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
        { title: 'Total Classes', value: String(classCount), icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Fee Collection', value: feeStats ? `${collectionRate}%` : '—', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Executive Reports</h1>
                <p className="text-gray-500 font-medium">Overview of school performance and metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">{stat.title}</h3>
                        <p className="text-3xl font-black text-gray-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Financial Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Overview */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-gray-400" size={20} />
                            Financial Overview
                        </h2>
                    </div>
                    {feeStats ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Total Collected</p>
                                    <p className="text-2xl font-black text-green-700 mt-1">${feeStats.totalPaid.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Outstanding</p>
                                    <p className="text-2xl font-black text-amber-700 mt-1">${feeStats.totalOutstanding.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Collection Progress Bar */}
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Collection Rate</span>
                                    <span className="text-xs font-black text-gray-700">{collectionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-3 rounded-full transition-all duration-1000"
                                        style={{ width: `${collectionRate}%` }}
                                    />
                                </div>
                            </div>

                            {feeStats.classes && feeStats.classes.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider px-1">By Class</p>
                                    {feeStats.classes.slice(0, 5).map((cls) => (
                                        <div key={cls.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <span className="font-bold text-gray-700 text-sm">{cls.name}</span>
                                            <span className="font-black text-amber-600 text-sm">${cls.outstanding.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No financial data available</p>
                        </div>
                    )}
                </div>

                {/* School Summary */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertCircle className="text-violet-500" size={20} />
                        Quick Summary
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <p className="text-sm font-bold text-gray-700">
                                {feeStats?.totalStudents ?? 0} students enrolled across {classCount} classes
                            </p>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <p className="text-sm font-bold text-gray-700">
                                {teacherCount} active teacher{teacherCount !== 1 ? 's' : ''} on staff
                            </p>
                        </div>
                        {feeStats && feeStats.totalOutstanding > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <p className="text-sm font-bold text-gray-700">
                                    ${feeStats.totalOutstanding.toLocaleString()} in outstanding fees
                                </p>
                            </div>
                        )}
                        {collectionRate >= 90 && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-sm font-bold text-gray-700">
                                    ✨ Fee collection rate is excellent at {collectionRate}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
