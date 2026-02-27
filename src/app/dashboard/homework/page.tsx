'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { permissions, Role } from '@/lib/permissions';
import AddHomeworkModal from '@/components/dashboard/AddHomeworkModal';

// Define the shape of the Homework object based on API expectations
type Homework = {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    classId?: string;
    class?: { name: string }; // Depending on how relation is returned
    className?: string; // Fallback
    description: string;
    status: 'active' | 'completed';
};

export default function HomeworkPage() {
    const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [role, setRole] = useState<Role>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchHomework = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch homework
            const response = await api.get('/academics/homework');



            const data = Array.isArray(response.data) ? response.data : response.data.data || [];

            // Sort by due date (ascending)
            const sortedData = data.sort((a: Homework, b: Homework) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );

            setHomeworkList(sortedData);
        } catch (error: any) {
            console.error('Failed to fetch homework:', error);
            setError(error.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedRole = localStorage.getItem('role') || localStorage.getItem('userRole');
        setRole(storedRole ? storedRole.toUpperCase() as Role : null);

        fetchHomework();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No Date';
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Helper to get safe class name
    const getClassName = (hw: Homework) => {
        if (hw.class && hw.class.name) return hw.class.name;
        if (hw.className) return hw.className;
        return 'Unknown Class';
    };

    // Admin and Teacher can assign homework (mapping to canGrade for teaching actions)
    const canCreate = permissions.canGrade(role);

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                        Homework Diary
                    </h1>
                    <p className="text-gray-500 mt-1">Assignments & Tasks</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="text-xl font-bold">+</span>
                        <span className="font-medium">Create Assignment</span>
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Syncing assignments...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {homeworkList.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                            <div className="text-4xl mb-4">📚</div>
                            <h3 className="text-lg font-bold text-gray-800">No Assignments Yet</h3>
                            <p className="text-gray-400">Your homework list is empty.</p>
                            {canCreate && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 text-purple-600 hover:text-purple-800 font-medium underline"
                                >
                                    Create one now
                                </button>
                            )}
                        </div>
                    ) : (
                        homeworkList.map((hw) => (
                            <div key={hw.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 group relative overflow-hidden">
                                {/* Decorative gradient bar on top */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400"></div>

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex space-x-2">
                                        {/* Class Badge */}
                                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                                            {getClassName(hw)}
                                        </span>
                                        {/* Subject Badge */}
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border 
                                            ${hw.subject === 'Math' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                hw.subject === 'Science' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    hw.subject === 'History' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                            {hw.subject}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                        {formatDate(hw.dueDate)}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                                    {hw.title}
                                </h3>

                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                    {hw.description}
                                </p>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                                    <div className="flex items-center text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-md">
                                        ⏰ Due: {formatDate(hw.dueDate)}
                                    </div>
                                    {/* Action items could go here */}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AddHomeworkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchHomework();
                }}
            />
        </div>
    );
}
