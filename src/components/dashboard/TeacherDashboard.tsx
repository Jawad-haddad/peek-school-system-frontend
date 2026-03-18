'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { teacherApi, communicationApi, SchoolClass } from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';
import { CardsSkeleton } from '@/components/ui/Skeletons';
import { useLang } from '@/lib/LangProvider';

export default function TeacherDashboard() {
    const { t } = useLang();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            teacherApi.getMyClasses().catch((err: any) => {
                const isNotAssigned = err?.code === 'TEACHER_NOT_ASSIGNED'
                    || err?.message?.toLowerCase().includes('not assigned');
                setError(isNotAssigned
                    ? 'You are not assigned to this class.'
                    : (err.message || 'Failed to load classes.'));
                return [];
            }),
            communicationApi.getAnnouncements(5).catch(() => [])
        ]).then(([classesData, announcementsData]) => {
            if (classesData) setClasses(Array.isArray(classesData) ? classesData : []);
            if (announcementsData) setAnnouncements(announcementsData as any[]);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <ProtectedRoute allowed={permissions.isTeacher}>
            <div className="space-y-8 p-4">
                {/* Announcements Section */}
                {!loading && !error && (
                    <div className="mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100/50">
                            <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-2">
                                <span>📢</span> {t('auto_321')}
                                                            </h3>
                        </div>
                        <div className="p-6">
                            {announcements.length === 0 ? (
                                <p className="text-sm text-gray-400">{t('auto_235')}</p>
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
                
                {/* Header */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t('auto_220')}</h2>
                    <div className="bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm text-sm font-bold text-gray-500 border border-white/40 shadow-sm">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <CardsSkeleton count={3} />
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
                        <span className="text-2xl">{t('auto_436')}</span>
                        <span className="font-bold">{error}</span>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="glass-card text-center py-20 rounded-3xl border-2 border-dashed border-violet-200 bg-white/50 backdrop-blur-sm mx-auto max-w-2xl">
                        <div className="text-6xl mb-6">📅</div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">{t('auto_222')}</h3>
                        <p className="text-gray-500 font-medium text-lg max-w-sm mx-auto">
                            {t('auto_413')}
                                                            </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <div key={cls.id} className="glass-card flex flex-col rounded-3xl p-6 group hover:border-violet-300/50 hover:-translate-y-1 transition-all duration-300">
                                {/* Class Info */}
                                <div className="mb-6 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-800 group-hover:text-violet-700 transition-colors">{cls.name}</h3>
                                        <p className="text-sm text-violet-500 font-bold uppercase tracking-wider mt-1">{cls.subject?.name || 'General'}</p>
                                    </div>
                                    <div className="rounded-xl bg-violet-50 px-3 py-1 text-xs font-black text-violet-600 border border-violet-100 shrink-0">
                                        {cls._count?.students ?? 0} {t('auto_363')}
                                                                            </div>
                                </div>

                                {/* 3 Action Buttons */}
                                <div className="mt-auto pt-5 border-t border-gray-100/50 grid grid-cols-1 gap-2">
                                    <Link
                                        href={`/dashboard/classes/${cls.id}`}
                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 hover:bg-violet-700 hover:-translate-y-0.5 transition-all"
                                    >
                                        <span>👥</span> {t('auto_402')}
                                                                            </Link>
                                    <Link
                                        href={`/dashboard/classes/${cls.id}/attendance`}
                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 hover:-translate-y-0.5 transition-all"
                                    >
                                        <span>✅</span> {t('auto_370')}
                                                                            </Link>
                                    <Link
                                        href="/dashboard/homework"
                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5 transition-all"
                                    >
                                        <span>📚</span> {t('auto_174')}
                                                                            </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
