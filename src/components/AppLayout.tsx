import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import WelcomeModal from './WelcomeModal';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <WelcomeModal />
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 w-full max-w-7xl sm:px-6 lg:px-8">
        <Outlet />
      </main>
      
      {/* Global Footer Bar */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 sm:py-3 px-2 sm:px-6 flex flex-col md:flex-row items-center justify-between text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex-shrink-0 transition-colors duration-300 gap-1.5 sm:gap-3">
        <div className="flex items-center gap-1 sm:gap-2 text-center flex-wrap justify-center">
          <span className="font-bold text-slate-700 dark:text-slate-300">Vibe2Ship Hackathon</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            Built with ❤️ for community
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-800/50 py-1 sm:py-1 px-2 sm:px-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700">
          <span className="text-slate-600 dark:text-slate-300 font-semibold hidden sm:inline">Sponsored by:</span>
          
          {/* Coding Ninjas */}
          <div className="flex items-center gap-1 group cursor-pointer">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border border-slate-100 dark:border-slate-700 p-[1px]">
               <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M80,20 H45 C25,20 15,30 15,50 C15,70 25,80 45,80 H80 V60 H45 C35,60 35,55 35,50 C35,45 35,40 45,40 H80 V20 Z" fill="#F66A05" />
                  <polygon points="38,48 46,52 48,47 41,46" fill="#333" />
                  <polygon points="62,48 54,52 52,47 59,46" fill="#333" />
               </svg>
            </div>
            <div className="flex items-center text-[9px] sm:text-[11px] tracking-tight text-slate-800 dark:text-slate-200">
              <span className="font-bold">coding</span>
              <span className="font-light">ninjas</span>
            </div>
          </div>
          
          <span className="text-slate-400 font-light text-[8px] sm:text-[10px]">x</span>
          
          {/* Google for Developers */}
          <div className="flex items-center gap-1 group cursor-pointer">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200">Google for Developers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
