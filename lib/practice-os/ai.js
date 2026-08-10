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
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
// Token/cost control — cap what goes in and what comes out.
const MAX_PROMPT_CHARS = 2000;   // input: user prompt is trimmed to this
const MAX_OUTPUT_TOKENS = 700;   // output: hard ceiling per answer

const GUARDRAILS = `You are the CuraGo Practice OS assistant. You help an Indian doctor complete the single mission described below — nothing else. Politely decline anything outside this mission's scope.

Rules you must follow:
- Stay strictly on this mission. Do not answer unrelated questions.
- Help with drafting and formatting only. Do not give medical, legal, or regulatory advice.
- Keep everything compliant with Indian NMC advertising norms: no superlatives, no comparative or guaranteed-outcome claims, no soliciting patients. The goal is being findable, not advertising.
- Be concise, practical, and ready to paste. Prefer plain, professional language.`;

function buildSystemPrompt(authoredPrompt, mission, profileContext, profileFields = {}, module = null, knowledge = '') {
  const context = [
    mission?.category ? `Mission category: ${mission.category}` : '',
    mission?.missionText ? `Today's mission: ${mission.missionText}` : '',
    mission?.purpose ? `Why it matters: ${mission.purpose}` : '',
    module?.title ? `\nThe doctor is currently working on module: ${module.title}` : '',
    module?.expectedOutcome ? `Module outcome: ${module.expectedOutcome}` : '',
    Array.isArray(module?.steps) && module.steps.length ? `Module steps:\n- ${module.steps.join('\n- ')}` : '',
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
      messages: [
        { role: 'system', content: system },
        ...historyMsgs,
        { role: 'user', content: prompt },
      ],
    });

    const text = (completion.choices?.[0]?.message?.content || '').trim();
    if (!text) return { success: false, error: 'The assistant returned an empty response.' };
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
