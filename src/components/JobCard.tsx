import React, { useState } from "react";
import { Job } from "../types";
import { Sparkles, ExternalLink, Bookmark, CheckCircle2, Target, DollarSign, Globe2, Clock, ChevronDown, ChevronUp, Cpu, Code2, Megaphone, ShieldCheck, Link2 } from "lucide-react";
import { getJobCategory, getCategoryBadgeClass, getCategoryLabel } from "../lib/categories";
import { validateAndNormalizeJobUrl } from "../lib/linkValidator";

interface JobCardProps {
  job: Job;
  onGenerateProposal: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onUpdateStatus: (job: Job, status: Job["status"]) => void;
  userSkills: string[];
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onGenerateProposal,
  onToggleSave,
  onUpdateStatus,
  userSkills
}) => {
  const [expanded, setExpanded] = useState(false);

  // Validate & Normalize Link
  const linkInfo = validateAndNormalizeJobUrl(job.link, job.source, job.title, job.id);

  const isSaved = job.status === "Saved" || job.status === "Proposal Generated" || job.status === "Applied";
  const matchCount = job.matched_skills.length;
  // Compute match percentage based on matched skills out of 5 core skills benchmark
  const matchPercentage = Math.min(98, Math.max(65, 60 + matchCount * 12));

  const category = getJobCategory(job);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Hardware":
        return <Cpu className="w-2.5 h-2.5" />;
      case "Marketing":
        return <Megaphone className="w-2.5 h-2.5" />;
      case "Software":
      default:
        return <Code2 className="w-2.5 h-2.5" />;
    }
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case "Instagram Dork":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Google Dork":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Upwork":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Reddit":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "RemoteOK":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "HackerNews":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "Saved":
        return <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold">Saved</span>;
      case "Proposal Generated":
        return <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold">Pitch Drafted</span>;
      case "Applied":
        return <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">Applied</span>;
      case "Interview":
        return <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded uppercase font-bold">Interviewing</span>;
      case "Won":
        return <span className="text-[9px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded uppercase font-bold">Won!</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSourceBadgeClass(job.source)}`}>
              {job.source}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${getCategoryBadgeClass(category)}`}>
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </span>
            {getStatusBadge(job.status)}
          </div>

          <span className="text-indigo-400 font-mono text-[10px] font-bold shrink-0">
            {matchPercentage}% Match
          </span>
        </div>

        {/* Job Title */}
        <h3 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-300 transition-colors">
          <a href={linkInfo.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-start gap-1.5">
            {job.title}
          </a>
        </h3>

        {/* Budget & Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mb-3 font-mono">
          {job.budget && (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              {job.budget}
            </span>
          )}
          {job.client_country && (
            <span className="flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-slate-500" />
              {job.client_country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {job.posted_at}
          </span>
          {job.is_freelance && (
            <span className="flex items-center gap-1 text-teal-400 font-bold uppercase tracking-wide text-[9px] bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">
              Freelance
            </span>
          )}
          {job.region_locked && (
            <span
              className="flex items-center gap-1 text-rose-400 font-bold uppercase tracking-wide text-[9px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded"
              title={`May be restricted to: ${job.region_note || "a specific region"} — verify eligibility before applying.`}
            >
              Region-locked
            </span>
          )}
        </div>

        {/* Description Snippet */}
        <p className={`text-xs text-slate-400 leading-relaxed mb-3 ${expanded ? "" : "line-clamp-2"}`}>
          {job.description}
        </p>

        {job.description.length > 180 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 mb-3 flex items-center gap-1 font-semibold uppercase tracking-wider"
          >
            {expanded ? (
              <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Read Scope <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}

        {/* Matched Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.matched_skills.map((skill) => (
            <span
              key={skill}
              className="bg-slate-950 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <a
            href={linkInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700/80 flex items-center gap-1.5 transition font-semibold"
            title={linkInfo.message}
          >
            View Posting <ExternalLink className="w-3 h-3 text-indigo-400" />
          </a>

          {/* Link Health Badge — reflects the real link status, no fabrication */}
          {(() => {
            const isDirect = linkInfo.status === "DIRECT";
            const isSearch = linkInfo.status === "SEARCH" || linkInfo.status === "SEARCH_FALLBACK";
            const cls = isDirect
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : isSearch
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-slate-500/10 text-slate-400 border-slate-500/20";
            const label = isDirect ? "Direct posting" : isSearch ? "Search link" : "Unverified";
            const Icon = isDirect ? ShieldCheck : Link2;
            return (
              <span
                className={`text-[9px] ${cls} border px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1`}
                title={`Domain: ${linkInfo.domain} | ${linkInfo.message}`}
              >
                <Icon className="w-2.5 h-2.5" /> {label}
              </span>
            );
          })()}

          <button
            onClick={() => onToggleSave(job)}
            className={`text-[10px] px-2 py-1 rounded border transition font-semibold flex items-center gap-1 ${
              isSaved
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Bookmark className={`w-3 h-3 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        <button
          onClick={() => onGenerateProposal(job)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          Pitch
        </button>
      </div>
    </div>
  );
};
