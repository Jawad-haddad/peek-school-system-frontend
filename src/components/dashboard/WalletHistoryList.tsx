'use client';

import { useState, useEffect } from 'react';
import { financeApi } from '@/lib/api';

interface Transaction {
    id: string;
    amount: number;
    type: 'TOPUP' | 'PURCHASE';
    description: string;
    date: string; // ISO string
}

interface WalletHistoryListProps {
    studentId: string;
}

export default function WalletHistoryList({ studentId }: WalletHistoryListProps) {
    const [history, setHistory] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const response = await financeApi.fetchWalletHistory(studentId);
                // fetchWalletHistory returns unwrapped data — plain array or { history: [...] }
                const data = (response as any)?.history ?? (Array.isArray(response) ? response : []);
                setHistory(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch wallet history", error);
                // Error toast already handled in api.ts
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [studentId]);

    if (!studentId) {
        return (
            <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Select a student to view wallet history.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-medium">No transactions found.</p>
                <p className="text-sm text-gray-400 mt-1">Recent wallet activity will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-lg">Wallet History</h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{history.length} Transactions</span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {history.map((tx) => (
                    <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${tx.type === 'TOPUP'
                                ? 'bg-green-100/50 text-green-600'
                                : 'bg-rose-100/50 text-rose-600'
                                }`}>
                                {tx.type === 'TOPUP' ? '💰' : '🛒'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                    {tx.description || (tx.type === 'TOPUP' ? 'Wallet Top-up' : 'Canteen Purchase')}
                                </p>
                                <p className="text-xs font-medium text-gray-400">
                                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {' • '}
                                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className={`font-black text-right ${tx.type === 'TOPUP'
                            ? 'text-green-600'
                            : 'text-gray-800'
                            }`}>
                            <span className="text-xs opacity-50 mr-1">{tx.type === 'TOPUP' ? '+' : '-'}</span>
                            ${Math.abs(tx.amount).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
