import type { Request, Response, NextFunction } from "express";
import { verify } from "../jwt.ts";

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-token"];

  if (!token || !verify(token.toString())) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
