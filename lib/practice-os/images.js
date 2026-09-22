// Shared AI image generation (OpenAI gpt-image-1 → Vercel Blob). Used for blog
// featured images and downloadable GBP-post images.
export async function generateAiImage(doctorId, topic, { kind = 'post', userPrompt = '' } = {}) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { put } = await import('@vercel/blob');
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // When the doctor supplies their own brief, honour it (with the same safety
    // rails); otherwise auto-generate from the topic.
    const clean = String(userPrompt || '').trim().slice(0, 500);
    const prompt = clean
      ? `${clean}. Professional healthcare context for a patient-education piece. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`
      : `A clean, professional, editorial healthcare illustration for a patient-education piece about "${topic}". Calm, trustworthy clinical aesthetic, soft natural lighting, muted greens and warm neutrals. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`;
    // GBP posts read best square; blog/website images landscape.
    const size = kind === 'gbp' ? '1024x1024' : '1536x1024';
    const result = await client.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size, n: 1 });
    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) return null;
    const blob = await put(`ai-images/${doctorId}/${Date.now()}.png`, Buffer.from(b64, 'base64'), { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
    return blob.url;
  } catch (e) {
    console.error('[generateAiImage]', e.message);
    return null;
  }
}
