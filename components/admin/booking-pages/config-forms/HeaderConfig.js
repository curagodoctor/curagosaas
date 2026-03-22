"use client";

import { useState, useMemo } from "react";
import ImageUploader from "../shared/ImageUploader";

// Section metadata for auto-navigation
const SECTION_NAV_INFO = {
  hero_carousel: { navName: "Home", navGroup: null },
  banner_image: { navName: "Home", navGroup: null },
  benefits_list: { navName: "Why Us", navGroup: "About" },
  doctor_profile: { navName: "About", navGroup: "About" },
  testimonials: { navName: "Testimonials", navGroup: "About" },
  faqs: { navName: "FAQs", navGroup: "Info" },
  location_map: { navName: "Location", navGroup: "Info" },
  disease_icons_scroll: { navName: "Services", navGroup: "Services" },
  custom_text: { navName: "Content", navGroup: "Services" },
  booking_form: { navName: "Book Now", navGroup: null },
  clinic_info: { navName: "Clinic", navGroup: "Info" },
  professional_fees: { navName: "Fees", navGroup: "Info" },
  // Hidden sections (not shown in nav)
  header: { navName: null, navGroup: "hidden" },
  footer: { navName: null, navGroup: "hidden" },
  cta_button: { navName: null, navGroup: "hidden" },
  whatsapp_sticky: { navName: null, navGroup: "hidden" },
  book_now_sticky: { navName: null, navGroup: "hidden" },
  faq_chatbot: { navName: null, navGroup: "hidden" },
};

