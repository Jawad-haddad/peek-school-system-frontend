'use client';

import { useState, useEffect } from 'react';
import api, { academicApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import AddTeacherModal from '@/components/dashboard/AddTeacherModal';

type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    specialization?: string; // "Subject"
    classId?: string; // Assigned class
    classes?: string[]; // Array of class names
};

export default function TeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const response = await academicApi.fetchTeachers();
            const data = Array.isArray(response.data.teachers || response.data)
                ? (response.data.teachers || response.data)
                : [];

            setTeachers(data.map((t: any) => ({
                ...t,
                fullName: t.fullName || t.name || 'Unknown Teacher'
            })));
        } catch (err: any) {
            console.error("Failed to fetch teachers:", err);
            setError(err.response?.data?.message || "Failed to load teachers.");
            if (err.response?.status === 403) setError("Access denied to teachers list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        try {
            await api.delete(`/school/teachers/${id}`);
            setTeachers(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            console.error("Failed to delete teacher:", err);
            setError(err.response?.data?.message || "Failed to delete teacher.");
            if (err.response?.status === 403) setError("Access denied to delete teacher.");
        }
    };

    const handleOpenModal = (teacher?: Teacher) => {
        setEditingTeacher(teacher || null);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Manage Teachers</h1>
                    <p className="text-gray-500 font-medium">Faculty and staff directory</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-bold"
                >
                    <span className="text-xl">+</span> Add Teacher
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-violet-600 mx-auto mb-4"></div>
                    <p className="text-violet-500 font-bold animate-pulse">Loading teachers...</p>
                </div>
            ) : teachers.length === 0 ? (
                <div className="glass-card text-center py-20 rounded-3xl">
                    <div className="text-6xl mb-6">👨‍🏫</div>
                    <p className="text-gray-400 font-medium text-xl">No teachers found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <div className="col-span-4">Teacher</div>
                        <div className="col-span-4">Contact</div>
                        <div className="col-span-3">Classes</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Teacher Rows */}
                    {teachers.map((teacher) => (
                        <div key={teacher.id} className="glass-card group p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-violet-300/50 transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-black text-lg shadow-sm">
                                    {(teacher.fullName || 'T').charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-violet-700 transition-colors">{teacher.fullName}</h3>
                                    <span className="text-xs text-violet-500 font-bold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">Faculty</span>
                                </div>
                            </div>

                            <div className="col-span-4 text-sm text-gray-500 font-medium break-all">
                                {teacher.email}
                            </div>

                            <div className="col-span-3">
                                {teacher.classes && teacher.classes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {teacher.classes.map((c, i) => (
                                            <span key={i} className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{c}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No classes assigned</span>
                                )}
                            </div>

                            <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(teacher)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(teacher.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddTeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTeachers}
                teacherToEdit={editingTeacher}
            />
        </div>
    );
}