'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

type Student = {
    id: string;
    fullName: string;
};

type AttendanceStatus = 'present' | 'absent' | 'late';

type AttendanceRecord = {
    studentId: string;
    status: AttendanceStatus;
};

export default function ClassAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [className, setClassName] = useState('My Class'); // In a real app, fetch class details too

    useEffect(() => {
        const fetchStudents = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                // Reuse existing API to get students
                const res = await axios.get(`http://localhost:3000/api/schools/classes/${classId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const studentList = res.data;
                setStudents(studentList);

                // Initialize attendance to 'present' for everyone by default
                const initialAttendance: Record<string, AttendanceStatus> = {};
                studentList.forEach((s: Student) => {
                    initialAttendance[s.id] = 'present';
                });
                setAttendance(initialAttendance);

                // TODO: Here we would also fetch existing attendance for this date if it exists
                // and update the state accordingly.

            } catch (err) {
                console.error('Failed to load students', err);
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
        const token = localStorage.getItem('authToken');

        // Convert state to array for API
        const records = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            status,
            date
        }));

        try {
            // Fake API call
            console.log('Saving attendance:', records);
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Attendance saved successfully!');
            router.push('/dashboard'); // Go back to dashboard or stay here
        } catch (error) {
            console.error('Failed to save attendance', error);
            alert('Failed to save attendance.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading students...</div>;

    return (
        <div className="pb-24 p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
                    <p className="text-gray-500">Class: {classId} {/* Ideally fetch class name */}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
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
                    disabled={submitting}
                    className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? 'Saving...' : '💾 Save Attendance'}
                </button>
            </div>
        </div>
    );
}
