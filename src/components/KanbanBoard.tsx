import React from "react";
import { Job, JobStatus } from "../types";
import { Bookmark, Sparkles, Send, Users, Trophy, ExternalLink, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";

interface KanbanBoardProps {
  jobs: Job[];
  onOpenProposal: (job: Job) => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}

const STAGES: { status: JobStatus; title: string; color: string; icon: React.ReactNode }[] = [
  { status: "Saved", title: "Saved / Shortlisted", color: "border-amber-500/40 text-amber-400 bg-amber-500/5", icon: <Bookmark className="w-4 h-4 text-amber-400" /> },
  { status: "Proposal Generated", title: "Pitch Drafted", color: "border-indigo-500/40 text-indigo-400 bg-indigo-500/5", icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
  { status: "Applied", title: "Applied / Submitted", color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/5", icon: <Send className="w-4 h-4 text-cyan-400" /> },
  { status: "Interview", title: "Interviewing", color: "border-purple-500/40 text-purple-400 bg-purple-500/5", icon: <Users className="w-4 h-4 text-purple-400" /> },
  { status: "Won", title: "Closed / Won!", color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5", icon: <Trophy className="w-4 h-4 text-emerald-400" /> }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onOpenProposal,
  onUpdateStatus
}) => {
  const moveNext = (job: Job) => {
    const currentIndex = STAGES.findIndex((s) => s.status === job.status);
    if (currentIndex < STAGES.length - 1) {
      onUpdateStatus(job.id, STAGES[currentIndex + 1].status);
    }
  };

  const movePrev = (job: Job) => {
    const currentIndex = STAGES.findIndex((s) => s.status === job.status);
    if (currentIndex > 0) {
      onUpdateStatus(job.id, STAGES[currentIndex - 1].status);
    } else {
      onUpdateStatus(job.id, "Discovered");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100">Freelance Application Pipeline</h2>
          <p className="text-xs text-slate-400">Track and manage your application stages from pitch draft to won contract.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Tracked: {jobs.filter((j) => j.status !== "Discovered").length} Gigs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageJobs = jobs.filter((j) => j.status === stage.status);

          return (
            <div
              key={stage.status}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col min-h-[420px]"
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border mb-3 ${stage.color}`}>
                <div className="flex items-center gap-2">
                  {stage.icon}
                  <span className="text-xs font-bold">{stage.title}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800">
                  {stageJobs.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {stageJobs.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-600 text-xs my-auto">
                    No gigs in {stage.title}
                  </div>
                ) : (
                  stageJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2 group shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {job.source}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {job.budget}
                          </span>
                        </div>

                        <a
                          href={job.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-200 hover:text-indigo-400 line-clamp-2 block leading-snug"
                        >
                          {job.title}
                        </a>
                      </div>

                      {/* Skill Tags */}
                      <div className="flex flex-wrap gap-1">
                        {job.matched_skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Controls */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => movePrev(job)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded transition"
                            title="Move Backward"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveNext(job)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded transition"
                            title="Move Forward"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onOpenProposal(job)}
                          className="bg-indigo-950/80 text-indigo-300 hover:text-white px-2 py-1 rounded text-[11px] font-medium border border-indigo-800/60 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" /> Pitch
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
