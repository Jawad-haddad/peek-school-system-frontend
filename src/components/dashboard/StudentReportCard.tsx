'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api';

type SubjectGrade = {
    subject: string;
    mark: number;
    total: number;
};

const calculateGrade = (mark: number, total: number) => {
    const percentage = (mark / total) * 100;
    if (percentage >= 90) return { label: 'A', color: 'text-green-600 bg-green-50' };
    if (percentage >= 80) return { label: 'B', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 70) return { label: 'C', color: 'text-yellow-600 bg-yellow-50' };
    if (percentage >= 60) return { label: 'D', color: 'text-orange-600 bg-orange-50' };
    return { label: 'F', color: 'text-red-600 bg-red-50' };
};

export default function StudentReportCard() {
    const [grades, setGrades] = useState<SubjectGrade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            const studentId = user.studentId || (user.role === 'Student' ? user.id : null);

            if (!studentId) {
                setLoading(false);
                return;
            }

            try {
                const res = await studentApi.fetchStudentResults(studentId);
                const data = res.data.results || res.data || [];
                // Adapt to UI model
                const formatted = data.map((r: any) => ({
                    subject: r.subject || r.examName, // Fallback
                    mark: r.marks,
                    total: 100 // Defaulting to 100 as per common grading
                }));
                setGrades(formatted);
            } catch (error) {
                console.error("Failed to fetch grades", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, []);

    if (loading) return <div className="p-6 text-center text-gray-400">Loading grades...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Recent Grades</h3>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Latest</span>
            </div>

            <div className="divide-y divide-gray-100">
                {grades.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">No grades published yet.</div>
                ) : (
                    grades.map((grade, idx) => {
                        const { label, color } = calculateGrade(grade.mark, 100);

                        return (
                            <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{grade.subject}</span>
                                    <span className="text-xs text-gray-500">Score: {grade.mark}/100</span>
                                </div>

                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${color}`}>
                                    {label}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    View Full Report Card →
                </button>
            </div>
        </div>
    );
}
