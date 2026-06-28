import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, UserCircle, LogOut, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../contexts/AudioContext';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMuted, toggleMute, playClick } = useAudio();

  const currentUser = {
    userId: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || '',
    role: localStorage.getItem('userRole') || ''
  };

  const handleLogout = () => {
    playClick();
    localStorage.clear();
    navigate('/');
  };

  const navLinks = [
    { name: t('dashboard') || 'Dashboard', path: '/dashboard' },
    { name: t('reportIssue') || 'Report Issue', path: '/report' },
    { name: t('leaderboard') || 'Leaderboard', path: '/leaderboard' },
    { name: 'Profile', path: '/profile' }
  ];

  if (currentUser.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin' });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.includes(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-1.5 lg:gap-2 group shrink-0 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
            <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 logo-animate-jump origin-bottom" />
            <span className="font-extrabold text-xl lg:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500 !normal-case">
              SpotFix
            </span>
          </Link>

          {/* Desktop Navigation */}
          {currentUser.userId && (
            <div className="hidden md:flex items-center gap-2 lg:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-1 py-2 text-xs lg:text-sm font-semibold transition-all ease-in-out group ${
                    isActive(link.path)
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-300'
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute left-0 bottom-0 w-full h-0.5 bg-indigo-500 dark:bg-indigo-400 transition-transform origin-left ease-in-out duration-300 ${
                      isActive(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => {
                playClick();
                toggleMute();
              }}
              className="p-1.5 lg:p-2 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>
            <ThemeToggle />
            <LanguageSwitcher />

            {currentUser.userId ? (
              <div className="hidden md:flex items-center gap-2 lg:gap-4">
                <Link to="/profile" className="flex items-center gap-1.5 lg:gap-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 lg:px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <UserCircle className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-500" />
                  <span className="text-xs lg:text-sm font-semibold truncate max-w-[80px] lg:max-w-[100px]">{currentUser.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 lg:p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/"
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  {t('loginBtn') || 'Login'}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-sm transition-all"
                >
                  {t('signUp') || 'Sign Up'}
                </Link>
              </div>
            )}

            {/* Hamburger Button */}
            <button
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              {currentUser.userId && (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:opacity-80 transition-opacity">
                    <UserCircle className="w-8 h-8 text-indigo-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{currentUser.role} Account</p>
                    </div>
                  </Link>
                  
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                          isActive(link.path)
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-base font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('logout') || 'Logout'}
                  </button>
                </>
              )}

              {!currentUser.userId && (
                <div className="flex flex-col gap-3 mt-2">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center text-base font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    {t('loginBtn') || 'Login'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center text-base font-semibold text-white bg-indigo-600 rounded-lg"
                  >
                    {t('signUp') || 'Sign Up'}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
