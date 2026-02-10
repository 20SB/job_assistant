import { fetchApi } from "./client";

export interface CvData {
    id: string;
    rawCvText: string;
    inputMethod: "text" | "form" | "pdf";
    parsedSkills?: string[];
    parsedRoles?: string[];
    parsedTools?: string[];
    experienceYears?: number;
    seniority?: string;
    isActive?: boolean;
    version?: number;
    createdAt: string;
}

export const cvApi = {
    create: (rawCvText: string, token: string) =>
        fetchApi<{ status: string; data: CvData }>("/api/cv", {
            method: "POST",
            body: JSON.stringify({ rawCvText, inputMethod: "text" }),
            token,
        }),

    getActive: (token: string) =>
        fetchApi<{ status: string; data: CvData }>("/api/cv/active", {
            method: "GET",
            token,
        }),

    getById: (id: string, token: string) =>
        fetchApi<{ status: string; data: CvData }>(`/api/cv/${id}`, {
            method: "GET",
            token,
        }),

    getVersions: (token: string) =>
        fetchApi<{ status: string; data: CvData[] }>("/api/cv/versions", {
            method: "GET",
            token,
        }),

    update: (rawCvText: string, token: string) =>
        fetchApi<{ status: string; data: CvData }>("/api/cv", {
            method: "PATCH",
            body: JSON.stringify({ rawCvText }),
            token,
        }),

    delete: (id: string, token: string) =>
        fetchApi<{ status: string; data: { message: string } }>(`/api/cv/${id}`, {
            method: "DELETE",
            token,
        }),
};
