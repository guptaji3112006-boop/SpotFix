import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart2,
  MapPin,
} from "lucide-react";
import { io } from "socket.io-client";
import { IssueReport, IssueStatus } from "../types";
import CategoryStatsBoard from "./CategoryStatsBoard";
import PredictiveInsights from "./PredictiveInsights";

interface AdminDashboardProps {
  currentUser: { userId: string; name: string };
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const fetchAdminIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/issues", {
        headers: {
          "x-user-id": currentUser.userId,
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");

      if (!response.ok) {
        throw new Error(
          isJson ? (await response.json()).error : "Failed to load data",
        );
      }

      if (isJson) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (err: any) {
      setError(err.message || "Unauthorized or server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminIssues();

    const socket = io();
    socket.on("new_issue", () => {
      fetchAdminIssues();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.userId]);

  const handleStatusChange = async (
    issueId: string,
    newStatus: IssueStatus,
  ) => {
    // Optimistic UI Update
    setIssues((prevIssues) =>
      prevIssues.map((issue: any) =>
        (issue.id || issue._id) === issueId
          ? { ...issue, status: newStatus }
          : issue,
      ),
    );

    try {
      const resp = await fetch(`/api/admin/issues/${issueId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.userId,
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!resp.ok) {
        // Revert on error
        fetchAdminIssues();
      }
    } catch (error) {
      console.error("Failed to update status", error);
      fetchAdminIssues();
    }
  };

  const getSeverityPill = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === "high" || s === "critical") {
      return (
        <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider">
          High
        </span>
      );
    }
    if (s === "medium") {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider">
          Medium
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
        Low
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 animate-pulse">
        Loading secure dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  const unresolvedIssues = issues.filter((i) => i.status !== "Resolved");
  const highPriority = unresolvedIssues.filter(
    (i) =>
      i.severity?.toLowerCase() === "high" ||
      i.urgency?.toLowerCase() === "high" ||
      i.severity?.toLowerCase() === "critical" ||
      i.urgency?.toLowerCase() === "critical",
  );

  const displayIssues =
    activeTab === "active"
      ? unresolvedIssues
      : issues.filter((i) => i.status === "Resolved");

  return (
    <div className="p-2 sm:p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:mb-8 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            Authority Control Panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, prioritize, and manage community reports.
          </p>
        </div>
        <Link
          to="/public-impact"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors self-start sm:self-auto"
        >
          <BarChart2 className="w-4 h-4" />
          View Overview Charts
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Total Active
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {issues.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Unresolved
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {unresolvedIssues.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-l-4 border-slate-200 border-l-red-500 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-1">
              High Priority
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {highPriority.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Resolved
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {issues.length - unresolvedIssues.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <CategoryStatsBoard />
      </div>

      <PredictiveInsights />

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${activeTab === "active" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
          >
            Active Issues ({unresolvedIssues.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${activeTab === "history" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
          >
            History ({issues.length - unresolvedIssues.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Location / Category
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">
                  Upvotes
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Severity
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayIssues.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-6 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500"
                  >
                    No reports found.
                  </td>
                </tr>
              ) : (
                displayIssues.map((issue: any) => (
                  <tr
                    key={issue.id || issue._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <td className="py-4 px-6 align-top">
                      <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                        {issue.title || "Untitled Report"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-xs truncate">
                        {issue.description || "No description provided."}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded w-max mb-1">
                        {issue.mainCategory || issue.category || "Other"}
                        {issue.subCategory ? ` - ${issue.subCategory}` : ""}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <div className="flex flex-col">
                          {issue.locationAddress && (
                            <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px] font-sans">
                              {issue.locationAddress}
                            </span>
                          )}
                          <span>
                            {issue.latitude && issue.longitude
                              ? `${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}`
                              : issue.location?.coordinates
                                ? `${issue.location.coordinates[1].toFixed(6)}, ${issue.location.coordinates[0].toFixed(6)}`
                                : "Awaiting Coordinates..."}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                        {issue.upvotes || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-top">
                      {getSeverityPill(
                        issue.urgency || issue.severity || "Low",
                      )}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          handleStatusChange(
                            issue.id || issue._id,
                            e.target.value as IssueStatus,
                          )
                        }
                        className="block w-full sm:w-40 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700"
                      >
                        <option value="Reported">Reported</option>
                        <option value="Verified">Verified</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
