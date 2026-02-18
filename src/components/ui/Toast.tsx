'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast-events';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastMessage = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const unsubscribe = toast.subscribe((event) => {
            setToasts((prev) => [...prev, event]);

            // Auto-dismiss
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== event.id));
            }, 5000);
        });

        return unsubscribe;
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full fade-in duration-300 max-w-sm
                        ${t.type === 'success' ? 'bg-white border-green-100 text-green-800 shadow-green-100' : ''}
                        ${t.type === 'error' ? 'bg-white border-red-100 text-red-800 shadow-red-100' : ''}
                        ${t.type === 'info' ? 'bg-white border-blue-100 text-blue-800 shadow-blue-100' : ''}
                    `}
                >
                    {t.type === 'success' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                    {t.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
                    {t.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}

                    <p className="text-sm font-medium pr-4">{t.message}</p>

                    <button
                        onClick={() => removeToast(t.id)}
                        className="ml-auto text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
