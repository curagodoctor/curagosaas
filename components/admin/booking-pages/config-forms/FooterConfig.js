"use client";

import { useState } from "react";

export default function FooterConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const handleQuickLinkChange = (index, field, value) => {
    const newQuickLinks = [...(config.quickLinks || [])];
    newQuickLinks[index] = { ...newQuickLinks[index], [field]: value };
    handleChange("quickLinks", newQuickLinks);
  };

  const addQuickLink = () => {
    const newQuickLinks = [...(config.quickLinks || []), { text: "", url: "" }];
    handleChange("quickLinks", newQuickLinks);
  };

  const removeQuickLink = (index) => {
    const newQuickLinks = config.quickLinks.filter((_, i) => i !== index);
    handleChange("quickLinks", newQuickLinks);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={config.companyName || "CuraGo"}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="CuraGo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={config.tagline || ""}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="Your Health, Our Priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
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
              Phone Number
            </label>
            <input
              type="tel"
              value={config.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+91 7021227203"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={config.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="team@curago.in"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showQuickLinks"
              checked={config.showQuickLinks !== false}
              onChange={(e) => handleChange("showQuickLinks", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showQuickLinks" className="text-sm font-semibold text-gray-900">
              Show Quick Links
            </label>
          </div>
        </div>

        {config.showQuickLinks !== false && (
          <div className="space-y-3">
            {(config.quickLinks || []).map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={link.text}
                    onChange={(e) => handleQuickLinkChange(index, "text", e.target.value)}
                    placeholder="Link Text"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleQuickLinkChange(index, "url", e.target.value)}
                    placeholder="URL or #anchor"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => removeQuickLink(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={addQuickLink}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Quick Link
            </button>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="showSocialLinks"
            checked={config.showSocialLinks !== false}
            onChange={(e) => handleChange("showSocialLinks", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showSocialLinks" className="text-sm font-semibold text-gray-900">
            Show Social Media Links
          </label>
        </div>

        {config.showSocialLinks !== false && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={config.facebookUrl || ""}
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={config.instagramUrl || ""}
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter URL
              </label>
              <input
                type="url"
                value={config.twitterUrl || ""}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={config.linkedinUrl || ""}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Appearance</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <select
              value={config.backgroundColor || "primary"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary (Green)</option>
              <option value="white">White</option>
              <option value="dark">Dark Gray</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copyright Text
            </label>
            <input
              type="text"
              value={config.copyrightText || ""}
              onChange={(e) => handleChange("copyrightText", e.target.value)}
              placeholder="Leave empty for auto-generated copyright"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate: "© {new Date().getFullYear()} {config.companyName || "CuraGo"}. All rights reserved."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
