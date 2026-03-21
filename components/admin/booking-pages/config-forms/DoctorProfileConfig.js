"use client";

import ImageUploader from "../shared/ImageUploader";
import RichTextEditor from "../shared/RichTextEditor";
import { useState } from "react";

export default function DoctorProfileConfig({ config, onChange, slug }) {
  const [newCredential, setNewCredential] = useState("");
  const [newAward, setNewAward] = useState({ title: "", imageUrl: "" });

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

  const addAward = () => {
    if (!newAward.title.trim()) return;

    const awards = [...(config.awards || []), { ...newAward }];
    onChange({ ...config, awards });
    setNewAward({ title: "", imageUrl: "" });
  };

  const updateAwardImage = (index, imageUrl) => {
    const awards = [...(config.awards || [])];
    awards[index] = { ...awards[index], imageUrl };
    onChange({ ...config, awards });
  };

  const removeAward = (index) => {
    const awards = config.awards.filter((_, i) => i !== index);
    onChange({ ...config, awards });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., About Dr. Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ImageUploader
        value={config.imageUrl || ""}
        onChange={(url) => handleChange("imageUrl", url)}
        slug={slug}
        label="Doctor Photo"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Registration Number
        </label>
        <input
          type="text"
          value={config.registrationNumber || ""}
          onChange={(e) => handleChange("registrationNumber", e.target.value)}
          placeholder="e.g., MCI/2015/123456 or State Medical Council Reg. No."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your medical registration/license number (displayed on your profile for credibility)
        </p>
      </div>

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

      {/* Awards & Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Awards & Certifications ({config.awards?.length || 0})
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add awards, certifications, or recognitions with optional images
        </p>

        {config.awards && config.awards.length > 0 && (
          <div className="space-y-3 mb-3">
            {config.awards.map((award, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  {award.imageUrl ? (
                    <img
                      src={award.imageUrl}
                      alt={award.title}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{award.title}</div>
                    <div className="mt-2">
                      <ImageUploader
                        value={award.imageUrl || ""}
                        onChange={(url) => updateAwardImage(index, url)}
                        slug={slug}
                        label=""
                        compact={true}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAward(index)}
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

        {/* Add Award Form */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">Add New Award/Certification</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={newAward.title}
                onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAward())}
                placeholder="e.g., Best Doctor Award 2023"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Certificate/Award Image (Optional)</label>
              <ImageUploader
                value={newAward.imageUrl || ""}
                onChange={(url) => setNewAward({ ...newAward, imageUrl: url })}
                slug={slug}
                label=""
                compact={true}
              />
            </div>
            <button
              type="button"
              onClick={addAward}
              disabled={!newAward.title.trim()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              Add Award/Certification
            </button>
          </div>
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
