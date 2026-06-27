import React, { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check locally stored theme or system preference
    const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-1.5 lg:p-2 rounded-full transition-all duration-300 ease-in-out flex items-center justify-center
        text-slate-800 hover:text-indigo-600 hover:bg-slate-100 bg-white/50 border border-slate-200
        dark:bg-transparent dark:border-transparent dark:text-indigo-200 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/40 relative overflow-hidden shadow-sm dark:shadow-none"
      aria-label="Toggle Dark Mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center ${theme === 'dark' ? 'text-amber-300' : ''}`}
        >
          {theme === 'light' ? (
            <FaMoon />
          ) : (
            <FaSun />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
