"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  notificationsApi,
  NotificationPreferences,
  Notification,
  NotificationFrequency,
  NotificationType,
} from "@/lib/api/notifications";
import {
  Loader2,
  Bell,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  Settings,
  Save,
  Trash2,
} from "lucide-react";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>(undefined);
  const limit = 10;

  // Form state
  const [frequency, setFrequency] = useState<NotificationFrequency>("daily");
  const [subscriptionEmails, setSubscriptionEmails] = useState(true);
  const [paymentEmails, setPaymentEmails] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, page, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prefsRes, notifsRes] = await Promise.allSettled([
        notificationsApi.getPreferences(token!),
        notificationsApi.listNotifications(page, limit, typeFilter, token!),
      ]);

      if (prefsRes.status === "fulfilled") {
        const prefs = prefsRes.value.data;
        setPreferences(prefs);
        setFrequency(prefs.matchEmailFrequency);
        setSubscriptionEmails(prefs.subscriptionEmails);
        setPaymentEmails(prefs.paymentEmails);
        setMarketingEmails(prefs.marketingEmails);
      } else {
        // Preferences don't exist yet - use defaults
        setPreferences(null);
      }

      if (notifsRes.status === "fulfilled") {
        setNotifications(notifsRes.value.data.notifications);
        setTotal(notifsRes.value.data.total);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = {
        matchEmailFrequency: frequency,
        subscriptionEmails,
        paymentEmails,
        marketingEmails,
      };

      if (preferences) {
        await notificationsApi.updatePreferences(data, token!);
        setSuccess("Preferences updated successfully");
      } else {
        await notificationsApi.createPreferences(data, token!);
        setSuccess("Preferences created successfully");
      }
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreferences = async () => {
    if (!confirm("Are you sure you want to delete your notification preferences?")) return;

    setDeleting(true);
    setError(null);
    try {
      await notificationsApi.deletePreferences(token!);
      setSuccess("Preferences deleted successfully");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete preferences");
    } finally {
      setDeleting(false);
    }
  };

  const getNotificationTypeLabel = (type: NotificationType): string => {
    const labels: Record<NotificationType, string> = {
      match_batch: "Match Batch",
      subscription_renewal: "Subscription",
      payment_failure: "Payment",
      welcome: "Welcome",
      password_reset: "Password Reset",
    };
    return labels[type];
  };

  const getNotificationTypeBadge = (type: NotificationType) => {
    const colors: Record<
      NotificationType,
      string
    > = {
      match_batch: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      subscription_renewal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      payment_failure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      welcome: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      password_reset: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return colors[type];
  };

  const getEmailStatusBadge = (status: string) => {
    if (status === "sent")
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (status === "failed")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Notifications
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your notification preferences and view notification history.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive email notifications.
              </CardDescription>
            </div>
            {preferences && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeletePreferences}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match Email Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Job Match Email Frequency
            </Label>
            <p className="text-xs text-zinc-500">How often should we email you about new matches?</p>
            <div className="flex gap-3">
              {(["hourly", "daily", "weekly"] as NotificationFrequency[]).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    frequency === freq
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email Toggles */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Email Notifications
            </Label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/50">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Subscription Updates
                </p>
                <p className="text-xs text-zinc-500">
                  Emails about subscription renewals and changes
                </p>
              </div>
              <input
                type="checkbox"
                checked={subscriptionEmails}
                onChange={(e) => setSubscriptionEmails(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/50">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Payment Notifications
                </p>
                <p className="text-xs text-zinc-500">Emails about payments and billing issues</p>
              </div>
              <input
                type="checkbox"
                checked={paymentEmails}
                onChange={(e) => setPaymentEmails(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/50">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Marketing Emails
                </p>
                <p className="text-xs text-zinc-500">Tips, updates, and promotional content</p>
              </div>
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>View all notifications sent to your email.</CardDescription>
            </div>
            <select
              value={typeFilter || ""}
              onChange={(e) => {
                setTypeFilter(e.target.value ? (e.target.value as NotificationType) : undefined);
                setPage(1);
              }}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All Types</option>
              <option value="match_batch">Match Batch</option>
              <option value="subscription_renewal">Subscription</option>
              <option value="payment_failure">Payment</option>
              <option value="welcome">Welcome</option>
              <option value="password_reset">Password Reset</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">No notifications yet.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Notifications will appear here once sent.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getNotificationTypeBadge(notif.type)}>
                        {getNotificationTypeLabel(notif.type)}
                      </Badge>
                      <Badge className={getEmailStatusBadge(notif.emailStatus)}>
                        {notif.emailStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                      <Calendar className="h-3 w-3" />
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    {notif.subject}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Mail className="h-3 w-3" />
                    {notif.emailTo}
                    {notif.emailSentAt && (
                      <>
                        <span className="mx-1">•</span>
                        <span>Sent {new Date(notif.emailSentAt).toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  {notif.emailError && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded p-2">
                      Error: {notif.emailError}
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">
                    Page {page} of {totalPages} ({total} total notifications)
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
        </CardContent>
      </Card>
    </div>
  );
}