export default function HeaderConfig({ config, onChange, slug, sections = [] }) {
  const [newLink, setNewLink] = useState({ text: "", url: "" });
  const [editingIndex, setEditingIndex] = useState(null);

  // Derive navMode with default "auto"
  const navMode = config.navMode || "auto";
  const autoNavConfig = config.autoNavConfig || { useSmartGroups: true, excludeSections: [], customLabels: {} };

  // Get visible sections that can appear in nav
  const navSections = useMemo(() => {
    return sections
      .filter(s => s.visible !== false)
      .filter(s => {
        const info = SECTION_NAV_INFO[s.type];
        return info && info.navGroup !== "hidden";
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections]);

  // Build preview of auto-generated nav
  const autoNavPreview = useMemo(() => {
    const includedSections = navSections.filter(
      s => !autoNavConfig.excludeSections?.includes(s.type)
    );

    if (!autoNavConfig.useSmartGroups) {
      // No grouping - flat list
      return includedSections.map(s => ({
        type: "link",
        text: autoNavConfig.customLabels?.[s.type] || SECTION_NAV_INFO[s.type]?.navName || s.type,
        url: `#${s.type}`,
      }));
    }

    // Smart grouping
    const groups = {};
    const topLevel = [];

    includedSections.forEach(s => {
      const info = SECTION_NAV_INFO[s.type];
      const navName = autoNavConfig.customLabels?.[s.type] || info?.navName || s.type;
      const navGroup = info?.navGroup;

      if (!navGroup) {
        topLevel.push({ type: "link", text: navName, url: `#${s.type}`, sectionType: s.type });
      } else {
        if (!groups[navGroup]) groups[navGroup] = [];
        groups[navGroup].push({ text: navName, url: `#${s.type}`, sectionType: s.type });
      }
    });

    const result = [];

    // Add top-level items and groups in order
    const processedGroups = new Set();

    includedSections.forEach(s => {
      const info = SECTION_NAV_INFO[s.type];
      const navGroup = info?.navGroup;

      if (!navGroup) {
        // Find and add this top-level item
        const item = topLevel.find(t => t.sectionType === s.type);
        if (item && !result.find(r => r.sectionType === s.type)) {
          result.push(item);
        }
      } else if (!processedGroups.has(navGroup)) {
        // Add group as dropdown (or single item if only one section)
        processedGroups.add(navGroup);
        const groupItems = groups[navGroup];
        if (groupItems?.length === 1) {
          result.push({ type: "link", text: groupItems[0].text, url: groupItems[0].url });
        } else if (groupItems?.length > 1) {
          result.push({ type: "dropdown", label: navGroup, items: groupItems });
        }
      }
    });

    return result;
  }, [navSections, autoNavConfig]);

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const handleAutoNavConfigChange = (field, value) => {
    onChange({
      ...config,
      autoNavConfig: { ...autoNavConfig, [field]: value },
    });
  };

  const toggleSectionExclude = (sectionType) => {
    const excluded = autoNavConfig.excludeSections || [];
    const newExcluded = excluded.includes(sectionType)
      ? excluded.filter(t => t !== sectionType)
      : [...excluded, sectionType];
    handleAutoNavConfigChange("excludeSections", newExcluded);
  };

  const updateCustomLabel = (sectionType, label) => {
    const customLabels = { ...autoNavConfig.customLabels, [sectionType]: label };
    if (!label) delete customLabels[sectionType];
    handleAutoNavConfigChange("customLabels", customLabels);
  };

  const handleCtaChange = (field, value) => {
    onChange({
      ...config,
      ctaButton: { ...config.ctaButton, [field]: value },
    });
  };

  // Manual nav link functions
  const addNavLink = () => {
    if (!newLink.text.trim() || !newLink.url.trim()) return;
    const navLinks = [...(config.navLinks || []), newLink];
    onChange({ ...config, navLinks });
    setNewLink({ text: "", url: "" });
  };

  const updateNavLink = () => {
    if (!newLink.text.trim() || !newLink.url.trim()) return;
    const navLinks = [...config.navLinks];
    navLinks[editingIndex] = newLink;
    onChange({ ...config, navLinks });
    setEditingIndex(null);
    setNewLink({ text: "", url: "" });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setNewLink(config.navLinks[index]);
  };

  const removeNavLink = (index) => {
    const navLinks = config.navLinks.filter((_, i) => i !== index);
    onChange({ ...config, navLinks });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNewLink({ text: "", url: "" });
  };

  const moveLink = (index, direction) => {
    const navLinks = [...config.navLinks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navLinks.length) return;
    [navLinks[index], navLinks[newIndex]] = [navLinks[newIndex], navLinks[index]];
    onChange({ ...config, navLinks });
  };

  return (
    <div className="space-y-4">
      {/* Logo Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo Text
        </label>
        <input
          type="text"
          value={config.logoText || ""}
          onChange={(e) => handleChange("logoText", e.target.value)}
          placeholder="e.g., Dr. Priya Sharma"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use doctor's display name
        </p>
      </div>

      <ImageUploader
        value={config.logoUrl || ""}
        onChange={(url) => handleChange("logoUrl", url)}
        slug={slug}
        label="Logo Image (Optional)"
      />
      <p className="text-xs text-gray-500 -mt-2">
        Leave empty to use doctor's profile image
      </p>

      {/* Navigation Mode Toggle */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Navigation Links
        </label>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleChange("navMode", "auto")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              navMode === "auto"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Auto-generate
          </button>
          <button
            type="button"
            onClick={() => handleChange("navMode", "manual")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              navMode === "manual"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Manual Links
          </button>
        </div>

        {navMode === "auto" ? (
          /* Auto Navigation Mode */
          <div className="space-y-4">
            <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              Navigation is auto-generated from your page sections. Click a link to scroll to that section.
            </p>

            {/* Smart Grouping Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useSmartGroups"
                checked={autoNavConfig.useSmartGroups !== false}
                onChange={(e) => handleAutoNavConfigChange("useSmartGroups", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="useSmartGroups" className="text-sm text-gray-700">
                Smart grouping (combine related sections into dropdowns)
              </label>
            </div>

            {/* Section List */}
            {navSections.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  Include in Navigation:
                </label>
                {navSections.map((section) => {
                  const info = SECTION_NAV_INFO[section.type];
                  const isExcluded = autoNavConfig.excludeSections?.includes(section.type);
                  const customLabel = autoNavConfig.customLabels?.[section.type];

                  return (
                    <div
                      key={section._id || section.type}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        isExcluded ? "bg-gray-50 border-gray-200" : "bg-green-50 border-green-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => toggleSectionExclude(section.type)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={customLabel || ""}
                          onChange={(e) => updateCustomLabel(section.type, e.target.value)}
                          placeholder={info?.navName || section.type}
                          disabled={isExcluded}
                          className={`w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 ${
                            isExcluded ? "bg-gray-100 text-gray-400" : ""
                          }`}
                        />
                      </div>
                      {autoNavConfig.useSmartGroups && info?.navGroup && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          {info.navGroup}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Add sections to your page to generate navigation links.
              </p>
            )}

            {/* Preview */}
            {autoNavPreview.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Preview:
                </label>
                <div className="flex flex-wrap gap-2">
                  {autoNavPreview.map((item, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded ${
                        item.type === "dropdown"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-gray-700 border border-gray-300"
                      }`}
                    >
                      {item.type === "dropdown" ? `${item.label} ▾` : item.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Navigation Mode */
          <div className="space-y-3">
            {config.navLinks && config.navLinks.length > 0 && (
              <div className="space-y-2">
                {config.navLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{link.text}</div>
                      <div className="text-xs text-gray-500 truncate">{link.url}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLink(index, "up")}
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
                        onClick={() => moveLink(index, "down")}
                        disabled={index === config.navLinks.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
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
                        onClick={() => removeNavLink(index)}
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

            {/* Add/Edit Link Form */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newLink.text}
                onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
                placeholder="Link text (e.g., About)"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="URL (e.g., #about)"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={editingIndex !== null ? updateNavLink : addNavLink}
                disabled={!newLink.text.trim() || !newLink.url.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? "Update Link" : "Add Link"}
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
            <p className="text-xs text-gray-500">
              Use # followed by section type for same-page links (e.g., #booking_form, #doctor_profile)
            </p>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="showCtaButton"
            checked={config.ctaButton?.show !== false}
            onChange={(e) => handleCtaChange("show", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showCtaButton" className="text-sm font-medium text-gray-700">
            Show CTA Button
          </label>
        </div>

        {config.ctaButton?.show !== false && (
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={config.ctaButton?.text || "Book Appointment"}
                onChange={(e) => handleCtaChange("text", e.target.value)}
                placeholder="Book Appointment"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={config.ctaButton?.url || "#booking_form"}
                onChange={(e) => handleCtaChange("url", e.target.value)}
                placeholder="#booking_form"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Style Options */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Style
        </label>
        <select
          value={config.backgroundColor || "white"}
          onChange={(e) => handleChange("backgroundColor", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="white">White</option>
          <option value="primary">Primary Color</option>
          <option value="transparent">Transparent (for hero images)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="stickyHeader"
          checked={config.sticky !== false}
          onChange={(e) => handleChange("sticky", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="stickyHeader" className="text-sm text-gray-700">
          Sticky header (stays at top when scrolling)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showNavigation"
          checked={config.showNavigation !== false}
          onChange={(e) => handleChange("showNavigation", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="showNavigation" className="text-sm text-gray-700">
          Show navigation links
        </label>
      </div>
    </div>
  );
}
