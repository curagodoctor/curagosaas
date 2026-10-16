"use client";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";

export default function PublicationsConfig({ config, onChange }) {
  const items = config.items || [];
  const set = (k, v) => onChange({ ...config, [k]: v });
  const setItem = (i, k, v) => onChange({ ...config, items: items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });
  const add = () => onChange({ ...config, items: [...items, { title: "", link: "", journal: "" }] });
  const remove = (i) => onChange({ ...config, items: items.filter((_, j) => j !== i) });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
        <input className={INPUT} value={config.title ?? "Publications"} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (optional)</label>
        <input className={INPUT} value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Publications ({items.length})</label>
        <div className="space-y-3">
          {items.map((p, i) => (
            <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">Paper {i + 1}</span>
                <button type="button" onClick={() => remove(i)} className="text-red-600 text-xs hover:underline">Remove</button>
              </div>
              <input className={INPUT} placeholder="Paper title *" value={p.title || ""} onChange={(e) => setItem(i, "title", e.target.value)} />
              <input className={INPUT} placeholder="Link (https://…)" value={p.link || ""} onChange={(e) => setItem(i, "link", e.target.value)} />
              <input className={INPUT} placeholder="Journal / year (optional)" value={p.journal || ""} onChange={(e) => setItem(i, "journal", e.target.value)} />
            </div>
          ))}
        </div>
        <button type="button" onClick={add} className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add publication</button>
      </div>
    </div>
  );
}
