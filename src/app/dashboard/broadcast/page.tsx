'use client';

import { useState } from 'react';
import api, { request, formatApiError, ApiEnvelopeError } from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';
import { useLang } from '@/lib/LangProvider';

/** Explicit audience options with exact backend scope values */
const AUDIENCE_OPTIONS = [
  {
    id: 'SCHOOL',
    /** stable data-testid — matches e2e `broadcast-target-all` */
    testId: 'broadcast-target-all',
    label: '📢 All',
    desc: 'Teachers & Parents',
    displayName: 'All (Teachers & Parents)',
  },
  {
    id: 'PARENTS_ONLY',
    testId: 'broadcast-target-parents',
    label: '👨‍👩‍👧‍👦 Parents only',
    desc: 'Guardians only',
    displayName: 'Parents only',
  },
  {
    id: 'TEACHERS_ONLY',
    testId: 'broadcast-target-teachers',
    label: '👨‍🏫 Teachers only',
    desc: 'Faculty only',
    displayName: 'Teachers only',
  },
] as const;

type AudienceId = typeof AUDIENCE_OPTIONS[number]['id'];

export default function BroadcastPage() {
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<AudienceId>('SCHOOL');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedAudience = AUDIENCE_OPTIONS.find(o => o.id === audience)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Minimal payload — no schoolId, exact field names the backend expects
    const payload = {
      title,
      content: message,
      audience: audience === 'SCHOOL' ? 'ALL' : audience,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[broadcast] payload:', payload);
    }

    try {
      await request(() => api.post('/communication/broadcast', payload));
      setStatus({
        type: 'success',
        message: `✅ Broadcast sent to: ${selectedAudience.displayName}`,
      });
      setTitle('');
      setMessage('');
      setAudience('SCHOOL');
    } catch (err: any) {
      if (err instanceof ApiEnvelopeError && err.code === 'FORBIDDEN_ROLE') {
        setStatus({ type: 'error', message: "You don't have permission to send broadcasts." });
        return;
      }
      setStatus({ type: 'error', message: formatApiError('Broadcast failed', err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowed={permissions.canBroadcast}>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('auto_344')}</h1>
        <p className="text-gray-500 mb-8">{t('auto_345')}</p>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {status && (
            <div className={`mb-6 p-4 rounded-xl font-medium ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_042')}</label>
              <input
                type="text"
                required
                data-testid="broadcast-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-4 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-lg"
                placeholder={t('auto_423')}
              />
            </div>

            {/* Audience Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Audience</label>
              <div className="grid grid-cols-3 gap-4">
                {AUDIENCE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    data-testid={option.testId}
                    onClick={() => setAudience(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      audience === option.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-bold ${audience === option.id ? 'text-violet-700' : 'text-gray-700'}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">{option.desc}</div>
                  </button>
                ))}
              </div>
              {/* Confirmation hint */}
              <p className="mt-2 text-sm text-violet-700 font-medium">
                This message will be sent to: <strong>{selectedAudience.displayName}</strong>
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('auto_217')}</label>
              <textarea
                required
                rows={6}
                data-testid="broadcast-message-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-4 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-600 leading-relaxed resize-none"
                placeholder={t('auto_387')}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                data-testid="broadcast-submit-button"
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
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('auto_346')}
                  </>
                ) : (
                  <span>{t('auto_455')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
