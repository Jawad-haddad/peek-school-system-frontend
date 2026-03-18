'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mvpApi } from '@/lib/api';
import { useLang } from '@/lib/LangProvider';

export default function LoginPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (cooldownCountdown <= 0) return;
    const timer = setInterval(() => {
      setCooldownCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownCountdown]);

  // Boot-time connectivity check
  useEffect(() => {
    mvpApi.checkConnectivity().then((isAvailable) => {
      setConnectionError(!isAvailable);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldownCountdown > 0) return;
    setError('');
    setIsLoading(true);

    try {
      // Contract: POST /auth/login -> { message, token, user: { id, fullName, email, role, schoolId } }
      // loginUser now returns plain LoginResponse (envelope already unwrapped by request())
      const { token, user } = await mvpApi.loginUser(email, password);

      // Persist token and user object (role comes from user.role — never derived client-side)
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);         // 'ADMIN' | 'TEACHER' | 'PARENT'
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/dashboard');

    } catch (err: any) {
      if (!err.response && String(err.message).includes('Network Error')) {
        setConnectionError(true);
      } else if (err.response?.status === 429 || err.code === 'RATE_LIMITED') {
        const retryAfter = err.response?.headers?.['retry-after'] || err.response?.headers?.['Retry-After'];
        const waitSeconds = retryAfter ? parseInt(retryAfter as string, 10) : 30;
        const validWait = isNaN(waitSeconds) ? 30 : waitSeconds;
        setError(t('login.tooMany', validWait));
        setCooldownCountdown(validWait);
      } else {
        // ApiEnvelopeError.message is always human-readable; check for validation details
        let message = err.message || err.response?.data?.message || 'Login failed. Please try again.';
        if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details) && err.details.length > 0) {
          message = err.details.map((d: any) => d.message || d.string).join(', ') || message;
        }
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Centered Login Card */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-gray-100">

        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('login.subtitle')}</p>
        </div>

        {/* Backend Down Banner */}
        {connectionError && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 border border-red-300 shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <p className="text-sm font-bold text-red-700">{t('login.backendDown')}</p>
            </div>
            <p className="text-xs text-red-600 mt-1 ltr:pl-7 rtl:pr-7">{t('login.verifyConnection')}</p>
          </div>
        )}

        {/* Demo Mode Quick Fill Helper */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="mb-6 rounded-xl bg-violet-50 border border-violet-200 p-4 shadow-inner">
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              {t('login.demoMode')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('admin@peek.com'); setPassword('password123'); }}
                className="text-xs font-bold py-2 bg-white border border-violet-200 text-violet-700 rounded-lg shadow-sm hover:bg-violet-600 hover:text-white transition-colors"
              >
                {t('login.admin')}
              </button>
              <button
                type="button"
                onClick={() => { setEmail('teacher@peek.com'); setPassword('password123'); }}
                className="text-xs font-bold py-2 bg-white border border-violet-200 text-violet-700 rounded-lg shadow-sm hover:bg-violet-600 hover:text-white transition-colors"
              >
                {t('login.teacher')}
              </button>
              <button
                type="button"
                onClick={() => { setEmail('parent@peek.com'); setPassword('password123'); }}
                className="text-xs font-bold py-2 bg-white border border-violet-200 text-violet-700 rounded-lg shadow-sm hover:bg-violet-600 hover:text-white transition-colors"
              >
                {t('login.parent')}
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              data-testid="login-email-input"
              className="block w-full text-left rounded-lg border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 text-base"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              dir="ltr"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              data-testid="login-password-input"
              className="block w-full text-left rounded-lg border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 text-base"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              dir="ltr"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center border border-red-100 animate-pulse">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              data-testid="login-submit-button"
              disabled={isLoading || connectionError || cooldownCountdown > 0}
              className={`flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-3 px-4 text-base font-bold text-white shadow-md transition-all 
                ${(isLoading || connectionError || cooldownCountdown > 0) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}
              `}
            >
              {isLoading ? t('login.signingIn') : cooldownCountdown > 0 ? t('login.wait', cooldownCountdown) : t('login.signIn')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-gray-400 hover:text-blue-500 transition-colors">
            {t('login.forgotPassword')}
          </a>
        </div>

      </div>
    </main>
  );
}