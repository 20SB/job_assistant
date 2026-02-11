'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cvApi } from '@/lib/api/cv';
import type { CvData, View } from '../../types';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  History,
} from 'lucide-react';

export function CvPage() {
    const { token } = useAuth();
    const [activeCv, setActiveCv] = useState<CvData | null>(null);
    const [versions, setVersions] = useState<CvData[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<CvData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [view, setView] = useState<View>("active");
    const [editText, setEditText] = useState("");

    useEffect(() => {
        if (!token) return;
        loadActiveCv();
    }, [token]);

    const loadActiveCv = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await cvApi.getActive(token!);
            setActiveCv(res.data);
            setEditText(res.data.rawCvText);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setActiveCv(null);
            } else {
                setError("Failed to load CV");
            }
        } finally {
            setLoading(false);
        }
    };

    const loadVersions = async () => {
        setError(null);
        try {
            const res = await cvApi.getVersions(token!);
            setVersions(res.data);
            setView("versions");
        } catch {
            setError("Failed to load CV versions");
        }
    };

    const handleUpdate = async () => {
        if (!editText || editText.length < 50) {
            setError("CV content must be at least 50 characters.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await cvApi.update(editText, token!);
            setActiveCv(res.data);
            setSuccess("CV updated successfully! A new version has been created.");
            setView("active");
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to update CV");
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async () => {
        if (!editText || editText.length < 50) {
            setError("CV content must be at least 50 characters.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await cvApi.create(editText, token!);
            setActiveCv(res.data);
            setSuccess("CV created successfully!");
            setView("active");
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to create CV");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My CV</h2>
                    <p className="text-sm text-zinc-500 mt-1">Manage your CV to improve job matching accuracy.</p>
                </div>
                <div className="flex gap-2">
                    {activeCv && view !== "versions" && (
                        <Button variant="outline" size="sm" onClick={loadVersions}>
                            <History className="h-4 w-4 mr-2" />
                            Versions
                        </Button>
                    )}
                    {view === "active" && activeCv && (
                        <Button size="sm" onClick={() => { setEditText(activeCv.rawCvText); setView("edit"); }}>
                            Edit CV
                        </Button>
                    )}
                    {view !== "active" && (
                        <Button variant="outline" size="sm" onClick={() => { setView("active"); setSelectedVersion(null); setError(null); setSuccess(null); }}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

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

            {/* No CV state */}
            {!activeCv && view === "active" && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No CV uploaded yet</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
                            Upload your CV to start getting matched with relevant job opportunities.
                        </p>
                        <Button onClick={() => { setEditText(""); setView("edit"); }}>Upload CV</Button>
                    </CardContent>
                </Card>
            )}

            {/* Active CV view */}
            {activeCv && view === "active" && (
                <div className="space-y-4">
                    {/* CV Meta Info */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Version</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v{activeCv.version ?? 1}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Input Method</p>
                                <p className="text-lg font-bold capitalize text-zinc-900 dark:text-zinc-100">{activeCv.inputMethod}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Experience</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{activeCv.experienceYears ?? "N/A"} yrs</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Last Updated</p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(activeCv.createdAt).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Parsed Skills */}
                    {activeCv.parsedSkills && activeCv.parsedSkills.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Parsed Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {activeCv.parsedSkills.map((skill, i) => (
                                        <Badge key={i} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Parsed Roles */}
                    {activeCv.parsedRoles && activeCv.parsedRoles.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Parsed Roles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {activeCv.parsedRoles.map((role, i) => (
                                        <Badge key={i} variant="outline">{role}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* CV Content */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">CV Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                                <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed">{activeCv.rawCvText}</pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit / Create CV view */}
            {view === "edit" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{activeCv ? "Update CV" : "Upload CV"}</CardTitle>
                        <CardDescription>
                            {activeCv
                                ? "Editing your CV creates a new version. The old version is preserved in history."
                                : "Paste your CV text below. A minimum of 50 characters is required."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cvText">CV Content</Label>
                            <textarea
                                id="cvText"
                                className="flex min-h-[300px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 font-mono"
                                placeholder="Paste your resume / CV text here..."
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500">{editText.length} characters {editText.length < 50 && "(minimum 50 required)"}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => { setView("active"); setError(null); }}>Cancel</Button>
                        <Button onClick={activeCv ? handleUpdate : handleCreate} disabled={saving || editText.length < 50}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {saving ? "Saving..." : activeCv ? "Save New Version" : "Upload CV"}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Versions view */}
            {view === "versions" && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Version History</h3>
                    {versions.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-zinc-500">No versions found.</CardContent>
                        </Card>
                    ) : (
                        versions.map((v) => (
                            <Card
                                key={v.id}
                                className={`cursor-pointer transition-colors hover:border-blue-300 dark:hover:border-blue-700 ${selectedVersion?.id === v.id ? "border-blue-500 dark:border-blue-500" : ""}`}
                                onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                <FileText className="h-5 w-5 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900 dark:text-zinc-100">Version {v.version ?? "—"}</p>
                                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(v.createdAt).toLocaleDateString()} at {new Date(v.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {v.isActive && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>}
                                            <Badge variant="secondary">{v.inputMethod}</Badge>
                                        </div>
                                    </div>
                                    {selectedVersion?.id === v.id && (
                                        <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
                                            <pre className="whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400 font-mono max-h-48 overflow-y-auto">{v.rawCvText}</pre>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
