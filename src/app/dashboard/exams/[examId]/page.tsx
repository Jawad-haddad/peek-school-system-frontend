'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

type Schedule = {
  id: string;
  class: { name: string };
  subject: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  _count: { marks: number };
};

// --- Helper function to calculate end time automatically ---
const calculateEndTime = (start: string, durationMinutes: number) => {
  const [hours, minutes] = start.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// --- Component for adding a new schedule ---
const AddScheduleForm = ({ examId, onSuccess }: { examId: string, onSuccess: () => void }) => {
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string, name: string }[]>([]);

  // Form state
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('60'); // Default 60 mins

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/school/classes'),
          api.get('/academics/subjects')
        ]);
        const classData = Array.isArray(cRes.data) ? cRes.data : cRes.data.classes || cRes.data.data || [];
        const subjectData = Array.isArray(sRes.data) ? sRes.data : sRes.data.subjects || sRes.data.data || [];
        setClasses(classData);
        setSubjects(subjectData);
      } catch (err) {
        // Non-critical — dropdowns will be empty
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !subjectId || !date) return;

    setLoading(true);
    const endTime = calculateEndTime(startTime, parseInt(durationMinutes));

    try {
      await api.post(`/school/exams/${examId}/schedules`, {
        classId,
        subjectId,
        date,
        startTime,
        durationMinutes,
        endTime
      });

      onSuccess();
      setSubjectId(''); // Reset subject for faster entry
    } catch (err) {
      alert('Failed to add schedule. Check for conflicts.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Schedule Exam Subject</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select required value={classId} onChange={e => setClassId(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border">
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border">
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
          <input type="number" min="15" step="15" required value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
        </div>

        <div className="lg:col-span-2">
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 h-[42px] flex items-center justify-center">
            {loading ? 'Adding...' : '+ Add to Schedule'}
          </button>
        </div>
      </div>
    </form>
  );
};

// --- Main Page Component ---
export default function ExamDetailsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get(`/school/exams/${examId}/schedules`);
        const data = Array.isArray(res.data) ? res.data : res.data.schedules || res.data.data || [];
        setSchedules(data);
      } catch (err) {
        // Schedule list will remain empty
      }
    };
    fetchSchedules();
  }, [examId, refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this entry from schedule?')) return;
    try {
      await api.delete(`/school/exam-schedules/${id}`);
      setRefresh(r => r + 1);
    } catch (e) { alert('Failed to delete'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900 flex items-center font-medium transition-colors">
          <span className="text-xl mr-1">←</span> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Exam Schedule Management</h1>
      </div>

      {/* Form to add new schedule */}
      <AddScheduleForm examId={examId} onSuccess={() => setRefresh(r => r + 1)} />

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {schedules.map(sch => (
              <tr key={sch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{sch.class.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{sch.subject.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  <div>{new Date(sch.date).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{sch.startTime} - {sch.endTime}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sch._count.marks > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {sch._count.marks > 0 ? 'Graded' : 'Scheduled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/dashboard/exams/${examId}/grades/${sch.id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium"
                  >
                    Enter Grades
                  </button>
                  <button
                    onClick={() => handleDelete(sch.id)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No exams scheduled yet. Use the form above to add one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}