'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type SchoolClass = {
    id: string;
    name: string;
    academicYearId?: string;
    defaultFee?: number;
};

type EditClassModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classData: SchoolClass;
};

type AcademicYear = {
    id: string;
    name: string;
};

export default function EditClassModal({ isOpen, onClose, onSuccess, classData }: EditClassModalProps) {
    const [name, setName] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');
    const [defaultFee, setDefaultFee] = useState<number | ''>('');

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAcademicYears();
            setName(classData.name);
            setSelectedYearId(classData.academicYearId || '');
            setDefaultFee(classData.defaultFee || '');
        }
    }, [isOpen, classData]);

    const fetchAcademicYears = async () => {
        setLoadingYears(true);
        try {
            const res = await api.get('/academic-years');
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setAcademicYears(data);
        } catch (err) {
            console.error("Failed to fetch academic years", err);
        } finally {
            setLoadingYears(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await api.put(`/school/classes/${classData.id}`, {
                name,
                academicYearId: selectedYearId,
                defaultFee: defaultFee ? Number(defaultFee) : undefined
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to update class", err);
            setError(err.response?.data?.message || 'Failed to update class.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "w-full px-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-gray-700";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Edit Class</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 font-bold">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Class Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                        <select
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                            className={inputClasses}
                            disabled={loadingYears}
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>{year.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Annual Fee (JOD)</label>
                        <input
                            type="number"
                            value={defaultFee}
                            onChange={(e) => setDefaultFee(e.target.value ? Number(e.target.value) : '')}
                            className={inputClasses}
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-bold mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 transition-all font-bold"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
