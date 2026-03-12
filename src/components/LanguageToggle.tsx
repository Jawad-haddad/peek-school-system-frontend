'use client';

import { useLang } from '@/lib/LangProvider';

export default function LanguageToggle() {
  const { t } = useLang();
  const { lang, setLang } = useLang();

  return (
    <div className={`fixed top-4 z-50 transition-all ${lang === 'ar' ? 'left-4' : 'right-4'}`}>
      <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 rounded-full p-1 flex items-center gap-1">
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            lang === 'en'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
          }`}
          dir="ltr"
        >
          {t('auto_117')}
                          </button>
        <button
          onClick={() => setLang('ar')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            lang === 'ar'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
          }`}
          dir="rtl"
        >
          {t('auto_014')}
                          </button>
      </div>
    </div>
  );
}
