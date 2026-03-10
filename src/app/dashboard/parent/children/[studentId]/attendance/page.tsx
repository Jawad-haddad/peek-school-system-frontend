'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { TableSkeleton } from '@/components/ui/Skeletons';
import { parentApi, StudentAttendanceDay, AttendanceStatus, formatApiError } from '@/lib/api';
import { permissions } from '@/lib/permissions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 13); // 14 days inclusive
    return { from: isoDate(from), to: isoDate(to) };
}

const STATUS_STYLES: Record<string, string> = {
    present: 'bg-teal-100 text-teal-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-indigo-100 text-indigo-700',
};

function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_STYLES[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
    return (
        <span className={`inline-block text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${cls}`}>
            {status}
        </span>
    );
}

// ── Summary pill ─────────────────────────────────────────────────────────────

function SummaryPill({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className={`flex flex-col items-center px-5 py-3 rounded-2xl ${color}`}>
            <span className="text-2xl font-black leading-none">{count}</span>
            <span className="text-xs font-bold uppercase tracking-wide mt-1">{label}</span>
        </div>
    );
}

// ── Page inner ────────────────────────────────────────────────────────────────

function AttendancePageInner({ studentId }: { studentId: string }) {
    const { from, to } = useMemo(defaultRange, []);
    const [records, setRecords] = useState<StudentAttendanceDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        parentApi
            .getStudentAttendance(studentId, from, to)
            .then((data) => {
                // Sort descending by date (most recent first)
                const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
                setRecords(sorted);
            })
            .catch((err) => setError(formatApiError('Could not load attendance', err)))
            .finally(() => setLoading(false));
    }, [studentId, from, to]);

    // ── Summary counts ──────────────────────────────────────────────────────
    const counts = useMemo(() => {
        const result: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
        records.forEach((r) => {
            const key = r.status.toLowerCase() as AttendanceStatus;
            if (key in result) result[key]++;
        });
        return result;
    }, [records]);

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <Link
                href="/dashboard/parent/children"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                ← Back to My Children
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Attendance</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Last 14 days · {from} → {to}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading && <TableSkeleton rows={14} cols={2} />}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Summary pills */}
                    {records.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            <SummaryPill label="Present" count={counts.present} color="bg-teal-50 text-teal-700" />
                            <SummaryPill label="Absent" count={counts.absent} color="bg-red-50 text-red-700" />
                            <SummaryPill label="Late" count={counts.late} color="bg-amber-50 text-amber-700" />
                            <SummaryPill label="Excused" count={counts.excused} color="bg-indigo-50 text-indigo-700" />
                        </div>
                    )}

                    {/* Empty state */}
                    {records.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                            <p className="text-5xl mb-4">🗓️</p>
                            <h2 className="text-xl font-bold text-gray-700 mb-2">No records found</h2>
                            <p className="text-sm text-gray-400">
                                No attendance was recorded for this period.
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {records.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="grid grid-cols-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                <span>Date</span>
                                <span className="text-right">Status</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {records.map((rec) => (
                                    <div
                                        key={rec.date}
                                        className="grid grid-cols-2 items-center px-6 py-3.5 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-gray-700">
                                            {new Date(rec.date + 'T00:00:00').toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                        <span className="text-right">
                                            <StatusBadge status={rec.status} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Route entry ───────────────────────────────────────────────────────────────

export default function AttendancePage({
    params,
}: {
    params: Promise<{ studentId: string }>;
}) {
    const { studentId } = use(params);

    return (
        <ProtectedRoute allowed={permissions.isParent}>
            <AttendancePageInner studentId={studentId} />
        </ProtectedRoute>
    );
}
