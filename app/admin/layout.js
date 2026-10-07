import { Instrument_Sans, Instrument_Serif, DM_Mono } from 'next/font/google';
import '@/app/app/practiceos.css';

// The admin (website-builder) area shares the Control Center's design system. The
// tokens (--paper, --ink, --green, --card, pos-link, …) and fonts live on `.pos-root`
// in practiceos.css, so the whole /admin tree must be wrapped in it — otherwise
// var(--paper)/var(--card)/pos-link resolve to nothing and the background, nav colours
// and the workspace sidebar render unstyled (inconsistent with /app/control-center).
// Per CLAUDE.md §2 — Instrument Sans/Serif + DM Mono only.
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export default function AdminLayout({ children }) {
  return <div className={`pos-root ${sans.variable} ${serif.variable} ${mono.variable}`}>{children}</div>;
}
