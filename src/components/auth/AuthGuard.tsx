'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { t } = useLang();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">{t('auto_393')}</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
