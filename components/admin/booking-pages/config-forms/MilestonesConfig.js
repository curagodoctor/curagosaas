"use client";

import { useState } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";

export default function MilestonesConfig({ config, onChange }) {
  const [gen, setGen] = useState(false);
  const [msg, setMsg] = useState("");
  const items = config.items || [];
  const set = (k, v) => onChange({ ...config, [k]: v });
  const setItem = (i, k, v) => onChange({ ...config, items: items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });
  const add = () => onChange({ ...config, items: [...items, { year: "", title: "", description: "" }] });
  const remove = (i) => onChange({ ...config, items: items.filter((_, j) => j !== i) });

  const generateAI = async () => {
    setGen(true); setMsg("");
    try {
      const r = await fetch("/api/practice-os/actions/generate-milestones", { method: "POST", credentials: "include" }).then((x) => x.json());
      if (r.success && Array.isArray(r.items) && r.items.length) {
        onChange({ ...config, items: r.items });
        setMsg(`Generated ${r.items.length} milestones — review and edit as needed.`);
      } else setMsg(r.error || "Could not generate milestones. Make sure your profile has your experience/qualifications.");
    } catch { setMsg("Could not generate milestones."); }
    finally { setGen(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
        <input className={INPUT} value={config.title ?? "Our Journey"} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (optional)</label>
        <input className={INPUT} value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>

      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Milestones / Roadmap ({items.length})</label>
        <button type="button" onClick={generateAI} disabled={gen} className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white disabled:opacity-60">
          {gen ? "Generating…" : "✨ Generate with AI"}
        </button>
      </div>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}

      <div className="space-y-3">
        {items.map((m, i) => (
          <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Milestone {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-600 text-xs hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <input className={INPUT} placeholder="Year" value={m.year || ""} onChange={(e) => setItem(i, "year", e.target.value)} />
              <input className={INPUT} placeholder="Title *" value={m.title || ""} onChange={(e) => setItem(i, "title", e.target.value)} />
            </div>
            <textarea className={INPUT} rows={2} placeholder="Description" value={m.description || ""} onChange={(e) => setItem(i, "description", e.target.value)} />
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add milestone</button>
    </div>
  );
}
