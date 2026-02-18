'use client';

import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '@/lib/api';
import { X } from 'lucide-react';

type TopUpModalProps = {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    onSuccess: () => void;
};

const PRESET_AMOUNTS = [10, 20, 50, 100] as const;
const MAX_AMOUNT = 10_000;
const MIN_AMOUNT = 1;

export default function TopUpModal({ isOpen, onClose, studentId, onSuccess }: TopUpModalProps) {
    const [amount, setAmount] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    // Escape key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '') {
            setAmount('');
            return;
        }
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
            setAmount(parsed);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation with user feedback
        const numAmount = Number(amount);
        if (amount === '' || numAmount <= 0 || numAmount < MIN_AMOUNT) {
            setError(`Please enter a valid amount (min $${MIN_AMOUNT}).`);
            return;
        }

        if (numAmount > MAX_AMOUNT) {
            setError(`Maximum top-up amount is $${MAX_AMOUNT.toLocaleString()}.`);
            return;
        }

        // Sanitize to 2 decimal places for financial precision
        const sanitizedAmount = Math.round(Number(amount) * 100) / 100;

        setLoading(true);
        setError(null);
        try {
            await financeApi.topUpWallet(studentId, sanitizedAmount);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            let message = 'Top-up failed. Please try again.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
                message = axiosErr.response?.data?.message || axiosErr.message || message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [amount, studentId, onSuccess, onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    }, [loading, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-modal-title"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 id="topup-modal-title" className="text-xl font-black text-gray-800">
                        Top Up Wallet
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close modal"
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div
                            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="topup-amount" className="block text-sm font-bold text-gray-700 mb-2">
                            Amount to Add ($)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" aria-hidden="true">
                                $
                            </span>
                            <input
                                id="topup-amount"
                                type="number"
                                min={MIN_AMOUNT}
                                max={MAX_AMOUNT}
                                step="0.01"
                                className="w-full pl-8 pr-4 py-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 font-bold text-lg outline-none transition-all"
                                placeholder="0.00"
                                value={amount}
                                onChange={handleAmountChange}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-3" role="group" aria-label="Preset amounts">
                        {PRESET_AMOUNTS.map((val) => (
                            <button
                                key={val}
                                type="button"
                                disabled={loading}
                                onClick={() => setAmount(val)}
                                className={`flex-1 py-2 rounded-xl font-bold text-sm border ${amount === val
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                    } transition-all disabled:opacity-50`}
                            >
                                ${val}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || amount === '' || Number(amount) <= 0}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Confirm Top Up'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
