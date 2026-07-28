import "dotenv/config";
import fs from "fs";
import path from "path";
import { runScrapePipeline, DEFAULT_SKILLS } from "../src/lib/scrapePipeline";
import { validateAndNormalizeJobUrl } from "../src/lib/linkValidator";
import { sendGig, telegramConfigured, delay } from "../src/lib/telegram";
import { Job } from "../src/types";

const DATA_FILE = path.join(process.cwd(), "data", "jobs.json");

function loadExisting(): Job[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Could not read existing jobs.json:", err);
  }
  return [];
}

async function main() {
  const { jobs: scraped, perSource, logs } = await runScrapePipeline(DEFAULT_SKILLS);
  logs.forEach((l) => console.log(l));

  const existing = loadExisting();
  const existingIds = new Set(existing.map((j) => j.id));

  const newlyAdded: Job[] = [];
  for (const job of scraped) {
    if (existingIds.has(job.id)) continue;
    const validated = validateAndNormalizeJobUrl(job.link, job.source, job.title, job.id);
    const enriched: Job = {
      ...job,
      link: validated.url,
      link_validated: true,
      link_status: validated.status,
    };
    existing.push(enriched);
    existingIds.add(job.id);
    newlyAdded.push(enriched);
  }

  const merged = existing.sort((a, b) => {
    const dt = (b.posted_ts || 0) - (a.posted_ts || 0);
    return dt !== 0 ? dt : (b.matched_skills?.length || 0) - (a.matched_skills?.length || 0);
  });

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`Saved ${merged.length} jobs (${newlyAdded.length} new) to data/jobs.json`);

  // Push new gigs to Telegram (only real links: DIRECT or SEARCH, never fallbacks).
  if (telegramConfigured()) {
    // Optional safety cap so a big first batch doesn't flood the chat.
    const cap = Number(process.env.TELEGRAM_MAX_SEND) || Infinity;
    const sendable = newlyAdded
      .filter((j) => j.link_status === "DIRECT" || j.link_status === "SEARCH")
      .slice(0, cap);
    console.log(`Telegram: sending ${sendable.length} new gig(s)...`);
    let sent = 0;
    for (const job of sendable) {
      if (await sendGig(job)) sent++;
      await delay(1200); // stay well under Telegram flood limits
    }
    console.log(`Telegram: delivered ${sent}/${sendable.length}.`);
  } else {
    console.log("Telegram: not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID unset) — skipping feed.");
  }

  const unhealthy = perSource.filter((s) => !s.ok);
  if (unhealthy.length) {
    console.log(`Note: ${unhealthy.length} source(s) unavailable: ${unhealthy.map((s) => s.name).join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Scrape script failed:", err);
  process.exit(1);
});
