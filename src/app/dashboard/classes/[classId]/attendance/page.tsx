'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from '@/lib/toast-events';

type Student = {
    id: string;
    fullName: string;
};

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function ClassAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/academics/classes/${classId}/students`);
                const studentList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setStudents(studentList);

                // Initialize attendance to 'present' for everyone by default
                const initialAttendance: Record<string, AttendanceStatus> = {};
                studentList.forEach((s: Student) => {
                    initialAttendance[s.id] = 'present';
                });
                setAttendance(initialAttendance);

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load students.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchStudents();
        }
    }, [classId, date]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        setSubmitting(true);

        const records = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            status,
            date
        }));

        try {
            await api.post(`/academics/classes/${classId}/attendance`, { records });
            toast.success('Attendance saved successfully!');
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save attendance.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading students...</div>;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 inline-block">
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
        <div className="pb-24 p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
                    <p className="text-gray-500">Class: {classId}</p>
                </div>
                <div>
                    <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        id="attendance-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Student List */}
            <div className="space-y-4">
                {students.map((student) => (
                    <div key={student.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                {student.fullName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{student.fullName}</span>
                        </div>

                        {/* Attendance Controls */}
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => handleStatusChange(student.id, 'present')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'present'
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Present
                            </button>
                            <button
                                onClick={() => handleStatusChange(student.id, 'late')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'late'
                                    ? 'bg-yellow-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Late
                            </button>
                            <button
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'absent'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Absent
                            </button>
                        </div>
                    </div>
                ))}

                {students.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No students found in this class.
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-up md:static md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={submitting || students.length === 0}
                    className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? 'Saving...' : '💾 Save Attendance'}
                </button>
            </div>
        </div>
    );
}
