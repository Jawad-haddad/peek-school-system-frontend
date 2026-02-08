'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import AddStudentModal from '@/components/dashboard/AddStudentModal';
import EditStudentModal from '@/components/dashboard/EditStudentModal';

type Student = {
    id: string;
    name?: string;     // API likely returns 'name'
    fullName?: string; // or 'fullName'
    email?: string;
    parentEmail?: string;
    walletBalance?: number;
    nfcTagId?: string;
};

type Params = {
    classId: string;
};

export default function ClassDetailsPage() {
    const params = useParams<Params>();
    const classId = params.classId;

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, fees, academic
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

    // New state for editing
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    useEffect(() => {
        if (classId) {
            fetchStudents();
        }
    }, [classId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/school/students?classId=${classId}`);
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            setStudents(data);
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, student: Student) => {
        e.stopPropagation(); // Prevent row click (which opens profile)
        setEditingStudent(student);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Class Details</h1>
                <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    + Add New Student
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : students.length === 0 ? (
                <p>No students found in this class.</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name || student.fullName || 'No Name'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{student.email || student.parentEmail || 'No Email'}</td>
                                    <td className="px-6 py-4 text-right text-sm text-indigo-600">
                                        <button
                                            onClick={(e) => handleEditClick(e, student)}
                                            className="text-indigo-600 hover:text-indigo-900 font-bold mr-4"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-gray-400">View Profile</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Student Profile Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{selectedStudent.fullName}</h2>
                            <button onClick={() => setSelectedStudent(null)}>✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            {['overview', 'fees', 'academic'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 h-80 overflow-y-auto">
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Wallet Balance</span>
                                        <span className="font-bold text-green-600">{selectedStudent.walletBalance || 0} JOD</span>
                                    </div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">NFC Tag ID</span>
                                        <span className="font-mono bg-white px-2 rounded border">{selectedStudent.nfcTagId || 'Not Linked'}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Contact: {selectedStudent.email}</p>
                                </div>
                            )}
                            {activeTab === 'fees' && (
                                <div className="space-y-3">
                                    <p className="text-lg font-bold">Fee Status</p>
                                    {/* Mock Data for now */}
                                    <div className="flex justify-between border-b py-2">
                                        <span>Total Annual Fee</span>
                                        <span>1500 JOD</span>
                                    </div>
                                    <div className="flex justify-between border-b py-2 text-green-600">
                                        <span>Paid</span>
                                        <span>500 JOD</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-red-600 font-bold">
                                        <span>Outstanding</span>
                                        <span>1000 JOD</span>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'academic' && (
                                <div className="space-y-4">
                                    {/* Attendance Card */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-black text-green-800">Attendance</h3>
                                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">95%</span>
                                        </div>
                                        <div className="flex gap-1 h-3 bg-green-200/50 rounded-full overflow-hidden">
                                            <div className="w-[95%] h-full bg-green-500 rounded-full"></div>
                                        </div>
                                        <p className="text-xs text-green-600 mt-2 font-medium">Present 19/20 Days</p>
                                    </div>

                                    {/* Recent Grades */}
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Recent Grades</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                                                <span className="text-xs text-violet-500 font-bold block">Mathematics</span>
                                                <span className="text-2xl font-black text-violet-700">A</span>
                                            </div>
                                            <div className="p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                                                <span className="text-xs text-fuchsia-500 font-bold block">Science</span>
                                                <span className="text-2xl font-black text-fuchsia-700">B+</span>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                <span className="text-xs text-amber-500 font-bold block">History</span>
                                                <span className="text-2xl font-black text-amber-700">A-</span>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <span className="text-xs text-blue-500 font-bold block">English</span>
                                                <span className="text-2xl font-black text-blue-700">B</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}

