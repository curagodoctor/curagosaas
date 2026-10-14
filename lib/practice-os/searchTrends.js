/**
 * Practice OS — weekly patient search-trends (SerpAPI).
 *
 * For a doctor's specialty + city we pull what patients are actually searching
 * on Google this week (autocomplete, People-Also-Ask, related + rising queries)
 * and turn it into a short, readable digest + a few topics worth writing about.
 *
 * Cost control: reports are cached per (specialty, city, ISO-week), so two
 * doctors in the same field + city cost ONE SerpAPI fetch, and we never re-query
 * the same combination twice in a week. The whole feature is dormant until
 * SERPAPI_KEY is set — nothing breaks without it.
 */

import SearchTrendReport from '@/models/practice-os/SearchTrendReport';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { recordTextUsage } from '@/lib/practice-os/aiUsage';

const SERP_ENDPOINT = 'https://serpapi.com/search.json';
const SUMMARY_MODEL = process.env.OPENAI_SEARCH_TRENDS_MODEL || 'gpt-4o-mini';

export function isSearchTrendsConfigured() {
  return !!process.env.SERPAPI_KEY;
}

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Monday 00:00 UTC of the given date's ISO week — the cache bucket.
function weekStartUTC(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // Mon=1 … Sun=7
  date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

// One SerpAPI call. Returns parsed JSON or null (never throws).
async function serp(params) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const qs = new URLSearchParams({ ...params, api_key: key, hl: 'en', gl: 'in' });
  try {
    const res = await fetch(`${SERP_ENDPOINT}?${qs.toString()}`, { method: 'GET' });
    if (!res.ok) { console.error('[searchTrends] serp http', res.status, params.engine); return null; }
    const json = await res.json();
    if (json?.error) { console.error('[searchTrends] serp error', json.error, params.engine); return null; }
    return json;
  } catch (e) {
    console.error('[searchTrends] serp fetch', e.message, params.engine);
    return null;
  }
}

// Pull the raw queries for a specialty + city from several SerpAPI engines.
// Each engine is best-effort — one failing never sinks the others.
async function fetchQueries(specialty, city) {
  const where = city ? `${specialty} in ${city}` : specialty;
  const [auto, web, trends] = await Promise.all([
    serp({ engine: 'google_autocomplete', q: where }),
    serp({ engine: 'google', q: where, num: '10' }),
    serp({ engine: 'google_trends', q: specialty, data_type: 'RELATED_QUERIES', geo: 'IN' }),
  ]);

  const out = [];
  const seen = new Set();
  const add = (query, kind) => {
    const q = String(query || '').trim();
    const k = q.toLowerCase();
    if (!q || q.length < 3 || seen.has(k)) return;
    seen.add(k);
    out.push({ query: q, kind });
  };

  for (const s of auto?.suggestions || []) add(s?.value, 'autocomplete');
  for (const r of web?.related_questions || []) add(r?.question, 'question');
  for (const r of web?.related_searches || []) add(r?.query, 'related');
  const rq = trends?.related_queries || {};
  for (const r of rq.rising || []) add(r?.query, 'rising');
  for (const r of rq.top || []) add(r?.query, 'top');

  return out;
}

// AI digest of the raw queries, grounded strictly in what was searched.
async function summarize(doctorId, { specialty, city, queries }) {
  const fallback = { summary: '', suggestedTopics: [] };
  if (!process.env.OPENAI_API_KEY || !queries.length) return fallback;
  const list = queries.slice(0, 40).map((q) => `- ${q.query} (${q.kind})`).join('\n');
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: SUMMARY_MODEL,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You summarise, for an Indian ${specialty || 'doctor'}${city ? ` in ${city}` : ''}, what patients searched on Google this week. You are given the real search queries — use ONLY these, never invent demand. Return STRICT JSON:
{
  "summary": "3–5 plain sentences: the themes patients are searching for this week, grouped (symptoms, treatments, cost/logistics, local intent). Factual and NMC-compliant: no superlatives, no comparative or guaranteed-outcome claims.",
  "suggestedTopics": ["4–6 short PATIENT-EDUCATION blog titles the doctor can authoritatively write — each about a condition, symptom, treatment, procedure, recovery, cost or 'when to see a specialist' within their specialty, answering a real patient question from the searches. STRICTLY EXCLUDE anything not clinical: no local-area history/geography, no 'is <city> safe', no hospital/competitor names, no directory-style 'top 10' lists."]
}`,
        },
        { role: 'user', content: `Specialty: ${specialty}\nCity: ${city || '(not set)'}\n\nThis week's searches:\n${list}` },
      ],
    });
    const u = completion.usage || {};
    recordTextUsage(doctorId, {
      model: SUMMARY_MODEL,
      promptTokens: u.prompt_tokens || 0, completionTokens: u.completion_tokens || 0, totalTokens: u.total_tokens || 0,
      source: 'search-trends', label: `trends:${specialty}/${city || '-'}`,
    }).catch(() => {});
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    return {
      summary: String(parsed.summary || '').trim(),
      suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics.map((t) => String(t).trim()).filter(Boolean).slice(0, 6) : [],
    };
  } catch (e) {
    console.error('[searchTrends] summarize', e.message);
    return fallback;
  }
}

/**
 * Get this week's search-trends report for a doctor, fetching + summarising it
 * (once per specialty+city per week) if it isn't cached yet.
 *
 * Returns:
 *   { status: 'ok', report }                      — a report is available
 *   { status: 'not-ready' }                        — doctor has no specialty yet
 *   { status: 'not-configured', report|null }      — SERPAPI_KEY missing (shows last cached if any)
 */
export async function getOrRefreshTrendsForDoctor(doctorId, { force = false } = {}) {
  const fields = await getDoctorProfileFields(doctorId);
  const specialty = String(fields.specialty || '').trim();
  const city = String(fields.city || fields.location || '').trim();
  if (!specialty) return { status: 'not-ready' };

  const specialtyKey = norm(specialty);
  const cityKey = norm(city);
  const weekStart = weekStartUTC();

  // Cached report for this specialty+city+week? (shared across doctors)
  const existing = await SearchTrendReport.findOne({ specialtyKey, cityKey, weekStart }).lean();
  if (existing && !force) return { status: 'ok', report: existing };

  if (!isSearchTrendsConfigured()) {
    // Dormant — surface the most recent cached report if one exists.
    const last = existing || await SearchTrendReport.findOne({ specialtyKey, cityKey }).sort({ weekStart: -1 }).lean();
    return { status: 'not-configured', report: last || null };
  }

  const queries = await fetchQueries(specialty, city);
  if (!queries.length) {
    const last = existing || await SearchTrendReport.findOne({ specialtyKey, cityKey }).sort({ weekStart: -1 }).lean();
    return { status: last ? 'ok' : 'not-ready', report: last || null };
  }

  const { summary, suggestedTopics } = await summarize(doctorId, { specialty, city, queries });

  const report = await SearchTrendReport.findOneAndUpdate(
    { specialtyKey, cityKey, weekStart },
    { $set: { specialty, city, queries, summary, suggestedTopics, source: 'serpapi', fetchedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return { status: 'ok', report };
}
