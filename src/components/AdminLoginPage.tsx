import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

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
        throw new Error(data.error || 'Access Denied');
      }

      if (data.role !== 'admin') {
        throw new Error('Unauthorized. This portal is for municipal authorities only.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', data._id);

      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 items-center justify-center p-4">
      <div className="bg-slate-800 max-w-md w-full p-8 rounded-xl shadow-2xl border border-slate-700 relative overflow-hidden">
        {/* Top security bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600"></div>

        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-slate-900 border border-slate-700 text-slate-300 rounded-full flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-widest text-center text-white mb-1 uppercase">Admin Gateway</h2>
        <p className="text-center text-slate-400 mb-8 text-xs font-mono uppercase tracking-widest">Restricted Access Portal</p>

        {error && (
          <div className="mb-6 bg-red-900/30 text-red-400 p-3 rounded-lg text-sm font-mono border border-red-800/50 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Authority Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded text-white px-4 py-3 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all font-mono text-sm"
              placeholder="admin@municipality.gov"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Security Key</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded text-white px-4 py-3 pr-12 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all font-mono text-sm tracking-widest"
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
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded transition-colors flex justify-center items-center gap-2 mt-8 uppercase tracking-widest text-sm"
          >
            {loading ? 'Authenticating...' : 'Authorize Login'}
            {!loading && <ShieldCheck className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
           <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors">
            ← Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
