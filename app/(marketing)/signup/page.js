'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entry = searchParams.get('entry') === 'practice-os' ? 'practice-os' : 'website-builder';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subdomain: '',
    password: '',
    confirmPassword: '',
    isLicensedProfessional: false,
    acceptTerms: false,
    acceptVerification: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState(null);
  const [subdomainMessage, setSubdomainMessage] = useState('');

  // Debounced subdomain check
  const checkSubdomain = useCallback(async (subdomain) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus(null);
      setSubdomainMessage('');
      return;
    }

    setSubdomainStatus('checking');
    setSubdomainMessage('Checking availability...');

    try {
      const res = await fetch(`/api/auth/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
      const data = await res.json();

      if (data.available) {
        setSubdomainStatus('available');
        setSubdomainMessage(`${subdomain}.curago.in is available!`);
      } else {
        setSubdomainStatus('taken');
        setSubdomainMessage(data.reason || 'This subdomain is not available');
      }
    } catch (error) {
      setSubdomainStatus('invalid');
      setSubdomainMessage('Could not check availability');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subdomain) {
        checkSubdomain(formData.subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain, checkSubdomain]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'subdomain') {
      const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'Subdomain must be at least 3 characters';
    } else if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') {
      newErrors.subdomain = 'Please choose an available subdomain';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.isLicensedProfessional) {
      newErrors.isLicensedProfessional = 'You must confirm you are a licensed healthcare professional';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    if (!formData.acceptVerification) {
      newErrors.acceptVerification = 'You must acknowledge the verification process';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          subdomain: formData.subdomain,
          password: formData.password,
          isLicensedProfessional: formData.isLicensedProfessional,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getSubdomainInputClass = () => {
    const base = 'w-full pl-12 pr-28 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all';
    if (subdomainStatus === 'available') return `${base} border-green-500`;
    if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') return `${base} border-red-500`;
    return `${base} border-gray-300`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 shadow-sm" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            <Link href="/" className="flex items-center">
              <img src="/Logo.svg" alt="CuraGo Logo" className="h-7 sm:h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 hidden sm:inline">Already have an account?</span>
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#096b17] items-center justify-center p-12">
          <div className="max-w-md text-white">
            <h2 className="text-4xl font-bold mb-6">
              Launch Your Clinic Website Today
            </h2>
            <p className="text-xl text-[#64CB81] mb-8">
              Join 500+ doctors who trust CuraGo for their online presence
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Your Own Subdomain</h4>
                  <p className="text-white/80 text-sm">Get drpriya.curago.in - live instantly!</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Professional Clinic Website</h4>
                  <p className="text-white/80 text-sm">Beautiful, mobile-friendly website for your practice</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">WhatsApp Integration</h4>
                  <p className="text-white/80 text-sm">Direct patient communication</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Free Forever Plan</h4>
                  <p className="text-white/80 text-sm">No credit card required to start</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-white/90 italic text-sm mb-3">
                  &ldquo;Within 2 days of launching my CuraGo website, I started receiving online appointment requests!&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#64CB81] rounded-full flex items-center justify-center text-[#053d0b] font-bold text-sm">
                    RK
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Dr. Rajesh Kumar</p>
                    <p className="text-white/70 text-xs">Orthopedic Surgeon, Delhi</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-white/90 italic text-sm mb-3">
                  &ldquo;The drag-and-drop builder made it so easy to create my clinic page. Highly recommend!&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#64CB81] rounded-full flex items-center justify-center text-[#053d0b] font-bold text-sm">
                    AM
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Dr. Anita Mehta</p>
                    <p className="text-white/70 text-xs">Dermatologist, Bangalore</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-7/12 flex items-start justify-center p-6 sm:p-8 overflow-y-auto" style={{ backgroundColor: '#FFFDBD' }}>
          <div className="w-full max-w-lg py-4">
            <div className="text-center mb-6">
              <div className="lg:hidden mb-4">
                <div className="w-14 h-14 bg-[#096b17] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Create Your Clinic Website
              </h1>
              <p className="text-gray-600">
                Get your professional clinic website live in minutes
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {/* Continue with Google — fastest path, no subdomain needed */}
              <a
                href={`/api/auth/google?entry=${entry}`}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </a>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or sign up with email</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Dr. Priya Sharma"
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Email & Phone - Side by side on larger screens */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="dr.priya@email.com"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                {/* Subdomain */}
                <div>
                  <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Choose Your Website URL *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="drpriya"
                      maxLength={30}
                      className={getSubdomainInputClass()}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      .curago.in
                    </span>
                  </div>
                  {subdomainMessage && (
                    <p className={`mt-1 text-sm flex items-center gap-1 ${
                      subdomainStatus === 'available' ? 'text-green-600' :
                      subdomainStatus === 'checking' ? 'text-gray-500' : 'text-red-500'
                    }`}>
                      {subdomainStatus === 'checking' && (
                        <span className="inline-block animate-spin">&#9696;</span>
                      )}
                      {subdomainStatus === 'available' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {subdomainMessage}
                    </p>
                  )}
                  {errors.subdomain && <p className="mt-1 text-sm text-red-500">{errors.subdomain}</p>}
                </div>

                {/* Password & Confirm - Side by side */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
                        className={`w-full pl-12 pr-11 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isLicensedProfessional"
                      checked={formData.isLicensedProfessional}
                      onChange={handleChange}
                      className="mt-0.5 w-5 h-5 text-[#096b17] border-gray-300 rounded focus:ring-[#096b17]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      I confirm that I am a <strong>licensed healthcare professional</strong> (doctor, dentist, physiotherapist, etc.) *
                    </span>
                  </label>
                  {errors.isLicensedProfessional && (
                    <p className="text-sm text-red-500 ml-8">{errors.isLicensedProfessional}</p>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="mt-0.5 w-5 h-5 text-[#096b17] border-gray-300 rounded focus:ring-[#096b17]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      I agree to the{' '}
                      <Link href="/terms" className="text-[#096b17] hover:underline font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-[#096b17] hover:underline font-medium">
                        Privacy Policy
                      </Link>{' '}
                      *
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-500 ml-8">{errors.acceptTerms}</p>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="acceptVerification"
                      checked={formData.acceptVerification}
                      onChange={handleChange}
                      className="mt-0.5 w-5 h-5 text-[#096b17] border-gray-300 rounded focus:ring-[#096b17]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      I understand that my profile/website is subjected to an <strong>internal verification</strong> process *
                    </span>
                  </label>
                  {errors.acceptVerification && (
                    <p className="text-sm text-red-500 ml-8">{errors.acceptVerification}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.submit}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || subdomainStatus === 'checking'}
                  className="w-full bg-[#096b17] hover:bg-[#075110] disabled:bg-[#096b17]/60 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">&#9696;</span>
                      Creating your account...
                    </>
                  ) : (
                    <>
                      Create My Clinic Website
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 p-4 bg-[#096b17]/5 rounded-xl">
                <p className="text-center text-sm text-gray-600">
                  Your clinic website will be live at{' '}
                  <span className="font-semibold text-[#096b17]">
                    {formData.subdomain || 'yourname'}.curago.in
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Need help?{' '}
              <a href="mailto:support@curago.in" className="text-[#096b17] hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
