import { fetchApi } from "./client";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  features: string[];
}

export interface Subscription {
  id: string;
  status: "active" | "cancelled" | "past_due";
  currentPeriodEnd: string;
  planId: string;
  plan?: Plan;
}

export const subscriptionsApi = {
  listPlans: () =>
    fetchApi<{ status: string; data: Plan[] }>("/api/subscriptions/plans", {
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
};
