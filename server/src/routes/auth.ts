import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken } from "../utils/jwt";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Public self-service signup is intentionally disabled. Accounts are created
// by an admin from the /admin page (see routes/admin.ts) or via the
// server-startup bootstrap (see bootstrapAdmin.ts).

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { household: true } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, householdId: user.householdId });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    household: { id: user.household.id, name: user.household.name, inviteCode: user.household.inviteCode },
  });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { household: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    household: { id: user.household.id, name: user.household.name, inviteCode: user.household.inviteCode },
  });
});

export default router;
