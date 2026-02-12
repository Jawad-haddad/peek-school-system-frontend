'use client';

import { useState, useEffect } from 'react';
import { academicApi } from '@/lib/api';

type ScheduleEntry = {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    class: { name: string };
    room?: string;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
                const res = await academicApi.fetchTeacherClasses(teacherId);
                const classes = res.data.classes || res.data || [];

                // Transform classes into schedule-like entries
                // If the API returns timetable entries directly, use those
                const entries: ScheduleEntry[] = classes.map((c: any, i: number) => ({
                    id: c.id,
                    dayOfWeek: DAYS[i % DAYS.length],
                    startTime: '08:00',
                    endTime: '09:00',
                    subject: { name: c.subject?.name || 'General' },
                    class: { name: c.name },
                    room: c.room || '',
                }));

                setSchedule(entries);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load schedule');
                if (err.response?.status === 403) setError('Access denied to schedule.');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

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
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    // Group by day
    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = schedule.filter(s => s.dayOfWeek === day);
        return acc;
    }, {} as Record<string, ScheduleEntry[]>);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-gray-800 mb-2">My Schedule</h1>
            <p className="text-gray-500 mb-8">Your weekly teaching timetable</p>

            {schedule.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-dashed border-2 border-gray-200">
                    <div className="text-6xl mb-4 opacity-20">📅</div>
                    <p className="text-gray-400 font-medium">No schedule entries found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {DAYS.map(day => {
                        const dayEntries = grouped[day];
                        if (!dayEntries || dayEntries.length === 0) return null;

                        return (
                            <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-3 border-b border-gray-100">
                                    <h3 className="font-bold text-indigo-800">{day}</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {dayEntries.map(entry => (
                                        <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {entry.startTime}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{entry.subject.name}</p>
                                                    <p className="text-xs text-gray-500">{entry.class.name}{entry.room ? ` • Room ${entry.room}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {entry.startTime} – {entry.endTime}
                                            </span>
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
