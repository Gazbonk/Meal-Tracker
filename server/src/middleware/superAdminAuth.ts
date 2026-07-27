import { Response, NextFunction } from "express";
import { prisma } from "../db";
import { AuthedRequest } from "./auth";

export async function requireSuperAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.isSuperAdmin) {
    return res.status(403).json({ error: "Super-admin access required" });
  }
  next();
}
