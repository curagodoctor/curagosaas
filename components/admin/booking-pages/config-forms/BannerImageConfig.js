"use client";

import ImageUploader from "../shared/ImageUploader";

export default function BannerImageConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <ImageUploader
        value={config.imageUrl || ""}
        onChange={(url) => handleChange("imageUrl", url)}
        slug={slug}
        label="Banner Image *"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (optional)
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Expert Gallbladder Treatment"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle (optional)
        </label>
        <textarea
          value={config.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          rows={2}
          placeholder="e.g., Advanced laparoscopic surgery with quick recovery"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <select
          value={config.alignment || "center"}
          onChange={(e) => handleChange("alignment", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overlay Opacity
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.overlayOpacity || 0.4}
          onChange={(e) => handleChange("overlayOpacity", parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 (transparent)</span>
          <span className="font-semibold">{config.overlayOpacity || 0.4}</span>
          <span>1 (dark)</span>
        </div>
      </div>
    </div>
  );
}
