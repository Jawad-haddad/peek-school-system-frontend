'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type ClassOption = {
    id: string;
    name: string;
};

export default function AddStudentPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [classId, setClassId] = useState('');

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // Ensure consistency in endpoint usage
                const response = await api.get('/school/classes');
                const data = Array.isArray(response.data) ? response.data : response.data.data || [];
                setClasses(data);
                if (data.length > 0) {
                    setClassId(data[0].id);
                }
            } catch (err) {
                console.error("Failed to load classes", err);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const payload = {
            name: fullName, // Map to 'name' as requested
            email,
            password,
            classId,
        };

        console.log("Submitting Student:", payload);

        try {
            await api.post('/school/students', payload);

            alert('Student added successfully!');
            router.push('/dashboard/students'); // Redirect back to list
        } catch (err: any) {
            console.error("Add student error:", err);
            setError(err.response?.data?.message || 'Failed to add student.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Add New Student</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full 4-Part Name (e.g., Jawad Adel Salman Haddad)
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 outline-none"
                            placeholder="Enter full legal name"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 outline-none"
                                placeholder="student@school.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* Class Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Class</label>
                        <select
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 bg-white outline-none"
                            disabled={loadingClasses}
                        >
                            {loadingClasses ? <option>Loading...</option> : (
                                <>
                                    <option value="">Select a Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </>
                            )}
                        </select>
                    </div>

                    {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg mr-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md transform transition active:scale-95"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Student'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
