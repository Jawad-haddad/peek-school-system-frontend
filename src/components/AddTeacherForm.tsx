// src/components/AddTeacherForm.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';

type AddTeacherFormProps = {
  onClose: () => void;
  onSuccess: () => void; // "دق الجرس" لتحديث القائمة
};

export default function AddTeacherForm({ onClose, onSuccess }: AddTeacherFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      await axios.post(
        'http://localhost:3000/api/schools/teachers',
        {
          fullName,
          email,
          password,
          phoneNumber: phoneNumber || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess(); // دق الجرس (تحديث القائمة)
      onClose();   // إغلاق المودال

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add teacher. Please check the data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Add New Teacher</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Initial Password</label>
            <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
            <input type="text" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {isSubmitting ? 'Adding...' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}