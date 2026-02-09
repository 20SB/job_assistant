"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle2 } from "lucide-react";

enum Step {
    UPLOAD_CV,
    PREFERENCES,
    SUBSCRIPTION,
}

const cvSchema = z.object({
    cvText: z.string().min(50, "CV content must be at least 50 characters."),
});

const preferencesSchema = z.object({
    roles: z.string().min(2, "Please enter at least one role."),
    locations: z.string().min(2, "Please enter at least one location."),
    experience: z.string().min(1, "Please enter your years of experience."),
    salary: z.string().optional(),
});

const subscriptionSchema = z.object({
    plan: z.enum(["free", "starter", "pro"]),
});

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>(Step.UPLOAD_CV);

    // Forms
    const cvForm = useForm<z.infer<typeof cvSchema>>({ resolver: zodResolver(cvSchema) });
    const prefForm = useForm<z.infer<typeof preferencesSchema>>({ resolver: zodResolver(preferencesSchema) });
    const subForm = useForm<z.infer<typeof subscriptionSchema>>({ resolver: zodResolver(subscriptionSchema), defaultValues: { plan: "free" } });

    const onCVSubmit = (data: z.infer<typeof cvSchema>) => {
        console.log("CV Data:", data);
        setStep(Step.PREFERENCES);
    };

    const onPrefSubmit = (data: z.infer<typeof preferencesSchema>) => {
        console.log("Preferences Data:", data);
        setStep(Step.SUBSCRIPTION);
    };

    const onSubSubmit = (data: z.infer<typeof subscriptionSchema>) => {
        console.log("Subscription Data:", data);
        // TODO: Finalize onboarding and redirect to dashboard
    };

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <div className="mb-8 flex justify-center space-x-4">
                {[Step.UPLOAD_CV, Step.PREFERENCES, Step.SUBSCRIPTION].map((s, i) => (
                    <div key={i} className={`flex items-center space-x-2 ${step >= s ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-600"}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= s ? "border-blue-600 bg-blue-100 dark:border-blue-400 dark:bg-blue-900" : "border-zinc-300 dark:border-zinc-700"}`}>{step > s ? <CheckCircle2 className="h-5 w-5" /> : <span>{i + 1}</span>}</div>
                        <span className="hidden sm:inline font-medium">{s === Step.UPLOAD_CV ? "CV" : s === Step.PREFERENCES ? "Preferences" : "Plan"}</span>
                    </div>
                ))}
            </div>

            <Card>
                {step === Step.UPLOAD_CV && (
                    <form onSubmit={cvForm.handleSubmit(onCVSubmit)}>
                        <CardHeader>
                            <CardTitle>Upload your CV</CardTitle>
                            <CardDescription>Paste your CV text below or upload a file (coming soon).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cvText">CV Content</Label>
                                <textarea
                                    id="cvText"
                                    className="flex min-h-[200px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    placeholder="Paste your resume text here..."
                                    {...cvForm.register("cvText")}
                                />
                                {cvForm.formState.errors.cvText && <p className="text-sm text-red-500">{cvForm.formState.errors.cvText.message}</p>}
                            </div>
                            <div className="flex items-center justify-center rounded-md border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
                                <div className="text-center">
                                    <UploadCloud className="mx-auto h-10 w-10 text-zinc-400" />
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">PDF Upload coming soon</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                Next: Preferences
                            </Button>
                        </CardFooter>
                    </form>
                )}

                {step === Step.PREFERENCES && (
                    <form onSubmit={prefForm.handleSubmit(onPrefSubmit)}>
                        <CardHeader>
                            <CardTitle>Job Preferences</CardTitle>
                            <CardDescription>Tell us what you are looking for.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="roles">Preferred Roles (comma separated)</Label>
                                <Input id="roles" placeholder="e.g. Frontend Developer, Full Stack Engineer" {...prefForm.register("roles")} />
                                {prefForm.formState.errors.roles && <p className="text-sm text-red-500">{prefForm.formState.errors.roles.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="locations">Locations (comma separated)</Label>
                                <Input id="locations" placeholder="e.g. Remote, London, New York" {...prefForm.register("locations")} />
                                {prefForm.formState.errors.locations && <p className="text-sm text-red-500">{prefForm.formState.errors.locations.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Years of Experience</Label>
                                    <Input id="experience" type="number" placeholder="5" {...prefForm.register("experience")} />
                                    {prefForm.formState.errors.experience && <p className="text-sm text-red-500">{prefForm.formState.errors.experience.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salary">Expected Salary (Annual)</Label>
                                    <Input id="salary" placeholder="$100,000" {...prefForm.register("salary")} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep(Step.UPLOAD_CV)}>
                                Back
                            </Button>
                            <Button type="submit">Next: Subscription</Button>
                        </CardFooter>
                    </form>
                )}

                {step === Step.SUBSCRIPTION && (
                    <form onSubmit={subForm.handleSubmit(onSubSubmit)}>
                        <CardHeader>
                            <CardTitle>Choose your plan</CardTitle>
                            <CardDescription>Select a plan that fits your job search needs.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {["free", "starter", "pro"].map((plan) => (
                                    <div key={plan} className={`cursor-pointer rounded-lg border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${subForm.watch("plan") === plan ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20" : "border-zinc-200 dark:border-zinc-800"}`} onClick={() => subForm.setValue("plan", plan as "free" | "starter" | "pro")}>
                                        <div className="font-semibold capitalize">{plan}</div>
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{plan === "free" ? "$0/mo" : plan === "starter" ? "$9/mo" : "$29/mo"}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep(Step.PREFERENCES)}>
                                Back
                            </Button>
                            <Button type="submit">Complete Setup</Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
