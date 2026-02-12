// src/components/EditClassForm.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Type للسنوات الأكاديمية
type AcademicYear = {
    id: string;
    name: string;
    isActive: boolean;
};

// Type للفصل الذي سنستقبله
type Class = {
    id: string;
    name: string;
    academicYearId: string;
};

type EditClassFormProps = {
    classData: Class; // استقبال بيانات الفصل الحالية
    onClose: () => void;
    onSuccess: () => void;
};

export default function EditClassForm({ classData, onClose, onSuccess }: EditClassFormProps) {
    // تعبئة الحالات بالبيانات الحالية
    const [name, setName] = useState(classData.name);
    const [selectedYearId, setSelectedYearId] = useState(classData.academicYearId);

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // جلب السنوات الأكاديمية للقائمة المنسدلة
    useEffect(() => {
        const fetchAcademicYears = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/schools/academic-years', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAcademicYears(response.data);
            } catch (err) {
                setError("Failed to load academic years.");
            } finally {
                setLoadingYears(false);
            }
        };
        fetchAcademicYears();
    }, []);

    // التأكد من تحديث الفورم إذا تغيرت بيانات الفصل
    useEffect(() => {
        setName(classData.name);
        setSelectedYearId(classData.academicYearId);
    }, [classData]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedYearId) {
            setError("Please select an academic year.");
            return;
        }
        setError('');
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');

        try {
            // استخدام PUT وإرسال الطلب إلى الرابط الصحيح
            await axios.put(
                `/api/schools/classes/${classData.id}`,
                {
                    name,
                    academicYearId: selectedYearId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update class.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Edit Class</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>

                    {/* Academic Year Dropdown */}
                    <div>
                        <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700">Academic Year</label>
                        <select
                            id="academicYear"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                            required
                            disabled={loadingYears}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name</label>
                        <input type="text" id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || loadingYears} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}