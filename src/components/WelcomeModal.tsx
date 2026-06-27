import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if the user has already seen the welcome modal in this session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-100 dark:border-slate-800"
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close welcome modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Graphic/Header Area */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-8 pt-10 pb-8 flex justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800/50">
                    <MapPin className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"
                  />
                </div>
              </div>

              {/* Content Area */}
              <div className="px-8 py-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Welcome to SpotFix!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">Spot it. Report it. Fix it.</strong>
                  <br />
                  Submit your civic issues today and help build a better community.
                </p>

                <button
                  onClick={handleClose}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transform hover:-translate-y-0.5"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
