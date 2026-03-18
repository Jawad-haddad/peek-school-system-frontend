'use client';

import { useState, useEffect } from 'react';
import { mvpApi, AcademicYear } from '@/lib/api';
import { useLang } from '@/lib/LangProvider';

type AddClassModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function AddClassModal({ isOpen, onClose, onSuccess }: AddClassModalProps) {
    const { t } = useLang();
    const [name, setName] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');
    const [defaultFee, setDefaultFee] = useState<number | ''>('');

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAcademicYears();
        }
    }, [isOpen]);

    const fetchAcademicYears = async () => {
        setLoadingYears(true);
        try {
            const response = await mvpApi.fetchAcademicYears();
            // fetchAcademicYears now returns AcademicYear[] directly (envelope unwrapped)
            const years = Array.isArray(response) ? response : [];
            setAcademicYears(years);

            const activeYear = years.find((year) => year.isActive);
            if (activeYear) {
                setSelectedYearId(activeYear.id);
            } else if (years.length > 0) {
                setSelectedYearId(years[0].id);
            }
        } catch (err) {
            setError(t('auto_151'));
        } finally {
            setLoadingYears(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedYearId || !name) {
            setError(t('auto_287'));
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await mvpApi.createClass({
                name,
                academicYearId: selectedYearId,
                defaultFee: defaultFee ? Number(defaultFee) : undefined,
            });

            onSuccess();
            setName('');
            setDefaultFee('');
            onClose();

        } catch (err: any) {
            let msg = err.message || 'Failed to add class.';
            if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
                msg = err.details[0].message || err.details[0].string || Object.values(err.details[0])[0] || msg;
            }
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{t('auto_027')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                <form className="p-6 space-y-5" onSubmit={handleSubmit}>

                    {/* Academic Year Dropdown */}
                    <div>
                        <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">{t('auto_016')}</label>
                        <select
                            id="academicYear"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                            required
                            disabled={loadingYears}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                        >
                            {loadingYears ? (
                                <option>{t('auto_201')}</option>
                            ) : (
                                <>
                                    <option value="">{t('auto_340')}</option>
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('auto_075')}</label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('auto_426')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Annual Fee */}
                    <div>
                        <label htmlFor="fee" className="block text-sm font-medium text-gray-700 mb-1">{t('auto_043')}</label>
                        <input
                            type="number"
                            id="fee"
                            value={defaultFee}
                            onChange={(e) => setDefaultFee(e.target.value ? Number(e.target.value) : '')}
                            placeholder={t('auto_419')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 mr-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                            {t('auto_065')}
                                                    </button>
                        <button type="submit" disabled={isSubmitting || loadingYears} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-md transition-colors">
                            {isSubmitting ? 'Adding...' : 'Add Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
