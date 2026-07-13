'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import FeatureGate from '@/components/FeatureGate';

export default function WorkflowsPage() {
  return (
    <FeatureGate feature="workflows" title="Workflows">
      <WorkflowsPageInner />
    </FeatureGate>
  );
}

function WorkflowsPageInner() {
  const { showAlert } = useModal();
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', googleReviewLink: '', steps: [] });

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
      const res = await fetch('/api/doctor/workflows/executions?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setExecutions(data.executions);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/doctor/templates', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchWorkflows(), fetchExecutions(), fetchTemplates()])
      .finally(() => setLoading(false));
  }, []);

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { stepOrder: prev.steps.length, delayDays: prev.steps.length === 0 ? 0 : 3, delayHours: 0, channel: 'sms', templateId: templates[0]?._id || '' }],
    }));
  };

  const handleRemoveStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i })),
    }));
  };

  const handleStepChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const handleSave = async () => {
    if (!formData.name || formData.steps.length === 0) {
      await showAlert({ title: 'Error', message: 'Name and at least one step are required', type: 'error' });
      return;
    }

    try {
      const url = editingWorkflow ? `/api/doctor/workflows/${editingWorkflow._id}` : '/api/doctor/workflows';
      const method = editingWorkflow ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setEditingWorkflow(null);
        fetchWorkflows();
      } else {
        await showAlert({ title: 'Error', message: data.error, type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to save workflow', type: 'error' });
    }
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      googleReviewLink: workflow.googleReviewLink || '',
      steps: workflow.steps.map(s => ({
        stepOrder: s.stepOrder,
        delayDays: s.delayDays || 0,
        delayHours: s.delayHours || 0,
        channel: s.channel,
        templateId: s.templateId?._id || s.templateId,
        description: s.description || '',
      })),
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 text-sm mt-1">Automate messaging sequences for your contacts</p>
        </div>
        <button
          onClick={() => {
            setEditingWorkflow(null);
            setFormData({ name: '', description: '', googleReviewLink: '', steps: [] });
            setShowEditModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Workflow
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'workflows' ? 'border-[#096b17] text-[#096b17]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Workflows ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'executions' ? 'border-[#096b17] text-[#096b17]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Executions ({executions.length})
            </button>
          </nav>
        </div>

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="p-6 space-y-4">
            {workflows.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No workflows yet. Create your first workflow to automate messaging.</p>
            ) : (
              workflows.map(workflow => (
                <div key={workflow._id} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      {workflow.isDefault && (
                        <span className="px-2 py-0.5 bg-[#096b17]/10 text-[#096b17] text-xs font-medium rounded-full">Default</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${workflow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button onClick={() => handleEdit(workflow)} className="text-sm text-[#096b17] hover:underline">Edit</button>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-gray-500 mb-4">{workflow.description}</p>
                  )}
                  {/* Steps visualization */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {workflow.steps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {i > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-8 h-px bg-gray-300"></div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{step.delayDays || 0}d {step.delayHours ? `${step.delayHours}h` : ''}</span>
                              <div className="w-8 h-px bg-gray-300"></div>
                            </div>
                          )}
                          <div className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs font-medium ${step.channel === 'sms' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'}`}>
                            <span className="uppercase">{step.channel}</span>
                            {step.templateId?.name && (
                              <span className="block text-[10px] opacity-70 mt-0.5">{step.templateId.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Executions Tab */}
        {activeTab === 'executions' && (
          <div className="p-6">
            {executions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No workflow executions yet. Start a workflow from the Contacts page.</p>
            ) : (
              <div className="space-y-3">
                {executions.map(exec => (
                  <div key={exec._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exec.contactId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{exec.workflowId?.name} &middot; Step {exec.currentStepIndex + 1}/{exec.workflowId?.steps?.length || '?'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {exec.nextRunAt && exec.status === 'active' && (
                        <span className="text-xs text-gray-400">Next: {new Date(exec.nextRunAt).toLocaleDateString()}</span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exec.status)}`}>
                        {exec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit/Create Workflow Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="e.g., Review Request Workflow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Review Link</label>
                <input
                  type="url"
                  value={formData.googleReviewLink}
                  onChange={e => setFormData(prev => ({ ...prev, googleReviewLink: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="https://g.page/r/... (used as {{reviewLink}} in templates)"
                />
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Steps</label>
                  <button onClick={handleAddStep} className="text-sm text-[#096b17] hover:underline">+ Add Step</button>
                </div>
                <div className="space-y-3">
                  {formData.steps.map((step, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Step {i + 1}</span>
                        <button onClick={() => handleRemoveStep(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Days</label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={step.delayDays}
                            onChange={e => handleStepChange(i, 'delayDays', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Hours</label>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={step.delayHours || 0}
                            onChange={e => handleStepChange(i, 'delayHours', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Channel</label>
                          <select
                            value={step.channel}
                            onChange={e => handleStepChange(i, 'channel', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                          >
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Template</label>
                          <select
                            value={step.templateId}
                            onChange={e => handleStepChange(i, 'templateId', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                          >
                            <option value="">Select...</option>
                            {templates.filter(t => t.channel === step.channel).map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.steps.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No steps added. Click &quot;+ Add Step&quot; to begin.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowEditModal(false); setEditingWorkflow(null); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110]"
                >
                  {editingWorkflow ? 'Update' : 'Create'} Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
