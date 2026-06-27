import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Award, Clock, MapPin, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

export default function UserProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setIssues(data.issues);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to realistic mock data
      setProfile({
        name: localStorage.getItem('userName') || 'John Doe',
        email: 'john.doe@example.com',
        points: 450,
        badge: 'Active Citizen'
      });
      setIssues([
        {
          _id: '1',
          mainCategory: 'Infrastructure',
          subCategory: 'Pothole',
          status: 'Reported',
          createdAt: new Date().toISOString(),
          locationAddress: 'Sector 4, Main Road',
          evidenceImages: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400'],
          severity: 'High'
        },
        {
          _id: '2',
          mainCategory: 'Sanitation',
          subCategory: 'Garbage Dump',
          status: 'In Progress',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          locationAddress: 'Downtown Market Area',
          evidenceImages: [],
          severity: 'Medium'
        },
        {
          _id: '3',
          mainCategory: 'Utilities',
          subCategory: 'Streetlight Broken',
          status: 'Resolved',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          locationAddress: 'Park Avenue, Block B',
          evidenceImages: ['https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=400'],
          severity: 'Low'
        }
      ]);
      setError('Could not connect to server. Displaying mock data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="w-3 h-3" />;
      case 'In Progress': return <RefreshCw className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 w-full animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 space-y-4 w-full">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto md:mx-0"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mx-auto md:mx-0"></div>
            </div>
            <div className="w-48 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full">
      {error && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* User Info Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 mb-10 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-900/40 dark:to-purple-900/40" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-lg shrink-0">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-3xl font-bold text-slate-800 dark:text-white">
              {getInitials(profile?.name)}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left mb-2 md:mb-0 min-w-0 w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{profile?.name || 'Citizen'}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400 mt-1 min-w-0 w-full">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{profile?.email || 'No email provided'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-0.5 shadow-lg shrink-0 w-full md:w-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[10px] px-6 py-4 flex flex-col items-center justify-center h-full">
              <div className="flex items-center gap-2 text-indigo-500 mb-1">
                <Award className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{profile?.badge || 'Scout'}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {profile?.points || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-widest">
                Total Points
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* History Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          My Reported Issues
        </h2>
        <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
          {issues.length} Reports
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No reports yet</h3>
          <p className="text-slate-500 dark:text-slate-400">You haven't reported any civic issues yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {issues.map((issue, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={issue._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:border-indigo-500/30 transition-colors min-w-0 w-full"
            >
              {issue.evidenceImages && issue.evidenceImages.length > 0 ? (
                <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={issue.evidenceImages[0]} 
                    alt="Issue" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
              )}

              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${getStatusColor(issue.status)}`}>
                    {getStatusIcon(issue.status)}
                    {issue.status}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    {issue.createdAt ? format(parseISO(issue.createdAt), 'MMM d, yyyy') : 'Unknown Date'}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-900 dark:text-white text-lg break-words whitespace-normal leading-snug mb-1">
                  {issue.mainCategory} {issue.subCategory && `— ${issue.subCategory}`}
                </h3>
                
                {(issue.latitude && issue.longitude) || issue.locationAddress ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1 min-w-0 w-full">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                      {issue.locationAddress && <span className="font-medium text-slate-700 dark:text-slate-300 truncate w-full block">{issue.locationAddress}</span>}
                      {issue.latitude && issue.longitude && (
                        <span className="truncate w-full block">{issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
