'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// One floating action button that fans out into Assistant / Notes / Profile.
// Tapping the FAB opens the fan; tapping outside collapses it. Replaces the three
// separate floating buttons. The Assistant action is hidden on pages that already
// have their own AI chat (the daily task, the AI builder, etc.).
const CHAT_PAGES = [
  '/app/zero-to-practice-builder/day',
  '/app/zero-to-practice-builder/content',
  '/app/zero-to-practice-builder/focus',
  '/app/zero-to-practice-builder/clusters',
  '/admin/dashboard/ai-generate',
];
const HIDE_PAGES = ['/app/zero-to-practice-builder/onboard'];

const ICONS = {
  assistant: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4-.83L3 20l1.17-3.5A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  notes: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

export default function FloatingFab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || '';
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); };
  }, []);

  if (HIDE_PAGES.some((p) => pathname.startsWith(p))) return null;
  const onChatPage = CHAT_PAGES.some((p) => pathname.startsWith(p));

  const actions = [
    !onChatPage && { key: 'assistant', label: 'Assistant', icon: ICONS.assistant, run: () => window.dispatchEvent(new Event('pos:open-assistant')) },
    { key: 'notes', label: 'Notes', icon: ICONS.notes, run: () => window.dispatchEvent(new Event('pos:open-notes')) },
    { key: 'profile', label: 'Profile', icon: ICONS.profile, run: () => router.push('/app/zero-to-practice-builder/profile') },
  ].filter(Boolean);

  return (
    <div ref={ref} className="fixed z-[70] bottom-5 right-5 flex flex-col items-end gap-2.5">
      {open && actions.map((a, i) => (
        <button
          key={a.key}
          onClick={() => { setOpen(false); a.run(); }}
          className="flex items-center gap-2 rounded-full shadow-lg pl-3.5 pr-4 py-2.5 text-[14px] font-semibold text-white"
          style={{ background: 'var(--green, #096B17)', animation: `posFanIn .18s ease both`, animationDelay: `${(actions.length - 1 - i) * 40}ms` }}
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
          {a.label}
        </button>
      ))}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="w-14 h-14 rounded-full shadow-xl grid place-items-center overflow-hidden"
        style={open
          ? { background: 'var(--orange, #F26A1B)', color: '#fff' }
          : { background: '#fff', border: '1px solid var(--rule, #DDE4D9)' }}
      >
        {open
          ? <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" /></svg>
          : <img src="/fab-icon.png" alt="" className="w-8 h-8 object-contain" />}
      </button>
      <style>{`@keyframes posFanIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
