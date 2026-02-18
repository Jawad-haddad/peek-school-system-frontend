'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { academicApi } from '@/lib/api';

type ClassInfo = {
    id: string;
    name: string;
    subject: string;
    studentCount: number;
};

export default function TeacherDashboard() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const teacherId = user.teacherId || user.id;

            if (!teacherId) {
                console.error("No teacher ID found for logged in user");
                setLoading(false);
                return;
            }

            try {
                const res = await academicApi.fetchTeacherClasses(teacherId);
                const data = res.data.classes || res.data || [];

                const formatted: ClassInfo[] = data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    subject: c.subject?.name || 'General',
                    studentCount: c._count?.students || 0
                }));

                setClasses(formatted);
            } catch (error: any) {
                console.error("Failed to fetch teacher classes", error);
                setError(error.response?.data?.message || 'Failed to load classes');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading your schedule...</div>;
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 inline-block">
                    <p className="font-bold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4">
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">My Classes</h2>
                <div className="bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm text-sm font-bold text-gray-500 border border-white/40 shadow-sm">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="glass-card text-center py-20 rounded-3xl">
                    <p className="text-gray-400 font-medium text-lg">You have no classes assigned yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((cls) => (
                        <div key={cls.id} className="glass-card flex flex-col rounded-3xl p-6 group hover:border-violet-300/50">
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 group-hover:text-violet-700 transition-colors">{cls.name}</h3>
                                    <p className="text-sm text-violet-500 font-bold uppercase tracking-wider">{cls.subject}</p>
                                </div>
                                <div className="rounded-xl bg-violet-50 px-3 py-1 text-xs font-black text-violet-600 border border-violet-100">
                                    {cls.studentCount} Students
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-100/50">
                                <Link
                                    href={`/dashboard/classes/${cls.id}`}
                                    className="block w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-1 transition-all"
                                >
                                    Take Attendance / View
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
