"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { adminApi, DashboardStats, AdminUser, JobFetchLog, MatchingLog, EmailDeliveryLog, TaskQueueItem } from "@/lib/api/admin";
import {
  Loader2,
  Users,
  TrendingUp,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Mail,
  Activity,
  ListChecks,
  BarChart3,
} from "lucide-react";

type TabType = "overview" | "users" | "job-fetch" | "matching" | "email" | "tasks";

export default function AdminPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setError("Access denied. Admin role required.");
      setLoading(false);
    }
  }, [user]);

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{error}</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "job-fetch", label: "Job Fetch", icon: Database },
    { id: "matching", label: "Matching", icon: Activity },
    { id: "email", label: "Email", icon: Mail },
    { id: "tasks", label: "Tasks", icon: ListChecks },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Admin Dashboard
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Monitor system health, manage users, and view logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab token={token!} />}
      {activeTab === "users" && <UsersTab token={token!} />}
      {activeTab === "job-fetch" && <JobFetchTab token={token!} />}
      {activeTab === "matching" && <MatchingTab token={token!} />}
      {activeTab === "email" && <EmailTab token={token!} />}
      {activeTab === "tasks" && <TasksTab token={token!} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getStats(token);
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.users.total || 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats?.users.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.subscriptions.active || 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats?.subscriptions.past_due || 0} past due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.jobs.total || 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Job fetch: {stats?.jobFetch.successRate || 0}% success
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.tasks.failedLast24h || 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Breakdown of subscription statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {[
              { label: "Active", value: stats?.subscriptions.active || 0, color: "bg-green-500" },
              { label: "Past Due", value: stats?.subscriptions.past_due || 0, color: "bg-yellow-500" },
              { label: "Trialing", value: stats?.subscriptions.trialing || 0, color: "bg-blue-500" },
              { label: "Cancelled", value: stats?.subscriptions.cancelled || 0, color: "bg-zinc-500" },
              { label: "Expired", value: stats?.subscriptions.expired || 0, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center p-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50">
                <div className={`h-2 w-12 rounded-full ${item.color} mb-2`} />
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{item.value}</span>
                <span className="text-xs text-zinc-500">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Key platform metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Match Batches</span>
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {stats?.matching.totalBatches || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Job Fetch Success Rate</span>
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {stats?.jobFetch.successRate || 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Users Tab Component
function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listUsers({ page, limit, search: search || undefined }, token);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {search && (
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">No users found</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr className="text-left">
                    <th className="p-3 text-xs font-medium text-zinc-500">Email</th>
                    <th className="p-3 text-xs font-medium text-zinc-500">Role</th>
                    <th className="p-3 text-xs font-medium text-zinc-500">Status</th>
                    <th className="p-3 text-xs font-medium text-zinc-500">Subscription</th>
                    <th className="p-3 text-xs font-medium text-zinc-500">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                      <td className="p-3 text-sm text-zinc-900 dark:text-zinc-100">{user.email}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : ""}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.emailVerificationStatus}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {user.subscription ? (
                          <div className="text-xs">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.subscription.planName}</span>
                            <span className="text-zinc-500 block">{user.subscription.status}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">None</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">
                  Page {page} of {totalPages} ({total} total users)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Job Fetch Logs Tab
function JobFetchTab({ token }: { token: string }) {
  const [logs, setLogs] = useState<JobFetchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [page, statusFilter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const query: any = { page, limit };
      if (statusFilter) query.status = statusFilter;
      const res = await adminApi.listJobFetchLogs(query, token);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 items-center">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
        <Button size="sm" variant="outline" onClick={loadLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">No logs found</div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadge(log.status)}>{log.status}</Badge>
                    <span className="text-xs text-zinc-500">{log.source}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(log.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Fetched:</span>
                    <span className="ml-1 font-medium text-zinc-900 dark:text-zinc-100">{log.jobsFetched}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">New:</span>
                    <span className="ml-1 font-medium text-green-600 dark:text-green-400">{log.newJobs}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Duplicates:</span>
                    <span className="ml-1 font-medium text-zinc-600 dark:text-zinc-400">{log.duplicates}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Duration:</span>
                    <span className="ml-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "N/A"}
                    </span>
                  </div>
                </div>
                {log.errors && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded p-2">
                    {log.errors}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-zinc-500">
                Page {page} of {totalPages} ({total} total logs)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Matching Logs Tab (Similar pattern - simplified for brevity)
function MatchingTab({ token }: { token: string }) {
  const [logs, setLogs] = useState<MatchingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listMatchingLogs({ page, limit }, token);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">No logs found</div>
      ) : (
        <>
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    className={
                      log.level === "error"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : log.level === "warn"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }
                  >
                    {log.level}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{log.message}</p>
                {log.metadata && (
                  <pre className="mt-2 text-xs bg-zinc-50 dark:bg-zinc-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Email Logs Tab (Similar pattern)
function EmailTab({ token }: { token: string }) {
  const [logs, setLogs] = useState<EmailDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listEmailLogs({ page, limit }, token);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">No logs found</div>
      ) : (
        <>
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge
                      className={
                        log.status === "sent"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {log.status}
                    </Badge>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-2">
                      {log.subject}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">To: {log.emailTo}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(log.sentAt).toLocaleString()}
                  </span>
                </div>
                {log.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded p-2">
                    {log.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tasks Tab (Task Queue)
function TasksTab({ token }: { token: string }) {
  const [tasks, setTasks] = useState<TaskQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 20;

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const query: any = { page, limit };
      if (statusFilter) query.status = statusFilter;
      const res = await adminApi.listTasks(query, token);
      setTasks(res.data.tasks);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <Button size="sm" variant="outline" onClick={loadTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">No tasks found</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        task.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : task.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }
                    >
                      {task.status}
                    </Badge>
                    <Badge variant="outline">{task.type}</Badge>
                    <span className="text-xs text-zinc-500">
                      Attempt {task.attempts}/{task.maxAttempts}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(task.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="text-xs bg-zinc-50 dark:bg-zinc-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(task.payload, null, 2)}
                </pre>
                {task.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded p-2">
                    {task.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
