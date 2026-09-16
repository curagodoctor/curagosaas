// §8 / Phase D — the GBP setup task flow, INGESTED from GBP_Setup_Free_Tier.xlsx
// (lib/practice-os/data/gbp-setup-free-tier.json). GUIDANCE only — the doctor
// makes the changes in their own Google account; CuraGo walks them through it
// and flags the risky fields.
//
// Four blocks; the suspension-risk block is mandatory before touching anything.
// Field "kind" drives the inline tag so the doctor knows which fields are
// dangerous BEFORE they type:
//   DO NOT TOUCH — verified fields; changing them can suspend the profile
//   ONE-TIME     — set once, carefully
//   EDITABLE     — safe to edit anytime
//   LEARN        — read-this task
// A platform admin can still override this (stored on PracticeOsSettings.gbpGuide).
import GBP_DATA from './data/gbp-setup-free-tier.json';

const BLOCK_META = {
  suspension: { label: 'Suspension risk', mandatory: true, title: 'Learn account suspension and liability risks', desc: 'Mandatory before you touch a single field — what gets a profile suspended, re-verified, or removed, and what you are liable for as the listing owner.' },
  competitor: { label: 'Competitor analysis', mandatory: false, title: 'Competitor analysis', desc: 'Research what real competing practices in your city and specialty are doing before you make subcategory choices — evidence, not guesswork.' },
  setup: { label: 'Profile setup', mandatory: false, title: 'Profile setup', desc: 'One-time setup, done from the clinic email — never a personal one. The high-risk, locked fields live here.' },
  completion: { label: 'Profile completion', mandatory: false, title: 'Profile completion', desc: 'The editable layer — description, subcategories, attributes and timings. This is where the free foundation ends.' },
};

function blockFor(category, title) {
  const t = String(title || '').toLowerCase();
  if (String(category || '').toLowerCase().includes('risk')) return 'suspension';
  if (t.includes('competitor analysis')) return 'competitor';
  if (String(category || '').toLowerCase().includes('account setup')) return 'setup';
  return 'completion'; // Account Optimization (minus competitor analysis)
}

function kindFor(category, title) {
  const t = String(title || '').toLowerCase();
  if (String(category || '').toLowerCase().includes('risk')) return 'LEARN';
  if (/business name|address|phone number/.test(t)) return 'DO NOT TOUCH';
  if (/primary category|create your gbp|create your google|connect gemini/.test(t)) return 'ONE-TIME';
  return 'EDITABLE';
}

function buildFromData() {
  const groups = { suspension: [], competitor: [], setup: [], completion: [] };
  for (const m of GBP_DATA) {
    const key = blockFor(m.Mission_Category, m.Mission_Title);
    groups[key].push({
      label: m.Mission_Title,
      hint: String(m.Mission_Objective || m.Brief_Description || '').trim().slice(0, 180),
      kind: kindFor(m.Mission_Category, m.Mission_Title),
      // Extra context carried through for the guided view (optional consumers).
      brief: String(m.Brief_Description || '').trim(),
      guide: String(m.Step_By_Step_Guide || '').trim(),
      prompt: String(m.Prompt_output_with_placeholder || '').trim(),
      success: String(m.Success_Message || '').trim(),
      dayNumber: m.Day_Number || '',
    });
  }
  return ['suspension', 'competitor', 'setup', 'completion'].map((key) => ({
    key,
    ...BLOCK_META[key],
    tasks: groups[key].length ? groups[key] : [],
  }));
}

export const DEFAULT_GBP_GUIDE = buildFromData();
