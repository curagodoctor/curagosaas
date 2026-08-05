import { ImageResponse } from 'next/og';

// Auto-generated 1200×630 social share image for the marketing pages. Replaces
// the missing static /og-preview.jpg. Uses system fonts only (no fetch).
export const runtime = 'nodejs';
export const alt = 'CuraGo — Build your medical practice online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #05300f 0%, #096B17 60%, #0E6B25 100%)',
          color: '#ffffff',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, letterSpacing: 6, color: '#8FE6AE' }}>
          CURAGO · PRACTICE BUILDER
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            You know you&apos;re a good doctor.
          </div>
          <div style={{ fontSize: 82, fontWeight: 400, fontStyle: 'italic', color: '#8FE6AE', lineHeight: 1.05 }}>
            Patients don&apos;t.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.82)' }}>
          Website · Booking · WhatsApp · Growth — built for doctors in India.
        </div>
      </div>
    ),
    { ...size }
  );
}
