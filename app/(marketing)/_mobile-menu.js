'use client';

import { useEffect } from 'react';

/**
 * Mobile hamburger menu for the static landing page.
 * The page is static HTML (dangerouslySetInnerHTML) and cannot run inline
 * scripts, so this enhancer wires up the interactivity: it finds the
 * [data-mobile-toggle] button and the [data-mobile-menu] panel injected in the
 * BODY string and toggles an `open` class on both. The panel closes when a link
 * inside it is tapped or when the viewport grows to desktop width. A no-op on
 * marketing pages that have no hamburger.
 */
export default function MobileMenu() {
  useEffect(() => {
    const toggle = document.querySelector('[data-mobile-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return undefined;

    // Idempotency guard: never double-bind (React strict mode / re-mounts).
    if (toggle.dataset.mmBound === '1') return undefined;
    toggle.dataset.mmBound = '1';

    const setOpen = (open) => {
      toggle.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    const onToggle = (e) => {
      e.preventDefault();
      setOpen(!menu.classList.contains('open'));
    };

    const onLinkClick = (e) => {
      if (e.target.closest('a')) setOpen(false);
    };

    const onResize = () => {
      if (window.innerWidth > 860) setOpen(false);
    };

    toggle.addEventListener('click', onToggle);
    menu.addEventListener('click', onLinkClick);
    window.addEventListener('resize', onResize);

    return () => {
      toggle.removeEventListener('click', onToggle);
      menu.removeEventListener('click', onLinkClick);
      window.removeEventListener('resize', onResize);
      delete toggle.dataset.mmBound;
    };
  }, []);

  return null;
}
