'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function PlatformRepManagersPage() {
  const { showAlert, showConfirm } = useModal();

  const [managers, setManagers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    assignedDoctors: [],
  });

  const fetchManagers = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/reputation-managers', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers || []);
      }
    } catch (error) {
      console.error('Error fetching reputation managers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/platform/doctors?limit=200', { credentials: 'include' });
      const data = await res.json();
      if (data.doctors) {
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchDoctors();
  }, [fetchManagers]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      await showAlert({ title: 'Error', message: 'Name and email are required', type: 'error' });
      return;
    }
    if (!editingManager && !formData.password.trim()) {
      await showAlert({ title: 'Error', message: 'Password is required for new managers', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = editingManager
        ? `/api/platform/reputation-managers/${editingManager._id}`
        : '/api/platform/reputation-managers';
      const method = editingManager ? 'PATCH' : 'POST';

      const body = { ...formData };
      if (editingManager && !body.password.trim()) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingManager(null);
        setFormData({ name: '', email: '', password: '', assignedDoctors: [] });
        fetchManagers();
        await showAlert({
          title: 'Success',
          message: editingManager ? 'Reputation manager updated' : 'Reputation manager created',
          type: 'success',
        });
      } else {
        await showAlert({ title: 'Error', message: data.error || 'Failed to save', type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to save reputation manager', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name || '',
      email: manager.email || '',
      password: '',
      assignedDoctors: (manager.assignedDoctors || []).map((d) => (typeof d === 'string' ? d : d._id)),
    });
    setShowModal(true);
  };

  const handleDelete = async (manager) => {
    const confirmed = await showConfirm({
      title: 'Delete Reputation Manager',
      message: `Are you sure you want to delete ${manager.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/platform/reputation-managers/${manager._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success || res.ok) {
        fetchManagers();
        await showAlert({ title: 'Deleted', message: 'Reputation manager has been deleted', type: 'success' });
      } else {
        await showAlert({ title: 'Error', message: data.error || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to delete reputation manager', type: 'error' });
    }
  };

  const toggleDoctor = (doctorId) => {
    setFormData((prev) => ({
      ...prev,
      assignedDoctors: prev.assignedDoctors.includes(doctorId)
        ? prev.assignedDoctors.filter((id) => id !== doctorId)
        : [...prev.assignedDoctors, doctorId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reputation Managers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage reputation managers and their doctor assignments</p>
        </div>
        <button
          onClick={() => {
            setEditingManager(null);
            setFormData({ name: '', email: '', password: '', assignedDoctors: [] });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rep Manager
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {managers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500">No reputation managers yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-blue-600 hover:underline text-sm font-medium"
            >
              Add your first rep manager
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Assigned Doctors</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managers.map((manager) => (
                  <tr key={manager._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {manager.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <p className="font-medium text-gray-900">{manager.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{manager.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {manager.assignedDoctors?.length || 0} doctors
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          manager.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {manager.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(manager)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(manager)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingManager ? 'Edit Reputation Manager' : 'Add Reputation Manager'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="manager@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingManager ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={editingManager ? 'Leave blank to keep current' : 'Set a password'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Doctors</label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2">
                  {doctors.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No doctors available</p>
                  ) : (
                    doctors.map((doctor) => (
                      <label
                        key={doctor._id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedDoctors.includes(doctor._id)}
                          onChange={() => toggleDoctor(doctor._id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doctor.displayName || doctor.name}
                          </p>
                          {doctor.specialization && (
                            <p className="text-xs text-gray-500 truncate">{doctor.specialization}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.assignedDoctors.length} doctor(s) selected
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingManager(null);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingManager ? 'Update Manager' : 'Add Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
