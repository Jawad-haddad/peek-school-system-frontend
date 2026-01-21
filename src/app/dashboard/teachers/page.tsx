// src/app/dashboard/teachers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import AddTeacherForm from '../../../components/AddTeacherForm';
import EditTeacherForm from '../../../components/EditTeacherForm'; // 👈 1. استيراد مودال التعديل

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // حالات المودال
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 👈 2. تغيير اسم الحالة
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 👈 3. إضافة حالة مودال التعديل
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null); // 👈 4. إضافة حالة للمعلم المختار

  const fetchTeachers = async () => {
    // ... (هذه الوظيفة تبقى كما هي)
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { setError("Authentication token not found."); setLoading(false); return; }
    try {
      const response = await axios.get('http://localhost:3000/api/schools/teachers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(response.data);
    } catch (error) {
      setError("Failed to fetch teachers.");
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [refreshTrigger]);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // ... (وظيفة handleDelete تبقى كما هي)
  const handleDelete = async (teacherId: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to delete the teacher "${teacherName}"?`)) {
      return;
    }
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`http://localhost:3000/api/schools/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Teacher deleted successfully!');
      handleSuccess();
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      alert(error.response?.data?.message || 'Failed to delete teacher.');
    }
  };

  // 👈 5. إضافة وظائف لفتح وإغلاق مودال التعديل
  const handleOpenEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTeacher(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Manage Teachers</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)} // 👈 6. تحديث لـ Add Modal
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add Teacher
        </button>
      </div>

      {/* ... (Loading and Error messages) ... */}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4">{teacher.fullName}</td>
            _     <td className="px-6 py-4 text-gray-500">{teacher.email}</td>
                  <td className="px-6 py-4 text-gray-500">{teacher.phoneNumber || 'N/A'}</td>
content-fetcher-tool-használatával.
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {/* 👈 7. تفعيل زر التعديل */}
                    <button onClick={() => handleOpenEditModal(teacher)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(teacher.id, teacher.fullName)} className="ml-4 text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 👈 8. إضافة المودالات في النهاية */}
      {isAddModalOpen && (
        <AddTeacherForm 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}

      {isEditModalOpen && selectedTeacher && (
        <EditTeacherForm
          teacher={selectedTeacher}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}