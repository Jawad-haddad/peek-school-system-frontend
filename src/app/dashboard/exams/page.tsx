'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { permissions, Role } from '@/lib/permissions';
import CreateExamModal from '@/components/dashboard/CreateExamModal';
import EditExamForm from '../../../components/EditExamForm';

type Exam = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  academicYearId: string;
  academicYear: { name: string };
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role') as Role);
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/school/exams');
        // Proper defensive check for response data
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data?.data && Array.isArray(res.data.data))
            ? res.data.data
            : [];
        setExams(data);
      } catch (err: any) {
        console.error(err);
        // ApiEnvelopeError passes normalised tenant errors directly in err.message
        setError(err.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    try {
      // Backend exam CRUD is under /exams, not /school/exams
      await api.delete(`/exams/${id}`);
      setRefresh(p => p + 1);
    } catch (err) { alert('Failed to delete'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setRefresh(p => p + 1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Exam Schedule</h1>
          <p className="text-gray-500 font-medium">Manage exams coverage and timing</p>
        </div>
        {permissions.canCreateExam(role) && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200 flex items-center gap-2 hover:-translate-y-0.5"
          >
            + Schedule Exam
          </button>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 font-medium text-lg">No exams scheduled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => {
            const startDate = new Date(exam.startDate);
            const endDate = exam.endDate ? new Date(exam.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const today = new Date();

            let status = 'Upcoming';
            let statusColor = 'bg-blue-100 text-blue-700';

            if (today > endDate) {
              status = 'Past';
              statusColor = 'bg-gray-100 text-gray-500';
            } else if (today >= startDate && today <= endDate) {
              status = 'Active';
              statusColor = 'bg-green-100 text-green-700 animate-pulse';
            }

            return (
              <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg group-hover:bg-purple-100 transition-colors">
                    {startDate.getDate()}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                    {status}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-black text-gray-800 mb-2 truncate">{exam.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                    🗓️ {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <p className="text-xs text-purple-600 font-bold mt-3 uppercase tracking-wider">Year: {exam.academicYear?.name || 'N/A'}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                  <Link
                    href={`/dashboard/exams/${exam.id}`}
                    className="text-sm font-bold text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    View Schedule
                  </Link>
                  {permissions.canEditExam(role) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditExam(exam)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddOpen && <CreateExamModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={() => setRefresh(p => p + 1)} />}
      {editExam && <EditExamForm exam={editExam} onClose={() => setEditExam(null)} onSuccess={() => { setEditExam(null); setRefresh(p => p + 1); }} />}
    </div>
  );
}
