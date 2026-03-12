'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import WalletHistoryList from './WalletHistoryList';
import TopUpModal from './TopUpModal';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import {
    AuthUser,
    ChildRecord,
    HomeworkItem,
    parentApi,
    communicationApi,
} from '@/lib/api';
import { getSafeUser } from '@/lib/auth';
import { permissions } from '@/lib/permissions';
import { useLang } from '@/lib/LangProvider';

// ── Attendance status badge ───────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    present: 'bg-teal-100 text-teal-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-indigo-100 text-indigo-700',
};

function AttendanceBadge({ status }: { status: string }) {
    const { t } = useLang();
    const cls = STATUS_STYLES[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
    return (
        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>
            {status}
        </span>
    );
}

// ── Bus status pill ───────────────────────────────────────────────────────────

type BusStatus = { status: string; location?: string } | null;

function BusPill({ busStatus, loading }: { busStatus: BusStatus; loading: boolean }) {
    const { t } = useLang();
    if (loading) {
        return (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                {t('auto_203')}
                            </span>
        );
    }
    if (!busStatus) {
        return (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">
                {t('auto_456')}
                            </span>
        );
    }
    const st = (busStatus.status ?? '').toUpperCase();
    const isActive = ['EN_ROUTE', 'BOARDED', 'ON_BUS'].includes(st);
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            🚌 {busStatus.status || 'Unknown'}
            {busStatus.location ? ` · ${busStatus.location}` : ''}
        </span>
    );
}

// ── Per-child card ────────────────────────────────────────────────────────────

function ChildCard({ child }: { child: ChildRecord }) {
    const { t } = useLang();
    const [homework, setHomework] = useState<HomeworkItem[]>([]);
    const [busStatus, setBusStatus] = useState<BusStatus>(null);
    const [busLoading, setBusLoading] = useState(true);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [walletKey, setWalletKey] = useState(0);

    useEffect(() => {
        // Homework — sorted by dueDate asc, only future/today items, max 3
        parentApi.getHomework(child.id).then((items) => {
            const now = new Date().toISOString().slice(0, 10);
            const upcoming = items
                .filter((h) => h.dueDate >= now)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 3);
            setHomework(upcoming);
        });

        // Bus live status
        parentApi.getBusLive(child.id).then((data) => {
            setBusStatus(data);
            setBusLoading(false);
        });
    }, [child.id]);

    const handleTopUpSuccess = useCallback(() => {
        setWalletKey((k) => k + 1); // force WalletHistoryList to re-fetch
        setIsTopUpOpen(false);
    }, []);

    const lastAttendance = (child.attendance ?? []).slice(0, 5);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* ── Card header ── */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-extrabold text-xl text-gray-800">{child.fullName || 'Unknown Student'}</h3>
                    {child.class && (
                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">{child.class.name}</p>
                    )}
                </div>
                <BusPill busStatus={busStatus} loading={busLoading} />
            </div>

            <div className="p-6 space-y-6">
                {/* ── Attendance preview ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="bg-teal-100 text-teal-600 p-1 rounded-lg text-base">✅</span>
                            {t('auto_056')}
                                                    </h4>
                        <Link
                            href={`/dashboard/parent/children/${child.id}/attendance`}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            {t('auto_395')}
                                                    </Link>
                    </div>
                    {lastAttendance.length === 0 ? (
                        <p className="text-sm text-gray-400">{t('auto_237')}</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {lastAttendance.map((rec, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <AttendanceBadge status={rec.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Homework preview ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded-lg text-base">📚</span>
                            {t('auto_391')}
                                                    </h4>
                        <Link
                            href={`/dashboard/parent/children/${child.id}/homework`}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            {t('auto_398')}
                                                    </Link>
                    </div>
                    {homework.length === 0 ? (
                        <p className="text-sm text-gray-400">{t('auto_263')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {homework.map((hw) => (
                                <li key={hw.id} className="flex items-start gap-3 bg-blue-50/50 rounded-2xl p-3 border border-blue-100/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{hw.title}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{hw.subject}</p>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap border border-amber-100">
                                        {t('auto_112')} {new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Wallet ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 p-1 rounded-lg text-base">💳</span>
                            {t('auto_404')}
                                                    </h4>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard/parent/children"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                {t('auto_399')}
                                                            </Link>
                            <button
                                onClick={() => setIsTopUpOpen(true)}
                                className="bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:scale-105 transition-transform flex items-center gap-1 shadow-sm"
                            >
                                {t('auto_008')}
                                                            </button>
                        </div>
                    </div>
                    {/* key forces re-mount (refetch) after successful top-up */}
                    <WalletHistoryList key={walletKey} studentId={child.id} />
                </div>
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                studentId={child.id}
                onSuccess={handleTopUpSuccess}
            />
        </div>
    );
}


