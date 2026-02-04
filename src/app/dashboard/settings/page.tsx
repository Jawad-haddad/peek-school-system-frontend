'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const endYear = startYear + 1;
    const yearName = `${startYear}-${endYear}`;

    // Generate upcoming years for dropdown (e.g., current year + next 5 years)
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Hardcoding typical academic year dates (Sep 1st to Jun 30th)
        const startDate = `${startYear}-09-01`;
        const endDate = `${endYear}-06-30`;

        console.log("Submitting Academic Year:", { name: yearName, startDate, endDate });

        try {
            await api.post('/academic-years', {
                name: yearName,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                current: true
            });
            setMessage('Academic Year created successfully!');
        } catch (error: any) {
            console.error("Create Academic Year Error:", error);
            const logMsg = error.response?.data?.message || error.message || 'Unknown Error';
            setMessage(`Failed to create Academic Year: ${logMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">System Settings</h1>

            {/* Academic Year Section */}
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
        </div>
    );
}
