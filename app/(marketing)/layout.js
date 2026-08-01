// Marketing pages layout with CuraGo platform SEO metadata
import WaitlistEnhancer from './_waitlist-enhancer';
import RazorpayButtons from './_razorpay-buttons';

export const metadata = {
  title: "CuraGo - Build Your Medical Practice Online | Website, Booking & Growth for Doctors",
  description: "Create your digital clinic in minutes with CuraGo. Get a professional website, patient booking system, WhatsApp integration, and tools to grow your medical practice. Built for doctors.",
  keywords: [
    "doctor website builder",
    "clinic website",
    "medical practice software",
    "doctor booking system",
    "healthcare SaaS India",
    "WhatsApp booking for doctors",
    "digital clinic setup",
    "online appointment booking",
    "medical practice management",
    "doctor appointment system",
    "telemedicine platform India",
    "clinic management software",
  ],
  authors: [{ name: "CuraGo" }],
  creator: "CuraGo",
  publisher: "CuraGo",
  metadataBase: new URL("https://curago.in"),
  alternates: {
    canonical: "https://curago.in",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "CuraGo - Build Your Medical Practice Online in Minutes",
    description: "Website, booking system, WhatsApp integration, and growth tools for doctors. Launch your digital clinic instantly with CuraGo.",
    url: "https://curago.in",
    siteName: "CuraGo",
    images: [
      {
        url: "/og-preview.jpg", // 1200x630 recommended
        width: 1200,
        height: 630,
        alt: "CuraGo - Build Your Digital Clinic in 2 Minutes",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CuraGo - Digital Practice Setup for Doctors",
    description: "Launch your clinic online with website, bookings, and WhatsApp tools. Built for modern doctors.",
    images: ["/og-preview.jpg"],
    creator: "@curago_in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#096b17",
};

export default function MarketingLayout({ children }) {
  return (
    <>
      {children}
      <WaitlistEnhancer />
      <RazorpayButtons />
    </>
  );
}
