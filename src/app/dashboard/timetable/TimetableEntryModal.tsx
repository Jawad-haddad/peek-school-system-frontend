'use client';
import { useState, useEffect } from 'react';
import api, { request } from '@/lib/api';
import { useLang } from '@/lib/LangProvider';

type Subject = { id: string; name: string };
type Teacher = { id: string; fullName: string };

type Props = {
  classId: string;
  day: string;
  period: number;
  currentSubjectId: string | null;
  currentTeacherId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

/** Returns HH:MM start/end for a given period number (period 1 → 08:00–08:45). */
function getPeriodTime(period: number) {
  const startHour = 8 + period - 1;
  return {
    start: `${String(startHour).padStart(2, '0')}:00`,
    end: `${String(startHour).padStart(2, '0')}:45`,
  };
}

export default function TimetableEntryModal({
  classId, day, period, currentSubjectId, currentTeacherId, onClose, onSuccess,
}: Props) {
  const { t } = useLang();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectId, setSubjectId] = useState(currentSubjectId || '');
  const [teacherId, setTeacherId] = useState(currentTeacherId || '');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load subjects and teachers using the project's api client (correct token + base URL)
  useEffect(() => {
    setLoadingOptions(true);
    setLoadError('');

    Promise.all([
      // GET /api/academics/subjects
      request<Subject[]>(() => api.get('/academics/subjects')),
      // GET /api/academics/teachers
      request<Teacher[]>(() => api.get('/academics/teachers')),
    ])
      .then(([subjectList, teacherList]) => {
        setSubjects(Array.isArray(subjectList) ? subjectList : []);
        setTeachers(Array.isArray(teacherList) ? teacherList : []);
      })
      .catch(err => {
        setLoadError(err?.message || 'Failed to load options.');
        console.error('[TimetableEntryModal] fetch error:', err);
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !teacherId) return;

    setSaving(true);
    setSaveError('');
    const { start, end } = getPeriodTime(period);

    try {
      // POST /api/academics/timetable — exact field names the backend expects
      await request(() =>
        api.post('/academics/timetable', {
          classId,
          subjectId,
          teacherId,
          dayOfWeek: day,
          startTime: start,
          endTime: end,
        })
      );
      onSuccess();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save. Please try again.');
      console.error('[TimetableEntryModal] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const canSave = subjectId && teacherId && !saving;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">
          {t('auto_118')} {day} {t('auto_009')} {period}
        </h2>

        {loadingOptions && (
          <div className="text-sm text-gray-500 mb-4">Loading options…</div>
        )}

        {loadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-4">
            {loadError}
          </div>
        )}

        {saveError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-4">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('auto_364')}
            </label>
            {!loadingOptions && subjects.length === 0 ? (
              <div className="text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                No subjects available.{' '}
                <a href="/dashboard/subjects" className="underline font-bold">
                  Add subjects
                </a>
              </div>
            ) : (
              <select
                required
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                disabled={loadingOptions}
                className="w-full border p-2 rounded mt-1 disabled:opacity-50"
              >
                <option value="">— Select subject —</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('auto_371')}
            </label>
            {!loadingOptions && teachers.length === 0 ? (
              <div className="text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                No teachers available.
              </div>
            ) : (
              <select
                required
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                disabled={loadingOptions}
                className="w-full border p-2 rounded mt-1 disabled:opacity-50"
              >
                <option value="">— Select teacher —</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600"
            >
              {t('auto_065')}
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : t('auto_311')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}