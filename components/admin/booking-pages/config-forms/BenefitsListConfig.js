"use client";

import { useState } from "react";

export default function BenefitsListConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({ icon: "✓", title: "", description: "" });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.items[index]);
  };

  const saveItem = () => {
    if (!formData.title || !formData.description) return;

    const items = [...(config.items || [])];
    if (editingIndex !== null) {
      items[editingIndex] = formData;
    } else {
      items.push(formData);
    }

    onChange({ ...config, items });
    setEditingIndex(null);
    setFormData({ icon: "✓", title: "", description: "" });
  };

  const removeItem = (index) => {
    const items = config.items.filter((_, i) => i !== index);
    onChange({ ...config, items });
  };

  const moveItemUp = (index) => {
    if (index === 0) return;
    const items = [...config.items];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    onChange({ ...config, items });
  };

  const moveItemDown = (index) => {
    if (index === config.items.length - 1) return;
    const items = [...config.items];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    onChange({ ...config, items });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ icon: "✓", title: "", description: "" });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Why Choose Us"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Why Choose Us"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle (optional)
        </label>
        <input
          type="text"
          value={config.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Brief description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Benefits List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Benefits / Features ({config.items?.length || 0})
        </label>

        {config.items && config.items.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.items.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItemUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItemDown(index)}
                      disabled={index === config.items.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">
            {editingIndex !== null ? "Edit Benefit" : "Add New Benefit"}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="✓"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Emoji or symbol (e.g., ✓, ⚡, 🏆)</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Minimally Invasive"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="e.g., Latest laparoscopic techniques for faster recovery"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveItem}
                disabled={!formData.title || !formData.description}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? "Update" : "Add"}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
