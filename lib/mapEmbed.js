/**
 * Normalize an arbitrary Google Maps value into a URL that can actually be
 * embedded in an <iframe>.
 *
 * Google blocks normal Maps URLs (share links, /maps/place/... links,
 * maps.app.goo.gl short links) inside iframes via X-Frame-Options, which shows
 * "www.google.com refused to connect". Only three forms embed:
 *   1. The Share → "Embed a map" URL (https://www.google.com/maps/embed?pb=...)
 *   2. The Embed API (needs an API key)
 *   3. The query form with &output=embed (no key required)
 *
 * This helper accepts whatever the doctor pasted (embed URL, full <iframe>
 * snippet, a normal share/place link, or nothing) plus the location address,
 * and returns a reliably-embeddable URL — falling back to an address-based
 * embed so a location with only an address still shows a map.
 *
 * @param {string} mapUrl - the pasted map value (may be empty)
 * @param {string} address - the location's address (used as a fallback)
 * @returns {string} an embeddable URL, or '' if nothing usable
 */
export function toMapEmbedUrl(mapUrl, address) {
  const raw = (mapUrl || '').trim();

  // 1. A full <iframe ...> snippet was pasted — pull out the src.
  if (raw.includes('<iframe')) {
    const m = raw.match(/src=["']([^"']+)["']/i);
    if (m) return m[1];
  }

  // 2. Already embeddable (Share → Embed a map, Embed API, or output=embed).
  if (/\/maps\/embed/i.test(raw) || /[?&]output=embed/i.test(raw)) {
    return raw;
  }

  // 3. A normal Maps link — try to pull coordinates out and build an embed.
  if (raw) {
    const coords =
      raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||        // .../@lat,lng,zoom
      raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||     // !3dlat!4dlng
      raw.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||    // ?q=lat,lng
      raw.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);     // ?ll=lat,lng
    if (coords) {
      return `https://maps.google.com/maps?q=${coords[1]},${coords[2]}&z=16&output=embed`;
    }
  }

  // 4. Fall back to an address-based embed (works without an API key).
  if (address && address.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address.trim())}&z=16&output=embed`;
  }

  // 5. Nothing usable.
  return '';
}
