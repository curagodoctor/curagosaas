"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewBookingPageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    metaDescription: "",
    metaKeywords: "",
    consultationFee: 1000,
    bookingFee: 150,
    status: "draft",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      // Auto-generate slug if it hasn't been manually edited
      slug: prev.slug === "" || prev.slug === generateSlug(prev.title)
        ? generateSlug(title)
        : prev.slug,
    }));
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse keywords from comma-separated string
      const keywords = formData.metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      const response = await fetch("/api/admin/booking-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          metaKeywords: keywords,
          consultationFee: Number(formData.consultationFee),
          bookingFee: Number(formData.bookingFee),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create page");
      }

      const data = await response.json();
      // Redirect to edit page to add sections
      router.push(`/admin/dashboard/pages/${data.page._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/dashboard/pages"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Website</h1>
            <p className="text-gray-600 mt-1">Set up the basic details for your clinic website</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Page Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              required
              placeholder="e.g., Gallbladder Surgery Consultation"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">This will be shown as the page heading</p>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                /myclinic/
              </span>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="gallbladder-surgery"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Lowercase letters, numbers, and hyphens only. Auto-generated from title.
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows={3}
              maxLength={160}
              placeholder="Brief description for search engines (max 160 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.metaDescription.length}/160 characters
            </p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              id="metaKeywords"
              name="metaKeywords"
              value={formData.metaKeywords}
              onChange={handleChange}
              placeholder="gallbladder, surgery, treatment (comma-separated)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          {/* Consultation Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                id="consultationFee"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                required
                min={0}
                step={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bookingFee" className="block text-sm font-medium text-gray-700 mb-2">
                Booking Fee (₹)
              </label>
              <input
                type="number"
                id="bookingFee"
                name="bookingFee"
                value={formData.bookingFee}
                onChange={handleChange}
                required
                min={0}
                step={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft (not visible to public)</option>
              <option value="published">Published (visible to public)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              You can change this later from the page editor
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Page & Add Sections"}
          </button>
          <Link
            href="/admin/dashboard/pages"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
          >
            Cancel
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Next Steps</p>
              <p>
                After creating the page, you'll be taken to the page builder where you can add
                sections like hero carousel, benefits list, FAQs, and more.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
