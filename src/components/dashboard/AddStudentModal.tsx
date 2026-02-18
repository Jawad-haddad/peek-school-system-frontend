'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type AddStudentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classId?: string;
};

type ClassOption = {
    id: string;
    name: string;
};

export default function AddStudentModal({ isOpen, onClose, onSuccess, classId: preSelectedClassId }: AddStudentModalProps) {
    const [fullName, setFullName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [gender, setGender] = useState('MALE');
    const [dob, setDob] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(preSelectedClassId || '');
    const [nfcTagId, setNfcTagId] = useState('');
    const [walletBalance, setWalletBalance] = useState('');

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
                fullName,
                classId: selectedClassId,
                gender,
                dob,
                parentEmail,
                parentPhone,
                nfcTagId,
                walletBalance: walletBalance ? parseFloat(walletBalance) : 0,
            });
            onSuccess();
            onClose();
            // Reset Form via unmount/remount usually, but here manually:
            setFullName('');
            setParentEmail('');
            setParentPhone('');
            setDob('');
            setGender('MALE');
            setNfcTagId('');
            setWalletBalance('');
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

                    <div className="space-y-5">
                        {/* Input 1: Full Name */}
                        <div>
                            <label className={labelClasses}>Full 4-Part Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g. Leo Andres Messi Cuccittini"
                            />
                        </div>

                        {/* Input 2: Class Dropdown */}
                        <div>
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

                        {/* Input 3: Gender & DOB */}
                        <div className="grid grid-cols-2 gap-4">
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

                        {/* Input 4: Parent Email */}
                        <div>
                            <label className={labelClasses}>Parent's Email (for Login)</label>
                            <input
                                type="email"
                                required
                                value={parentEmail}
                                onChange={(e) => setParentEmail(e.target.value)}
                                className={inputClasses}
                                placeholder="parent@example.com"
                            />
                        </div>

                        {/* Input 5: Parent Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Parent Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                    className={inputClasses}
                                    placeholder="+1 234..."
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>NFC Tag ID (Optional)</label>
                                <input
                                    type="text"
                                    value={nfcTagId}
                                    onChange={(e) => setNfcTagId(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Scan card..."
                                />
                            </div>
                        </div>

                        {/* Input 6: Wallet */}
                        <div>
                            <label className={labelClasses}>Initial Wallet Credit (JOD)</label>
                            <input
                                type="number"
                                step="any"
                                value={walletBalance}
                                onChange={(e) => setWalletBalance(e.target.value)}
                                className={inputClasses}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
