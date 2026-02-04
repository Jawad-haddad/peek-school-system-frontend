'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

type Student = {
    id: string;
    fullName: string;
    email: string;
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

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Class Details</h1>

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
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                    <td className="px-6 py-4 text-right text-sm text-indigo-600">View Profile</td>
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
                                <div className="text-center text-gray-500 py-10">
                                    <p>Recent marks will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
