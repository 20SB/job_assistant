import type { Request, Response } from "express";
import * as notificationsService from "./notifications.service.js";
import { listNotificationsSchema } from "./notifications.schemas.js";

// ── Preferences ──────────────────────────────────────────────────────────────

export async function createPreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await notificationsService.createPreferences(
    req.user!.userId,
    req.body,
  );
  res.status(201).json({ status: "success", data: result });
}

export async function getPreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await notificationsService.getPreferences(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function updatePreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await notificationsService.updatePreferences(
    req.user!.userId,
    req.body,
  );
  res.status(200).json({ status: "success", data: result });
}

export async function deletePreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await notificationsService.deletePreferences(
    req.user!.userId,
  );
  res.status(200).json({ status: "success", data: result });
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function listNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  const params = listNotificationsSchema.parse(req.query);
  const result = await notificationsService.listNotifications(
    req.user!.userId,
    params,
  );
  res.status(200).json({ status: "success", data: result });
}

export async function getNotification(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await notificationsService.getNotification(
    req.user!.userId,
    req.params.id as string,
  );
  res.status(200).json({ status: "success", data: result });
}
