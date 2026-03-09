"use client";

import ImageUploader from "../shared/ImageUploader";
import { useState } from "react";

export default function DiseaseIconsScrollConfig({ config, onChange, slug }) {
  const [newIconUrl, setNewIconUrl] = useState("");
  const [newIconAlt, setNewIconAlt] = useState("");

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const addIcon = () => {
    if (!newIconUrl) return;

    const newIcon = {
      url: newIconUrl,
      alt: newIconAlt || "Icon",
    };

    const icons = [...(config.icons || []), newIcon];
    onChange({ ...config, icons });

    setNewIconUrl("");
    setNewIconAlt("");
  };

  const removeIcon = (index) => {
    const icons = config.icons.filter((_, i) => i !== index);
    onChange({ ...config, icons });
  };

  const moveIconUp = (index) => {
    if (index === 0) return;
    const icons = [...config.icons];
    [icons[index - 1], icons[index]] = [icons[index], icons[index - 1]];
    onChange({ ...config, icons });
  };

  const moveIconDown = (index) => {
    if (index === config.icons.length - 1) return;
    const icons = [...config.icons];
    [icons[index], icons[index + 1]] = [icons[index + 1], icons[index]];
    onChange({ ...config, icons });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Note:</p>
        <p>
          If no icons are added, default disease icons will be used. Add your own icons to customize.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scroll Speed
        </label>
        <select
          value={config.speed || "medium"}
          onChange={(e) => handleChange("speed", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="slow">Slow</option>
          <option value="medium">Medium</option>
          <option value="fast">Fast</option>
        </select>
      </div>

      {/* Icon List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icons ({config.icons?.length || 0})
        </label>

        {config.icons && config.icons.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.icons.map((icon, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <img
                  src={icon.url || icon}
                  alt={icon.alt || `Icon ${index + 1}`}
                  className="w-12 h-12 object-contain bg-white rounded"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='12'%3EIcon%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 truncate">{icon.alt || "Icon"}</div>
                  <div className="text-xs text-gray-400 truncate font-mono">{icon.url || icon}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveIconUp(index)}
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
                    onClick={() => moveIconDown(index)}
                    disabled={index === config.icons.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeIcon(index)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Icon */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">Add New Icon</h4>

          <div className="space-y-3">
            <ImageUploader
              value={newIconUrl}
              onChange={setNewIconUrl}
              slug={slug}
              label="Icon Image"
              showPreview={false}
            />

            {newIconUrl && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon Alt Text
                  </label>
                  <input
                    type="text"
                    value={newIconAlt}
                    onChange={(e) => setNewIconAlt(e.target.value)}
                    placeholder="e.g., Liver Icon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={addIcon}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Add Icon
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
