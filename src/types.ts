export type JobSource =
  | "Upwork"
  | "Reddit"
  | "RemoteOK"
  | "HackerNews"
  | "Remotive"
  | "Arbeitnow"
  | "WeWorkRemotely"
  | "Jobicy"
  | "Web Search"
  | "Freelance.com"
  | "Custom";

export type JobStatus = "Discovered" | "Saved" | "Proposal Generated" | "Applied" | "Interview" | "Won" | "Archived";

export interface Job {
  id: string;
  title: string;
  description: string;
  link: string;
  source: JobSource;
  matched_skills: string[];
  posted_at: string;
  budget: string;
  client_country?: string;
  client_rating?: number;
  status: JobStatus;
  note?: string;
  proposalText?: string;
  link_validated?: boolean;
  link_status?: string;
  posted_ts?: number; // epoch ms for recency sorting (0/undefined = unknown)
  is_freelance?: boolean; // contract / freelance / part-time signal
  region_locked?: boolean; // restricted to a region that excludes India-based remote
  region_note?: string; // the location/restriction text that triggered the flag
}

export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  email: string;
  defaultRate: string;
  defaultTimeline: string;
  skills: string[];
  portfolio: string[];
}

export interface LLMConfig {
  provider: "gemini" | "groq" | "openrouter";
  apiKey: string;
}

export interface ScrapeLog {
  timestamp: string;
  message: string;
  type?: "info" | "success" | "warn" | "error";
}
