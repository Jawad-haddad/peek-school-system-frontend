'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/permissions';
import Link from 'next/link';
import { useLang } from '@/lib/LangProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowed: (role: Role) => boolean;
}

export default function ProtectedRoute({ children, allowed }: ProtectedRouteProps) {
    const { t } = useLang();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedRole = localStorage.getItem('role') as Role;
        if (!allowed(storedRole)) {
            setIsAuthorized(false);
        } else {
            setIsAuthorized(true);
        }
    }, [allowed]);

    if (isAuthorized === null) return null; // Wait for client hydration

    if (!isAuthorized) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mb-6 border-8 border-rose-100/50">
                    🔒
                </div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">{t('auto_020')}</h1>
                <p className="text-gray-500 font-medium mb-8 max-w-md">
                    {t('auto_412')}
                                    </p>
                <Link
                    href="/dashboard"
                    className="font-bold text-white bg-gray-900 hover:bg-gray-800 px-8 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                >
                    {t('auto_309')}
                                    </Link>
            </div>
        );
    }

    return <>{children}</>;
}
