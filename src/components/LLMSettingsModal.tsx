import React, { useState } from "react";
import { LLMConfig } from "../types";
import { X, Key, ExternalLink, Check, ShieldCheck, Sparkles } from "lucide-react";

interface LLMSettingsModalProps {
  config: LLMConfig;
  onSave: (newConfig: LLMConfig) => void;
  onClose: () => void;
}

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  config,
  onSave,
  onClose
}) => {
  const [provider, setProvider] = useState<LLMConfig["provider"]>(config.provider);
  const [apiKey, setApiKey] = useState<string>(config.apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ provider, apiKey });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Configure Free LLM API</h3>
            <p className="text-xs text-slate-400">
              Integrate zero-cost models from{" "}
              <a
                href="https://github.com/cheahjs/free-llm-api-resources"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-0.5"
              >
                cheahjs/free-llm-api-resources <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-4 my-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              LLM Provider Choice
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini">Google Gemini Server API (3.6 Flash / 1.5 - Free Tier)</option>
              <option value="groq">Groq Cloud (Free - Llama 3.3 70B / Llama 3.1 8B)</option>
              <option value="openrouter">OpenRouter (Free Tier - Llama 3.1 8B Instruct)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              API Key {provider === "gemini" && "(Optional if GEMINI_API_KEY is configured on server)"}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "groq"
                  ? "gsk_..."
                  : provider === "openrouter"
                  ? "sk-or-..."
                  : "Paste your Gemini API key here"
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Keys are stored securely in browser local storage and proxied server-side.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Provider Recommendations:
            </div>
            {provider === "gemini" && (
              <p>Default server Gemini API handles fast proposal drafting automatically. No key required if environment key is active.</p>
            )}
            {provider === "groq" && (
              <p>Get a free instant key from <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">console.groq.com</a> for ultra-low latency Llama 3.3 70B generation.</p>
            )}
            {provider === "openrouter" && (
              <p>Get a free key from <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-indigo-400 underline">openrouter.ai</a> to access community free tier models.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            {saved ? "Saved Key Successfully!" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};
