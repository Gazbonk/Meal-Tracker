import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const items = await prisma.shoppingListItem.findMany({
    where: { householdId: req.householdId },
    orderBy: [{ checked: "asc" }, { category: "asc" }, { createdAt: "asc" }],
  });
  res.json(items);
});

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const item = await prisma.shoppingListItem.create({
    data: { ...parsed.data, householdId: req.householdId as string },
  });
  res.status(201).json(item);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  checked: z.boolean().optional(),
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.shoppingListItem.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!existing) return res.status(404).json({ error: "Item not found" });

  const item = await prisma.shoppingListItem.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(item);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await prisma.shoppingListItem.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!existing) return res.status(404).json({ error: "Item not found" });

  await prisma.shoppingListItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// DELETE /api/shoppinglist/checked/all - clear all checked-off items
router.delete("/checked/all", async (req: AuthedRequest, res) => {
  await prisma.shoppingListItem.deleteMany({
    where: { householdId: req.householdId, checked: true },
  });
  res.status(204).send();
});

export default router;
