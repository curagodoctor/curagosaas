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
- NEVER open with a fear-based or symptom-baiting hook or rhetorical question aimed at the reader's suffering. Forbidden openers include (and anything like them): "Experiencing …?", "Struggling with …?", "Suffering from …?", "Worried about …?", "Tired of …?", "Do you have …?". Open instead with a calm, factual statement about the condition or the procedure (e.g. "Gallstones are hardened deposits that form in the gallbladder…").
- Write in the third person, plain clinical register — like the doctor calmly explaining, NOT ad copy. No hype words ("cutting-edge", "state-of-the-art", "advanced" as a boast), no persuasion, no urgency.
- NEVER output bracketed or template placeholders such as "[clinic's contact details]", "[phone]", "[address]" or "{{…}}". Use ONLY the real details provided below; if a detail is not provided, simply omit it — never leave a placeholder or invent one.
- Refer to the doctor with correct grammar using the exact designation/specialty provided (e.g. "a Surgical Gastroenterologist", not "a Surgical Gastroenterology").
- End with a calm, non-promotional line (e.g. "To know more, consult a specialist." / "Book an appointment to discuss your options.") — never a pushy call to action.
- E-E-A-T: every statement about the doctor's experience, training, qualifications and expertise MUST be real, verifiable, and drawn ONLY from what the doctor actually provided. Never inflate, never invent, never borrow from another doctor's profile.
- All medical content (summaries, disease and treatment descriptions, USP) MUST be scientifically accurate and medically correct, written in a plain clinical register — like the doctor speaking, not a content writer.`;

// C · The fixed website page layout + section rules. Standalone — everything
// needed to build the website is stated here (mirrors the founder's Website
// Creation Rules, sections A–E).
export const WEBSITE_RULES = `WEBSITE CREATION RULES (standalone — build the site entirely from what the doctor provided):

PAGE METADATA (required for every page): Title; Slug; Meta description; Status = Draft (the doctor reviews and publishes — nothing goes live automatically).

PAGE LAYOUT (fixed order):
1. Header / navigation.
2. Hero carousel — a minimum of 3 photographs, landscape format, auto-rotating at a fixed speed.
3. Doctor profile — profile photo left-aligned, summary right-aligned. The summary covers experience, expertise, training and USP, built ENTIRELY from the doctor's provided context (nothing invented). Length: minimum 500 words, targeting 700-2000 depending on how much genuine profile content the doctor actually supplied — length reflects real substance, never padded to hit a number.
4. Treatments & diseases — a minimum of 6 treatments, derived from the diseases the doctor indicated they treat. Each disease gets its own scientifically accurate description; each treatment gets its own description built from the profile — never invented.
5. Clinic location(s) — one or many, exactly as the doctor specified.
6. Clinic map — embedded via iframe from the doctor's map URL; multiple clinics each get their own distinct, correctly pinned map (never one shared map for several clinics).
7. Why us / USP — what distinguishes this doctor's practice; genuine and specific, fully within the compliance standard (no superlatives, no unverifiable claims).
8. FAQ — a minimum of 6 genuine, practice-specific questions, never manufactured filler to hit the count.
9. Awards & publications — included ONLY if the doctor actually provided them; otherwise omit the section entirely (never an empty or placeholder block).
10. Privacy page + service page(s) — required standalone pages linked from navigation, not homepage sections.

REGISTER (worked example) — write disease/treatment descriptions like this: "Gallstones are hardened deposits that form in the gallbladder, often composed of cholesterol or bilirubin… may cause no symptoms, or lead to pain, inflammation, or complications." / "Laparoscopic cholecystectomy is a minimally invasive procedure to remove the gallbladder, performed through a few small incisions… one option when gallstones cause recurring symptoms." Note what is ABSENT: no "best", no guarantee, no cure-rate claim, no promotional language — purely factual, medically accurate.

GOVERNING TEST: before the site is marked ready for the doctor's review, every section must contain ONLY what the doctor provided, in scientifically accurate language, with none of the four prohibited claim types anywhere. If any section fails, it is corrected before the doctor sees the Draft.`;

// D · Blog / article rules — SEO structure + the compliant editorial register.
export const BLOG_RULES = `BLOG / ARTICLE STRUCTURE (patient-education article for the doctor's own site):
- Purpose is EDUCATION and findability, never advertising or soliciting. Write for a patient searching a real question, not for the doctor's ego.
- One clear focus per article (a single condition, procedure, symptom or question). Do not sprawl across unrelated topics.
- Title: plain, specific, question- or topic-led as a patient would search it — no superlatives, no clickbait, no "best".
- Structure: a short intro that states what the article answers, then clearly-headed sections (H2/H3), short scannable paragraphs, and where useful a bullet list or an FAQ block. End with a calm, non-promotional line inviting the reader to consult if relevant (e.g. "If these symptoms persist, consult a specialist").
- Length: comprehensive enough to genuinely answer the question (typically 700-1500 words); never padded to hit a number.
- Medically accurate and current; explain jargon in plain language. Every clinical claim must be scientifically correct.
- E-E-A-T: attribute experience/expertise only to what the doctor actually provided; never invent studies, statistics, success rates, or patient numbers.
- NMC compliance applies to every line: no guaranteed outcomes or cure claims, no comparative/superlative claims about the doctor or clinic, no fear-based or shaming language, no patient solicitation.`;

// E · Profile-generation rules — the source-of-truth guardrails for the fields
// the AI drafts during onboarding (expertise / diseases / procedures / USP).
export const PROFILE_RULES = `PROFILE GENERATION (drafting the doctor's expertise, diseases treated, procedures and USP):
- These become the doctor's source-of-truth profile — accuracy matters more than richness. Draft ONLY from the specialty and details the doctor actually gave.
- Never invent or infer credentials, registration numbers, fellowships, awards, years of experience, prices, or clinic locations.
- Diseases and procedures must be ones genuinely within THIS doctor's stated specialty and scope — never borrow items that belong to a different specialty to pad the list.
- Use correct medical terminology paired with plain patient-facing phrasing; keep each item concise.
- USP must be genuine and specific, within NMC limits — no superlatives, no "best/top", no comparative or guaranteed-outcome claims.
- When unsure whether something applies to this doctor, leave it out rather than guess.`;

// Rule 1 · Semantic Universe — how to name treatments/procedures.
export const SEMANTIC_UNIVERSE_RULE = `SEMANTIC UNIVERSE (for each treatment/procedure, when naming or describing it): draw from four registers, 2-4 terms each, never more — Core (the standard medical name), Patient language (how a patient describes it), Clinical (related professional phrasing), Conversational (how it comes up in speech). Only include terms genuinely relevant to THIS treatment. Never add a term for search volume, and never import terminology that belongs to a different disease, symptom or treatment. This is an internal reference for richer, natural writing — never a keyword list to stuff.`;

// The block prepended to website + blog + page generation prompts.
export const CONTENT_RULES = `${COMPLIANCE_RULES}\n\n${SEMANTIC_UNIVERSE_RULE}`;
