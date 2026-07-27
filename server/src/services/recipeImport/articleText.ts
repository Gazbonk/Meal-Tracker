import * as cheerio from "cheerio";

const MAX_CHARS = 15_000;

// Generic content-container selectors, tried in order. ".available-content"
// is Substack's current post-body container — one option among several, so
// this isn't Substack-specific.
const CONTENT_SELECTORS = [
  "article",
  "main",
  '[itemprop="articleBody"]',
  ".post-content",
  ".entry-content",
  ".available-content",
];

export function extractArticleText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, aside, noscript").remove();
  $("*")
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();

  let text = "";
  for (const selector of CONTENT_SELECTORS) {
    const found = $(selector).first();
    if (found.length) {
      const candidate = found.text().replace(/\s+/g, " ").trim();
      if (candidate.length > 200) {
        text = candidate;
        break;
      }
    }
  }

  if (!text) {
    text = $("body").text().replace(/\s+/g, " ").trim();
  }

  return text.slice(0, MAX_CHARS);
}
