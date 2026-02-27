'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type AddSubjectModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type Option = {
    id: string;
    name: string;
};

export default function AddSubjectModal({ isOpen, onClose, onSuccess }: AddSubjectModalProps) {
    const [name, setName] = useState('');
    const [classId, setClassId] = useState('');
    const [teacherId, setTeacherId] = useState('');

    const [classes, setClasses] = useState<Option[]>([]);
    const [teachers, setTeachers] = useState<Option[]>([]);

    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            // Fetch both classes and teachers
            const [classesRes, teachersRes] = await Promise.all([
                api.get('/school/classes'),
                api.get('/school/teachers')
            ]);

            // Handle array or wrapped data structure
            const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data.data || [];
            const teachersData = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data || [];

            setClasses(classesData);
            // Map teachers to uniform {id, name} structure
            setTeachers(teachersData.map((t: any) => ({
                id: t.id,
                name: t.fullName || t.name
            })));

        } catch (error) {
            console.error("Failed to fetch dropdown data", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/academics/subjects', {
                name,
                classId: classId || undefined,
                teacherId: teacherId || undefined
            });
            onSuccess();
            // Reset form
            setName('');
            setClassId('');
            setTeacherId('');
            onClose();
        } catch (err: any) {
            console.error("Failed to add subject", err);
            let msg = err.message || err.response?.data?.message || 'Failed to add subject.';
            if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
                msg = err.details[0].message || err.details[0].string || Object.values(err.details[0])[0] || msg;
            }
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Subject</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 font-bold">
                            {error}
                        </div>
                    )}

                    {/* Subject Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Mathematics"
                        />
                    </div>

                    {/* Class Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class (Optional)</label>
                        <select
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 bg-white outline-none"
                            disabled={loadingData}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Teacher Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher (Optional)</label>
                        <select
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 bg-white outline-none"
                            disabled={loadingData}
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
