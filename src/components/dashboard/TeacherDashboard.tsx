'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type ClassInfo = {
    id: string;
    name: string;
    subject: string;
    studentCount: number;
};

export default function TeacherDashboard() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // Endpoint fetching classes assigned to the logged-in teacher
                const res = await api.get('/school/classes');
                // Adjust per API response structure. Assuming array of classes.
                // If API returns all classes, might need to filter by teacher, but usually backend handles 'my-classes'
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);

                // If the API doesn't return studentCount, we might mock it or fetch it separately
                // For now, mapping to ensure shape
                const formatted: ClassInfo[] = data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    subject: 'General', // Backend might not send subject with class if it's general
                    studentCount: c._count?.students || 0 // Common Prisma pattern
                }));

                setClasses(formatted);
            } catch (error) {
                console.error("Failed to fetch teacher classes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading your schedule...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
            </div>

            {classes.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500">You have no classes assigned yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((cls) => (
                        <div key={cls.id} className="flex flex-col rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                                    <p className="text-sm text-indigo-600 font-medium">{cls.subject}</p>
                                </div>
                                <div className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                                    {cls.studentCount} Students
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50">
                                <Link
                                    href={`/dashboard/classes/${cls.id}`}
                                    className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
