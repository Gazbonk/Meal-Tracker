import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireSuperAdmin } from "../middleware/superAdminAuth";
import { generateInviteCode } from "../utils/inviteCode";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/households", async (_req: AuthedRequest, res) => {
  const households = await prisma.household.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true, recipes: true } } },
  });
  res.json(
    households.map((h) => ({
      id: h.id,
      name: h.name,
      inviteCode: h.inviteCode,
      createdAt: h.createdAt,
      userCount: h._count.users,
      recipeCount: h._count.recipes,
    }))
  );
});

const createHouseholdSchema = z.object({
  householdName: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/households", async (req: AuthedRequest, res) => {
  const parsed = createHouseholdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { householdName, adminName, adminEmail, adminPassword } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const { household, admin } = await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: { name: householdName, inviteCode: generateInviteCode() },
    });
    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        householdId: household.id,
        isAdmin: true,
        isSuperAdmin: false,
      },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });
    return { household, admin };
  });

  res.status(201).json({
    household: {
      id: household.id,
      name: household.name,
      inviteCode: household.inviteCode,
      createdAt: household.createdAt,
      userCount: 1,
      recipeCount: 0,
    },
    admin,
  });
});

router.delete("/households/:id", async (req: AuthedRequest, res) => {
  const household = await prisma.household.findUnique({ where: { id: req.params.id } });
  if (!household) {
    return res.status(404).json({ error: "Household not found" });
  }
  if (household.id === req.householdId) {
    return res.status(400).json({ error: "You can't delete your own household" });
  }

  await prisma.household.delete({ where: { id: household.id } });
  res.status(204).send();
});

export default router;
