// Site homepage — the "Dominate Organic Search" landing (September Plan §1:
// one product, no competing offers). The landing itself is a client component
// (interactive nav + CTAs) in components/marketing/DominateLanding.js; this
// server wrapper carries the page's SEO metadata.
import DominateLanding from '@/components/marketing/DominateLanding';

export const metadata = {
  title: 'CuraGo — Dominate Organic Search for Doctors',
  description:
    'Get found when patients search on Google. CuraGo builds your website, education pages and Google Business Profile, then grows your organic visibility month after month.',
  alternates: { canonical: 'https://curago.in' },
  openGraph: {
    title: 'CuraGo — Dominate Organic Search for Doctors',
    description:
      'Get found when patients search on Google. CuraGo builds your website, education pages and Google Business Profile, then grows your organic visibility month after month.',
    url: 'https://curago.in',
    type: 'website',
  },
};

export default function Page() {
  return <DominateLanding />;
}
