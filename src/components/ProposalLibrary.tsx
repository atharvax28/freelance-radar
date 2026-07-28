import React, { useState } from "react";
import { Job } from "../types";
import { FileText, Copy, Download, Check, Sparkles, ExternalLink, Search } from "lucide-react";

interface ProposalLibraryProps {
  jobs: Job[];
  onOpenProposal: (job: Job) => void;
}

export const ProposalLibrary: React.FC<ProposalLibraryProps> = ({
  jobs,
  onOpenProposal
}) => {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const jobsWithProposals = jobs.filter(
    (j) => j.proposalText && j.proposalText.trim().length > 0
  );

  const filtered = jobsWithProposals.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.proposalText?.toLowerCase().includes(search.toLowerCase()) ||
      j.source.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (job: Job) => {
    if (!job.proposalText) return;
    const blob = new Blob([job.proposalText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proposal_${job.source.toLowerCase()}_${job.id}.md`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Saved Proposal Pitch Library
          </h2>
          <p className="text-xs text-slate-400">
            Access, export, and repurpose generated bids crafted for your past opportunities.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300 mb-1">No generated proposals found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you generate AI Proposal Pitches from the Radar Feed, they will automatically appear here for easy copy-pasting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                    {job.source}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-medium">
                    {job.budget}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm mb-2 hover:text-indigo-300">
                  <a href={job.link} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                    {job.title} <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </h3>

                {/* Proposal Text Box */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 line-clamp-6 leading-relaxed whitespace-pre-wrap">
                  {job.proposalText}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => onOpenProposal(job)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Edit in Studio
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(job.id, job.proposalText || "")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedId === job.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === job.id ? "Copied!" : "Copy"}
                  </button>

                  <button
                    onClick={() => handleDownload(job)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg text-xs border border-slate-700 transition"
                    title="Export as Markdown"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
