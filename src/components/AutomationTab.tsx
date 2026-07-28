import React, { useState } from "react";
import { RefreshCw, Play, Terminal, CheckCircle2, Copy, FileCode, Clock, ShieldCheck, ExternalLink } from "lucide-react";

interface AutomationTabProps {
  logs: string[];
  onTriggerScrape: () => void;
  isScraping: boolean;
}

export const AutomationTab: React.FC<AutomationTabProps> = ({
  logs,
  onTriggerScrape,
  isScraping
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  const nodeScraperCode = `// scripts/scrape.ts — runs the shared Node pipeline, merges into
// data/jobs.json, and pushes any NEW gigs to Telegram.
//
// Real, working sources (each returns valid, direct posting URLs):
//   • RemoteOK        https://remoteok.com/api
//   • Remotive        https://remotive.com/api/remote-jobs
//   • Arbeitnow       https://www.arbeitnow.com/api/job-board-api
//   • WeWorkRemotely  category RSS feed
//   • HackerNews      https://hn.algolia.com/api (Algolia search)
//   • Reddit          r/forhire new.json  (skipped gracefully if blocked)
//   • Web Search      Google Programmable Search — opt-in, free 100/day
//                     (only runs when GOOGLE_CSE_KEY + GOOGLE_CSE_CX are set)
//
// Links are never fabricated: validateAndNormalizeJobUrl() keeps the real
// scraped URL and only falls back to a real Google search when a link is
// missing. Run locally with:  npx tsx scripts/scrape.ts

import { runScrapePipeline, DEFAULT_SKILLS } from "../src/lib/scrapePipeline";
import { sendGig, telegramConfigured } from "../src/lib/telegram";

const { jobs, perSource, logs } = await runScrapePipeline(DEFAULT_SKILLS);
// ...merge into data/jobs.json, then sendGig() each new gig to Telegram.`;

  const githubWorkflowCode = `name: Scrape Freelance Jobs

on:
  schedule:
    - cron: '*/20 * * * *'  # Runs every 20 minutes
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run scraper + push Telegram feed
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          GOOGLE_CSE_KEY: \${{ secrets.GOOGLE_CSE_KEY }}
          GOOGLE_CSE_CX: \${{ secrets.GOOGLE_CSE_CX }}
        run: npx tsx scripts/scrape.ts
      - name: Commit and push changes
        run: |
          git config --global user.name 'GitHub Action Bot'
          git config --global user.email 'action@github.com'
          git add data/jobs.json
          git commit -m "Auto-update scraped freelance jobs [skip ci]" || exit 0
          git push`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> GitHub Action Cron: Every 20m
            </span>
            <span className="text-xs text-slate-400">• Telegram live feed</span>
          </div>
          <h2 className="text-base font-bold text-slate-100">Scraper Pipeline & Automation Center</h2>
          <p className="text-xs text-slate-400">
            This dashboard reads <code className="text-indigo-400 font-mono">data/jobs.json</code>, updated by the Node scrape pipeline (<code className="text-indigo-400 font-mono">scripts/scrape.ts</code>). New gigs are pushed to Telegram.
          </p>
        </div>

        <button
          onClick={onTriggerScrape}
          disabled={isScraping}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          {isScraping ? "Scraping Feeds..." : "Run Manual Scrape Trigger"}
        </button>
      </div>

      {/* Terminal Output */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">Pipeline Execution Output Terminal</span>
          </div>
          <span className="text-[11px] text-slate-600">{logs.length} Log Lines</span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1 py-1">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No execution logs yet. Click "Run Manual Scrape Trigger" above to test live parsing.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-indigo-500 font-bold">&gt;</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Code Inspector Tabs / Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Script */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-200">1. Node Scraper (<code className="text-indigo-300 font-mono text-xs">scripts/scrape.ts</code>)</h3>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(nodeScraperCode);
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1"
            >
              {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 max-h-56 overflow-y-auto leading-tight">
            {nodeScraperCode}
          </pre>
        </div>

        {/* GitHub Workflow */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-200">2. Cron Workflow (<code className="text-amber-300 font-mono text-xs">.github/workflows/scrape.yml</code>)</h3>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(githubWorkflowCode);
                setCopiedWorkflow(true);
                setTimeout(() => setCopiedWorkflow(false), 2000);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1"
            >
              {copiedWorkflow ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWorkflow ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 max-h-56 overflow-y-auto leading-tight">
            {githubWorkflowCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
