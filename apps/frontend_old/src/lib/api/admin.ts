import { fetchApi } from "./client";

// Stats
export interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  subscriptions: {
    active: number;
    past_due: number;
    cancelled: number;
    expired: number;
    trialing: number;
  };
  jobs: {
    total: number;
  };
  tasks: {
    failedLast24h: number;
  };
  jobFetch: {
    successRate: number;
  };
  matching: {
    totalBatches: number;
  };
}

// Users
export interface AdminUser {
  id: string;
  email: string;
  role: "user" | "admin";
  emailVerificationStatus: "pending" | "verified";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface UserDetailsResponse {
  user: AdminUser;
  cv?: any;
  preferences?: any;
  notificationPreferences?: any;
}

// Logs
export interface JobFetchLog {
  id: string;
  taskId: string;
  source: string;
  status: string;
  jobsFetched: number;
  newJobs: number;
  duplicates: number;
  errors: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface MatchingLog {
  id: string;
  userId: string;
  batchId: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface EmailDeliveryLog {
  id: string;
  userId: string;
  emailTo: string;
  subject: string;
  status: string;
  error: string | null;
  sentAt: string;
  createdAt: string;
}

export interface TaskQueueItem {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  claimedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
}

export interface LogsListResponse<T> {
  logs: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TasksListResponse {
  tasks: TaskQueueItem[];
  total: number;
  page: number;
  limit: number;
}

// Query params
export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: "user" | "admin";
  emailVerified?: "pending" | "verified";
  isActive?: boolean;
}

export interface LogsQuery {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export const adminApi = {
  // Dashboard stats
  getStats: (token: string) =>
    fetchApi<{ status: string; data: DashboardStats }>("/api/admin/stats", {
      method: "GET",
      token,
    }),

  // Users
  listUsers: (query: UsersQuery, token: string) => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.search) params.set("search", query.search);
    if (query.role) params.set("role", query.role);
    if (query.emailVerified) params.set("emailVerified", query.emailVerified);
    if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

    return fetchApi<{ status: string; data: UsersListResponse }>(
      `/api/admin/users?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  getUserDetails: (userId: string, token: string) =>
    fetchApi<{ status: string; data: UserDetailsResponse }>(
      `/api/admin/users/${userId}`,
      {
        method: "GET",
        token,
      }
    ),

  // Job fetch logs
  listJobFetchLogs: (query: LogsQuery, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });

    return fetchApi<{ status: string; data: LogsListResponse<JobFetchLog> }>(
      `/api/admin/job-fetch-logs?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Matching logs
  listMatchingLogs: (query: LogsQuery, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });

    return fetchApi<{ status: string; data: LogsListResponse<MatchingLog> }>(
      `/api/admin/matching-logs?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Email delivery logs
  listEmailLogs: (query: LogsQuery, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });

    return fetchApi<{ status: string; data: LogsListResponse<EmailDeliveryLog> }>(
      `/api/admin/email-delivery-logs?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Task queue
  listTasks: (query: LogsQuery, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });

    return fetchApi<{ status: string; data: TasksListResponse }>(
      `/api/admin/tasks?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },
};
