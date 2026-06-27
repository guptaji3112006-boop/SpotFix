import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Medal, Star, ShieldCheck, CheckCircle, Trophy, Info, X } from 'lucide-react';
import { UserProfile } from '../types';
import { useTranslation } from 'react-i18next';

interface LeaderboardProps {
  currentUser?: {
    userId: string;
    name: string;
    role: string;
  };
}

export default function Leaderboard({ currentUser }: LeaderboardProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/users/leaderboard');
        const isJson = response.headers.get('content-type')?.includes('application/json');
        if (response.ok && isJson) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Community Hero': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'Active Citizen': return <Medal className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
      case 'Scout': return <Star className="w-5 h-5 text-amber-600" />;
      default: return <ShieldCheck className="w-5 h-5 text-slate-300" />;
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Community Hero': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Active Citizen': return 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-slate-200';
      case 'Scout': return 'bg-orange-50 text-orange-800 border-orange-200';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden relative">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-indigo-200" />
            {t('topContributors') || 'Top Contributors'}
            <button 
              onClick={() => setShowInfo(!showInfo)} 
              className="p-1 hover:bg-white/20 rounded-full transition-colors ml-1"
              aria-label="Badge Information"
            >
              <Info className="w-4 h-4 text-indigo-100" />
            </button>
          </h2>
          <p className="text-sm text-indigo-200 mt-1">{t('recognizingMembers') || 'Recognizing our most active community members'}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10 hidden sm:block">
          <Award className="w-8 h-8 text-white" />
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50"
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300">How to earn badges</h3>
                <button onClick={() => setShowInfo(false)} className="text-indigo-400 hover:text-indigo-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-100/50 dark:border-slate-700/50 text-sm text-indigo-900 dark:text-indigo-200">
                <p className="font-bold mb-1">Earning Points:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li>Report a new issue: <strong className="text-indigo-600 dark:text-indigo-400">+5 pts</strong></li>
                  <li>Upvote an issue: <strong className="text-indigo-600 dark:text-indigo-400">+2 pts</strong></li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100/50 dark:border-slate-700">
                  <div className="shrink-0">{getBadgeIcon('Scout')}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Scout</p>
                    <p className="text-xs text-slate-500">Starting badge for new users reporting issues.</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">0 - 50 pts</span>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100/50 dark:border-slate-700">
                  <div className="shrink-0">{getBadgeIcon('Active Citizen')}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Active Citizen</p>
                    <p className="text-xs text-slate-500">Awarded for consistent community engagement.</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">51 - 150 pts</span>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100/50 dark:border-slate-700">
                  <div className="shrink-0">{getBadgeIcon('Community Hero')}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Community Hero</p>
                    <p className="text-xs text-slate-500">Highest honor for exceptional civic duty.</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">151+ pts</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 animate-pulse">{t('loadingLeaderboard') || 'Loading Leaderboard...'}</div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 border-b border-b-slate-100/50">
             <p className="font-semibold text-slate-700 dark:text-slate-300">{t('noActiveMembers') || 'No active members yet.'}</p>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('reportToAppearHere') || 'Report or verify issues to appear here.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {sortedUsers.map((user, index) => {
              const isFirst = index === 0;
              return (
                <motion.div 
                  key={user.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 px-6 transition-colors ${
                    isFirst ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {index === 0 ? (
                        <span className="text-3xl drop-shadow-md" title="Gold">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-2xl drop-shadow-sm" title="Silver">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-2xl drop-shadow-sm" title="Bronze">🥉</span>
                      ) : (
                        <span className="font-bold text-sm text-slate-500 dark:text-slate-400">#{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate flex items-center gap-2">
                        {currentUser?.userId === user.userId ? (
                          <>
                            {t('you') || 'You'}
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-md shrink-0">
                              {t('current') || 'Current'}
                            </span>
                          </>
                        ) : (
                          user.name
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                        <div className="shrink-0">{getBadgeIcon(user.badge)}</div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider truncate ${getBadgeStyle(user.badge)}`}>
                          {user.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0 pl-2">
                    <p className={`text-xl sm:text-2xl font-black font-mono ${isFirst ? 'text-yellow-600 dark:text-yellow-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{user.points}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t('points') || 'Points'}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
