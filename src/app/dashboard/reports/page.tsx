'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, TrendingUp, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

type StatItem = {
    title: string;
    value: string;
    change: string;
    icon: typeof GraduationCap;
    color: string;
    bg: string;
};

type AlertItem = {
    msg: string;
    type: 'critical' | 'warning' | 'info';
};

export default function ReportsPage() {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/school/reports/overview');
                const data = res.data;

                // Map API data to display format
                setStats([
                    { title: 'Total Students', value: String(data.totalStudents ?? 0), change: data.studentChange ?? '—', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { title: 'Total Teachers', value: String(data.totalTeachers ?? 0), change: data.teacherChange ?? '—', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
                    { title: 'Attendance Rate', value: data.attendanceRate ? `${data.attendanceRate}%` : '—', change: data.attendanceChange ?? '—', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
                    { title: 'Fee Collection', value: data.feeCollection ? `${data.feeCollection}%` : '—', change: data.feeChange ?? '—', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
                ]);

                setAlerts(data.alerts ?? []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load report data.';
                setError(message);
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

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Executive Reports</h1>
                <p className="text-gray-500 font-medium">Overview of school performance and metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            {stat.change !== '—' && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : stat.change.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">{stat.title}</h3>
                        <p className="text-3xl font-black text-gray-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Overview */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-gray-400" size={20} />
                            Financial Overview
                        </h2>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="text-center">
                            <p className="text-gray-400 font-medium mb-2">Revenue data visualization</p>
                            <p className="text-xs text-gray-300">Coming in next release</p>
                        </div>
                    </div>
                </div>

                {/* Alerts / Notices */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Needs Attention
                    </h2>
                    <div className="space-y-4">
                        {alerts.length > 0 ? (
                            alerts.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'critical' ? 'bg-red-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                    <p className="text-sm font-bold text-gray-700">{item.msg}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 py-8">No alerts at this time.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
