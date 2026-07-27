export type RecipeImportErrorCode =
  | "fetch_failed"
  | "not_found"
  | "timeout"
  | "blocked"
  | "no_recipe_found"
  | "no_api_key"
  | "llm_malformed"
  | "llm_error";

export class RecipeImportError extends Error {
  code: RecipeImportErrorCode;

  constructor(code: RecipeImportErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
