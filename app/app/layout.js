import { Instrument_Sans, Instrument_Serif, DM_Mono } from 'next/font/google';
import './practiceos.css';
// Subdomain setup is no longer compulsory — it's optional and set from the
// dashboard's "Your Live Website" section. The hard gate has been removed.

// Per CLAUDE.md §2 — do NOT substitute Inter / Space Grotesk / JetBrains Mono.
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'CuraGo — Your workspace',
};

export default function AppLayout({ children }) {
  return (
    <div className={`pos-root ${sans.variable} ${serif.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
