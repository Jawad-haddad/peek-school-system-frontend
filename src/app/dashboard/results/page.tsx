'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api';

type ExamResult = {
    id: string;
    examName: string;
    subject: string;
    marks: number;
    grade: string;
    date: string;
    teacherComment?: string;
};

export default function ExamResultsPage() {
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchResults = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                if (parsedUser.studentId) {
                    try {
                        const res = await studentApi.fetchStudentResults(parsedUser.studentId);
                        setResults(res.data.results || res.data || []);
                    } catch (error) {
                        console.error(error);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user?.studentId) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
                <p className="text-gray-500 mt-4">No student profile linked to this account.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <div className="glass-panel p-8 rounded-3xl text-center md:text-left relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Exam Results</h1>
                    <p className="text-gray-500 font-medium">Academic performance report</p>
                </div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-blue-200/50 to-cyan-200/50 rounded-full blur-3xl"></div>
            </div>

            {results.length === 0 ? (
                <div className="glass-card text-center py-20 rounded-3xl">
                    <div className="text-6xl mb-6">📈</div>
                    <p className="text-gray-400 font-medium text-xl">No exam results published yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((result) => (
                        <div key={result.id} className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">{result.subject}</h3>
                                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{result.examName}</span>
                                </div>
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner ${result.marks >= 90 ? 'bg-green-100 text-green-600' :
                                        result.marks >= 75 ? 'bg-blue-100 text-blue-600' :
                                            result.marks >= 50 ? 'bg-orange-100 text-orange-600' :
                                                'bg-red-100 text-red-600'
                                    }`}>
                                    {result.marks}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">Grade</span>
                                    <span className="font-bold text-gray-800">{result.grade}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">Date</span>
                                    <span className="font-bold text-gray-800">{new Date(result.date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {result.teacherComment && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 italic">"{result.teacherComment}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
