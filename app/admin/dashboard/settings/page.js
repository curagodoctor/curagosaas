'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import ClinicsManager from '@/components/admin/ClinicsManager';

export default function SettingsPage() {
  const { showAlert, showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    displayName: '',
    clinicName: '',
    specialization: '',
    qualification: '',
    bio: '',
    whatsappNumber: '',
    googleReviewLink: '',
    phone: '',
    licenseNumber: '',
    timezone: 'Asia/Kolkata',
    ga4MeasurementId: '',
    metaPixelId: '',
  });
  const [domainInfo, setDomainInfo] = useState({ subdomain: '', customDomain: null });
  const [domainInput, setDomainInput] = useState('');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [subdomainSaving, setSubdomainSaving] = useState(false);
  const [subdomainMsg, setSubdomainMsg] = useState(null);
  const [domainStatus, setDomainStatus] = useState(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [seoUsers, setSeoUsers] = useState([]);
  const [seoForm, setSeoForm] = useState({ name: '', email: '', password: '' });
  const [savingSeo, setSavingSeo] = useState(false);
  const [clinicManagers, setClinicManagers] = useState([]);
  const [cmForm, setCmForm] = useState({ name: '', email: '', password: '' });
  const [savingCm, setSavingCm] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [clinicForm, setClinicForm] = useState({ name: '', phone: '', city: '' });
  const [savingClinic, setSavingClinic] = useState(false);

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
    await showAlert({
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
        await fetchSubscription();
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
    const fetchSeoUsers = async () => {
      try {
        const res = await fetch('/api/doctor/seo-users', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setSeoUsers(data.users);
      } catch (error) {
        console.error('Error fetching SEO users:', error);
      }
    };

    fetchSettings();
    fetchSubscription();
    const fetchClinicManagers = async () => {
      try {
        const res = await fetch('/api/doctor/clinic-managers', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setClinicManagers(data.users);
      } catch (error) {
        console.error('Error fetching clinic managers:', error);
      }
    };

    const fetchClinics = async () => {
      try {
        const res = await fetch('/api/doctor/clinics', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setClinics(data.clinics || []);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    };

    fetchSeoUsers();
    fetchClinicManagers();
    fetchClinics();
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
          clinicName: data.doctor.clinicName || '',
          specialization: data.doctor.specialization || '',
          qualification: data.doctor.qualification || '',
          bio: data.doctor.bio || '',
          whatsappNumber: data.doctor.whatsappNumber || '',
          googleReviewLink: data.doctor.googleReviewLink || '',
          phone: data.doctor.phone || '',
          licenseNumber: data.doctor.licenseNumber || '',
          timezone: data.doctor.timezone || 'Asia/Kolkata',
          ga4MeasurementId: data.doctor.ga4MeasurementId || '',
          metaPixelId: data.doctor.metaPixelId || '',
        });
        setDomainInfo({
          subdomain: data.doctor.subdomain || '',
          customDomain: data.doctor.customDomain || null,
        });
        setSubdomainInput(data.doctor.subdomain || '');
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
    { id: 'clinics', label: 'Clinics' },
    { id: 'domain', label: 'Domain & DNS' },
    { id: 'analytics', label: 'Analytics & Tracking' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'seo', label: 'SEO Team' },
    { id: 'clinic-manager', label: 'Clinic Manager' },
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
                  Clinic / Practice Name
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Gastro Clinic"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Used in patient WhatsApp messages (booking, reminder, review request). Defaults to your display name if left blank.
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
                  Google Review Link
                </label>
                <input
                  type="url"
                  name="googleReviewLink"
                  value={formData.googleReviewLink}
                  onChange={handleChange}
                  placeholder="https://g.page/r/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Set this once. It&apos;s used automatically as <span className="font-mono">{'{{reviewLink}}'}</span> in every review-request message, workflow and WhatsApp flow — no need to set it per contact.
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

          {/* Clinics Tab */}
          {activeTab === 'clinics' && <ClinicsManager />}

          {/* Domain & DNS Tab */}
          {activeTab === 'domain' && (
            <div className="space-y-6">
              {/* Current Website URL */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-1">Your Live Website</h3>
                {domainInfo.customDomain ? (
                  <div className="space-y-1">
                    <a href={`https://${domainInfo.customDomain}`} target="_blank" rel="noopener noreferrer"
                      className="text-[#096b17] font-mono hover:underline flex items-center gap-1 text-lg">
                      {domainInfo.customDomain}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p className="text-xs text-green-600">Also available at {domainInfo.subdomain}.curago.in</p>
                  </div>
                ) : domainInfo.subdomain ? (
                  <a href={`https://${domainInfo.subdomain}.curago.in`} target="_blank" rel="noopener noreferrer"
                    className="text-[#096b17] font-mono hover:underline flex items-center gap-1">
                    {domainInfo.subdomain}.curago.in
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">No subdomain configured</p>
                )}
              </div>

              {/* Edit subdomain */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Website address (subdomain)</h3>
                <p className="text-sm text-gray-500 mb-3">Change your <span className="font-mono">yourname.curago.in</span> address.</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subdomainInput}
                    onChange={(e) => { setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSubdomainMsg(null); }}
                    placeholder="yourname"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none text-sm"
                    maxLength={30}
                  />
                  <span className="text-gray-500 font-mono text-sm whitespace-nowrap">.curago.in</span>
                  <button
                    type="button"
                    disabled={subdomainSaving || !subdomainInput.trim() || subdomainInput === domainInfo.subdomain}
                    onClick={async () => {
                      const s = subdomainInput.trim().toLowerCase();
                      const ok = await new Promise((resolve) => {
                        showAlert({
                          title: 'Change website address?',
                          message: `Your site will move to ${s}.curago.in. The old address (${domainInfo.subdomain || 'none'}.curago.in) will stop working. Continue?`,
                          type: 'warning',
                        }).then(() => resolve(true)).catch(() => resolve(false));
                      });
                      if (!ok) return;
                      setSubdomainSaving(true); setSubdomainMsg(null);
                      try {
                        const res = await fetch('/api/doctor/subdomain', {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                          body: JSON.stringify({ subdomain: s }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setDomainInfo((prev) => ({ ...prev, subdomain: data.subdomain }));
                          setSubdomainMsg({ type: 'ok', text: `Updated — your site is now at ${data.subdomain}.curago.in` });
                        } else {
                          setSubdomainMsg({ type: 'err', text: data.error || 'Could not update the subdomain.' });
                        }
                      } catch {
                        setSubdomainMsg({ type: 'err', text: 'Something went wrong.' });
                      } finally { setSubdomainSaving(false); }
                    }}
                    className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50 whitespace-nowrap"
                  >
                    {subdomainSaving ? 'Saving…' : 'Update'}
                  </button>
                </div>
                {subdomainMsg && (
                  <p className={`mt-2 text-sm ${subdomainMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{subdomainMsg.text}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">Lowercase letters, numbers and hyphens only. Changing it re-points your site immediately; the old address stops working.</p>
              </div>

              {/* Connect Custom Domain */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Custom Domain</h3>

                {!domainInfo.customDomain ? (
                  <>
                    {/* Step 1: Enter domain */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <h4 className="font-medium text-gray-900">Enter your domain</h4>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={domainInput}
                          onChange={e => setDomainInput(e.target.value)}
                          placeholder="www.yourclinic.com"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none text-sm"
                        />
                        <button
                          type="button"
                          disabled={domainLoading || !domainInput.trim()}
                          onClick={async () => {
                            setDomainLoading(true);
                            try {
                              const res = await fetch('/api/doctor/domain', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ domain: domainInput }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setDomainInfo(prev => ({ ...prev, customDomain: data.domain }));
                                setDomainStatus(data);
                                await showAlert({ title: 'Domain Added', message: 'Now add the DNS records shown below at your domain registrar.', type: 'success' });
                              } else {
                                await showAlert({ title: 'Error', message: data.error, type: 'error' });
                              }
                            } catch (err) {
                              await showAlert({ title: 'Error', message: 'Failed to add domain', type: 'error' });
                            } finally {
                              setDomainLoading(false);
                            }
                          }}
                          className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50"
                        >
                          {domainLoading ? 'Adding...' : 'Add Domain'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Enter with www (e.g., www.clinic.com) or without (e.g., clinic.com)</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Domain is set — show DNS records + status */}
                    <div className="border border-[#096b17] rounded-lg p-4 mb-4 bg-[#096b17]/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#096b17]"></span>
                          <span className="font-medium text-gray-900">{domainInfo.customDomain}</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setDomainLoading(true);
                            try {
                              const res = await fetch('/api/doctor/domain', { method: 'DELETE', credentials: 'include' });
                              const data = await res.json();
                              if (data.success) {
                                setDomainInfo(prev => ({ ...prev, customDomain: null }));
                                setDomainStatus(null);
                                setDomainInput('');
                              }
                            } catch (err) { /* ignore */ }
                            finally { setDomainLoading(false); }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Step 2: DNS Records */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <h4 className="font-medium text-gray-900">Add DNS records at your registrar</h4>
                      </div>
                      {(() => {
                        const isApexDomain = domainInfo.customDomain.split('.').length === 2;
                        const records = isApexDomain
                          ? [
                              { type: 'A', name: '@', value: '216.198.79.1', note: 'Your root domain' },
                              { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', note: 'For www — optional but recommended' },
                            ]
                          : [{ type: 'CNAME', name: domainInfo.customDomain.split('.')[0], value: 'cname.vercel-dns.com', note: '' }];
                        return (
                          <>
                            <p className="text-sm text-gray-600 mb-3">
                              Go to your domain registrar (GoDaddy, Namecheap, Hostinger, etc.) and add {records.length > 1 ? 'these records' : 'this record'}. If an old A record or URL forwarding exists, delete it first.
                            </p>
                            <div className="space-y-3">
                              {records.map((r, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                                  {r.note && <p className="text-[11px] text-gray-400 mb-2 font-sans">{r.note}</p>}
                                  <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-semibold">{r.type}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">Name/Host:</span><span className="font-semibold">{r.name}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">Value:</span><span className="font-semibold">{r.value}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">TTL:</span><span className="font-semibold">3600 (or Auto)</span></div>
                                  <button
                                    type="button"
                                    onClick={() => { navigator.clipboard.writeText(r.value); showAlert({ title: 'Copied', message: 'Value copied to clipboard', type: 'success' }); }}
                                    className="mt-2 text-sm text-[#096b17] hover:underline font-sans"
                                  >
                                    Copy value
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                              https (the padlock) turns on automatically within a few minutes after the records are correct — no extra step.
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Step 3: Verify */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <h4 className="font-medium text-gray-900">Verify DNS</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        After adding the DNS record, click below to check if it&apos;s propagated. This can take up to 24-48 hours.
                      </p>
                      <button
                        type="button"
                        disabled={verifying}
                        onClick={async () => {
                          setVerifying(true);
                          try {
                            const res = await fetch('/api/doctor/domain/verify', { method: 'POST', credentials: 'include' });
                            const data = await res.json();
                            setDomainStatus(data);
                            if (data.conflict?.length) {
                              await showAlert({ title: 'Conflicting DNS record', message: `Your domain also points to ${data.conflict.join(', ')} (not Vercel). Delete that A record at your registrar and keep only the Vercel one — the site is unreliable until then.`, type: 'warning' });
                            } else if (data.verified || data.configured) {
                              await showAlert({ title: 'Domain Verified!', message: `${domainInfo.customDomain} is now connected and live!`, type: 'success' });
                            } else {
                              await showAlert({ title: 'Not Ready Yet', message: 'DNS has not propagated yet. Please wait and try again later.', type: 'warning' });
                            }
                          } catch (err) {
                            await showAlert({ title: 'Error', message: 'Verification check failed', type: 'error' });
                          } finally {
                            setVerifying(false);
                          }
                        }}
                        className="px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50"
                      >
                        {verifying ? 'Checking...' : 'Check DNS Status'}
                      </button>

                      {domainStatus && (
                        domainStatus.conflict?.length ? (
                          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium">Conflicting DNS record found</p>
                            <p className="mt-1">Your domain also points to <span className="font-mono">{domainStatus.conflict.join(', ')}</span> (not Vercel). Delete that A record at your registrar — keep only the Vercel record above. The site will be unreliable until you do.</p>
                          </div>
                        ) : (
                          <div className={`mt-3 flex items-center gap-2 ${domainStatus.verified || domainStatus.configured ? 'text-green-700' : 'text-yellow-700'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${domainStatus.verified || domainStatus.configured ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            <span className="text-sm">
                              {domainStatus.verified || domainStatus.configured
                                ? 'Domain verified and connected!'
                                : 'DNS not propagated yet. Try again in a few hours.'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Plan Status */}
              {subscription?.plan === 'premium' ? (
                <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <h3 className="font-medium text-purple-800">Premium Plan — Active</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    All features unlocked permanently.
                    {subscription.promoCode && ` Activated with code: ${subscription.promoCode}`}
                  </p>
                </div>
              ) : subscription?.plan === 'monthly' && subscription?.status === 'active' ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h3 className="font-medium text-blue-800">Monthly Plan — Active</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    All premium features unlocked. Renews automatically.
                  </p>
                </div>
              ) : (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <h3 className="font-medium text-green-800">Free Plan — Active</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    {subscription?.plan === 'trial' && subscription?.daysRemaining > 0
                      ? `Trial: ${subscription.daysRemaining} days remaining`
                      : 'Website builder and basic features included.'}
                  </p>
                </div>
              )}

              {/* Plan Details */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900 capitalize">{subscription?.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${subscription?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {subscription?.plan === 'monthly' && subscription?.currentPeriodEnd && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Next Renewal</span>
                    <span className="font-medium text-gray-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription?.plan === 'premium' && subscription?.premiumUnlockedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unlocked On</span>
                    <span className="font-medium text-gray-900">
                      {new Date(subscription.premiumUnlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Upgrade Section — only show if not already premium */}
              {subscription?.plan !== 'premium' && subscription?.plan !== 'monthly' && (
                <>
                  {/* Razorpay Subscription */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Upgrade to Premium</h3>
                    <div className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#096b17]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">Monthly Subscription — ₹500/month</h4>
                          <ul className="text-sm text-gray-600 space-y-1 mb-4">
                            <li>Contacts</li>
                            <li>Automated Workflows &amp; Campaigns</li>
                            <li>Message Templates</li>
                            <li>Review Automation &amp; Email Messaging</li>
                            <li>Priority Support</li>
                          </ul>
                          <button
                            type="button"
                            disabled={creatingSubscription}
                            onClick={async () => {
                              setCreatingSubscription(true);
                              try {
                                const res = await fetch('/api/doctor/subscription/create', {
                                  method: 'POST',
                                  credentials: 'include',
                                });
                                const data = await res.json();
                                if (data.success && data.shortUrl) {
                                  window.open(data.shortUrl, '_blank');
                                  await showAlert({
                                    title: 'Subscription Created',
                                    message: 'Complete the payment on the Razorpay page. Your plan will be upgraded automatically after payment.',
                                    type: 'success',
                                  });
                                } else {
                                  await showAlert({ title: 'Error', message: data.error || 'Failed to create subscription', type: 'error' });
                                }
                              } catch (error) {
                                await showAlert({ title: 'Error', message: 'Failed to create subscription', type: 'error' });
                              } finally {
                                setCreatingSubscription(false);
                              }
                            }}
                            className="px-6 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50 transition-colors"
                          >
                            {creatingSubscription ? 'Creating...' : 'Subscribe with Razorpay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Have a Promo Code?</h3>
                    <div className="border border-gray-200 rounded-lg p-5">
                      <p className="text-sm text-gray-600 mb-4">
                        Enter a promo code to unlock all premium features and get 50 free SMS credits.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none text-sm uppercase"
                          style={{ textTransform: 'uppercase' }}
                        />
                        <button
                          type="button"
                          disabled={redeemingPromo || !promoCode.trim()}
                          onClick={async () => {
                            setRedeemingPromo(true);
                            try {
                              const res = await fetch('/api/doctor/promo-code/redeem', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ code: promoCode }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                await showAlert({
                                  title: 'Premium Unlocked!',
                                  message: data.message,
                                  type: 'success',
                                });
                                setPromoCode('');
                                await fetchSubscription();
                              } else {
                                await showAlert({ title: 'Invalid Code', message: data.error, type: 'error' });
                              }
                            } catch (error) {
                              await showAlert({ title: 'Error', message: 'Failed to redeem promo code', type: 'error' });
                            } finally {
                              setRedeemingPromo(false);
                            }
                          }}
                          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          {redeemingPromo ? 'Redeeming...' : 'Redeem'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Cancel Subscription — only for monthly paid */}
              {subscription?.plan === 'monthly' && subscription?.status === 'active' && (
                <div className="border border-red-100 rounded-lg p-4">
                  <button
                    type="button"
                    disabled={cancellingSubscription}
                    onClick={handleCancelSubscription}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Access continues until the end of your current billing period.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SEO Team Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Team Access</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create accounts for your SEO team. They can only access Website Builder and Blog Articles.
                </p>
              </div>

              {/* Add SEO User Form */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Add SEO User</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={seoForm.name}
                    onChange={e => setSeoForm(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={seoForm.email}
                    onChange={e => setSeoForm(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={seoForm.password}
                    onChange={e => setSeoForm(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={savingSeo || !seoForm.name || !seoForm.email || !seoForm.password}
                  onClick={async () => {
                    setSavingSeo(true);
                    try {
                      const res = await fetch('/api/doctor/seo-users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(seoForm),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setSeoUsers(prev => [...prev, data.user]);
                        setSeoForm({ name: '', email: '', password: '' });
                        await showAlert({ title: 'Success', message: 'SEO user created. They can login at /seo/login', type: 'success' });
                      } else {
                        await showAlert({ title: 'Error', message: data.error, type: 'error' });
                      }
                    } catch (error) {
                      await showAlert({ title: 'Error', message: 'Failed to create SEO user', type: 'error' });
                    } finally {
                      setSavingSeo(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50"
                >
                  {savingSeo ? 'Creating...' : 'Add User'}
                </button>
              </div>

              {/* SEO Users List */}
              {seoUsers.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {seoUsers.map(user => (
                        <tr key={user._id}>
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No SEO team members added yet.</p>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  SEO users login at <strong>/seo/login</strong> and can only access the Website Builder and Blog Articles sections of your dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Clinic Manager Tab */}
          {activeTab === 'clinic-manager' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinic Manager Access</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create accounts for your clinic managers. They can only access Contacts and Workflows.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Add Clinic Manager</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Name" value={cmForm.name}
                    onChange={e => setCmForm(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none" />
                  <input type="email" placeholder="Email" value={cmForm.email}
                    onChange={e => setCmForm(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none" />
                  <input type="password" placeholder="Password" value={cmForm.password}
                    onChange={e => setCmForm(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none" />
                </div>
                <button type="button" disabled={savingCm || !cmForm.name || !cmForm.email || !cmForm.password}
                  onClick={async () => {
                    setSavingCm(true);
                    try {
                      const res = await fetch('/api/doctor/clinic-managers', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        credentials: 'include', body: JSON.stringify(cmForm),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setClinicManagers(prev => [...prev, data.user]);
                        setCmForm({ name: '', email: '', password: '' });
                        await showAlert({ title: 'Success', message: 'Clinic Manager created. They can login at /clinic-manager/login', type: 'success' });
                      } else {
                        await showAlert({ title: 'Error', message: data.error, type: 'error' });
                      }
                    } catch { await showAlert({ title: 'Error', message: 'Failed to create', type: 'error' }); }
                    finally { setSavingCm(false); }
                  }}
                  className="px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50">
                  {savingCm ? 'Creating...' : 'Add Manager'}
                </button>
              </div>

              {clinicManagers.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {clinicManagers.map(user => (
                        <tr key={user._id}>
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No clinic managers added yet.</p>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Clinic managers login at <strong>/clinic-manager/login</strong> and can only access the Contacts and Workflows sections.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Analytics &amp; Tracking</h2>
                <p className="text-sm text-gray-600">
                  Add your own Google Analytics 4 and Meta (Facebook) Pixel IDs. When set, these scripts are
                  injected into <strong>your published website</strong> ({domainInfo.customDomain || (domainInfo.subdomain ? `${domainInfo.subdomain}.curago.in` : 'your site')}) so tracking fires on your own visitors. Leave a field blank to disable it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics 4 — Measurement ID</label>
                <input
                  type="text"
                  name="ga4MeasurementId"
                  value={formData.ga4MeasurementId}
                  onChange={handleChange}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find it in Google Analytics → Admin → Data Streams → your web stream. Starts with <strong>G-</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta (Facebook) Pixel ID</label>
                <input
                  type="text"
                  name="metaPixelId"
                  value={formData.metaPixelId}
                  onChange={handleChange}
                  placeholder="123456789012345"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find it in Meta Events Manager → Data Sources → your pixel. It&apos;s the numeric Pixel ID.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Changes go live on your website within a minute of saving. Use each platform&apos;s own debugger
                  (GA4 Realtime, Meta Pixel Helper) to confirm events are firing.
                </p>
              </div>
            </div>
          )}

          {/* Save Button (hidden on read-only tabs) */}
          <div className={`mt-8 pt-6 border-t flex justify-end ${activeTab === 'domain' || activeTab === 'subscription' || activeTab === 'seo' || activeTab === 'clinic-manager' || activeTab === 'clinics' ? 'hidden' : ''}`}>
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
