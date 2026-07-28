import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { validateAndNormalizeJobUrl } from "./src/lib/linkValidator";
import { runScrapePipeline, DEFAULT_SKILLS } from "./src/lib/scrapePipeline";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

const DATA_FILE = path.join(process.cwd(), "data", "jobs.json");

// Link normalization is now the shared, honest validator in
// src/lib/linkValidator.ts (it never fabricates URLs).

// Helper to load jobs from storage
function loadJobsFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((j: any) => {
          const validated = validateAndNormalizeJobUrl(j.link, j.source, j.title, j.id);
          return {
            ...j,
            link: validated.url,
            link_validated: true,
            link_status: validated.status
          };
        });
      }
    }
  } catch (err) {
    console.error("Error reading jobs.json:", err);
  }
  return [];
}

// Helper to save jobs to disk
function saveJobsToDisk(jobs: any[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing jobs.json:", err);
  }
}

// Global in-memory job state, initialized from disk
let currentJobs = loadJobsFromDisk();

// API Routes
app.get("/api/jobs", (req, res) => {
  if (currentJobs.length === 0) {
    currentJobs = loadJobsFromDisk();
  }
  res.json(currentJobs);
});

// Update Job Status / Saved State
app.patch("/api/jobs/:id", (req, res) => {
  const rawId = req.params.id;
  const id = decodeURIComponent(rawId);
  const { status, note, proposalText } = req.body || {};

  let index = currentJobs.findIndex((j: any) => j.id === id || j.id === rawId);
  if (index === -1) {
    // Reload from disk in case of fresh write
    currentJobs = loadJobsFromDisk();
    index = currentJobs.findIndex((j: any) => j.id === id || j.id === rawId);
  }

  if (index !== -1) {
    if (status !== undefined) currentJobs[index].status = status;
    if (note !== undefined) currentJobs[index].note = note;
    if (proposalText !== undefined) currentJobs[index].proposalText = proposalText;
    saveJobsToDisk(currentJobs);
    return res.json({ success: true, job: currentJobs[index] });
  }
  res.status(404).json({ error: "Job not found" });
});

// Validate and classify all job posting URLs (never rewrites real links)
app.post("/api/links/validate", (req, res) => {
  let direct = 0;
  let search = 0;
  let fallback = 0;

  currentJobs = currentJobs.map((job: any) => {
    const validated = validateAndNormalizeJobUrl(job.link, job.source, job.title, job.id);
    if (validated.status === "DIRECT") direct++;
    else if (validated.status === "SEARCH") search++;
    else fallback++;
    return {
      ...job,
      link: validated.url, // real link kept as-is; only empty/broken get a search fallback
      link_validated: true,
      link_status: validated.status
    };
  });

  saveJobsToDisk(currentJobs);

  res.json({
    success: true,
    total: currentJobs.length,
    direct,
    search,
    fallback,
    jobs: currentJobs,
    message: `Checked ${currentJobs.length} links — ${direct} direct, ${search} search/listing, ${fallback} needed a search fallback.`
  });
});

// Trigger Scraper Pipeline (shared implementation in src/lib/scrapePipeline.ts)
app.post("/api/jobs/scrape", async (req, res) => {
  try {
    const userSkills = req.body?.userSkills || DEFAULT_SKILLS;
    const { jobs: scraped, perSource, logs } = await runScrapePipeline(userSkills);

    // Merge new jobs into existing state, dedupe by id.
    const existingMap = new Map(currentJobs.map((j: any) => [j.id, j]));
    let addedCount = 0;
    for (const job of scraped) {
      if (!existingMap.has(job.id)) {
        // Classify the (real) link honestly on the way in.
        const validated = validateAndNormalizeJobUrl(job.link, job.source, job.title, job.id);
        existingMap.set(job.id, {
          ...job,
          link: validated.url,
          link_validated: true,
          link_status: validated.status
        });
        addedCount++;
      }
    }

    currentJobs = Array.from(existingMap.values()).sort((a: any, b: any) => {
      const dt = (b.posted_ts || 0) - (a.posted_ts || 0);
      return dt !== 0 ? dt : (b.matched_skills?.length || 0) - (a.matched_skills?.length || 0);
    });
    saveJobsToDisk(currentJobs);

    const healthy = perSource.filter((s) => s.ok).length;
    logs.push(`[${new Date().toLocaleTimeString()}] Merged ${addedCount} new opportunities. ${currentJobs.length} total.`);

    res.json({
      success: healthy > 0,
      addedCount,
      totalCount: currentJobs.length,
      perSource,
      logs,
      jobs: currentJobs
    });
  } catch (globalErr: any) {
    console.error("Scraper Pipeline Global Failure:", globalErr);
    res.status(500).json({
      success: false,
      error: globalErr.message,
      logs: [`[${new Date().toLocaleTimeString()}] PIPELINE ERROR: ${globalErr.message}`],
      jobs: currentJobs
    });
  }
});

