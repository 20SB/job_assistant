import type { Request, Response } from "express";
import * as subscriptionsService from "./subscriptions.service.js";

// ── Plans (public) ─────────────────────────────────────────────────────────

export async function listPlans(_req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.listPlans();
  res.status(200).json({ status: "success", data: result });
}

export async function getPlan(req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.getPlanById(req.params.id as string);
  res.status(200).json({ status: "success", data: result });
}

// ── Subscriptions (authenticated) ──────────────────────────────────────────

export async function subscribe(req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.subscribe(req.user!.userId, req.body.planId);
  res.status(201).json({ status: "success", data: result });
}

export async function getMySubscription(req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.getMySubscription(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.cancelSubscription(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const result = await subscriptionsService.listPayments(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}
