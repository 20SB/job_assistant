import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";
import type {
  UsersQuery,
  JobFetchLogsQuery,
  MatchingLogsQuery,
  EmailDeliveryLogsQuery,
  TaskQueueQuery,
} from "./admin.schemas.js";

// ============================================================================
// USERS
// ============================================================================

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as UsersQuery;
  const result = await adminService.listUsers(query);
  res.status(200).json({ status: "success", data: result });
}

export async function getUserDetails(req: Request, res: Response): Promise<void> {
  const userId = req.params.id as string;
  const user = await adminService.getUserDetails(userId);
  res.status(200).json({ status: "success", data: user });
}

// ============================================================================
// JOB FETCH LOGS
// ============================================================================

export async function listJobFetchLogs(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as JobFetchLogsQuery;
  const result = await adminService.listJobFetchLogs(query);
  res.status(200).json({ status: "success", data: result });
}

// ============================================================================
// MATCHING LOGS
// ============================================================================

export async function listMatchingLogs(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as MatchingLogsQuery;
  const result = await adminService.listMatchingLogs(query);
  res.status(200).json({ status: "success", data: result });
}

// ============================================================================
// EMAIL DELIVERY LOGS
// ============================================================================

export async function listEmailDeliveryLogs(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as EmailDeliveryLogsQuery;
  const result = await adminService.listEmailDeliveryLogs(query);
  res.status(200).json({ status: "success", data: result });
}

// ============================================================================
// TASK QUEUE
// ============================================================================

export async function listTaskQueue(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as TaskQueueQuery;
  const result = await adminService.listTaskQueue(query);
  res.status(200).json({ status: "success", data: result });
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const stats = await adminService.getDashboardStats();
  res.status(200).json({ status: "success", data: stats });
}
