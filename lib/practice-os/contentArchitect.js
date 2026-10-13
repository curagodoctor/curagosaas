/**
 * Practice OS — double AI-run, pass 1: the content architect.
 *
 * Before the article is written, a cheap model designs its UNIQUE structure and
 * angle. The structure is seeded by the doctor's identity, so two doctors writing
 * on the SAME disease in the SAME city get a genuinely different organization —
 * not just reworded sentences. Pass 2 (runMissionAssistant) then writes the full
 * article following this blueprint, grounded in the knowledge base so medical
 * accuracy and quality stay constant regardless of structure.
 *
 * Dormant (returns null → single-run behaviour) when PRACTICE_OS_DOUBLE_RUN=off.
 */

import { recordTextUsage } from '@/lib/practice-os/aiUsage';

const ARCHITECT_MODEL = process.env.OPENAI_ARCHITECT_MODEL || 'gpt-4o-mini';
const DOUBLE_RUN_ENABLED = process.env.PRACTICE_OS_DOUBLE_RUN !== 'off';

export function isDoubleRunEnabled() {
  return DOUBLE_RUN_ENABLED && !!process.env.OPENAI_API_KEY;
}

// Structural archetypes — each is a genuinely different ORGANIZATION of a
// patient-education article, not a reworded version of the same skeleton. The
// doctor's identity picks one, so the same disease lands on different structures
// for different doctors.
const ARCHETYPES = [
  { key: 'patient-journey', brief: 'A narrative following the patient journey in order: first signs → deciding to see a doctor → how the diagnosis is made → the treatment path → recovery and follow-up. Sections map to stages of that journey.' },
  { key: 'questions-led', brief: 'Organized entirely around the real questions patients ask — every heading is a question, answered directly. No generic overview/causes/treatment scaffold.' },
  { key: 'myth-vs-fact', brief: 'Leads with the common myths and misconceptions patients hold, corrects each, then settles into what is actually true and what to do.' },
  { key: 'decision-guide', brief: 'Framed as helping the patient decide: when to worry, when to see a specialist, how to weigh options, what to ask. Decision- and comparison-oriented.' },
  { key: 'red-flags-first', brief: 'Opens with warning signs and when to seek care, then explains what they mean, how the condition is evaluated, and how it is treated.' },
  { key: 'prevention-first', brief: 'Leads with prevention, daily habits and risk reduction, then moves to recognizing the problem and when treatment becomes necessary.' },
  { key: 'deep-dive', brief: 'A thorough explainer: what it is → why it happens → how it is diagnosed → the range of treatments → outlook. Classic depth, each part fully developed.' },
  { key: 'scenario-based', brief: 'Built around typical anonymized scenarios ("a patient who…") used to teach the general point. Never real or identifiable patients.' },
];

