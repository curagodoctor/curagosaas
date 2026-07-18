'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function PracticeOSPage() {
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/practice-os/frameworks');
      const data = await res.json();
      if (data.success) setFrameworks(data.frameworks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice OS</h1>
          <p className="text-gray-500">Build and manage the doctor mission curriculum.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/platform/practice-os/import/template"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Download Template
          </a>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Import Missions
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            New Framework
          </button>
        </div>
      </div>

      {/* Framework list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4" colSpan={5}><div className="h-4 bg-gray-100 rounded w-1/3" /></td>
                  </tr>
                ))
              ) : frameworks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No frameworks yet. Download the template, fill in your missions, and click <strong>Import Missions</strong>.
                  </td>
                </tr>
              ) : (
                frameworks.map((fw) => (
                  <tr key={fw._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/practice-os/frameworks/${fw._id}`} className="text-blue-600 hover:underline font-medium">
                        {fw.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{fw.category || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{fw.moduleCount}</td>
                    <td className="px-6 py-4 text-gray-600">{fw.missionCount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fw.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fw.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={load} />}
      {showNew && <NewFrameworkModal onClose={() => setShowNew(false)} onDone={load} />}
    </div>
  );
}

function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/platform/practice-os/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        onDone();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Import Missions" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Upload a filled <strong>.xlsx</strong> template. One row = one mission. Frameworks and modules are
        created automatically; re-importing updates existing missions.
      </p>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">Import complete</p>
          <p className="text-green-700">Created: {result.created} · Updated: {result.updated} · Skipped: {result.skipped}</p>
          {result.errors?.length > 0 && (
            <ul className="mt-2 text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          {result ? 'Close' : 'Cancel'}
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Importing…' : 'Import'}
        </button>
      </div>
    </Modal>
  );
}

function NewFrameworkModal({ onClose, onDone }) {
  const [form, setForm] = useState({ title: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/platform/practice-os/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onDone(); onClose(); }
      else setError(data.error || 'Failed to create');
    } catch (e) {
      setError('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Framework" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Practice Building" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
