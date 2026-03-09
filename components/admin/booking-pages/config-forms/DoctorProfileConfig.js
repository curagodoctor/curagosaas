"use client";

import ImageUploader from "../shared/ImageUploader";
import RichTextEditor from "../shared/RichTextEditor";
import { useState } from "react";

export default function DoctorProfileConfig({ config, onChange, slug }) {
  const [newCredential, setNewCredential] = useState("");

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const addCredential = () => {
    if (!newCredential.trim()) return;

    const credentials = [...(config.credentials || []), newCredential.trim()];
    onChange({ ...config, credentials });
    setNewCredential("");
  };

  const removeCredential = (index) => {
    const credentials = config.credentials.filter((_, i) => i !== index);
    onChange({ ...config, credentials });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "About Dr. Yuvaraj T"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="About Dr. Yuvaraj T"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ImageUploader
        value={config.imageUrl || ""}
        onChange={(url) => handleChange("imageUrl", url)}
        slug={slug}
        label="Doctor Photo"
      />

      <RichTextEditor
        value={config.content || ""}
        onChange={(value) => handleChange("content", value)}
        label="About Content *"
        placeholder="Write about the doctor's qualifications, experience, and expertise..."
        rows={10}
      />

      {/* Credentials */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credentials / Qualifications ({config.credentials?.length || 0})
        </label>

        {config.credentials && config.credentials.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.credentials.map((credential, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 text-sm text-gray-900">{credential}</span>
                <button
                  type="button"
                  onClick={() => removeCredential(index)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Credential */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCredential}
            onChange={(e) => setNewCredential(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCredential())}
            placeholder="e.g., MBBS, MS (General Surgery)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addCredential}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout
        </label>
        <select
          value={config.layout || "left"}
          onChange={(e) => handleChange("layout", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">Image on Left</option>
          <option value="right">Image on Right</option>
        </select>
      </div>
    </div>
  );
}
