'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import Script from 'next/script';

const STEPS = [
  { number: 1, label: 'Token Balance' },
  { number: 2, label: 'Clinic Details' },
  { number: 3, label: 'Generate' },
  { number: 4, label: 'Apply' },
];

const TOKEN_PACKS = [
  { name: 'Starter', price: 500, tokens: 10 },
  { name: 'Pro', price: 1000, tokens: 25 },
  { name: 'Business', price: 1800, tokens: 50 },
];

const TONES = ['Professional', 'Warm', 'Casual', 'Formal'];

export default function AIGeneratePage() {
  const router = useRouter();
  const { showAlert } = useModal();

  const [currentStep, setCurrentStep] = useState(1);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [formData, setFormData] = useState({
    clinicName: '',
    specialization: '',
    services: '',
    usps: '',
    location: '',
    phone: '',
    email: '',
    tone: 'Professional',
    additionalInfo: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedSections, setGeneratedSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingPageId, setBookingPageId] = useState(null);
  const [applying, setApplying] = useState(false);

  // Fetch token balance
  const fetchTokenBalance = async () => {
    try {
      const res = await fetch('/api/doctor/ai-tokens', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTokenBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill form from doctor data
  const fetchDoctorData = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.doctor) {
        const doc = data.doctor;
        setFormData((prev) => ({
          ...prev,
          clinicName: doc.displayName || doc.name || prev.clinicName,
          specialization: doc.specialization || prev.specialization,
          phone: doc.phone || prev.phone,
          email: doc.email || prev.email,
          location: doc.address || prev.location,
        }));
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  };

  // Fetch booking page ID
  const fetchBookingPage = async () => {
    try {
      const res = await fetch('/api/admin/booking-pages?limit=1', { credentials: 'include' });
      const data = await res.json();
      if (data.pages && data.pages.length > 0) {
        setBookingPageId(data.pages[0]._id);
      }
    } catch (error) {
      console.error('Error fetching booking page:', error);
    }
  };

  useEffect(() => {
    fetchTokenBalance();
    fetchDoctorData();
    fetchBookingPage();
  }, []);

  const handlePurchase = async (pack) => {
    try {
      const res = await fetch('/api/doctor/ai-tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pack: pack.name.toLowerCase(), amount: pack.price, tokens: pack.tokens }),
      });
      const data = await res.json();

      if (!data.success) {
        await showAlert({ title: 'Error', message: data.error || 'Failed to create order', type: 'error' });
        return;
      }

      const options = {
        key: data.razorpayKeyId || data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'CuraGo AI Tokens',
        description: `${pack.name} Pack - ${pack.tokens} tokens`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/doctor/ai-tokens/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await showAlert({ title: 'Success', message: `${pack.tokens} tokens added to your balance!`, type: 'success' });
              fetchTokenBalance();
            } else {
              await showAlert({ title: 'Error', message: verifyData.error || 'Payment verification failed', type: 'error' });
            }
          } catch (error) {
            await showAlert({ title: 'Error', message: 'Payment verification failed', type: 'error' });
          }
        },
        theme: { color: '#096b17' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to initiate payment', type: 'error' });
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/doctor/ai-tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'generate', formData }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedSections(data.sections);
        setTokenBalance((prev) => (prev !== null ? prev - 5 : prev));
        setCurrentStep(4);
      } else {
        await showAlert({ title: 'Error', message: data.error || 'Generation failed', type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to generate website content', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!bookingPageId) {
      await showAlert({ title: 'Error', message: 'No booking page found. Please create a website first.', type: 'error' });
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/booking-pages/${bookingPageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sections: generatedSections }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        await showAlert({ title: 'Success', message: 'AI-generated content applied to your website!', type: 'success' });
      } else {
        await showAlert({ title: 'Error', message: data.error || 'Failed to apply content', type: 'error' });
      }
    } catch (error) {
      await showAlert({ title: 'Error', message: 'Failed to apply content', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const isFormValid = formData.clinicName.trim() && formData.specialization.trim() && formData.services.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Website Generator</h1>
        <p className="text-gray-500 text-sm mt-1">Generate a professional clinic website using AI</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    currentStep >= step.number
                      ? 'bg-[#096b17] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= step.number ? 'text-[#096b17]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.number ? 'bg-[#096b17]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Token Balance */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Balance</h2>

          <div className="bg-[#096b17]/5 border border-[#096b17]/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#096b17]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-[#096b17]">{tokenBalance ?? 0} tokens</p>
              </div>
            </div>
          </div>

          {tokenBalance !== null && tokenBalance >= 5 ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">You have enough tokens to generate a website (5 tokens required).</p>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075110] transition-colors"
              >
                Next: Fill Clinic Details
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">You need at least 5 tokens to generate a website. Purchase a token pack below.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TOKEN_PACKS.map((pack) => (
                  <div key={pack.name} className="border border-gray-200 rounded-xl p-5 hover:border-[#096b17] transition-colors">
                    <h3 className="font-semibold text-gray-900 text-lg">{pack.name}</h3>
                    <p className="text-3xl font-bold text-[#096b17] mt-2">
                      &#x20B9;{pack.price}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{pack.tokens} tokens</p>
                    <p className="text-gray-400 text-xs mt-1">
                      &#x20B9;{(pack.price / pack.tokens).toFixed(0)} per token
                    </p>
                    <button
                      onClick={() => handlePurchase(pack)}
                      className="w-full mt-4 px-4 py-2.5 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075110] transition-colors"
                    >
                      Purchase
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Onboarding Form */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinic Details</h2>
          <p className="text-sm text-gray-500 mb-6">Provide information about your clinic. This will be used to generate your website content.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name *</label>
                <input
                  type="text"
                  value={formData.clinicName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clinicName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="e.g., Smile Dental Clinic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="e.g., Dentistry, Orthopedics"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services *</label>
              <textarea
                value={formData.services}
                onChange={(e) => setFormData((prev) => ({ ...prev, services: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none resize-none"
                placeholder="List your services, one per line..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unique Selling Points</label>
              <textarea
                value={formData.usps}
                onChange={(e) => setFormData((prev) => ({ ...prev, usps: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none resize-none"
                placeholder="What makes your clinic stand out?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="Clinic address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none"
                  placeholder="clinic@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none bg-white"
                >
                  {TONES.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none resize-none"
                placeholder="Anything else you want on your website..."
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!isFormValid}
              className="px-6 py-2.5 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075110] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Review & Generate
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Generate</h2>
          <p className="text-sm text-gray-500 mb-6">Review your clinic details before generating your website.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Clinic Name', value: formData.clinicName },
              { label: 'Specialization', value: formData.specialization },
              { label: 'Services', value: formData.services },
              { label: 'USPs', value: formData.usps },
              { label: 'Location', value: formData.location },
              { label: 'Phone', value: formData.phone },
              { label: 'Email', value: formData.email },
              { label: 'Tone', value: formData.tone },
              { label: 'Additional Info', value: formData.additionalInfo },
            ].filter((item) => item.value).map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">{item.label}</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800">This will use <strong>5 tokens</strong> from your balance ({tokenBalance} available).</p>
            </div>
          </div>

          {generating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#096b17] mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Generating your website content...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a minute</p>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075110] transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Website (5 tokens)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Apply */}
      {currentStep === 4 && generatedSections && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Website Preview</h2>
            <p className="text-sm text-gray-500 mb-6">Review the AI-generated sections for your website.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(Array.isArray(generatedSections) ? generatedSections : []).map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-[#096b17] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#096b17]/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#096b17]">{index + 1}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{section.title || section.type || `Section ${index + 1}`}</h3>
                  </div>
                  {section.subtitle && <p className="text-sm text-gray-500 mb-2">{section.subtitle}</p>}
                  {section.content && (
                    <p className="text-sm text-gray-600 line-clamp-3">{typeof section.content === 'string' ? section.content : JSON.stringify(section.content)}</p>
                  )}
                </div>
              ))}
            </div>

            {applying ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17] mx-auto mb-3"></div>
                <p className="text-gray-600">Applying content to your website...</p>
              </div>
            ) : (
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-3 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075110] transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply to Website
                </button>
              </div>
            )}
          </div>

          {/* Success link */}
          {bookingPageId && (
            <div className="bg-[#096b17]/5 border border-[#096b17]/20 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">
                After applying, view your website at{' '}
                <a href="/admin/dashboard/pages" className="text-[#096b17] hover:underline font-medium">
                  Website Builder
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
