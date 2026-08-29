// Meta Pixel helpers. Safe no-ops when the pixel hasn't loaded (private pages,
// SSR, or JS-blocked). Import fbTrack anywhere and fire standard/custom events.
export const META_PIXEL_ID = '833058805840230';

// Areas that are NOT public marketing surfaces — the company pixel skips these
// (internal dashboards + doctors' own patient sites, which carry their own pixel).
const PRIVATE_PREFIXES = ['/admin', '/app', '/platform-admin', '/clinic-manager', '/seo', '/site'];

export function isPublicPath(path) {
  if (!path) return false;
  return !PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export function fbTrack(event, params) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  // Don't track on private surfaces even if called from a shared component.
  if (!isPublicPath(window.location?.pathname)) return;
  try { window.fbq('track', event, params || {}); } catch { /* ignore */ }
}

export function fbTrackCustom(event, params) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (!isPublicPath(window.location?.pathname)) return;
  try { window.fbq('trackCustom', event, params || {}); } catch { /* ignore */ }
}
