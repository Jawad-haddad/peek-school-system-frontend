'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type AddStudentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classId?: string; // Made optional
};

type ClassOption = {
    id: string;
    name: string;
};

export default function AddStudentModal({ isOpen, onClose, onSuccess, classId: preSelectedClassId }: AddStudentModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('MALE');
    const [dob, setDob] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(preSelectedClassId || '');

    // Data Loading
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // If no class pre-selected, fetch them
            if (!preSelectedClassId) {
                fetchClasses();
            } else {
                setSelectedClassId(preSelectedClassId);
            }
            // Auto-generate password on open
            generatePassword();
        }
    }, [isOpen, preSelectedClassId]);

    const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
            const res = await api.get('/school/classes');
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setClasses(data);
        } catch (err) {
            console.error("Failed to load classes", err);
            setError("Could not load classes. Please refresh.");
        } finally {
            setLoadingClasses(false);
        }
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let newPass = "";
        for (let i = 0; i < 10; i++) {
            newPass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!selectedClassId) {
            setError("Please select a class.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/school/students', {
                name,
                email, // Parent Email
                password,
                classId: selectedClassId,
                gender,
                dob
            });
            onSuccess();
            onClose();
            // Reset Form via unmount/remount usually, but here manually:
            setName('');
            setEmail('');
            setDob('');
        } catch (err: any) {
            console.error("Failed to add student", err);
            setError(err.response?.data?.message || 'Failed to add student.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "w-full px-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-gray-700";
    const labelClasses = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Add New Student</h2>
                        <p className="text-gray-500 text-sm font-medium">Create student profile & parent account</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                    {error && (
                        <div className="p-4 text-sm font-bold text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2">
                            <label className={labelClasses}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. Leo Messi"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className={labelClasses}>Class Assignment</label>
                            {preSelectedClassId ? (
                                <div className="px-4 py-3 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-100 flex items-center gap-2">
                                    🔒 Class Pre-selected
                                </div>
                            ) : (
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className={inputClasses}
                                    disabled={loadingClasses}
                                >
                                    <option value="">Select a Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Gender</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Date of Birth</label>
                            <input
                                type="date"
                                required
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 mt-2">Parent Access</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className={labelClasses}>Parent Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClasses}
                                    placeholder="parent@example.com"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Auto-Generated Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={password}
                                        className={`${inputClasses} bg-gray-100 text-gray-500 font-mono tracking-wider`}
                                    />
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
                                        title="Regenerate"
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:shadow-lg hover:shadow-violet-200 transition-all font-bold flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Create Student'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
