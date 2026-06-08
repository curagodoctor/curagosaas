'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function SettingsPage() {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    displayName: '',
    specialization: '',
    qualification: '',
    bio: '',
    whatsappNumber: '',
    phone: '',
    licenseNumber: '',
    timezone: 'Asia/Kolkata',
  });
  const [domainInfo, setDomainInfo] = useState({ subdomain: '', customDomain: null });
  const [subscription, setSubscription] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/doctor/subscription', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = await showAlert({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel? Your access will continue until the end of the current billing period.',
      type: 'warning',
    });

    setCancellingSubscription(true);
    try {
      const res = await fetch('/api/doctor/subscription/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({ title: 'Cancelled', message: 'Your subscription has been cancelled.', type: 'success' });
        fetchSubscription();
      } else {
        await showAlert({ title: 'Error', message: data.error || 'Failed to cancel', type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to cancel subscription', type: 'error' });
    } finally {
      setCancellingSubscription(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSubscription();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/doctor/settings', {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.doctor) {
        setFormData({
          displayName: data.doctor.displayName || '',
          specialization: data.doctor.specialization || '',
          qualification: data.doctor.qualification || '',
          bio: data.doctor.bio || '',
          whatsappNumber: data.doctor.whatsappNumber || '',
          phone: data.doctor.phone || '',
          licenseNumber: data.doctor.licenseNumber || '',
          timezone: data.doctor.timezone || 'Asia/Kolkata',
        });
        setDomainInfo({
          subdomain: data.doctor.subdomain || '',
          customDomain: data.doctor.customDomain || null,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/doctor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await showAlert({
          title: 'Success',
          message: 'Settings saved successfully!',
          type: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      await showAlert({
        title: 'Error',
        message: error.message || 'Failed to save settings',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'contact', label: 'Contact & WhatsApp' },
    { id: 'practice', label: 'Practice Info' },
    { id: 'domain', label: 'Domain & DNS' },
    { id: 'subscription', label: 'Subscription' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#096b17] text-[#096b17]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This name will be displayed on your clinic website
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="Surgical Gastroenterologist"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MS, DNB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Brief description about yourself and your practice..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div>
                    <h3 className="font-medium text-green-800">WhatsApp Integration</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your WhatsApp number will be used for the sticky WhatsApp button on your clinic website,
                      allowing patients to contact you directly.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                    maxLength={10}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your 10-digit WhatsApp number without country code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Account)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your registered phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent bg-gray-50"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Contact support to change your registered phone number
                </p>
              </div>
            </div>
          )}

          {/* Practice Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="Your medical license/registration number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your medical council registration number (optional but recommended)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                >
                  <option value="Asia/Kolkata">India (IST - UTC+5:30)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Used for scheduling and displaying appointment times
                </p>
              </div>
            </div>
          )}

          {/* Domain & DNS Tab */}
          {activeTab === 'domain' && (
            <div className="space-y-6">
              {/* Current Website URL */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-1">Your Live Website</h3>
                {domainInfo.subdomain ? (
                  <a
                    href={`https://${domainInfo.subdomain}.curago.in`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#096b17] font-mono hover:underline flex items-center gap-1"
                  >
                    {domainInfo.subdomain}.curago.in
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">No subdomain configured</p>
                )}
              </div>

              {/* Custom Domain Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Custom Domain</h3>
                <p className="text-sm text-gray-600 mb-4">
                  To use your own domain (e.g., www.drabcclinic.com), follow these steps:
                </p>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <h4 className="font-medium text-gray-900">Add a CNAME record</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.) and add the following DNS record:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-semibold text-gray-900">CNAME</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name/Host:</span>
                        <span className="font-semibold text-gray-900">www</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Value/Points to:</span>
                        <span className="font-semibold text-gray-900">cname.vercel-dns.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TTL:</span>
                        <span className="font-semibold text-gray-900">3600 (or Auto)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('cname.vercel-dns.com');
                        showAlert({ title: 'Copied', message: 'CNAME value copied to clipboard', type: 'success' });
                      }}
                      className="mt-2 text-sm text-[#096b17] hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy CNAME value
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <h4 className="font-medium text-gray-900">Contact us</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      After adding the DNS record, contact us at{' '}
                      <a href="mailto:support@curago.in" className="text-[#096b17] hover:underline font-medium">
                        support@curago.in
                      </a>{' '}
                      with your domain name so we can configure it on our end.
                      DNS changes can take up to 24-48 hours to propagate.
                    </p>
                  </div>

                  {/* Step 3 - Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <h4 className="font-medium text-gray-900">Domain Status</h4>
                    </div>
                    {domainInfo.customDomain ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span className="text-sm text-green-700">
                          Custom domain connected: <strong>{domainInfo.customDomain}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                        <span className="text-sm text-gray-500">No custom domain connected yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {subscription ? (
                <>
                  <div className={`border rounded-lg p-4 ${subscription.isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${subscription.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <h3 className={`font-medium ${subscription.isActive ? 'text-green-800' : 'text-red-800'}`}>
                        {subscription.plan === 'trial' ? 'Free Trial' : 'Monthly Subscription'} — {subscription.isActive ? 'Active' : 'Expired'}
                      </h3>
                    </div>
                    <p className={`text-sm ${subscription.isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {subscription.isActive
                        ? `${subscription.daysRemaining} days remaining`
                        : 'Your subscription has expired. Subscribe to continue using messaging features.'}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-medium text-gray-900 capitalize">{subscription.plan}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="font-medium text-gray-900 capitalize">{subscription.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium text-gray-900">&#x20B9;{subscription.amount}/month</span>
                    </div>
                    {subscription.plan === 'trial' && subscription.trialEndDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trial Ends</span>
                        <span className="font-medium text-gray-900">{new Date(subscription.trialEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {subscription.currentPeriodEnd && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current Period Ends</span>
                        <span className="font-medium text-gray-900">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {subscription.plan === 'trial' && subscription.isActive && (
                      <a
                        href="/api/doctor/subscription/create"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await fetch('/api/doctor/subscription/create', { method: 'POST', credentials: 'include' });
                            const data = await res.json();
                            if (data.shortUrl) window.open(data.shortUrl, '_blank');
                            else await showAlert({ title: 'Error', message: data.error, type: 'error' });
                          } catch (err) {
                            await showAlert({ title: 'Error', message: 'Failed to create subscription', type: 'error' });
                          }
                        }}
                        className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
                      >
                        Upgrade to Monthly (&#x20B9;{subscription.amount}/mo)
                      </a>
                    )}
                    {subscription.plan === 'monthly' && subscription.status === 'active' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                        className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                    {!subscription.isActive && (
                      <a
                        href="/api/doctor/subscription/create"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await fetch('/api/doctor/subscription/create', { method: 'POST', credentials: 'include' });
                            const data = await res.json();
                            if (data.shortUrl) window.open(data.shortUrl, '_blank');
                            else await showAlert({ title: 'Error', message: data.error, type: 'error' });
                          } catch (err) {
                            await showAlert({ title: 'Error', message: 'Failed to create subscription', type: 'error' });
                          }
                        }}
                        className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
                      >
                        Subscribe Now (&#x20B9;{subscription.amount}/mo)
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Loading subscription info...</p>
              )}
            </div>
          )}

          {/* Save Button (hidden on read-only tabs) */}
          <div className={`mt-8 pt-6 border-t flex justify-end ${activeTab === 'domain' || activeTab === 'subscription' ? 'hidden' : ''}`}>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#096b17] hover:bg-[#075a13] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
