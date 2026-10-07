// Shared AI image generation (OpenAI gpt-image-1 → Vercel Blob). Used for blog
// featured images and downloadable GBP-post images.
//
// Clinical topics ("Fracture Fixation", "Trauma Surgery", "Tumour Removal") can
// trip OpenAI's image safety filter (safety_violations=[violence]). So we (a) frame
// every prompt as a calm, abstract, non-graphic illustration and strip graphic
// clinical words from the topic, and (b) retry with an ultra-generic safe prompt
// before giving up. We also handle both response shapes (b64 from gpt-image-1, url
// from dall-e-3) WITHOUT passing response_format (dall-e-3 now rejects it).
const GRAPHIC_WORDS = /\b(surgery|surgical|surgeries|trauma|fracture|amputation|amputate|wound|wounds|blood|bleeding|haemorrhage|hemorrhage|injury|injuries|cancer|tumou?rs?|incision|operative|operation|biopsy|lesion|ulcer|gore|gory|dissection)\b/gi;

// Time bounds so image generation can never stall a cron. One attempt is capped,
// and the whole function gives up after OVERALL_MS (returns no image — best-effort).
const PER_ATTEMPT_MS = Math.max(10000, Number(process.env.OPENAI_IMAGE_TIMEOUT_MS) || 35000);
const OVERALL_MS = Math.max(PER_ATTEMPT_MS, Number(process.env.OPENAI_IMAGE_OVERALL_MS) || 45000);

export async function generateAiImage(doctorId, topic, { kind = 'post', userPrompt = '', source = 'image', label = '' } = {}) {
  if (!process.env.OPENAI_API_KEY) return null;
  const { put } = await import('@vercel/blob');
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const safeTopic = String(topic || '').replace(GRAPHIC_WORDS, 'care').replace(/\s{2,}/g, ' ').trim().slice(0, 120);
  const clean = String(userPrompt || '').trim().replace(GRAPHIC_WORDS, 'care').slice(0, 500);
  const safetyTail = 'Calm, reassuring, professional. No people in distress, no medical procedures depicted, no blood, no wounds, no surgical scenes. No text, no words, no letters, no logos, no watermarks.';
  const base = clean
    ? `${clean}. Professional healthcare context for a patient-education piece, abstract and tasteful. ${safetyTail}`
    : `A clean, calm, abstract editorial illustration for a healthcare patient-education piece about ${safeTopic || 'patient care'}. Soft natural lighting, muted greens and warm neutrals. ${safetyTail}`;
  // Used if the specific prompt is safety-rejected — nothing topic-specific to trip on.
  const generic = `A clean, calm, abstract editorial healthcare illustration — soft organic shapes, muted greens and warm neutrals, reassuring and professional. No people, no text, no letters, no logos, no watermarks.`;

  async function tryGen(model, size, prompt) {
    // NO response_format: gpt-image-1 returns b64 by default; dall-e-3 returns a url
    // by default and rejects response_format. Handle whichever comes back.
    // Hard per-request timeout so a slow image call can't stall a cron (image gen
    // can otherwise take 40-90s and time the whole function out).
    const result = await client.images.generate({ model, prompt, size, n: 1 }, { timeout: PER_ATTEMPT_MS });
    const d = result?.data?.[0];
    if (d?.b64_json) return Buffer.from(d.b64_json, 'base64');
    if (d?.url) { const r = await fetch(d.url); return Buffer.from(await r.arrayBuffer()); }
    return null;
  }

  const preferred = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size = kind === 'gbp' ? '1024x1024' : '1536x1024';
  const d3size = kind === 'gbp' ? '1024x1024' : '1792x1024';
  const attempts = [
    { model: preferred, size, prompt: base },
    { model: preferred, size, prompt: generic },   // safety retry — generic, non-graphic
  ];
  if (preferred !== 'dall-e-3') attempts.push({ model: 'dall-e-3', size: d3size, prompt: generic });

  // Overall deadline across all attempts — after this we give up and return no image
  // (callers treat the image as best-effort), rather than blowing the function budget.
  const deadline = Date.now() + OVERALL_MS;
  for (const a of attempts) {
    if (Date.now() >= deadline) break;
    try {
      const buf = await tryGen(a.model, a.size, a.prompt);
      if (!buf) continue;
      const blob = await put(`ai-images/${doctorId}/${Date.now()}.png`, buf, { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
      // Track the image generation (per-model cost visibility for admin).
      try { const { recordImageUsage } = await import('@/lib/practice-os/aiUsage'); await recordImageUsage(doctorId, { model: a.model, size: a.size, source, label }); } catch { /* best-effort */ }
      return blob.url;
    } catch (e) {
      console.error(`[generateAiImage] ${a.model} failed:`, e?.message || e);
      // Next attempt (safety retry / fallback model) on any error.
    }
  }
  return null;
}
