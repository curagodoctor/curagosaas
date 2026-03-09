"use client";

import { useState } from "react";
import ImageUploader from "../shared/ImageUploader";

export default function HeroCarouselConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({ url: "", alt: "", caption: "" });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.images[index]);
  };

  const saveImage = () => {
    if (!formData.url) return;

    const images = [...(config.images || [])];
    if (editingIndex !== null) {
      images[editingIndex] = formData;
    } else {
      images.push(formData);
    }

    onChange({ ...config, images });
    setEditingIndex(null);
    setFormData({ url: "", alt: "", caption: "" });
  };

  const removeImage = (index) => {
    const images = config.images.filter((_, i) => i !== index);
    onChange({ ...config, images });
  };

  const moveImageUp = (index) => {
    if (index === 0) return;
    const images = [...config.images];
    [images[index - 1], images[index]] = [images[index], images[index - 1]];
    onChange({ ...config, images });
  };

  const moveImageDown = (index) => {
    if (index === config.images.length - 1) return;
    const images = [...config.images];
    [images[index], images[index + 1]] = [images[index + 1], images[index]];
    onChange({ ...config, images });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ url: "", alt: "", caption: "" });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Hero Carousel</p>
        <p>Add multiple images that will auto-rotate at the top of your page</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auto-Play Speed (milliseconds)
        </label>
        <input
          type="number"
          min="1000"
          max="10000"
          step="500"
          value={config.autoPlaySpeed || 3000}
          onChange={(e) => handleChange("autoPlaySpeed", parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {((config.autoPlaySpeed || 3000) / 1000).toFixed(1)} seconds per image
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showIndicators"
          checked={config.showIndicators !== false}
          onChange={(e) => handleChange("showIndicators", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="showIndicators" className="text-sm text-gray-700">
          Show dot indicators
        </label>
      </div>

      {/* Doctor Credentials Section */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="showDoctorCredentials"
            checked={config.showDoctorCredentials === true}
            onChange={(e) => handleChange("showDoctorCredentials", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showDoctorCredentials" className="text-sm font-medium text-gray-700">
            Show Doctor Credentials Below Carousel
          </label>
        </div>

        {config.showDoctorCredentials && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor Name
              </label>
              <input
                type="text"
                value={config.doctorName || "Dr. Yuvaraj T"}
                onChange={(e) => handleChange("doctorName", e.target.value)}
                placeholder="Dr. Yuvaraj T"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor Title
              </label>
              <input
                type="text"
                value={config.doctorTitle || "Consultant GI & HPB Surgeon"}
                onChange={(e) => handleChange("doctorTitle", e.target.value)}
                placeholder="Consultant GI & HPB Surgeon"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Credentials (comma-separated)
              </label>
              <textarea
                value={(config.doctorCredentials || []).join(", ")}
                onChange={(e) => handleChange("doctorCredentials", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="MCh Surgical Gastroenterology (KEMH, Mumbai), FMAS, FACRSI"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Separate each credential with a comma</p>
            </div>
          </div>
        )}
      </div>

      {/* Images List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carousel Images ({config.images?.length || 0})
        </label>

        {config.images && config.images.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.images.map((image, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={image.url}
                    alt={image.alt || `Image ${index + 1}`}
                    className="w-20 h-14 object-cover rounded bg-white"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 70'%3E%3Crect fill='%23ddd' width='100' height='70'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='12'%3EImage%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 font-medium mb-1">
                      {image.alt || `Image ${index + 1}`}
                    </div>
                    {image.caption && (
                      <div className="text-xs text-gray-600 mb-1">{image.caption}</div>
                    )}
                    <div className="text-xs text-gray-400 truncate font-mono">{image.url}</div>
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
                      onClick={() => moveImageUp(index)}
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
                      onClick={() => moveImageDown(index)}
                      disabled={index === config.images.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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
            {editingIndex !== null ? "Edit Image" : "Add New Image"}
          </h4>

          <div className="space-y-3">
            <ImageUploader
              value={formData.url}
              onChange={(url) => setFormData({ ...formData, url })}
              slug={slug}
              label="Hero Image *"
            />

            {formData.url && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alt Text (for accessibility)
                  </label>
                  <input
                    type="text"
                    value={formData.alt}
                    onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                    placeholder="e.g., Advanced gallbladder surgery"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="e.g., Expert laparoscopic procedures"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveImage}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
