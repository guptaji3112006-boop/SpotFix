import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Calendar, CalendarDays, CalendarClock, PieChart as PieChartIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';

interface CategoryStat {
  name: string;
  value: number;
}

interface SubCategoryStat {
  mainCategory: string;
  subCategory: string;
  value: number;
}

interface ImpactMetrics {
  totalReported: number;
  totalResolved: number;
  totalInProgress: number;
  categoryStats: CategoryStat[];
  subCategoryStats: SubCategoryStat[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const ISSUE_CATEGORIES = {
  "Roads & Transport": ["Potholes", "Open Manholes", "Broken Footpaths & Pavements", "Waterlogging"],
  "Waste Management": ["Overflowing Community Bins", "Illegal Dumping Yards", "Dead Animal Carcasses"],
  "Water & Sanitation": ["Burst Pipelines", "Sewage Overflow", "Contaminated Water Supply", "Unmaintained Public Toilets"],
  "Public Safety & Lighting": ["Broken Streetlights", "Dangling Live Wires", "Malfunctioning Traffic Signals"],
  "Environment & Greenery": ["Fallen or Dangerous Trees", "Burning of Dry Leaves/Garbage"]
};

type FilterType = 'day' | 'month' | 'year';

export default function PublicImpactDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('month');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("All");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/impact-metrics?filter=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch impact metrics', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial fetch and when filter changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Socket.io integration
  useEffect(() => {
    const socket = io();
    
    // Re-fetch data when issues are created or updated to keep charts fresh
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('new_issue', handleUpdate);
    socket.on('issue_resolved', handleUpdate);
    socket.on('issue_updated', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  const chartDataToRender = React.useMemo(() => {
    if (selectedMainCategory === "All") {
      if (!data?.categoryStats) return [];
      // Calculate total for percentages if needed, or just return category stats
      return data.categoryStats
        .filter(stat => stat.value > 0)
        .map(stat => {
          const safeName = stat.name || 'Other';
          const translated = t(safeName.toLowerCase().replace(/\s+/g, '')) || safeName;
          const finalName = String(translated).charAt(0).toUpperCase() + String(translated).slice(1);
          return { name: finalName, value: stat.value };
        })
        .sort((a, b) => b.value - a.value);
    }

    if (!data?.subCategoryStats) return [];
    
    // Filter and aggregate subcategories for the selected main category
    const filteredStats = data.subCategoryStats.filter(stat => stat.mainCategory === selectedMainCategory);
    
    // Ensure all subcategories from the constant are present
    const subCategoryMap: Record<string, number> = {};
    const predefinedSubCats = ISSUE_CATEGORIES[selectedMainCategory as keyof typeof ISSUE_CATEGORIES] || [];
    
    predefinedSubCats.forEach(sub => {
      subCategoryMap[sub] = 0;
    });

    filteredStats.forEach(stat => {
      const safeSub = stat.subCategory || 'Other';
      subCategoryMap[safeSub] = (subCategoryMap[safeSub] || 0) + stat.value;
    });

    const chartData = Object.entries(subCategoryMap)
      .filter(([name, value]) => value > 0) // Only include slices with data to prevent blank pie charts
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    return chartData;
  }, [data, selectedMainCategory, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col">
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4 pt-12 md:pt-0">
            {t('communityImpact') || 'Community Impact'}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            {t('realTimeInsights') || "Real-time insights into how our community is improving. Data updates instantly as issues are reported and resolved."}
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap justify-center gap-1.5 md:gap-2">
            <FilterButton 
              active={filter === 'day'} 
              onClick={() => setFilter('day')} 
              icon={<CalendarClock className="w-4 h-4 hidden sm:block" />}
              label={t('today') || 'Today'} 
            />
            <FilterButton 
              active={filter === 'month'} 
              onClick={() => setFilter('month')} 
              icon={<CalendarDays className="w-4 h-4 hidden sm:block" />}
              label={t('thisMonth') || 'This Month'} 
            />
            <FilterButton 
              active={filter === 'year'} 
              onClick={() => setFilter('year')} 
              icon={<Calendar className="w-4 h-4 hidden sm:block" />}
              label={t('thisYear') || 'This Year'} 
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading && !data ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-20"
            >
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {data && (
                <>
                  {/* Top Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard 
                      title={t('totalReported') || 'Total Reported'} 
                      value={data.totalReported} 
                      subtitle={
                        filter === 'day' 
                          ? t('issuesReportedToday') || 'Issues reported today'
                          : filter === 'month' 
                            ? t('issuesReportedThisMonth') || 'Issues reported this month' 
                            : t('issuesReportedThisYear') || 'Issues reported this year'
                      }
                      icon={<AlertCircle className="w-8 h-8 text-indigo-500" />}
                      gradient="from-indigo-500/20 to-violet-500/5"
                      borderColor="border-indigo-500/20"
                    />
                    <StatCard 
                      title={t('totalResolved') || 'Total Resolved'} 
                      value={data.totalResolved} 
                      subtitle={
                        filter === 'day' 
                          ? t('issuesFixedToday') || 'Issues fixed today'
                          : filter === 'month' 
                            ? t('issuesFixedThisMonth') || 'Issues fixed this month' 
                            : t('issuesFixedThisYear') || 'Issues fixed this year'
                      }
                      icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
                      gradient="from-emerald-500/20 to-teal-500/5"
                      borderColor="border-emerald-500/20"
                    />
                  </div>

                  {/* Chart Section */}
                  <div className="bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 md:p-10 shadow-lg">
                    <div className="text-center mb-6 flex flex-col items-center">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {selectedMainCategory === "All" ? "Issue Breakdown by Category" : "Issue Breakdown by Subcategory"}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {selectedMainCategory === "All" ? "Select a specific category to see its subcategories." : "Showing specific issue counts for the selected category."}
                      </p>
                      
                      <div className="relative w-full max-w-xs">
                        <select
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                          value={selectedMainCategory}
                          onChange={(e) => setSelectedMainCategory(e.target.value)}
                        >
                          <option value="All">All Categories</option>
                          {Object.keys(ISSUE_CATEGORIES).map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="h-[300px] md:h-[450px] w-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : chartDataToRender.length > 0 ? (
                      <div className="min-h-[450px] sm:min-h-[500px] w-full flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={500}>
                          <PieChart>
                            <Pie
                              data={chartDataToRender}
                              cx="50%"
                              cy="45%"
                              innerRadius="50%"
                              outerRadius="75%"
                              paddingAngle={4}
                              dataKey="value"
                              nameKey="name"
                              stroke="none"
                              animationBegin={0}
                              animationDuration={1500}
                              animationEasing="ease-out"
                              cornerRadius={6}
                            >
                              {chartDataToRender.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value} complaints`, 'Count']}
                              labelFormatter={(label) => `Category: ${label}`}
                              contentStyle={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                borderRadius: '12px', 
                                border: '1px solid rgba(99, 102, 241, 0.3)', 
                                color: '#f8fafc', 
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                padding: '12px 16px'
                              }}
                              itemStyle={{ color: '#e2e8f0', fontWeight: 'bold', paddingTop: '4px' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              iconType="circle" 
                              wrapperStyle={{ paddingTop: '20px', paddingBottom: '20px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[300px] md:h-[450px] w-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <PieChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No reports filed for this category yet</p>
                        <p className="text-sm opacity-70 mt-2">Try selecting a different category from the dropdown.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        active 
          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 md:scale-105' 
          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, subtitle, icon, gradient, borderColor }: { title: string, value: number, subtitle: string, icon: React.ReactNode, gradient: string, borderColor: string }) {
  return (
    <div className={`w-full bg-gradient-to-br ${gradient} border ${borderColor} rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-500/10`}>
      <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-32 h-32' })}
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-8">
          <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl shadow-sm backdrop-blur-md">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-slate-600 dark:text-slate-300 font-semibold text-base mb-2 break-words whitespace-normal leading-[27px]">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {value}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-3 font-medium">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

