'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type Exam = { id: string; name: string; date: string; academicYearId: string; };

export default function EditExamForm({ exam, onClose, onSuccess }: { exam: Exam, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(exam.name);
  const [date, setDate] = useState(new Date(exam.date).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      await axios.put(`/api/schools/exams/${exam.id}`, {
        name, date, academicYearId: exam.academicYearId
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
      onClose();
    } catch (err) { alert('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Edit Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} required />
          <input type="date" className="w-full border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} required />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}