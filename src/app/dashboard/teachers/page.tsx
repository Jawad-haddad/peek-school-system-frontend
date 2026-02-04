'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    specialization?: string; // "Subject"
    classId?: string; // Assigned class
};

type ClassOption = {
    id: string;
    name: string;
};

export default function TeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        classId: '',
    });
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [submitting, setSubmitting] = useState(false);


    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/teachers');
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];

            setTeachers(data.map((t: any) => ({
                ...t,
                fullName: t.fullName || t.name || 'Unknown Teacher'
            })));
        } catch (err) {
            console.error("Failed to fetch teachers:", err);
            setError("Failed to load teachers.");
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/school/classes');
            setClasses(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchClasses();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        try {
            await api.delete(`/school/teachers/${id}`);
            setTeachers(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to delete teacher:", err);
            alert("Failed to delete teacher.");
        }
    };

    const handleOpenModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                fullName: teacher.fullName,
                email: teacher.email,
                password: '', // Leave empty if not changing
                phone: teacher.phone || '',
                classId: teacher.classId || '',
            });
        } else {
            setEditingTeacher(null);
            setFormData({ fullName: '', email: '', password: '', phone: '', classId: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingTeacher) {
                // Edit Logic
                const payload: any = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty password

                await api.put(`/school/teachers/${editingTeacher.id}`, payload);
                alert("Teacher updated!");
            } else {
                // Add Logic
                await api.post('/school/teachers', formData);
                alert("Teacher added!");
            }
            setIsModalOpen(false);
            fetchTeachers();
        } catch (err: any) {
            console.error("Teacher form error:", err);
            alert(err.response?.data?.message || "Operation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Manage Teachers</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                >
                    <span>+</span> Add Teacher
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                    {(teacher.fullName || 'T').charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{teacher.fullName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* Find class name from ID if we had the list, or just ID for now since API might not populate name here */}
                                            {teacher.classId ? (classes.find(c => c.id === teacher.classId)?.name || 'Linked to Class') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(teacher)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                            <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Teacher Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full border rounded-lg p-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg p-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Password {editingTeacher && '(Leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingTeacher}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border rounded-lg p-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded-lg p-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Class</label>
                                <select
                                    value={formData.classId}
                                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                                    className="w-full border rounded-lg p-2 mt-1 bg-white"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}