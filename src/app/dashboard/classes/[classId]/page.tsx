'use client';

import { useState, useEffect } from 'react';
import api, { schoolApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import AddStudentModal from '@/components/dashboard/AddStudentModal';
import EditStudentModal from '@/components/dashboard/EditStudentModal';
import StudentProfileModal from '@/components/dashboard/StudentProfileModal'; // Import
import { Eye, Edit } from 'lucide-react'; // Icons
import { permissions, Role } from '@/lib/permissions';

type Student = {
    id: string;
    name?: string;
    fullName?: string;
    email?: string;
    parentEmail?: string;
    walletBalance?: number;
    nfcTagId?: string;
    dob?: string;
    parentName?: string;
    parentPhone?: string;
};

type Params = {
    classId: string;
};

export default function ClassDetailsPage() {
    const params = useParams<Params>();
    const classId = params.classId;

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

    // New state for editing/viewing
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null); // For Profile Modal
    const [role, setRole] = useState<Role>(null);

    useEffect(() => {
        setRole(localStorage.getItem('role') as Role);
        if (classId) {
            fetchStudents();
        }
    }, [classId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await schoolApi.fetchStudents(classId);
            const data = response.data.students || response.data || [];
            setStudents(data);
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, student: Student) => {
        e.stopPropagation();
        setEditingStudent(student);
    };

    const handleViewClick = (e: React.MouseEvent, student: Student) => {
        e.stopPropagation();
        setViewingStudent(student); // Open Profile Modal
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Class Details</h1>
                {permissions.canManageStudents(role) && (
                    <button
                        onClick={() => setIsAddStudentOpen(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-bold"
                    >
                        + Add New Student
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-100">
                    <p className="text-gray-500 font-medium">No students found in this class.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Email/Parent</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{student.name || student.fullName || 'No Name'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{student.email || student.parentEmail || 'No Email'}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            {permissions.canManageStudents(role) && (
                                                <button
                                                    onClick={(e) => handleEditClick(e, student)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Student"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleViewClick(e, student)}
                                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="View Profile"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <AddStudentModal
                isOpen={isAddStudentOpen}
                onClose={() => setIsAddStudentOpen(false)}
                onSuccess={fetchStudents}
                classId={classId}
            />

            {editingStudent && (
                <EditStudentModal
                    isOpen={!!editingStudent}
                    onClose={() => setEditingStudent(null)}
                    onSuccess={fetchStudents}
                    student={editingStudent}
                />
            )}

            {viewingStudent && (
                <StudentProfileModal
                    isOpen={!!viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    student={viewingStudent}
                    className="Class Details"
                />
            )}
        </div>
    );
}
