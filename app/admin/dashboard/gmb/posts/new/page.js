'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewGmbPost() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    content: '',
    postType: 'STANDARD',
    mediaType: 'none',
    mediaUrl: '',
    ctaType: 'NONE',
    ctaUrl: '',
    scheduleType: 'now', // 'now' or 'later'
    scheduledDate: '',
    scheduledTime: '',
    // Event fields
    eventTitle: '',
    eventStartDate: '',
    eventEndDate: '',
    // Offer fields
    offerTitle: '',
    offerTerms: '',
    couponCode: '',
    redeemUrl: '',
    offerStartDate: '',
    offerEndDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.content.trim()) {
      setError('Post content is required');
      return;
    }

    if (formData.content.length > 1500) {
      setError('Post content cannot exceed 1500 characters');
      return;
    }

    try {
      setSaving(true);

      // Build request body
      const body = {
        content: formData.content,
        postType: formData.postType,
        mediaType: formData.mediaType,
        mediaUrl: formData.mediaType !== 'none' ? formData.mediaUrl : null,
        ctaType: formData.ctaType,
        ctaUrl: formData.ctaType !== 'NONE' ? formData.ctaUrl : null,
      };

      // Add scheduled time if scheduling for later
      if (formData.scheduleType === 'later' && formData.scheduledDate && formData.scheduledTime) {
        body.scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      }

      // Add event fields
      if (formData.postType === 'EVENT') {
        body.eventTitle = formData.eventTitle;
        body.eventStartDate = formData.eventStartDate;
        body.eventEndDate = formData.eventEndDate;
      }

      // Add offer fields
      if (formData.postType === 'OFFER') {
        body.offerTitle = formData.offerTitle;
        body.offerTerms = formData.offerTerms;
        body.couponCode = formData.couponCode;
        body.redeemUrl = formData.redeemUrl;
        body.offerStartDate = formData.offerStartDate;
        body.offerEndDate = formData.offerEndDate;
      }

      const res = await fetch('/api/doctor/gmb/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin/dashboard/gmb/posts');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/dashboard/gmb" className="hover:text-[#096b17]">GMB</Link>
          <span>/</span>
          <Link href="/admin/dashboard/gmb/posts" className="hover:text-[#096b17]">Posts</Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create GMB Post</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Type */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Post Type</h2>
          <div className="flex gap-4">
            {[
              { value: 'STANDARD', label: 'Update', desc: 'Share news or updates' },
              { value: 'EVENT', label: 'Event', desc: 'Promote an event' },
              { value: 'OFFER', label: 'Offer', desc: 'Share a special offer' },
            ].map(type => (
              <label
                key={type.value}
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.postType === type.value
                    ? 'border-[#096b17] bg-[#096b17]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="postType"
                  value={type.value}
                  checked={formData.postType === type.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-sm text-gray-500">{type.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Content</h2>

          <div className="mb-4">
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={5}
              maxLength={1500}
              placeholder="What would you like to share? This will appear on your Google Business Profile."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17] resize-none"
            />
            <p className="text-sm text-gray-500 text-right mt-1">
              {formData.content.length}/1500 characters
            </p>
          </div>

          {/* Event Fields */}
          {formData.postType === 'EVENT' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleChange}
                  maxLength={58}
                  placeholder="Enter event title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="eventStartDate"
                    value={formData.eventStartDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="eventEndDate"
                    value={formData.eventEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Offer Fields */}
          {formData.postType === 'OFFER' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title</label>
                <input
                  type="text"
                  name="offerTitle"
                  value={formData.offerTitle}
                  onChange={handleChange}
                  maxLength={58}
                  placeholder="e.g., 20% off consultations"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code (optional)</label>
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    placeholder="e.g., SAVE20"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redeem URL (optional)</label>
                  <input
                    type="url"
                    name="redeemUrl"
                    value={formData.redeemUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    name="offerStartDate"
                    value={formData.offerStartDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    name="offerEndDate"
                    value={formData.offerEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions (optional)</label>
                <textarea
                  name="offerTerms"
                  value={formData.offerTerms}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  placeholder="Enter any terms and conditions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Media (Optional)</h2>

          <div className="flex gap-4 mb-4">
            {[
              { value: 'none', label: 'No Media' },
              { value: 'photo', label: 'Photo' },
              { value: 'video', label: 'Video' },
            ].map(type => (
              <label
                key={type.value}
                className={`px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                  formData.mediaType === type.value
                    ? 'border-[#096b17] bg-[#096b17]/5 text-[#096b17]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="mediaType"
                  value={type.value}
                  checked={formData.mediaType === type.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {type.label}
              </label>
            ))}
          </div>

          {formData.mediaType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.mediaType === 'photo' ? 'Photo' : 'Video'} URL
              </label>
              <input
                type="url"
                name="mediaUrl"
                value={formData.mediaUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a publicly accessible URL. For best results, use images at least 720x720 pixels.
              </p>
            </div>
          )}
        </div>

        {/* Call To Action */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Call To Action (Optional)</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Type</label>
              <select
                name="ctaType"
                value={formData.ctaType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
              >
                <option value="NONE">No Button</option>
                <option value="BOOK">Book</option>
                <option value="ORDER">Order Online</option>
                <option value="SHOP">Shop</option>
                <option value="LEARN_MORE">Learn More</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="CALL">Call Now</option>
              </select>
            </div>

            {formData.ctaType !== 'NONE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                <input
                  type="url"
                  name="ctaUrl"
                  value={formData.ctaUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Schedule</h2>

          <div className="flex gap-4 mb-4">
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.scheduleType === 'now'
                  ? 'border-[#096b17] bg-[#096b17]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scheduleType"
                value="now"
                checked={formData.scheduleType === 'now'}
                onChange={handleChange}
                className="sr-only"
              />
              <p className="font-medium text-gray-900">Publish Now</p>
              <p className="text-sm text-gray-500">Post immediately</p>
            </label>

            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.scheduleType === 'later'
                  ? 'border-[#096b17] bg-[#096b17]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scheduleType"
                value="later"
                checked={formData.scheduleType === 'later'}
                onChange={handleChange}
                className="sr-only"
              />
              <p className="font-medium text-gray-900">Schedule for Later</p>
              <p className="text-sm text-gray-500">Choose date and time</p>
            </label>
          </div>

          {formData.scheduleType === 'later' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/dashboard/gmb/posts"
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#096b17] text-white rounded-lg hover:bg-[#075212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {formData.scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
              </>
            ) : (
              formData.scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
