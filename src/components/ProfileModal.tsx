import React, { useState } from "react";
import { UserProfile } from "../types";
import { X, User, Plus, Trash2, Check, Sparkles } from "lucide-react";

interface ProfileModalProps {
  profile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [bio, setBio] = useState(profile.bio);
  const [email, setEmail] = useState(profile.email);
  const [defaultRate, setDefaultRate] = useState(profile.defaultRate);
  const [defaultTimeline, setDefaultTimeline] = useState(profile.defaultTimeline);
  
  const [skillsText, setSkillsText] = useState(profile.skills.join(", "));
  const [portfolio, setPortfolio] = useState<string[]>(profile.portfolio);
  const [newPortfolioItem, setNewPortfolioItem] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAddPortfolio = () => {
    if (!newPortfolioItem.trim()) return;
    setPortfolio([...portfolio, newPortfolioItem.trim()]);
    setNewPortfolioItem("");
  };

  const handleRemovePortfolio = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedSkills = skillsText
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      name,
      title,
      bio,
      email,
      defaultRate,
      defaultTimeline,
      skills: updatedSkills,
      portfolio
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Engineer Profile & Skill Matcher</h3>
            <p className="text-xs text-slate-400">
              Customize your technical bio and skills to refine scraper matching & AI proposal pitches.
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 my-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Bio Summary</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default Hourly Rate / Budget</label>
              <input
                type="text"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default Delivery Timeline</label>
              <input
                type="text"
                value={defaultTimeline}
                onChange={(e) => setDefaultTimeline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Active Skill Matcher Keywords (Comma Separated)
            </label>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used by scraper to calculate opportunity match scores (e.g., fastapi, react, esp32, python, rag, docker).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Featured Portfolio Items & Assets</label>
            <div className="space-y-2 mb-2">
              {portfolio.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-300">{item}</span>
                  <button
                    onClick={() => handleRemovePortfolio(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPortfolioItem}
                onChange={(e) => setNewPortfolioItem(e.target.value)}
                placeholder="e.g. ESP32 Telemetry Firmware with WebSockets"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddPortfolio}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl flex items-center gap-1 font-medium"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
            {saved ? "Profile Updated!" : "Save Profile & Skills"}
          </button>
        </div>
      </div>
    </div>
  );
};
