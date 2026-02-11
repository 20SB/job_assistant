'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { csvApi, CsvExport } from "@/lib/api/csv";
import { matchingApi, MatchBatch } from "@/lib/api/matching";
import {
  Loader2,
  FileSpreadsheet,
  Download,
  Archive,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
} from "lucide-react";

export function ExportsPage() {
  const { token } = useAuth();
  const [exports, setExports] = useState<CsvExport[]>([]);
  const [batches, setBatches] = useState<MatchBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, page]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [exportsRes, batchesRes] = await Promise.all([
        csvApi.listExports(page, limit, token!),
        matchingApi.getBatches(token!),
      ]);
      setExports(exportsRes.data.exports);
      setTotal(exportsRes.data.total);
      setBatches(batchesRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load exports");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (batchId: string) => {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await csvApi.generate({ batchId, sendEmail: false }, token!);
      setSuccess(result.data.message);
      setTimeout(() => {
        loadData();
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to generate CSV");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (exportId: string, fileName: string) => {
    setDownloading(exportId);
    setError(null);
    try {
      const blob = await csvApi.download(exportId, token!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to download CSV");
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = async (exportId: string) => {
    setArchiving(exportId);
    setError(null);
    try {
      await csvApi.archive(exportId, token!);
      setSuccess("Export archived successfully");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to archive export");
    } finally {
      setArchiving(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          CSV Exports
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Download your job match results as CSV files.
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

      {/* Generate New CSV */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New CSV</CardTitle>
          <CardDescription>
            Select a match batch to export as CSV. The file will include job details and match
            scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No match batches available. Run matching first to generate CSV exports.
            </p>
          ) : (
            <div className="grid gap-3">
              {batches.slice(0, 5).map((batch) => (
                <div
                  key={batch.batchId}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Batch #{batch.batchId.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {batch.matchesCount} matches
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(batch.createdAt).toLocaleDateString()} at{" "}
                      {new Date(batch.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(batch.batchId)}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exports List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Exports</CardTitle>
          <CardDescription>Download or archive your previously generated CSV files.</CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileSpreadsheet className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">No exports yet.</p>
              <p className="text-xs text-zinc-400 mt-1">Generate your first CSV above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {exp.fileName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{exp.totalRows} rows</span>
                      <span>•</span>
                      <span>
                        {exp.fileSize ? `${(exp.fileSize / 1024).toFixed(1)} KB` : "N/A"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(exp.createdAt).toLocaleDateString()} at{" "}
                        {new Date(exp.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(exp.id, exp.fileName)}
                      disabled={downloading === exp.id}
                    >
                      {downloading === exp.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(exp.id)}
                      disabled={archiving === exp.id}
                    >
                      {archiving === exp.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">
                    Page {page} of {totalPages} ({total} total exports)
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
