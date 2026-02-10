"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { subscriptionsApi, Subscription } from "@/lib/api/subscriptions";
import { matchingApi, MatchResult } from "@/lib/api/matching";
import { cvApi } from "@/lib/api/cv";
import { preferencesApi } from "@/lib/api/preferences";
import {
  Loader2,
  Briefcase,
  Star,
  CreditCard,
  FileText,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  MapPin,
  Building2,
  CheckCircle,
  Settings,
} from "lucide-react";

interface DashboardData {
  subscription: Subscription | null;
  recentMatches: MatchResult[];
  totalMatches: number;
  shortlistedCount: number;
  hasCv: boolean;
  hasPreferences: boolean;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData>({
    subscription: null,
    recentMatches: [],
    totalMatches: 0,
    shortlistedCount: 0,
    hasCv: false,
    hasPreferences: false,
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    const results: DashboardData = {
      subscription: null,
      recentMatches: [],
      totalMatches: 0,
      shortlistedCount: 0,
      hasCv: false,
      hasPreferences: false,
    };

    try {
      const [subRes, matchRes, shortlistRes, cvRes, prefRes] = await Promise.allSettled([
        subscriptionsApi.getMySubscription(token!),
        matchingApi.getResults({ page: 1, limit: 5 }, token!),
        matchingApi.getResults({ page: 1, limit: 1, shortlistedOnly: "true" }, token!),
        cvApi.getActive(token!),
        preferencesApi.get(token!),
      ]);

      if (subRes.status === "fulfilled") results.subscription = subRes.value.data;
      if (matchRes.status === "fulfilled") {
        results.recentMatches = matchRes.value.data.matches;
        results.totalMatches = matchRes.value.data.total;
      }
      if (shortlistRes.status === "fulfilled")
        results.shortlistedCount = shortlistRes.value.data.total;
      if (cvRes.status === "fulfilled") results.hasCv = true;
      if (prefRes.status === "fulfilled") results.hasPreferences = true;

      setData(results);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    setRunning(true);
    setError(null);
    try {
      await matchingApi.run(token!);
      await loadDashboard();
    } catch {
      setError("Failed to run matching. Make sure you have a CV and preferences set up.");
    } finally {
      setRunning(false);
    }
  };

  const getMatchColor = (pct: number) => {
    if (pct >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (pct >= 60) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (pct >= 40)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const setupComplete = data.hasCv && data.hasPreferences && data.subscription;
  const setupSteps = [
    { done: data.hasCv, label: "Upload CV", href: "/cv", icon: FileText },
    { done: data.hasPreferences, label: "Set Preferences", href: "/preferences", icon: Settings },
    { done: !!data.subscription, label: "Choose Plan", href: "/subscription", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">Here is your job search overview.</p>
        </div>
        {setupComplete && (
          <Button size="sm" onClick={handleRunMatching} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {running ? "Running..." : "Refresh Matches"}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Setup Progress */}
      {!setupComplete && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Complete Your Setup</CardTitle>
            <CardDescription>Finish these steps to start receiving job matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {setupSteps.map((step, i) => (
                <Link
                  key={i}
                  href={step.href}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    step.done
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-300 text-xs font-bold text-zinc-400 dark:border-zinc-600">
                      {i + 1}
                    </div>
                  )}
                  <span
                    className={`text-sm font-medium ${step.done ? "text-green-700 dark:text-green-400 line-through" : "text-zinc-900 dark:text-zinc-100"}`}
                  >
                    {step.label}
                  </span>
                  {!step.done && <ArrowRight className="h-4 w-4 ml-auto text-zinc-400" />}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Briefcase className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data.totalMatches}
            </div>
            <Link href="/jobs" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              View all matches
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data.shortlistedCount}
            </div>
            <Link href="/jobs" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              View shortlisted
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CV Status</CardTitle>
            <FileText className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data.hasCv ? "Active" : "None"}
            </div>
            <Link href="/cv" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              {data.hasCv ? "Manage CV" : "Upload CV"}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-zinc-900 dark:text-zinc-100">
              {data.subscription?.plan?.name ?? "Free"}
            </div>
            <Link
              href="/subscription"
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {data.subscription ? "Manage plan" : "Subscribe"}
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Matches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Job Matches</CardTitle>
            <CardDescription>Your latest matched opportunities.</CardDescription>
          </div>
          {data.recentMatches?.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data.recentMatches?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Briefcase className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500 mb-3">No job matches yet.</p>
              {setupComplete && (
                <Button size="sm" onClick={handleRunMatching} disabled={running}>
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Run Matching
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentMatches?.map((match) => (
                <Link
                  key={match.matchId}
                  href="/jobs"
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-semibold leading-none text-zinc-900 dark:text-zinc-100 truncate">
                      {match.job?.title ?? "Untitled"}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {match.job?.company && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          {match.job.company}
                        </span>
                      )}
                      {match.job?.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {match.job.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {match.isShortlisted && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <Badge className={getMatchColor(match.matchPercentage)}>
                      {match.matchPercentage}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
