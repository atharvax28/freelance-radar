import { Job } from "../types";

// Skill keyword set derived from freelance.md. Pure PCB/CAD-design terms
// (kicad, pcb design, schematic capture) are intentionally excluded so those
// roles are not surfaced — firmware/embedded/power-electronics are kept.
// Noise-prone generic words ("make", "sketch") are also omitted.
export const DEFAULT_SKILLS = [
  "python", "javascript", "typescript", "sql", "bash", "matlab", "c", "c++",
  "react", "next.js", "tailwind css", "d3.js", "react flow", "webrtc", "websocket",
  "html5", "css3", "gsap", "anime.js", "lenis",
  "fastapi", "flask", "node.js", ".net core", "rest apis", "jwt", "async i/o",
  "microservices", "system design", "agile/scrum",
  "postgresql", "mongodb", "redis", "sql server", "scrapy", "playwright", "selenium",
  "beautifulsoup", "pandas", "numpy", "etl", "apscheduler", "docker", "linux", "git",
  "aws", "ec2", "s3", "rds", "vercel", "ci/cd", "n8n",
  "pytorch", "xgboost", "gradient boosting", "shap", "scikit-learn", "nlp", "llm",
  "hugging face", "fine-tuning", "rag", "prompt engineering", "ai agents",
  "context engineering", "llm red-teaming", "llm inference optimization", "claude api",
  "feature engineering", "dataset curation", "model deployment", "mlops",
  "a/b testing", "anomaly detection", "fuzzy logic",
  "figma", "lunacy", "google stitch", "uxpilot ai", "design systems", "wireframing", "prototyping",
  "zapier", "notion", "slack", "canva", "microsoft teams", "sharepoint", "outlook", "monday.com",
  "data structures", "algorithms", "oop", "dsa",
  "esp32", "microcontroller programming", "firmware", "embedded", "rtos",
  "mosfet", "pwm", "adc", "boost converter", "mppt", "wireless power transfer",
  "i2c", "spi", "matlab/simulink", "pi/pid", "power factor correction", "feedback control",
];

export function matchSkills(text: string, skills: string[] = DEFAULT_SKILLS): string[] {
  const lower = (text || "").toLowerCase();
  const matched: string[] = [];
  for (const skill of skills) {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (pattern.test(lower)) matched.push(skill);
  }
  return matched;
}

// --- Filters -----------------------------------------------------------------

// Senior/lead/management titles to exclude for a 0–2 years profile.
const SENIOR_RX =
  /\b(senior|sr\.?|lead|staff|principal|architect|head\s+of|director|vp|vice\s+president|manager|expert-level|10x)\b/i;

// Explicit heavy-experience requirements (>= 5 years) → exclude.
function demandsTooMuchExperience(text: string): boolean {
  const m = (text || "").toLowerCase().match(/(\d{1,2})\s*\+?\s*years?/g) || [];
  return m.some((s) => {
    const n = parseInt(s, 10);
    return !isNaN(n) && n >= 5;
  });
}

function isSenior(title: string, desc: string): boolean {
  if (SENIOR_RX.test(title)) return true;
  return demandsTooMuchExperience(`${title} ${desc}`);
}

// CAD / PCB-design electrical roles the user does NOT want — unless the role is
// clearly firmware/embedded (which they DO want).
const PCB_CAD_RX =
  /\b(pcb\s*design|pcb\s*layout|schematic\s*(capture|design)|altium|eagle\s*cad|orcad|kicad|autocad|solidworks|catia|cad\s*(designer|drafter|drafting|engineer)|draughts?man|draftsman|mechanical\s*design|hardware\s*layout)\b/i;
const FIRMWARE_RX =
  /\b(firmware|embedded|esp32|micro-?controller|mcu|rtos|device\s*driver|bare\s*metal|iot)\b/i;

function isPcbCadDesign(title: string, desc: string): boolean {
  const text = `${title} ${desc}`;
  return PCB_CAD_RX.test(text) && !FIRMWARE_RX.test(text);
}

// Contract / freelance / part-time signal.
const FREELANCE_RX = /\b(freelance|freelancer|contract(?:or)?|part[-\s]?time|hourly rate|per hour|1099|independent contractor)\b/i;
function looksFreelance(text: string): boolean {
  return FREELANCE_RX.test(text || "");
}

