'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { CardsSkeleton } from '@/components/ui/Skeletons';
import { parentApi, HomeworkItem, formatApiError } from '@/lib/api';
import { permissions } from '@/lib/permissions';
import { useLang } from '@/lib/LangProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

// ── Homework card ─────────────────────────────────────────────────────────────

function HomeworkCard({ hw, overdue }: { hw: HomeworkItem; overdue: boolean }) {
    const { t } = useLang();
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Top colour bar */}
            <div className={`absolute top-0 left-0 w-full h-1 ${overdue ? 'bg-red-400' : 'bg-gradient-to-r from-blue-400 to-indigo-400'}`} />

            <div className="flex items-start justify-between mb-2 mt-1 gap-2">
                <div className="flex flex-wrap gap-1.5">
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                        {hw.subject}
                    </span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap ${overdue ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {overdue ? 'Past' : 'Upcoming'}
                </span>
            </div>

            <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{hw.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{hw.description}</p>

            <div className="flex items-center gap-1.5 border-t border-gray-50 pt-3">
                <span className={`text-xs font-semibold ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                    ⏰ {formatDate(hw.dueDate)}
                </span>
            </div>
        </div>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────

function HomeworkSection({
    title,
    emoji,
    items,
    overdue,
    emptyMsg,
}: {
    title: string;
    emoji: string;
    items: HomeworkItem[];
    overdue: boolean;
    emptyMsg: string;
}) {
    return (
        <div className="space-y-4">
            <h2 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                <span>{emoji}</span> {title}
                <span className="text-sm font-bold text-gray-400">({items.length})</span>
            </h2>
            {items.length === 0 ? (
                <div className="text-sm text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                    {emptyMsg}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((hw) => (
                        <HomeworkCard key={hw.id} hw={hw} overdue={overdue} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Page inner ────────────────────────────────────────────────────────────────

function HomeworkPageInner({ studentId }: { studentId: string }) {
    const { t } = useLang();
    const [items, setItems] = useState<HomeworkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        parentApi
            .getHomework(studentId)
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => setError(formatApiError('Could not load homework', err)))
            .finally(() => setLoading(false));
    }, [studentId]);

    const now = today();

    const upcoming = useMemo(
        () =>
            items
                .filter((h) => h.dueDate.slice(0, 10) >= now)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        [items, now],
    );

    const past = useMemo(
        () =>
            items
                .filter((h) => h.dueDate.slice(0, 10) < now)
                .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
        [items, now],
    );

    return (
        <div className="p-6 space-y-10 max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <Link
                href="/dashboard/parent/children"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                {t('auto_434')}
                            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">{t('auto_173')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('auto_039')}</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">{t('auto_436')}</span>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading && <CardsSkeleton count={4} />}

            {/* Content */}
            {!loading && !error && (
                <>
                    <HomeworkSection
                        title={t('auto_390')}
                        emoji="📋"
                        items={upcoming}
                        overdue={false}
                        emptyMsg="No upcoming homework — enjoy the break! 🎉"
                    />
                    <HomeworkSection
                        title={t('auto_280')}
                        emoji="📁"
                        items={past}
                        overdue={true}
                        emptyMsg="No past homework found."
                    />
                </>
            )}
        </div>
    );
}

// ── Route entry ───────────────────────────────────────────────────────────────

export default function HomeworkPage({
    params,
}: {
    params: Promise<{ studentId: string }>;
}) {
    const { t } = useLang();
    const { studentId } = use(params);

    return (
        <ProtectedRoute allowed={permissions.isParent}>
            <HomeworkPageInner studentId={studentId} />
        </ProtectedRoute>
    );
}
