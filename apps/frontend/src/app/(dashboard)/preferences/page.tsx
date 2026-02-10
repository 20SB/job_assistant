"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { preferencesApi, PreferencesData } from "@/lib/api/preferences";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Save, Pencil, MapPin, Briefcase, DollarSign, Clock, Shield } from "lucide-react";

interface FormData {
    preferredRoles: string;
    locations: string;
    remotePreference: boolean;
    minExperienceYears?: number;
    maxExperienceYears?: number;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    salaryCurrency: string;
    employmentType: "full_time" | "contract" | "part_time" | "freelance" | "internship";
    excludedKeywords?: string;
    blacklistedCompanies?: string;
    minimumMatchPercentage?: number;
}

const employmentTypes = [
    { value: "full_time", label: "Full Time" },
    { value: "contract", label: "Contract" },
    { value: "part_time", label: "Part Time" },
    { value: "freelance", label: "Freelance" },
    { value: "internship", label: "Internship" },
];

export default function PreferencesPage() {
    const { token } = useAuth();
    const [preferences, setPreferences] = useState<PreferencesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const form = useForm<FormData>({
        defaultValues: {
            preferredRoles: "",
            locations: "",
            remotePreference: false,
            salaryCurrency: "INR",
            employmentType: "full_time",
            minimumMatchPercentage: 50,
        },
    });

    useEffect(() => {
        if (!token) return;
        loadPreferences();
    }, [token]);

    const loadPreferences = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await preferencesApi.get(token!);
            setPreferences(res.data);
            populateForm(res.data);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setPreferences(null);
                setEditing(true);
            } else {
                setError("Failed to load preferences");
            }
        } finally {
            setLoading(false);
        }
    };

    const populateForm = (data: PreferencesData) => {
        form.reset({
            preferredRoles: data.preferredRoles?.join(", ") ?? "",
            locations: data.locations?.join(", ") ?? "",
            remotePreference: data.remotePreference ?? false,
            minExperienceYears: data.minExperienceYears ?? undefined,
            maxExperienceYears: data.maxExperienceYears ?? undefined,
            expectedSalaryMin: data.expectedSalaryMin ?? undefined,
            expectedSalaryMax: data.expectedSalaryMax ?? undefined,
            salaryCurrency: data.salaryCurrency ?? "INR",
            employmentType: data.employmentType ?? "full_time",
            excludedKeywords: data.excludedKeywords?.join(", ") ?? "",
            blacklistedCompanies: data.blacklistedCompanies?.join(", ") ?? "",
            minimumMatchPercentage: data.minimumMatchPercentage ?? 50,
        });
    };

    const onSubmit = async (data: FormData) => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const payload: Partial<PreferencesData> = {
            preferredRoles: data.preferredRoles.split(",").map((s) => s.trim()).filter(Boolean),
            locations: data.locations.split(",").map((s) => s.trim()).filter(Boolean),
            remotePreference: data.remotePreference,
            minExperienceYears: data.minExperienceYears,
            maxExperienceYears: data.maxExperienceYears,
            expectedSalaryMin: data.expectedSalaryMin,
            expectedSalaryMax: data.expectedSalaryMax,
            salaryCurrency: data.salaryCurrency,
            employmentType: data.employmentType,
            excludedKeywords: data.excludedKeywords?.split(",").map((s) => s.trim()).filter(Boolean),
            blacklistedCompanies: data.blacklistedCompanies?.split(",").map((s) => s.trim()).filter(Boolean),
            minimumMatchPercentage: data.minimumMatchPercentage,
        };

        try {
            const res = preferences
                ? await preferencesApi.update(payload, token!)
                : await preferencesApi.create(payload, token!);
            setPreferences(res.data);
            setSuccess("Preferences saved successfully!");
            setEditing(false);
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to save preferences");
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
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Job Preferences</h2>
                    <p className="text-sm text-zinc-500 mt-1">Configure what kind of jobs you are looking for.</p>
                </div>
                {preferences && !editing && (
                    <Button size="sm" onClick={() => { populateForm(preferences); setEditing(true); setError(null); setSuccess(null); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                )}
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

            {/* View mode */}
            {preferences && !editing && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Roles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {preferences.preferredRoles.map((role, i) => (
                                    <Badge key={i} variant="secondary">{role}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {preferences.locations.map((loc, i) => (
                                    <Badge key={i} variant="outline">{loc}</Badge>
                                ))}
                                {preferences.remotePreference && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Remote OK</Badge>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Salary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                {preferences.expectedSalaryMin || preferences.expectedSalaryMax
                                    ? `${preferences.salaryCurrency} ${preferences.expectedSalaryMin?.toLocaleString() ?? "—"} – ${preferences.expectedSalaryMax?.toLocaleString() ?? "—"}`
                                    : "Not specified"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                {preferences.minExperienceYears !== undefined || preferences.maxExperienceYears !== undefined
                                    ? `${preferences.minExperienceYears ?? 0} – ${preferences.maxExperienceYears ?? "Any"} years`
                                    : "Not specified"}
                            </p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 capitalize mt-1">
                                {preferences.employmentType.replace("_", " ")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">Min match: {preferences.minimumMatchPercentage ?? 50}%</p>
                            {preferences.excludedKeywords && preferences.excludedKeywords.length > 0 && (
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Excluded keywords:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {preferences.excludedKeywords.map((kw, i) => (
                                            <Badge key={i} variant="destructive" className="text-xs">{kw}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {preferences.blacklistedCompanies && preferences.blacklistedCompanies.length > 0 && (
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Blacklisted companies:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {preferences.blacklistedCompanies.map((c, i) => (
                                            <Badge key={i} variant="destructive" className="text-xs">{c}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit / Create mode */}
            {editing && (
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{preferences ? "Edit Preferences" : "Set Your Preferences"}</CardTitle>
                            <CardDescription>Configure what kind of jobs you want matched.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Roles & Locations */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="preferredRoles">Preferred Roles *</Label>
                                    <Input id="preferredRoles" placeholder="e.g. Frontend Developer, React Engineer" {...form.register("preferredRoles")} />
                                    <p className="text-xs text-zinc-500">Comma-separated</p>
                                    {form.formState.errors.preferredRoles && <p className="text-sm text-red-500">{form.formState.errors.preferredRoles.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="locations">Locations *</Label>
                                    <Input id="locations" placeholder="e.g. Remote, London, New York" {...form.register("locations")} />
                                    <p className="text-xs text-zinc-500">Comma-separated</p>
                                    {form.formState.errors.locations && <p className="text-sm text-red-500">{form.formState.errors.locations.message}</p>}
                                </div>
                            </div>

                            {/* Remote + Employment Type */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Employment Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                                        {...form.register("employmentType")}
                                    >
                                        {employmentTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-7">
                                    <input type="checkbox" id="remotePreference" className="h-4 w-4 rounded border-zinc-300" {...form.register("remotePreference")} />
                                    <Label htmlFor="remotePreference" className="cursor-pointer">Open to remote work</Label>
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="minExperienceYears">Min Experience (years)</Label>
                                    <Input id="minExperienceYears" type="number" placeholder="0" {...form.register("minExperienceYears")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxExperienceYears">Max Experience (years)</Label>
                                    <Input id="maxExperienceYears" type="number" placeholder="10" {...form.register("maxExperienceYears")} />
                                </div>
                            </div>

                            {/* Salary */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="expectedSalaryMin">Min Salary</Label>
                                    <Input id="expectedSalaryMin" type="number" placeholder="50000" {...form.register("expectedSalaryMin")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expectedSalaryMax">Max Salary</Label>
                                    <Input id="expectedSalaryMax" type="number" placeholder="120000" {...form.register("expectedSalaryMax")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salaryCurrency">Currency</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                                        {...form.register("salaryCurrency")}
                                    >
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Advanced Filters</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="minimumMatchPercentage">Minimum Match %</Label>
                                        <Input id="minimumMatchPercentage" type="number" placeholder="50" min={0} max={100} {...form.register("minimumMatchPercentage")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="excludedKeywords">Excluded Keywords</Label>
                                        <Input id="excludedKeywords" placeholder="e.g. sales, marketing" {...form.register("excludedKeywords")} />
                                        <p className="text-xs text-zinc-500">Comma-separated</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="blacklistedCompanies">Blacklisted Companies</Label>
                                    <Input id="blacklistedCompanies" placeholder="e.g. CompanyA, CompanyB" {...form.register("blacklistedCompanies")} />
                                    <p className="text-xs text-zinc-500">Comma-separated</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            {preferences && (
                                <Button type="button" variant="outline" onClick={() => { setEditing(false); setError(null); setSuccess(null); }}>Cancel</Button>
                            )}
                            <Button type="submit" disabled={saving} className={preferences ? "" : "w-full"}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {saving ? "Saving..." : "Save Preferences"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            )}
        </div>
    );
}
