'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type Subject = {
    id: string;
    name: string;
};

type EditSubjectModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subject: Subject;
};

export default function EditSubjectModal({ isOpen, onClose, onSuccess, subject }: EditSubjectModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (subject) {
            setName(subject.name);
        }
    }, [subject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/academics/subjects/${subject.id}`, { name });
            alert("Subject updated!");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to update subject", err);
            let msg = err.message || err.response?.data?.message || 'Failed to update subject.';
            if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
                msg = err.details[0].message || err.details[0].string || Object.values(err.details[0])[0] || msg;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Edit Subject</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 font-bold">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Mathematics"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                        >
                            Cancel
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