// Generate AI Proposal Endpoint
app.post("/api/proposals/generate", async (req, res) => {
  const {
    jobTitle,
    jobDescription,
    matchedSkills = [],
    customApiKey,
    provider = "gemini",
    pitchTone = "concise",
    proposedRate = "$50/hr",
    proposedTimeline = "1 - 2 weeks",
    engineerProfile = {
      name: "Atharva Tayade",
      title: "Full-Stack (FastAPI/React), AI/LLM, and Embedded Systems Engineer",
      bio: "Experienced developer building robust web apps, high-throughput scraping bots, ESP32 IoT firmware, and RAG AI pipelines.",
      portfolio: [
        "FastAPI + React Dashboard with WebSockets",
        "ESP32 Microcontroller PWM & Sensor Telemetry",
        "RAG Legal & Document Q&A Pipeline with Gemini"
      ]
    }
  } = req.body;

  if (!jobTitle || !jobDescription) {
    return res.status(400).json({ error: "jobTitle and jobDescription are required" });
  }

  // System Prompt
  const systemPrompt = `You are a world-class freelance proposal strategist crafting winning bids for ${engineerProfile.name}, a ${engineerProfile.title}.
Engineer Bio: ${engineerProfile.bio}
Key Portfolio Assets: ${engineerProfile.portfolio.join("; ")}

Guidelines:
1. Pitch Tone: ${pitchTone === "concise" ? "Concise & direct (3 punchy paragraphs)" : pitchTone === "technical" ? "Deep technical authority & architecture plan" : "Value-focused & ROI oriented"}.
2. Proposed Rate/Budget: ${proposedRate} | Timeline: ${proposedTimeline}.
3. Highlight matching skills: ${matchedSkills.join(", ")}.
4. Structure:
   - Hook / Understanding of the core problem
   - Technical approach & exact deliverables
   - Why ${engineerProfile.name} (citing relevant real projects and technical skills)
   - Low-friction Call to Action (CTA)

Format with clean Markdown. Do NOT include generic buzzwords like "supercharge" or "empower". Be specific, technical, confident, and empathetic to the client's needs.`;

  const userPrompt = `JOB TITLE: ${jobTitle}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    // 1. If provider is Groq (requires a user or environment key — no baked-in secret)
    const groqKey = customApiKey || process.env.GROQ_API_KEY;
    if (provider === "groq") {
      if (!groqKey) {
        return res.status(400).json({
          error: "No Groq API key available. Configure GROQ_API_KEY in environment or provide a key in settings."
        });
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Groq API call failed");
      }
      return res.json({ proposal: data.choices[0].message.content, provider: "Groq Llama 3.3 (70B Versatile)" });
    }

    if (provider === "openrouter" && customApiKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${customApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "OpenRouter API call failed");
      }
      return res.json({ proposal: data.choices[0].message.content, provider: "OpenRouter Free Tier" });
    }

    // 2. Default: Server-Side Gemini API using @google/genai with process.env.GEMINI_API_KEY
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "No Gemini API key available. Configure GEMINI_API_KEY in environment or provide a key in settings."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const proposalText = response.text || "Failed to generate proposal content.";
    res.json({ proposal: proposalText, provider: "Google Gemini 2.0 Flash" });

  } catch (err: any) {
    console.error("Proposal Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate proposal pitch" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Freelance Radar server running on http://localhost:${PORT}`);
  });
}

startServer();
