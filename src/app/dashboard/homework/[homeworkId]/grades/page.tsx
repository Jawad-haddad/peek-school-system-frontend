'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    homeworkGradesApi,
    HomeworkGradeRecord,
    SubmitGradeEntry,
    formatApiError,
} from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';
import { TableSkeleton } from '@/components/ui/Skeletons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstValidationMsg(err: any, fallback: string): string {
    if (err?.code === 'TEACHER_NOT_ASSIGNED') return 'You are not assigned to this class.';
    if (err?.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
        return err.details[0].message || err.details[0].string || fallback;
    }
    return err?.message || fallback;
}

function formatDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short', month: 'long', day: 'numeric',
    });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeworkGradesPage() {
    const params = useParams();
    const router = useRouter();
    const homeworkId = params.homeworkId as string;

    // Server data
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxPoints, setMaxPoints] = useState(100);

    // Mutable grade map: studentId → { grade, comment }
    const [grades, setGrades] = useState<Record<string, { grade: string; comment: string }>>({});
    const [students, setStudents] = useState<HomeworkGradeRecord[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!homeworkId) return;
        const load = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await homeworkGradesApi.getForHomework(homeworkId);
                setTitle(data.title);
                setDueDate(data.dueDate);
                setMaxPoints(data.maxPoints ?? 100);
                setStudents(data.grades ?? []);
                // Pre-fill grade inputs with existing saved values
                const initialGrades: Record<string, { grade: string; comment: string }> = {};
                (data.grades ?? []).forEach((r) => {
                    initialGrades[r.studentId] = {
                        grade: r.grade != null ? String(r.grade) : '',
                        comment: r.comment ?? '',
                    };
                });
                setGrades(initialGrades);
            } catch (err: any) {
                setLoadError(firstValidationMsg(err, 'Failed to load grades.'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [homeworkId]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const setGradeField = (studentId: string, field: 'grade' | 'comment', value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value },
        }));
    };

    const handleSave = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload: SubmitGradeEntry[] = students
                .filter(s => grades[s.studentId]?.grade !== '')
                .map(s => ({
                    studentId: s.studentId,
                    grade: Number(grades[s.studentId]?.grade ?? 0),
                    comment: grades[s.studentId]?.comment?.trim() || undefined,
                }));

            if (payload.length === 0) {
                setSubmitError('Enter at least one grade before saving.');
                setSubmitting(false);
                return;
            }

            await homeworkGradesApi.submit(homeworkId, payload);
            // Navigate back so teacher can see the homework list refreshed
            router.push('/dashboard/homework');
        } catch (err: any) {
            setSubmitError(firstValidationMsg(err, 'Failed to save grades.'));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render — loading ──────────────────────────────────────────────────────
    if (loading) return (
        <ProtectedRoute allowed={permissions.canGrade}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-8 space-y-2">
                    <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-64" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                </div>
                <TableSkeleton rows={6} cols={3} />
            </div>
        </ProtectedRoute>
    );

    // ── Render — error ────────────────────────────────────────────────────────
    if (loadError) return (
        <ProtectedRoute allowed={permissions.canGrade}>
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 inline-block max-w-md">
                    <p className="font-bold text-lg mb-2">⚠️ {loadError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );

    // ── Render — main ─────────────────────────────────────────────────────────
    return (
        <ProtectedRoute allowed={permissions.canGrade}>
            <div className="pb-28 p-4 md:p-8 max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1 transition-colors"
                    >
                        ← Back to Homework
                    </button>
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <h1 className="text-2xl font-black tracking-tight mb-1">📝 Grading: {title}</h1>
                        <div className="flex flex-wrap gap-4 text-purple-100 text-sm mt-2">
                            <span>📅 Due: {formatDate(dueDate)}</span>
                            <span>⭐ Max Points: {maxPoints}</span>
                            <span>👥 {students.length} Student{students.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Submit error banner */}
                {submitError && (
                    <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm flex items-start gap-2">
                        <span>⚠️</span><span>{submitError}</span>
                    </div>
                )}

                {/* Empty state */}
                {students.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="text-4xl mb-3">🎓</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-1">No Students Found</h3>
                        <p className="text-gray-400 text-sm">This class appears to have no enrolled students.</p>
                    </div>
                ) : (
                    <>
                        {/* Grading table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider w-1/3">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider w-32">
                                            Grade <span className="font-normal text-gray-400">(0–{maxPoints})</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Comment <span className="font-normal text-gray-400">(optional)</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {students.map((student) => {
                                        const g = grades[student.studentId] ?? { grade: '', comment: '' };
                                        const numGrade = Number(g.grade);
                                        const hasGrade = g.grade !== '';
                                        const pct = hasGrade ? Math.round((numGrade / maxPoints) * 100) : null;
                                        const scoreColor = pct == null ? '' : pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500';

                                        return (
                                            <tr key={student.studentId} className="hover:bg-gray-50 transition-colors group">
                                                {/* Name + avatar */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                                            {student.studentName?.charAt(0) ?? '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{student.studentName}</p>
                                                            {pct != null && (
                                                                <p className={`text-xs font-bold ${scoreColor}`}>{pct}%</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Grade input */}
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={maxPoints}
                                                        step={1}
                                                        value={g.grade}
                                                        onChange={e => setGradeField(student.studentId, 'grade', e.target.value)}
                                                        placeholder="—"
                                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 focus:bg-white transition-all"
                                                    />
                                                </td>

                                                {/* Comment */}
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={g.comment}
                                                        onChange={e => setGradeField(student.studentId, 'comment', e.target.value)}
                                                        placeholder="Good effort…"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-gray-50 focus:bg-white transition-all"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Stats bar */}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                            {(() => {
                                const graded = students.filter(s => grades[s.studentId]?.grade !== '').length;
                                return (
                                    <>
                                        <span>✅ Graded: <strong className="text-gray-700">{graded}</strong></span>
                                        <span>⏳ Pending: <strong className="text-gray-700">{students.length - graded}</strong></span>
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}

                {/* Floating save bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-up md:static md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={submitting || students.length === 0}
                        className="w-full md:w-auto bg-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                        {submitting ? '⏳ Saving…' : '💾 Save Grades'}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
}
