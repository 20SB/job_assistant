import type { Request, Response } from "express";
import * as matchingService from "./matching.service.js";
import { listMatchesSchema } from "./matching.schemas.js";

export async function runMatching(req: Request, res: Response): Promise<void> {
  const result = await matchingService.runMatching(req.user!.userId, req.body.trigger ?? "scheduled");
  res.status(200).json({ status: "success", data: result });
}

export async function listBatches(req: Request, res: Response): Promise<void> {
  const result = await matchingService.listBatches(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function getBatch(req: Request, res: Response): Promise<void> {
  const result = await matchingService.getBatchWithMatches(
    req.user!.userId,
    req.params.id as string,
  );
  res.status(200).json({ status: "success", data: result });
}

export async function listMatches(req: Request, res: Response): Promise<void> {
  const params = listMatchesSchema.parse(req.query);
  const result = await matchingService.listMatches(req.user!.userId, params);
  res.status(200).json({ status: "success", data: result });
}

export async function toggleShortlist(req: Request, res: Response): Promise<void> {
  const result = await matchingService.toggleShortlist(
    req.user!.userId,
    req.params.id as string,
  );
  res.status(200).json({ status: "success", data: result });
}

export async function markViewed(req: Request, res: Response): Promise<void> {
  const result = await matchingService.markViewed(
    req.user!.userId,
    req.params.id as string,
  );
  res.status(200).json({ status: "success", data: result });
}
