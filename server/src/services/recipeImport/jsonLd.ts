import * as cheerio from "cheerio";
import { ParsedRecipe } from "../../schemas/recipe";
import { splitIngredientString } from "./ingredientSplit";

function hasRecipeType(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object") return false;
  const type = (node as Record<string, unknown>)["@type"];
  if (typeof type === "string") return type.toLowerCase() === "recipe";
  if (Array.isArray(type)) return type.some((t) => typeof t === "string" && t.toLowerCase() === "recipe");
  return false;
}

// JSON-LD blocks are sometimes a single object, an array of objects, or an
// object wrapping everything in "@graph". Flatten all of those into a list
// of candidate nodes and find the one that looks like a Recipe.
function findRecipeNode(parsed: unknown): Record<string, unknown> | null {
  const candidates: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidates.push(...parsed);
  } else if (parsed && typeof parsed === "object") {
    const graph = (parsed as Record<string, unknown>)["@graph"];
    if (Array.isArray(graph)) candidates.push(...graph);
    else candidates.push(parsed);
  }
  return (candidates.find(hasRecipeType) as Record<string, unknown> | undefined) ?? null;
}

function coerceToStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item): string[] => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        // HowToStep / HowToSection shapes
        const obj = item as Record<string, unknown>;
        if (typeof obj.text === "string") return [obj.text];
        if (Array.isArray(obj.itemListElement)) return coerceToStringArray(obj.itemListElement);
      }
      return [];
    });
  }
  return [];
}

export function extractJsonLdRecipe(html: string): ParsedRecipe | null {
  const $ = cheerio.load(html);
  let recipeNode: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeNode) return;
    const raw = $(el).contents().text();
    if (!raw?.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      recipeNode = findRecipeNode(parsed);
    } catch {
      // Some sites ship multiple JSON-LD blocks; skip ones that don't parse.
    }
  });

  if (!recipeNode) return null;

  const node = recipeNode as Record<string, unknown>;
  const name = typeof node.name === "string" ? node.name : "Imported recipe";

  const ingredients = coerceToStringArray(node.recipeIngredient).map(splitIngredientString);

  const instructions = coerceToStringArray(node.recipeInstructions).join("\n");

  const tagSource = [node.recipeCategory, node.keywords]
    .flatMap((v) => (typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : []))
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);
  const tags = tagSource.length ? Array.from(new Set(tagSource)).join(",") : undefined;

  return {
    name,
    tags,
    instructions: instructions || undefined,
    ingredients,
  };
}
