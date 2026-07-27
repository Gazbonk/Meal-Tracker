import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
});

const recipeSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().optional(),
  tags: z.string().optional(),
  ingredients: z.array(ingredientSchema).default([]),
});

router.get("/", async (req: AuthedRequest, res) => {
  const recipes = await prisma.recipe.findMany({
    where: { householdId: req.householdId },
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });
  res.json(recipes);
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const recipe = await prisma.recipe.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
    include: { ingredients: true },
  });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json(recipe);
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = recipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, instructions, tags, ingredients } = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      name,
      instructions,
      tags,
      householdId: req.householdId as string,
      ingredients: { create: ingredients },
    },
    include: { ingredients: true },
  });
  res.status(201).json(recipe);
});

router.put("/:id", async (req: AuthedRequest, res) => {
  const parsed = recipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.recipe.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!existing) return res.status(404).json({ error: "Recipe not found" });

  const { name, instructions, tags, ingredients } = parsed.data;

  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });
    return tx.recipe.update({
      where: { id: req.params.id },
      data: {
        name,
        instructions,
        tags,
        ingredients: { create: ingredients },
      },
      include: { ingredients: true },
    });
  });

  res.json(recipe);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await prisma.recipe.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!existing) return res.status(404).json({ error: "Recipe not found" });

  await prisma.recipe.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Add all of a recipe's ingredients onto the shared shopping list.
router.post("/:id/add-to-shopping-list", async (req: AuthedRequest, res) => {
  const recipe = await prisma.recipe.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
    include: { ingredients: true },
  });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  const created = await prisma.$transaction(
    recipe.ingredients.map((ing) =>
      prisma.shoppingListItem.create({
        data: {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          householdId: req.householdId as string,
        },
      })
    )
  );

  res.status(201).json(created);
});

export default router;
