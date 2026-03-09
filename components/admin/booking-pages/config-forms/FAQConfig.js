"use client";

import { useState } from "react";

export default function FAQConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    ctaText: "",
    ctaLink: "",
  });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.faqs[index]);
  };

  const saveFAQ = () => {
    if (!formData.question || !formData.answer) return;

    const faqs = [...(config.faqs || [])];
    if (editingIndex !== null) {
      faqs[editingIndex] = formData;
    } else {
      faqs.push(formData);
    }

    onChange({ ...config, faqs });
    setEditingIndex(null);
    setFormData({ question: "", answer: "", ctaText: "", ctaLink: "" });
  };

  const removeFAQ = (index) => {
    const faqs = config.faqs.filter((_, i) => i !== index);
    onChange({ ...config, faqs });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const faqs = [...config.faqs];
    [faqs[index - 1], faqs[index]] = [faqs[index], faqs[index - 1]];
    onChange({ ...config, faqs });
  };

  const moveDown = (index) => {
    if (index === config.faqs.length - 1) return;
    const faqs = [...config.faqs];
    [faqs[index], faqs[index + 1]] = [faqs[index + 1], faqs[index]];
    onChange({ ...config, faqs });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ question: "", answer: "", ctaText: "", ctaLink: "" });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Frequently Asked Questions"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Frequently Asked Questions"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle (optional)
        </label>
        <input
          type="text"
          value={config.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Brief description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowMultipleOpen"
          checked={config.allowMultipleOpen === true}
          onChange={(e) => handleChange("allowMultipleOpen", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="allowMultipleOpen" className="text-sm text-gray-700">
          Allow multiple FAQs to be open at once
        </label>
      </div>

      {/* FAQs List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          FAQs ({config.faqs?.length || 0})
        </label>

        {config.faqs && config.faqs.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.faqs.map((faq, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 mb-1">{faq.question}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">{faq.answer}</div>
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
                      onClick={() => moveUp(index)}
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
                      onClick={() => moveDown(index)}
                      disabled={index === config.faqs.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
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
            {editingIndex !== null ? "Edit FAQ" : "Add New FAQ"}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., How long does the surgery take?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Answer *</label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
                placeholder="Provide a detailed answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t border-gray-300 pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Optional Call-to-Action</p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="CTA text (e.g., Learn more)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="CTA link (e.g., #booking)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveFAQ}
                disabled={!formData.question || !formData.answer}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </div>
  );
}
