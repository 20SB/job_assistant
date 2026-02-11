import type { Request, Response } from "express";
import * as tasksService from "./tasks.service.js";
import { listTasksSchema } from "./tasks.schemas.js";

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await tasksService.getTask(req.params.id as string);
  res.status(200).json({ status: "success", data: task });
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const params = listTasksSchema.parse(req.query);
  const result = await tasksService.listTasks(params);
  res.status(200).json({ status: "success", data: result });
}
