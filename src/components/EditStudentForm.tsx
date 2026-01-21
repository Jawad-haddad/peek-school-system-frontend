// src/components/EditStudentForm.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the type for the student prop
type Student = {
  id: string;
  fullName: string;
  nfc_card_id: string | null;
};

type EditStudentFormProps = {
  student: Student; // The student data to edit
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditStudentForm({ student, onClose, onSuccess }: EditStudentFormProps) {
  // Initialize state with the existing student's data
  const [fullName, setFullName] = useState(student.fullName);
  const [nfcId, setNfcId] = useState(student.nfc_card_id || '');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This ensures that if the prop changes (e.g., user clicks edit on another student),
  // the form state updates to the new student's data.
  useEffect(() => {
    setFullName(student.fullName);
    setNfcId(student.nfc_card_id || '');
  }, [student]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      // Use the PUT method to update the student
      await axios.put(
        `http://localhost:3000/api/schools/students/${student.id}`,
        {
          fullName,
          nfc_card_id: nfcId || null,
          // Note: We are not editing parentId or classId here for simplicity
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess(); // Ring the bell (refresh list)
      onClose();   // Close the modal

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Edit Student</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        
          {/* NFC Card ID */}
          <div>
            <label htmlFor="nfcId" className="block text-sm font-medium text-gray-700">NFC Card ID (Optional)</label>
            <input type="text" id="nfcId" value={nfcId} onChange={(e) => setNfcId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}