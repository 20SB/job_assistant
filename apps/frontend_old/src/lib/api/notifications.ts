import { fetchApi } from "./client";

export type NotificationFrequency = "hourly" | "daily" | "weekly";

export type NotificationType =
  | "match_batch"
  | "subscription_renewal"
  | "payment_failure"
  | "welcome"
  | "password_reset";

export interface NotificationPreferences {
  id: string;
  userId: string;
  matchEmailFrequency: NotificationFrequency;
  subscriptionEmails: boolean;
  paymentEmails: boolean;
  marketingEmails: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  subject: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  emailTo: string;
  emailStatus: string;
  emailSentAt: string | null;
  emailError: string | null;
  batchId: string | null;
  csvExportId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePreferencesRequest {
  matchEmailFrequency?: NotificationFrequency;
  subscriptionEmails?: boolean;
  paymentEmails?: boolean;
  marketingEmails?: boolean;
}

export interface UpdatePreferencesRequest {
  matchEmailFrequency?: NotificationFrequency;
  subscriptionEmails?: boolean;
  paymentEmails?: boolean;
  marketingEmails?: boolean;
}

export const notificationsApi = {
  // Preferences
  createPreferences: (data: CreatePreferencesRequest, token: string) =>
    fetchApi<{ status: string; data: NotificationPreferences }>(
      "/api/notifications/preferences",
      {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }
    ),

  getPreferences: (token: string) =>
    fetchApi<{ status: string; data: NotificationPreferences }>(
      "/api/notifications/preferences",
      {
        method: "GET",
        token,
      }
    ),

  updatePreferences: (data: UpdatePreferencesRequest, token: string) =>
    fetchApi<{ status: string; data: NotificationPreferences }>(
      "/api/notifications/preferences",
      {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }
    ),

  deletePreferences: (token: string) =>
    fetchApi<{ status: string; data: { message: string } }>(
      "/api/notifications/preferences",
      {
        method: "DELETE",
        token,
      }
    ),

  // Notifications
  listNotifications: (
    page = 1,
    limit = 20,
    type: NotificationType | undefined,
    token: string
  ) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (type) params.set("type", type);

    return fetchApi<{ status: string; data: ListNotificationsResponse }>(
      `/api/notifications?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  getNotification: (id: string, token: string) =>
    fetchApi<{ status: string; data: Notification }>(
      `/api/notifications/${id}`,
      {
        method: "GET",
        token,
      }
    ),
};
