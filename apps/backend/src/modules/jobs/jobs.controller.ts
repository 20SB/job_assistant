import type { Request, Response } from "express";
import * as jobsService from "./jobs.service.js";
import { listJobsSchema } from "./jobs.schemas.js";

export async function listJobs(req: Request, res: Response): Promise<void> {
  const params = listJobsSchema.parse(req.query);
  const result = await jobsService.listJobs(params);
  res.status(200).json({ status: "success", data: result });
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const result = await jobsService.getJobById(req.params.id as string);
  res.status(200).json({ status: "success", data: result });
}

export async function triggerFetch(req: Request, res: Response): Promise<void> {
  const result = await jobsService.triggerFetch(req.body);
  res.status(200).json({ status: "success", data: result });
}

export async function fetchLogs(_req: Request, res: Response): Promise<void> {
  const result = await jobsService.listFetchLogs();
  res.status(200).json({ status: "success", data: result });
}
