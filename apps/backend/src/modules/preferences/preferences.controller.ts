import type { Request, Response } from "express";
import * as preferencesService from "./preferences.service.js";

export async function create(req: Request, res: Response): Promise<void> {
  const result = await preferencesService.createPreferences(req.user!.userId, req.body);
  res.status(201).json({ status: "success", data: result });
}

export async function get(req: Request, res: Response): Promise<void> {
  const result = await preferencesService.getPreferences(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function update(req: Request, res: Response): Promise<void> {
  const result = await preferencesService.updatePreferences(req.user!.userId, req.body);
  res.status(200).json({ status: "success", data: result });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const result = await preferencesService.deletePreferences(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}
