'use client';

import { useState } from 'react';

// Mock Data
const MOCK_EXAMS = [
    { id: 'midterm_q1', name: 'Midterm Q1' },
    { id: 'final_q1', name: 'Final Q1' },
];

const MOCK_CLASSES = [
    { id: 'grade_4_a', name: 'Grade 4-A' },
    { id: 'grade_5_b', name: 'Grade 5-B' },
];

const MOCK_STUDENTS = [
    { id: '1', name: 'Ahmed Ali' },
    { id: '2', name: 'Sara Smith' },
    { id: '3', name: 'John Doe' },
];

type GradeEntry = {
    marks: number | '';
    comment: string;
};

export default function GradebookPage() {
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);
        // Simulate API call
        console.log('Saving grades:', { exam: selectedExam, class: selectedClass, grades });
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert('Grades saved successfully!');
        setIsSubmitting(false);
    };

    const isReady = selectedExam && selectedClass;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Teacher Gradebook</h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                    <select
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                    >
                        <option value="">-- Choose Exam --</option>
                        {MOCK_EXAMS.map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">-- Choose Class --</option>
                        {MOCK_CLASSES.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isReady ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-700">Student List</h3>
                        <span className="text-sm text-gray-500">{MOCK_STUDENTS.length} Students</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                        {MOCK_STUDENTS.map((student) => {
                            const studentGrade = grades[student.id] || { marks: '', comment: '' };
                            return (
                                <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Student Info */}
                                    <div className="md:w-1/4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{student.name}</span>
                                    </div>

                                    {/* Inputs */}
                                    <div className="md:w-3/4 flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-1/3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Marks (0-100)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="Marks"
                                                className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-lg font-semibold"
                                                value={studentGrade.marks}
                                                onChange={(e) => handleGradeChange(student.id, 'marks', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-full md:w-2/3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Calculated Grade</label>
                                            <input
                                                type="text"
                                                placeholder="Comments (Optional)"
                                                className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                value={studentGrade.comment}
                                                onChange={(e) => handleGradeChange(student.id, 'comment', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sticky Save Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-up md:static md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Saving...' : '💾 Save Grades'}
                        </button>
                    </div>

                </div>
            ) : (
                <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    Select an Exam and Class to start grading.
                </div>
            )}
        </div>
    );
}
