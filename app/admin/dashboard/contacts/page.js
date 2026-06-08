'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function ContactsPage() {
  const { showAlert, showConfirm } = useModal();
  const [contacts, setContacts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusCounts, setStatusCounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [activeExecutions, setActiveExecutions] = useState({});
  const [subscription, setSubscription] = useState(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', status: 'new', notes: '', googleReviewLink: '',
  });

  const fetchContacts = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const res = await fetch(`/api/doctor/contacts?${params}`, { credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        setContacts(data.contacts);
        setPagination(data.pagination);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus]);

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/doctor/contacts/statuses', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStatuses(data.statuses);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/doctor/messages/quota', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setQuota(data.quota);
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/doctor/workflows', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setWorkflows(data.workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/doctor/workflows/executions?status=active&limit=100', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const map = {};
        data.executions.forEach(e => { map[e.contactId?._id || e.contactId] = e; });
        setActiveExecutions(map);
      }
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const handleStartWorkflow = async (contactId, workflowId) => {
    // Check quota before starting
    if (quota) {
      const smsExhausted = quota.sms.remaining <= 0;
      const emailExhausted = quota.email.remaining <= 0;
      if (smsExhausted && emailExhausted) {
        await showAlert({
          title: 'Quota Exceeded',
          message: `Your monthly message quota is exhausted.\n\nSMS: ${quota.sms.used}/${quota.sms.limit} used\nEmail: ${quota.email.used}/${quota.email.limit} used\n\nQuota resets on ${new Date(quota.periodEnd).toLocaleDateString()}.`,
          type: 'error',
        });
        return;
      }
    }

    // Check subscription
    if (subscription && !subscription.isActive) {
      await showAlert({
        title: 'Subscription Expired',
        message: 'Your trial has expired. Please subscribe from Settings to continue using workflows.',
        type: 'error',
      });
      return;
    }

    try {
      const res = await fetch('/api/doctor/workflows/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactId, workflowId }),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({ title: 'Workflow Started', message: data.immediateMessageSent ? 'Workflow started and first message sent!' : 'Workflow started!', type: 'success' });
        fetchContacts(pagination.page);
        fetchExecutions();
      } else if (data.error === 'SUBSCRIPTION_EXPIRED') {
        await showAlert({ title: 'Subscription Expired', message: data.message, type: 'error' });
      } else {
        await showAlert({ title: 'Error', message: data.error, type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to start workflow', type: 'error' });
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/doctor/subscription', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setSubscription(data.subscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchStatuses();
    fetchQuota();
    fetchWorkflows();
    fetchExecutions();
    fetchSubscription();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      await showAlert({ title: 'Error', message: 'Contact name is required', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = editingContact
        ? `/api/doctor/contacts/${editingContact._id}`
        : '/api/doctor/contacts';
      const method = editingContact ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setEditingContact(null);
        setFormData({ name: '', phone: '', email: '', status: 'new', notes: '', googleReviewLink: '' });
        fetchContacts(pagination.page);
      } else {
        await showAlert({ title: 'Error', message: data.error, type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to save contact', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    const confirmed = await showConfirm({
      title: 'Delete Contact',
      message: `Are you sure you want to delete ${contact.name}?`,
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/doctor/contacts/${contact._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchContacts(pagination.page);
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to delete contact', type: 'error' });
    }
  };

  const handleStatusChange = async (contactId, newStatus) => {
    try {
      await fetch(`/api/doctor/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchContacts(pagination.page);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      status: contact.status || 'new',
      notes: contact.notes || '',
      googleReviewLink: contact.googleReviewLink || '',
    });
    setShowAddModal(true);
  };

  const handleImport = async (file) => {
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/doctor/contacts/import', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: 'Import Complete',
          message: `Imported ${data.imported} contacts. ${data.skipped > 0 ? `Skipped ${data.skipped} rows.` : ''}`,
          type: 'success',
        });
        setShowImportModal(false);
        fetchContacts(1);
      } else {
        await showAlert({ title: 'Import Failed', message: data.error, type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to import contacts', type: 'error' });
    }
  };

  const getStatusBadge = (statusName) => {
    const status = statuses.find(s => s.name === statusName);
    const color = status?.color || '#6B7280';
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: color + '20', color }}
      >
        {status?.label || statusName}
      </span>
    );
  };

  const totalContacts = Object.values(statusCounts).reduce((a, b) => a + b, 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{totalContacts} total contacts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Excel
          </button>
          <a
            href="/api/doctor/contacts/export"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </a>
          <button
            onClick={() => {
              setEditingContact(null);
              setFormData({ name: '', phone: '', email: '', status: 'new', notes: '', googleReviewLink: '' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>
      </div>

      {/* Subscription Expired Banner */}
      {subscription && !subscription.isActive && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-800">
              Your trial has expired. Subscribe to continue sending messages and using workflows.
            </p>
          </div>
          <a href="/admin/dashboard/settings" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex-shrink-0">
            Subscribe Now
          </a>
        </div>
      )}

      {/* Quota Warning */}
      {quota && (quota.sms.used / quota.sms.limit > 0.8 || quota.email.used / quota.email.limit > 0.8) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-yellow-800">
            Message quota running low — SMS: {quota.sms.remaining}/{quota.sms.limit} remaining, Email: {quota.email.remaining}/{quota.email.limit} remaining
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => (
              <option key={s._id} value={s.name}>{s.label} ({statusCounts[s.name] || 0})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500">No contacts found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-[#096b17] hover:underline text-sm font-medium"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contacts.map(contact => (
                    <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{contact.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contact.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contact.email || '—'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={contact.status}
                          onChange={(e) => handleStatusChange(contact._id, e.target.value)}
                          className="text-xs border-0 bg-transparent cursor-pointer focus:ring-0 p-0"
                          style={{ color: statuses.find(s => s.name === contact.status)?.color }}
                        >
                          {statuses.map(s => (
                            <option key={s._id} value={s.name}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500 capitalize">{contact.source}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(contact)}
                            className="p-1.5 text-gray-400 hover:text-[#096b17] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(contact)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {activeExecutions[contact._id] ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full" title="Workflow running">
                              Running
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const defaultWf = workflows.find(w => w.isDefault) || workflows[0];
                                if (defaultWf) handleStartWorkflow(contact._id, defaultWf._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#096b17] transition-colors"
                              title="Start Workflow"
                              disabled={workflows.length === 0}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {contacts.map(contact => (
                <div key={contact._id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    {getStatusBadge(contact.status)}
                  </div>
                  {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                  {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(contact)} className="text-xs text-[#096b17] hover:underline">Edit</button>
                    <button onClick={() => handleDelete(contact)} className="text-xs text-red-500 hover:underline">Delete</button>
                    {activeExecutions[contact._id] ? (
                      <span className="text-xs text-blue-600">Workflow Running</span>
                    ) : workflows.length > 0 && (
                      <button
                        onClick={() => {
                          const defaultWf = workflows.find(w => w.isDefault) || workflows[0];
                          if (defaultWf) handleStartWorkflow(contact._id, defaultWf._id);
                        }}
                        className="text-xs text-[#096b17] hover:underline"
                      >
                        Start Workflow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} contacts)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchContacts(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchContacts(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h2>
            </div>
            <form onSubmit={handleSaveContact} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="Patient name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                    placeholder="patient@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none bg-white"
                >
                  {statuses.map(s => (
                    <option key={s._id} value={s.name}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Review Link</label>
                <input
                  type="url"
                  value={formData.googleReviewLink}
                  onChange={e => setFormData(prev => ({ ...prev, googleReviewLink: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="https://g.page/r/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none resize-none"
                  placeholder="Any notes about this contact..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingContact(null); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Contacts</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (.xlsx) with columns: Name, Phone, Email, Status, Notes
            </p>
            <a
              href="/api/doctor/contacts/export?template=true"
              className="text-sm text-[#096b17] hover:underline font-medium mb-4 inline-block"
            >
              Download template file
            </a>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files[0]) handleImport(e.target.files[0]);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#096b17]/10 file:text-[#096b17] hover:file:bg-[#096b17]/20 mb-4"
            />
            <button
              onClick={() => setShowImportModal(false)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
