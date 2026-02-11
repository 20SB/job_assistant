'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscriptionsApi, Subscription, Plan, Payment } from "@/lib/api/subscriptions";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, CreditCard, Calendar, Check, Zap, ArrowRight } from "lucide-react";

export function SubscriptionPage() {
    const { token } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPlans, setShowPlans] = useState(false);

    useEffect(() => {
        if (!token) return;
        loadData();
    }, [token]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [subRes, plansRes] = await Promise.all([
                subscriptionsApi.getMySubscription(token!).catch(() => null),
                subscriptionsApi.listPlans(),
            ]);
            if (subRes) setSubscription(subRes.data);
            setPlans(plansRes.data);

            // Try loading payments
            try {
                const payRes = await subscriptionsApi.getPayments(token!);
                setPayments(payRes.data);
            } catch {
                // Payments may not exist yet
            }
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        setActionLoading(planId);
        setError(null);
        setSuccess(null);
        try {
            const res = await subscriptionsApi.subscribe(planId, token!);
            setSubscription(res.data);
            setSuccess("Subscription updated successfully!");
            setShowPlans(false);
            // Reload to get updated plan details
            await loadData();
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to subscribe");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        setActionLoading("cancel");
        setError(null);
        setSuccess(null);
        try {
            await subscriptionsApi.cancel(token!);
            setSuccess("Subscription cancelled. You can continue using the service until the end of your billing period.");
            await loadData();
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Failed to cancel subscription");
        } finally {
            setActionLoading(null);
        }
    };

    const currentPlan = plans.find((p) => p.id === subscription?.planId);
    const statusColors: Record<string, string> = {
        active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        past_due: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
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
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Subscription</h2>
                    <p className="text-sm text-zinc-500 mt-1">Manage your plan and billing.</p>
                </div>
                {subscription && subscription.status === "active" && !showPlans && (
                    <Button variant="outline" size="sm" onClick={() => setShowPlans(true)}>
                        <Zap className="h-4 w-4 mr-2" />
                        Change Plan
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

            {/* Current Plan Card */}
            {subscription && currentPlan && (
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl capitalize">{currentPlan.name} Plan</CardTitle>
                                <CardDescription>Your current subscription</CardDescription>
                            </div>
                            <Badge className={statusColors[subscription.status] ?? ""}>{subscription.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-zinc-400" />
                                <div>
                                    <p className="text-xs text-zinc-500">Price</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {currentPlan.price === 0 ? "Free" : `${currentPlan.currency} ${currentPlan.price}/${currentPlan.billingCycle === "monthly" ? "mo" : "yr"}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <div>
                                    <p className="text-xs text-zinc-500">Billing Cycle</p>
                                    <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">{currentPlan.billingCycle}</p>
                                </div>
                            </div>
                            {subscription.currentPeriodEnd && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-500">{subscription.status === "cancelled" ? "Access Until" : "Renews"}</p>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {currentPlan.features && currentPlan.features.length > 0 && (
                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Plan Features</p>
                                <div className="grid gap-1.5">
                                    {currentPlan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    {subscription.status === "active" && currentPlan.price > 0 && (
                        <CardFooter>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancel}
                                disabled={actionLoading === "cancel"}
                            >
                                {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Cancel Subscription
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            )}

            {/* No subscription */}
            {!subscription && !showPlans && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CreditCard className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No active subscription</h3>
                        <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
                            Choose a plan to get started with job matching.
                        </p>
                        <Button onClick={() => setShowPlans(true)}>View Plans</Button>
                    </CardContent>
                </Card>
            )}

            {/* Plan Selection */}
            {(showPlans || !subscription) && plans.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Available Plans</h3>
                        {showPlans && subscription && (
                            <Button variant="ghost" size="sm" onClick={() => setShowPlans(false)}>Cancel</Button>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {plans.map((plan) => {
                            const isCurrent = plan.id === subscription?.planId;
                            return (
                                <Card key={plan.id} className={`relative ${isCurrent ? "border-blue-500 dark:border-blue-500" : ""}`}>
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-blue-600 text-white">Current</Badge>
                                        </div>
                                    )}
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg capitalize">{plan.name}</CardTitle>
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                            {plan.price === 0 ? "Free" : `$${plan.price}`}
                                            {plan.price > 0 && <span className="text-sm font-normal text-zinc-500">/{plan.billingCycle === "monthly" ? "mo" : "yr"}</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 pb-4">
                                        <p className="text-xs text-zinc-500 line-clamp-2">{plan.description}</p>
                                        {plan.features && plan.features.length > 0 && (
                                            <div className="space-y-1.5 pt-2">
                                                {plan.features.slice(0, 4).map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={isCurrent ? "secondary" : "default"}
                                            disabled={isCurrent || actionLoading === plan.id}
                                            onClick={() => handleSubscribe(plan.id)}
                                            size="sm"
                                        >
                                            {actionLoading === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : isCurrent ? (
                                                "Current Plan"
                                            ) : (
                                                <>
                                                    Select <ArrowRight className="h-4 w-4 ml-1" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {payment.currency} {payment.amount}
                                        </p>
                                        <p className="text-xs text-zinc-500">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant={payment.status === "completed" ? "secondary" : "outline"}>{payment.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
