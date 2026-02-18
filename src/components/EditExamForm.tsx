'use client';
import { useState } from 'react';
import api from '@/lib/api';

type Exam = { id: string; name: string; startDate: string; endDate?: string; academicYearId: string; };

// Safe date parser: handles ISO strings and invalid dates gracefully
const safeDate = (d?: string): string => {
  if (!d) return '';
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  } catch { return ''; }
};

export default function EditExamForm({ exam, onClose, onSuccess }: { exam: Exam, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(exam.name);
  const [startDate, setStartDate] = useState(safeDate(exam.startDate));
  const [endDate, setEndDate] = useState(safeDate(exam.endDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Backend exam mutation routes are under /school/exams
      await api.put(`/school/exams/${exam.id}`, {
        name,
        startDate,
        endDate: endDate || undefined,
        academicYearId: exam.academicYearId
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Exam update failed:', err);
      setError(err.response?.data?.message || 'Failed to update exam.');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[420px] shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Exam</h2>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
            <input className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className={`px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
