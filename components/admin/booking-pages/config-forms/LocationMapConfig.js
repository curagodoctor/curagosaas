"use client";

import { useState } from "react";

export default function LocationMapConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    mapUrl: "",
  });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.locations[index]);
  };

  const saveLocation = () => {
    if (!formData.name.trim() || !formData.address.trim()) return;

    const locations = [...(config.locations || [])];
    if (editingIndex !== null) {
      locations[editingIndex] = formData;
    } else {
      locations.push(formData);
    }

    onChange({ ...config, locations });
    setEditingIndex(null);
    setFormData({ name: "", address: "", mapUrl: "" });
  };

  const removeLocation = (index) => {
    const locations = config.locations.filter((_, i) => i !== index);
    onChange({ ...config, locations });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ name: "", address: "", mapUrl: "" });
  };

  // For backward compatibility: migrate single location to array format
  const migrateLegacyData = () => {
    if (config.address && !config.locations) {
      const legacyLocation = {
        name: config.title || "Main Location",
        address: config.address || "",
        mapUrl: config.mapUrl || "",
      };
      onChange({
        ...config,
        locations: [legacyLocation],
        address: undefined,
        mapUrl: undefined,
      });
    }
  };

  // Run migration on first render if needed
  if (config.address && !config.locations) {
    migrateLegacyData();
  }

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

      {/* Locations List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinic Locations with Maps ({config.locations?.length || 0})
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add multiple locations with embedded Google Maps
        </p>

        {config.locations && config.locations.length > 0 && (
          <div className="space-y-3 mb-3">
            {config.locations.map((location, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{location.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{location.address}</div>
                    {location.mapUrl && (
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Map configured
                      </div>
                    )}
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
                      onClick={() => removeLocation(index)}
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

        {/* Add/Edit Location Form */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">
            {editingIndex !== null ? "Edit Location" : "Add New Location"}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Clinic, Branch Office"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="SRV Hospital, Tilak Nagar, Chembur, Mumbai"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Google Maps Embed URL</label>
              <textarea
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                rows={3}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-gray-700">How to get embed URL:</p>
                <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></li>
                  <li>Search for your location</li>
                  <li>Click "Share" → "Embed a map" tab</li>
                  <li>Copy the iframe src URL (starts with https://www.google.com/maps/embed?pb=)</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveLocation}
                disabled={!formData.name.trim() || !formData.address.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? "Update Location" : "Add Location"}
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
