'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AddSubjectModal from '@/components/dashboard/AddSubjectModal';

type Subject = {
    id: string;
    name: string;
};

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/academics/subjects');
            setSubjects(response.data);
        } catch (err) {
            console.error("Error fetching subjects:", err);
            setError("Failed to fetch subjects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/academics/subjects/${id}`);
            setSubjects(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete subject");
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Subjects</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
                >
                    + Add Subject
                </button>
            </div>

            {loading && <p className="text-center text-gray-500">Loading subjects...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">Subject Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {subjects.map((subject) => (
                                <tr key={subject.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{subject.name}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="text-red-600 hover:text-red-900 ml-4"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                        No subjects found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AddSubjectModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchSubjects}
            />
        </div>
    );
}