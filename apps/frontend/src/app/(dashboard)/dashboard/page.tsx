"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // Assuming AuthContext provides user
import { subscriptionsApi, Subscription } from "@/lib/api/subscriptions";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      subscriptionsApi
        .getMySubscription(token)
        .then((res) => setSubscription(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const jobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "TechCorp",
      location: "Remote",
      match: 95,
      salary: "$120k - $150k",
      posted: "2 days ago",
    },
    {
      id: 2,
      title: "Frontend Engineer",
      company: "StartupInc",
      location: "London, UK",
      match: 88,
      salary: "£60k - £80k",
      posted: "1 day ago",
    },
    {
      id: 3,
      title: "Full Stack Developer",
      company: "InnovateLtd",
      location: "New York, USA",
      match: 82,
      salary: "$110k - $140k",
      posted: "3 days ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button>Refresh Matches</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">+2 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">+1 since yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {loading ? "..." : subscription?.plan?.name || "Free"}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {subscription?.status === "active" ? "Active" : "Free Plan"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Matches</CardTitle>
            <CardDescription>Based on your profile and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-none">{job.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {job.company} • {job.location}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-zinc-500">
                      <span>{job.salary}</span>
                      <span>•</span>
                      <span>{job.posted}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center space-x-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span>{job.match}% Match</span>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
