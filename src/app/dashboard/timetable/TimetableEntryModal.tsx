'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLang } from '@/lib/LangProvider';

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
    const { t } = useLang();
  const [subjects, setSubjects] = useState<{ id: string, name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string, fullName: string }[]>([]);

  const [subjectId, setSubjectId] = useState(currentSubjectId || '');
  const [teacherId, setTeacherId] = useState(currentTeacherId || '');
  const [loading, setLoading] = useState(false);

  // حساب أوقات الحصص تلقائياً (مجرد مثال، يمكن تعديله)
  const getPeriodTime = (p: number) => {
    const startHour = 8 + p - 1; // الحصة 1 تبدأ 8:00
    return {
      start: `${String(startHour).padStart(2, '0')}:00`,
      end: `${String(startHour).padStart(2, '0')}:45` // مدة الحصة 45 دقيقة
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const [sRes, tRes] = await Promise.all([
          axios.get('/api/schools/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/schools/teachers', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const extractList = (resData: any) =>
          Array.isArray(resData) ? resData :
            Array.isArray(resData?.data) ? resData.data :
              Array.isArray(resData?.subjects) ? resData.subjects :
                Array.isArray(resData?.teachers) ? resData.teachers : [];

        setSubjects(extractList(sRes.data));
        setTeachers(extractList(tRes.data));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const time = getPeriodTime(period); // حساب الوقت تلقائياً

    try {
      await axios.post(`/api/schools/classes/${classId}/timetable`, {
        dayOfWeek: day,
        startTime: time.start,
        endTime: time.end,     // <--- إرسال وقت النهاية
        subjectId,
        teacherId
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
    } catch (err) {
      alert(t('auto_153'));
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">{t('auto_118')} {day} {t('auto_009')} {period}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('auto_364')}</label>
            {subjects.length === 0 ? (
              <div className="text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                {t('auto_260')} <a href="/dashboard/subjects" className="underline font-bold">{t('auto_098')}</a>
              </div>
            ) : (
              <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border p-2 rounded mt-1">
                <option value="">{t('auto_333')}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('auto_371')}</label>
            <select required value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">{t('auto_334')}</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">{t('auto_065')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{t('auto_311')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}