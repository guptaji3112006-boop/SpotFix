import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { IssueReport, IssueStatus } from './types';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminLoginPage from './components/AdminLoginPage';
import ForgotPassword from './components/ForgotPassword';
import AppLayout from './components/AppLayout';

import IssueReportingForm from './components/IssueReportingForm';
import IssueDashboard from './components/IssueDashboard';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import HistorySection from './components/HistorySection';
import PublicImpactDashboard from './components/PublicImpactDashboard';
import UserProfile from './components/UserProfile';

// Admin Route Protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const role = localStorage.getItem('userRole');
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Protected Route for Users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiLimitExceeded, setApiLimitExceeded] = useState(false);
  const navigate = useNavigate();

  // Read auth user from local storage
  const currentUser = {
    userId: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || '',
    role: localStorage.getItem('userRole') || 'user'
  };

  // Custom interactive toasts
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastDescription, setToastDescription] = useState('');

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      if (location.pathname === '/' || location.pathname === '/register') {
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [navigate, location.pathname]);

  // Fetch initial data
  useEffect(() => {
    // Setup Socket.io
    const socket = io(); // Connects to the same host that serves the page

    const fetchIssues = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/issues');
        const isJson = response.headers.get('content-type')?.includes('application/json');
        if (response.ok && isJson) {
          const data = await response.json();
          // If we successfully fetched from the database, use the data
          setIssues(data);
        }
      } catch (error) {
        console.error('Failed to fetch issues payload', error);
      } finally {
        setIsLoading(false);
      }
    };

    socket.on('new_issue', (issue) => {
      // Refresh issues
      fetchIssues();
      // Show notification
      toast.success(`New issue has been raised: ${issue.title}`, {
        icon: '🚨',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    socket.on('issue_resolved', (issue) => {
      setIssues((prev) => prev.map(i => i.id === issue._id ? { ...i, status: 'Resolved' } : i));
      toast.success(`Issue Resolved: ${issue.title}`, {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
    });

    socket.on('issue_updated', (issue) => {
      setIssues((prev) => prev.map(i => i.id === issue._id ? { ...i, status: issue.status } : i));
    });

    if (!currentUser.userId) {
      return () => {
        socket.disconnect();
      };
    }

    fetchIssues();

    return () => {
      socket.disconnect();
    };
  }, [currentUser.userId, location.pathname]);

  // Handle reporting a new issue
  const handleAddReport = async (newReportData: Omit<IssueReport, 'id' | 'status' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      // Show loading toast
      setToastMessage('Analyzing Issue...');
      setToastDescription('Sending report to Gemini AI for analysis and classification.');
      setShowToast(true);

      const formData = new FormData();
      formData.append('title', newReportData.title);
      formData.append('description', newReportData.description);
      formData.append('category', newReportData.category || 'Other');
      formData.append('mainCategory', newReportData.mainCategory || '');
      formData.append('subCategory', newReportData.subCategory || '');
      formData.append('urgency', newReportData.urgency);
      formData.append('latitude', newReportData.latitude?.toString() || '0');
      formData.append('longitude', newReportData.longitude?.toString() || '0');
      formData.append('locationAddress', newReportData.locationAddress || '');
      formData.append('reporterId', currentUser.userId);
      formData.append('reporterName', newReportData.reporterName || '');
      if (newReportData.apiLimitExceeded) {
        formData.append('apiLimitExceeded', 'true');
      }

      // Convert base64 to Blob and append as file, or just send imageUrl if not base64
      if (newReportData.imageUrl && newReportData.imageUrl.startsWith('data:')) {
        const res = await fetch(newReportData.imageUrl);
        const blob = await res.blob();
        const mimeType = blob.type;
        const extension = mimeType.split('/')[1] || 'bin';
        formData.append('media', blob, `upload.${extension}`);
      } else if (newReportData.imageUrl) {
        formData.append('imageUrl', newReportData.imageUrl);
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      let responseData: any = {};
      
      if (isJson) {
        responseData = await response.json().catch(() => ({}));
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit report. Server may be unavailable.');
      }
      
      const newReport: IssueReport = {
        ...newReportData,
        id: responseData.issue?._id || `CH-${Math.floor(3000 + Math.random() * 9999)}`,
        status: responseData.issue?.status || 'Reported',
        category: responseData.aiAnalysis?.mainCategory || responseData.issue?.mainCategory || newReportData.mainCategory || 'Other',
        mainCategory: responseData.aiAnalysis?.mainCategory || responseData.issue?.mainCategory || newReportData.mainCategory,
        subCategory: responseData.aiAnalysis?.subCategory || responseData.issue?.subCategory || newReportData.subCategory,
        urgency: responseData.aiAnalysis?.severity || responseData.issue?.severity || newReportData.urgency,
        createdAt: responseData.issue?.createdAt || new Date().toISOString(),
        isSimulatedAI: false,
        reportCount: responseData.issue?.reportCount || 1,
        evidenceImages: responseData.issue?.evidenceImages || [newReportData.imageUrl],
        upvotes: responseData.issue?.upvotes || 0,
        upvotedBy: responseData.issue?.upvotedBy || [],
      };

      // Check if it's a duplicate or new issue and update local state accordingly
      const limitExceeded = responseData.aiAnalysis?.apiLimitExceeded === true;
      setApiLimitExceeded(limitExceeded);

      if (responseData.message && responseData.message.includes('Added to existing report')) {
         setIssues(prevIssues => {
            const existingIndex = prevIssues.findIndex(issue => issue.id === newReport.id);
            if (existingIndex >= 0) {
              const newIssuesList = [...prevIssues];
              newIssuesList[existingIndex] = newReport;
              return newIssuesList;
            } else {
              return [newReport, ...prevIssues]; // Fallback
            }
         });
         setToastMessage('Duplicate Detected!');
         setToastDescription('Duplicate Detected - Added to existing report');
      } else if (responseData.message && responseData.message.includes('Previously Resolved')) {
         setIssues(prevIssues => [newReport, ...prevIssues]);
         setToastMessage('Re-occurrence Detected!');
         setToastDescription('Duplicate Detected - Previously Resolved (Pending Admin Verification)');
      } else {
         setIssues(prevIssues => [newReport, ...prevIssues]);
         setToastMessage(`Issue Lodged Successfully!`);
         setToastDescription(`${limitExceeded ? `Reported as "${newReport.mainCategory} - ${newReport.subCategory}" (AI Limit Exceeded). Authorities notified.` : `Gemini AI categorized this as a "${newReport.mainCategory} - ${newReport.subCategory}" (${newReport.urgency} Urgency). Authorities notified.`}`);
      }

      // Keep toast for a while
      setTimeout(() => setShowToast(false), 6000);

      // Swap to Dashboard
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Submission failed:", error);
      setToastMessage('Submission Failed');
      setToastDescription(error.message || 'There was a problem submitting your report. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 7000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvoteIssue = async (issueId: string) => {
    try {
      const resp = await fetch(`/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId })
      });
      const isJson = resp.headers.get('content-type')?.includes('application/json');

      if (resp.ok && isJson) {
        const data = await resp.json();
        setIssues(prevIssues => prevIssues.map(i => {
           if (i.id === issueId) {
             return { ...i, upvotes: data.upvotes, upvotedBy: data.upvotedBy };
           }
           return i;
        }));
        setToastMessage(`Issue Upvoted & Verified!`);
        setToastDescription(`You earned +2 points.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        const err = isJson ? await resp.json().catch(()=>({})) : {};
        setToastMessage('Upvote Failed');
        setToastDescription(err.error || 'Server error or cookie authentication blocked.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
       console.error("Upvote request failed", error);
       setToastMessage('Upvote Failed');
       setToastDescription('Network error or server unavailable.');
       setShowToast(true);
       setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Handle status change
  const handleUpdateStatus = async (issueId: string, newStatus: IssueStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );

      // Highlight change
      setToastMessage(`State Status Updated`);
      setToastDescription(`Report #${issueId} is now officially registered as "${newStatus}".`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (error: any) {
      console.error("Status update failed:", error);
      setToastMessage('Update Failed');
      setToastDescription(error.message || 'There was a problem updating the status.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* App Layout Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <IssueDashboard issues={issues} onUpdateStatus={handleUpdateStatus} onUpvoteIssue={handleUpvoteIssue} currentUser={currentUser} apiLimitExceeded={apiLimitExceeded} />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <div className="max-w-3xl mx-auto">
                <IssueReportingForm onSubmitReport={handleAddReport} />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <div className="max-w-3xl mx-auto">
                <Leaderboard currentUser={currentUser} />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <div className="max-w-4xl mx-auto">
                <HistorySection issues={issues} currentUser={currentUser} />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard currentUser={currentUser} />
            </AdminRoute>
          } />
          <Route path="/public-impact" element={<PublicImpactDashboard />} />
        </Route>
      </Routes>

      {/* Global Real-time Dynamic Notification Toast */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
          >
            <div className="flex flex-col items-center bg-slate-900/80 p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-white font-medium tracking-wide animate-pulse">Processing...</p>
            </div>
          </motion.div>
        )}

        {showToast && (
          <motion.div
            key="toast-notification"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl backdrop-blur-md flex gap-3 text-left"
          >
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl h-fit">
              <CheckCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white font-mono">{toastMessage}</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toastDescription}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="bottom-right" />
    </>
  );
}
