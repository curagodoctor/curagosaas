/**
 * Free Google-Maps ranking funnel. For a prospect's specialty + city we let AI
 * pick 5 realistic local search terms, then check their local-pack rank for each
 * (via the SerpAPI google_maps engine we already use) and surface who's ranking
 * above them. Best-effort throughout — never throws into the caller.
 */
import RankCheckLead from '@/models/RankCheckLead';

const SERP = 'https://serpapi.com/search.json';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

async function serpMaps(term) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const qs = new URLSearchParams({ engine: 'google_maps', type: 'search', q: term, hl: 'en', api_key: key });
  try {
    const res = await fetch(`${SERP}?${qs}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;
    return json.local_results || json.place_results ? (json.local_results || [json.place_results]) : [];
  } catch { return null; }
}

// AI picks 5 patient-style local search terms. Falls back to a sensible set.
async function pickTerms(specialty, city) {
  const fallback = [
    `${specialty} in ${city}`,
    `best ${specialty} in ${city}`,
    `${specialty} near me ${city}`,
    `${specialty} doctor ${city}`,
    `top ${specialty} ${city}`,
  ];
  if (!process.env.OPENAI_API_KEY) return fallback;
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_SEARCH_TRENDS_MODEL || 'gpt-4o-mini',
      temperature: 0.5, max_tokens: 300, response_format: { type: 'json_object' },
      messages: [{
        role: 'system',
        content: `Return STRICT JSON {"terms": [5 strings]} — the 5 Google Maps searches a real patient in ${city} would type to find a ${specialty}. Include: the specialist term, one lay/alias term (e.g. "stomach doctor"), and 1–2 common condition/treatment terms for this specialty. EVERY term must include "${city}". Plain patient language, no brand names.`,
      }, { role: 'user', content: `Specialty: ${specialty}\nCity: ${city}` }],
    });
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const terms = Array.isArray(parsed.terms) ? parsed.terms.map((t) => String(t).trim()).filter(Boolean).slice(0, 5) : [];
    return terms.length ? terms : fallback;
  } catch { return fallback; }
}

// Does a local-pack listing look like THIS doctor/clinic?
function isMatch(title, name, clinic) {
  const t = norm(title);
  const clean = (s) => norm(s).replace(/^dr /, '').trim();
  const nm = clean(name), cl = clean(clinic);
  if (cl && cl.length > 3 && t.includes(cl)) return true;
  if (nm && nm.length > 3) {
    const tokens = nm.split(' ').filter((w) => w.length > 2);
    if (tokens.length && tokens.every((w) => t.includes(w))) return true;
  }
  return false;
}

export async function runRankCheck({ name = '', email = '', phone = '', specialty = '', city = '', clinicName = '' }) {
  const terms = await pickTerms(specialty, city);
  const results = [];
  for (const term of terms) {
    const local = await serpMaps(term);
    const list = Array.isArray(local) ? local : [];
    let rank = null, found = false;
    for (const r of list) {
      if (isMatch(r.title, name, clinicName)) { rank = r.position || (list.indexOf(r) + 1); found = true; break; }
    }
    const competitors = list.slice(0, 3).map((r) => ({ name: r.title || '', rating: r.rating || 0, reviews: r.reviews || 0 }));
    results.push({ term, rank, found, competitors });
  }

  const rankedCount = results.filter((r) => r.found).length;
  // Store the lead (best-effort).
  let leadId = null;
  try {
    const lead = await RankCheckLead.create({ name, email, phone, specialty, city, clinicName, terms, results, rankedCount });
    leadId = String(lead._id);
  } catch (e) { console.error('[rankCheck] lead save', e.message); }

  return { terms, results, rankedCount, leadId };
}
