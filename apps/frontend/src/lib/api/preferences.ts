import { fetchApi } from "./client";

export interface PreferencesData {
  preferredRoles: string[];
  locations: string[];
  remotePreference: boolean;
  minExperienceYears?: number;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency: string;
  employmentType: "full_time" | "contract" | "part_time" | "freelance";
}

export const preferencesApi = {
  create: (data: PreferencesData, token: string) =>
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
};
