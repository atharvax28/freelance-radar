import React, { useState } from "react";
import { Job, UserProfile, LLMConfig } from "../types";
import { X, Sparkles, Copy, Check, Download, Send, RefreshCw, Key, ShieldCheck, Edit3 } from "lucide-react";

interface ProposalModalProps {
  job: Job | null;
  onClose: () => void;
  userProfile: UserProfile;
  llmConfig: LLMConfig;
  onOpenSettings: () => void;
  onSaveProposalToJob: (jobId: string, proposalText: string, status: Job["status"]) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  job,
  onClose,
  userProfile,
  llmConfig,
  onOpenSettings,
  onSaveProposalToJob
}) => {
  if (!job) return null;

  const [pitchTone, setPitchTone] = useState<"concise" | "technical" | "value">("concise");
  const [proposedRate, setProposedRate] = useState(job.budget || userProfile.defaultRate);
  const [proposedTimeline, setProposedTimeline] = useState(userProfile.defaultTimeline);
  
  const [proposalText, setProposalText] = useState<string>(job.proposalText || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCopied(false);
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description,
          matchedSkills: job.matched_skills,
          pitchTone,
          proposedRate,
          proposedTimeline,
          customApiKey: llmConfig.apiKey,
          provider: llmConfig.provider,
          engineerProfile: userProfile
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate proposal");
      }

      setProposalText(data.proposal);
      setActiveProvider(data.provider || "Gemini 3.6 Flash");
      onSaveProposalToJob(job.id, data.proposal, "Proposal Generated");
    } catch (err: any) {
      alert(`Generation Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([proposalText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proposal_${job.source.toLowerCase()}_${job.id}.md`;
    link.click();
  };

  const handleMarkApplied = () => {
    onSaveProposalToJob(job.id, proposalText, "Applied");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 relative max-h-[90vh] flex flex-col shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              {job.source}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {job.matched_skills.length} Matching Skills Found
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 truncate">{job.title}</h3>
        </div>

        {/* Config Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Pitch Style / Tone</label>
            <select
              value={pitchTone}
              onChange={(e) => setPitchTone(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="concise">Concise & Direct (3 Paras)</option>
              <option value="technical">Deep Technical Authority</option>
              <option value="value">Value & ROI Focused</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Proposed Budget/Rate</label>
            <input
              type="text"
              value={proposedRate}
              onChange={(e) => setProposedRate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="$50/hr or $1,500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Estimated Delivery</label>
            <input
              type="text"
              value={proposedTimeline}
              onChange={(e) => setProposedTimeline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="1 - 2 weeks"
            />
          </div>
        </div>

        {/* Provider Indicator & Settings Quick Trigger */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Active LLM Engine:</span>
            <span className="text-indigo-400 font-medium capitalize">
              {llmConfig.provider === "gemini" ? "Google Gemini 3.6 Flash (Server Default)" : `${llmConfig.provider} (Custom Key)`}
            </span>
            {activeProvider && <span className="text-slate-500">({activeProvider})</span>}
          </div>

          <button
            onClick={onOpenSettings}
            className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Key className="w-3 h-3" /> Change Model Key
          </button>
        </div>

        {/* Generated Content Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-y-auto flex-1 whitespace-pre-wrap leading-relaxed relative min-h-[220px]">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-3 z-10">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-indigo-300 font-sans font-medium text-sm">
                Generating personalized pitch for {userProfile.name}...
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Matching job requirements with FastAPI, React, ESP32, and RAG portfolio items
              </p>
            </div>
          ) : !proposalText ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center font-sans p-6">
              <Sparkles className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-300 mb-1">No proposal generated yet</p>
              <p className="text-xs max-w-sm text-slate-500 mb-4">
                Click "Generate Pitch Proposal" below to create a tailored bid draft referencing your specific skills.
              </p>
              <button
                onClick={handleGenerate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate Proposal Now
              </button>
            </div>
          ) : isEditing ? (
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              className="w-full h-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none resize-none"
            />
          ) : (
            proposalText
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {proposalText && (
              <>
                <button
                  onClick={handleCopy}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied to Clipboard!" : "Copy Proposal"}
                </button>

                <button
                  onClick={handleDownload}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition"
                  title="Download as Markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Markdown
                </button>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-1.5 transition ${
                    isEditing ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? "Done Editing" : "Edit Pitch"}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isGenerating ? "animate-spin" : ""}`} />
              Regenerate
            </button>

            {proposalText && (
              <button
                onClick={handleMarkApplied}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                <Send className="w-3.5 h-3.5" />
                Mark as Applied
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