// ── Main component ────────────────────────────────────────────────────────────

function ParentDashboardInner() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [children, setChildren] = useState<ChildRecord[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLang();

    useEffect(() => {
        const parsedUser = getSafeUser() as AuthUser | null;
        if (parsedUser) {
            setUser(parsedUser);
        }

        Promise.all([
            parentApi.getMyChildren().catch(() => {
                setError(t('auto_091'));
                return [];
            }),
            communicationApi.getAnnouncements(5).catch(() => [])
        ]).then(([childrenData, announcementsData]) => {
            if (childrenData) setChildren(childrenData as ChildRecord[]);
            if (announcementsData) setAnnouncements(announcementsData as any[]);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <div className="min-h-screen">
            {/* ── Header ── */}
            <div className="mb-8">
                <div className="glass-panel p-8 rounded-3xl text-center md:text-left flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h5 className="text-violet-500 font-bold uppercase tracking-widest text-sm mb-2">{t('parent.welcome')}</h5>
                        <h2 className="text-4xl font-black text-gray-800 tracking-tight">
                            {user?.fullName || t('parent.parent')}
                        </h2>
                    </div>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-violet-200/50 to-fuchsia-200/50 rounded-full blur-3xl" />
                </div>
            </div>

            {/* ── Loading skeleton ── */}
            {loading && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-xl w-40 mb-4" />
                        <div className="h-4 bg-gray-100 rounded-xl w-full mb-2" />
                        <div className="h-4 bg-gray-100 rounded-xl w-3/4" />
                    </div>
                    {[1, 2].map((n) => (
                        <div key={n} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded-xl w-40 mb-4" />
                            <div className="h-4 bg-gray-100 rounded-xl w-24 mb-6" />
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-100 rounded-xl w-full" />
                                <div className="h-4 bg-gray-100 rounded-xl w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Announcements ── */}
            {!loading && !error && (
                <div className="mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100/50">
                        <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-2">
                            <span>📢</span> {t('announcements.title')}
                        </h3>
                    </div>
                    <div className="p-6">
                        {announcements.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('announcements.empty')}</p>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((ann, i) => (
                                    <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-800">{ann.title}</h4>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">
                                                {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Error state ── */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-6 text-center font-medium">
                    {error}
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && !error && children.length === 0 && (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                    <p className="text-5xl mb-4">{t('auto_447')}</p>
                    <p className="font-bold text-lg text-gray-600">{t('parent.noChildren')}</p>
                    <p className="text-sm mt-2">{t('parent.noChildrenDesc')}</p>
                </div>
            )}

            {/* ── Per-child cards ── */}
            {!loading && !error && children.length > 0 && (
                <div className="space-y-8">
                    {children.map((child) => (
                        <ChildCard key={child.id} child={child} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ParentDashboard() {
    const { t } = useLang();
    return (
        <ProtectedRoute allowed={permissions.isParent}>
            <ParentDashboardInner />
        </ProtectedRoute>
    );
}
