import React from 'react';
import { IssueReport } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const isVideoMedia = (url: string) => {
  if (!url) return false;
  if (url.startsWith('data:video')) return true;
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

interface HistorySectionProps {
  issues: IssueReport[];
  currentUser: { userId: string, name: string, role?: string };
}

export default function HistorySection({ issues, currentUser }: HistorySectionProps) {
  const resolvedIssues = issues.filter(issue => issue.status === 'Resolved');

  if (resolvedIssues.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No resolved issues yet</h3>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
          When reports are fully fixed and verified by the admin, they will appear here in the community archive.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {currentUser.role === 'admin' ? 'Issues You Resolved' : 'Resolved Issues in Your Area'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {currentUser.role === 'admin' 
            ? 'Archive of problems you have successfully marked as resolved.' 
            : 'Archive of problems solved by our community in your neighborhood.'}
        </p>
      </div>

      <div className="space-y-4">
        {resolvedIssues.map(issue => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col sm:flex-row gap-5"
          >
            {/* Resolved Badge Corner */}
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-bl-full border-b border-l border-emerald-100">
                <CheckCircle className="w-5 h-5 absolute top-3 right-3" />
              </div>
            </div>

            {/* Thumbnail */}
            {issue.imageUrl && (
              <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                {isVideoMedia(issue.imageUrl) ? (
                  <video 
                    src={issue.imageUrl} 
                    className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply" 
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={issue.imageUrl} 
                    alt={issue.title}
                    className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply" 
                  />
                )}
                <div className="absolute inset-0 bg-emerald-900/10 MIX"></div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{issue.title}</h3>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 gap-2">
                    <span className="font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                      {issue.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <div className="flex flex-col">
                        {issue.locationAddress && <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{issue.locationAddress}</span>}
                        <span>{issue.latitude && issue.longitude ? `${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}` : 'Location attached'}</span>
                      </div>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 mt-3 leading-relaxed">
                {issue.description}
              </p>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                   <CheckCircle className="w-3.5 h-3.5" />
                   Solved
                </div>
                {issue.resolvedAt && (
                   <span className="text-slate-400 dark:text-slate-500 font-medium">
                     Resolvd {formatDistanceToNow(new Date(issue.resolvedAt), { addSuffix: true })}
                   </span>
                )}
                <div className="ml-auto flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                   <span>Reported by</span>
                   <span className="font-medium text-slate-600 dark:text-slate-300">
                     {(issue.reporterId === currentUser.userId || issue.reporterIds?.includes(currentUser.userId)) ? (
                       <span className="text-indigo-600 dark:text-indigo-400 font-bold">You</span>
                     ) : (
                       issue.reporterName || 'Anonymous'
                     )}
                   </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
