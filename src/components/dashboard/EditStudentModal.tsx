'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLang } from '@/lib/LangProvider';

type Student = {
    id: string;
    fullName?: string;
    name?: string;
    email?: string;
    parentEmail?: string;
    phone?: string;
    walletBalance?: number;
};

type EditStudentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: Student;
};

export default function EditStudentModal({ isOpen, onClose, onSuccess, student }: EditStudentModalProps) {
    const { t } = useLang();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        walletBalance: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                fullName: student.fullName || student.name || '',
                email: student.email || student.parentEmail || '', // Assuming email might be parentEmail if student email is missing
                walletBalance: student.walletBalance || 0
            });
        }
    }, [student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/school/students/${student.id}`, formData);
            alert(t('auto_361'));
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to update student", err);
            alert(t('auto_157'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">{t('auto_121')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto_165')}</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto_124')}</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto_405')}</label>
                            <input
                                type="number"
                                value={formData.walletBalance}
                                onChange={(e) => setFormData({ ...formData, walletBalance: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                        >
                            {t('auto_065')}
                                                    </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
