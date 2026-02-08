'use client';

import { X, Phone, User, CreditCard, Calendar, GraduationCap } from 'lucide-react';

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
};

type StudentProfileModalProps = {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    className?: string;
};

export default function StudentProfileModal({ isOpen, onClose, student, className }: StudentProfileModalProps) {
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
    const isDebt = balance < 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 border border-white/20">

                {/* Header / ID Card Top */}
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 pt-12 pb-20 relative text-white text-center shadow-lg">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-bold tracking-tight opacity-90 drop-shadow-sm">Student ID Card</h2>
                    <p className="text-sm font-medium opacity-75 drop-shadow-sm">{className || 'Peek School System'}</p>
                </div>

                {/* Avatar Circle */}
                <div className="absolute top-28 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-black/5">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-4xl shadow-inner text-violet-500 font-bold">
                            {displayName.charAt(0)}
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 pt-16 flex-1">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{displayName}</h1>
                        <p className="text-xs text-gray-400 font-mono mt-1">ID: {(student.nfcTagId || student.id).slice(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 📛 Identity & Class */}
                        <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors hover:shadow-sm">
                            <GraduationCap size={20} className="text-violet-500 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class</span>
                            <span className="text-sm font-black text-gray-800">{className || 'N/A'}</span>
                        </div>

                        {/* 🎂 Personal */}
                        <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors hover:shadow-sm">
                            <Calendar size={20} className="text-blue-500 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</span>
                            <span className="text-sm font-black text-gray-800">{age}</span>
                            <span className="text-[10px] text-gray-400">{student.gender || 'N/A'}</span>
                        </div>

                        {/* 💳 Finance */}
                        <div className={`col-span-2 bg-white/60 p-4 rounded-2xl border flex items-center justify-between px-6 hover:bg-white transition-colors hover:shadow-sm ${isDebt ? 'border-red-100 bg-red-50/10' : 'border-green-100 bg-green-50/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isDebt ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wallet Balance</span>
                                    <span className={`text-lg font-black ${isDebt ? 'text-red-500' : 'text-green-600'}`}>
                                        {balance > 0 ? `+${balance}` : balance} <span className="text-xs">JOD</span>
                                    </span>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDebt ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {isDebt ? 'Outstanding' : 'Paid'}
                            </span>
                        </div>
                    </div>

                    {/* 👨‍👩‍👧‍👦 Guardian */}
                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-violet-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Guardian</span>
                                <h3 className="font-bold text-gray-800 text-sm">{student.parentName || 'No Parent Linked'}</h3>
                            </div>
                        </div>
                        {student.parentPhone && (
                            <a
                                href={`tel:${student.parentPhone}`}
                                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 group-hover:scale-110"
                            >
                                <Phone size={18} fill="currentColor" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
