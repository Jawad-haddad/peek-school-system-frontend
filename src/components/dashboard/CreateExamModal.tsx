'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type CreateExamModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type AcademicYear = {
    id: string;
    name: string;
    startYear?: number;
    endYear?: number;
    isActive: boolean;
};

export default function CreateExamModal({ isOpen, onClose, onSuccess }: CreateExamModalProps) {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAcademicYears();
        }
    }, [isOpen]);

    const fetchAcademicYears = async () => {
        setLoadingYears(true);
        try {
            const response = await api.get('/academic-years');
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            setAcademicYears(data);

            const active = data.find((y: AcademicYear) => y.isActive);
            if (active) setAcademicYearId(active.id);
            else if (data.length > 0) setAcademicYearId(data[0].id);

        } catch (err) {
            console.error("Failed to fetch academic years", err);
        } finally {
            setLoadingYears(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!academicYearId) {
            setError("Academic Year is required.");
            setLoading(false);
            return;
        }

        try {
            // Build payload matching backend Exam model: startDate, endDate
            const payload = {
                name,
                startDate: date, // "2026-05-20" format
                endDate: date,   // same day by default
                startTime: String(startTime),
                endTime: String(endTime),
                academicYearId
            };

            console.log('Creating Exam Payload:', payload);

            // Backend exam CRUD routes are under /exams, not /school/exams
            await api.post('/exams', payload);

            onSuccess();
            setName('');
            setDate('');
            setStartTime('');
            setEndTime('');
            onClose();
        } catch (err: any) {

            setError(err.response?.data?.message || 'Failed to create exam.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Create New Exam</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Row 1: Exam Name */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., Final Mathematics Exam"
                        />
                    </div>

                    {/* Row 2: Grid for Date, Start Time, End Time */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Row 3: Academic Year */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                            required
                            value={academicYearId}
                            onChange={(e) => setAcademicYearId(e.target.value)}
                            className={inputClasses}
                            disabled={loadingYears}
                        >
                            {loadingYears ? <option>Loading years...</option> : <option value="">Select Academic Year</option>}
                            {academicYears.map(y => (
                                <option key={y.id} value={y.id}>
                                    {y.startYear && y.endYear ? `${y.startYear} - ${y.endYear}` : y.name} {y.isActive ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md font-bold ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating...' : 'Create Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
