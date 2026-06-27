import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, Droplets, Zap, HelpCircle } from 'lucide-react';

interface CategoryStat {
  category: string;
  totalComplaints: number;
}

const CategoryStatsBoard: React.FC = () => {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/category-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching category stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getIconForCategory = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'pothole': return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'garbage': return <Trash2 className="w-8 h-8 text-emerald-500" />;
      case 'water leak': return <Droplets className="w-8 h-8 text-blue-500" />;
      case 'streetlight': return <Zap className="w-8 h-8 text-yellow-500" />;
      default: return <HelpCircle className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getBgColorForCategory = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'pothole': return 'bg-amber-500/10 border-amber-500/20';
      case 'garbage': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'water leak': return 'bg-blue-500/10 border-blue-500/20';
      case 'streetlight': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-indigo-500/10 border-indigo-500/20';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        Category Overview
      </h3>
      
      {stats.length === 0 ? (
        <div className="text-center p-8 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No issues reported yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 ${getBgColorForCategory(stat.category)}`}
            >
              <div className="mb-3">
                {getIconForCategory(stat.category)}
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                {stat.totalComplaints}
              </h4>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {stat.category}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryStatsBoard;
