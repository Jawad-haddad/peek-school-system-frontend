'use client';

type SubjectGrade = {
    subject: string;
    mark: number;
    total: number;
};

// Mock Data
const MOCK_GRADES: SubjectGrade[] = [
    { subject: 'Mathematics', mark: 85, total: 100 },
    { subject: 'Science', mark: 72, total: 100 },
    { subject: 'English', mark: 90, total: 100 },
    { subject: 'History', mark: 65, total: 100 },
];

const calculateGrade = (mark: number, total: number) => {
    const percentage = (mark / total) * 100;
    if (percentage >= 90) return { label: 'A', color: 'text-green-600 bg-green-50' };
    if (percentage >= 80) return { label: 'B', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 70) return { label: 'C', color: 'text-yellow-600 bg-yellow-50' };
    if (percentage >= 60) return { label: 'D', color: 'text-orange-600 bg-orange-50' };
    return { label: 'F', color: 'text-red-600 bg-red-50' };
};

export default function StudentReportCard() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Recent Grades</h3>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm Q1</span>
            </div>

            <div className="divide-y divide-gray-100">
                {MOCK_GRADES.map((grade) => {
                    const { label, color } = calculateGrade(grade.mark, grade.total);

                    return (
                        <div key={grade.subject} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{grade.subject}</span>
                                <span className="text-xs text-gray-500">Score: {grade.mark}/{grade.total}</span>
                            </div>

                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${color}`}>
                                {label}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    View Full Report Card →
                </button>
            </div>
        </div>
    );
}
