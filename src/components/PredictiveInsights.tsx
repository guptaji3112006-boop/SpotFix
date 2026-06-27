import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, Lightbulb, Zap, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Insight {
  trendingIssue: string;
  complaintCount: number;
  predictedRisk: string;
  recommendedAction: string;
}

export default function PredictiveInsights() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiLimitExceeded, setApiLimitExceeded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setApiLimitExceeded(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/predictive-insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictive insights');
      }

      const data = await response.json();
      // Handle the new response format
      if (data.insights) {
        setInsights(data.insights);
        setApiLimitExceeded(data.apiLimitExceeded || false);
      } else {
        // Fallback if the backend returns just the array (old format)
        setInsights(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getRiskIcon = (count: number) => {
    if (count > 40) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (count > 20) return <TrendingUp className="w-5 h-5 text-amber-500" />;
    if (count > 10) return <Lightbulb className="w-5 h-5 text-blue-400" />;
    return <Zap className="w-5 h-5 text-indigo-400" />;
  };

  const getRiskColor = (count: number) => {
    if (count > 40) return 'bg-red-500/10 border-red-500/30 text-red-400';
    if (count > 20) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    if (count > 10) return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    return 'bg-slate-700/50 border-slate-600 text-slate-300';
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-400" />
            AI Predictive Insights
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">City Planner AI analyzing trends to prevent future issues.</p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </button>
      </div>

      {apiLimitExceeded && (
        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-800 dark:text-amber-300 font-bold mb-1">AI API Limit Exceeded</h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              The AI service is currently receiving too many requests. We are displaying cached/mock insights for now. Please try again later.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-48">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-red-200 dark:border-red-900/50 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analysis Failed</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button 
            onClick={fetchInsights}
            className="mt-6 px-6 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <ShieldAlert className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-80" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Critical Risks Detected</h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">The AI city planner hasn't detected any significant future risks based on current aggregated data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={index}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col h-full hover:border-indigo-500/30 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-lg"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${getRiskColor(insight.complaintCount)}`}>
                    {getRiskIcon(insight.complaintCount)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{insight.trendingIssue}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block"></span>
                      {insight.complaintCount} Reports
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getRiskColor(insight.complaintCount)}`}>
                  {insight.complaintCount > 40 ? 'Critical' : insight.complaintCount > 20 ? 'High' : 'Moderate'}
                </span>
              </div>
              
              <div className="mt-auto space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Predicted Risk</h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {insight.predictedRisk}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                  <h5 className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">Action Needed</h5>
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                    {insight.recommendedAction}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
