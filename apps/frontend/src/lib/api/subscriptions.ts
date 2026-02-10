import { fetchApi } from "./client";

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: "monthly" | "yearly";
    features: string[];
    limits?: Record<string, unknown>;
}

export interface Subscription {
    id: string;
    status: "active" | "cancelled" | "past_due";
    currentPeriodEnd: string;
    planId: string;
    plan?: Plan;
    createdAt?: string;
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

export const subscriptionsApi = {
    listPlans: () =>
        fetchApi<{ status: string; data: Plan[] }>("/api/subscriptions/plans", {
            method: "GET",
        }),

    getPlan: (id: string) =>
        fetchApi<{ status: string; data: Plan }>(`/api/subscriptions/plans/${id}`, {
            method: "GET",
        }),

    subscribe: (planId: string, token: string) =>
        fetchApi<{ status: string; data: Subscription }>("/api/subscriptions/subscribe", {
            method: "POST",
            body: JSON.stringify({ planId }),
            token,
        }),

    getMySubscription: (token: string) =>
        fetchApi<{ status: string; data: Subscription }>("/api/subscriptions/me", {
            method: "GET",
            token,
        }),

    cancel: (token: string) =>
        fetchApi<{ status: string; data: { message: string } }>("/api/subscriptions/cancel", {
            method: "POST",
            token,
        }),

    getPayments: (token: string) =>
        fetchApi<{ status: string; data: Payment[] }>("/api/subscriptions/payments", {
            method: "GET",
            token,
        }),
};
