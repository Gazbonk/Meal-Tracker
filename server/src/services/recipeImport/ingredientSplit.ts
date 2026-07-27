import { ParsedIngredient } from "../../schemas/recipe";

const UNIT_WORDS = [
  "cups?",
  "tablespoons?",
  "tbsp",
  "teaspoons?",
  "tsp",
  "grams?",
  "kilograms?",
  "kg",
  "g",
  "ounces?",
  "oz",
  "pounds?",
  "lbs?",
  "milliliters?",
  "millilitres?",
  "ml",
  "liters?",
  "litres?",
  "l",
  "pinch(?:es)?",
  "cloves?",
  "slices?",
  "cans?",
  "handfuls?",
  "bunch(?:es)?",
  "packets?",
  "sprigs?",
  "sticks?",
];

// Leading quantity: digits, decimals, simple/mixed fractions ("1 1/2", "1/2", "1.5"),
// or a single unicode fraction character.
const QUANTITY = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])";

const INGREDIENT_PATTERN = new RegExp(
  `^\\s*(${QUANTITY})?\\s*(${UNIT_WORDS.join("|")})?\\b\\s*(?:of\\s+)?(.+?)\\s*$`,
  "i"
);

// Best-effort split of a free-text ingredient string (as schema.org JSON-LD
// provides them, e.g. "2 cups flour") into quantity/unit/name. Falls back to
// putting the whole string in `name` when nothing matches cleanly — the user
// reviews and can fix every imported ingredient before saving anyway.
export function splitIngredientString(raw: string): ParsedIngredient {
  const trimmed = raw.trim();
  const match = trimmed.match(INGREDIENT_PATTERN);

  if (!match || !match[3]) {
    return { name: trimmed };
  }

  const [, quantity, unit, name] = match;
  return {
    name: name.trim(),
    quantity: quantity?.trim() || undefined,
    unit: unit?.trim() || undefined,
  };
}
