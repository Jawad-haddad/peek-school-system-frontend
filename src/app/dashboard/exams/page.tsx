'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AddExamForm from '../../../components/AddExamForm';
import EditExamForm from '../../../components/EditExamForm';

type Exam = {
  id: string;
  name: string;
  date: string;
  academicYearId: string;
  academicYear: { name: string };
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/school/exams');
        setExams(res.data);
      } catch (err) { console.error(err); }
    };
    fetchExams();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    try {
      await api.delete(`/school/exams/${id}`);
      setRefresh(p => p + 1);
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Exams</h1>
        <button onClick={() => setIsAddOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">+ Add Exam</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exams.map(exam => (
              <tr key={exam.id}>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/exams/${exam.id}`} className="text-purple-600 hover:text-purple-900 font-semibold">
                    {exam.name}
                  </Link>
                </td>
                <td className="px-6 py-4">{new Date(exam.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{exam.academicYear.name}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/exams/${exam.id}`} className="text-gray-600 hover:text-gray-900 mr-4 text-sm font-medium">
                    Schedule
                  </Link>
                  <button onClick={() => setEditExam(exam)} className="text-purple-600 hover:text-purple-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && <AddExamForm onClose={() => setIsAddOpen(false)} onSuccess={() => setRefresh(p => p + 1)} />}
      {editExam && <EditExamForm exam={editExam} onClose={() => setEditExam(null)} onSuccess={() => { setEditExam(null); setRefresh(p => p + 1); }} />}
    </div>
  );
}
