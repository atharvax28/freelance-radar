import { Job } from "../types";

// Escape the small set of characters Telegram's HTML parse_mode cares about.
function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * Push a single gig to Telegram. No-op (returns false) when the bot token /
 * chat id env vars are not set, so local runs and CI without secrets are safe.
 */
export async function sendGig(job: Job): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const skills = (job.matched_skills || []).slice(0, 8).join(", ");
  const lines = [
    `🛰️ <b>${escapeHtml(job.title)}</b>`,
    `📡 ${escapeHtml(job.source)}${job.client_country ? ` · ${escapeHtml(job.client_country)}` : ""}`,
    job.budget ? `💰 ${escapeHtml(job.budget)}` : "",
    skills ? `🧩 ${escapeHtml(skills)}` : "",
    job.region_locked ? `⚠️ May be region-locked${job.region_note ? ` (${escapeHtml(job.region_note)})` : ""} — verify eligibility` : "",
    job.link ? `🔗 ${escapeHtml(job.link)}` : "",
  ].filter(Boolean);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Telegram sendMessage failed (${res.status}): ${body.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`Telegram send error: ${err?.message || err}`);
    return false;
  }
}

// Telegram allows ~30 messages/second to different users; when blasting a batch
// to one chat, a small delay keeps us well under any per-chat flood limit.
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
