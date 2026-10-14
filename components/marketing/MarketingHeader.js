'use client';

import Link from 'next/link';

// Shared top nav for standalone marketing pages (store, rank-check, etc.) — the
// homepage has its own elaborate nav inside DominateLanding, so this is for the
// pages that would otherwise render with no navbar.
export default function MarketingHeader() {
  const link = { color: '#101A13', textDecoration: 'none', fontSize: 14.5, fontWeight: 500 };
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #DDE4D9' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curago-logo.png" alt="CuraGo" style={{ height: 28, width: 'auto' }} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/" style={link}>Home</Link>
          <Link href="/store" style={link}>Store</Link>
          <Link href="/rank-check" style={link}>Free ranking check</Link>
          <Link href="/login" style={{ ...link, color: '#096B17', fontWeight: 600 }}>Login</Link>
          <Link href="/signup" style={{ background: '#F26A1B', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14.5 }}>Sign up</Link>
        </nav>
      </div>
    </header>
  );
}
