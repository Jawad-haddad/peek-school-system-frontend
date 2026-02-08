'use client';

import { Users, GraduationCap, DollarSign, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
    // Mock Data for MVP - In a real app, these would come from an API
    const stats = [
        { title: 'Total Students', value: '1,240', change: '+12%', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Total Teachers', value: '48', change: '+4%', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
        { title: 'Attendance Rate', value: '96.5%', change: '+1.2%', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Fee Collection', value: '84%', change: '-2%', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

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
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">{stat.title}</h3>
                        <p className="text-3xl font-black text-gray-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts / Detailed Sections Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Overview */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-gray-400" size={20} />
                            Financial Overview
                        </h2>
                        <select className="bg-gray-50 border-none text-sm font-bold text-gray-600 rounded-lg py-1 px-3">
                            <option>This Year</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="text-center">
                            <p className="text-gray-400 font-medium mb-2">Revenue Chart Visualization</p>
                            <p className="text-xs text-gray-300">Requires Chart.js integration</p>
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
                        {[
                            { msg: '5 Students have outstanding fees > 500 JOD', type: 'critical' },
                            { msg: 'Teacher "Sarah Ahmed" has incomplete gradebook', type: 'warning' },
                            { msg: 'Bus Route #3 reported 15 min delay', type: 'info' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className={`w-2 h-2 rounded-full ${item.type === 'critical' ? 'bg-red-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <p className="text-sm font-bold text-gray-700">{item.msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
