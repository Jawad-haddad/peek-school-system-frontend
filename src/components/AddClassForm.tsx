'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type AcademicYear = {
    id: string;
    name: string;
    isActive: boolean;
};

type AddClassFormProps = {
    onClose: () => void;
    onSuccess: () => void;
};

// Renaming component to AddClassModal as per User Request in prompt "Output the code for ... AddClassModal.tsx"
// But keeping filename logic consistent or creating a new file? 
// User asked to "Fix 'Add Class' Modal", file listing shows AddClassForm.tsx. 
// I will keep the content as a Modal logic.
export default function AddClassModal({ onClose, onSuccess }: AddClassFormProps) {
    const [name, setName] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                // Using correct endpoint /api/academic-years
                const response = await api.get('/academic-years');
                setAcademicYears(response.data);

                const activeYear = response.data.find((year: AcademicYear) => year.isActive);
                if (activeYear) {
                    setSelectedYearId(activeYear.id);
                } else if (response.data.length > 0) {
                    setSelectedYearId(response.data[0].id);
                }
            } catch (err) {
                console.error("Failed to load academic years", err);
                setError("Failed to load academic years. Please check settings.");
            } finally {
                setLoadingYears(false);
            }
        };
        fetchAcademicYears();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedYearId) {
            setError("Please select an academic year.");
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await api.post('/schools/classes', {
                name,
                academicYearId: selectedYearId,
            }
            );

            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add class.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Add New Class</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Academic Year Dropdown */}
                    <div>
                        <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                            id="academicYear"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                            required
                            disabled={loadingYears}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                        >
                            {loadingYears ? (
                                <option>Loading years...</option>
                            ) : (
                                <>
                                    <option value="">Select a year</option>
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.name} {year.isActive && '(Active)'}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* Class Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Grade 1 - Section A"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || loadingYears} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm">
                            {isSubmitting ? 'Adding...' : 'Add Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}