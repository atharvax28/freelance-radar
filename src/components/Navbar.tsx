import React from "react";
import { Key, User, RefreshCw, Layers, LayoutGrid, FileText, Terminal, Zap, ShieldCheck } from "lucide-react";

interface NavbarProps {
  jobCount: number;
  activeTab: "radar" | "kanban" | "library" | "automation";
  setActiveTab: (tab: "radar" | "kanban" | "library" | "automation") => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenTerminal: () => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
  onValidateLinks?: () => void;
  isValidatingLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  jobCount,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onTriggerScrape,
  isScraping,
  onValidateLinks,
  isValidatingLinks
}) => {
  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 backdrop-blur-md z-30 select-none">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase flex items-center gap-2 leading-none">
            Freelance Radar
            <span className="text-indigo-400 font-mono text-[10px] px-1.5 py-0.5 border border-indigo-500/30 rounded bg-indigo-500/10">
              v2.4.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Netlify Dashboard • Atharva's Command Center
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab("radar")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === "radar"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Radar
        </button>

        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === "kanban"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Pipeline
        </button>

        <button
          onClick={() => setActiveTab("library")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === "library"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Proposals
        </button>

        <button
          onClick={() => setActiveTab("automation")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === "automation"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          Automation
        </button>
      </div>

      {/* System Status & Action Controls */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden lg:flex items-center gap-4 border-r border-slate-800 pr-6">
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500 font-bold leading-none">Scraper Status</p>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">Active • Every 20m</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500 font-bold leading-none">Scraped Feed</p>
            <p className="text-xs text-amber-400 font-mono mt-0.5">{jobCount} Gigs Tracked</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onValidateLinks && (
            <button
              onClick={onValidateLinks}
              disabled={isValidatingLinks}
              className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-800/60 transition disabled:opacity-50 cursor-pointer"
              title="Validate & Normalize all job posting links to direct URLs"
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${isValidatingLinks ? "animate-pulse" : ""}`} />
              {isValidatingLinks ? "Validating..." : "Validate Links"}
            </button>
          )}

          <button
            onClick={onTriggerScrape}
            disabled={isScraping}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold border border-indigo-500 shadow-md shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isScraping ? "animate-spin" : ""}`} />
            {isScraping ? "Scraping All..." : "Scrape"}
          </button>

          <button
            onClick={onOpenSettings}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            LLM API
          </button>

          <button
            onClick={onOpenProfile}
            className="bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-800/60 flex items-center gap-1.5 transition"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            Profile
          </button>
        </div>
      </div>
    </nav>
  );
};
