import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken } from "../utils/jwt";
import { generateInviteCode } from "../utils/inviteCode";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
  // If provided, join an existing household. Otherwise a new household is created.
  inviteCode: z.string().optional(),
  householdName: z.string().optional(),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, name, inviteCode, householdName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  let householdId: string;

  if (inviteCode) {
    const household = await prisma.household.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
    if (!household) {
      return res.status(404).json({ error: "Invalid invite code" });
    }
    householdId = household.id;
  } else {
    let code = generateInviteCode();
    // extremely unlikely to collide, but guard anyway
    for (let attempts = 0; attempts < 5; attempts++) {
      const taken = await prisma.household.findUnique({ where: { inviteCode: code } });
      if (!taken) break;
      code = generateInviteCode();
    }
    const household = await prisma.household.create({
      data: {
        name: householdName?.trim() || `${name}'s Household`,
        inviteCode: code,
      },
    });
    householdId = household.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, householdId },
    include: { household: true },
  });

  const token = signToken({ userId: user.id, householdId: user.householdId });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
    household: { id: user.household.id, name: user.household.name, inviteCode: user.household.inviteCode },
  });
});

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
    user: { id: user.id, email: user.email, name: user.name },
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
    user: { id: user.id, email: user.email, name: user.name },
    household: { id: user.household.id, name: user.household.name, inviteCode: user.household.inviteCode },
  });
});

export default router;
