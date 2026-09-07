// Clean line-icon set for site sections (services / "why choose us"), so pages
// use real icons instead of emojis. No external dependency — inline SVG paths
// (Heroicons-style, 24x24, stroke currentColor). Resolves an icon from an explicit
// name, else by keyword-matching the label, else a sensible default.

const ICONS = {
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  stethoscope: 'M6 3v6a4 4 0 008 0V3M8 3H4m4 0h0M16 3h4m-4 0h0M11 17a4 4 0 108 0v-2m0 0a2 2 0 100-4 2 2 0 000 4z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  location: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z',
  award: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

// keyword → icon name (checked against the item label + any legacy icon value)
const KEYWORDS = [
  [/book|appoint|slot|schedul/i, 'calendar'],
  [/whatsapp|chat|message|support|reach|contact/i, 'chat'],
  [/consult|diagnos|treatment plan|personal|tailored|evaluat/i, 'stethoscope'],
  [/surg|procedure|endoscop|operat|advanced tech/i, 'shield'],
  [/experience|years|expert|gold|medal|award|trusted|qualif/i, 'award'],
  [/compassion|patient-cent|care|gentle|comfort|empath/i, 'heart'],
  [/location|clinic|address|near|map|direction/i, 'location'],
  [/phone|call/i, 'phone'],
  [/time|hour|quick|fast|wait|prompt/i, 'clock'],
  [/doctor|specialist|physician|surgeon/i, 'user'],
  [/family|team|staff/i, 'users'],
  [/report|record|document|prescription/i, 'document'],
];

function resolveIcon(name, label) {
  const n = String(name || '').trim().toLowerCase();
  if (ICONS[n]) return n;
  const hay = `${name || ''} ${label || ''}`;
  for (const [re, icon] of KEYWORDS) if (re.test(hay)) return icon;
  return 'check';
}

export default function SectionIcon({ name, label = '', className = 'w-6 h-6' }) {
  const path = ICONS[resolveIcon(name, label)] || ICONS.check;
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      {path.split(' M').map((seg, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
