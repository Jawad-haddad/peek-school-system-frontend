'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    mvpApi,
    attendanceApi,
    AttendanceStatus,
    AttendanceDayRecord,
    AttendanceHistoryDay,
    StudentRecord,
    formatApiError,
} from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';
import { TableSkeleton } from '@/components/ui/Skeletons';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { status: AttendanceStatus; label: string; activeClass: string }[] = [
    { status: 'present', label: '✓ Present', activeClass: 'bg-green-500 text-white shadow-sm' },
    { status: 'late', label: '⏰ Late', activeClass: 'bg-yellow-500 text-white shadow-sm' },
    { status: 'absent', label: '✗ Absent', activeClass: 'bg-red-500 text-white shadow-sm' },
    { status: 'excused', label: '📋 Excused', activeClass: 'bg-blue-500 text-white shadow-sm' },
];

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function formatShortDate(iso: string) {
    const d = new Date(iso + 'T00:00:00'); // force local parse
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClassAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    // Students — loaded once
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Per-date attendance statuses
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [statusLoading, setStatusLoading] = useState(false);

    // Date selector
    const [date, setDate] = useState(todayISO());

    // History sidebar
    const [history, setHistory] = useState<AttendanceHistoryDay[]>([]);

    // Save state
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ── Load statuses for a given date ────────────────────────────────────────
    const loadStatusesForDate = useCallback(async (d: string, studentList: StudentRecord[]) => {
        setStatusLoading(true);
        try {
            const records: AttendanceDayRecord[] = await attendanceApi.getForDate(classId, d);
            // Build map from returned records, defaulting to 'present' for unrecorded students
            const map: Record<string, AttendanceStatus> = {};
            studentList.forEach((s) => { map[s.id] = 'present'; });
            records.forEach((r) => { map[r.studentId] = r.status; });
            setAttendance(map);
        } catch (err: any) {
            // Non-fatal — keep existing map
            console.warn('Could not pre-fill statuses for date:', d, err?.message);
        } finally {
            setStatusLoading(false);
        }
    }, [classId]);

    // ── Fetch students + history on mount ────────────────────────────────────
    useEffect(() => {
        if (!classId) return;

        const init = async () => {
            setStudentsLoading(true);
            setLoadError(null);
            try {
                const [studentList, hist] = await Promise.all([
                    mvpApi.fetchClassStudents(classId),
                    attendanceApi.getHistory(classId, 14),
                ]);
                setStudents(studentList);
                setHistory(Array.isArray(hist) ? hist : []);
                // Load statuses for today
                await loadStatusesForDate(todayISO(), studentList);
            } catch (err: any) {
                const isNotAssigned = err?.code === 'TEACHER_NOT_ASSIGNED'
                    || err?.message?.toLowerCase().includes('not assigned');
                setLoadError(isNotAssigned
                    ? 'You are not assigned to this class.'
                    : (err.message || 'Failed to load students.'));
            } finally {
                setStudentsLoading(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId]);

    // ── Reload statuses when date changes ────────────────────────────────────
    useEffect(() => {
        if (students.length > 0) {
            loadStatusesForDate(date, students);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleHistoryDayClick = (iso: string) => {
        setDate(iso);
    };

    const handleSave = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            await mvpApi.submitBulkAttendance({
                classId,
                date,
                records: students.map(s => ({
                    studentId: s.id,
                    status: attendance[s.id] ?? 'present',
                })),
            });
            // Refresh history after save
            const hist = await attendanceApi.getHistory(classId, 14);
            setHistory(Array.isArray(hist) ? hist : []);
            router.push('/dashboard');
        } catch (err: any) {
            let msg = err.message || 'Failed to submit attendance.';
            if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
                msg = err.details[0].message || msg;
            }
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Early returns ─────────────────────────────────────────────────────────

    if (studentsLoading) return (
        <ProtectedRoute allowed={permissions.canSubmitAttendance}>
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <TableSkeleton rows={6} cols={2} />
            </div>
        </ProtectedRoute>
    );

    if (loadError) return (
        <ProtectedRoute allowed={permissions.canSubmitAttendance}>
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 inline-block">
                    <p className="font-bold">{loadError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <ProtectedRoute allowed={permissions.canSubmitAttendance}>
            <div className="pb-24 p-4 md:p-8 max-w-5xl mx-auto">

                {/* Header row */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Class ID: {classId}</p>
                    </div>
                    <div>
                        <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            id="attendance-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block rounded-lg border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Left: Student list ──────────────────────────────── */}
                    <div className="flex-1 min-w-0">

                        {/* Validation error */}
                        {submitError && (
                            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-sm flex items-start gap-2">
                                <span>⚠️</span><span>{submitError}</span>
                            </div>
                        )}

                        {/* Status loading shimmer overlay indication */}
                        {statusLoading && (
                            <div className="mb-3 text-xs text-indigo-500 font-semibold animate-pulse flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                                Loading saved statuses for {formatShortDate(date)}…
                            </div>
                        )}

                        <div className="space-y-3">
                            {students.map((student) => (
                                <div
                                    key={student.id}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm">
                                            {student.fullName.charAt(0)}
                                        </div>
                                        <span className="font-semibold text-gray-900">{student.fullName}</span>
                                    </div>
                                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1 flex-wrap sm:flex-nowrap">
                                        {STATUS_OPTIONS.map(({ status, label, activeClass }) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${attendance[student.id] === status
                                                    ? activeClass
                                                    : 'text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {students.length === 0 && (
                                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-100">
                                    No students found in this class.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: History panel ────────────────────────────── */}
                    {history.length > 0 && (
                        <aside className="lg:w-64 shrink-0">
                            <h2 className="text-sm font-black text-gray-600 uppercase tracking-wider mb-3">Last 14 Days</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                                {history.map((day) => (
                                    <button
                                        key={day.date}
                                        onClick={() => handleHistoryDayClick(day.date)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-indigo-50 transition-colors text-left group ${date === day.date ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                    >
                                        <span className={`font-bold ${date === day.date ? 'text-indigo-700' : 'text-gray-700'}`}>
                                            {formatShortDate(day.date)}
                                        </span>
                                        <span className="flex gap-2 text-xs">
                                            <span className="text-green-600 font-bold">✅ {day.presentCount}</span>
                                            <span className="text-red-500 font-bold">❌ {day.absentCount}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </aside>
                    )}
                </div>

                {/* Floating save bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-up md:static md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={submitting || students.length === 0}
                        className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                        {submitting ? '⏳ Saving…' : `💾 Save ${students.length} Records`}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
}
