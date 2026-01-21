// src/app/dashboard/subjects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import AddSubjectForm from '../../../components/AddSubjectForm';
import EditSubjectForm from '../../../components/EditSubjectForm';

type Subject = {
  id: string;
  name: string;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/schools/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      setError("Failed to fetch subjects.");
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [refreshTrigger]);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSubject(null);
  };

  const handleDelete = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subjectName}"?`)) {
      return;
    }
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`http://localhost:3000/api/schools/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Subject deleted successfully!');
      handleSuccess();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      alert(error.response?.data?.message || 'Failed to delete subject.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Manage Subjects</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add Subject
        </button>
      </div>

    s   {loading && <p className="mt-8 text-center">Loading subjects...</p>}
      {error && <p className="mt-8 text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-6 py-4">{subject.name}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => handleOpenEditModal(subject)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(subject.id, subject.name)} className="ml-4 text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isAddModalOpen && (
      <AddSubjectForm 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}

      {isEditModalOpen && selectedSubject && (
        <EditSubjectForm
          subject={selectedSubject}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}