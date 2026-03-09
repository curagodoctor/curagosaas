"use client";

export default function BookNowStickyButtonConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Sticky Book Now Button</p>
            <p>This button will float on the screen and remain visible as users scroll. Great for quick booking access.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Text
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
        <p className="text-xs text-gray-500 mt-1">
          Use # for anchor links (e.g., #booking) or full URL for external links
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tooltip Text
        </label>
        <input
          type="text"
          value={config.tooltipText || "Book your appointment"}
          onChange={(e) => handleChange("tooltipText", e.target.value)}
          placeholder="Book your appointment"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Text shown when hovering over the button
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Position
        </label>
        <select
          value={config.position || "bottom-left"}
          onChange={(e) => handleChange("position", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right (next to WhatsApp)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Position relative to the screen. Bottom Left is recommended if using WhatsApp button on right.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Background Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.backgroundColor || "#1e40af"}
            onChange={(e) => handleChange("backgroundColor", e.target.value)}
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={config.backgroundColor || "#1e40af"}
            onChange={(e) => handleChange("backgroundColor", e.target.value)}
            placeholder="#1e40af"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleChange("backgroundColor", "#1e40af")}
            className="px-3 py-1 text-xs rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            style={{ backgroundColor: "#1e40af", color: "white" }}
          >
            Blue (Primary)
          </button>
          <button
            type="button"
            onClick={() => handleChange("backgroundColor", "#059669")}
            className="px-3 py-1 text-xs rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors"
            style={{ backgroundColor: "#059669", color: "white" }}
          >
            Green
          </button>
          <button
            type="button"
            onClick={() => handleChange("backgroundColor", "#dc2626")}
            className="px-3 py-1 text-xs rounded-lg border-2 border-gray-200 hover:border-red-500 transition-colors"
            style={{ backgroundColor: "#dc2626", color: "white" }}
          >
            Red (Urgent)
          </button>
          <button
            type="button"
            onClick={() => handleChange("backgroundColor", "#7c3aed")}
            className="px-3 py-1 text-xs rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-colors"
            style={{ backgroundColor: "#7c3aed", color: "white" }}
          >
            Purple
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.textColor || "#ffffff"}
            onChange={(e) => handleChange("textColor", e.target.value)}
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={config.textColor || "#ffffff"}
            onChange={(e) => handleChange("textColor", e.target.value)}
            placeholder="#ffffff"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-8 h-40">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Page content area
          </div>
          <div
            className={`absolute ${
              config.position === "bottom-right"
                ? "bottom-4 right-4"
                : "bottom-4 left-4"
            } px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
            style={{
              backgroundColor: config.backgroundColor || "#1e40af",
              color: config.textColor || "#ffffff"
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold">{config.buttonText || "Book Now"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
