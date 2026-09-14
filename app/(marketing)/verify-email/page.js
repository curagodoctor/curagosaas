'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Landing-matched design tokens — identical shell to the login/signup pages
// (paper/green/orange + Instrument Serif/Sans/DM Mono).
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
.authRoot{--paper:#F7F9F5;--card:#fff;--ink:#101A13;--green:#096B17;--green-deep:#053d0b;--green-lite:#64CB81;--orange:#F26A1B;--muted:#5E6B5F;--rule:#DDE4D9;--rule-soft:#EDF1EB;font-family:"Instrument Sans",system-ui,sans-serif;color:var(--ink)}
.authRoot .serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400;letter-spacing:-.02em}
.authRoot .mono{font-family:"DM Mono",ui-monospace,monospace}
`;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verified! Setting up your practice…');

      // Into the onboarding wizard (branch → profile → website → GBP → access);
      // the wizard collects the subdomain, so email signup no longer needs it.
      setTimeout(() => {
        router.push('/app/zero-to-practice-builder/onboard');
      }, 1500);
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setSuccess('New verification code sent to your email');
      setResendCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

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
              <span className="hidden sm:inline text-[15px]" style={{ color: 'var(--muted)' }}>Already verified?</span>
              <Link
                href="/login"
                className="text-white px-4 py-2 rounded-[10px] font-semibold transition-all"
                style={{ backgroundColor: 'var(--green)' }}
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
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-12" style={{ backgroundColor: 'var(--green-deep)' }}>
          <div className="max-w-md text-white">
            <h2 className="serif text-[44px] leading-[1.05] mb-6">One last step, Doctor.</h2>
            <p className="text-xl mb-8" style={{ color: 'var(--green-lite)' }}>
              Verify your email to secure your account, then we&apos;ll start building your practice online.
            </p>

            <div className="space-y-6">
              {[
                { t: 'Secure your account', d: 'Verification protects your clinic data and patient information.', p: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                { t: 'Straight into setup', d: 'The moment you verify, you land in the guided builder.', p: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { t: 'Your site, in minutes', d: 'Your profile builds a live website you can edit with AI.', p: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
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
          </div>
        </div>

        {/* Right Side - Verification Form */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12" style={{ backgroundColor: 'var(--paper)' }}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--green-deep)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="serif text-[34px] leading-tight mb-2">Verify your email</h1>
              <p style={{ color: 'var(--muted)' }}>We&apos;ve sent a 6-digit code to</p>
              <p className="font-semibold mt-1" style={{ color: 'var(--green)' }}>{email}</p>
            </div>

            <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(16,26,19,.05)' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-6"
              >
                {/* OTP Input */}
                <div>
                  <label className="mono block text-[11px] tracking-[0.1em] uppercase mb-3 text-center" style={{ color: 'var(--muted)' }}>
                    Enter verification code
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isLoading}
                        className="serif w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl rounded-[10px] outline-none transition-all disabled:opacity-60"
                        style={{ border: `1px solid ${error ? '#dc2626' : 'var(--rule)'}`, backgroundColor: '#fff' }}
                        onFocus={(e) => { e.target.style.outline = '2px solid var(--orange)'; e.target.style.outlineOffset = '1px'; }}
                        onBlur={(e) => { e.target.style.outline = 'none'; }}
                      />
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-4 py-3 rounded-[10px] flex items-center justify-center gap-2 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="px-4 py-3 rounded-[10px] flex items-center justify-center gap-2 text-sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--green)' }}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                  </div>
                )}

                {/* Verify Button — orange = action */}
                <button
                  type="submit"
                  disabled={isLoading || otp.some((d) => d === '')}
                  className="w-full text-white py-4 rounded-[11px] font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--orange)' }}
                >
                  {isLoading ? (
                    <><span className="animate-spin">&#9696;</span> Verifying…</>
                  ) : (
                    <>
                      Verify &amp; Continue
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Resend Code */}
                <div className="text-center pt-1">
                  <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Didn&apos;t receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending || resendCooldown > 0}
                    className="font-semibold disabled:cursor-not-allowed transition-colors"
                    style={{ color: resendCooldown > 0 || isResending ? 'var(--muted)' : 'var(--green)' }}
                  >
                    {isResending ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="animate-spin text-sm">&#9696;</span> Sending…
                      </span>
                    ) : resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      'Resend code'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--rule-soft)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Wrong email?{' '}
                  <Link href="/signup" className="font-semibold hover:underline" style={{ color: 'var(--green)' }}>
                    Start over
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-[10px]" style={{ color: 'var(--muted)', backgroundColor: 'var(--rule-soft)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check your spam folder if you don&apos;t see the email
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F9F5' }}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4" style={{ color: '#096B17' }}>&#9696;</div>
          <p style={{ color: '#5E6B5F' }}>Loading…</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
