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

// Image generation is PAUSED: OpenAI bills for image generations even when its
// safety filter blocks the (medical/surgical) output, so auto-generation was
// burning real money for images that never arrived. Instead we hand the doctor a
// ready-to-paste prompt (buildImagePrompt) to generate their own image anywhere.
// Flip PRACTICE_OS_IMAGE_GEN=on to re-enable automatic generation later.
const IMAGE_GEN_ENABLED = process.env.PRACTICE_OS_IMAGE_GEN === 'on';

// A safe, ready-to-paste image prompt the doctor can use in their own image tool.
export function buildImagePrompt(topic) {
  const safe = String(topic || '').replace(GRAPHIC_WORDS, 'care').replace(/\s{2,}/g, ' ').trim().slice(0, 120) || 'patient care';
  return `A clean, calm, professional editorial illustration for a healthcare patient-education piece about ${safe}. Soft natural lighting, muted greens and warm neutrals, reassuring and trustworthy. Abstract and tasteful — no medical procedures depicted, no blood, no surgical scenes, no people in distress. No text, no words, no letters, no logos, no watermarks. Landscape, 16:9.`;
}

// Time bounds so image generation can never stall a cron. One attempt is capped,
// and the whole function gives up after OVERALL_MS (returns no image — best-effort).
const PER_ATTEMPT_MS = Math.max(10000, Number(process.env.OPENAI_IMAGE_TIMEOUT_MS) || 35000);
const OVERALL_MS = Math.max(PER_ATTEMPT_MS, Number(process.env.OPENAI_IMAGE_OVERALL_MS) || 45000);

export async function generateAiImage(doctorId, topic, { kind = 'post', userPrompt = '', source = 'image', label = '' } = {}) {
  // Paused — no OpenAI image calls (and therefore no OpenAI billing) until re-enabled.
  if (!IMAGE_GEN_ENABLED) return null;
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
  // The fallback is always the OTHER model, so if the preferred one fails, errors or
  // times out, we still try a different engine rather than giving up.
  const fallbackModel = preferred === 'dall-e-3' ? 'gpt-image-1' : 'dall-e-3';
  const sizeFor = (m) => (m === 'dall-e-3' ? (kind === 'gbp' ? '1024x1024' : '1792x1024') : (kind === 'gbp' ? '1024x1024' : '1536x1024'));
  // 1) preferred model with the specific prompt; 2) if that produces nothing
  // (error / timeout / safety rejection), ALWAYS fall back to the other model with
  // the generic non-graphic prompt — so a slow or failing primary never leaves the
  // content without an image. Each attempt is independently bounded by PER_ATTEMPT_MS
  // (no shared deadline, which previously starved the fallback before it could run).
  const attempts = [
    { model: preferred, size: sizeFor(preferred), prompt: base },
    { model: fallbackModel, size: sizeFor(fallbackModel), prompt: generic },
  ];
  for (const a of attempts) {
    try {
      const buf = await tryGen(a.model, a.size, a.prompt);
      if (!buf) continue;
      const blob = await put(`ai-images/${doctorId}/${Date.now()}.png`, buf, { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
      // Track the image generation (per-model cost visibility for admin).
      try { const { recordImageUsage } = await import('@/lib/practice-os/aiUsage'); await recordImageUsage(doctorId, { model: a.model, size: a.size, source, label }); } catch { /* best-effort */ }
      return blob.url;
    } catch (e) {
      console.error(`[generateAiImage] ${a.model} failed:`, e?.message || e);
      // fall through to the fallback model
    }
  }
  return null;
}
