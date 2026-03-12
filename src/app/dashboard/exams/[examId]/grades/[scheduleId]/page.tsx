'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useLang } from '@/lib/LangProvider';

type Student = {
    id: string;
    fullName: string;
    nfc_card_id: string;
};

type MarkEntry = {
    studentId: string;
    studentName: string;
    marksObtained: string; // Keep as string for input handling
    comments: string;
};

export default function EnterGradesPage() {
    const { t } = useLang();
    const params = useParams();
    const router = useRouter();
    const scheduleId = params.scheduleId as string;
    const examId = params.examId as string; // For back button

    const [students, setStudents] = useState<Student[]>([]);
    const [marksData, setMarksData] = useState<MarkEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [examInfo, setExamInfo] = useState<any>(null); // To show Class/Subject name

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            try {
                // 1. Get Exam Schedule Details (to know classId)
                // We fetch all schedules for the exam and filter (simple way)
                const schedulesRes = await axios.get(`/api/schools/exams/${examId}/schedules`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const currentSchedule = schedulesRes.data.find((s: any) => s.id === scheduleId);
                if (!currentSchedule) return;
                setExamInfo(currentSchedule);

                // 2. Get Students in that Class
                const studentsRes = await axios.get(`/api/schools/classes/${currentSchedule.classId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 3. Initialize Marks Data
                // (In a real app, we should also fetch existing marks to pre-fill)
                // For now, let's just map students to empty entries
                const initialMarks = studentsRes.data.map((s: Student) => ({
                    studentId: s.id,
                    studentName: s.fullName,
                    marksObtained: '',
                    comments: ''
                }));

                setMarksData(initialMarks);

            } catch (err) {
                console.error(err);
                alert(t('auto_152'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [scheduleId, examId]);

    const handleMarkChange = (index: number, value: string) => {
        const updated = [...marksData];
        updated[index].marksObtained = value;
        setMarksData(updated);
    };

    const handleCommentChange = (index: number, value: string) => {
        const updated = [...marksData];
        updated[index].comments = value;
        setMarksData(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('authToken');

        // Convert to numbers for API
        const payload = marksData
            .filter(m => m.marksObtained !== '') // Only send entered marks
            .map(m => ({
                studentId: m.studentId,
                marksObtained: parseFloat(m.marksObtained),
                comments: m.comments
            }));

        try {
            await axios.post(`/api/schools/exam-schedules/${scheduleId}/marks`, {
                marks: payload
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert(t('auto_171'));
            router.back();
        } catch (err) {
            alert(t('auto_155'));
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">{t('auto_198')}</div>;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">{t('auto_432')}</button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('auto_130')}</h1>
                        {examInfo && (
                            <p className="text-gray-600">
                                {examInfo.class.name} - {examInfo.subject.name} ({new Date(examInfo.date).toLocaleDateString()})
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                    {saving ? 'Saving...' : 'Save All Grades'}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">{t('auto_359')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">{t('auto_213')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">{t('auto_085')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {marksData.map((entry, index) => (
                            <tr key={entry.studentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{entry.studentName}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="border rounded p-2 w-32 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0.00"
                                        value={entry.marksObtained}
                                        onChange={(e) => handleMarkChange(index, e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        className="border rounded p-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={t('auto_266')}
                                        value={entry.comments}
                                        onChange={(e) => handleCommentChange(index, e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {marksData.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">{t('auto_257')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}