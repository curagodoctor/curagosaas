'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { BLOG_PAGE_TYPES, blocksForType, LOCATION_BLOCK_HEADING } from '@/lib/blogPageTypes';

// Turn an existing article's legacy fixed sections into editable blocks, so old
// posts open in the new modular editor without losing content.
function legacySectionsToBlocks(a) {
  const secs = [a?.problemSection, a?.clinicalSection, a?.specialistSection, a?.complexCasesSection, a?.surgicalAuditSection];
  return secs
    .filter((s) => s && (s.heading?.trim() || s.content?.trim()))
    .map((s) => ({ heading: s.heading || '', content: s.content || '' }));
}

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

    // Modular structure (new).
    pageType: '',
    blocks: [],
    locationBlock: { heading: '', content: '' },

    problemSection: {
      heading: '',
      content: '',
    },
    clinicalSection: {
      heading: '',
      content: '',
    },
    specialistSection: {
      heading: '',
      content: '',
      stats: {
        surgeriesPerformed: 250,
        proceduresSupervised: 300,
      },
    },
    complexCasesSection: {
      heading: '',
      content: '',
    },
    surgicalAuditSection: {
      heading: '',
      content: '',
      auditSteps: [
        { step: 'Detailed Scan Review', description: '' },
        { step: 'Anatomy Mapping', description: '' },
        { step: 'Transparent Wait vs. Act Roadmap', description: '' },
      ],
      auditPrice: 150,
    },
    faqSection: {
      heading: '',
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
      const response = await fetch(`/api/admin/blog-articles/${params.id}`, {
        credentials: 'include',
      });

      const data = await response.json();
      if (data.article) {
        const a = data.article;
        setFormData({
          ...a,
          pageType: a.pageType || '',
          // Prefer the new blocks; migrate legacy sections for old articles.
          blocks: (a.blocks && a.blocks.length) ? a.blocks : legacySectionsToBlocks(a),
          locationBlock: { heading: a.locationBlock?.heading || '', content: a.locationBlock?.content || '' },
          problemSection: { ...a.problemSection, heading: a.problemSection?.heading || '' },
          clinicalSection: { ...a.clinicalSection, heading: a.clinicalSection?.heading || '' },
          specialistSection: { ...a.specialistSection, heading: a.specialistSection?.heading || '' },
          complexCasesSection: { ...a.complexCasesSection, heading: a.complexCasesSection?.heading || '' },
          surgicalAuditSection: { ...a.surgicalAuditSection, heading: a.surgicalAuditSection?.heading || '' },
          faqSection: { ...a.faqSection, heading: a.faqSection?.heading || '' },
        });
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

  // --- Modular content blocks ---
  const setBlocks = (blocks) => setFormData((prev) => ({ ...prev, blocks }));
  const updateBlock = (index, field, value) => {
    setBlocks(formData.blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };
  const addBlock = () => setBlocks([...formData.blocks, { heading: '', content: '' }]);
  const removeBlock = (index) => setBlocks(formData.blocks.filter((_, i) => i !== index));
  const moveBlock = (index, dir) => {
    const t = index + dir;
    if (t < 0 || t >= formData.blocks.length) return;
    const next = formData.blocks.slice();
    [next[index], next[t]] = [next[t], next[index]];
    setBlocks(next);
  };
  // Apply a page type's suggested headings. Only overwrites blocks when they're
  // empty (or the author confirms), so it never wipes real content by accident.
  const applyPageType = (typeId) => {
    handleChange('pageType', typeId);
    if (!typeId) return;
    const suggested = blocksForType(typeId);
    const hasContent = formData.blocks.some((b) => b.heading?.trim() || b.content?.trim());
    if (!hasContent) { setBlocks(suggested); return; }
    if (window.confirm('Replace the current blocks with this page type’s suggested headings? Your text in existing blocks will be cleared.')) {
      setBlocks(suggested);
    }
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
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('folder', 'blog-articles');

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
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
      const url = isNew
        ? '/api/admin/blog-articles'
        : `/api/admin/blog-articles/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type a category (e.g., Cardiology, General Health)"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  <option value="General Health" />
                  <option value="Cardiology" />
                  <option value="Dermatology" />
                  <option value="Orthopedics" />
                  <option value="Gastroenterology" />
                  <option value="Pediatrics" />
                  <option value="Wellness" />
                  <option value="Nutrition" />
                </datalist>
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

        {/* Page type — picks the intent and suggests the H2 headings */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Page type</label>
          <p className="text-sm text-gray-600 mb-3">Pick what this page is about — we&apos;ll suggest the right H2 headings, which you can fully edit, reorder or remove.</p>
          <div className="flex flex-wrap gap-2">
            {BLOG_PAGE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyPageType(t.id)}
                title={t.description}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${formData.pageType === t.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content blocks — the modular body */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Content blocks</h2>
            <span className="text-sm text-gray-500">{formData.blocks.length} block{formData.blocks.length === 1 ? '' : 's'}</span>
          </div>
          {formData.blocks.length === 0 && (
            <p className="text-sm text-gray-500 mb-3">No blocks yet — pick a page type above, or add one manually.</p>
          )}
          <div className="space-y-4">
            {formData.blocks.map((b, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-400">H2 · Block {index + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="px-2 text-gray-400 hover:text-blue-600 disabled:opacity-30" title="Move up">↑</button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === formData.blocks.length - 1} className="px-2 text-gray-400 hover:text-blue-600 disabled:opacity-30" title="Move down">↓</button>
                    <button type="button" onClick={() => removeBlock(index)} className="px-2 text-red-500 hover:text-red-700 text-sm" title="Remove block">Remove</button>
                  </div>
                </div>
                <input
                  type="text"
                  value={b.heading}
                  onChange={(e) => updateBlock(index, 'heading', e.target.value)}
                  placeholder="Section heading (H2)"
                  className="w-full text-lg font-semibold text-gray-800 px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={b.content}
                  onChange={(e) => updateBlock(index, 'content', e.target.value)}
                  rows={5}
                  placeholder="Write this section…"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button type="button" onClick={addBlock} className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
              + Add block
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Tip: use <span className="font-mono">{'{{doctor_name}}'}</span> and <span className="font-mono">{'{{city}}'}</span> in a heading or body — they fill from the doctor&apos;s profile.</p>
        </div>

        {/* Clinic location block (optional) */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Clinic location block (optional)</label>
          <input
            type="text"
            value={formData.locationBlock.heading}
            onChange={(e) => handleNestedChange('locationBlock', 'heading', e.target.value)}
            placeholder={LOCATION_BLOCK_HEADING}
            className="w-full text-xl font-bold text-gray-800 px-3 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={formData.locationBlock.content}
            onChange={(e) => handleNestedChange('locationBlock', 'content', e.target.value)}
            rows={4}
            placeholder="Clinic address, directions, consultation hours, and how to book an appointment…"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Section heading</label>
          <input
            type="text"
            value={formData.faqSection.heading}
            onChange={(e) => handleNestedChange('faqSection', 'heading', e.target.value)}
            placeholder="FAQs: Clear Answers for Patients"
            className="w-full text-xl font-bold text-gray-800 px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
