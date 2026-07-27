import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
});

export const recipeSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().optional(),
  tags: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  ingredients: z.array(ingredientSchema).default([]),
});

export type ParsedIngredient = z.infer<typeof ingredientSchema>;
export type ParsedRecipe = z.infer<typeof recipeSchema>;
