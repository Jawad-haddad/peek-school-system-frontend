'use client';

import { useState } from 'react';
import { X, Phone, User, CreditCard, Calendar, GraduationCap, ShieldCheck, ShieldAlert, AlertTriangle, History } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import WalletHistoryList from './WalletHistoryList';
import api from '@/lib/api';

type Student = {
    id: string;
    fullName?: string;
    name?: string;
    dob?: string;
    gender?: string;
    parentName?: string;
    parentPhone?: string;
    walletBalance?: number;
    className?: string;
    nfcTagId?: string;
    dailySpendingLimit?: number;
    isNfcActive?: boolean;
};

type StudentProfileModalProps = {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    className?: string;
};

export default function StudentProfileModal({ isOpen, onClose, student, className }: StudentProfileModalProps) {
    // Initialize state with prop value, default to true if undefined
    const [isNfcEnabled, setIsNfcEnabled] = useState(student.isNfcActive ?? true);

    if (!isOpen) return null;

    const displayName = student.fullName || student.name || 'Unknown Student';
    const dobDate = student.dob ? new Date(student.dob) : null;

    // Calculate Age
    let age = 'N/A';
    if (dobDate) {
        const today = new Date();
        let years = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            years--;
        }
        age = `${years} Years`;
    }

    const balance = student.walletBalance || 0;
    const isLowBalance = balance < 5;
    const isDebt = balance < 0;
    const dailyLimit = student.dailySpendingLimit || 0;

    const handleNfcToggle = async (checked: boolean) => {
        setIsNfcEnabled(checked);
        try {
            await api.patch(`/school/students/${student.id}`, { isNfcActive: checked });
        } catch (err) {
            console.error('NFC toggle failed:', err);
            // Revert on failure
            setIsNfcEnabled(!checked);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 border border-white/20 my-auto">

                {/* Header / ID Card Top */}
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 pt-12 pb-20 relative text-white text-center shadow-lg">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm z-10"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-bold tracking-tight opacity-90 drop-shadow-sm">Student ID Card</h2>
                    <p className="text-sm font-medium opacity-75 drop-shadow-sm">{className || 'Peek School System'}</p>
                </div>

                {/* Avatar Circle */}
                <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-black/5">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-4xl shadow-inner text-violet-500 font-bold">
                            {displayName.charAt(0)}
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 pt-16 flex-1 space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{displayName}</h1>
                        <p className="text-xs text-gray-400 font-mono mt-1">ID: {(student.nfcTagId || student.id).slice(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 📛 Identity & Class */}
                        <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
                            <GraduationCap size={20} className="text-violet-500 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class</span>
                            <span className="text-sm font-black text-gray-800">{className || 'N/A'}</span>
                        </div>

                        {/* 🎂 Personal */}
                        <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
                            <Calendar size={20} className="text-blue-500 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</span>
                            <span className="text-sm font-black text-gray-800">{age}</span>
                            <span className="text-[10px] text-gray-400">{student.gender || 'N/A'}</span>
                        </div>
                    </div>

                    {/* 💳 Digital Wallet Section */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <CreditCard size={16} /> Digital Wallet
                                    </h3>
                                    <p className="text-[10px] text-gray-400 mt-1">Daily Limit: {dailyLimit} JOD</p>
                                </div>
                                {isLowBalance && !isDebt && (
                                    <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-[10px] font-bold border border-yellow-500/30 flex items-center gap-1">
                                        <AlertTriangle size={10} /> Low Balance
                                    </span>
                                )}
                                {isDebt && (
                                    <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30 flex items-center gap-1">
                                        <AlertTriangle size={10} /> Outstanding
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-black tracking-tight ${isDebt ? 'text-red-400' : 'text-white'}`}>
                                    {balance.toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-gray-400">JOD</span>
                            </div>
                        </div>
                    </div>

                    {/* 🛡️ Security Control */}
                    <div className={`p-4 rounded-2xl border transition-colors ${isNfcEnabled ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isNfcEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {isNfcEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${isNfcEnabled ? 'text-green-800' : 'text-red-800'}`}>
                                        {isNfcEnabled ? 'Canteen Card Active' : 'Canteen Card Frozen'}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                        {isNfcEnabled ? 'Student can make purchases' : 'Purchases are disabled'}
                                    </p>
                                </div>
                            </div>
                            <Switch checked={isNfcEnabled} onChange={handleNfcToggle} />
                        </div>
                    </div>

                    {/* 📜 Transaction History */}
                    <div className="pt-2 border-t border-gray-100">
                        <WalletHistoryList studentId={student.id} />
                    </div>

                    {/* 👨‍👩‍👧‍👦 Guardian Info */}
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white text-gray-400 flex items-center justify-center border border-gray-100 shadow-sm">
                                <User size={16} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Guardian</span>
                                <h3 className="font-bold text-gray-700 text-sm">{student.parentName || 'No Parent Linked'}</h3>
                            </div>
                        </div>
                        {student.parentPhone && (
                            <a
                                href={`tel:${student.parentPhone}`}
                                className="p-2 bg-white hover:bg-green-50 text-green-600 border border-gray-200 rounded-lg shadow-sm transition-all active:scale-95"
                            >
                                <Phone size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
