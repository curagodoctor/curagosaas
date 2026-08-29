import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

// Default metadata - will be overridden by page-specific or layout-specific metadata
export const metadata = {
  title: {
    default: "CuraGo - Digital Practice Platform for Doctors",
    template: "%s | CuraGo",
  },
  description: "Build your medical practice online with CuraGo. Professional website, booking system, and growth tools for doctors.",
  keywords: [
    "doctor website",
    "medical practice",
    "clinic booking",
    "healthcare platform",
  ],
  authors: [{ name: "CuraGo" }],
  creator: "CuraGo",
  publisher: "CuraGo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://curago.in"),
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
    title: "CuraGo - Digital Practice Platform for Doctors",
    description: "Build your medical practice online with CuraGo. Professional website, booking system, and growth tools for doctors.",
    siteName: "CuraGo",
    images: [
      {
        url: "/og-preview.jpg",
        width: 1200,
        height: 630,
        alt: "CuraGo - Build Your Digital Clinic",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CuraGo - Digital Practice Platform for Doctors",
    description: "Build your medical practice online with CuraGo.",
    images: ["/og-preview.jpg"],
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

        {/* Meta Pixel — CuraGo company pixel, loads on every page */}
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
            fbq('init', '833058805840230');
            fbq('track', 'PageView');
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

        {/* Meta Pixel (noscript) */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=833058805840230&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <ModalProvider>
          {children}
        </ModalProvider>

        {/* WhatsApp Chatbot Widget */}
        <WyltoChatbot />
      </body>
    </html>
  );
}
