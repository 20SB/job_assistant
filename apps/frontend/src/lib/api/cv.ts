import { fetchApi } from "./client";

export interface CvData {
  id: string;
  rawCvText: string;
  inputMethod: "text" | "form" | "pdf";
  parsedSkills?: string[];
  parsedRoles?: string[];
  experienceYears?: number;
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
};
