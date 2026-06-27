import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  ChevronRight, 
  Wrench,
  Check,
  ShieldCheck,
  Activity,
  ThumbsUp,
  FileImage,
  Info,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, IssueStatus, IssueCategory, UrgencyLevel } from '../types';
import HistorySection from './HistorySection';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in React Leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const isVideoMedia = (url: string) => {
  if (!url) return false;
  if (url.startsWith('data:video')) return true;
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

interface IssueDashboardProps {
  issues: IssueReport[];
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => void;
  onUpvoteIssue?: (issueId: string) => void;
  currentUser?: { userId: string, name: string, role?: string };
  apiLimitExceeded?: boolean;
}

export default function IssueDashboard({ issues, onUpdateStatus, onUpvoteIssue, currentUser, apiLimitExceeded = false }: IssueDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  
  // Selection
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const activeIssues = issues.filter(i => i.status !== 'Resolved');
  const historyIssues = issues.filter(i => i.status === 'Resolved');
  
  const displayIssues = activeTab === 'active' ? activeIssues : historyIssues;

  // Status metrics
  const totalReports = activeIssues.length;
  const reportedCount = activeIssues.filter(i => i.status === 'Reported').length;
  const inProgressCount = activeIssues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = historyIssues.length;

  const highPriorityCount = activeIssues.filter(i => i.urgency?.toLowerCase() === 'high' || i.urgency?.toLowerCase() === 'critical').length;

  const selectedIssue = displayIssues.find(i => i.id === selectedIssueId);

  // Filter logic
  const filteredIssues = displayIssues.filter(issue => {
    const matchesSearch = (issue.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (issue.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (issue.reporterName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter || issue.mainCategory === categoryFilter;
    const matchesUrgency = urgencyFilter === 'all' || issue.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
  });

  // Urgency badge styles
  const getUrgencyStyle = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200 font-bold animate-bounce';
    }
  };

  // Status badge styles
  const getStatusBadgeStyle = (status: IssueStatus) => {
    switch (status) {
      case 'Reported': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Verified': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Status timeline indexing for visual progress lines
  const stages: IssueStatus[] = ['Reported', 'Verified', 'In Progress', 'Resolved'];
  const getStageIndex = (status: IssueStatus): number => {
    return stages.indexOf(status);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('liveStatusDashboard') || 'Live Status Dashboard'}</h2>
        <Link to="/public-impact" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
          <BarChart2 className="w-4 h-4" />
          {t('viewOverviewCharts') || 'View Overview Charts'}
        </Link>
      </div>

      {apiLimitExceeded && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-4 shadow-sm mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-800 dark:text-amber-300 font-bold mb-1">AI Classification Unavailable (API Limit)</h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              The AI service limit has been exceeded. Issues submitted during this time may use default categories.
            </p>
          </div>
        </div>
      )}

      {/* 1. Quick KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total stats */}
        <div className="bg-indigo-600 text-white rounded-3xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-100 uppercase tracking-widest">Active Database</span>
            <Activity className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="mt-2 text-3xl font-bold">{totalReports}</div>
          <p className="text-[10px] text-indigo-200 mt-1">Hyperlocal anomalies logged</p>
        </div>

        {/* Status: Reported */}
        <div className="bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('reportedStatus') || 'Reported'}</span>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{reportedCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">{t('pendingVerification') || 'Pending verification'}</p>
        </div>

        {/* Status: High Priority */}
        <div className={`rounded-3xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 relative overflow-hidden ${
          highPriorityCount > 0 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
            : 'bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${highPriorityCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('highPriority') || 'High Priority'}</span>
            {highPriorityCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className={`mt-2 text-2xl font-bold ${highPriorityCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>{highPriorityCount}</div>
          <p className={`text-[10px] mt-1 ${highPriorityCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>{t('requiresImmediateAction') || 'Requires immediate action'}</p>
        </div>

        {/* Status: In Progress */}
        <div className="bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('inProgressStatus') || 'In Progress'}</span>
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{inProgressCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">{t('dispatchCrewsWorking') || 'Dispatch crews working'}</p>
        </div>

        {/* Status: Resolved */}
        <div className="bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('resolvedStatus') || 'Resolved'}</span>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{resolvedCount}</div>
          <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1">{t('operationsCompleted') || 'Operations completed'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mt-8 mb-6">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${activeTab === 'active' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {t('activeIssues') || 'Active Issues'} ({activeIssues.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {t('history') || 'History'} ({historyIssues.length})
        </button>
      </div>

      {activeTab === 'history' ? (
        <HistorySection issues={issues} currentUser={currentUser || { userId: '', name: '' }} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search and List: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm flex flex-col gap-4 transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            
            {/* Search Bar */}
            <div className="relative mt-2">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchIssues') || "Search issues, categories, reporter name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Quick Filter dropdowns */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-medium py-2.5 px-3 border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              >
                <option value="all">🚦 Status: All</option>
                <option value="Reported">🔵 Reported</option>
                <option value="Verified">🟣 Verified</option>
                <option value="In Progress">🟡 In Progress</option>
                <option value="Resolved">🟢 Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-medium py-2.5 px-3 border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              >
                <option value="all">🏷️ Category: All</option>
                <option value="Pothole">🕳️ Potholes</option>
                <option value="Garbage / Waste">🗑️ Garbage</option>
                <option value="Water Leak">💧 Water Leaks</option>
                <option value="Streetlight">💡 Streetlights</option>
                <option value="Road Hazard">⚠️ Hazards</option>
                <option value="Other">📍 Other</option>
              </select>

              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="text-xs font-medium py-2.5 px-3 border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              >
                <option value="all">⚡ Urgency: All</option>
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          {/* Issue Cards Stack */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            <AnimatePresence>
              {filteredIssues.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500"
                >
                  <Layers className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No matching neighborhood reports</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Adjust your filter values or report a new problem above!</p>
                </motion.div>
              ) : (
                filteredIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    layoutId={`issue-card-${issue.id}`}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`border rounded-2xl p-4 transition-all cursor-pointer text-left relative overflow-hidden group ${
                      selectedIssueId === issue.id 
                        ? 'bg-slate-50 dark:bg-slate-800 border-indigo-500 shadow-sm ring-1 ring-indigo-100' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Left side: Small visual preview */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
                        {issue.imageUrl ? (
                          isVideoMedia(issue.imageUrl) ? (
                            <video 
                              src={issue.imageUrl} 
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img 
                              src={issue.imageUrl} 
                              alt={issue.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )
                        ) : (
                          <FileImage className="w-6 h-6 text-slate-300" />
                        )}
                        {/* Tiny Category Overlay symbol */}
                        {issue.isSimulatedAI && (
                          <div className="absolute bottom-0 right-0 bg-violet-600 text-[8px] font-bold text-white px-1 py-0.2 rounded-tl" title="AI Categorized">
                            AI
                          </div>
                        )}
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                            ID: {issue.id}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getUrgencyStyle(issue.urgency)}`}>
                            {issue.urgency} Urgency
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadgeStyle(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>

                        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {issue.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                          {issue.description}
                        </p>

                        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <div className="flex flex-col">
                              {issue.locationAddress && <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{issue.locationAddress}</span>}
                              <span>{issue.latitude && issue.longitude ? `${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}` : 'Awaiting Coordinates...'}</span>
                            </div>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Right edge: Action click */}
                      <div className="flex flex-col items-end justify-center shrink-0">
                        <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail Panel & Interactive Simulator: 5 Cols */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {!selectedIssue ? (
              <motion.div
                key="empty-detail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-12 text-center h-full flex flex-col justify-center min-h-[350px]"
              >
                <div className="p-4 bg-slate-100 text-slate-400 dark:text-slate-500 rounded-full w-fit mx-auto mb-4">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-700">No report selected</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Click on any resident log card in the dashboard queue to track physical stage reviews, coordinates, and execute the resolution workflow.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`detail-${selectedIssue.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden text-left"
              >
                {/* Header preview image */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-200/60 dark:border-slate-700">
                  {selectedIssue.imageUrl ? (
                    isVideoMedia(selectedIssue.imageUrl) ? (
                      <video 
                        src={selectedIssue.imageUrl} 
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <img 
                        src={selectedIssue.imageUrl} 
                        alt={selectedIssue.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
                      <FileImage className="w-12 h-12 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                  {/* Floating category */}
                  <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                    {selectedIssue.category}
                  </span>

                  {/* Status Indicator inside header */}
                  <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border ${
                    selectedIssue.status === 'Resolved' 
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : selectedIssue.status === 'In Progress'
                      ? 'bg-amber-500 text-amber-900 border-amber-600 animate-pulse'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-slate-700'
                  }`}>
                    {selectedIssue.status}
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Urgency and reporter */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Submitted By</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        {selectedIssue.reporterName || 'Anonymous Citizen'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right">Anomaly Priority</p>
                      <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${getUrgencyStyle(selectedIssue.urgency)}`}>
                        {selectedIssue.urgency} Level
                      </span>
                    </div>
                  </div>

                  {/* Title and description */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                        {selectedIssue.title}
                        {(selectedIssue.upvotes || 0) > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded shadow-sm border border-amber-200 align-middle">
                             +{selectedIssue.upvotes} Upvotes
                          </span>
                        )}
                      </h3>
                      {onUpvoteIssue && currentUser && (
                        <button
                          onClick={() => onUpvoteIssue(selectedIssue.id)}
                          className={`shrink-0 ml-4 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                            (selectedIssue.upvotedBy || []).includes(currentUser.userId)
                              ? 'bg-slate-100 text-slate-400 dark:text-slate-500 border-slate-200 cursor-not-allowed'
                              : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 cursor-pointer'
                          }`}
                          title="Upvote to verify and earn points!"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {(selectedIssue.upvotedBy || []).includes(currentUser.userId) ? 'Verified' : 'Verify Issue'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 break-words whitespace-pre-wrap overflow-hidden">
                      {selectedIssue.description}
                    </p>
                  </div>

                  {/* Physical coordinates badge */}
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-500">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">Issue Location</p>
                          {selectedIssue.locationAddress && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 mb-0.5">{selectedIssue.locationAddress}</p>
                          )}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] md:max-w-xs font-mono">
                            {selectedIssue.latitude && selectedIssue.longitude ? `${selectedIssue.latitude.toFixed(6)}, ${selectedIssue.longitude.toFixed(6)}` : 'Location unknown'}
                          </p>
                        </div>
                      </div>
                      {selectedIssue.latitude && selectedIssue.longitude ? (
                        <span className="font-mono font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                          {selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="font-bold text-[10px] text-red-500">
                          GPS NOT RECORDED
                        </span>
                      )}
                    </div>
                    {/* Mini-map preview */}
                    {selectedIssue.latitude && selectedIssue.longitude && (
                      <div className="mt-1 h-32 w-full rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700 shadow-sm relative z-0">
                        <MapContainer 
                          key={`map-${selectedIssue.id}`}
                          center={[selectedIssue.latitude, selectedIssue.longitude]} 
                          zoom={16} 
                          scrollWheelZoom={false} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          />
                          <Marker position={[selectedIssue.latitude, selectedIssue.longitude]} icon={customIcon} />
                        </MapContainer>
                      </div>
                    )}
                  </div>

                  {/* 3. Visual Tracker Timeline representing Reported -> Verified -> In Progress -> Resolved */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      CIVIC RESOLUTION LIFECYCLE
                    </h4>

                    <div className="relative pt-2 px-1">
                      {/* Connection track line */}
                      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-slate-100"></div>
                      
                      {/* Fill color for passed steps */}
                      <div 
                        className="absolute left-4 top-8 w-0.5 bg-indigo-500 transition-all duration-500" 
                        style={{ height: `${(getStageIndex(selectedIssue.status) / (stages.length - 1)) * 82}%` }}
                      ></div>

                      {/* Lifecycle Node array */}
                      {stages.map((stage, idx) => {
                        const currentStageIdx = getStageIndex(selectedIssue.status);
                        const isCompleted = idx <= currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div key={stage} className="flex gap-4 items-start relative mb-6 last:mb-0">
                            {/* Dot node */}
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10 transition-colors duration-300 ${
                              isCompleted 
                                ? 'bg-indigo-500 border-indigo-600 text-white' 
                                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                            }`}>
                              {isCompleted ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-[10px] font-mono leading-none">{idx + 1}</span>
                              )}
                            </div>

                            {/* Descriptions */}
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                {stage}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                {stage === 'Reported' && 'Resident requested assistance.'}
                                {stage === 'Verified' && 'Dispatcher dispatched civic engineers to investigate.'}
                                {stage === 'In Progress' && 'Repair specialists are actively physical on-site.'}
                                {stage === 'Resolved' && 'Repair approved by field administrator.'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Task 1 ADMIN STATUS LIFE-CYCLE SIMULATOR */}
                  {currentUser?.role === 'admin' && (
                    <div className="border-t border-slate-200/60 dark:border-slate-700 pt-6">
                      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-violet-700 animate-spin" />
                          <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider">
                            Review Administrator Powers (Simulator)
                          </h4>
                        </div>
                        <p className="text-[10px] text-violet-600 leading-relaxed">
                          Authorize phase transitions without writing backend mutations. Changes affect high-fidelity state in real time.
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1.5">
                          {stages.map((stg) => (
                            <button
                              key={stg}
                              onClick={() => onUpdateStatus(selectedIssue.id, stg)}
                              className={`py-2 px-2 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                selectedIssue.status === stg
                                  ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-violet-200 hover:bg-violet-50 text-violet-800'
                              }`}
                            >
                              Set {stg}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  );
}
