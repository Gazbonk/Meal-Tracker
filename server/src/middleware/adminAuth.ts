import { Response, NextFunction } from "express";
import { prisma } from "../db";
import { AuthedRequest } from "./auth";

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
