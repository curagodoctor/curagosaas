'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function BlogArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useModal();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
    featuredImage: { url: '', alt: '' },
    category: '',
    tags: [],
    status: 'draft',

    problemSection: {
      content: '',
    },
    clinicalSection: {
      content: '',
    },
    specialistSection: {
      content: '',
      stats: {
        surgeriesPerformed: 250,
        proceduresSupervised: 300,
      },
    },
    complexCasesSection: {
      content: '',
    },
    surgicalAuditSection: {
      content: '',
      auditSteps: [
        { step: 'Detailed Scan Review', description: '' },
        { step: 'Anatomy Mapping', description: '' },
        { step: 'Transparent Wait vs. Act Roadmap', description: '' },
      ],
      auditPrice: 150,
    },
    faqSection: {
      faqs: [
        { question: '', answer: '' },
      ],
    },
  });

  useEffect(() => {
    if (!isNew) {
      fetchArticle();
    }
  }, [params.id]);

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/blog-articles/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.article) {
        setFormData(data.article);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching article:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to load article',
        type: 'error'
      });
      router.push('/admin/dashboard/blog-articles');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleFAQChange = (index, field, value) => {
    const newFaqs = [...formData.faqSection.faqs];
    newFaqs[index][field] = value;
    handleNestedChange('faqSection', 'faqs', newFaqs);
  };

  const addFAQ = () => {
    handleNestedChange('faqSection', 'faqs', [
      ...formData.faqSection.faqs,
      { question: '', answer: '' },
    ]);
  };

  const removeFAQ = (index) => {
    const newFaqs = formData.faqSection.faqs.filter((_, i) => i !== index);
    handleNestedChange('faqSection', 'faqs', newFaqs);
  };

  const handleAuditStepChange = (index, field, value) => {
    const newSteps = [...formData.surgicalAuditSection.auditSteps];
    newSteps[index][field] = value;
    handleNestedChange('surgicalAuditSection', 'auditSteps', newSteps);
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    handleChange('slug', slug);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      await showAlert({
        title: 'Invalid File Type',
        message: 'Only JPG, PNG, and WebP images are allowed.',
        type: 'error'
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      await showAlert({
        title: 'File Too Large',
        message: 'Image size must be less than 5MB.',
        type: 'error'
      });
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('folder', 'blog-articles');

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        handleNestedChange('featuredImage', 'url', data.url);
        await showAlert({
          title: 'Success',
          message: 'Image uploaded successfully!',
          type: 'success'
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      await showAlert({
        title: 'Upload Failed',
        message: error.message || 'Failed to upload image',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = isNew
        ? '/api/admin/blog-articles'
        : `/api/admin/blog-articles/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await showAlert({
          title: 'Success',
          message: `Article ${isNew ? 'created' : 'updated'} successfully!`,
          type: 'success'
        });
        router.push('/admin/dashboard/blog-articles');
      } else {
        throw new Error(data.error || 'Failed to save article');
      }
    } catch (error) {
      await showAlert({
        title: 'Error',
        message: error.message || 'Failed to save article',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/dashboard/blog-articles')}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Articles
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isNew ? 'Create New Article' : 'Edit Article'}
        </h1>
        <p className="text-gray-600 mt-2">Fill in the standardized sections for your medical blog</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={generateSlug}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Gallbladder Specialist in Tilak Nagar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., gallbladder-audit-srv-hospital"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description (SEO)
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description for search engines (max 160 characters)"
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="Gallstones">Gallstones</option>
                  <option value="Pancreatitis">Pancreatitis</option>
                  <option value="Liver Disease">Liver Disease</option>
                  <option value="IBS">IBS</option>
                  <option value="GERD">GERD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image (Thumbnail)
              </label>

              {/* Image Preview */}
              {formData.featuredImage.url && (
                <div className="mb-4 relative">
                  <img
                    src={formData.featuredImage.url}
                    alt="Featured thumbnail"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleNestedChange('featuredImage', 'url', '')}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formData.featuredImage.url ? 'Change Image' : 'Upload Image'}
                      </span>
                    )}
                  </div>
                </label>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Recommended: 1200x630px (JPG, PNG, or WebP, max 5MB)
              </p>

              {/* Alt Text */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Alt Text (for SEO)
                </label>
                <input
                  type="text"
                  value={formData.featuredImage.alt}
                  onChange={(e) => handleNestedChange('featuredImage', 'alt', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the image for accessibility"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: The Problem */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 1: The Problem: Common Misconceptions & Symptoms
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect with the patient's pain. Identify the specific symptom or myth this article is debunking.
          </p>
          <textarea
            value={formData.problemSection.content}
            onChange={(e) => handleNestedChange('problemSection', 'content', e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain the common misconceptions and symptoms patients experience..."
          />
        </div>

        {/* Section 2: Clinical Deep Dive */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 2: Clinical Deep Dive: Why This Condition Needs Attention
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Explain the pathology simply but professionally. Discuss risks of delay.
          </p>
          <textarea
            value={formData.clinicalSection.content}
            onChange={(e) => handleNestedChange('clinicalSection', 'content', e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain the medical condition and why it requires specialist attention..."
          />
        </div>

        {/* Section 3: Specialist Advantage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 3: The Specialist Advantage: My Clinical Approach
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Highlight your Gold Medalist expertise and experience.
          </p>
          <textarea
            value={formData.specialistSection.content}
            onChange={(e) => handleNestedChange('specialistSection', 'content', e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain your unique approach and why a specialist opinion is necessary..."
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surgeries Performed
              </label>
              <input
                type="number"
                value={formData.specialistSection.stats.surgeriesPerformed}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specialistSection: {
                    ...prev.specialistSection,
                    stats: { ...prev.specialistSection.stats, surgeriesPerformed: parseInt(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Procedures Supervised
              </label>
              <input
                type="number"
                value={formData.specialistSection.stats.proceduresSupervised}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specialistSection: {
                    ...prev.specialistSection,
                    stats: { ...prev.specialistSection.stats, proceduresSupervised: parseInt(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Complex Cases */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 4: Complex Cases: Managing High-Risk Scenarios
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Build trust for difficult cases. Detail your capability in handling complications.
          </p>
          <textarea
            value={formData.complexCasesSection.content}
            onChange={(e) => handleNestedChange('complexCasesSection', 'content', e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe how you handle high-risk and complex cases..."
          />
        </div>

        {/* Section 5: Surgical Audit */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 5: The Surgical Audit: What to Expect During Your Consultation
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Sell the ₹150 Audit. Explain what patients can expect.
          </p>
          <textarea
            value={formData.surgicalAuditSection.content}
            onChange={(e) => handleNestedChange('surgicalAuditSection', 'content', e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain the surgical audit process and its value..."
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Price (₹)
            </label>
            <input
              type="number"
              value={formData.surgicalAuditSection.auditPrice}
              onChange={(e) => handleNestedChange('surgicalAuditSection', 'auditPrice', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Audit Steps
            </label>
            {formData.surgicalAuditSection.auditSteps.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <input
                  type="text"
                  value={step.step}
                  onChange={(e) => handleAuditStepChange(index, 'step', e.target.value)}
                  placeholder="Step name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <textarea
                  value={step.description}
                  onChange={(e) => handleAuditStepChange(index, 'description', e.target.value)}
                  placeholder="Step description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: FAQs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Section 6: FAQs: Clear Answers for Patients
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Address common fears and concerns with 3 short, punchy Q&As.
          </p>

          <div className="space-y-4">
            {formData.faqSection.faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <label className="text-sm font-medium text-gray-700">FAQ #{index + 1}</label>
                  {formData.faqSection.faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                  placeholder="Question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addFAQ}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add FAQ
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard/blog-articles')}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (isNew ? 'Create Article' : 'Update Article')}
          </button>
        </div>
      </form>
    </div>
  );
}
