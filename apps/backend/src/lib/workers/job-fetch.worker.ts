import * as jobsService from "../../modules/jobs/jobs.service.js";

interface JobFetchPayload {
  roles: string[];
  locations?: string[];
  maxPages?: number;
}

export async function jobFetchWorker(payload: unknown): Promise<unknown> {
  const { roles, locations, maxPages = 1 } = payload as JobFetchPayload;
  return jobsService.triggerFetch({ roles, locations, maxPages });
}
