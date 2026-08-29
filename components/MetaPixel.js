'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { META_PIXEL_ID, isPublicPath, fbTrackCustom } from '@/lib/metaPixel';

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);
  const publicNow = isPublicPath(pathname);

  // Fire PageView on client-side navigations between public pages. The FIRST
  // PageView is fired by the inline script below, so skip the initial effect run.
  useEffect(() => {
    if (!publicNow) return;
    if (first.current) { first.current = false; return; }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, publicNow]);

  // Track clicks on links/buttons across public pages (deduped within a short
  // window so rapid re-renders / double-fires don't spam the pixel).
  useEffect(() => {
    if (!publicNow) return undefined;
    let last = { label: '', t: 0 };
    const onClick = (e) => {
      const el = e.target?.closest?.('a, button, [role="button"]');
      if (!el) return;
      const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!label) return;
      const now = Date.now();
      if (label === last.label && now - last.t < 800) return;
      last = { label, t: now };
      fbTrackCustom('Click', { label, href: el.getAttribute?.('href') || '', path: window.location.pathname });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [publicNow]);

  if (!publicNow) return null; // don't load the pixel on private surfaces at all

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

export default function MetaPixel() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  );
}
