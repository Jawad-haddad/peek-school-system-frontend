'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

type Student = {
  id: string;
  fullName: string;
  nfc_card_id: string | null;
  parent: { fullName: string; phoneNumber: string | null };
  wallet_balance?: number; // Mocking this for the card view as requested
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
        const res = await axios.get(`http://localhost:3000/api/schools/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // We might need to mock wallet balance if not in API yet
        const dataWithMockWallet = res.data.map((s: any) => ({
          ...s,
          wallet_balance: s.wallet_balance ?? (Math.random() > 0.5 ? 50 : -10) // Mocking for demo
        }));
        setStudents(dataWithMockWallet);
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Students List</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-lg bg-white shadow">
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

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {students.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3">
                {/* Top Row: Info */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{student.fullName}</h3>
                    <p className="text-xs text-gray-500">{student.parent?.fullName || 'No Parent'}</p>
                  </div>
                </div>

                {/* Middle Row: Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Wallet:</span>
                    <span className={`font-semibold ${(student.wallet_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${student.wallet_balance?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">NFC:</span>
                    {student.nfc_card_id ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span> Active
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-gray-300"></span> None
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <button
                  className="mt-1 w-full rounded-md bg-indigo-50 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                  onClick={() => {
                    // In a real app this would open the edit modal
                    // For now we just alert as a placeholder or we can link to an edit page
                    alert(`Edit ${student.fullName}`);
                  }}
                >
                  Edit Student
                </button>
              </div>
            ))}
            {students.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No students found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
