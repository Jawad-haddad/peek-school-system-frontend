'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api'; // Fixed import
import TimetableEntryModal from '../../../../components/TimetableEntryModal';

// 1. تعريف Type لبيانات الجدول القادمة من الـ API
type TimetableEntry = {
  id: string;
  day: string; // "MONDAY", "TUESDAY", etc.
  period: number;
  subject: { id: string; name: string; };
  teacher: { id: string; fullName: string; };
};

// 2. تعريف Type للبيانات التي سنرسلها للمودال
type ModalData = {
  day: string;
  period: number;
  currentSubjectId: string | null;
  currentTeacherId: string | null;
};

// 3. تعريف هيكل الجدول (الأيام والحصص)
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "SUNDAY"]; // (أيام الدوام)
const PERIODS = [1, 2, 3, 4, 5, 6]; // (عدد الحصص)

export default function TimetableGridPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // حالات المودال
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // وظيفة جلب بيانات الجدول
  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/school/classes/${classId}/timetable`);
      setTimetable(response.data);
    } catch (error) {
      setError("Failed to fetch timetable.");
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة أو عند "دق الجرس"
  useEffect(() => {
    if (classId) {
      fetchTimetable();
    }
  }, [classId, refreshTrigger]);

  // وظيفة مساعدة للبحث عن حصة معينة في الجدول
  const getEntry = (day: string, period: number): TimetableEntry | undefined => {
    return timetable.find(entry => entry.day === day && entry.period === period);
  };

  // --- وظائف التحكم بالمودال ---
  const handleSlotClick = (day: string, period: number) => {
    const entry = getEntry(day, period);
    setModalData({
      day: day,
      period: period,
      currentSubjectId: entry?.subject.id || null,
      currentTeacherId: entry?.teacher.id || null,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // "دق الجرس"
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800">Class Timetable</h1>
      <p className="mt-2 text-gray-600">Click on any slot to add or edit an entry.</p>

      {loading && <p className="mt-8 text-center">Loading...</p>}
      {error && <p className="mt-8 text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Day</th>
                {PERIODS.map(period => (
                  <th key={period} className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Period {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="px-6 py-4 font-medium capitalize text-gray-900">
                    {day.toLowerCase()}
                  </td>
                  {PERIODS.map(period => {
                    const entry = getEntry(day, period);
                    return (
                      <td
                        key={period}
                        className="cursor-pointer border-l px-4 py-4 text-center hover:bg-gray-50"
                        onClick={() => handleSlotClick(day, period)}
                      >
                        {entry ? (
                          <div>
                            <p className="font-semibold text-gray-900">{entry.subject.name}</p>
                            <p className="text-sm text-gray-500">{entry.teacher.fullName}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">+</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The Modal */}
      {isModalOpen && modalData && (
        <TimetableEntryModal
          classId={classId}
          day={modalData.day}
          period={modalData.period}
          currentSubjectId={modalData.currentSubjectId}
          currentTeacherId={modalData.currentTeacherId}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleSuccess();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
}