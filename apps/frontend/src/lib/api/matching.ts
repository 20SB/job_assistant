import { fetchApi } from "./client";
import type { Job } from "./jobs";

export interface ScoreBreakdown {
    skillOverlap: number;
    roleMatch: number;
    locationMatch: number;
    salaryCompat: number;
    experienceAlign: number;
}

export interface MatchResult {
    matchId: string;
    batchId: string;
    jobId: string;
    matchPercentage: number;
    scoreBreakdown: ScoreBreakdown;
    matchedSkills: string[];
    missingSkills: string[];
    recommendationReason: string;
    isShortlisted: boolean;
    viewedAt: string | null;
    excluded: boolean;
    job?: Job;
}

export interface MatchResultsResponse {
    matches: MatchResult[];
    total: number;
    page: number;
    limit: number;
}

export interface MatchBatch {
    batchId: string;
    matchesCount: number;
    createdAt: string;
    trigger: string;
}

export interface MatchFilters {
    page?: number;
    limit?: number;
    minPercentage?: number;
    shortlistedOnly?: string;
}

export const matchingApi = {
    run: (token: string, trigger: "manual" | "scheduled" = "manual") =>
        fetchApi<{ status: string; data: { batchId: string; matchesCount: number } }>("/api/matching/run", {
            method: "POST",
            body: JSON.stringify({ trigger }),
            token,
        }),

    getBatches: (token: string) =>
        fetchApi<{ status: string; data: MatchBatch[] }>("/api/matching/batches", {
            method: "GET",
            token,
        }),

    getBatchById: (id: string, token: string) =>
        fetchApi<{ status: string; data: { batch: MatchBatch; matches: MatchResult[]; jobs: Record<string, Job> } }>(`/api/matching/batches/${id}`, {
            method: "GET",
            token,
        }),

    getResults: (filters: MatchFilters, token: string) => {
        const params = new URLSearchParams();
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        if (filters.minPercentage !== undefined) params.set("minPercentage", String(filters.minPercentage));
        if (filters.shortlistedOnly) params.set("shortlistedOnly", filters.shortlistedOnly);

        const query = params.toString();
        return fetchApi<{ status: string; data: MatchResultsResponse }>(`/api/matching/results${query ? `?${query}` : ""}`, {
            method: "GET",
            token,
        });
    },

    toggleShortlist: (matchId: string, token: string) =>
        fetchApi<{ status: string; data: { isShortlisted: boolean } }>(`/api/matching/${matchId}/shortlist`, {
            method: "PATCH",
            token,
        }),

    markViewed: (matchId: string, token: string) =>
        fetchApi<{ status: string; data: { viewedAt: string } }>(`/api/matching/${matchId}/viewed`, {
            method: "PATCH",
            token,
        }),
};
