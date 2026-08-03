'use client';

import { useEffect } from 'react';

/**
 * Progressive scroll-reveal for the landing page's [data-reveal] elements.
 * The design was a design-tool export whose runtime applied opacity:0 + a
 * translateY, then faded elements in on scroll. That runtime is ignored, so
 * this reproduces the same animation. The page CSS does NOT hide [data-reveal]
 * by default, so if this never runs (or reduced-motion is set) content stays
 * fully visible. A safety timeout also reveals everything after 3s no matter
 * what, so content can never get stuck hidden.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return undefined;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      return undefined; // leave everything visible
    }

    const reveal = (el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    };

    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition =
        'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)';
      const d = el.getAttribute('data-reveal-delay');
      if (d) el.style.transitionDelay = `${d}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));

    // Safety net: never let content stay hidden.
    const safety = window.setTimeout(() => els.forEach(reveal), 3000);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return null;
}
