/**
 * Practice OS — Mission AI assistant.
 *
 * Each mission carries its own AI context (Mission.aiContext.systemPrompt). The
 * assistant is deliberately scoped to the current mission and kept NMC-compliant
 * (drafting/formatting help only — no advertising claims, no medical/legal
 * advice). See PRD §8 and CLAUDE.md §10.
 */

import { getMasterSop } from '@/lib/practice-os/sops';
import { getKnowledgeContext } from '@/lib/practice-os/knowledge';
import { fillPlaceholders } from '@/lib/practice-os/template';

// OpenAI (ChatGPT). Override per-mission via aiContext.model or globally via OPENAI_MODEL.
// Default is gpt-4o-mini: for drafting/formatting it is near-4o quality at a
// fraction of the cost (economical). Set OPENAI_MODEL=gpt-4o to force full 4o.
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// Token/cost control — cap what goes in and what comes out.
const MAX_PROMPT_CHARS = 2000;   // input: user prompt is trimmed to this
// Output ceiling. 700 was too low and cut answers off mid-sentence; 1500 lets a
// full draft finish. Overridable via OPENAI_MAX_OUTPUT_TOKENS.
const MAX_OUTPUT_TOKENS = Math.max(256, Number(process.env.OPENAI_MAX_OUTPUT_TOKENS) || 1500);
// Lower temperature = tighter, more consistent, less rambling drafts (also a touch
// cheaper). Overridable via OPENAI_TEMPERATURE.
const TEMPERATURE = process.env.OPENAI_TEMPERATURE != null ? Number(process.env.OPENAI_TEMPERATURE) : 0.5;

const GUARDRAILS = `You are the CuraGo Practice OS assistant. You help an Indian doctor complete the single mission described below — nothing else. Politely decline anything outside this mission's scope.

Rules you must follow:
- Stay strictly on this mission. Do not answer unrelated questions.
- Help with drafting and formatting only. Do not give medical, legal, or regulatory advice.
- Keep everything compliant with Indian NMC advertising norms: no superlatives, no comparative or guaranteed-outcome claims, no soliciting patients. The goal is being findable, not advertising.
- Be concise, practical, and ready to paste. Prefer plain, professional language.
- Always finish your answer completely — never stop mid-sentence or mid-list. If a full answer would be long, prioritise the most important parts and deliver them fully rather than starting something you cannot finish within a short reply.
- Use light Markdown (headings, short bullet lists, bold) so the answer is easy to scan.`;

function buildSystemPrompt(authoredPrompt, mission, profileContext, profileFields = {}, module = null, knowledge = '') {
  // The module's own drafting brief (the "ready-to-copy" prompt shown to the
  // doctor) — give it to the assistant too so it produces exactly that deliverable.
  const moduleTask = fillPlaceholders(module?.aiPrompt, profileFields).trim();
  const context = [
    mission?.category ? `Mission category: ${mission.category}` : '',
    mission?.missionText ? `Today's mission: ${mission.missionText}` : '',
    mission?.purpose ? `Why it matters: ${mission.purpose}` : '',
    module?.title ? `\nThe doctor is currently working on module: ${module.title}` : '',
    module?.expectedOutcome ? `Module outcome: ${module.expectedOutcome}` : '',
    Array.isArray(module?.steps) && module.steps.length ? `Module steps:\n- ${module.steps.join('\n- ')}` : '',
    moduleTask ? `\nThe drafting task for this module (produce this when asked):\n${moduleTask}` : '',
  ].filter(Boolean).join('\n');

  const authored = fillPlaceholders(authoredPrompt, profileFields).trim();
  const profile = (profileContext || '').trim();
  // The confidential master SOP layer comes FIRST (highest authority); the
  // author-provided per-mission prompt comes last and cannot override it.
  const kb = (knowledge || '').trim();
  return [
    getMasterSop(),
    GUARDRAILS,
    kb && `\n--- Knowledge base (reference material; use it, never quote these headers) ---\n${kb}`,
    profile && `\n--- Doctor profile (knowledge base) ---\n${profile}`,
    context && `\n--- This mission ---\n${context}`,
    authored && `\n--- Additional mission instructions (author-provided) ---\n${authored}`,
  ].filter(Boolean).join('\n');
}

