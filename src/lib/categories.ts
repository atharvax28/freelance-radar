import { Job } from "../types";

export type DomainCategory = "Software" | "Hardware" | "Marketing";

export function getJobCategory(job: Job): DomainCategory {
  const text = `${job.title} ${job.description} ${(job.matched_skills || []).join(" ")}`.toLowerCase();

  // Hardware & Embedded terms
  const hardwareTerms = [
    "esp32", "kicad", "pcb", "mosfet", "pwm", "adc", "microcontroller",
    "hardware", "firmware", "iot", "sensor", "embedded", "circuit",
    "arduino", "freertos", "raspberry pi", "telemetry", "soldering", "fpga", "stm32"
  ];
  if (hardwareTerms.some((term) => text.includes(term))) {
    return "Hardware";
  }

  // SEO & Marketing terms
  const marketingTerms = [
    "seo", "search engine optimization", "marketing", "digital marketing",
    "technical seo", "copywriting", "lead gen", "growth", "ads",
    "content strategy", "social media", "sem", "backlinks", "google analytics"
  ];
  if (marketingTerms.some((term) => text.includes(term))) {
    return "Marketing";
  }

  return "Software";
}

export function getCategoryBadgeClass(category: DomainCategory): string {
  switch (category) {
    case "Hardware":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Marketing":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Software":
    default:
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  }
}

export function getCategoryLabel(category: DomainCategory): string {
  switch (category) {
    case "Hardware":
      return "Hardware & Embedded";
    case "Marketing":
      return "SEO & Marketing";
    case "Software":
    default:
      return "Software & Tech";
  }
}
