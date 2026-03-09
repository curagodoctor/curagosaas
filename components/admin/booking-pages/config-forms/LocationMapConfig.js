"use client";

export default function LocationMapConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Visit Our Clinic"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Visit Our Clinic"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          type="text"
          value={config.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="SRV Hospital, Tilak Nagar, Chembur, Mumbai"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Maps Embed URL
        </label>
        <textarea
          value={config.mapUrl || ""}
          onChange={(e) => handleChange("mapUrl", e.target.value)}
          rows={3}
          placeholder="https://www.google.com/maps/embed?pb=..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs font-mono"
        />
        <div className="mt-2 space-y-1">
          <p className="text-xs font-semibold text-gray-700">How to get embed URL:</p>
          <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1 ml-2">
            <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></li>
            <li>Search for your location (e.g., "SRV Hospital, Chembur")</li>
            <li>Click "Share" button → Select "Embed a map" tab</li>
            <li>Copy the iframe src URL (starts with https://www.google.com/maps/embed?pb=)</li>
            <li>Paste it here</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            💡 A working default map is already set for SRV Hospital, Chembur
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showDirectionsButton"
          checked={config.showDirectionsButton !== false}
          onChange={(e) => handleChange("showDirectionsButton", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="showDirectionsButton" className="text-sm text-gray-700">
          Show "View on Google Maps" button
        </label>
      </div>
    </div>
  );
}
