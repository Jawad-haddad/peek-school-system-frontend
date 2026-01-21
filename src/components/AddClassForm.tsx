// src/components/AddClassForm.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

type AddClassFormProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddClassForm({ onClose, onSuccess }: AddClassFormProps) {
  const [name, setName] = useState('');
  const [selectedYearId, setSelectedYearId] = useState(''); 
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]); 
  const [loadingYears, setLoadingYears] = useState(true);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  useEffect(() => {
    const fetchAcademicYears = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await axios.get('http://localhost:3000/api/schools/academic-years', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAcademicYears(response.data);
       
        const activeYear = response.data.find((year: AcademicYear) => year.isActive);
        if (activeYear) {
          setSelectedYearId(activeYear.id);
        } else if (response.data.length > 0) {
          setSelectedYearId(response.data[0].id); 
        }
      } catch (err) {
        setError("Failed to load academic years.");
      } finally {
        setLoadingYears(false);
      }
    };
    fetchAcademicYears();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedYearId) {
      setError("Please select an academic year.");
      return;
    }

    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      await axios.post(
        'http://localhost:3000/api/schools/classes',
        {
          name,
          academicYearId: selectedYearId, 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Add New Class</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          
          {/* Academic Year Dropdown (6. القائمة المنسدلة الجديدة) */}
          <div>
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700">Academic Year</label>
            <select
              id="academicYear"
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              required
              disabled={loadingYears}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {loadingYears ? (
                <option>Loading years...</option>
              ) : (
                <>
                  <option value="">Select a year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.isActive && '(Active)'}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Class Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name</label>
            <input 
              type="text" 
              id="name" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Grade 1 - Section A"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || loadingYears} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {isSubmitting ? 'Adding...' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}