export function isAiConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

// When a reply is cut off at the token ceiling, trim back to the last complete
// sentence or list item so it reads as finished rather than stopping mid-word.
function tidyTruncated(text) {
  const cutAt = Math.max(
    text.lastIndexOf('. '), text.lastIndexOf('.\n'),
    text.lastIndexOf('!'), text.lastIndexOf('?'),
    text.lastIndexOf('\n'),
  );
  // Only trim if it keeps most of the answer (don't nuke a short reply).
  const trimmed = cutAt > text.length * 0.5 ? text.slice(0, cutAt + 1).trim() : text.trim();
  return trimmed;
}

/**
 * Run the assistant for one mission turn.
 * @returns {Promise<{ success: boolean, text?: string, error?: string }>}
 */
export async function runMissionAssistant({ mission, module = null, userPrompt, profileContext, profileFields = {}, history = [] }) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'AI is not configured. Set OPENAI_API_KEY in the environment.' };
  }
  // Input control: trim the prompt (profile context is already capped in profile.js).
  const prompt = (userPrompt || '').trim().slice(0, MAX_PROMPT_CHARS);
  if (!prompt) return { success: false, error: 'Empty prompt.' };

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const authoredPrompt = module?.aiSystemPrompt || mission?.aiContext?.systemPrompt;
    const knowledge = await getKnowledgeContext(mission?.frameworkId, prompt);
    const system = buildSystemPrompt(authoredPrompt, mission, profileContext, profileFields, module, knowledge);
    const model = mission?.aiContext?.model || DEFAULT_MODEL;

    // Multi-turn context: keep the last ~10 messages, each trimmed. Output stays capped.
    const historyMsgs = (history || [])
      .slice(-10)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, MAX_PROMPT_CHARS) }))
      .filter((m) => m.content);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,   // output control
      temperature: TEMPERATURE,
      messages: [
        { role: 'system', content: system },
        ...historyMsgs,
        { role: 'user', content: prompt },
      ],
    });

    const choice = completion.choices?.[0];
    let text = (choice?.message?.content || '').trim();
    if (!text) return { success: false, error: 'The assistant returned an empty response.' };
    // If the model hit the token ceiling, tidy the tail so it doesn't end
    // mid-sentence — trim back to the last complete sentence/list item.
    if (choice?.finish_reason === 'length') text = tidyTruncated(text);
    const u = completion.usage || {};
    return {
      success: true,
      text,
      prompt,
      usage: {
        promptTokens: u.prompt_tokens || 0,
        completionTokens: u.completion_tokens || 0,
        totalTokens: u.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[Practice OS AI]', error.message);
    return { success: false, error: 'The assistant is unavailable right now. Please try again.' };
  }
}

// Structure free-form assistant text (or a doctor's profile) into a JSON object
// for a one-click platform action. `instruction` describes the shape wanted; the
// model must return a single JSON object. Returns { success, data } or an error.
export async function structureContent({ instruction, source = '', profileFields = {} }) {
  if (!process.env.OPENAI_API_KEY) return { success: false, error: 'AI is not configured.' };
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const profileLine = Object.entries(profileFields || {})
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 40)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
      .join('\n');
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You produce clean, publish-ready content for an Indian doctor building their online presence. Follow NMC norms: informative, never advertising or superlatives. Return ONLY a single JSON object matching the requested shape.' },
        { role: 'user', content: `${instruction}\n\nDoctor profile (use where relevant):\n${profileLine || '(none)'}\n\nSource content to use:\n${String(source || '').slice(0, 6000)}` },
      ],
    });
    const raw = (completion.choices?.[0]?.message?.content || '').trim();
    let data;
    try { data = JSON.parse(raw); } catch { return { success: false, error: 'Could not parse the generated content.' }; }
    return { success: true, data, usage: completion.usage || {} };
  } catch (error) {
    console.error('[structureContent]', error.message);
    return { success: false, error: 'Generation failed. Please try again.' };
  }
}
