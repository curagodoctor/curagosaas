import AiUsageLog from '@/models/practice-os/AiUsageLog';

// --- Pricing (OpenAI list prices, USD) --------------------------------------
// Text: USD per 1M tokens. Keep this table current if models/prices change.
const TEXT_PRICES = {
  'gpt-4o-mini': { in: 0.15, out: 0.60 },
  'gpt-4o': { in: 2.50, out: 10.00 },
  'gpt-4.1': { in: 2.00, out: 8.00 },
  'gpt-4.1-mini': { in: 0.40, out: 1.60 },
  'gpt-4.1-nano': { in: 0.10, out: 0.40 },
  'o4-mini': { in: 1.10, out: 4.40 },
};
const DEFAULT_TEXT = { in: 0.15, out: 0.60 }; // assume mini-class when unknown

// Images: USD per image, by model + size (approx, default quality).
const IMAGE_PRICES = {
  'gpt-image-1': { '1024x1024': 0.042, '1536x1024': 0.063, '1024x1536': 0.063, '1792x1024': 0.09 },
  'dall-e-3': { '1024x1024': 0.04, '1792x1024': 0.08, '1024x1792': 0.08 },
};
const DEFAULT_IMAGE_USD = 0.06;

// USD → INR. Configurable so it can track the real rate.
const USD_TO_INR = Number(process.env.PRACTICE_OS_USD_INR) > 0 ? Number(process.env.PRACTICE_OS_USD_INR) : 84;

export function textCostUsd(model, promptTokens = 0, completionTokens = 0) {
  const p = TEXT_PRICES[model] || DEFAULT_TEXT;
  return (promptTokens / 1e6) * p.in + (completionTokens / 1e6) * p.out;
}
export function imageCostUsd(model, size) {
  return (IMAGE_PRICES[model] && IMAGE_PRICES[model][size]) || DEFAULT_IMAGE_USD;
}
const toInr = (usd) => Math.round(usd * USD_TO_INR * 100) / 100;

// --- Recording (best-effort; never throws into the caller) ------------------
export async function recordTextUsage(doctorId, { model, promptTokens = 0, completionTokens = 0, totalTokens = 0, source = '', label = '', missionId } = {}) {
  try {
    await AiUsageLog.create({
      doctorId, source, kind: 'text', model: model || '',
      promptTokens, completionTokens, totalTokens: totalTokens || (promptTokens + completionTokens),
      costInInr: toInr(textCostUsd(model, promptTokens, completionTokens)),
      label, ...(missionId ? { missionId } : {}),
    });
  } catch (e) { console.error('[aiUsage] recordTextUsage failed:', e?.message); }
}
export async function recordImageUsage(doctorId, { model, size = '', source = '', label = '', missionId } = {}) {
  try {
    await AiUsageLog.create({
      doctorId, source, kind: 'image', model: model || '', size, imageCount: 1,
      costInInr: toInr(imageCostUsd(model, size)),
      label, ...(missionId ? { missionId } : {}),
    });
  } catch (e) { console.error('[aiUsage] recordImageUsage failed:', e?.message); }
}

// --- Reporting (admin) ------------------------------------------------------
function startOfTodayIstMs() {
  const nowIst = new Date(Date.now() + 5.5 * 3600 * 1000);
  return Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - 5.5 * 3600 * 1000;
}

export async function getDoctorAiUsage(doctorId) {
  const mongoose = (await import('mongoose')).default;
  const _id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;

  const byModel = await AiUsageLog.aggregate([
    { $match: { doctorId: _id } },
    { $group: {
      _id: { model: '$model', kind: '$kind' },
      requests: { $sum: 1 },
      promptTokens: { $sum: '$promptTokens' },
      completionTokens: { $sum: '$completionTokens' },
      totalTokens: { $sum: '$totalTokens' },
      images: { $sum: '$imageCount' },
      costInInr: { $sum: '$costInInr' },
    } },
    { $sort: { costInInr: -1 } },
  ]);

  const rows = byModel.map((r) => ({
    model: r._id.model || '(unknown)', kind: r._id.kind,
    requests: r.requests, promptTokens: r.promptTokens, completionTokens: r.completionTokens,
    totalTokens: r.totalTokens, images: r.images, costInInr: Math.round(r.costInInr * 100) / 100,
  }));

  const totals = rows.reduce((a, r) => ({
    requests: a.requests + r.requests, totalTokens: a.totalTokens + r.totalTokens,
    images: a.images + r.images, costInInr: a.costInInr + r.costInInr,
  }), { requests: 0, totalTokens: 0, images: 0, costInInr: 0 });
  totals.costInInr = Math.round(totals.costInInr * 100) / 100;

  const windowSum = async (sinceMs) => {
    const r = await AiUsageLog.aggregate([
      { $match: { doctorId: _id, createdAt: { $gte: new Date(sinceMs) } } },
      { $group: { _id: null, requests: { $sum: 1 }, costInInr: { $sum: '$costInInr' }, totalTokens: { $sum: '$totalTokens' }, images: { $sum: '$imageCount' } } },
    ]);
    const x = r[0] || { requests: 0, costInInr: 0, totalTokens: 0, images: 0 };
    return { requests: x.requests, costInInr: Math.round(x.costInInr * 100) / 100, totalTokens: x.totalTokens, images: x.images };
  };

  const recent = await AiUsageLog.find({ doctorId: _id }).sort({ createdAt: -1 }).limit(20)
    .select('source kind model totalTokens promptTokens completionTokens imageCount size costInInr label createdAt').lean();

  return {
    byModel: rows,
    totals,
    today: await windowSum(startOfTodayIstMs()),
    last30d: await windowSum(Date.now() - 30 * 86400000),
    recent: recent.map((r) => ({
      source: r.source, kind: r.kind, model: r.model || '(unknown)',
      tokens: r.totalTokens, images: r.imageCount, size: r.size,
      costInInr: Math.round((r.costInInr || 0) * 100) / 100, label: r.label, createdAt: r.createdAt,
    })),
    usdToInr: USD_TO_INR,
  };
}
