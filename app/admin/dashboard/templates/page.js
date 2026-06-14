'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function TemplatesPage() {
  const { showAlert, showConfirm } = useModal();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', channel: 'sms', subject: '', body: '',
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/doctor/templates', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.body.trim()) {
      await showAlert({ title: 'Error', message: 'Name and body are required', type: 'error' });
      return;
    }
    if (formData.channel === 'email' && !formData.subject.trim()) {
      await showAlert({ title: 'Error', message: 'Subject is required for email templates', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = editing ? `/api/doctor/templates/${editing._id}` : '/api/doctor/templates';
      const method = editing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditing(null);
        setFormData({ name: '', channel: 'sms', subject: '', body: '' });
        fetchTemplates();
      } else {
        await showAlert({ title: 'Error', message: data.error, type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to save template', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template) => {
    setEditing(template);
    setFormData({
      name: template.name,
      channel: template.channel,
      subject: template.subject || '',
      body: template.body,
    });
    setShowModal(true);
  };

  const handleDelete = async (template) => {
    const confirmed = await showConfirm({
      title: 'Delete Template',
      message: `Delete "${template.name}"? This cannot be undone.`,
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/doctor/templates/${template._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchTemplates();
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to delete', type: 'error' });
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await fetch(`/api/doctor/templates/${template._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const filtered = filterChannel === 'all'
    ? templates
    : templates.filter(t => t.channel === filterChannel);

  const smsCount = templates.filter(t => t.channel === 'sms').length;
  const emailCount = templates.filter(t => t.channel === 'email').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-500 text-sm mt-1">{templates.length} templates ({smsCount} SMS, {emailCount} Email)</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({ name: '', channel: 'sms', subject: '', body: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Template
        </button>
      </div>

      {/* Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {['{{name}}', '{{phone}}', '{{reviewLink}}', '{{clinicName}}', '{{doctorName}}'].map(v => (
            <button
              key={v}
              onClick={() => navigator.clipboard.writeText(v)}
              className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded hover:bg-blue-200 transition-colors"
              title="Click to copy"
            >
              {v}
            </button>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">Click a variable to copy. These get replaced with contact/doctor info when sending.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${templates.length})` },
          { key: 'sms', label: `SMS (${smsCount})` },
          { key: 'email', label: `Email (${emailCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterChannel(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterChannel === f.key
                ? 'bg-[#096b17] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-500">No templates found</p>
          </div>
        ) : (
          filtered.map(template => (
            <div key={template._id} className={`bg-white rounded-xl shadow-sm border p-5 ${template.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.channel === 'sms' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {template.channel.toUpperCase()}
                  </span>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {!template.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`text-xs px-2 py-1 rounded ${template.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-xs text-[#096b17] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {template.channel === 'email' && template.subject && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="text-gray-400">Subject:</span> {template.subject}
                </p>
              )}

              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Template' : 'Create Template'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="e.g., Review Follow-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, channel: 'sms' }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      formData.channel === 'sms'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, channel: 'email' }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      formData.channel === 'email'
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {formData.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                    placeholder="e.g., We'd love your feedback!"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Message Body *</label>
                  <span className="text-xs text-gray-400">{formData.body.length}/2000</span>
                </div>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none resize-none"
                  placeholder={formData.channel === 'sms'
                    ? "Hi {{name}}, thank you for visiting {{clinicName}}! Please leave a review: {{reviewLink}}"
                    : "Hi {{name}},\n\nThank you for visiting {{doctorName}} at {{clinicName}}.\n\nWe'd appreciate your feedback: {{reviewLink}}\n\nThank you!"}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['{{name}}', '{{phone}}', '{{reviewLink}}', '{{clinicName}}', '{{doctorName}}'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, body: prev.body + v }))}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded hover:bg-gray-200 transition-colors"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {formData.body && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                  <div className={`rounded-lg p-3 text-sm ${formData.channel === 'sms' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'}`}>
                    {formData.channel === 'email' && formData.subject && (
                      <p className="font-medium mb-1">{formData.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ name: 'John Doe', doctorName: 'Dr. Smith', clinicName: 'Smith Clinic', reviewLink: 'https://g.page/...', phone: '9876543210' }[k] || `{{${k}}}` ))}</p>
                    )}
                    <p className="whitespace-pre-wrap">{formData.body.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ name: 'John Doe', doctorName: 'Dr. Smith', clinicName: 'Smith Clinic', reviewLink: 'https://g.page/...', phone: '9876543210' }[k] || `{{${k}}}` ))}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
