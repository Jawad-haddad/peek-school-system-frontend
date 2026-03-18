// src/components/AddSubjectForm.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';
import { useLang } from '@/lib/LangProvider';

type AddSubjectFormProps = {
    onClose: () => void;
    onSuccess: () => void;
};

export default function AddSubjectForm({ onClose, onSuccess }: AddSubjectFormProps) {
    const { t } = useLang();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');

        try {
            await axios.post(
                '/api/schools/subjects',
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add subject.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800">{t('auto_029')}</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('auto_365')}</label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('auto_427')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
                            {t('auto_065')}
                                                    </button>
                        <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            {isSubmitting ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}