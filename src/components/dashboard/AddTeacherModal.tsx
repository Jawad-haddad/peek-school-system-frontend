'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    specialization?: string;
    classId?: string;
    classes?: string[];
};

type ClassOption = {
    id: string;
    name: string;
};

type AddTeacherModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    teacherToEdit?: Teacher | null;
};

export default function AddTeacherModal({ isOpen, onClose, onSuccess, teacherToEdit }: AddTeacherModalProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
    });

    // Multi-class selection
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Fetch classes when modal opens
            const fetchClasses = async () => {
                try {
                    const res = await api.get('/school/classes', {
                        params: { _t: Date.now() }
                    });
                    const classesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    setClasses(classesData.map((c: any) => ({
                        id: c.id,
                        name: c.name || 'Unknown Class'
                    })));
                } catch (err) {
                    console.error("Failed to fetch classes", err);
                }
            };
            fetchClasses();

            // Pre-fill if editing
            if (teacherToEdit) {
                setFormData({
                    fullName: teacherToEdit.fullName || '',
                    email: teacherToEdit.email || '',
                    password: '',
                    phone: teacherToEdit.phone || teacherToEdit.phoneNumber || '',
                });
                // Pre-select the teacher's existing classes
                if (teacherToEdit.classId) {
                    setSelectedClassIds([teacherToEdit.classId]);
                } else if (teacherToEdit.classes && teacherToEdit.classes.length > 0) {
                    // If we have class names but no IDs, we'll match by name later
                    setSelectedClassIds([]);
                } else {
                    setSelectedClassIds([]);
                }
            } else {
                setFormData({ fullName: '', email: '', password: '', phone: '' });
                setSelectedClassIds([]);
            }
            setError('');
        }
    }, [isOpen, teacherToEdit]);

    const toggleClass = (classId: string) => {
        setSelectedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload: any = {
                ...formData,
                classIds: selectedClassIds, // Send array for multi-assignment
                classId: selectedClassIds[0] || undefined, // Backward compat: send first class as classId
            };

            if (teacherToEdit) {
                if (!payload.password) delete payload.password;
                await api.put(`/school/teachers/${teacherToEdit.id}`, payload);
            } else {
                await api.post('/school/teachers', payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Teacher form error:", err);
            setError(err.response?.data?.message || "Operation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white">
                    <h2 className="text-2xl font-black tracking-tight">
                        {teacherToEdit ? 'Edit Teacher' : 'Add New Teacher'}
                    </h2>
                    <p className="text-white/80 text-sm">Enter faculty details below</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                                placeholder="john@school.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                                placeholder="+962..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Password {teacherToEdit && <span className="text-gray-400 font-normal">(Leave blank to keep)</span>}
                        </label>
                        <input
                            type="password"
                            required={!teacherToEdit}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Multi-Class Assignment */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Assign Classes <span className="text-gray-400 font-normal">(click to select multiple)</span>
                        </label>
                        {classes.length === 0 ? (
                            <p className="text-gray-400 text-sm italic p-3">Loading classes...</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-100 rounded-xl min-h-[48px] bg-gray-50/50">
                                {classes.map(cls => {
                                    const isSelected = selectedClassIds.includes(cls.id);
                                    return (
                                        <button
                                            key={cls.id}
                                            type="button"
                                            onClick={() => toggleClass(cls.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isSelected
                                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-105'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                                                }`}
                                        >
                                            {isSelected && <span className="mr-1">✓</span>}
                                            {cls.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedClassIds.length > 0 && (
                            <p className="text-xs text-violet-500 font-medium mt-1.5">
                                {selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''} selected
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Teacher'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
