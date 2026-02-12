import React from 'react';
import { Clock, MapPin, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

/* 
 * Mock Interface matching what we'd expect from src/lib/api
 */
interface Transaction {
    id: string;
    type: 'CANTEEN_PURCHASE' | 'TUITION_PAYMENT' | 'TOP_UP';
    amount: number;
    currency: string;
    location: string; // e.g., "Main Canteen", "Admin Office"
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    createdAt: string;
}

interface WalletHistoryListProps {
    studentId: string;
}

export default function WalletHistoryList({ studentId }: WalletHistoryListProps) {
    // Mock Data Generator
    const transactions: Transaction[] = [
        {
            id: 'tx-1',
            type: 'CANTEEN_PURCHASE',
            amount: -2.50,
            currency: 'JOD',
            location: 'Main Canteen',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        },
        {
            id: 'tx-2',
            type: 'CANTEEN_PURCHASE',
            amount: -1.75,
            currency: 'JOD',
            location: 'Sports Hall Kiosk',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        },
        {
            id: 'tx-3',
            type: 'TOP_UP',
            amount: 20.00,
            currency: 'JOD',
            location: 'Parent App',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
            id: 'tx-4',
            type: 'CANTEEN_PURCHASE',
            amount: -3.00,
            currency: 'JOD',
            location: 'Main Canteen',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 1 day 1 hour ago
        },
        {
            id: 'tx-5',
            type: 'TUITION_PAYMENT',
            amount: -150.00,
            currency: 'JOD',
            location: 'Admin Office',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        },
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Clock size={18} className="text-violet-500" />
                Recent History
            </h3>

            {/* Mobile / Card View (Visible on small screens) */}
            <div className="block md:hidden space-y-3">
                {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{tx.location}</p>
                                <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`font-black text-sm block ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{tx.type.replace('_', ' ')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop / Table View (Hidden on small screens) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600">{formatDate(tx.createdAt)}</td>
                                <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-400" />
                                    {tx.location}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider">{tx.type.replace('_', ' ')}</td>
                                <td className={`px-4 py-3 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} <span className="text-xs font-normal text-gray-400">{tx.currency}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
