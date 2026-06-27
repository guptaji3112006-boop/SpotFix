import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown, Check } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const LANGUAGES = [
  { code: 'en', label: 'English', symbol: 'EN' },
  { code: 'hi', label: 'Hindi', symbol: 'HI' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add Google Translate Script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
            includedLanguages: LANGUAGES.map(l => l.code).join(','),
          },
          'google_translate_element'
        );
      };
    }
    
    // Attempt to read language from cookie (googtrans)
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match) {
      const langCode = match[1];
      const lang = LANGUAGES.find(l => l.code === langCode);
      if (lang) {
        setCurrentLang(lang);
      }
    }

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: typeof LANGUAGES[0]) => {
    setCurrentLang(lang);
    setIsOpen(false);

    // Find the hidden google translate combo box
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = lang.code;
      selectElement.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden google translate element container */}
      <div id="google_translate_element" className="hidden"></div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 backdrop-blur-md text-slate-800 dark:text-white shadow-sm transition-all"
        aria-label="Toggle Language"
      >
        <Globe className="w-3 h-3 lg:w-4 lg:h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="text-xs lg:text-sm font-semibold tracking-wide">
          {currentLang.symbol}
        </span>
        <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 text-slate-500 dark:text-slate-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors
                    ${currentLang.code === lang.code 
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {lang.label}
                  {currentLang.code === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
