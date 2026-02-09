import type { Request, Response } from "express";
import * as userService from "./user.service.js";

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await userService.signup(email, password);
  res.status(201).json({ status: "success", data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await userService.login(email, password);
  res.status(200).json({ status: "success", data: result });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  const result = await userService.verifyEmail(token);
  res.status(200).json({ status: "success", data: result });
}

export async function forgotPassword(
  req: Request,
  res: Response
): Promise<void> {
  const { email } = req.body;
  const result = await userService.forgotPassword(email);
  res.status(200).json({ status: "success", data: result });
}

export async function resetPassword(
  req: Request,
  res: Response
): Promise<void> {
  const { token, password } = req.body;
  const result = await userService.resetPassword(token, password);
  res.status(200).json({ status: "success", data: result });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const result = await userService.getProfile(req.user!.userId);
  res.status(200).json({ status: "success", data: result });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const result = await userService.updateProfile(req.user!.userId, req.body);
  res.status(200).json({ status: "success", data: result });
}
