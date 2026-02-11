"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cvApi } from "@/lib/api/cv";
import { preferencesApi } from "@/lib/api/preferences";
import { subscriptionsApi, Plan } from "@/lib/api/subscriptions";
import { ApiError } from "@/lib/api/client";

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
  experience: z.coerce.number().min(0, "Years of experience must be 0 or more."),
  salary: z.coerce.number().min(0).optional(),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(Step.UPLOAD_CV);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const cvForm = useForm({ resolver: zodResolver(cvSchema) });
  const prefForm = useForm({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      roles: "",
      locations: "",
      experience: 0,
    },
  });

  useEffect(() => {
    if (step === Step.SUBSCRIPTION) {
      subscriptionsApi
        .listPlans()
        .then((res) => {
          setPlans(res.data);
          // Default to "free" plan if available
          const freePlan = res.data.find((p) => p.price === 0);
          if (freePlan) setSelectedPlanId(freePlan.id);
        })
        .catch(console.error);
    }
  }, [step]);

  if (authLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const onCVSubmit = async (data: z.infer<typeof cvSchema>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await cvApi.create(data.cvText, token!);
      setStep(Step.PREFERENCES);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to upload CV");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPrefSubmit = async (data: z.infer<typeof preferencesSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const formattedData = {
      preferredRoles: data.roles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      locations: data.locations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      minExperienceYears: data.experience,
      expectedSalaryMin: data.salary,
      remotePreference: false, // simplified for now
      salaryCurrency: "USD",
      employmentType: "full_time" as const,
    };

    try {
      await preferencesApi.create(formattedData, token!);
      setStep(Step.SUBSCRIPTION);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubscribe = async () => {
    if (!selectedPlanId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await subscriptionsApi.subscribe(selectedPlanId, token!);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to subscribe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <div className="mb-8 flex justify-center space-x-4">
        {[Step.UPLOAD_CV, Step.PREFERENCES, Step.SUBSCRIPTION].map((s, i) => (
          <div
            key={i}
            className={`flex items-center space-x-2 ${step >= s ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-600"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= s ? "border-blue-600 bg-blue-100 dark:border-blue-400 dark:bg-blue-900" : "border-zinc-300 dark:border-zinc-700"}`}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : <span>{i + 1}</span>}
            </div>
            <span className="hidden sm:inline font-medium">
              {s === Step.UPLOAD_CV ? "CV" : s === Step.PREFERENCES ? "Preferences" : "Plan"}
            </span>
          </div>
        ))}
      </div>

      <Card>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/20 rounded-t-lg text-sm border-b border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        {step === Step.UPLOAD_CV && (
          <form onSubmit={cvForm.handleSubmit(onCVSubmit)}>
            <CardHeader>
              <CardTitle>Upload your CV</CardTitle>
              <CardDescription>Paste your CV text below.</CardDescription>
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
                {cvForm.formState.errors.cvText && (
                  <p className="text-sm text-red-500">{cvForm.formState.errors.cvText.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Next: Preferences"}
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
                <Input
                  id="roles"
                  placeholder="e.g. Frontend Developer, Full Stack Engineer"
                  {...prefForm.register("roles")}
                />
                {prefForm.formState.errors.roles && (
                  <p className="text-sm text-red-500">{prefForm.formState.errors.roles.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="locations">Locations (comma separated)</Label>
                <Input
                  id="locations"
                  placeholder="e.g. Remote, London, New York"
                  {...prefForm.register("locations")}
                />
                {prefForm.formState.errors.locations && (
                  <p className="text-sm text-red-500">
                    {prefForm.formState.errors.locations.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="5"
                    {...prefForm.register("experience")}
                  />
                  {prefForm.formState.errors.experience && (
                    <p className="text-sm text-red-500">
                      {prefForm.formState.errors.experience.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Expected Salary (Annual USD)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="100000"
                    {...prefForm.register("salary")}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Step.UPLOAD_CV)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Next: Subscription"}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === Step.SUBSCRIPTION && (
          <div>
            <CardHeader>
              <CardTitle>Choose your plan</CardTitle>
              <CardDescription>Select a plan that fits your job search needs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {plans.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-zinc-500">Loading plans...</div>
                ) : (
                  plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`cursor-pointer rounded-lg border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${selectedPlanId === plan.id ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20" : "border-zinc-200 dark:border-zinc-800"}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <div className="font-semibold capitalize">{plan.name}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {plan.price === 0
                          ? "Free"
                          : `$${plan.price}/${plan.billingCycle === "monthly" ? "mo" : "yr"}`}
                      </div>
                      <div className="text-xs text-zinc-400 mt-2 line-clamp-2">
                        {plan.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Step.PREFERENCES)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button onClick={onSubscribe} disabled={isSubmitting || !selectedPlanId}>
                {isSubmitting ? "Completing..." : "Complete Setup"}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
