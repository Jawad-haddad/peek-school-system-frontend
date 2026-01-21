'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

type Student = {
  id: string;
  fullName: string;
  nfc_card_id: string | null;
  parent: { fullName: string; phoneNumber: string | null };
};

export default function ClassStudentsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        // لاحظ: نستخدم الرابط الجديد الذي يجلب الطلاب حسب الفصل
        const res = await axios.get(`http://localhost:3000/api/schools/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (err) {
        setError('Failed to load students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Students List</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
          {/* تم إزالة المسافات بين الوسوم لتجنب Hydration Error */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Parent Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">NFC ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{student.fullName}</td>
                  <td className="px-6 py-4 text-gray-500">{student.parent?.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-500">{student.parent?.phoneNumber || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{student.nfc_card_id || 'Not Linked'}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No students enrolled in this class yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}