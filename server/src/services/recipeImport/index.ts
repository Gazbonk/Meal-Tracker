import { ParsedRecipe } from "../../schemas/recipe";
import { fetchPage } from "./fetchPage";
import { extractJsonLdRecipe } from "./jsonLd";
import { extractArticleText } from "./articleText";
import { extractRecipeWithLlm } from "./llmExtractor";
import { RecipeImportError } from "./types";

export async function importRecipeFromUrl(url: string): Promise<ParsedRecipe & { sourceUrl: string }> {
  const { html } = await fetchPage(url);

  const fromJsonLd = extractJsonLdRecipe(html);
  if (fromJsonLd) {
    return { ...fromJsonLd, sourceUrl: url };
  }

  // No structured recipe markup on the page — the normal case for
  // general-purpose blogging/newsletter platforms like Substack. Fall back
  // to extracting the article body and asking an LLM to find the recipe.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new RecipeImportError(
      "no_api_key",
      "Couldn't find structured recipe data on that page, and AI-assisted import isn't configured."
    );
  }

  const articleText = extractArticleText(html);
  const fromLlm = await extractRecipeWithLlm(articleText);
  if (!fromLlm) {
    throw new RecipeImportError("no_recipe_found", "Couldn't find a recipe in that page.");
  }

  return { ...fromLlm, sourceUrl: url };
}

export { RecipeImportError } from "./types";
