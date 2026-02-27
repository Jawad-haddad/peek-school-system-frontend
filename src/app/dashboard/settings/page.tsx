'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Existing Years State
    const [academicYears, setAcademicYears] = useState<{ id: string, name: string, isActive: boolean }[]>([]);

    const endYear = startYear + 1;
    const yearName = `${startYear}-${endYear}`;

    // Generate upcoming years for dropdown
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

    // Initial Fetch
    useState(() => {
        fetchYears();
    });

    // Helper fetch function
    async function fetchYears() {
        try {
            const res = await api.get('/academic-years');
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setAcademicYears(data);
        } catch (err) {
            console.error("Failed to load years", err);
        }
    }

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const payload = {
            name: yearName,
            startDate: `${startYear}-09-01`,
            endDate: `${endYear}-06-30`
        };

        try {
            await api.post('/academic-years', payload);
            setMessage('Academic Year created successfully!');
            fetchYears(); // Refresh list
        } catch (error: any) {
            console.error("Create Academic Year Error:", error);
            let logMsg = error.response?.data?.message || error.message || 'Unknown Error';
            if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details) && error.details.length > 0) {
                logMsg = error.details[0].message || error.details[0].string || Object.values(error.details[0])[0] || logMsg;
            }
            setMessage(`Failed to create: ${logMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteYear = async (id: string, name: string) => {
        // STRICT CONFIRMATION STRING AS REQUESTED
        if (!confirm(`⚠️ This will delete ALL classes and students for this year. Are you sure?`)) {
            return;
        }

        try {
            await api.delete(`/academic-years/${id}`);
            fetchYears(); // Refresh
        } catch (error: any) {
            alert('Failed to delete: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>

            {/* Create Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Create Academic Year</h2>
                <form onSubmit={handleCreateYear} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                        <select
                            value={startYear}
                            onChange={(e) => setStartYear(Number(e.target.value))}
                            className="block w-full max-w-xs rounded-lg border-gray-300 bg-white border px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Preview</p>
                        <div className="mt-2 text-gray-900">
                            <p className="text-lg font-medium">Academic Year: <span className="text-indigo-600">{yearName}</span></p>
                            <p className="text-sm text-gray-600 mt-1">Duration: {startYear}-09-01 to {endYear}-06-30</p>
                        </div>
                    </div>

                    {message && <p className={`text-sm ${message.includes('success') || message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Academic Year'}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Academic Years</h2>
                {academicYears.length === 0 ? (
                    <p className="text-gray-500">No academic years found.</p>
                ) : (
                    <div className="space-y-3">
                        {academicYears.map(year => (
                            <div key={year.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-800">{year.name} {year.isActive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">ACTIVE</span>}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteYear(year.id, year.name)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Year"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
