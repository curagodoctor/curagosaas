// Shared AI image generation (OpenAI gpt-image-1 → Vercel Blob). Used for blog
// featured images and downloadable GBP-post images.
export async function generateAiImage(doctorId, topic, { kind = 'post', userPrompt = '' } = {}) {
  if (!process.env.OPENAI_API_KEY) return null;
  const { put } = await import('@vercel/blob');
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // When the doctor supplies their own brief, honour it (with the same safety
  // rails); otherwise auto-generate from the topic.
  const clean = String(userPrompt || '').trim().slice(0, 500);
  const prompt = clean
    ? `${clean}. Professional healthcare context for a patient-education piece. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`
    : `A clean, professional, editorial healthcare illustration for a patient-education piece about "${topic}". Calm, trustworthy clinical aesthetic, soft natural lighting, muted greens and warm neutrals. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`;

  // Try models in order: the configured/gpt-image-1 first, then dall-e-3 as a
  // fallback (gpt-image-1 needs OpenAI org verification; dall-e-3 does not — so a
  // key that can't use gpt-image-1 still gets an image). Sizes differ per model.
  const preferred = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const attempts = [];
  attempts.push({ model: preferred, size: kind === 'gbp' ? '1024x1024' : '1536x1024' });
  if (preferred !== 'dall-e-3') attempts.push({ model: 'dall-e-3', size: kind === 'gbp' ? '1024x1024' : '1792x1024' });

  for (const { model, size } of attempts) {
    try {
      const params = { model, prompt, size, n: 1 };
      // dall-e-3 must be asked for base64 explicitly; gpt-image-1 returns it by default.
      if (model === 'dall-e-3') params.response_format = 'b64_json';
      const result = await client.images.generate(params);
      const b64 = result?.data?.[0]?.b64_json;
      if (!b64) continue;
      const blob = await put(`ai-images/${doctorId}/${Date.now()}.png`, Buffer.from(b64, 'base64'), { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
      return blob.url;
    } catch (e) {
      console.error(`[generateAiImage] ${model} failed:`, e?.message || e);
      // Try the next model on any error (verification, model access, timeout).
    }
  }
  return null;
}
