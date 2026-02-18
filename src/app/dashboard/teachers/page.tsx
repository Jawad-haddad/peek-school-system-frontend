'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import AddTeacherModal from '@/components/dashboard/AddTeacherModal';

type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    nfcTagId?: string; // Add NFC ID
    specialization?: string;
    classes: string[];
    subjects: string[];
    // New Grouped Structure
    groupedAssignments?: GroupedAssignment[];
    rawAssignments?: any[];
};

interface GroupedAssignment {
    className: string;
    subjects: string[];
}

type SubjectMap = Record<string, string>; // id -> name

export default function TeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [subjectMap, setSubjectMap] = useState<SubjectMap>({});

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // 1. Fetch Subjects Lookup Map
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/academics/subjects');
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const map: SubjectMap = {};
                data.forEach((s: any) => {
                    if (s.id && s.name) map[s.id] = s.name;
                });
                setSubjectMap(map);
            } catch (e) {
                console.warn("Failed to fetch subjects description for lookup", e);
            }
        };
        fetchSubjects();
    }, []);

    // 2. Process Data with Lookup
    const processTeacherData = (t: any): Teacher => {
        const grouped: Record<string, Set<string>> = {}; // ClassName -> Set<SubjectName>
        const assignments = t.assignments || t.TeacherSubjectAssignment || t.teacherSubjectAssignments || [];

        // A. Try processing structured assignments
        if (Array.isArray(assignments) && assignments.length > 0) {
            assignments.forEach((a: any) => {
                const cName = a.class?.name || a.className;
                if (!cName) return;

                if (!grouped[cName]) grouped[cName] = new Set();

                // Resolve Subject Name
                let sName = a.subject?.name || a.subjectName;
                if (!sName && a.subjectId && subjectMap[a.subjectId]) {
                    sName = subjectMap[a.subjectId];
                }

                if (sName) grouped[cName].add(sName);
            });
        }

        // B. Fallback: Legacy flat arrays if no structured assignments found
        if (Object.keys(grouped).length === 0 && Array.isArray(t.classes)) {
            t.classes.forEach((c: any) => {
                const name = typeof c === 'string' ? c : c?.name;
                if (name) {
                    if (!grouped[name]) grouped[name] = new Set();
                }
            });
        }

        // Convert to Array
        const groupedArray: GroupedAssignment[] = Object.entries(grouped).map(([cName, sSet]) => ({
            className: cName,
            subjects: Array.from(sSet)
        }));

        return {
            id: t.id,
            fullName: t.fullName || t.name || 'Unknown Teacher',
            email: t.email,
            phone: t.phoneNumber || t.phone || '',
            phoneNumber: t.phoneNumber || t.phone || '',
            specialization: t.specialization,
            nfcTagId: t.nfcTagId || t.nfc_card_id || '', // Map NFC
            classes: [], // Legacy unused
            subjects: [], // Legacy unused
            rawAssignments: assignments,
            groupedAssignments: groupedArray
        };
    };

    const fetchTeachers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/school/teachers', {
                params: { _t: Date.now() }
            });

            let data: any[] = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data?.teachers)) {
                data = response.data.teachers;
            } else if (Array.isArray(response.data?.data)) {
                data = response.data.data;
            }

            console.log("Teacher Data Raw:", data);
            setTeachers(data.map(processTeacherData));
        } catch (err: any) {
            console.error("Failed to fetch teachers:", err);
            setError(err.response?.data?.message || "Failed to load teachers.");
        } finally {
            setLoading(false);
        }
    };

    // Refetch when subjectMap is ready (to ensure names satisfy)
    useEffect(() => {
        if (Object.keys(subjectMap).length > 0) {
            fetchTeachers();
        } else {
            // Initial fetch
            fetchTeachers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(subjectMap)]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        try {
            await api.delete(`/school/teachers/${id}`);
            setTeachers(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            console.error("Failed to delete teacher:", err);
            setError(err.response?.data?.message || "Failed to delete teacher.");
        }
    };

    const handleOpenModal = (teacher?: Teacher) => {
        setEditingTeacher(teacher || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeacher(null);
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

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold text-sm">
                    ⚠️ {error}
                </div>
            )}

            {loading && teachers.length === 0 ? (
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
                        <div className="col-span-3">Teacher</div>
                        <div className="col-span-2">Contact</div>
                        <div className="col-span-2">Phone</div>
                        <div className="col-span-2">NFC</div>
                        <div className="col-span-2">Assignments (Class & Subjects)</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Teacher Rows */}
                    {teachers.map((teacher: any) => (
                        <div key={teacher.id} className="glass-card group p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-violet-300/50 transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="col-span-3 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-black text-lg shadow-sm">
                                    {(teacher.fullName || 'T').charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-violet-700 transition-colors">{teacher.fullName}</h3>
                                    <span className="text-xs text-violet-500 font-bold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">Faculty</span>
                                </div>
                            </div>

                            <div className="col-span-3 text-sm text-gray-500 font-medium break-all">
                                {teacher.email || 'No email'}
                            </div>

                            <div className="col-span-2 text-sm text-gray-500 font-medium">
                                {teacher.phone || teacher.phoneNumber ? (
                                    <a href={`tel:${teacher.phone || teacher.phoneNumber}`} className="text-violet-600 hover:underline">
                                        {teacher.phone || teacher.phoneNumber}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 italic">No phone</span>
                                )}
                            </div>

                            <div className="col-span-2 text-sm text-gray-500 font-medium font-mono">
                                {teacher.nfcTagId ? (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">
                                        {teacher.nfcTagId}
                                    </span>
                                ) : (
                                    <span className="text-gray-300 italic">-</span>
                                )}
                            </div>

                            {/* Redesigned Assignments Column */}
                            <div className="col-span-3 text-sm">
                                {teacher.groupedAssignments && teacher.groupedAssignments.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {teacher.groupedAssignments.map((group: GroupedAssignment, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-1 items-start bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                                <span className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-1">
                                                    📚 {group.className}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.subjects.length > 0 ? (
                                                        group.subjects.map((subj, sIdx) => (
                                                            <span key={sIdx} className="text-[10px] font-bold bg-white text-violet-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                                {subj}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic px-1">All Subjects / General</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No active assignments</span>
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
                onClose={handleCloseModal}
                onSuccess={fetchTeachers}
                teacherToEdit={editingTeacher}
            />
        </div>
    );
}