// --- Region eligibility (India-based remote) ---------------------------------
// The user is in India: eligible for worldwide/unrestricted-remote roles, roles
// open to India/Asia/APAC, and India-based gigs. Roles locked to a region that
// excludes India are FLAGGED (not dropped).
const GLOBAL_OK_RX = /\b(worldwide|anywhere|global|remote worldwide|any location|fully remote|international)\b/i;
const INDIA_ASIA_RX = /\b(india|indian|bangalore|bengaluru|mumbai|new delhi|delhi|hyderabad|pune|chennai|kolkata|gurgaon|noida|asia|apac|asia[-\s]?pacific|emea)\b/i;
// Restriction signals: a region/timezone/citizenship that excludes India.
const RESTRICT_RX =
  /\b(us[-\s]?only|u\.?s\.?\s?citizen|green\s?card|must be (?:based |located )?(?:in |a )?(?:us|u\.s\.|usa|eu|uk|canada|australia)|eu only|europe only|uk only|us[-\s]?based|latam|latin america|brazil|americas|\bcst\b|\best\b|\bpst\b|\bpdt\b|\bedt\b|us timezones?|on[-\s]?site|onsite)\b/i;
// client_country values that mean "open remote", not a restriction.
const GENERIC_REMOTE_RX = /^\s*(remote|remote job|remote worldwide|worldwide|anywhere|global|remote \(global\)|web|yc network|remote worldwide|)\s*$/i;

function classifyRegion(job: Job): { locked: boolean; note: string } {
  const cc = (job.client_country || "").trim();
  const text = `${cc} ${job.description || ""}`;
  if (GLOBAL_OK_RX.test(text) || INDIA_ASIA_RX.test(text)) return { locked: false, note: "" };
  // Explicit restriction, or a concrete non-remote place in client_country.
  if (RESTRICT_RX.test(text)) return { locked: true, note: cc || "restricted region" };
  const isGenericRemote = GENERIC_REMOTE_RX.test(cc) || /remote/i.test(cc);
  if (cc && !isGenericRemote) return { locked: true, note: cc }; // e.g. "Munich", "USA", "London"
  return { locked: false, note: "" };
}

