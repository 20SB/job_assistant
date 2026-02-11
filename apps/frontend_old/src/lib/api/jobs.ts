import { fetchApi } from "./client";

export interface Job {
    id: string;
    externalJobId: string;
    title: string;
    description: string;
    company: string;
    location: string;
    category: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    isRemote: boolean;
    postedAt: string | null;
    expiresAt: string | null;
    sourceUrl: string | null;
    createdAt: string;
}

export interface JobsListResponse {
    jobs: Job[];
    total: number;
    page: number;
    limit: number;
}

export interface JobFilters {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    company?: string;
    remote?: string;
    category?: string;
}

export const jobsApi = {
    list: (filters: JobFilters, token: string) => {
        const params = new URLSearchParams();
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        if (filters.search) params.set("search", filters.search);
        if (filters.location) params.set("location", filters.location);
        if (filters.company) params.set("company", filters.company);
        if (filters.remote) params.set("remote", filters.remote);
        if (filters.category) params.set("category", filters.category);

        const query = params.toString();
        return fetchApi<{ status: string; data: JobsListResponse }>(`/api/jobs${query ? `?${query}` : ""}`, {
            method: "GET",
            token,
        });
    },

    getById: (id: string, token: string) =>
        fetchApi<{ status: string; data: Job }>(`/api/jobs/${id}`, {
            method: "GET",
            token,
        }),

    fetch: (roles: string[], locations: string[], token: string, maxPages?: number) =>
        fetchApi<{ status: string; data: { totalFetched: number; totalNew: number; totalDuplicates: number } }>("/api/jobs/fetch", {
            method: "POST",
            body: JSON.stringify({ roles, locations, maxPages }),
            token,
        }),
};
