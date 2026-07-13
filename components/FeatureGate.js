'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * FeatureGate — wraps a premium module (Contacts, Workflows, Messaging).
 *
 * Fetches the current doctor's entitlements from /api/doctor/entitlements
 * (works for doctor + clinic-manager + seo tokens, since getCurrentDoctor
 * resolves all of them to the owning doctor). If the feature is unlocked it
 * renders `children`; otherwise it renders an Upgrade/Redeem screen instead —
 * children never mount, so their data-fetching effects don't fire 403s.
 *
 * Props:
 *   feature   - 'contacts' | 'workflows' | 'messaging'
 *   title     - human label for the locked module (e.g. "Contacts")
 *   children  - the module UI
 */
export default function FeatureGate({ feature, title = 'This feature', children }) {
  const [state, setState] = useState({ loading: true, allowed: false, entitlements: null });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/entitlements');
      const data = await res.json();
      if (data.success && data.entitlements) {
        setState({
          loading: false,
          allowed: !!data.entitlements.features?.[feature],
          entitlements: data.entitlements,
        });
      } else {
        // If entitlements can't be read, fail closed (locked) but don't crash.
        setState({ loading: false, allowed: false, entitlements: null });
      }
    } catch {
      setState({ loading: false, allowed: false, entitlements: null });
    }
  }, [feature]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#096b17] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.allowed) {
    return children;
  }

  return <UpgradeScreen feature={feature} title={title} entitlements={state.entitlements} onUnlocked={load} />;
}

function UpgradeScreen({ title, entitlements, onUnlocked }) {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text }

  const trialExpired = entitlements?.plan === 'trial' && !entitlements?.isActive;

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);
    setMessage(null);
    try {
      const res = await fetch('/api/doctor/promo-code/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Unlocked! Loading your module…' });
        // Re-check entitlements; the module will render once unlocked.
        setTimeout(onUnlocked, 900);
      } else {
        setMessage({ type: 'error', text: data.error || 'Could not redeem this code.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-[#096b17]/10 rounded-full mx-auto mb-5 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title} is a premium feature</h2>
        <p className="text-gray-600 mb-1">
          {trialExpired
            ? 'Your free trial has ended.'
            : 'This module is available on a paid plan.'}
        </p>
        <p className="text-gray-600 mb-6">
          Upgrade your subscription or enter a promo code to unlock <strong>Contacts</strong>,{' '}
          <strong>Workflows</strong> and <strong>Messaging</strong>.
        </p>

        <a
          href="/admin/dashboard/settings?tab=subscription"
          className="inline-flex items-center justify-center gap-2 w-full bg-[#096b17] hover:bg-[#075110] text-white px-6 py-3 rounded-xl font-semibold transition-colors mb-6"
        >
          Upgrade Plan
        </a>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-400">or redeem a promo code</span>
          </div>
        </div>

        <form onSubmit={handleRedeem} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code (e.g. ZEROTOPRACTICE)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center tracking-wide uppercase focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={redeeming || !code.trim()}
            className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {redeeming ? 'Redeeming…' : 'Redeem Code'}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm font-medium ${
              message.type === 'success' ? 'text-[#096b17]' : 'text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
