import { fetchApi } from "./client";

export interface PreferencesData {
    id?: string;
    preferredRoles: string[];
    locations: string[];
    remotePreference: boolean;
    minExperienceYears?: number;
    maxExperienceYears?: number;
    currentSalary?: number;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    salaryCurrency: string;
    companySize?: string;
    employmentType: "full_time" | "contract" | "part_time" | "freelance" | "internship";
    excludedKeywords?: string[];
    blacklistedCompanies?: string[];
    minimumMatchPercentage?: number;
}

export const preferencesApi = {
    create: (data: Partial<PreferencesData>, token: string) =>
        fetchApi<{ status: string; data: PreferencesData }>("/api/preferences", {
            method: "POST",
            body: JSON.stringify(data),
            token,
        }),

    get: (token: string) =>
        fetchApi<{ status: string; data: PreferencesData }>("/api/preferences", {
            method: "GET",
            token,
        }),

    update: (data: Partial<PreferencesData>, token: string) =>
        fetchApi<{ status: string; data: PreferencesData }>("/api/preferences", {
            method: "PATCH",
            body: JSON.stringify(data),
            token,
        }),

    delete: (token: string) =>
        fetchApi<{ status: string; data: { message: string } }>("/api/preferences", {
            method: "DELETE",
            token,
        }),
};
