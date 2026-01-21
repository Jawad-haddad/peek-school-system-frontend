// src/app/dashboard/classes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import AddClassForm from '../../../components/AddClassForm';
import EditClassForm from '../../../components/EditClassForm'; // <-- 1. استيراد مودال التعديل
import Link from 'next/link';

type Class = {
  id: string;
  name: string;
  academicYearId: string; // <-- 2. نحتاج هذا المعرّف للتعديل
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 3. تحديث حالات المودال
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/schools/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      setError("Failed to fetch classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [refreshTrigger]);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 4. إضافة وظائف مودال التعديل
  const handleOpenEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedClass(null);
  };

  // 5. إضافة وظيفة الحذف
  const handleDelete = async (classId: string, className: string) => {
    if (!window.confirm(`Are you sure you want to delete the class "${className}"? This might fail if students are still enrolled.`)) {
      return;
    }
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`http://localhost:3000/api/schools/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Class deleted successfully!');
      handleSuccess();
    } catch (error: any) {
      console.error("Error deleting class:", error);
      alert(error.response?.data?.message || 'Failed to delete class.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Manage Classes</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add Class
        </button>
      </div>

      {/* ... (Loading and Error messages) ... */}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Class Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">View</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4">{cls.name}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/students/${cls.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View Students
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
          *         {/* 6. تفعيل الأزرار */}
                    <button onClick={() => handleOpenEditModal(cls)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(cls.id, cls.name)} className="ml-4 text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 7. إضافة المودالات */}
      {isAddModalOpen && (
        <AddClassForm 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}

      {isEditModalOpen && selectedClass && (
        <EditClassForm
          classData={selectedClass}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}