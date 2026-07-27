import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

// GET /api/mealplan?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/", async (req: AuthedRequest, res) => {
  const { start, end } = req.query;
  if (typeof start !== "string" || typeof end !== "string") {
    return res.status(400).json({ error: "start and end query params are required (YYYY-MM-DD)" });
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: {
      householdId: req.householdId,
      date: { gte: start, lte: end },
    },
    include: { recipe: true },
  });
  res.json(entries);
});

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  mealType: z.enum(MEAL_TYPES),
  recipeId: z.string().nullable().optional(),
  customTitle: z.string().nullable().optional(),
});

// PUT /api/mealplan  - upsert a single slot (date + mealType)
router.put("/", async (req: AuthedRequest, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { date, mealType, recipeId, customTitle } = parsed.data;

  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, householdId: req.householdId } });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  }

  const entry = await prisma.mealPlanEntry.upsert({
    where: {
      householdId_date_mealType: {
        householdId: req.householdId as string,
        date,
        mealType,
      },
    },
    update: { recipeId: recipeId ?? null, customTitle: customTitle ?? null },
    create: {
      householdId: req.householdId as string,
      date,
      mealType,
      recipeId: recipeId ?? null,
      customTitle: customTitle ?? null,
    },
    include: { recipe: true },
  });

  res.json(entry);
});

// DELETE /api/mealplan/:id - clear a slot
router.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await prisma.mealPlanEntry.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!existing) return res.status(404).json({ error: "Meal plan entry not found" });

  await prisma.mealPlanEntry.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
