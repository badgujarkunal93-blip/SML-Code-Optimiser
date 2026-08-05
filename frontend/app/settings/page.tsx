"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [devBypass, setDevBypass] = useState(true);
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [algorandNet, setAlgorandNet] = useState("Testnet");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto font-mono text-xs">
      <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-[#57f1db]">⚙️</span> Platform Settings &amp; Configuration
          </h1>
          <p className="text-[#bacac5] text-xs mt-1">
            Configure Groq LLM model parameters, Pera Wallet, and development bypass toggles.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-[#2DD4BF]/20 transition-all hover-scale"
        >
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-[#3c4a46]/30 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2DD4BF]">tune</span>
            Development Mode &amp; Payment Bypass
          </h3>

          <div className="flex items-center justify-between p-3 bg-[#020617] rounded-xl border border-[#3c4a46]/40">
            <div>
              <div className="font-bold text-white">Bypass Algorand x402 Micropayments</div>
              <div className="text-[10px] text-[#bacac5]">Skips Pera Wallet popup during local development testing.</div>
            </div>
            <input
              type="checkbox"
              checked={devBypass}
              onChange={(e) => setDevBypass(e.target.checked)}
              className="w-4 h-4 accent-[#2DD4BF]"
            />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-[#3c4a46]/30 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2DD4BF]">smart_toy</span>
            AI Model Engine Settings
          </h3>

          <div className="space-y-2">
            <label className="text-[#bacac5] text-[10px] uppercase font-bold">Groq Model Selector:</label>
            <select
              value={groqModel}
              onChange={(e) => setGroqModel(e.target.value)}
              className="w-full bg-[#020617] text-[#2DD4BF] font-bold p-2.5 rounded-xl border border-[#3c4a46]/50 outline-none"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Default High Reasoning)</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Fast Refactoring)</option>
              <option value="llama3-8b-8192">llama3-8b-8192 (Ultra Low Latency)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[#bacac5] text-[10px] uppercase font-bold">Algorand Blockchain Network:</label>
            <input
              type="text"
              value={algorandNet}
              onChange={(e) => setAlgorandNet(e.target.value)}
              className="w-full bg-[#020617] text-slate-200 p-2.5 rounded-xl border border-[#3c4a46]/50 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
