'use client';

import { usePathname } from 'next/navigation';

// Company WhatsApp number for the floating contact button.
const WHATSAPP_NUMBER = '917021227203';
const PREFILL = 'Hi, I have a question about CuraGo.';

// Only show on PUBLIC marketing pages. Skip internal dashboards, doctors' own
// patient sites, and — per request — the pack and mission (focus) pages.
const HIDDEN_PREFIXES = [
  '/admin',
  '/app',
  '/platform-admin',
  '/clinic-manager',
  '/seo',
  '/site',
  '/packs', // pack catalogue + pack detail pages
];

function showOn(path) {
  if (!path) return false;
  return !HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (!showOn(pathname)) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILL)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 2147483000,
        width: '56px',
        height: '56px',
        borderRadius: '9999px',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="#fff" aria-hidden="true">
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.59 4.462 1.71 6.406L3.2 28.8l6.57-1.72a12.74 12.74 0 0 0 6.234 1.588h.005c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.332-6.635-3.75-9.053A12.72 12.72 0 0 0 16.004 3.2Zm0 23.05h-.004a10.6 10.6 0 0 1-5.4-1.48l-.387-.23-4.028 1.055 1.075-3.926-.252-.403a10.56 10.56 0 0 1-1.62-5.66c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.108 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.86-4.77 10.63-10.63 10.63Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.106-.5-.16-.71.16-.21.32-.816 1.04-1 1.253-.184.213-.368.24-.688.08-.32-.16-1.35-.497-2.57-1.585-.95-.847-1.59-1.893-1.776-2.213-.184-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.106-.213.053-.4-.027-.56-.08-.16-.71-1.713-.973-2.346-.256-.613-.516-.53-.71-.54l-.606-.01c-.21 0-.553.08-.843.4-.29.32-1.106 1.08-1.106 2.633 0 1.553 1.132 3.053 1.29 3.266.16.213 2.23 3.4 5.4 4.766.755.326 1.344.52 1.803.667.758.24 1.448.206 1.994.125.608-.09 1.89-.773 2.156-1.52.266-.746.266-1.386.186-1.52-.08-.133-.29-.213-.61-.373Z" />
      </svg>
    </a>
  );
}
