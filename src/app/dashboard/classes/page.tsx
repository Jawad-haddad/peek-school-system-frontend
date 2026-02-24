'use client';

import { useState, useEffect } from 'react';
import { mvpApi, SchoolClass } from '@/lib/api';
import AddClassModal from '@/components/dashboard/AddClassModal';
import EditClassModal from '@/components/dashboard/EditClassModal';

export default function ClassesPage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit state
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

    // RBAC: read role from localStorage (set by backend-aligned login response)
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAdmin(localStorage.getItem('role') === 'ADMIN');
        }
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await mvpApi.fetchClasses();
            // Backend MUST return SchoolClass[] directly. If this breaks, it is a backend contract violation.
            const data = Array.isArray(response.data) ? response.data : [];
            setClasses(data);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError("You do not have permission to view classes.");
            } else if (err.response?.status === 404) {
                setError("No classes resource found.");
            } else {
                setError(err.response?.data?.message || "Failed to load classes.");
            }
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
            await mvpApi.deleteClass(id);
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            // error toast is handled inside mvpApi.deleteClass
        }
    };

    const handleEditClick = (e: React.MouseEvent, cls: SchoolClass) => {
        e.preventDefault();
        e.stopPropagation();
        const classToEdit = {
            ...cls,
            academicYearId: cls.academicYearId || (typeof cls.academicYear === 'object' ? cls.academicYear?.id : undefined)
        };
        setEditingClass(classToEdit);
    };


    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Manage Classes</h1>
                    <p className="text-gray-500 font-medium">Overview of all academic classes</p>
                </div>
                {/* Only ADMIN can create classes */}
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-bold"
                    >
                        <span className="text-xl">+</span> New Class
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-violet-600 mx-auto mb-4"></div>
                    <p className="text-violet-500 font-bold animate-pulse">Loading classes...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
                    <span className="text-2xl">⚠️</span>
                    <span className="font-bold">{error}</span>
                </div>
            ) : classes.length === 0 ? (
                <div className="glass-card text-center py-20 rounded-3xl">
                    <div className="text-6xl mb-6">🏫</div>
                    <p className="text-gray-400 font-medium text-xl">No classes found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {classes.map((cls) => (
                        <div key={cls.id} className="glass-card relative rounded-3xl p-6 group hover:border-violet-300/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-violet-200/50">
                            {/* Card Content - Clickable */}
                            <a href={`/dashboard/classes/${cls.id}`} className="block relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                        🏫
                                    </div>
                                    <span className="bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-violet-100 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                        {cls._count?.students || 0} Students
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 transition-all">{cls.name}</h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    {typeof cls.academicYear === 'string' ? cls.academicYear : cls.academicYear?.name || 'No Year'}
                                </p>
                            </a>

                            {/* Admin-only Actions */}
                            {isAdmin && (
                                <div className="absolute bottom-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditClick(e, cls)}
                                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                        title="Edit Class"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(cls.id);
                                        }}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete Class"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add New Class Card — Admin only */}
                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-3xl border-2 border-dashed border-violet-200 p-6 flex flex-col items-center justify-center text-violet-300 hover:text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer group min-h-[200px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-violet-100/50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                +
                            </div>
                            <span className="font-bold text-lg">Create New Class</span>
                        </button>
                    )}
                </div>
            )}

            {isAdmin && (
                <>
                    <AddClassModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={fetchClasses}
                    />

                    {editingClass && (
                        <EditClassModal
                            isOpen={!!editingClass}
                            onClose={() => setEditingClass(null)}
                            onSuccess={fetchClasses}
                            classData={editingClass}
                        />
                    )}
                </>
            )}
        </div>
    );
}