import type { Request, Response } from "express";
import * as cvService from "./cv.service.js";

export async function create(req: Request, res: Response): Promise<void> {
  const result = await cvService.createCv(req.user!.userId, req.body);
  res.status(201).json({ status: "success", data: result });
}

export async function getActive(req: Request, res: Response): Promise<void> {
  const result = await cvService.getActiveCv(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const result = await cvService.getCvById(
    req.user!.userId,
    req.params.id as string
  );
  res.status(200).json({ status: "success", data: result });
}

export async function listVersions(
  req: Request,
  res: Response
): Promise<void> {
  const result = await cvService.listCvVersions(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function update(req: Request, res: Response): Promise<void> {
  const result = await cvService.updateCv(req.user!.userId, req.body);
  res.status(200).json({ status: "success", data: result });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const result = await cvService.deleteCv(
    req.user!.userId,
    req.params.id as string
  );
  res.status(200).json({ status: "success", data: result });
}
