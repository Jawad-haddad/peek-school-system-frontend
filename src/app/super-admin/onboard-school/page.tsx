'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';
import { platformApi } from '@/lib/api';
import { Building2, Save, User, Calendar, GraduationCap, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/LangProvider';

export default function OnboardSchoolPage() {
    const { t } = useLang();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ schoolId: string, adminEmail: string } | null>(null);

    const [schoolName, setSchoolName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [academicYearName, setAcademicYearName] = useState('');
    const [academicYearStart, setAcademicYearStart] = useState('');
    const [academicYearEnd, setAcademicYearEnd] = useState('');

    const [classes, setClasses] = useState<{ name: string; defaultFee?: string }[]>([{ name: '', defaultFee: '' }]);

    const handleAddClass = () => {
        setClasses([...classes, { name: '', defaultFee: '' }]);
    };

    const handleRemoveClass = (index: number) => {
        setClasses(classes.filter((_, i) => i !== index));
    };

    const handleClassChange = (index: number, field: string, value: string) => {
        const newClasses = [...classes];
        newClasses[index] = { ...newClasses[index], [field]: value };
        setClasses(newClasses);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                schoolName,
                adminName,
                adminEmail,
                adminPassword,
                academicYearName,
                academicYearStart,
                academicYearEnd,
                classes: classes.filter(c => c.name.trim() !== '').map(c => ({
                    name: c.name,
                    defaultFee: c.defaultFee ? Number(c.defaultFee) : undefined
                }))
            };

            const data = await platformApi.onboardSchool(payload);
            setSuccessData({
                schoolId: data.schoolId || data.school?.id || 'Unknown',
                adminEmail: data.admin?.email || adminEmail
            });
        } catch (error) {
            console.error('Onboarding error', error);
            // toast handles the error visually via interceptor
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successData) {
        return (
            <ProtectedRoute allowed={permissions.isSuperAdmin}>
                <div className="max-w-xl mx-auto p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-xl border border-emerald-100">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50">
                            <CheckCircle2 size={40} className="animate-in zoom-in duration-500 delay-150" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">{t('auto_325')}</h1>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t('auto_375')}</p>

                        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-8 border border-gray-100">
                            <div className="flex justify-between border-b pb-3 border-gray-200">
                                <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">{t('auto_322')}</span>
                                <span className="text-gray-900 font-mono font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200">{successData.schoolId}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">{t('auto_034')}</span>
                                <span className="text-gray-900 font-bold">{successData.adminEmail}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSuccessData(null);
                                setSchoolName(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
                                setClasses([{ name: '', defaultFee: '' }]);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            {t('auto_265')}
                                                    </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowed={permissions.isSuperAdmin}>
            <div className="max-w-4xl mx-auto p-6 pb-20 fade-in duration-500">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('auto_368')}</h1>
                    <p className="text-gray-500 mt-2">{t('auto_297')}</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* School Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center gap-3">
                            <Building2 className="text-indigo-600" size={20} />
                            <h2 className="text-lg font-bold text-indigo-900">{t('auto_323')}</h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_324')}</label>
                            <input
                                type="text"
                                required
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all p-3"
                                placeholder={t('auto_116')}
                            />
                        </div>
                    </div>

                    {/* Admin Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-3">
                            <User className="text-blue-600" size={20} />
                            <h2 className="text-lg font-bold text-blue-900">{t('auto_178')}</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_035')}</label>
                                <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3"
                                    placeholder={t('auto_293')} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_034')}</label>
                                <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3"
                                    placeholder="admin@school.com" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_373')}</label>
                                <input type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 font-mono"
                                    placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    {/* Academic Year Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-3">
                            <Calendar className="text-amber-600" size={20} />
                            <h2 className="text-lg font-bold text-amber-900">{t('auto_177')}</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_409')}</label>
                                <input type="text" required value={academicYearName} onChange={(e) => setAcademicYearName(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 p-3" placeholder="2026-2027" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_348')}</label>
                                <input type="date" required value={academicYearStart} onChange={(e) => setAcademicYearStart(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_127')}</label>
                                <input type="date" required value={academicYearEnd} onChange={(e) => setAcademicYearEnd(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Classes Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-3">
                            <GraduationCap className="text-emerald-600" size={20} />
                            <h2 className="text-lg font-bold text-emerald-900">{t('auto_353')}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {classes.map((cls, idx) => (
                                <div key={idx} className="flex gap-4 items-start animate-in slide-in-from-left-4 fade-in duration-300">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={cls.name}
                                            onChange={(e) => handleClassChange(idx, 'name', e.target.value)}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-3"
                                            placeholder={t('auto_076')}
                                        />
                                    </div>
                                    <div className="w-40">
                                        <input
                                            type="number"
                                            value={cls.defaultFee}
                                            onChange={(e) => handleClassChange(idx, 'defaultFee', e.target.value)}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 font-mono"
                                            placeholder={t('auto_159')}
                                        />
                                    </div>
                                    {classes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveClass(idx)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                            title={t('auto_305')}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddClass}
                                className="mt-2 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                            >
                                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                {t('auto_025')}
                                                            </button>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5"
                        >
                            {isSubmitting ? (
                                <span className="animate-pulse flex items-center gap-2">{t('auto_295')}</span>
                            ) : (
                                <>
                                    <Save size={24} />
                                    {t('auto_189')}
                                                                        </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ProtectedRoute>
    );
}