export interface SourceResult {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface PipelineResult {
  jobs: Job[]; // freshly scraped, filtered, newest-first (not yet merged)
  perSource: SourceResult[];
  logs: string[];
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FreelanceRadar/2.0";

function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}
function ts(): string {
  return new Date().toLocaleTimeString();
}
function toTs(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v; // seconds vs ms
  const t = Date.parse(String(v));
  return isNaN(t) ? 0 : t;
}
function fmtDate(tsMs: number): string {
  if (!tsMs) return "Recent";
  const diff = Date.now() - tsMs;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(tsMs).toLocaleDateString();
}

async function fetchText(url: string, timeoutMs = 15000): Promise<{ ok: boolean; status: number; text: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json, text/xml, */*" }, signal: ctrl.signal });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

// --- Individual sources ------------------------------------------------------

async function scrapeRemoteOK(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://remoteok.com/api");
    if (!ok) return { jobs: [], result: { name: "RemoteOK", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return { jobs: [], result: { name: "RemoteOK", ok: false, count: 0, error: "Unexpected response shape" } };
    const jobs: Job[] = [];
    for (const post of data.slice(1)) {
      if (!post || !post.position) continue;
      const desc = stripHtml(post.description || (post.tags || []).join(", "));
      const matched = matchSkills(`${post.position} ${desc} ${(post.tags || []).join(" ")}`, skills);
      if (matched.length < 1) continue;
      const link = post.url && String(post.url).startsWith("http")
        ? post.url
        : post.slug ? `https://remoteok.com/remote-jobs/${post.slug}` : "https://remoteok.com/remote-jobs";
      const posted_ts = toTs(post.date);
      jobs.push({
        id: `rok-${post.id || post.slug}`,
        title: post.position, description: desc.slice(0, 320), link, source: "RemoteOK",
        matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: post.salary_min ? `$${post.salary_min} - $${post.salary_max || Math.round(post.salary_min * 1.3)} / yr` : "Not specified",
        client_country: post.location || "Remote", status: "Discovered",
        is_freelance: looksFreelance(`${post.position} ${desc} ${(post.tags || []).join(" ")}`),
      });
    }
    return { jobs, result: { name: "RemoteOK", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "RemoteOK", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

async function scrapeReddit(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://www.reddit.com/r/forhire/new.json?limit=75");
    if (!ok) return { jobs: [], result: { name: "Reddit", ok: false, count: 0, error: `HTTP ${status} (likely rate-limited/blocked)` } };
    let data: any;
    try { data = JSON.parse(text); } catch { return { jobs: [], result: { name: "Reddit", ok: false, count: 0, error: "Non-JSON response (anti-bot page)" } }; }
    const children = data?.data?.children || [];
    const jobs: Job[] = [];
    for (const child of children) {
      const p = child?.data;
      if (!p || !(p.title || "").toLowerCase().includes("[hiring]")) continue;
      const desc = stripHtml(p.selftext || "");
      const matched = matchSkills(`${p.title} ${desc}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(p.created_utc);
      jobs.push({
        id: `reddit-${p.id}`, title: p.title, description: desc.slice(0, 320) || "See the r/forhire post for full scope.",
        link: p.permalink ? `https://www.reddit.com${p.permalink}` : "https://www.reddit.com/r/forhire/",
        source: "Reddit", matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: "Not specified", client_country: "Global", status: "Discovered", is_freelance: true,
      });
    }
    return { jobs, result: { name: "Reddit", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "Reddit", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

async function scrapeHackerNews(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText(
      "https://hn.algolia.com/api/v1/search_by_date?query=freelance+contract+hiring&tags=story&hitsPerPage=40"
    );
    if (!ok) return { jobs: [], result: { name: "HackerNews", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    const hits = data?.hits || [];
    const jobs: Job[] = [];
    for (const hit of hits) {
      if (!hit) continue;
      const title = hit.title || hit.story_title || "";
      const desc = stripHtml(hit.comment_text || hit.story_text || title);
      const matched = matchSkills(`${title} ${desc}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(hit.created_at);
      jobs.push({
        id: `hn-${hit.objectID}`, title: title || "HackerNews freelance opportunity", description: desc.slice(0, 320),
        link: hit.url && String(hit.url).startsWith("http") ? hit.url : `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: "HackerNews", matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: "Not specified", client_country: "YC Network", status: "Discovered",
        is_freelance: looksFreelance(`${title} ${desc}`),
      });
    }
    return { jobs, result: { name: "HackerNews", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "HackerNews", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

async function scrapeRemotive(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://remotive.com/api/remote-jobs?limit=100");
    if (!ok) return { jobs: [], result: { name: "Remotive", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    const list = data?.jobs || [];
    const jobs: Job[] = [];
    for (const j of list) {
      if (!j || !j.title || !j.url) continue;
      const desc = stripHtml(j.description || "");
      const matched = matchSkills(`${j.title} ${desc} ${(j.tags || []).join(" ")}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(j.publication_date);
      jobs.push({
        id: `remotive-${j.id}`, title: j.title, description: desc.slice(0, 320), link: j.url, source: "Remotive",
        matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: j.salary || "Not specified", client_country: j.candidate_required_location || "Remote", status: "Discovered",
        is_freelance: /contract|freelance|part/i.test(j.job_type || "") || looksFreelance(`${j.title} ${desc}`),
      });
    }
    return { jobs, result: { name: "Remotive", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "Remotive", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

async function scrapeArbeitnow(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://www.arbeitnow.com/api/job-board-api");
    if (!ok) return { jobs: [], result: { name: "Arbeitnow", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    const list = data?.data || [];
    const jobs: Job[] = [];
    for (const j of list) {
      if (!j || !j.title || !j.url) continue;
      const desc = stripHtml(j.description || "");
      const matched = matchSkills(`${j.title} ${desc} ${(j.tags || []).join(" ")}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(j.created_at);
      jobs.push({
        id: `arbeitnow-${j.slug}`, title: j.title, description: desc.slice(0, 320), link: j.url, source: "Arbeitnow",
        matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: "Not specified", client_country: j.location || (j.remote ? "Remote" : "On-site"), status: "Discovered",
        is_freelance: (j.job_types || []).some((t: string) => /contract|freelance|part/i.test(t)) || looksFreelance(`${j.title} ${desc}`),
      });
    }
    return { jobs, result: { name: "Arbeitnow", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "Arbeitnow", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

async function scrapeWeWorkRemotely(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://weworkremotely.com/categories/remote-programming-jobs.rss");
    if (!ok) return { jobs: [], result: { name: "WeWorkRemotely", ok: false, count: 0, error: `HTTP ${status}` } };
    const items = text.split(/<item>/i).slice(1);
    const jobs: Job[] = [];
    for (const raw of items) {
      const chunk = raw.split(/<\/item>/i)[0];
      const pick = (tag: string): string => {
        const m = chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
        return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
      };
      const title = stripHtml(pick("title"));
      const link = stripHtml(pick("link"));
      if (!title || !link.startsWith("http")) continue;
      const desc = stripHtml(pick("description"));
      const matched = matchSkills(`${title} ${desc}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(pick("pubDate"));
      jobs.push({
        id: `wwr-${link.split("/").filter(Boolean).pop()}`, title,
        description: desc.slice(0, 320) || "See the We Work Remotely listing for full scope.",
        link, source: "WeWorkRemotely", matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: "Not specified", client_country: "Remote", status: "Discovered", is_freelance: looksFreelance(`${title} ${desc}`),
      });
    }
    return { jobs, result: { name: "WeWorkRemotely", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "WeWorkRemotely", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

// Jobicy — free remote jobs board API (no auth). Good freelance/contract coverage.
async function scrapeJobicy(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  try {
    const { ok, status, text } = await fetchText("https://jobicy.com/api/v2/remote-jobs?count=50");
    if (!ok) return { jobs: [], result: { name: "Jobicy", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    const list = data?.jobs || [];
    const jobs: Job[] = [];
    for (const j of list) {
      if (!j || !j.jobTitle || !j.url) continue;
      const desc = stripHtml(j.jobExcerpt || j.jobDescription || "");
      const matched = matchSkills(`${j.jobTitle} ${desc} ${(j.jobIndustry || []).join(" ")}`, skills);
      if (matched.length < 1) continue;
      const posted_ts = toTs(j.pubDate);
      const types = Array.isArray(j.jobType) ? j.jobType.join(" ") : String(j.jobType || "");
      jobs.push({
        id: `jobicy-${j.id}`, title: j.jobTitle, description: desc.slice(0, 320), link: j.url, source: "Jobicy",
        matched_skills: matched, posted_at: fmtDate(posted_ts), posted_ts,
        budget: j.annualSalaryMin ? `$${j.annualSalaryMin} - $${j.annualSalaryMax || ""} / yr` : "Not specified",
        client_country: j.jobGeo || "Remote", status: "Discovered",
        is_freelance: /contract|freelance|part/i.test(types) || looksFreelance(`${j.jobTitle} ${desc}`),
      });
    }
    return { jobs, result: { name: "Jobicy", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "Jobicy", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

// Optional, opt-in, FREE (100 queries/day) real search engine. Only runs when
// GOOGLE_CSE_KEY + GOOGLE_CSE_CX are configured. Returns REAL result links.
async function scrapeGoogleCSE(skills: string[]): Promise<{ jobs: Job[]; result: SourceResult }> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return { jobs: [], result: { name: "Web Search (Google CSE)", ok: true, count: 0, error: "skipped — GOOGLE_CSE_KEY/CX not set" } };
  try {
    const topSkills = skills.slice(0, 4).join(" OR ");
    const q = `("hiring" OR "looking for") (freelance OR contract) (${topSkills}) (site:linkedin.com/jobs OR site:github.com)`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&num=10&q=${encodeURIComponent(q)}`;
    const { ok, status, text } = await fetchText(url);
    if (!ok) return { jobs: [], result: { name: "Web Search (Google CSE)", ok: false, count: 0, error: `HTTP ${status}` } };
    const data = JSON.parse(text);
    const items = data?.items || [];
    const jobs: Job[] = [];
    for (const it of items) {
      if (!it?.link || !it?.title) continue;
      const desc = stripHtml(it.snippet || "");
      const matched = matchSkills(`${it.title} ${desc}`, skills);
      jobs.push({
        id: `cse-${Buffer.from(it.link).toString("base64").slice(0, 16)}`, title: it.title, description: desc.slice(0, 320),
        link: it.link, source: "Web Search", matched_skills: matched.length ? matched : ["freelance"],
        posted_at: "From web search", posted_ts: 0, budget: "Not specified", client_country: "Web",
        status: "Discovered", is_freelance: true,
      });
    }
    return { jobs, result: { name: "Web Search (Google CSE)", ok: true, count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], result: { name: "Web Search (Google CSE)", ok: false, count: 0, error: err?.message || String(err) } };
  }
}

// --- Orchestrator ------------------------------------------------------------

export async function runScrapePipeline(userSkills: string[] = DEFAULT_SKILLS): Promise<PipelineResult> {
  const skills = userSkills && userSkills.length ? userSkills : DEFAULT_SKILLS;
  const recencyDays = Number(process.env.RECENCY_DAYS) || 60;
  const maxResults = Number(process.env.MAX_RESULTS) || 80;
  const cutoff = Date.now() - recencyDays * 24 * 60 * 60 * 1000;

  const logs: string[] = [];
  logs.push(`[${ts()}] Starting Freelance Radar pipeline — ${skills.length} skills, newest-first, ≤${maxResults} results, last ${recencyDays}d.`);

  const settled = await Promise.allSettled([
    scrapeRemoteOK(skills), scrapeRemotive(skills), scrapeArbeitnow(skills),
    scrapeWeWorkRemotely(skills), scrapeJobicy(skills), scrapeHackerNews(skills),
    scrapeReddit(skills), scrapeGoogleCSE(skills),
  ]);

  const raw: Job[] = [];
  const perSource: SourceResult[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") {
      raw.push(...s.value.jobs);
      perSource.push(s.value.result);
      const r = s.value.result;
      logs.push(r.ok ? `[${ts()}] ${r.name}: ${r.count} match(es)${r.error ? ` (${r.error})` : ""}.` : `[${ts()}] ⚠️ ${r.name} failed: ${r.error}.`);
    } else {
      perSource.push({ name: "unknown", ok: false, count: 0, error: String(s.reason) });
      logs.push(`[${ts()}] ⚠️ A source threw: ${String(s.reason)}`);
    }
  }

  // Apply user filters. Region-locked jobs are dropped UNLESS they are freelance
  // gigs (freelance/contract work is location-flexible, so keep + flag those).
  let dropSenior = 0, dropCad = 0, dropOld = 0, dropRegion = 0, keptFreelanceLocked = 0;
  const filtered = raw.filter((j) => {
    if (isSenior(j.title, j.description)) { dropSenior++; return false; }
    if (isPcbCadDesign(j.title, j.description)) { dropCad++; return false; }
    if (j.posted_ts && j.posted_ts < cutoff) { dropOld++; return false; }
    const r = classifyRegion(j);
    j.region_locked = r.locked;
    j.region_note = r.note;
    if (r.locked && !j.is_freelance) { dropRegion++; return false; }
    if (r.locked) keptFreelanceLocked++;
    return true;
  });

  // Dedupe by id and by link.
  const byKey = new Map<string, Job>();
  for (const j of filtered) {
    if (!byKey.has(j.id) && !byKey.has(j.link)) byKey.set(j.id, j);
  }

  // Newest first, then by skill-match strength; cap the total.
  const sorted = Array.from(byKey.values()).sort((a, b) => {
    const dt = (b.posted_ts || 0) - (a.posted_ts || 0);
    if (dt !== 0) return dt;
    return (b.matched_skills?.length || 0) - (a.matched_skills?.length || 0);
  });
  const capped = sorted.slice(0, maxResults);

  const okCount = perSource.filter((s) => s.ok).length;
  logs.push(`[${ts()}] Filtered out ${dropSenior} senior, ${dropCad} CAD/PCB, ${dropOld} stale, ${dropRegion} region-locked (kept ${keptFreelanceLocked} region-locked freelance gigs).`);
  logs.push(`[${ts()}] Pipeline complete — ${capped.length} jobs (newest first) from ${okCount}/${perSource.length} healthy sources.`);

  return { jobs: capped, perSource, logs };
}
