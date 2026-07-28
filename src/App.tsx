import React, { useState, useEffect } from "react";
import { Job, UserProfile, LLMConfig, JobSource } from "./types";
import { DEFAULT_PROFILE, COMMON_SKILLS_HIGHLIGHT } from "./lib/constants";
import { getJobCategory, DomainCategory, getCategoryBadgeClass, getCategoryLabel } from "./lib/categories";
import { Navbar } from "./components/Navbar";
import { JobCard } from "./components/JobCard";
import { ProposalModal } from "./components/ProposalModal";
import { LLMSettingsModal } from "./components/LLMSettingsModal";
import { ProfileModal } from "./components/ProfileModal";
import { KanbanBoard } from "./components/KanbanBoard";
import { ProposalLibrary } from "./components/ProposalLibrary";
import { AutomationTab } from "./components/AutomationTab";
import { Search, Filter, Sparkles, SlidersHorizontal, ArrowUpDown, RefreshCw, X, Tag, Globe, Cpu, Code2, Megaphone, Layers } from "lucide-react";

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeLogs, setScrapeLogs] = useState<string[]>([]);
  const [isValidatingLinks, setIsValidatingLinks] = useState<boolean>(false);
  const [linkValidationMsg, setLinkValidationMsg] = useState<string | null>(null);

  // Modals & Navigation
  const [activeTab, setActiveTab] = useState<"radar" | "kanban" | "library" | "automation">("radar");
  const [proposalJob, setProposalJob] = useState<Job | null>(null);
  const [showLLMSettings, setShowLLMSettings] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // User Profile & LLM Config
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("freelance_user_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => {
    const savedKey = localStorage.getItem("llm_key") || "";
    const savedProvider = (localStorage.getItem("llm_provider") as any) || "groq";
    return { provider: savedProvider, apiKey: savedKey };
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | DomainCategory>("ALL");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "newest" | "budget">("newest");

  // Fetch initial jobs from backend Express route
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Save profile updates
  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem("freelance_user_profile", JSON.stringify(newProfile));
  };

  // Save LLM Config
  const handleSaveLLMConfig = (newConfig: LLMConfig) => {
    setLLMConfig(newConfig);
    localStorage.setItem("llm_provider", newConfig.provider);
    localStorage.setItem("llm_key", newConfig.apiKey);
  };

  // Manual Trigger Scraper Pipeline
  const handleTriggerScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSkills: userProfile.skills })
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setScrapeLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Scraper failed:", err);
    } finally {
      setIsScraping(false);
    }
  };

  // Trigger Link Validator Endpoint
  const handleValidateLinks = async () => {
    setIsValidatingLinks(true);
    try {
      const res = await fetch("/api/links/validate", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setLinkValidationMsg(`✓ ${data.message}`);
        setTimeout(() => setLinkValidationMsg(null), 6000);
      }
    } catch (err) {
      console.error("Link validation error:", err);
    } finally {
      setIsValidatingLinks(false);
    }
  };

  // Toggle Save Job
  const handleToggleSaveJob = async (job: Job) => {
    const newStatus = job.status === "Saved" ? "Discovered" : "Saved";
    handleUpdateJobStatus(job.id, newStatus);
  };

  // Update Job Status / Proposal
  const handleUpdateJobStatus = async (jobId: string, newStatus: Job["status"], proposalText?: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, proposalText })
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === jobId) {
              return {
                ...j,
                status: newStatus,
                proposalText: proposalText !== undefined ? proposalText : j.proposalText
              };
            }
            return j;
          })
        );
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
    }
  };

  // Skill Chip Filter Toggle
  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Filter & Sort Logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.matched_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = sourceFilter === "ALL" || job.source === sourceFilter;

    const matchesCategory =
      categoryFilter === "ALL" || getJobCategory(job) === categoryFilter;

    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.every((s) => job.matched_skills.includes(s));

    return matchesSearch && matchesSource && matchesCategory && matchesSkills;
  });

  const parseBudget = (s: string) => {
    const m = (s || "").replace(/,/g, "").match(/\d+/g);
    return m ? Math.max(...m.map(Number)) : 0;
  };
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "match") {
      return b.matched_skills.length - a.matched_skills.length;
    }
    if (sortBy === "budget") {
      return parseBudget(b.budget) - parseBudget(a.budget);
    }
    // newest: by posting timestamp, then by match strength
    const dt = (b.posted_ts || 0) - (a.posted_ts || 0);
    return dt !== 0 ? dt : b.matched_skills.length - a.matched_skills.length;
  });

  return (
    <div className="bg-[#020617] text-slate-200 min-h-screen font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Navbar
        jobCount={jobs.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowLLMSettings(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenTerminal={() => setActiveTab("automation")}
        onTriggerScrape={handleTriggerScrape}
        isScraping={isScraping}
        onValidateLinks={handleValidateLinks}
        isValidatingLinks={isValidatingLinks}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full px-4 lg:px-6 py-4 gap-6">
        {/* Sidebar Controls (High Density Theme) */}
        {activeTab === "radar" && (
          <aside className="w-full md:w-64 border border-slate-800 bg-slate-900/30 p-4 rounded-xl flex flex-col gap-6 shrink-0 h-fit">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Global Filter</label>
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-600 font-mono"
                  />
                </div>
                <button
                  onClick={handleTriggerScrape}
                  disabled={isScraping}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
                  {isScraping ? "Scraping All Engines..." : "Scrape"}
                </button>
              </div>

              {/* Master Category Filter Section */}
              <div className="mb-4 pt-2 border-t border-slate-800/60">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Layers className="w-3 h-3 text-indigo-400" /> Domain Category
                  </span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">Master</span>
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => setCategoryFilter("ALL")}
                    className={`w-full flex items-center justify-between text-xs p-2 rounded-lg transition-all ${
                      categoryFilter === "ALL"
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> All Domains
                    </span>
                    <span className="font-mono text-[11px] opacity-80">{jobs.length}</span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter("Software")}
                    className={`w-full flex items-center justify-between text-xs p-2 rounded-lg transition-all ${
                      categoryFilter === "Software"
                        ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Software & Tech
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {jobs.filter((j) => getJobCategory(j) === "Software").length}
                    </span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter("Hardware")}
                    className={`w-full flex items-center justify-between text-xs p-2 rounded-lg transition-all ${
                      categoryFilter === "Hardware"
                        ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" /> Hardware & Embedded
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {jobs.filter((j) => getJobCategory(j) === "Hardware").length}
                    </span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter("Marketing")}
                    className={`w-full flex items-center justify-between text-xs p-2 rounded-lg transition-all ${
                      categoryFilter === "Marketing"
                        ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-emerald-400" /> SEO & Marketing
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {jobs.filter((j) => getJobCategory(j) === "Marketing").length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Source Filters */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Sources</label>
                <div className="space-y-1">
                <button
                  onClick={() => setSourceFilter("ALL")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "ALL"
                      ? "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>All Sources</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("Remotive")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "Remotive"
                      ? "bg-teal-500/10 text-teal-300 font-bold border border-teal-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>Remotive</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "Remotive").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("Arbeitnow")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "Arbeitnow"
                      ? "bg-sky-500/10 text-sky-300 font-bold border border-sky-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>Arbeitnow</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "Arbeitnow").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("WeWorkRemotely")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "WeWorkRemotely"
                      ? "bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>We Work Remotely</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "WeWorkRemotely").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("Jobicy")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "Jobicy"
                      ? "bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>Jobicy</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "Jobicy").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("Web Search")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "Web Search"
                      ? "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>Web Search</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "Web Search").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("Reddit")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "Reddit"
                      ? "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>Reddit Hiring</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "Reddit").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("HackerNews")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "HackerNews"
                      ? "bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>HackerNews</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "HackerNews").length}</span>
                </button>
                <button
                  onClick={() => setSourceFilter("RemoteOK")}
                  className={`w-full flex items-center justify-between text-xs p-2 rounded transition-colors ${
                    sourceFilter === "RemoteOK"
                      ? "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <span>RemoteOK</span>
                  <span className="font-mono opacity-60 text-[11px]">{jobs.filter((j) => j.source === "RemoteOK").length}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">System Stats</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 mb-1 font-bold">MATCH RATE</p>
                  <p className="text-lg font-mono text-white font-bold">84%</p>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 mb-1 font-bold">DRAFTS</p>
                  <p className="text-lg font-mono text-white font-bold">{jobs.filter((j) => j.proposalText).length}</p>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-3.5">
                <p className="text-xs font-bold text-indigo-300 mb-2">Proposals Remaining</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mb-2.5">
                  <div className="bg-indigo-500 h-full rounded-full w-[82%]"></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Provider: <span className="text-white font-mono">{llmConfig.provider === "gemini" ? "Gemini 2.0 Flash" : llmConfig.provider.toUpperCase()}</span> (Free Tier)
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full space-y-6">
          {/* TAB 1: Radar Feed */}
          {activeTab === "radar" && (
            <div className="space-y-4">
              {linkValidationMsg && (
                <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-fade-in font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    {linkValidationMsg}
                  </span>
                  <button onClick={() => setLinkValidationMsg(null)} className="text-emerald-400 hover:text-white font-bold ml-3 text-sm">
                    ✕
                  </button>
                </div>
              )}

              {/* Filter Bar & Quick Skills Chips */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                {/* Domain Category Master Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800/60 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Master Domain:
                  </span>
                  <button
                    onClick={() => setCategoryFilter("ALL")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      categoryFilter === "ALL"
                        ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <Layers className="w-3 h-3" /> All
                  </button>
                  <button
                    onClick={() => setCategoryFilter("Software")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      categoryFilter === "Software"
                        ? "bg-cyan-600 text-white font-bold shadow-sm shadow-cyan-500/30"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <Code2 className="w-3 h-3 text-cyan-400" /> Software & Tech
                  </button>
                  <button
                    onClick={() => setCategoryFilter("Hardware")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      categoryFilter === "Hardware"
                        ? "bg-amber-600 text-white font-bold shadow-sm shadow-amber-500/30"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <Cpu className="w-3 h-3 text-amber-400" /> Hardware & Embedded
                  </button>
                  <button
                    onClick={() => setCategoryFilter("Marketing")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      categoryFilter === "Marketing"
                        ? "bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/30"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <Megaphone className="w-3 h-3 text-emerald-400" /> SEO & Marketing
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="match">Relevance Match</option>
                      <option value="newest">Most Recent</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      Showing {sortedJobs.length} of {jobs.length} Opportunities
                    </span>
                    <button
                      onClick={handleTriggerScrape}
                      disabled={isScraping}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
                      {isScraping ? "Scraping..." : "Scrape"}
                    </button>
                  </div>
                </div>

                {/* Quick Skill Chips Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs">
                  <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-indigo-400" /> Filter:
                  </span>
                  {COMMON_SKILLS_HIGHLIGHT.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkillFilter(skill)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition shrink-0 border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                  {selectedSkills.length > 0 && (
                    <button
                      onClick={() => setSelectedSkills([])}
                      className="text-[10px] text-amber-400 hover:underline px-2 py-0.5 shrink-0 uppercase font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Opportunity Results Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-48 animate-pulse" />
                  ))}
                </div>
              ) : sortedJobs.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-10 text-center">
                  <p className="text-slate-400 text-xs font-medium">No matching freelance opportunities found.</p>
                  <button
                    onClick={handleTriggerScrape}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"
                  >
                    Trigger Feed Scraper
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sortedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onGenerateProposal={(j) => setProposalJob(j)}
                      onToggleSave={handleToggleSaveJob}
                      onUpdateStatus={(j, s) => handleUpdateJobStatus(j.id, s)}
                      userSkills={userProfile.skills}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Pipeline Kanban */}
          {activeTab === "kanban" && (
            <KanbanBoard
              jobs={jobs}
              onOpenProposal={(j) => setProposalJob(j)}
              onUpdateStatus={handleUpdateJobStatus}
            />
          )}

          {/* TAB 3: Saved Proposal Library */}
          {activeTab === "library" && (
            <ProposalLibrary
              jobs={jobs}
              onOpenProposal={(j) => setProposalJob(j)}
            />
          )}

          {/* TAB 4: Automation & Cron Terminal */}
          {activeTab === "automation" && (
            <AutomationTab
              logs={scrapeLogs}
              onTriggerScrape={handleTriggerScrape}
              isScraping={isScraping}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {proposalJob && (
        <ProposalModal
          job={proposalJob}
          onClose={() => setProposalJob(null)}
          userProfile={userProfile}
          llmConfig={llmConfig}
          onOpenSettings={() => {
            setProposalJob(null);
            setShowLLMSettings(true);
          }}
          onSaveProposalToJob={(jobId, text, status) => handleUpdateJobStatus(jobId, status, text)}
        />
      )}

      {showLLMSettings && (
        <LLMSettingsModal
          config={llmConfig}
          onSave={handleSaveLLMConfig}
          onClose={() => setShowLLMSettings(false)}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          profile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Footer Status Bar (High Density Theme) */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 text-[10px] text-slate-500 font-mono select-none">
        <div className="flex gap-4">
          <span>DB: data/jobs.json updated {isScraping ? "Scraping..." : "2m ago"}</span>
          <span className="hidden sm:inline">Mem: 142MB / 512MB</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-emerald-500 flex items-center gap-1">
            ● <span className="text-slate-500">Action Bot: Healthy</span>
          </span>
          <span className="hidden sm:inline">Netlify Production Node</span>
        </div>
      </footer>
    </div>
  );
}
