"use client";

import { useState } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500";

export default function BenefitsListConfig({ config, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState({ title: "", description: "" });

  const handleChange = (field, value) => onChange({ ...config, [field]: value });
  const items = config.items || [];

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditData({ title: items[index].title || "", description: items[index].description || "" });
  };
  const cancelEdit = () => setEditingIndex(null);

  const saveEdit = () => {
    if (!editData.title || !editData.description) return;
    const next = [...items];
    // Preserve any other fields on the item (e.g. a legacy icon) — just update copy.
    next[editingIndex] = { ...next[editingIndex], title: editData.title, description: editData.description };
    onChange({ ...config, items: next });
    setEditingIndex(null);
  };

  const addItem = () => {
    if (!newItem.title || !newItem.description) return;
    onChange({ ...config, items: [...items, { title: newItem.title, description: newItem.description }] });
    setNewItem({ title: "", description: "" });
  };

  const removeItem = (index) => onChange({ ...config, items: items.filter((_, i) => i !== index) });
  const moveItemUp = (index) => {
    if (index === 0) return;
    const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange({ ...config, items: next });
  };
  const moveItemDown = (index) => {
    if (index === items.length - 1) return;
    const next = [...items]; [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange({ ...config, items: next });
  };

  const IconBtn = ({ onClick, disabled, title, danger, children }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`p-1 rounded disabled:opacity-30 ${danger ? 'hover:bg-red-100 text-red-600' : 'hover:bg-gray-200'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
        <input type="text" value={config.title || "Why Choose Us"} onChange={(e) => handleChange("title", e.target.value)} placeholder="Why Choose Us" className={INPUT} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (optional)</label>
        <input type="text" value={config.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="Brief description" className={INPUT} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Benefits / Features ({items.length})</label>

        {items.length > 0 && (
          <div className="space-y-2 mb-3">
            {items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {editingIndex === index ? (
                  /* Inline edit — the SAME card expands into the edit form. */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                      <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className={INPUT} autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                      <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} className={INPUT} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} disabled={!editData.title || !editData.description}
                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">Update</button>
                      <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconBtn onClick={() => startEdit(index)} title="Edit"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></IconBtn>
                      <IconBtn onClick={() => moveItemUp(index)} disabled={index === 0} title="Move up"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></IconBtn>
                      <IconBtn onClick={() => moveItemDown(index)} disabled={index === items.length - 1} title="Move down"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></IconBtn>
                      <IconBtn onClick={() => removeItem(index)} danger title="Remove"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></IconBtn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add a new benefit */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">Add New Benefit</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="e.g., Minimally Invasive" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} rows={2} placeholder="e.g., Latest laparoscopic techniques for faster recovery" className={INPUT} />
            </div>
            <button type="button" onClick={addItem} disabled={!newItem.title || !newItem.description}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg disabled:cursor-not-allowed">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