// Stable hash → archetype. Seeded by doctorId + topic so the SAME topic yields a
// DIFFERENT structure for different doctors, while one doctor still varies across
// topics. Deterministic (reproducible), so regenerating a day is consistent.
function pickArchetype(seed) {
  const s = String(seed || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ARCHETYPES[(h >>> 0) % ARCHETYPES.length];
}

/**
 * Design the article's structure + angle for this doctor + topic.
 * Returns { archetype, angle, titleIdea, toneNote, sections:[{heading,cover[]}] }
 * or null (→ caller falls back to single-run).
 */
export async function buildBlueprint({ doctorId, topic, specialty = '', city = '', profileContext = '' }) {
  if (!isDoubleRunEnabled()) return null;
  const cleanTopic = String(topic || '').replace(/\{\{.*?\}\}/g, '').trim();
  if (!cleanTopic) return null;

  const archetype = pickArchetype(`${doctorId}::${cleanTopic.toLowerCase()}`);
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: ARCHITECT_MODEL,
      temperature: 0.85, // higher → more distinctive structures
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a content architect for an Indian ${specialty || 'doctor'}'s patient-education article. You do NOT write the article — you design its UNIQUE structure and angle so it does not read like every other article on this topic.

Organize it using THIS structural archetype:
"${archetype.brief}"

Tailor the structure to THIS specific doctor using their profile (subspecialty, unique strength/USP, areas of interest, patient focus, preferred tone). Two different doctors on the same disease must end up with genuinely different outlines.

Rules:
- Design STRUCTURE and ANGLE only. Do NOT assert medical facts or claims — the writer fills accurate content later from a verified knowledge base.
- 5–8 sections. Headings must reflect the chosen archetype (not a generic "Overview / Causes / Symptoms / Treatment" template unless the archetype is deep-dive).
- Patient-friendly and NMC-compliant: no superlatives, no comparative or guaranteed-outcome claims.

Return STRICT JSON:
{
  "angle": "one sentence — the distinctive framing for this doctor",
  "title_idea": "a specific, non-generic working title",
  "sections": [ { "heading": "section heading", "cover": ["2-4 short bullets of what this section should cover"] } ],
  "tone_note": "one line on voice, drawn from the doctor's profile"
}`,
        },
        {
          role: 'user',
          content: `Topic / disease: ${cleanTopic}\nSpecialty: ${specialty || ''}\nCity: ${city || ''}\n\nDoctor profile (their real identity — tailor the structure to this):\n${(profileContext || '').slice(0, 2500) || '(limited profile available)'}`,
        },
      ],
    });

    const u = completion.usage || {};
    recordTextUsage(doctorId, {
      model: ARCHITECT_MODEL,
      promptTokens: u.prompt_tokens || 0, completionTokens: u.completion_tokens || 0, totalTokens: u.total_tokens || 0,
      source: 'content-architect', label: `blueprint:${archetype.key}`,
    }).catch(() => {});

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const sections = Array.isArray(parsed.sections) ? parsed.sections.filter((s) => s && s.heading) : [];
    if (!sections.length) return null;
    return {
      archetype: archetype.key,
      angle: String(parsed.angle || '').trim(),
      titleIdea: String(parsed.title_idea || '').trim(),
      toneNote: String(parsed.tone_note || '').trim(),
      sections: sections.map((s) => ({ heading: String(s.heading).trim(), cover: Array.isArray(s.cover) ? s.cover.map((c) => String(c).trim()).filter(Boolean) : [] })),
      model: ARCHITECT_MODEL,
    };
  } catch (e) {
    console.error('[contentArchitect]', e.message);
    return null;
  }
}

// Render a blueprint into the instruction block injected into pass 2's prompt.
// Empty string when there's no blueprint (→ single-run, nothing added).
export function blueprintToPrompt(bp) {
  if (!bp || !bp.sections?.length) return '';
  const secs = bp.sections.map((s, i) => {
    const cover = s.cover?.length ? `\n     — cover: ${s.cover.join('; ')}` : '';
    return `  ${i + 1}. ${s.heading}${cover}`;
  }).join('\n');
  return [
    'REQUIRED STRUCTURE & ANGLE FOR THIS ARTICLE (highest priority for organization):',
    'This defines how the final article is organized. Where the task instructions below imply a different section layout, use THIS layout for the article body. Still honour the task\'s topic, any required links/CTA, image handling, length and ALL compliance rules.',
    bp.angle ? `Angle: ${bp.angle}` : '',
    bp.titleIdea ? `Working title (adapt, keep the spirit): ${bp.titleIdea}` : '',
    bp.toneNote ? `Voice: ${bp.toneNote}` : '',
    `Write these sections, in this order, each fully developed into several substantial paragraphs:\n${secs}`,
    'The STRUCTURE above is fixed; the MEDICAL CONTENT must be accurate, thorough and grounded in the knowledge base and the doctor\'s profile — never invent facts, studies or figures. Keep it NMC-compliant.',
  ].filter(Boolean).join('\n');
}
