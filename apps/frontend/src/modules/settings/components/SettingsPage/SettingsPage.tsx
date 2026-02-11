'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { Loader2, Mail, Lock, AlertTriangle, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";

export function SettingsPage() {
  const { user, token } = useAuth();
  const [emailForm, setEmailForm] = useState({ email: user?.email || "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email || emailForm.email === user?.email) {
      toast.error("Please enter a different email address");
      return;
    }

    setSavingEmail(true);
    try {
      await authApi.updateProfile({ email: emailForm.email }, token!);
      toast.success("Email updated successfully! Please verify your new email address.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.password || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updateProfile({ password: passwordForm.password }, token!);
      toast.success("Password updated successfully!");
      setPasswordForm({ password: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account Settings
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your account preferences and security settings.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-zinc-500">Email</Label>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</p>
          </div>
          <div>
            <Label className="text-xs text-zinc-500">Role</Label>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
              {user?.role}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Update Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Email Address
          </CardTitle>
          <CardDescription>Change your account email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-600 dark:text-blue-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>You will need to verify your new email address.</span>
            </div>
            <Button type="submit" disabled={savingEmail || emailForm.email === user?.email}>
              {savingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Update Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-zinc-500">Must be at least 8 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Once you delete your account, there is no going back. All your data including CVs,
              preferences, and match history will be permanently deleted.
            </p>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete Account (Coming Soon)
            </Button>
            <p className="text-xs text-zinc-500">
              Account deletion feature will be available soon. Contact support if you need immediate
              assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
