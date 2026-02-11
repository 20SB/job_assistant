import type { Request, Response } from "express";
import * as csvService from "./csv.service.js";
import * as tasksService from "../tasks/tasks.service.js";
import { listExportsSchema } from "./csv.schemas.js";

export async function generate(req: Request, res: Response): Promise<void> {
  const task = await tasksService.enqueue("csv_generation", {
    userId: req.user!.userId,
    batchId: req.body.batchId,
    sendEmail: req.body.sendEmail,
  });
  res.status(202).json({
    status: "success",
    data: { taskId: task.id, message: "CSV generation queued" },
  });
}

export async function download(req: Request, res: Response): Promise<void> {
  const { fileName, buffer } = await csvService.downloadCsv(
    req.user!.userId,
    req.params.id as string,
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Length", buffer.length);
  res.status(200).send(buffer);
}

export async function listExports(
  req: Request,
  res: Response,
): Promise<void> {
  const params = listExportsSchema.parse(req.query);
  const result = await csvService.listExports(req.user!.userId, params);
  res.status(200).json({ status: "success", data: result });
}

export async function archive(req: Request, res: Response): Promise<void> {
  const result = await csvService.archiveExport(
    req.user!.userId,
    req.params.id as string,
  );
  res.status(200).json({ status: "success", data: result });
}
