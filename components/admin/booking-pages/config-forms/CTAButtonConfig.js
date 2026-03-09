"use client";

export default function CTAButtonConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (optional)
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Ready to Get Started?"
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
          placeholder="e.g., Book your consultation today and take the first step"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Text *
        </label>
        <input
          type="text"
          value={config.buttonText || "Book Now"}
          onChange={(e) => handleChange("buttonText", e.target.value)}
          placeholder="Book Now"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Link
        </label>
        <input
          type="text"
          value={config.buttonLink || "#booking"}
          onChange={(e) => handleChange("buttonLink", e.target.value)}
          placeholder="#booking"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Use #booking to scroll to booking form</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Style
        </label>
        <select
          value={config.buttonStyle || "primary"}
          onChange={(e) => handleChange("buttonStyle", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="primary">Primary (Blue)</option>
          <option value="secondary">Secondary (Light)</option>
          <option value="outline">Outline</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alignment
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
          Background Color
        </label>
        <select
          value={config.backgroundColor || "beige"}
          onChange={(e) => handleChange("backgroundColor", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="white">White</option>
          <option value="beige">Beige</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Size
        </label>
        <select
          value={config.size || "large"}
          onChange={(e) => handleChange("size", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showIcon"
          checked={config.showIcon !== false}
          onChange={(e) => handleChange("showIcon", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="showIcon" className="text-sm text-gray-700">
          Show arrow icon
        </label>
      </div>
    </div>
  );
}
