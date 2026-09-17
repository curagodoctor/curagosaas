import { CONTENT_RULES } from '@/lib/practice-os/contentRules';

// Shared website-edit engine. Given the current page sections + a natural-language
// request, the AI PROPOSES edits to existing sections and/or new sections to add.
// Used by both the website-builder chat (site-chat) and the unified assistant.
// Returns { ok, reply, edits, adds, usage }.
const ADD_TYPES = ['custom_text', 'benefits_list', 'faqs', 'cta_button', 'testimonials'];

export async function proposeSiteEdits({ sections = [], message = '', profileFields = {}, history = [] }) {
  if (!process.env.OPENAI_API_KEY) return { ok: false, error: 'AI is not configured.' };

  const brief = (Array.isArray(sections) ? sections : []).slice(0, 40)
    .map((s, i) => ({ index: i, type: s.type, config: s.config || {} }));

  const system = `You are the CuraGo website assistant for an Indian doctor. Their website is built from typed "sections", each with a JSON "config".
Rules:
- When the doctor asks to change something, update EVERY section the request touches. For each affected section return ONLY the config fields that change (a partial patch) using the SAME field names as the current config — do NOT repeat unchanged fields, and do NOT rename or restructure fields.
- To ADD a NEW section (only when the doctor asks for a new block/section that doesn't already exist), return it in an "adds" array. Each add: {"type": one of ["custom_text","benefits_list","faqs","cta_button","testimonials"], "config": object, "after": number (insert AFTER this existing section index; omit to append near the end)}. Config shapes — custom_text: {title, content}; benefits_list: {title, subtitle, items:[{title, description}]}; faqs: {title, faqs:[{question, answer}]}; cta_button: {title, buttonText, buttonLink}; testimonials: {title, testimonials:[{name, text}]}. Never add header, footer, or booking sections.
- If the message is a question or you cannot map it to any section, return empty "edits" and "adds" arrays and just reply.
Return ONLY a JSON object: {"reply": string (1-3 short sentences, plain), "edits": [{"index": number, "config": object}], "adds": [{"type": string, "config": object, "after": number}] }.

${CONTENT_RULES}`;

  const profileLine = Object.entries(profileFields || {})
    .filter(([, v]) => v != null && String(v).trim())
    .slice(0, 30)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
    .join('\n');
  const context = `Doctor profile (use where relevant, don't invent):\n${profileLine || '(none)'}\n\nCurrent website sections:\n${JSON.stringify(brief).slice(0, 12000)}`;
  const historyMsgs = (Array.isArray(history) ? history : []).slice(-8)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }))
    .filter((m) => m.content);

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1600,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: context },
        ...historyMsgs,
        { role: 'user', content: String(message).slice(0, 2000) },
      ],
    });
    const raw = (completion.choices?.[0]?.message?.content || '').trim();
    let data;
    try { data = JSON.parse(raw); } catch { return { ok: false, error: 'Could not understand that — try rephrasing.' }; }

    const rawEdits = Array.isArray(data.edits) ? data.edits : (data.edit ? [data.edit] : []);
    const edits = rawEdits
      .filter((e) => e && typeof e === 'object' && Number.isInteger(e.index) && e.index >= 0 && e.index < brief.length && e.config && typeof e.config === 'object')
      .map((e) => ({ index: e.index, type: brief[e.index].type, config: e.config }));
    const adds = (Array.isArray(data.adds) ? data.adds : [])
      .filter((a) => a && typeof a === 'object' && ADD_TYPES.includes(a.type) && a.config && typeof a.config === 'object')
      .map((a) => ({ type: a.type, config: a.config, after: Number.isInteger(a.after) ? a.after : null }));

    return { ok: true, reply: String(data.reply || '').slice(0, 1200), edits, adds, usage: completion.usage || {} };
  } catch (e) {
    return { ok: false, error: 'The website assistant is unavailable right now.' };
  }
}

// Apply proposed edits + adds to a section array, returning a NEW array.
export function applySiteChanges(sections, edits = [], adds = []) {
  let list = (Array.isArray(sections) ? sections : []).map((s) => ({ ...s, config: { ...(s.config || {}) } }));
  for (const e of edits) {
    if (list[e.index]) list[e.index] = { ...list[e.index], config: { ...(list[e.index].config || {}), ...e.config } };
  }
  for (const a of adds) {
    const section = { type: a.type, visible: true, config: a.config };
    const pos = Number.isInteger(a.after) && a.after >= 0 && a.after < list.length ? a.after + 1 : list.length;
    list.splice(pos, 0, section);
  }
  return list.map((s, i) => ({ ...s, order: i }));
}
