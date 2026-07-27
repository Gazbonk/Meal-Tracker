import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { recipeSchema } from "../schemas/recipe";
import { importRecipeFromUrl, RecipeImportError } from "../services/recipeImport";

const router = Router();
router.use(requireAuth);

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

const importSchema = z.object({ url: z.string().url() });

const IMPORT_ERROR_STATUS: Record<string, number> = {
  fetch_failed: 502,
  not_found: 404,
  timeout: 504,
  blocked: 502,
  no_recipe_found: 422,
  no_api_key: 422,
  llm_malformed: 502,
  llm_error: 502,
};

// Fetches a recipe from an external URL and returns a preview (not saved) in
// the same shape POST /recipes accepts, for the client to review/edit before
// saving via the normal create flow.
router.post("/import", async (req: AuthedRequest, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid URL." });
  }

  try {
    const preview = await importRecipeFromUrl(parsed.data.url);
    res.json(preview);
  } catch (err) {
    if (err instanceof RecipeImportError) {
      const status = IMPORT_ERROR_STATUS[err.code] ?? 500;
      return res.status(status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to import recipe" });
  }
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = recipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, instructions, tags, sourceUrl, ingredients } = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      name,
      instructions,
      tags,
      sourceUrl,
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

  const { name, instructions, tags, sourceUrl, ingredients } = parsed.data;

  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });
    return tx.recipe.update({
      where: { id: req.params.id },
      data: {
        name,
        instructions,
        tags,
        sourceUrl,
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
