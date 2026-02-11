"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { matchingApi, MatchResult } from "@/lib/api/matching";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
  Building2,
  DollarSign,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Filter,
  Eye,
  Briefcase,
  TrendingUp,
  X,
} from "lucide-react";

export default function JobsPage() {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [minPercentage, setMinPercentage] = useState<number>(0);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const loadMatches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await matchingApi.getResults(
        {
          page,
          limit,
          minPercentage: minPercentage > 0 ? minPercentage : undefined,
          shortlistedOnly: shortlistedOnly ? "true" : undefined,
        },
        token,
      );
      setMatches(res.data.matches);
      setTotal(res.data.total);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load job matches");
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, minPercentage, shortlistedOnly]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleRunMatching = async () => {
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await matchingApi.run(token!);
      setSuccess(`Matching complete! Found ${res.data.matchesCount} new matches.`);
      setPage(1);
      await loadMatches();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to run matching");
    } finally {
      setRunning(false);
    }
  };

  const handleToggleShortlist = async (matchId: string) => {
    try {
      const res = await matchingApi.toggleShortlist(matchId, token!);
      setMatches((prev) =>
        prev.map((m) =>
          m.matchId === matchId ? { ...m, isShortlisted: res.data.isShortlisted } : m,
        ),
      );
    } catch {
      setError("Failed to update shortlist");
    }
  };

  const handleMarkViewed = async (matchId: string) => {
    try {
      await matchingApi.markViewed(matchId, token!);
      setMatches((prev) =>
        prev.map((m) => (m.matchId === matchId ? { ...m, viewedAt: new Date().toISOString() } : m)),
      );
    } catch {
      // Silent fail for mark viewed
    }
  };

  const getMatchColor = (pct: number) => {
    if (pct >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (pct >= 60) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (pct >= 40)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency ?? "";
    if (min && max) return `${curr} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min) return `${curr} ${min.toLocaleString()}+`;
    return `Up to ${curr} ${max!.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Job Matches
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">{total} matched jobs found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(minPercentage > 0 || shortlistedOnly) && (
              <span className="ml-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </Button>
          <Button size="sm" onClick={handleRunMatching} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {running ? "Running..." : "Run Matching"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
          <button className="ml-auto" onClick={() => setSuccess(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Min Match %</label>
                <Input
                  type="number"
                  value={minPercentage}
                  onChange={(e) => {
                    setMinPercentage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-24 h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shortlistedOnly"
                  checked={shortlistedOnly}
                  onChange={(e) => {
                    setShortlistedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label
                  htmlFor="shortlistedOnly"
                  className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Shortlisted only
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMinPercentage(0);
                  setShortlistedOnly(false);
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : matches?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No matches yet
            </h3>
            <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
              Run the matching engine to find jobs that match your CV and preferences.
            </p>
            <Button onClick={handleRunMatching} disabled={running}>
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run Matching
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches?.map((match) => {
            const job = match.job;
            const isExpanded = expandedId === match.matchId;
            const salary = job
              ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
              : null;

            return (
              <Card
                key={match.matchId}
                className={`transition-all ${!match.viewedAt ? "border-l-4 border-l-blue-500" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : match.matchId);
                        if (!match.viewedAt) handleMarkViewed(match.matchId);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                            {job?.title ?? "Untitled Job"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {job?.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {job.company}
                              </span>
                            )}
                            {job?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                            )}
                            {salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {salary}
                              </span>
                            )}
                            {job?.isRemote && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Remote
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getMatchColor(match.matchPercentage)}>
                        {match.matchPercentage}%
                      </Badge>
                      <button
                        onClick={() => handleToggleShortlist(match.matchId)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={match.isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                      >
                        {match.isShortlisted ? (
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      {/* Score Breakdown */}
                      {match.scoreBreakdown && (
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Score Breakdown
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {Object.entries(match.scoreBreakdown).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                  {value}
                                </div>
                                <div className="text-[10px] text-zinc-500 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </div>
                                <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                                  <div
                                    className={`h-full rounded-full ${value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {match.matchedSkills && match.matchedSkills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                              Matched Skills
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {match.matchedSkills.map((skill, i) => (
                                <Badge
                                  key={i}
                                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {match.missingSkills && match.missingSkills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                              Missing Skills
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {match.missingSkills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs text-zinc-500">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      {match.recommendationReason && (
                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {match.recommendationReason}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {job?.description && (
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Job Description
                          </h4>
                          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50 max-h-48 overflow-y-auto">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                              {job.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {job?.sourceUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Original
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-zinc-500">
            Page {page} of {totalPages} ({total} results)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
