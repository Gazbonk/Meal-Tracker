import Anthropic from "@anthropic-ai/sdk";
// zodOutputFormat requires schemas built with the zod/v4 subpath, not the
// classic `zod` import used elsewhere in this codebase (e.g. schemas/recipe.ts).
import * as z from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { recipeSchema, ParsedRecipe } from "../../schemas/recipe";
import { RecipeImportError } from "./types";

const llmRecipeSchema = z.object({
  found: z.boolean(),
  name: z.string().optional(),
  tags: z.string().optional(),
  instructions: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .optional(),
});

const SYSTEM_PROMPT = `You are extracting a cooking recipe from an article's text. The text may be a blog post or newsletter where the recipe is mixed in with unrelated narrative.

Set "found" to true only if the text actually contains a recipe (ingredients plus instructions). If found:
- "name": a short recipe title
- "instructions": the method as plain text, one step per line
- "ingredients": a list of { name, quantity, unit, category } — category is a rough grocery-aisle grouping like "Produce"/"Dairy"/"Pantry" (omit if unsure)
- "tags": optional comma-separated tags like "dinner,pasta"

If no recipe is present, set "found" to false and omit everything else. Never invent a recipe that isn't actually in the text.`;

// Fallback for content the article-text extractor can't turn into structured
// data — used only when no schema.org Recipe markup was found on the page
// (the normal case for general-purpose blogging/newsletter platforms).
export async function extractRecipeWithLlm(articleText: string): Promise<ParsedRecipe | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new RecipeImportError("no_api_key", "AI-assisted recipe import is not configured on this server.");
  }

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: articleText }],
      output_config: { format: zodOutputFormat(llmRecipeSchema) },
    });
  } catch {
    throw new RecipeImportError("llm_error", "AI-assisted recipe import failed.");
  }

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new RecipeImportError("llm_malformed", "AI-assisted recipe import produced an unexpected result.");
  }

  const parsed = response.parsed_output;
  if (!parsed.found) return null;

  const candidate = {
    name: parsed.name?.trim() || "Imported recipe",
    tags: parsed.tags,
    instructions: parsed.instructions,
    ingredients: parsed.ingredients ?? [],
  };

  const validated = recipeSchema.safeParse(candidate);
  if (!validated.success) {
    throw new RecipeImportError("llm_malformed", "AI-assisted recipe import produced an unexpected result.");
  }

  return validated.data;
}
