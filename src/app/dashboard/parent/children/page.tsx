'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { CardsSkeleton } from '@/components/ui/Skeletons';
import { parentApi, ChildRecord, formatApiError } from '@/lib/api';
import { permissions } from '@/lib/permissions';
import { useLang } from '@/lib/LangProvider';

function ChildrenList() {
    const { t } = useLang();
    const [children, setChildren] = useState<ChildRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        parentApi
            .getMyChildren()
            .then(setChildren)
            .catch((err) => setError(formatApiError('Could not load children', err)))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">{t('auto_219')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('auto_403')}</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">{t('auto_436')}</span>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading && <CardsSkeleton count={3} />}

            {/* Empty */}
            {!loading && !error && children.length === 0 && (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                    <p className="text-5xl mb-4">{t('auto_447')}</p>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">{t('auto_239')}</h2>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        {t('auto_088')}
                                            </p>
                </div>
            )}

            {/* Cards */}
            {!loading && !error && children.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
                        >
                            {/* Avatar + name */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm flex-shrink-0">
                                    {(child.fullName?.trim()?.[0] ?? '?').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-extrabold text-gray-800 text-lg leading-tight truncate">
                                        {child.fullName || 'Unknown Student'}
                                    </h2>
                                    {child.class && (
                                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">
                                            {child.class.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quick-link buttons */}
                            <div className="flex gap-3 mt-auto">
                                <Link
                                    href={`/dashboard/parent/children/${child.id}/attendance`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-sm py-2.5 rounded-2xl transition-colors border border-teal-100"
                                >
                                    {t('auto_439')}
                                                                    </Link>
                                <Link
                                    href={`/dashboard/parent/children/${child.id}/homework`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm py-2.5 rounded-2xl transition-colors border border-blue-100"
                                >
                                    {t('auto_449')}
                                                                    </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ChildrenPage() {
    return (
        <ProtectedRoute allowed={permissions.isParent}>
            <ChildrenList />
        </ProtectedRoute>
    );
}
