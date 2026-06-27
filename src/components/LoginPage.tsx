import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.role === 'admin') {
        throw new Error('Admins must use the Admin Portal to login');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', data._id);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-950 font-sans">
      {/* 1. Global Navigation Frame */}
      <Navbar />

      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none mt-16">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/20 blur-[100px] mix-blend-screen"
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-violet-600/20 blur-[100px] mix-blend-screen"
        />
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] left-[10%] w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full">
        {/* Glassmorphism Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md p-8 sm:p-10 mx-4 bg-white/10 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
        >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg mb-6"
        >
          <LogIn className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-center text-white mb-2 tracking-tight"
        >
          {t('welcomeBackSpotFix', 'Welcome back to SpotFix')}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-300 mb-8 text-sm font-medium"
        >
          {t('loginToAccount')}
        </motion.p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-xl text-sm font-medium text-center backdrop-blur-md"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">{t('emailAddress')} <span className="text-red-400">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400/80"
                placeholder={t('emailAddress')}
                required
              />
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.7 }}
             className="relative"
          >
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-sm font-medium text-slate-300">{t('password')} <span className="text-red-400">*</span></label>
              <Link to="/forgot-password" className="text-xs text-indigo-300 font-medium hover:text-indigo-200 transition-colors z-20 relative">
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-12 py-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400/80"
                placeholder={t('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2 mt-4 border border-white/10"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               t('loginBtn')
            )}
          </motion.button>
        </form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center text-sm text-slate-300"
        >
          {t('noAccount')}{' '}
          <Link to="/register" className="text-indigo-300 font-semibold hover:text-indigo-200 transition-colors underline decoration-indigo-300/30 underline-offset-4">
            {t('signUp')}
          </Link>
        </motion.p>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-6 pt-6 border-t border-white/10 text-center"
        >
          <Link to="/admin/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1">
            <span>Access Admin Portal</span>
          </Link>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
