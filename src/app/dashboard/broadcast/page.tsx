'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function BroadcastPage() {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target: 'all' // all, teachers, parents
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await api.post('/communication/broadcast', formData);
            setStatus({ type: 'success', message: 'Broadcast sent successfully!' });
            setFormData({ title: '', message: '', target: 'all' }); // Reset form
        } catch (err: any) {
            console.error("Broadcast error:", err);
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send broadcast.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Send Broadcast</h1>
            <p className="text-gray-500 mb-8">Send announcements to teachers, parents, or everyone.</p>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                {status && (
                    <div className={`mb-6 p-4 rounded-xl font-medium ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border-2 border-gray-100 rounded-xl p-4 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-lg"
                            placeholder="e.g. School Closure Update"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Audience</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'all', label: '📢 Everyone', desc: 'Teachers & Parents' },
                                { id: 'teachers', label: '👨‍🏫 Teachers', desc: 'Faculty Only' },
                                { id: 'parents', label: '👨‍👩‍👧‍👦 Parents', desc: 'Guardians Only' }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, target: option.id })}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.target === option.id
                                            ? 'border-violet-500 bg-violet-50'
                                            : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`font-bold ${formData.target === option.id ? 'text-violet-700' : 'text-gray-700'}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 font-medium">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Message Content</label>
                        <textarea
                            required
                            rows={6}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full border-2 border-gray-100 rounded-xl p-4 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-600 leading-relaxed resize-none"
                            placeholder="Type your announcement here..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all
                                flex items-center gap-3
                                ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-violet-200 hover:-translate-y-1 active:translate-y-0'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span>🚀 Send Broadcast</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
