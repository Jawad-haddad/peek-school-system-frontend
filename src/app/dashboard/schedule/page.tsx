'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type ScheduleEntry = {
    id: string;
    day: string;
    period?: number;
    startTime?: string;
    endTime?: string;
    subject: { name: string };
    class?: { name: string };
    teacher?: { fullName: string };
    room?: string;
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SUNDAY: 'Sunday',
};

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSchedule = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            const teacherId = user.teacherId || user.id;

            if (!teacherId) {
                setError('Teacher ID not found');
                setLoading(false);
                return;
            }

            try {
                // Try fetching the real teacher timetable
                const res = await api.get(`/school/timetable/teacher/${teacherId}`);
                const data = Array.isArray(res.data) ? res.data : res.data.entries || res.data.timetable || [];
                setSchedule(data);
            } catch (err: any) {
                // If the timetable endpoint doesn't exist (404), show empty state
                if (err.response?.status === 404) {
                    setSchedule([]);
                } else {
                    setError(err.response?.data?.message || 'Failed to load schedule');
                    if (err.response?.status === 403) setError('Access denied to schedule.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    // Group schedule entries by day
    const groupedByDay = schedule.reduce<Record<string, ScheduleEntry[]>>((acc, entry) => {
        const day = entry.day || 'UNKNOWN';
        if (!acc[day]) acc[day] = [];
        acc[day].push(entry);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading schedule...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <h3 className="text-red-800 font-bold text-xl mb-2">Error</h3>
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="glass-panel p-6 rounded-3xl mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Schedule</h1>
                <p className="text-gray-500 font-medium">Weekly timetable</p>
            </div>

            {schedule.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4 opacity-30">📅</div>
                    <p className="text-gray-400 font-medium text-xl">No schedule entries found.</p>
                    <p className="text-gray-300 text-sm mt-2">Your timetable will appear here once it is set up.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {DAYS.map(day => {
                        const entries = groupedByDay[day];
                        if (!entries || entries.length === 0) return null;

                        return (
                            <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-3 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800">{DAY_LABELS[day] || day}</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {entries
                                        .sort((a, b) => (a.period || 0) - (b.period || 0))
                                        .map(entry => (
                                            <div key={entry.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                                <div className="w-16 text-center">
                                                    {entry.period ? (
                                                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                                            P{entry.period}
                                                        </span>
                                                    ) : entry.startTime ? (
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {entry.startTime}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800">{entry.subject?.name || 'Subject'}</h4>
                                                    {entry.class?.name && (
                                                        <p className="text-xs text-gray-500 font-medium">{entry.class.name}</p>
                                                    )}
                                                </div>
                                                {entry.room && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                                                        Room {entry.room}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
