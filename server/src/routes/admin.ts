import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/users", async (req: AuthedRequest, res) => {
  const users = await prisma.user.findMany({
    where: { householdId: req.householdId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
  });
  res.json(users);
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isAdmin: z.boolean().optional(),
});

router.post("/users", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password, isAdmin } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isAdmin: isAdmin ?? false,
      householdId: req.householdId as string,
    },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
  });
  res.status(201).json(user);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
});

router.patch("/users/:id", async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!target) return res.status(404).json({ error: "User not found" });

  const { name, email, isAdmin, newPassword } = parsed.data;

  if (isAdmin === false && target.id === req.userId) {
    return res.status(400).json({ error: "You can't remove your own admin access" });
  }
  if (isAdmin === false && target.isAdmin) {
    const otherAdmins = await prisma.user.count({
      where: { householdId: req.householdId, isAdmin: true, id: { not: target.id } },
    });
    if (otherAdmins === 0) {
      return res.status(400).json({ error: "Can't remove the last admin" });
    }
  }

  if (email && email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: {
      name,
      email,
      isAdmin,
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
    },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
  });
  res.json(user);
});

router.delete("/users/:id", async (req: AuthedRequest, res) => {
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.id === req.userId) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }
  if (target.isAdmin) {
    const otherAdmins = await prisma.user.count({
      where: { householdId: req.householdId, isAdmin: true, id: { not: target.id } },
    });
    if (otherAdmins === 0) {
      return res.status(400).json({ error: "Can't delete the last admin" });
    }
  }

  await prisma.user.delete({ where: { id: target.id } });
  res.status(204).send();
});

export default router;
