'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Lang, TranslateKey, getTranslation } from './i18n';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslateKey, ...args: (string | number)[]) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem('lang', newLang);
    setLangState(newLang);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang, mounted]);

  const t = useCallback(
    (key: TranslateKey, ...args: (string | number)[]) => getTranslation(lang, key, ...args),
    [lang]
  );

  // Prevent hydration mismatch by optionally rendering children only after mount, 
  // or rendering with default 'en' state until client re-hydrates.
  // We'll render children normally since Next.js often prefers it, 
  // but if we encounter hydration errors we might need to conditionally render.
  
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {/* Small opacity transition to avoid harsh hydration flash if lang changes */}
      <div 
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease-in-out', minHeight: '100vh' }}
        key={lang} // Forces re-render of layout children on lang change if needed, but Context is usually enough
      >
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}
