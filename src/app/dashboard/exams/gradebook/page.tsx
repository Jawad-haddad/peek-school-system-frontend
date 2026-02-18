'use client';

import { useState, useEffect } from 'react';
import { examApi, schoolApi } from '@/lib/api';
import { toast } from '@/lib/toast-events';

type Exam = {
    id: string;
    title: string; // Assuming 'title' or 'name'
};

type Schedule = {
    id: string;
    classId: string;
    class: {
        id: string;
        name: string;
    };
    subject: {
        name: string;
    };
    // Include other fields if needed
};

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    // Potentially existing marks if returned by API, otherwise we might need another call
};

type GradeEntry = {
    marks: number | '';
    comment: string;
};

export default function GradebookPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(''); // This effectively selects the class/subject context

    const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Exams on Mount
    useEffect(() => {
        const loadExams = async () => {
            try {
                setError(null);
                const res = await examApi.fetchAllExams();
                const data = res.data.exams || res.data || [];
                setExams(data);
            } catch (error: any) {
                console.error("Failed to load exams", error);
                setError(error.response?.data?.message || "Failed to load exams.");
            } finally {
                setLoadingExams(false);
            }
        };
        loadExams();
    }, []);

    // 2. Fetch Schedules when Exam Selected
    useEffect(() => {
        if (!selectedExam) {
            setSchedules([]);
            setSelectedSchedule('');
            return;
        }

        const loadSchedules = async () => {
            setLoadingSchedules(true);
            try {
                const res = await examApi.fetchExamSchedules(selectedExam);
                setSchedules(res.data.schedules || res.data || []);
            } catch (error) {
                console.error("Failed to load schedules", error);
            } finally {
                setLoadingSchedules(false);
            }
        };
        loadSchedules();
    }, [selectedExam]);

    // 3. Fetch Students when Schedule Selected
    useEffect(() => {
        if (!selectedSchedule) {
            setStudents([]);
            setGrades({});
            return;
        }

        const loadStudents = async () => {
            setLoadingStudents(true);
            try {
                // Find the selected schedule to get the classId
                const schedule = schedules.find(s => s.id === selectedSchedule);
                if (!schedule) return;

                const res = await schoolApi.fetchStudents(schedule.classId);
                const fetchedStudents = res.data.students || res.data || [];
                setStudents(fetchedStudents);

                // Initialize grades with defaults
                const initialGrades: Record<string, GradeEntry> = {};
                fetchedStudents.forEach((student: Student) => {
                    initialGrades[student.id] = { marks: '', comment: '' };
                });

                // Try to fetch existing marks for this schedule and pre-fill
                try {
                    const marksRes = await examApi.fetchScheduleMarks(selectedSchedule);
                    const existingMarks = marksRes.data.marks || marksRes.data || [];
                    existingMarks.forEach((m: { studentId: string; marks: number; comment?: string }) => {
                        if (initialGrades[m.studentId]) {
                            initialGrades[m.studentId] = {
                                marks: m.marks,
                                comment: m.comment || '',
                            };
                        }
                    });
                } catch {
                    // Existing marks not available — keep defaults (empty)
                }

                setGrades(initialGrades);

            } catch (error) {
                // Student list will remain empty
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [selectedSchedule, schedules]);

    const handleGradeChange = (studentId: string, field: keyof GradeEntry, value: string | number) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedSchedule) return;

        setIsSubmitting(true);
        try {
            // Format marks for API
            const marksToSubmit = Object.entries(grades)
                .filter(([_, entry]) => entry.marks !== '') // Only submit entered marks
                .map(([studentId, entry]) => ({
                    studentId,
                    marks: Number(entry.marks),
                    comment: entry.comment
                }));

            if (marksToSubmit.length === 0) {
                toast.error("No marks to save");
                setIsSubmitting(false);
                return;
            }

            await examApi.submitBulkMarks(selectedSchedule, marksToSubmit);
            // Optional: Refresh data or show specific success message
        } catch (error) {
            console.error("Failed to save grades", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isReady = selectedExam && selectedSchedule;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Gradebook</h1>
            <p className="text-gray-500 mb-8">Enter and manage exam marks for your classes.</p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <span className="font-bold">⚠️ Error:</span>
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Exam</label>
                    <div className="relative">
                        <select
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 appearance-none font-medium text-gray-700"
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            disabled={loadingExams}
                        >
                            <option value="">-- Choose Exam --</option>
                            {exams.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.title || exam.id}</option> // Fallback if title is missing
                            ))}
                        </select>
                        {loadingExams && (
                            <div className="absolute right-3 top-3">
                                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Class / Subject</label>
                    <div className="relative">
                        <select
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 appearance-none font-medium text-gray-700"
                            value={selectedSchedule}
                            onChange={(e) => setSelectedSchedule(e.target.value)}
                            disabled={!selectedExam || loadingSchedules}
                        >
                            <option value="">-- Choose Class --</option>
                            {schedules.map(schedule => (
                                <option key={schedule.id} value={schedule.id}>
                                    {schedule.class?.name || 'Unknown Class'} - {schedule.subject?.name || 'Subject'}
                                </option>
                            ))}
                        </select>
                        {loadingSchedules && (
                            <div className="absolute right-3 top-3">
                                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isReady ? (
                loadingStudents ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading students...</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xl font-bold text-gray-800">Student List</h3>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                                {students.length} Students
                            </span>
                        </div>

                        {/* Responsive Table Container */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Student</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32 min-w-[120px]">Marks</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Comments</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {students.map((student) => {
                                            const studentGrade = grades[student.id] || { marks: '', comment: '' };
                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm group-hover:scale-110 transition-transform">
                                                                {student.firstName?.charAt(0) || 'S'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">{student.firstName} {student.lastName}</div>
                                                                <div className="text-xs text-gray-400">ID: {student.id.substring(0, 8)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            placeholder="0-100"
                                                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-center h-10"
                                                            value={studentGrade.marks}
                                                            onChange={(e) => handleGradeChange(student.id, 'marks', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="text"
                                                            placeholder="Add a comment..."
                                                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                                                            value={studentGrade.comment}
                                                            onChange={(e) => handleGradeChange(student.id, 'comment', e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {students.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    No students found in this class.
                                </div>
                            )}
                        </div>

                        {/* Sticky Save Button - Desktop */}
                        <div className="hidden md:flex justify-end mt-8">
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || students.length === 0}
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span> Save All Grades
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Mobile Floating Save Button */}
                        <div className="fixed bottom-4 right-4 md:hidden z-30">
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || students.length === 0}
                                className="bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-300 hover:scale-110 active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="text-2xl">💾</span>
                                )}
                            </button>
                        </div>

                    </div>
                )
            ) : (
                <div className="text-center py-24 text-gray-400 bg-gray-50 rounded-3xl border-dashed border-2 border-gray-200">
                    <div className="text-6xl mb-4 opacity-20">📊</div>
                    <p className="font-medium">Select an Exam and Class to start grading.</p>
                </div>
            )}
        </div>
    );
}
