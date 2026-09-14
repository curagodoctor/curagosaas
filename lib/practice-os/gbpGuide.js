// §8 — the GBP setup task flow. GUIDANCE only (the doctor makes changes in their
// own Google account; CuraGo walks them through it and flags the risky fields).
// Four blocks; the suspension-risk block is mandatory before touching anything.
// Field "kind" drives the inline tag so the doctor knows which fields are
// dangerous BEFORE they type:
//   DO NOT TOUCH — verified fields; changing them can suspend the profile
//   ONE-TIME     — set once, carefully
//   EDITABLE     — safe to edit anytime
//   LEARN        — read-this task
// This is the built-in default; a platform admin can override it (stored on
// PracticeOsSettings.gbpGuide).
export const DEFAULT_GBP_GUIDE = [
  {
    key: 'suspension', label: 'Suspension risk', mandatory: true,
    title: 'Learn account suspension and liability risks',
    desc: 'Mandatory before you touch a single field — what gets a profile suspended, and what you are liable for.',
    tasks: [
      { label: 'What triggers a suspension', hint: 'Name stuffing, wrong category, address mismatch', kind: 'LEARN' },
      { label: 'Reinstatement is slow', hint: 'Why prevention beats appeal', kind: 'LEARN' },
      { label: 'Your liability as the listing owner', hint: 'Claims, reviews and medical advertising rules', kind: 'LEARN' },
      { label: 'Fields you must never touch again', hint: 'One-time setup fields are marked in every task', kind: 'DO NOT TOUCH' },
    ],
  },
  {
    key: 'competitor', label: 'Competitor analysis', mandatory: false,
    title: 'Competitor analysis',
    desc: 'Who currently ranks for your specialty in your city, and what they have that you do not.',
    tasks: [
      { label: 'Top five profiles for your specialty', hint: 'Same city, same category', kind: 'EDITABLE' },
      { label: 'Their categories and subcategories', hint: 'Note what they claim', kind: 'EDITABLE' },
      { label: 'Their post and photo cadence', hint: 'Frequency beats volume', kind: 'EDITABLE' },
      { label: 'Review count and velocity', hint: 'Your realistic gap', kind: 'EDITABLE' },
    ],
  },
  {
    key: 'setup', label: 'Profile setup', mandatory: false,
    title: 'Profile setup',
    desc: 'One-time setup, done from the clinic email — never a personal one.',
    tasks: [
      { label: 'Go to your GBP account', hint: 'From the clinic email address', kind: 'ONE-TIME' },
      { label: 'Add the clinic name', hint: 'Exactly as it appears on signage', kind: 'DO NOT TOUCH' },
      { label: 'Add the phone numbers', hint: 'Appointment lines only', kind: 'EDITABLE' },
      { label: 'Add the full address', hint: 'Complete, matching your signage', kind: 'DO NOT TOUCH' },
      { label: 'Add the category', hint: 'One primary category, chosen carefully', kind: 'ONE-TIME' },
      { label: 'Add the website URL', hint: 'Your CuraGo site or custom domain', kind: 'EDITABLE' },
    ],
  },
  {
    key: 'completion', label: 'Profile completion', mandatory: false,
    title: 'Profile completion',
    desc: 'The editable layer — this is where the free foundation ends.',
    tasks: [
      { label: 'Description', hint: 'Written from your approved profile', kind: 'EDITABLE' },
      { label: 'Subcategories', hint: 'Guidance only — you decide what applies', kind: 'EDITABLE' },
      { label: 'WhatsApp number', hint: 'Appointment number, not personal', kind: 'EDITABLE' },
      { label: 'Attributes', hint: 'What patients can expect at your clinic', kind: 'EDITABLE' },
    ],
  },
];
