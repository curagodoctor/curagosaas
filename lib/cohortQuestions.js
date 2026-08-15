// Zero to Practice Builder — Conditional Fit Assessment.
// Questions + the flag-based decision engine from the founder's spec.
//
// Three results:
//   strong_fit  (green)  — no hard flags + positive signals
//   maybe       (yellow) — no hard flags but 1+ maybe flags → Founder Review
//   not_fit     (red)    — one or more hard flags → not the best cohort fit right now
// We NEVER stop the form early; the result is computed after all relevant answers.

// Each question: { id, section, title, help, type, options, multi, max, showIf }.
// type: 'text' | 'email' | 'tel' | 'single' | 'multi' | 'scale' | 'longtext'
export const QUESTIONS = [
  // ── Section 1 — Basic information (no qualification logic) ──
  { id: 'name', section: 'About you', title: 'Your name', type: 'text', required: true },
  { id: 'phone', section: 'About you', title: 'WhatsApp phone number', help: 'So we can reach out to onboard you.', type: 'tel', required: true },
  { id: 'email', section: 'About you', title: 'Email ID', type: 'email', required: true },
  { id: 'specialty', section: 'About you', title: 'Your specialty', type: 'text', required: true },
  { id: 'city', section: 'About you', title: 'City', type: 'text', required: true },
  { id: 'years', section: 'About you', title: 'How many years since your last degree?', help: 'Years since your last postgraduate / superspecialty / relevant final degree — not years of practice.', type: 'single',
    options: opts(['<1 year', '1–3 years', '3–5 years', '5–10 years', '10–15 years', '15+ years']) },
  { id: 'practice', section: 'About you', title: 'What best describes your current practice?', help: 'Select all that apply.', type: 'multi',
    options: opts(['I have my own clinic / chamber', 'I work as a freelancer / visiting consultant', 'I primarily work in a corporate hospital', 'I primarily work in a medical / private medical college', 'I have a clinic + hospital practice', 'I am preparing to start / build my independent practice', 'Other']) },

  // ── Section 2 — The most important qualifier: execution ──
  { id: 'q8', section: 'Execution', title: 'Do you want to learn and execute the practice-building work yourself?', type: 'single', options: yesno() },
  { id: 'q8a', section: 'Execution', title: 'Do you have someone who can consistently execute the work on your behalf?', type: 'single', options: yesno(), showIf: (a) => a.q8 === 'no' },

  // ── Section 3 — Current practice / clinic ──
  { id: 'q9', section: 'Your clinic', title: 'Do you currently have a clinic or established practice location?', type: 'single', options: yesno() },
  { id: 'q9a', section: 'Your clinic', title: 'Is that location likely to remain your practice location for the foreseeable future?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'notsure', label: 'No / not sure' }], showIf: (a) => a.q9 === 'yes' },
  { id: 'q9b', section: 'Your clinic', title: 'Are you planning to establish your clinic / practice within the next 3 months?', type: 'single', options: yesno(), showIf: (a) => a.q9 === 'no' },
  { id: 'q9c', section: 'Your clinic', title: 'Are you likely to finalise the location within the next 10 days?', type: 'single', options: yesno(), showIf: (a) => a.q9 === 'no' && a.q9b === 'yes' },

  // ── Section 4 — Hospital-based practice ──
  { id: 'q10', section: 'Your clinic', title: 'Are you building your independent practice around a hospital address where you currently work?', type: 'single', options: yesno() },
  { id: 'q10a', section: 'Your clinic', title: 'Do you understand that changing hospitals or addresses later can create complications for your digital presence, Google Business Profile, website and local visibility?', type: 'single', options: yesno(), showIf: (a) => a.q10 === 'yes' },

  // ── Section 5 — Website ──
  { id: 'q11', section: 'Website', title: 'Do you currently have a professional website?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' }] },
  { id: 'q11build', section: 'Website', title: 'Are you willing to build a professional website as part of your practice-building process?', type: 'single', options: yesno(), showIf: (a) => a.q11 === 'no' },
  { id: 'q11maint', section: 'Website', title: 'Is your website currently being actively maintained?', type: 'single',
    options: opts(['Yes — I/we manage it ourselves', 'Yes — an agency manages it', 'Yes — someone else manages it', 'No — it is basically static', "I don't know"]), showIf: (a) => a.q11 === 'yes' },
  { id: 'q12', section: 'Website', title: 'Is SEO currently being done on the website?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: "I don't know" }], showIf: (a) => a.q11 === 'yes' },
  { id: 'q12a', section: 'Website', title: 'Are you willing to add additional useful content to the existing SEO / content workflow?', type: 'single', options: yesno(), showIf: (a) => a.q11 === 'yes' && a.q12 === 'yes' },
  { id: 'q12b', section: 'Website', title: 'Are you willing to start building useful, search-oriented content for your website?', type: 'single', options: yesno(), showIf: (a) => a.q11 === 'yes' && (a.q12 === 'no' || a.q12 === 'unsure') },

  // ── Section 6 — Social media ──
  { id: 'q13', section: 'Social media', title: 'What best describes your social media presence?', type: 'single',
    options: [
      { value: 'none', label: "I don't have meaningful professional accounts yet" },
      { value: 'self', label: 'I manage my social media myself' },
      { value: 'team', label: 'My team manages it' },
      { value: 'agency', label: 'An agency manages it' },
      { value: 'rare', label: 'I have accounts but rarely post' },
      { value: 'consistent', label: 'I post consistently' },
    ] },
  { id: 'q13a', section: 'Social media', title: 'Are you willing to create and/or approve the clinical content required to build your presence?', type: 'single', options: yesno(), showIf: (a) => a.q13 === 'none' || a.q13 === 'rare' },
  { id: 'q13b', section: 'Social media', title: 'Are you willing to create additional content consistently during the 28-day Builder?', type: 'single', options: yesno(), showIf: (a) => a.q13 === 'self' || a.q13 === 'team' || a.q13 === 'consistent' },
  { id: 'q13c', section: 'Social media', title: 'Are you willing to add useful additional content into your existing agency workflow?', type: 'single', options: yesno(), showIf: (a) => a.q13 === 'agency' },

  // ── Section 7 — Google Business Profile ──
  { id: 'q14', section: 'Google', title: 'Do you currently have a Google Business Profile?', type: 'single', options: yesno() },
  { id: 'q14a', section: 'Google', title: 'Is it verified and actively managed?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: "I don't know" }], showIf: (a) => a.q14 === 'yes' },
  { id: 'q14b', section: 'Google', title: 'Are you willing to create and properly build your Google Business Profile?', type: 'single', options: yesno(), showIf: (a) => a.q14 === 'no' },

  // ── Section 8 — Reviews (opportunity, never a disqualifier) ──
  { id: 'q15', section: 'Reviews', title: 'Do you currently have a system for consistently generating legitimate patient reviews?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: "I don't know" }] },

  // ── Section 9 — Execution capacity (strongest filter) ──
  { id: 'q16', section: 'Time', title: 'How much time can you realistically dedicate to building your practice each day?', type: 'single',
    options: [{ value: 'lt30', label: 'Less than 30 minutes' }, { value: '30-60', label: '30–60 minutes' }, { value: '1-2h', label: '1–2 hours' }, { value: 'gt2h', label: 'More than 2 hours' }] },

  // ── Section 10 — Days per week ──
  { id: 'q17', section: 'Time', title: 'How many days per week can you realistically work on this?', type: 'single',
    options: [{ value: '2-3', label: '2–3 days' }, { value: '4', label: '4 days' }, { value: '5', label: '5 days' }, { value: '6', label: '6 days' }, { value: '7', label: 'Every day' }] },

  // ── Section 11 — Commitment ──
  { id: 'q18', section: 'Commitment', title: 'How committed are you to completing the 28-day Builder?', help: '1 = not at all, 10 = completely committed.', type: 'scale', min: 1, max: 10 },

  // ── Section 12 — Priority ──
  { id: 'q19', section: 'Priority', title: 'How important is building your independent practice to you right now?', type: 'single',
    options: [
      { value: 'A', label: 'It is one of my highest priorities right now' },
      { value: 'B', label: 'It is a high priority, but I have competing priorities' },
      { value: 'C', label: "I am interested, but it isn't a major priority yet" },
      { value: 'D', label: 'I am mainly exploring the idea' },
      { value: 'E', label: "It isn't really a priority right now" },
    ] },

  // ── Section 13 — Current knowledge (diagnostic, no flags) ──
  { id: 'q20', section: 'Where you are', title: 'Which statement best describes you today?', type: 'single',
    options: opts(["I know what to do, but I don't execute consistently.", "I know a little, but I'm overwhelmed by too many options.", 'I have no idea where to start.', "I've tried courses / agencies, but nothing has worked consistently.", "I haven't seriously started building my practice yet."]) },

  // ── Section 14 — Learning style ──
  { id: 'q21', section: 'Where you are', title: 'Which approach describes you best?', type: 'single',
    options: [
      { value: 'structured', label: 'I prefer structured daily guidance and simply execute.' },
      { value: 'lectures', label: 'I like watching lectures first, then implementing.' },
      { value: 'reading', label: 'I prefer reading and learning on my own.' },
      { value: 'doing', label: 'I learn best by doing.' },
      { value: 'outsource', label: 'I prefer outsourcing everything.' },
      { value: 'unsure', label: "I'm still figuring out my learning style." },
    ] },

  // ── Section 15 — Learning support (personalisation, no flags) ──
  { id: 'q22', section: 'Where you are', title: 'When learning something technical, what helps you most?', help: 'Choose up to two.', type: 'multi', max: 2,
    options: opts(['Video walkthroughs', 'Step-by-step written instructions', 'Live sessions', 'AI assistance', 'Templates', 'Doing it myself with guidance']) },

  // ── Section 16 — Current challenges (problem statements, no flags) ──
  { id: 'q23', section: 'Your goals', title: 'Which challenges are currently stopping you from building your practice?', help: 'Select all that apply.', type: 'multi',
    options: opts(["Patients don't know I exist", "I don't know where to begin", "I don't have enough time", "I don't know digital marketing", 'Website', 'Google Business Profile', 'Social media', 'Reviews', 'Decision fatigue', 'Lack of consistency', 'No accountability', 'Fear of doing the wrong thing', "I don't know what actually works", 'Difficulty creating content', 'Difficulty attracting patients']) },

  // ── Section 17 — Desired outcome (no flags) ──
  { id: 'q24', section: 'Your goals', title: 'If someone completely solved your practice-building problem, what would you want that solution to help you achieve?', help: 'Select all that apply.', type: 'multi',
    options: opts(['More patient awareness', 'Better Google visibility', 'Better online credibility', 'Professional website', 'Complete Google Business Profile', 'Learn AI for practice building', 'Build consistent content', 'Save time', 'Remove decision fatigue', 'Step-by-step guidance', 'Accountability', 'Automation', 'Long-term growth']) },

  // ── Section 18 / 19 — Goals (long answers, no flags) ──
  { id: 'q25', section: 'Your goals', title: 'Where would you like your practice to be in the next 3 months?', type: 'longtext' },
  { id: 'q26', section: 'Your goals', title: 'What would make this Builder feel like a huge success for you?', type: 'longtext' },

  // ── Section 20 — Benefit belief ──
  { id: 'q27', section: 'Your goals', title: 'Do you think you would genuinely benefit from working through this Builder?', type: 'single', options: [{ value: 'yes', label: 'Yes' }, { value: 'maybe', label: 'Maybe' }, { value: 'no', label: 'No' }] },

  // ── Section 21 — Infrastructure readiness (no hard disqualifiers) ──
  { id: 'q28', section: 'Readiness', title: 'Are you ready to buy a domain if required?', type: 'single', options: opts(['Yes', 'No', 'Already have one', 'Not sure']) },
];

// Small helpers to build option lists.
function opts(labels) { return labels.map((label) => ({ value: label, label })); }
function yesno() { return [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]; }

// Which questions are currently visible given the answers so far.
export function visibleQuestions(answers) {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/**
 * The decision engine. Returns { result, reason, flags:{hard,maybe,positive} }.
 * result ∈ 'strong_fit' | 'maybe' | 'not_fit'.
 */
export function evaluateFit(a) {
  const hard = [];
  const maybe = [];
  const positive = [];

  // Execution
  if (a.q8 === 'yes') positive.push('Wants to learn and execute the work');
  if (a.q8 === 'no' && a.q8a === 'yes') positive.push('Has someone who can execute');
  if (a.q8 === 'no' && a.q8a === 'no') hard.push("Doesn't want to execute and has nobody to execute on their behalf");

  // Clinic / location
  if (a.q9 === 'yes' && a.q9a === 'yes') positive.push('Has an established clinic location');
  if (a.q9 === 'yes' && a.q9a === 'notsure') maybe.push('Practice location may change');
  if (a.q9 === 'no' && a.q9b === 'yes' && a.q9c === 'yes') positive.push('Finalising a clinic location within ~10 days');
  if (a.q9 === 'no' && a.q9b === 'yes' && a.q9c === 'no') maybe.push('Clinic location not yet finalised');
  if (a.q9 === 'no' && a.q9b === 'no') maybe.push('No clinic and not planning one soon');

  // Hospital-based
  if (a.q10 === 'yes' && a.q10a === 'no') maybe.push('Hospital-based practice with location uncertainty');

  // Website
  if (a.q11 === 'no' && a.q11build === 'yes') positive.push('Willing to build a website');
  if (a.q11 === 'no' && a.q11build === 'no') hard.push("Doesn't want to build a website — a foundational asset");
  if (a.q11 === 'unsure') maybe.push('Unsure about the website');
  if (a.q12a === 'yes') positive.push('Willing to add content to an existing SEO workflow');
  if (a.q12a === 'no') hard.push('Has active SEO/content but refuses to add anything');
  if (a.q12b === 'yes') positive.push('Willing to start building search-oriented content');
  if (a.q12b === 'no') maybe.push('Not sure about building website content');

  // Social
  if (a.q13a === 'yes' || a.q13b === 'yes' || a.q13c === 'yes') positive.push('Willing to create/approve content');
  if (a.q13a === 'no') hard.push("Won't create or approve the clinical content needed");
  if (a.q13b === 'no') hard.push("Won't create additional content during the Builder");
  if (a.q13c === 'no') hard.push("Has an agency and won't add anything to its workflow");

  // Google Business Profile
  if (a.q14 === 'yes') positive.push('Has a Google Business Profile');
  if (a.q14 === 'no' && a.q14b === 'yes') positive.push('Willing to build a Google Business Profile');
  if (a.q14 === 'no' && a.q14b === 'no') maybe.push("Not willing to build a Google Business Profile yet");

  // Reviews — opportunity only, never penalised.
  if (a.q15 === 'yes') positive.push('Has a review-generation system');

  // Time per day (strongest filter)
  if (a.q16 === 'lt30') hard.push('Less than 30 minutes a day to build the practice');
  if (a.q16 === '30-60') maybe.push('30–60 minutes a day');
  if (a.q16 === '1-2h' || a.q16 === 'gt2h') positive.push('An hour or more a day to build');

  // Days per week
  if (a.q17 === '2-3') hard.push('Only 2–3 days a week available');
  if (a.q17 === '4') maybe.push('4 days a week available');
  if (a.q17 === '5' || a.q17 === '6' || a.q17 === '7') positive.push('5+ days a week available');

  // Commitment (1–10)
  const commit = Number(a.q18) || 0;
  if (commit >= 1 && commit <= 4) hard.push('Low commitment to completing the 28-day Builder');
  else if (commit >= 5 && commit <= 7) maybe.push('Moderate commitment');
  else if (commit >= 8) positive.push('High commitment (8–10)');

  // Priority
  if (a.q19 === 'A' || a.q19 === 'B') positive.push('Building the practice is a high priority right now');
  if (a.q19 === 'C' || a.q19 === 'D') maybe.push("Practice building isn't a major priority yet");
  if (a.q19 === 'E') hard.push("Practice building isn't a priority right now");

  // Learning style — outsource everything, combined with execution capacity
  if (a.q21 === 'outsource') {
    const hasExecutor = a.q8 === 'yes' || a.q8a === 'yes';
    if (hasExecutor) maybe.push('Prefers to outsource everything (but has an executor)');
    else hard.push('Prefers to outsource everything with nobody to execute');
  }

  // Benefit belief
  if (a.q27 === 'yes') positive.push('Believes they would benefit from the Builder');
  if (a.q27 === 'maybe') maybe.push("Unsure whether they'd benefit");
  if (a.q27 === 'no') hard.push("Doesn't think they would benefit");

  // Dedupe.
  const uniq = (arr) => [...new Set(arr)];
  const H = uniq(hard), M = uniq(maybe), P = uniq(positive);

  let result, reason;
  if (H.length >= 1) {
    result = 'not_fit';
    reason = H[0] + (H.length > 1 ? ` (and ${H.length - 1} more)` : '') + '.';
  } else if (M.length >= 1) {
    result = 'maybe';
    reason = M[0] + (M.length > 1 ? ` (and ${M.length - 1} more)` : '') + '.';
  } else {
    result = 'strong_fit';
    reason = P.length ? `You show strong signals: ${P.slice(0, 3).join('; ')}.` : 'You appear ready to execute.';
  }

  return { result, reason, flags: { hard: H, maybe: M, positive: P } };
}
