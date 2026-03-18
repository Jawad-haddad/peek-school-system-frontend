'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    homeworkApi,
    teacherApi,
    HomeworkItem,
    CreateHomeworkPayload,
    SchoolClass,
    formatApiError,
} from '@/lib/api';
import { permissions, Role } from '@/lib/permissions';
import { CardsSkeleton } from '@/components/ui/Skeletons';
import { useLang } from '@/lib/LangProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOverdue(dueDate: string) {
    return new Date(dueDate + 'T23:59:59') < new Date();
}

function formatDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

function firstValidationMsg(err: any, fallback: string): string {
    if (err?.code === 'TEACHER_NOT_ASSIGNED') return 'You are not assigned to this class.';
    if (err?.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
        return err.details[0].message || err.details[0].string || fallback;
    }
    return err?.message || fallback;
}

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art', 'Geography', 'Physics', 'Chemistry', 'Other'];

const EMPTY_FORM: CreateHomeworkPayload = {
    title: '', subject: '', classId: '', dueDate: '', description: '',
};

// ── Homework Form Modal ───────────────────────────────────────────────────────

type ModalProps = {
    editing: HomeworkItem | null;
    classes: SchoolClass[];
    onClose: () => void;
    onSaved: (item: HomeworkItem) => void;
};

function HomeworkModal({ editing, classes, onClose, onSaved }: ModalProps) {
    const { t } = useLang();
    const [form, setForm] = useState<CreateHomeworkPayload>(
        editing
            ? {
                title: editing.title,
                subject: editing.subject,
                classId: editing.classId,
                dueDate: editing.dueDate.split('T')[0],
                description: editing.description,
            }
            : EMPTY_FORM
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: keyof CreateHomeworkPayload) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            let result: HomeworkItem;
            if (editing) {
                result = await homeworkApi.update(editing.id, form);
            } else {
                result = await homeworkApi.create(form);
            }
            onSaved(result);
            onClose();
        } catch (err: any) {
            setError(firstValidationMsg(err, 'Failed to save assignment.'));
        } finally {
            setSaving(false);
        }
    };

    const inp = 'w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editing ? '✏️ Edit Assignment' : '📋 New Assignment'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                            <span>{t('auto_436')}</span><span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('auto_379')}</label>
                        <input type="text" required value={form.title} onChange={set('title')} className={inp} placeholder={t('auto_424')} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('auto_364')}</label>
                            <select required value={form.subject} onChange={set('subject')} className={inp}>
                                <option value="">{t('auto_343')}</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('auto_070')}</label>
                            <select required value={form.classId} onChange={set('classId')} className={inp}>
                                <option value="">{t('auto_343')}</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('auto_113')}</label>
                        <input type="date" required value={form.dueDate} onChange={set('dueDate')} className={inp} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{t('auto_109')}</label>
                        <textarea required rows={3} value={form.description} onChange={set('description')} className={inp} placeholder={t('auto_181')} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">{t('auto_065')}</button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-purple-600 text-white text-sm rounded-lg font-bold hover:bg-purple-700 disabled:opacity-60 transition-all"
                        >
                            {saving ? 'Saving…' : (editing ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Homework Page ─────────────────────────────────────────────────────────────

export default function HomeworkPage() {
    const { t } = useLang();
    const [role, setRole] = useState<Role>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [filterClassId, setFilterClassId] = useState<string>('');

    const [list, setList] = useState<HomeworkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<HomeworkItem | null>(null);

    const canEdit = permissions.canGrade(role);

    // ── Load classes + role ───────────────────────────────────────────────────
    useEffect(() => {
        const storedRole = localStorage.getItem('role') as Role;
        setRole(storedRole ? (storedRole.toUpperCase() as Role) : null);

        teacherApi.getMyClasses().then(setClasses).catch(() => {/* silently ignore */ });
    }, []);

    // ── Load homework list ────────────────────────────────────────────────────
    const loadList = useCallback(async (classId?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await homeworkApi.list(classId || undefined);
            const sorted = (Array.isArray(data) ? data : [])
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            setList(sorted);
        } catch (err: any) {
            setError(firstValidationMsg(err, 'Failed to load assignments.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadList(filterClassId || undefined); }, [loadList, filterClassId]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const handleSaved = (item: HomeworkItem) => {
        setList(prev => {
            const idx = prev.findIndex(h => h.id === item.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = item;
                return next;
            }
            return [item, ...prev];
        });
    };

    const handleDelete = async (hw: HomeworkItem) => {
        if (!window.confirm(`Delete "${hw.title}"?`)) return;
        try {
            await homeworkApi.remove(hw.id);
            setList(prev => prev.filter(h => h.id !== hw.id));
        } catch {/* toast already shown */ }
    };

    const getClassName = (hw: HomeworkItem) =>
        hw.class?.name || hw.className || classes.find(c => c.id === hw.classId)?.name || 'Unknown Class';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                        {t('auto_175')}
                                            </h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('auto_054')}</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => { setEditing(null); setModalOpen(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <span className="text-lg font-black">+</span> {t('auto_048')}
                                            </button>
                )}
            </div>

            {/* Class filter */}
            {classes.length > 0 && (
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">{t('auto_162')}</label>
                    <select
                        value={filterClassId}
                        onChange={e => setFilterClassId(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                    >
                        <option value="">{t('auto_037')}</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="text-lg">{t('auto_436')}</span><span className="font-medium">{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <CardsSkeleton count={6} />
            ) : list.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{t('auto_228')}</h3>
                    <p className="text-gray-400 text-sm">{t('auto_414')}</p>
                    {canEdit && (
                        <button
                            onClick={() => { setEditing(null); setModalOpen(true); }}
                            className="mt-5 text-purple-600 hover:text-purple-800 font-semibold text-sm underline"
                        >
                            {t('auto_096')}
                                                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {list.map((hw) => {
                        const overdue = isOverdue(hw.dueDate);
                        return (
                            <div key={hw.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 group relative overflow-hidden">
                                {/* Color bar */}
                                <div className={`absolute top-0 left-0 w-full h-1 ${overdue ? 'bg-red-400' : 'bg-gradient-to-r from-purple-400 to-indigo-400'}`} />

                                {/* Top badges */}
                                <div className="flex items-start justify-between mb-3 mt-1">
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                                            {getClassName(hw)}
                                        </span>
                                        <span className="bg-gray-50 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-100">
                                            {hw.subject}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {overdue ? 'Overdue' : 'Upcoming'}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors line-clamp-2">
                                    {hw.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{hw.description}</p>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                    <span className={`text-xs font-semibold flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                                        ⏰ {formatDate(hw.dueDate)}
                                    </span>
                                    {canEdit && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/dashboard/homework/${hw.id}/grades`}
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title={t('auto_169')}
                                            >
                                                🎓
                                            </Link>
                                            <button
                                                onClick={() => { setEditing(hw); setModalOpen(true); }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title={t('auto_118')}
                                            >
                                                {t('auto_442')}
                                                                                            </button>
                                            <button
                                                onClick={() => handleDelete(hw)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('auto_105')}
                                            >
                                                {t('auto_452')}
                                                                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <HomeworkModal
                    editing={editing}
                    classes={classes}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
