import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/** Shape of a single result from Adzuna API */
export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name?: string } | null;
  description: string;
  salary_min?: number;
  salary_max?: number;
  location: { display_name?: string; area?: string[] } | null;
  category: { label?: string } | null;
  contract_type?: string;
  redirect_url: string;
  created: string;
  latitude?: number;
  longitude?: number;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
}

interface FetchParams {
  role: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
}

/**
 * Fetches jobs from the Adzuna API for a given role/location.
 * Returns raw Adzuna job objects.
 */
export async function fetchFromAdzuna(params: FetchParams): Promise<AdzunaJob[]> {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    logger.warn("Adzuna API credentials not configured — skipping fetch");
    return [];
  }

  const page = params.page ?? 1;
  const resultsPerPage = params.resultsPerPage ?? 50;
  const country = env.ADZUNA_COUNTRY;

  const url = new URL(`${env.ADZUNA_BASE_URL}/jobs/${country}/search/${page}`);
  url.searchParams.set("app_id", env.ADZUNA_APP_ID);
  url.searchParams.set("app_key", env.ADZUNA_APP_KEY);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", params.role);
  url.searchParams.set("content-type", "application/json");

  if (params.location) {
    url.searchParams.set("where", params.location);
  }

  logger.debug({ role: params.role, location: params.location, page }, "Fetching from Adzuna");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error(
      { status: response.status, body, role: params.role },
      "Adzuna API request failed",
    );
    throw new Error(`Adzuna API returned ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AdzunaResponse;

  logger.info(
    { role: params.role, location: params.location, page, count: data.results.length },
    "Adzuna fetch complete",
  );

  return data.results;
}

/**
 * Maps an Adzuna API result to our jobs table insert shape.
 */
export function mapAdzunaJob(raw: AdzunaJob) {
  return {
    externalJobId: String(raw.id),
    source: "adzuna" as const,
    title: raw.title,
    company: raw.company?.display_name ?? null,
    description: raw.description ?? null,
    salaryMin: raw.salary_min != null ? String(raw.salary_min) : null,
    salaryMax: raw.salary_max != null ? String(raw.salary_max) : null,
    salaryCurrency: "INR",
    location: raw.location?.display_name ?? null,
    isRemote: false,
    category: raw.category?.label ?? null,
    contractType: raw.contract_type ?? null,
    applyUrl: raw.redirect_url ?? null,
    postedDate: raw.created ? new Date(raw.created) : null,
    rawData: raw as unknown as Record<string, unknown>,
  };
}
