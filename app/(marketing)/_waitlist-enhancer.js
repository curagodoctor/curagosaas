'use client';

import { useEffect } from 'react';

/**
 * Progressive enhancement for the landing page's "Join the waitlist" buttons.
 * The page is static HTML (dangerouslySetInnerHTML); this attaches submit
 * behaviour: grab the nearby email, POST to /api/waitlist, show inline success.
 * A no-op on marketing pages that have no waitlist buttons.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function findEmailInput(btn) {
  let el = btn;
  for (let i = 0; i < 6 && el; i += 1) {
    const input = el.querySelector?.('input[type="email"]');
    if (input) return input;
    el = el.parentElement;
  }
  return document.querySelector('input[type="email"]');
}

export default function WaitlistEnhancer() {
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll('a.btn, button.btn'))
      .filter((b) => /join the waitlist/i.test(b.textContent || ''));
    if (!buttons.length) return undefined;

    const bound = [];
    for (const btn of buttons) {
      const original = btn.textContent;
      const handler = async (e) => {
        e.preventDefault();
        const input = findEmailInput(btn);
        const email = (input?.value || '').trim();

        // No email typed → fall back to the signup flow.
        if (!EMAIL_RE.test(email)) {
          window.location.href = '/signup?entry=practice-os';
          return;
        }

        btn.textContent = 'Adding…';
        btn.style.pointerEvents = 'none';
        try {
          const res = await fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'landing' }),
          });
          const data = await res.json();
          if (data.success) {
            btn.textContent = data.alreadyOn ? "✓ You're already on the list" : "✓ You're on the list";
            if (input) {
              input.value = '';
              input.disabled = true;
              input.placeholder = "Thanks — we'll be in touch";
            }
          } else {
            btn.textContent = original;
            btn.style.pointerEvents = '';
            input?.focus();
          }
        } catch {
          btn.textContent = original;
          btn.style.pointerEvents = '';
        }
      };
      btn.addEventListener('click', handler);
      bound.push([btn, handler]);
    }

    return () => bound.forEach(([b, h]) => b.removeEventListener('click', h));
  }, []);

  return null;
}
