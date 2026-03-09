import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import { ModalProvider } from "@/contexts/ModalContext";
import WyltoChatbot from "@/components/WyltoChatbot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dr. Yuvaraj T | Surgical Gastroenterologist Mumbai - Online & Offline Consult",
  description: "Consult Dr. Yuvaraj T, expert Surgical Gastroenterologist in Mumbai. Specialized in GI surgery, hernia repair, gallbladder surgery, colonoscopy, endoscopy & gut-brain disorders. Book online or in-clinic consultation at SRV Hospital, Chembur.",
  keywords: [
    "surgical gastroenterologist Mumbai",
    "gastroenterologist near me",
    "GI surgeon Mumbai",
    "Dr Yuvaraj T",
    "hernia surgery Mumbai",
    "gallbladder surgery",
    "colonoscopy Mumbai",
    "endoscopy specialist",
    "laparoscopic surgery Mumbai",
    "gut health specialist",
    "IBS treatment Mumbai",
    "digestive disorders",
    "gastro doctor Chembur",
    "SRV Hospital gastroenterologist",
    "online gastro consultation",
    "stomach specialist Mumbai",
    "piles treatment Mumbai",
    "fissure treatment",
    "gastric problems doctor"
  ],
  authors: [{ name: "Dr. Yuvaraj T" }],
  creator: "Dr. Yuvaraj T",
  publisher: "CuraGo",
  metadataBase: new URL("https://dryuvaraj.curago.in"),
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
    title: "Dr. Yuvaraj T | Surgical Gastroenterologist - Online & Offline Consult",
    description: "Expert Surgical Gastroenterologist in Mumbai. Specialized in GI surgery, hernia, gallbladder, colonoscopy & gut-brain disorders. Book your consultation today.",
    url: "https://dryuvaraj.curago.in",
    siteName: "Dr. Yuvaraj T - Surgical Gastroenterologist",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Dr. Yuvaraj T - Surgical Gastroenterologist",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Yuvaraj T | Surgical Gastroenterologist Mumbai",
    description: "Expert Surgical Gastroenterologist. Book online or in-clinic consultation for GI surgery, hernia, gallbladder & digestive disorders.",
    images: ["/logo.png"],
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager - Deferred for better performance */}
        <Script id="gtm-init" strategy="lazyOnload">
          {`
            (function() {
              var serverHost = window.location.hostname.includes('.co.in')
                ? 'gtm.curago.co.in'
                : 'gtm.curago.in';
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js',
                server: 'https://' + serverHost
              });

              var gtmScript = document.createElement('script');
              gtmScript.async = true;
              gtmScript.src = 'https://gtm.curago.in/gtm.js?id=GTM-PL6KV3ND';
              document.head.appendChild(gtmScript);
            })();
          `}
        </Script>

              </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://gtm.curago.in/ns.html?id=GTM-PL6KV3ND"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>

        <ModalProvider>
          <Navbar />
          {children}
        </ModalProvider>

        {/* WhatsApp Chatbot Widget */}
        <WyltoChatbot />
      </body>
    </html>
  );
}
