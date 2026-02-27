'use client';

import { useState, useEffect } from 'react';
import { mvpApi, AttendanceStatus, StudentRecord } from '@/lib/api';
import { getSafeUser } from '@/lib/auth';

type ClassInfo = { id: string; name: string };

// Status config keys must match backend lowercase enum
const STATUS_CONFIG: Record<AttendanceStatus, { color: string; bg: string }> = {
    present: { color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
    absent: { color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
    late: { color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
    excused: { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
};

export default function AttendancePage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch teacher's classes
    useEffect(() => {
        const load = async () => {
            const user = getSafeUser();
            if (!user) return;
            const teacherId = user.teacherId || user.id;

            if (!teacherId) { setLoadingClasses(false); return; }

            try {
                const res = await mvpApi.fetchTeacherClasses(teacherId);
                // fetchTeacherClasses now returns SchoolClass[] directly (envelope unwrapped)
                const data = Array.isArray(res) ? res : [];
                setClasses(data.map((c: any) => ({ id: c.id, name: c.name })));
            } catch (err) {
                console.error('Failed to load classes', err);
            } finally {
                setLoadingClasses(false);
            }
        };
        load();
    }, []);

    // Fetch students when class selected
    useEffect(() => {
        if (!selectedClass) { setStudents([]); setAttendance({}); return; }

        const load = async () => {
            setLoadingStudents(true);
            try {
                const res = await mvpApi.fetchClassStudents(selectedClass);
                // fetchClassStudents now returns StudentRecord[] directly (envelope unwrapped)
                const data = Array.isArray(res) ? res : [];
                setStudents(data);

                // Default all to 'present' (lowercase per backend contract)
                const initial: Record<string, AttendanceStatus> = {};
                data.forEach((s: StudentRecord) => { initial[s.id] = 'present'; });
                setAttendance(initial);
            } catch (err) {
                console.error('Failed to load students', err);
            } finally {
                setLoadingStudents(false);
            }
        };
        load();
    }, [selectedClass]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        if (!selectedClass || students.length === 0) return;
        setIsSubmitting(true);

        try {
            // Contract: POST /attendance/bulk
            // { classId, date, records: [{ studentId, status }] } — classId/date at top level
            await mvpApi.submitBulkAttendance({
                classId: selectedClass,
                date: new Date().toISOString().split('T')[0],
                records: students.map(s => ({
                    studentId: s.id,
                    status: attendance[s.id] ?? 'present',
                })),
            });
            // toast fired inside submitBulkAttendance on success
        } catch {
            // toast fired inside submitBulkAttendance on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Mark Attendance</h1>
            <p className="text-gray-500 mb-8">Record daily attendance for your classes</p>

            {/* Class Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Class</label>
                <select
                    className="w-full md:w-1/2 rounded-xl border-gray-200 bg-gray-50/50 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium text-gray-700"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={loadingClasses || classes.length === 0}
                >
                    <option value="">{classes.length === 0 && !loadingClasses ? "-- No classes available --" : "-- Choose a class --"}</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                {loadingClasses && <p className="text-xs text-gray-400 mt-2">Loading classes...</p>}
            </div>

            {/* Students List */}
            {selectedClass && (
                loadingStudents ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
                        <div className="text-5xl mb-4">🪑</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Students Enrolled</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                            There are currently no students assigned to this class. Students must be enrolled by an administrator before attendance can be taken.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Bar */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                                {students.length} Students
                            </span>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                ✓ {presentCount} Present
                            </span>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                                ✗ {absentCount} Absent
                            </span>
                        </div>

                        {/* Attendance Cards */}
                        <div className="space-y-3">
                            {students.map(student => {
                                const status = attendance[student.id] || 'present';
                                return (
                                    <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                                                {student.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                {/* fullName is the field returned by backend contract */}
                                                <p className="font-bold text-gray-900">{student.fullName}</p>
                                                <p className="text-xs text-gray-400">ID: {student.id.substring(0, 8)}...</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => handleStatusChange(student.id, s)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${status === s
                                                        ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} scale-105 shadow-sm`
                                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Submit - Desktop */}
                        <div className="hidden md:flex justify-end mt-8">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedClass || students.length === 0}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {isSubmitting ? (
                                    <><div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</>
                                ) : (
                                    <>✅ Save {students.length} Records</>
                                )}
                            </button>
                        </div>

                        {/* Submit - Mobile FAB */}
                        <div className="fixed bottom-4 right-4 md:hidden z-30">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedClass || students.length === 0}
                                className="bg-green-600 text-white p-4 rounded-full shadow-xl shadow-green-300 hover:scale-110 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
                                ) : (
                                    <><span className="text-2xl">✅</span><span className="font-bold pr-2">{students.length}</span></>
                                )}
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
