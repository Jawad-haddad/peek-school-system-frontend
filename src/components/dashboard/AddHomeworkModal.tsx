'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type AddHomeworkModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art', 'Geography', 'Physics', 'Chemistry'];

type ClassOption = {
    id: string;
    name: string;
};

export default function AddHomeworkModal({ isOpen, onClose, onSuccess }: AddHomeworkModalProps) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [classId, setClassId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [noClassesFound, setNoClassesFound] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
        }
    }, [isOpen]);

    const fetchClasses = async () => {
        setLoadingClasses(true);
        setNoClassesFound(false);
        try {
            const response = await api.get('/school/classes');


            // Handle both array and { data: [...] } structure
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            const classList = Array.isArray(data) ? data : [];

            setClasses(classList);

            if (classList.length === 0) {
                setNoClassesFound(true);
            }
        } catch (err: any) {
            console.error("Failed to fetch classes", err);
            setError(err.response?.data?.message || 'Failed to load classes');
        } finally {
            setLoadingClasses(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!classId) {
            setError("Please select a class.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/academics/homework', {
                title,
                subject,
                classId,
                dueDate,
                description,
            });
            onSuccess();
            setTitle('');
            setSubject('');
            setClassId('');
            setDueDate('');
            setDescription('');
            onClose();
        } catch (err: any) {

            setError(err.response?.data?.message || 'Failed to create assignment. Please try again.');
            if (err.response?.status === 403) setError('You do not have permission to create homework.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative z-50">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Assign Homework</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., Algebra Worksheet 3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <select
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="">Select Subject</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class
                                {loadingClasses && <span className="ml-2 text-xs text-purple-500">Loading...</span>}
                            </label>

                            {noClassesFound ? (
                                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 flex items-center gap-1">
                                    ⚠️ No classes assigned. Contact Admin.
                                </div>
                            ) : (
                                <select
                                    required
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className={`${inputClasses} ${loadingClasses ? 'opacity-50 cursor-wait' : ''}`}
                                    disabled={loadingClasses}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={inputClasses}
                            placeholder="Instructions for the students..."
                        />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || noClassesFound || !classId}
                            className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md font-bold ${loading || noClassesFound || !classId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Assigning...' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
