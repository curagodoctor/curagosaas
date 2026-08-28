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
    // Delegate on the document instead of binding to the button directly. The
    // header is injected via dangerouslySetInnerHTML, so the button may not be
    // in the DOM at effect time (or may be re-rendered) — delegation always
    // works, and covers every mobile browser without touch/click quirks.
    const menuEl = () => document.querySelector('[data-mobile-menu]');
    const setOpen = (open) => {
      const toggle = document.querySelector('[data-mobile-toggle]');
      const menu = menuEl();
      if (toggle) { toggle.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      if (menu) menu.classList.toggle('open', open);
    };

    const onDocClick = (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      const toggle = t.closest('[data-mobile-toggle]');
      if (toggle) {
        e.preventDefault();
        const menu = menuEl();
        setOpen(!(menu && menu.classList.contains('open')));
        return;
      }
      // Tapping a link inside the open menu closes it.
      const menu = menuEl();
      if (menu && menu.classList.contains('open') && t.closest('[data-mobile-menu] a')) setOpen(false);
    };

    const onResize = () => { if (window.innerWidth > 860) setOpen(false); };

    document.addEventListener('click', onDocClick);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
