'use client';

import { useState, useEffect } from 'react';

// The one "unlock premium tools" popup for the whole control center. Every paid
// tool unlocks with the Dominate Organic Search subscription — there's no separate
// per-tool plan — so the single Subscribe button goes straight to the ₹5,000
// (incl. GST, ₹5,900) Razorpay gateway.
//
// Opened from anywhere by dispatching window event 'pos-open-upgrade', or by
// landing on a control-center URL with ?upgrade=1 (e.g. a locked tool → upgrade).
export default function UpgradePopup() {
  const [open, setOpen] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgrade') === '1') setOpen(true);
    const onOpen = () => { setPayMsg(''); setOpen(true); };
    window.addEventListener('pos-open-upgrade', onOpen);
    return () => window.removeEventListener('pos-open-upgrade', onOpen);
  }, []);

  const startPayment = async () => {
    setPayBusy(true); setPayMsg('');
    try {
      const d = await fetch('/api/practice-os/optimization/subscribe', { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (!d.success) { setPayMsg(d.error || 'Could not start the payment. Please try again.'); setPayBusy(false); return; }
      const ok = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true); s.onerror = () => resolve(false);
        document.body.appendChild(s);
      });
      if (!ok) { setPayMsg('Could not load the payment window.'); setPayBusy(false); return; }
      const rz = new window.Razorpay({
        key: d.keyId,
        subscription_id: d.subscriptionId,
        name: 'CuraGo — Dominate Organic Search',
        description: '₹5,000 + 18% GST (₹5,900) / month',
        handler: async (resp) => {
          try {
            await fetch('/api/practice-os/optimization/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
              body: JSON.stringify(resp),
            });
          } catch { /* webhook also confirms */ }
          window.location.reload();
        },
        modal: { ondismiss: () => setPayBusy(false) },
        theme: { color: '#096b17' },
      });
      rz.open();
    } catch { setPayMsg('Something went wrong.'); setPayBusy(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(16,26,19,.55)' }} onClick={() => { if (!payBusy) { setOpen(false); setPayMsg(''); } }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-7" style={{ background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
        <span className="pos-label" style={{ color: 'var(--green)' }}>Dominate Organic Search</span>
        <h3 className="text-[21px] font-semibold text-[var(--ink)] mt-2" style={{ letterSpacing: '-0.02em' }}>Unlock all premium tools</h3>
        <p className="text-[14.5px] text-[var(--muted)] mt-2.5 leading-relaxed">
          All premium tools are available only for Dominate Organic Search subscribers. Click subscribe to unlock — bookings, contacts, workflows, templates, analytics and unlimited pages, plus the full daily engine.
        </p>
        {payMsg && <p className="text-[13px] mt-3" style={{ color: '#c0392b' }}>{payMsg}</p>}
        <button onClick={startPayment} disabled={payBusy} className="w-full mt-5 rounded-lg px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-60" style={{ background: 'var(--green)' }}>
          {payBusy ? 'Opening payment…' : 'Subscribe · ₹5,000/month →'}
        </button>
        <p className="text-[12px] text-center text-[var(--muted)] mt-2.5">Inclusive of GST — ₹5,900/month, billed securely via Razorpay.</p>
        <button onClick={() => { setOpen(false); setPayMsg(''); }} disabled={payBusy} className="w-full mt-1.5 py-2 text-[13px] text-[var(--muted)] disabled:opacity-60">Maybe later</button>
      </div>
    </div>
  );
}

// Helper any component can import to open the popup.
export function openUpgrade() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pos-open-upgrade'));
}
