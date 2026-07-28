export interface LinkValidationResult {
  url: string;
  originalUrl: string;
  isValid: boolean;
  isDirectPosting: boolean;
  status: "DIRECT" | "SEARCH" | "SEARCH_FALLBACK" | "INVALID_URL";
  domain: string;
  message: string;
}

// Heuristic: does this URL point at a search / tag / listing page rather than a
// single job posting? Used ONLY to label the link honestly — never to rewrite it.
function looksLikeSearchOrListing(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("google.com/search") ||
    u.includes("/search") ||
    u.includes("q=") ||
    u.includes("/explore/tags/") ||
    u.includes("/jobs.rss") ||
    (u.endsWith("/jobs") && !u.includes("news.ycombinator.com")) ||
    u.includes("reddit.com/r/forhire/search")
  );
}

/**
 * Normalize a scraped job URL WITHOUT ever fabricating one.
 * - A real absolute http(s) URL is kept verbatim and labelled DIRECT or SEARCH.
 * - An empty/malformed URL falls back to a real Google search for the title,
 *   which actually resolves (honest), and is marked invalid.
 */
export function validateAndNormalizeJobUrl(
  rawUrl: string,
  source: string = "",
  title: string = "",
  _id: string = ""
): LinkValidationResult {
  const originalUrl = rawUrl ? rawUrl.trim() : "";

  // No usable URL → honest, working fallback (a real search that resolves).
  if (!originalUrl || !/^https?:\/\//i.test(originalUrl)) {
    const query = [title, source].filter(Boolean).join(" ").trim() || "freelance job";
    return {
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      originalUrl,
      isValid: false,
      isDirectPosting: false,
      status: "SEARCH_FALLBACK",
      domain: "google.com",
      message: "No direct link was scraped — search fallback for the job title",
    };
  }

  let domain = "unknown";
  try {
    domain = new URL(originalUrl).hostname.replace(/^www\./, "");
  } catch {
    // Parsing failed despite the http(s) prefix — treat as fallback.
    const query = [title, source].filter(Boolean).join(" ").trim() || "freelance job";
    return {
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      originalUrl,
      isValid: false,
      isDirectPosting: false,
      status: "INVALID_URL",
      domain: "google.com",
      message: "Scraped URL could not be parsed — search fallback",
    };
  }

  const isSearch = looksLikeSearchOrListing(originalUrl);

  return {
    url: originalUrl, // keep the real, scraped URL — never rewritten
    originalUrl,
    isValid: true,
    isDirectPosting: !isSearch,
    status: isSearch ? "SEARCH" : "DIRECT",
    domain,
    message: isSearch
      ? "Search / listing page — opens results for this query"
      : "Direct job posting link",
  };
}
