// src/components/EditTeacherForm.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

// هذا هو Type المعلم الذي سنستقبله
type Teacher = {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
};

type EditTeacherFormProps = {
    teacher: Teacher; // بيانات المعلم الحالية
    onClose: () => void;
    onSuccess: () => void; // "دق الجرس" لتحديث القائمة
};

export default function EditTeacherForm({ teacher, onClose, onSuccess }: EditTeacherFormProps) {
    // تعبئة الحقول بالبيانات الحالية
    const [fullName, setFullName] = useState(teacher.fullName);
    const [email, setEmail] = useState(teacher.email);
    const [phoneNumber, setPhoneNumber] = useState(teacher.phoneNumber || '');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // التأكد من تحديث البيانات إذا تم فتح المودال لمعلم آخر
    useEffect(() => {
        setFullName(teacher.fullName);
        setEmail(teacher.email);
        setPhoneNumber(teacher.phoneNumber || '');
    }, [teacher]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');

        try {
            // استخدم PUT بدلاً من POST
            await axios.put(
                `/api/schools/teachers/${teacher.id}`, // استخدم ID المعلم
                {
                    fullName,
                    email,
                    phoneNumber: phoneNumber || null,
                    // (نحن لا نرسل كلمة المرور)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onSuccess(); // دق الجرس (تحديث القائمة)
            onClose();   // إغلاق المودال

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update teacher.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Edit Teacher</h2>
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
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}