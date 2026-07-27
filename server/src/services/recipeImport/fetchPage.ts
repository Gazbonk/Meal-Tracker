import { RecipeImportError } from "./types";

const FETCH_TIMEOUT_MS = 10_000;
// A real browser UA — some sites/CDNs block default Node/fetch user agents outright.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function fetchPage(url: string): Promise<{ html: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new RecipeImportError("fetch_failed", "That doesn't look like a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new RecipeImportError("fetch_failed", "Only http/https URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new RecipeImportError("timeout", "Timed out fetching that page.");
    }
    throw new RecipeImportError("fetch_failed", "Couldn't reach that URL.");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 404) {
    throw new RecipeImportError("not_found", "That page wasn't found (404).");
  }
  if (res.status === 403 || res.status === 429) {
    throw new RecipeImportError("blocked", "That site blocked the request.");
  }
  if (!res.ok) {
    throw new RecipeImportError("fetch_failed", `That page returned an error (${res.status}).`);
  }

  const html = await res.text();
  return { html };
}
