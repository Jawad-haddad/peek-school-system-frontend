'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddExamForm({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  // Changed: Split date into startDate and endDate
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [academicYears, setAcademicYears] = useState<{id:string, name:string}[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch academic years to link the exam to one
  useEffect(() => {
    const fetchYears = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await axios.get('http://localhost:3000/api/schools/academic-years', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAcademicYears(res.data);
      } catch (err) { console.error(err); }
    };
    fetchYears();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      // Updated payload to match the new backend controller
      await axios.post('http://localhost:3000/api/schools/exams', {
        name, 
        startDate, 
        endDate, 
        academicYearId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onSuccess();
      onClose();
    } catch (err) { 
      alert('Failed to create exam'); 
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create New Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
            <input 
              className="w-full border p-2 rounded" 
              placeholder="e.g. Midterm Fall 2025" 
              value={name} onChange={e => setName(e.target.value)} required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              className="w-full border p-2 rounded" 
              value={startDate} onChange={e => setStartDate(e.target.value)} required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              className="w-full border p-2 rounded" 
              value={endDate} onChange={e => setEndDate(e.target.value)} required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select 
              className="w-full border p-2 rounded" 
              value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} required
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              {loading ? 'Saving...' : 'Create Exam'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}