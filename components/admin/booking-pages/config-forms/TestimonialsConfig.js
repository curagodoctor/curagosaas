"use client";

import { useState } from "react";
import ImageUploader from "../shared/ImageUploader";

export default function TestimonialsConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    quote: "",
    name: "",
    location: "",
    procedure: "",
    rating: 5,
    image: "",
  });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.testimonials[index]);
  };

  const saveTestimonial = () => {
    if (!formData.quote || !formData.name) return;

    const testimonials = [...(config.testimonials || [])];
    if (editingIndex !== null) {
      testimonials[editingIndex] = formData;
    } else {
      testimonials.push(formData);
    }

    onChange({ ...config, testimonials });
    setEditingIndex(null);
    setFormData({ quote: "", name: "", location: "", procedure: "", rating: 5, image: "" });
  };

  const removeTestimonial = (index) => {
    const testimonials = config.testimonials.filter((_, i) => i !== index);
    onChange({ ...config, testimonials });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ quote: "", name: "", location: "", procedure: "", rating: 5, image: "" });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "What Our Patients Say"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="What Our Patients Say"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout
        </label>
        <select
          value={config.layout || "grid"}
          onChange={(e) => handleChange("layout", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="grid">Grid (show all)</option>
          <option value="carousel">Carousel (slideshow)</option>
        </select>
      </div>

      {/* Testimonials List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Testimonials ({config.testimonials?.length || 0})
        </label>

        {config.testimonials && config.testimonials.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  {testimonial.image && (
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{testimonial.name}</span>
                      <span className="text-yellow-400">{"⭐".repeat(testimonial.rating || 5)}</span>
                    </div>
                    <p className="text-xs text-gray-600 italic mb-1">"{testimonial.quote}"</p>
                    {testimonial.procedure && (
                      <span className="text-xs text-gray-500">{testimonial.procedure}</span>
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
                      onClick={() => removeTestimonial(index)}
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
            {editingIndex !== null ? "Edit Testimonial" : "Add New Testimonial"}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Rajesh Kumar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Testimonial *</label>
              <textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                rows={3}
                placeholder="What did the patient say about their experience?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location (optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Mumbai"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Procedure (optional)</label>
              <input
                type="text"
                value={formData.procedure}
                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                placeholder="e.g., Gallbladder Surgery"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <ImageUploader
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              slug={slug}
              label="Patient Photo (optional)"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveTestimonial}
                disabled={!formData.quote || !formData.name}
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
