'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';

type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    specialization?: string;
    nfcTagId?: string; // New
    classId?: string;
    classes?: string[];
    assignments?: { classId: string, subjectIds: string[] }[];
};

type ClassOption = { id: string; name: string; };
type SubjectOption = { id: string; name: string; };

type AssignmentRow = {
    classId: string;
    subjectIds: string[];
};

type AddTeacherModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    teacherToEdit?: Teacher | null;
};

export default function AddTeacherModal({ isOpen, onClose, onSuccess, teacherToEdit }: AddTeacherModalProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        nfcTagId: '', // New state
    });

    // Assignments State
    const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

    // Data Options
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [classRes, subjectRes] = await Promise.all([
                        api.get('/school/classes', { params: { _t: Date.now() } }),
                        api.get('/academics/subjects')
                    ]);

                    const classesData = Array.isArray(classRes.data) ? classRes.data : (classRes.data?.data || []);
                    setClasses(classesData.map((c: any) => ({ id: c.id, name: c.name || 'Unknown Class' })));

                    const subjectsData = Array.isArray(subjectRes.data) ? subjectRes.data : (subjectRes.data?.data || []);
                    setSubjects(subjectsData.map((s: any) => ({ id: s.id, name: s.name })));

                } catch (err) {
                    console.error("Failed to fetch data", err);
                }
            };
            fetchData();

            if (teacherToEdit) {
                setFormData({
                    fullName: teacherToEdit.fullName || '',
                    email: teacherToEdit.email || '',
                    password: '',
                    phone: teacherToEdit.phone || teacherToEdit.phoneNumber || '',
                    nfcTagId: teacherToEdit.nfcTagId || '',
                });

                // Load existing assignments if available, or try to reconstruct from legacy fields
                if (teacherToEdit.assignments) {
                    setAssignments(teacherToEdit.assignments);
                } else if (teacherToEdit.classId) {
                    setAssignments([{ classId: teacherToEdit.classId, subjectIds: [] }]);
                } else {
                    setAssignments([]);
                }
            } else {
                setFormData({ fullName: '', email: '', password: '', phone: '', nfcTagId: '' });
                setAssignments([]);
            }
            setError('');
        }
    }, [isOpen, teacherToEdit]);

    const addAssignmentRow = () => {
        setAssignments([...assignments, { classId: '', subjectIds: [] }]);
    };

    const removeAssignmentRow = (index: number) => {
        const newAssignments = [...assignments];
        newAssignments.splice(index, 1);
        setAssignments(newAssignments);
    };

    const updateAssignmentClass = (index: number, classId: string) => {
        const newAssignments = [...assignments];
        newAssignments[index].classId = classId;
        setAssignments(newAssignments);
    };

    const toggleAssignmentSubject = (index: number, subjectId: string) => {
        const newAssignments = [...assignments];
        const currentSubjects = newAssignments[index].subjectIds;
        if (currentSubjects.includes(subjectId)) {
            newAssignments[index].subjectIds = currentSubjects.filter(id => id !== subjectId);
        } else {
            newAssignments[index].subjectIds = [...currentSubjects, subjectId];
        }
        setAssignments(newAssignments);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Validate Assignments
        const validAssignments = assignments.filter(a => a.classId); // Filter out empty class selections

        // Derive unique 'classes' array for backward compatibility
        const classIds = [...new Set(validAssignments.map(a => a.classId))];

        const payload: any = {
            ...formData,
            assignments: validAssignments,
            classIds: classIds, // Send flat array for backend that doesn't know 'assignments'
            classes: classIds // Send alias just in case
        };

        // If NFC empty, remove it to avoid empty string violation if backend checks
        if (!payload.nfcTagId) delete payload.nfcTagId;

        console.log("Submitting Teacher Payload:", payload); // DEBUG: Inspect Payload

        try {
            if (teacherToEdit) {
                if (!payload.password) delete payload.password;
                await api.put(`/school/teachers/${teacherToEdit.id}`, payload);
            } else {
                await api.post('/school/teachers', payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Teacher form error:", err);
            console.error("Error Response:", err.response); // DEBUG: Inspect detailed error
            let msg = err.message || err.response?.data?.message || "Operation failed.";
            if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
                msg = err.details[0].message || err.details[0].string || Object.values(err.details[0])[0] || msg;
            }
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">
                            {teacherToEdit ? 'Edit Teacher' : 'Add New Teacher'}
                        </h2>
                        <p className="text-white/80 text-sm">Manage faculty assignments</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 transition-all font-medium"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 transition-all font-medium"
                                placeholder="john@school.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 transition-all font-medium"
                                placeholder="+962..."
                            />
                        </div>
                        {/* NFC Tag Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">NFC Tag ID</label>
                            <input
                                type="text"
                                value={formData.nfcTagId}
                                onChange={e => setFormData({ ...formData, nfcTagId: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 transition-all font-medium"
                                placeholder="Scan card..."
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Password {teacherToEdit ? <span className="text-gray-400 font-normal">(Leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="password"
                                required={!teacherToEdit}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-violet-500 transition-all font-medium"
                                placeholder={teacherToEdit ? "Only enter to change password" : "••••••••"}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Class & Subject Assignments</h3>
                            <button
                                type="button"
                                onClick={addAssignmentRow}
                                className="text-sm bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg font-bold hover:bg-violet-100 transition-colors flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Class
                            </button>
                        </div>

                        <div className="space-y-4">
                            {assignments.map((assignment, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeAssignmentRow(index)}
                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="mb-3 pr-8">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                                        <select
                                            value={assignment.classId}
                                            onChange={(e) => updateAssignmentClass(index, e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none"
                                        >
                                            <option value="">Select Class...</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {assignment.classId && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subjects</label>
                                            <div className="flex flex-wrap gap-2">
                                                {subjects.map(sub => {
                                                    const isSelected = assignment.subjectIds.includes(sub.id);
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            type="button"
                                                            onClick={() => toggleAssignmentSubject(index, sub.id)}
                                                            className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-all ${isSelected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                                                                }`}
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {assignments.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                    No classes assigned. Click "Add Class" to start.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                        >
                            {submitting ? 'Saving...' : 'Save Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
