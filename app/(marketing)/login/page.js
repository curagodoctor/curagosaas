'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Landing-matched design tokens (paper/green/orange + Instrument Serif/Sans/DM Mono).
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
.loginRoot{--paper:#F7F9F5;--card:#fff;--ink:#101A13;--green:#096B17;--green-deep:#053d0b;--green-lite:#64CB81;--orange:#F26A1B;--muted:#5E6B5F;--rule:#DDE4D9;--rule-soft:#EDF1EB;font-family:"Instrument Sans",system-ui,sans-serif;color:var(--ink)}
.loginRoot .serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400;letter-spacing:-.02em}
.loginRoot .mono{font-family:"DM Mono",ui-monospace,monospace}
`;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Which product door the user came from — preserved through Google sign-in.
  const entry = searchParams.get('entry') === 'practice-os' ? 'practice-os' : 'website-builder';
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Please verify your email first') {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
          return;
        }
        throw new Error(data.error || 'Something went wrong');
      }
      // Land on the unified workspace (matches Google sign-in), not straight into
      // the website-builder admin. Practice-OS entrants go into that product.
      router.push(entry === 'practice-os' ? '/app/practice-os' : '/app');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const signupHref = `/signup${entry === 'practice-os' ? '?entry=practice-os' : ''}`;

  return (
    <div className="loginRoot min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--rule)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Logo.svg" alt="CuraGo Logo" className="h-7 sm:h-9 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[15px]" style={{ color: 'var(--muted)' }}>Don&apos;t have an account?</span>
              <Link
                href={signupHref}
                className="text-white px-4 py-2 rounded-[10px] font-semibold transition-all"
                style={{ backgroundColor: 'var(--green)' }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12" style={{ backgroundColor: 'var(--green-deep)' }}>
          <div className="max-w-md text-white">
            <h2 className="serif text-[44px] leading-[1.05] mb-6">Welcome back, Doctor.</h2>
            <p className="text-xl mb-8" style={{ color: 'var(--green-lite)' }}>
              Access your clinic dashboard and manage appointments, website, and patient bookings.
            </p>

            <div className="space-y-6">
              {[
                { t: 'Manage Your Website', d: 'Update content, services, and clinic information', p: 'M4 6h16M4 10h16M4 14h10M4 18h6' },
                { t: 'View Appointments', d: 'Track and manage patient bookings', p: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { t: 'Set Availability', d: 'Configure your consultation slots', p: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
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

            <div className="mt-12 p-6 bg-white/10 rounded-2xl">
              <p className="text-white/90 italic mb-3">
                &ldquo;CuraGo has transformed how I manage my practice online. Highly recommended for fellow doctors!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--green-lite)', color: 'var(--green-deep)' }}>
                  PS
                </div>
                <div>
                  <p className="font-semibold">Dr. Priya Sharma</p>
                  <p className="text-white/70 text-sm">Cardiologist, Mumbai</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12" style={{ backgroundColor: 'var(--paper)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--green-deep)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="serif text-[34px] leading-tight mb-2">Doctor Login</h1>
              <p style={{ color: 'var(--muted)' }}>Sign in to access your clinic dashboard</p>
            </div>

            <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(16,26,19,.05)' }}>
              {/* Continue with Google (same OAuth, entry point preserved) */}
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
                <div className="relative flex justify-center"><span className="px-3 text-sm" style={{ backgroundColor: 'var(--card)', color: 'var(--muted)' }}>or</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mono block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>
                    Email Address
                  </label>
                  <input
                    type="email" id="email" name="email" autoComplete="email"
                    value={formData.email} onChange={handleChange} placeholder="you@clinic.com"
                    className="w-full px-4 py-3 rounded-[10px] outline-none transition-all"
                    style={{ border: `1px solid ${errors.email ? '#dc2626' : 'var(--rule)'}`, backgroundColor: '#fff' }}
                    onFocus={(e) => { e.target.style.outline = '2px solid var(--orange)'; e.target.style.outlineOffset = '1px'; }}
                    onBlur={(e) => { e.target.style.outline = 'none'; }}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="mono block text-[11px] tracking-[0.1em] uppercase" style={{ color: 'var(--muted)' }}>
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: 'var(--green)' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password" id="password" name="password" autoComplete="current-password"
                    value={formData.password} onChange={handleChange} placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-[10px] outline-none transition-all"
                    style={{ border: `1px solid ${errors.password ? '#dc2626' : 'var(--rule)'}`, backgroundColor: '#fff' }}
                    onFocus={(e) => { e.target.style.outline = '2px solid var(--orange)'; e.target.style.outlineOffset = '1px'; }}
                    onBlur={(e) => { e.target.style.outline = 'none'; }}
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
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
                  disabled={isLoading}
                  className="w-full text-white py-4 rounded-[11px] font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--orange)' }}
                >
                  {isLoading ? (
                    <><span className="animate-spin">&#9696;</span> Signing in…</>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--rule-soft)' }}>
                <p style={{ color: 'var(--muted)' }}>
                  New to CuraGo?{' '}
                  <Link href={signupHref} className="font-semibold hover:underline" style={{ color: 'var(--green)' }}>
                    Create your clinic website
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Trusted by 500+ doctors across India</p>
              <div className="flex justify-center gap-4">
                <div className="flex -space-x-2">
                  {['RK', 'AS', 'PM', 'SK'].map((initials) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: 'var(--green)' }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
              Need help?{' '}
              <a href="mailto:support@curago.in" className="font-medium hover:underline" style={{ color: 'var(--green)' }}>
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
