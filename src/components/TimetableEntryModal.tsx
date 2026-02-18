'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type Props = {
  classId: string;
  day: string;
  period: number;
  currentSubjectId: string | null;
  currentTeacherId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function TimetableEntryModal({ classId, day, period, currentSubjectId, currentTeacherId, onClose, onSuccess }: Props) {
  const [subjects, setSubjects] = useState<{ id: string, name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string, fullName: string }[]>([]);

  const [subjectId, setSubjectId] = useState(currentSubjectId || '');
  const [teacherId, setTeacherId] = useState(currentTeacherId || '');
  const [loading, setLoading] = useState(false);

  const getPeriodTime = (p: number) => {
    const startHour = 8 + (p - 1);

    const startStr = `${String(startHour).padStart(2, '0')}:00`;
    const endStr = `${String(startHour).padStart(2, '0')}:45`;

    return { start: startStr, end: endStr };
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const [sRes, tRes] = await Promise.all([
          axios.get('/api/schools/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/schools/teachers', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSubjects(sRes.data);
        setTeachers(tRes.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('authToken');

    // حساب الوقت تلقائياً
    const { start, end } = getPeriodTime(period);

    try {
      await axios.post(`/api/schools/classes/${classId}/timetable`, {
        dayOfWeek: day,   // e.g., "MONDAY"
        startTime: start, // "08:00"
        endTime: end,     // "08:45" (هذا كان ناقصاً ويسبب الخطأ 400)
        subjectId,
        teacherId
      }, { headers: { Authorization: `Bearer ${token}` } });

      onSuccess();
    } catch (err) {
      alert('Failed to save entry. Make sure all fields are selected.');
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Edit {day} - Period {period}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Time: {getPeriodTime(period).start} - {getPeriodTime(period).end}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border p-2 rounded mt-1">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teacher</label>
            <select required value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full border p-2 rounded mt-1">
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}