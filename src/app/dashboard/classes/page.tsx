'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AddClassModal from '@/components/dashboard/AddClassModal';

type SchoolClass = {
    id: string;
    name: string;
    academicYear?: { name: string };
    _count?: { students: number };
};

export default function ClassesPage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/classes');
            console.log("Classes Data:", response.data); // Debug log as requested

            const data = Array.isArray(response.data) ? response.data : response.data.data || [];

            // Allow empty array without error
            setClasses(data);
            setError('');
        } catch (err) {
            console.error("Failed to fetch classes:", err);
            // Don't show error UI for just empty list, but do for actual failures if critical
            // Here we set error text to show user something went wrong
            setError("Failed to load classes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will affect all students in this class.")) return;
        try {
            await api.delete(`/school/classes/${id}`);
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete class");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Manage Classes</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2"
                >
                    <span>+</span> Add Class
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading classes...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
                    {error}
                </div>
            ) : classes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
                    <div className="text-4xl mb-4">🏫</div>
                    <p className="text-gray-500">No classes found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                                    <p className="text-sm text-gray-500">{cls.academicYear?.name || 'No Year'}</p>
                                </div>
                                <div className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                                    {cls._count?.students || 0} Students
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleDelete(cls.id)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddClassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClasses}
            />
        </div>
    );
}