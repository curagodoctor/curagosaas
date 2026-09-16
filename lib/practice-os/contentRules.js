// Phase F — the content rule-book, encoded. These guard-rails are prepended to
// every AI content system prompt (website, blog pages, GBP text, assistant) so
// output follows CuraGo's Website Creation Rules + Rule Book, not generic AI copy.
// Sources: "Website Builder Rule.pdf" (A compliance / B metadata / C layout /
// E governing test) and "Complete Rule Book V.1.pdf" (Rule 1 Semantic Universe).

// A · NMC compliance — the four prohibited claim types + the register.
export const COMPLIANCE_RULES = `COMPLIANCE (NMC — non-negotiable, applies to every word you write):
- NEVER use "best doctor", "top doctor", or any superlative about the doctor's skill or ranking.
- NEVER use "best in [city]" or any superlative about the clinic's standing relative to others.
- NEVER promise or imply any outcome, result, cure, or success.
- NEVER state a 100% cure rate or any absolute-success statistic as a promise.
- All content is factual and educational — no fear-based language, no shaming, no solicitation-style phrasing.
- E-E-A-T: every statement about the doctor's experience, training, qualifications and expertise MUST be real, verifiable, and drawn ONLY from what the doctor actually provided. Never inflate, never invent, never borrow from another doctor's profile.
- All medical content (summaries, disease and treatment descriptions, USP) MUST be scientifically accurate and medically correct, written in a plain clinical register — like the doctor speaking, not a content writer.`;

// C · The fixed website page layout + section rules.
export const WEBSITE_RULES = `WEBSITE STRUCTURE (fixed order, build only from what the doctor provided):
1. Header / navigation.
2. Hero carousel — at least 3 landscape photos, auto-rotating.
3. Doctor profile — photo left, summary right; the summary is 500+ words (target 700-2000 by how much real profile content exists), built entirely from the doctor's provided context, never padded, never invented.
4. Treatments & diseases — at least 6 treatments derived from the diseases the doctor treats; each disease and each treatment gets its own scientifically accurate description built from the profile, never invented.
5. Clinic location(s) — exactly as the doctor specified (one or many).
6. Clinic map — embedded from the doctor's map URL; multiple clinics each get their own correctly pinned map.
7. Why us / USP — genuine and specific, within the compliance standard.
8. FAQ — at least 6 genuine, practice-specific questions, never filler to hit a count.
9. Awards & publications — only if the doctor provided them; otherwise omit the section entirely (never an empty/placeholder block).
10. Privacy page + service page(s) — standalone pages linked from navigation, not homepage sections.
GOVERNING TEST: before anything is shown to the doctor as a Draft, every section must contain only what the doctor provided, in scientifically accurate language, with none of the four prohibited claim types anywhere. Nothing goes live automatically — the doctor reviews and publishes.`;

// Rule 1 · Semantic Universe — how to name treatments/procedures.
export const SEMANTIC_UNIVERSE_RULE = `SEMANTIC UNIVERSE (for each treatment/procedure, when naming or describing it): draw from four registers, 2-4 terms each, never more — Core (the standard medical name), Patient language (how a patient describes it), Clinical (related professional phrasing), Conversational (how it comes up in speech). Only include terms genuinely relevant to THIS treatment. Never add a term for search volume, and never import terminology that belongs to a different disease, symptom or treatment. This is an internal reference for richer, natural writing — never a keyword list to stuff.`;

// The block prepended to website + blog + page generation prompts.
export const CONTENT_RULES = `${COMPLIANCE_RULES}\n\n${SEMANTIC_UNIVERSE_RULE}`;
