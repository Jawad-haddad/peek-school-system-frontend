// src/components/AddStudentForm.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';

type AddStudentFormProps = {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddStudentForm({ classId, onClose, onSuccess }: AddStudentFormProps) {
  const [fullName, setFullName] = useState('');
  const [parentId, setParentId] = useState('');
  const [nfcId, setNfcId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      await axios.post(
        '/api/schools/students',
        {
          fullName,
          parentId,
          nfc_card_id: nfcId || null,
          classId: classId, // Ensure classId is being sent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add student. Please check the data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Add Student to this Class</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          {/* Parent ID */}
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent User ID</label>
            <input type="text" id="parentId" required value={parentId} onChange={(e) => setParentId(e.target.value)} placeholder="Get this from the 'User' table in Prisma Studio" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
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
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}