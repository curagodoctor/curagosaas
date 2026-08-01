'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Auth design — matches the landing page (paper bg, Instrument Serif/Sans/DM Mono,
// green identity, orange action). Self-contained so it works within the bare
// marketing layout.
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
.auth-wrap{--paper:#F7F9F5;--card:#fff;--ink:#101A13;--green:#096B17;--orange:#F26A1B;--muted:#5E6B5F;--rule:#DDE4D9;--rule-soft:#EDF1EB;--sans:"Instrument Sans",system-ui,sans-serif;--serif:"Instrument Serif",Georgia,serif;--mono:"DM Mono",ui-monospace,monospace;min-height:100vh;background:var(--paper);color:var(--ink);font-family:var(--sans);display:flex;flex-direction:column}
.auth-top{display:flex;align-items:center;justify-content:space-between;padding:20px 24px}
.auth-logo{height:30px;width:auto;display:block}
.auth-toplink{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-decoration:none}
.auth-toplink:hover{color:var(--ink)}
.auth-main{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px 48px}
.auth-card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--rule);border-radius:16px;padding:32px 28px;box-shadow:0 1px 2px rgba(16,26,19,.04)}
.auth-h1{font-family:var(--serif);font-size:34px;line-height:1.08;letter-spacing:-.02em;margin:0 0 6px}
.auth-sub{color:var(--muted);font-size:15px;margin:0 0 22px}
.auth-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;font-family:var(--sans);font-size:15.5px;font-weight:600;border-radius:11px;min-height:52px;padding:14px;cursor:pointer;text-decoration:none;transition:filter .15s,background .15s;border:0}
.auth-btn.primary{background:var(--orange);color:#fff}
.auth-btn.primary:hover{filter:brightness(.95)}
.auth-btn.primary:disabled{opacity:.55;cursor:default}
.auth-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--rule)}
.auth-btn.ghost:hover{background:var(--rule-soft)}
.auth-or{display:flex;align-items:center;color:var(--muted);font-size:13px;margin:18px 0}
.auth-or::before,.auth-or::after{content:"";flex:1;height:1px;background:var(--rule)}
.auth-or span{padding:0 12px}
.auth-field{margin-top:14px}
.auth-label{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
.auth-input{width:100%;font-family:var(--sans);font-size:15.5px;padding:14px;border:1px solid var(--rule);border-radius:10px;background:#fff;color:var(--ink);min-height:50px}
.auth-input:focus{outline:2px solid var(--orange);outline-offset:1px;border-color:transparent}
.auth-input.err{border-color:#dc2626}
.auth-row{display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px}
.auth-link{font-size:13px;color:var(--green);text-decoration:none;font-weight:500}
.auth-link:hover{text-decoration:underline}
.auth-err{color:#dc2626;font-size:12.5px;margin:4px 0 0}
.auth-submit-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13.5px;padding:10px 12px;border-radius:10px;margin-top:16px}
.auth-submit{margin-top:20px}
.auth-foot{text-align:center;color:var(--muted);font-size:14px;margin-top:22px;padding-top:18px;border-top:1px solid var(--rule-soft)}
.auth-foot a{color:var(--green);font-weight:600;text-decoration:none}
.auth-foot a:hover{text-decoration:underline}
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
      router.push('/admin/dashboard');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      <header className="auth-top">
        <Link href="/" aria-label="CuraGo home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.svg" alt="CuraGo" className="auth-logo" />
        </Link>
        <Link href={`/signup${entry === 'practice-os' ? '?entry=practice-os' : ''}`} className="auth-toplink">Create account →</Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-h1">Welcome back</h1>
          <p className="auth-sub">Sign in to your CuraGo account.</p>

          <a href={`/api/auth/google?entry=${entry}`} className="auth-btn ghost">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

          <div className="auth-or"><span>or</span></div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email</label>
              <input
                type="email" id="email" name="email" autoComplete="email"
                value={formData.email} onChange={handleChange} placeholder="you@clinic.com"
                className={`auth-input${errors.email ? ' err' : ''}`}
              />
              {errors.email && <p className="auth-err">{errors.email}</p>}
            </div>

            <div className="auth-row">
              <label htmlFor="password" className="auth-label" style={{ margin: 0 }}>Password</label>
              <Link href="/forgot-password" className="auth-link">Forgot?</Link>
            </div>
            <input
              type="password" id="password" name="password" autoComplete="current-password"
              value={formData.password} onChange={handleChange} placeholder="Your password"
              className={`auth-input${errors.password ? ' err' : ''}`}
            />
            {errors.password && <p className="auth-err">{errors.password}</p>}

            {errors.submit && <div className="auth-submit-err">{errors.submit}</div>}

            <button type="submit" disabled={isLoading} className="auth-btn primary auth-submit">
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-foot">
            New to CuraGo? <Link href={`/signup${entry === 'practice-os' ? '?entry=practice-os' : ''}`}>Create your account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
