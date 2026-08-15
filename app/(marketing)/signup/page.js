'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Landing-matched design tokens — identical to the login page shell.
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
.authRoot{--paper:#F7F9F5;--card:#fff;--ink:#101A13;--green:#096B17;--green-deep:#053d0b;--green-lite:#64CB81;--orange:#F26A1B;--muted:#5E6B5F;--rule:#DDE4D9;--rule-soft:#EDF1EB;font-family:"Instrument Sans",system-ui,sans-serif;color:var(--ink)}
.authRoot .serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400;letter-spacing:-.02em}
.authRoot .mono{font-family:"DM Mono",ui-monospace,monospace}
`;

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

  const loginHref = `/login${entry === 'practice-os' ? '?entry=practice-os' : ''}`;
  // Orange focus ring + white field, matching the login page inputs.
  const focusOn = (e) => { e.target.style.outline = '2px solid var(--orange)'; e.target.style.outlineOffset = '1px'; };
  const focusOff = (e) => { e.target.style.outline = 'none'; };
  const fieldStyle = (bad) => ({ border: `1px solid ${bad ? '#dc2626' : 'var(--rule)'}`, backgroundColor: '#fff' });
  const subdomainStyle = () => {
    let border = 'var(--rule)';
    if (subdomainStatus === 'available') border = '#16a34a';
    else if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') border = '#dc2626';
    return { border: `1px solid ${border}`, backgroundColor: '#fff' };
  };
  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="absolute inset-y-0 right-0 pr-4 flex items-center"
      style={{ color: 'var(--muted)' }}
    >
      {showPassword ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      )}
    </button>
  );

  return (
    <div className="authRoot min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--rule)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/curago-logo.png" alt="CuraGo" className="h-7 sm:h-9 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[15px]" style={{ color: 'var(--muted)' }}>Already have an account?</span>
              <Link href={loginHref} className="text-white px-4 py-2 rounded-[10px] font-semibold transition-all" style={{ backgroundColor: 'var(--green)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-5/12 items-center justify-center p-12" style={{ backgroundColor: 'var(--green-deep)' }}>
          <div className="max-w-md text-white">
            <h2 className="serif text-[44px] leading-[1.05] mb-6">Launch your clinic website today.</h2>
            <p className="text-xl mb-8" style={{ color: 'var(--green-lite)' }}>
              Join 500+ doctors who trust CuraGo for their online presence.
            </p>

            <div className="space-y-6">
              {[
                { t: 'Your Own Subdomain', d: 'Get drpriya.curago.in — live instantly', p: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
                { t: 'Professional Clinic Website', d: 'Beautiful, mobile-friendly site for your practice', p: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { t: 'WhatsApp Integration', d: 'Direct patient communication', p: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { t: 'Free Forever Plan', d: 'No credit card required to start', p: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.p} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{f.t}</h4>
                    <p className="text-white/80 text-sm">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-white/10 rounded-2xl">
              <p className="text-white/90 italic mb-3">
                &ldquo;Within 2 days of launching my CuraGo website, I started receiving online appointment requests!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--green-lite)', color: 'var(--green-deep)' }}>
                  RK
                </div>
                <div>
                  <p className="font-semibold">Dr. Rajesh Kumar</p>
                  <p className="text-white/70 text-sm">Orthopedic Surgeon, Delhi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-7/12 flex items-start justify-center p-6 sm:p-12 overflow-y-auto" style={{ backgroundColor: 'var(--paper)' }}>
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--green-deep)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h1 className="serif text-[34px] leading-tight mb-2">Create your clinic website</h1>
              <p style={{ color: 'var(--muted)' }}>Get your professional clinic website live in minutes</p>
            </div>

            {/* Right-fit assessment entry — same flow as the landing cohort CTA. */}
            <Link
              href="/join-cohort?source=signup"
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-6 transition-colors"
              style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', border: '1px solid var(--rule)' }}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[14px] font-medium text-[var(--ink,#101A13)]">See if you&apos;re a right fit for Practice Builder</span>
              </span>
              <span className="text-[var(--green)] font-semibold shrink-0">→</span>
            </Link>

            <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(16,26,19,.05)' }}>
              {/* Continue with Google — fastest path, no subdomain needed */}
              <a
                href={`/api/auth/google?entry=${entry}`}
                className="w-full flex items-center justify-center gap-3 rounded-[11px] py-3.5 font-semibold transition-colors"
                style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </a>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: 'var(--rule)' }} /></div>
                <div className="relative flex justify-center"><span className="px-3 text-sm" style={{ backgroundColor: 'var(--card)', color: 'var(--muted)' }}>or sign up with email</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Name */}
                <div>
                  <label htmlFor="name" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Full Name</label>
                  <input
                    type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Priya Sharma"
                    className="w-full px-4 py-3 rounded-[10px] outline-none transition-all" style={fieldStyle(errors.name)}
                    onFocus={focusOn} onBlur={focusOff}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Email Address</label>
                    <input
                      type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="dr.priya@email.com"
                      className="w-full px-4 py-3 rounded-[10px] outline-none transition-all" style={fieldStyle(errors.email)}
                      onFocus={focusOn} onBlur={focusOff}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Phone Number</label>
                    <input
                      type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210"
                      className="w-full px-4 py-3 rounded-[10px] outline-none transition-all" style={fieldStyle(errors.phone)}
                      onFocus={focusOn} onBlur={focusOff}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                {/* Subdomain */}
                <div>
                  <label htmlFor="subdomain" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Choose Your Website URL</label>
                  <div className="relative">
                    <input
                      type="text" id="subdomain" name="subdomain" value={formData.subdomain} onChange={handleChange} placeholder="drpriya" maxLength={30}
                      className="w-full px-4 pr-28 py-3 rounded-[10px] outline-none transition-all" style={subdomainStyle()}
                      onFocus={focusOn} onBlur={focusOff}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--muted)' }}>.curago.in</span>
                  </div>
                  {subdomainMessage && (
                    <p className={`mt-1 text-sm flex items-center gap-1 ${
                      subdomainStatus === 'available' ? 'text-green-600' :
                      subdomainStatus === 'checking' ? 'text-gray-500' : 'text-red-500'
                    }`}>
                      {subdomainStatus === 'checking' && <span className="inline-block animate-spin">&#9696;</span>}
                      {subdomainStatus === 'available' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {subdomainMessage}
                    </p>
                  )}
                  {errors.subdomain && <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>}
                </div>

                {/* Password & Confirm */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters"
                        className="w-full px-4 pr-11 py-3 rounded-[10px] outline-none transition-all" style={fieldStyle(errors.password)}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                      {eyeBtn}
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                        className="w-full px-4 pr-11 py-3 rounded-[10px] outline-none transition-all" style={fieldStyle(errors.confirmPassword)}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                      {eyeBtn}
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="isLicensedProfessional" checked={formData.isLicensedProfessional} onChange={handleChange}
                      className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: 'var(--green)' }} />
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>
                      I confirm that I am a <strong>licensed healthcare professional</strong> (doctor, dentist, physiotherapist, etc.)
                    </span>
                  </label>
                  {errors.isLicensedProfessional && <p className="text-sm text-red-600 ml-8">{errors.isLicensedProfessional}</p>}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
                      className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: 'var(--green)' }} />
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium hover:underline" style={{ color: 'var(--green)' }}>Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium hover:underline" style={{ color: 'var(--green)' }}>Privacy Policy</Link>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-sm text-red-600 ml-8">{errors.acceptTerms}</p>}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="acceptVerification" checked={formData.acceptVerification} onChange={handleChange}
                      className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: 'var(--green)' }} />
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>
                      I understand that my profile/website is subjected to an <strong>internal verification</strong> process
                    </span>
                  </label>
                  {errors.acceptVerification && <p className="text-sm text-red-600 ml-8">{errors.acceptVerification}</p>}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="px-4 py-3 rounded-[10px] flex items-center gap-2 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.submit}
                  </div>
                )}

                {/* Submit Button — orange = action */}
                <button
                  type="submit"
                  disabled={isLoading || subdomainStatus === 'checking'}
                  className="w-full text-white py-4 rounded-[11px] font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--orange)' }}
                >
                  {isLoading ? (
                    <><span className="animate-spin">&#9696;</span> Creating your account…</>
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

              <div className="mt-5 p-4 rounded-[10px]" style={{ backgroundColor: 'var(--rule-soft)' }}>
                <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                  Your clinic website will be live at{' '}
                  <span className="font-semibold" style={{ color: 'var(--green)' }}>{formData.subdomain || 'yourname'}.curago.in</span>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
              Need help?{' '}
              <a href="mailto:support@curago.in" className="font-medium hover:underline" style={{ color: 'var(--green)' }}>Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
