/**
 * Free Google-Maps ranking funnel. From the prospect's specialty + city +
 * localities + keywords (and optional exact GBP name) we build 10 local search
 * terms (their keywords + AI-generated), check their local-pack rank for each via
 * SerpAPI google_maps, match their GBP name, and compute an overall score out of
 * 30 (rank 1 = 3pts, rank 2 = 2, rank 3 = 1, else 0). Best-effort; never throws.
 */
import RankCheckLead from '@/models/RankCheckLead';

const SERP = 'https://serpapi.com/search.json';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const splitList = (s) => String(s || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);

async function serpMaps(term) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];
  const qs = new URLSearchParams({ engine: 'google_maps', type: 'search', q: term, hl: 'en', api_key: key });
  try {
    const res = await fetch(`${SERP}?${qs}`);
    if (!res.ok) return [];
    const json = await res.json();
    if (json?.error) return [];
    return json.local_results || (json.place_results ? [json.place_results] : []);
  } catch { return []; }
}

const mapsLink = (r) => (r?.place_id ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}` : (r?.link || ''));

// Build exactly 10 local search terms from the provided keywords + localities,
// topped up by AI (specialist / alias / condition terms). Provided keywords are
// always represented first.
async function buildTerms({ specialty, city, localities, keywords }) {
  const locs = splitList(localities);
  const loc0 = locs[0] || city;
  const seed = (keywords || []).map((kw) => (loc0 ? `${kw} ${loc0}` : kw));

  let aiTerms = [];
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_SEARCH_TRENDS_MODEL || 'gpt-4o-mini',
        temperature: 0.5, max_tokens: 400, response_format: { type: 'json_object' },
        messages: [{
          role: 'system',
          content: `Return STRICT JSON {"terms":[strings]} — up to 10 Google Maps searches a real patient would type to find this ${specialty || 'doctor'}. Mix: the specialist term, a lay/alias term, and condition/treatment terms — each combined with one of the localities or the city. Plain patient language, no brand names.`,
        }, {
          role: 'user',
          content: `Specialty: ${specialty}\nCity: ${city}\nLocalities: ${locs.join(', ') || city}\nTheir keywords: ${(keywords || []).join(', ')}`,
        }],
      });
      const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
      if (Array.isArray(parsed.terms)) aiTerms = parsed.terms.map((t) => String(t).trim()).filter(Boolean);
    } catch { /* fall back to seed */ }
  }

  const out = [];
  const seen = new Set();
  for (const t of [...seed, ...aiTerms]) {
    const k = t.toLowerCase();
    if (t && !seen.has(k)) { seen.add(k); out.push(t); }
    if (out.length >= 10) break;
  }
  // Pad to 10 with simple combos if needed.
  let i = 0;
  while (out.length < 10 && (keywords?.length || specialty)) {
    const kw = (keywords && keywords[i % keywords.length]) || specialty;
    const loc = locs[i % Math.max(1, locs.length)] || city;
    const t = `best ${kw} ${loc}`.trim();
    const k = t.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(t); }
    if (++i > 30) break;
  }
  return out.slice(0, 10);
}

// Does a listing look like THIS doctor/clinic? Prefers the exact GBP name.
function isMatch(title, gbpName, name) {
  const t = norm(title);
  const g = norm(gbpName);
  if (g && g.length > 3 && (t.includes(g) || g.includes(t))) return true;
  const nm = norm(name).replace(/^dr /, '').trim();
  if (nm && nm.length > 3) {
    const tokens = nm.split(' ').filter((w) => w.length > 2);
    if (tokens.length && tokens.every((w) => t.includes(w))) return true;
  }
  return false;
}

const pointsForRank = (rank) => (rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0);

export async function runRankCheck({ name = '', email = '', whatsapp = '', specialty = '', city = '', localities = '', gbpName = '', keywords = [] }) {
  const terms = await buildTerms({ specialty, city, localities, keywords });
  const results = [];
  for (const term of terms) {
    const list = await serpMaps(term);
    let rank = null, found = false, profileLink = '';
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (isMatch(r.title, gbpName, name)) { rank = r.position || (i + 1); found = true; profileLink = mapsLink(r); break; }
    }
    const competitors = list.slice(0, 3).map((r) => ({ name: r.title || '', rating: r.rating || 0, reviews: r.reviews || 0, link: mapsLink(r) }));
    results.push({ term, rank, found, points: pointsForRank(rank), profileLink, competitors });
  }

  const score = results.reduce((s, r) => s + (r.points || 0), 0);
  const rankedCount = results.filter((r) => r.found).length;

  let leadId = null;
  try {
    const lead = await RankCheckLead.create({ name, email, whatsapp, specialty, city, localities, gbpName, keywords, terms, results, score, scoreOutOf: 30, rankedCount });
    leadId = String(lead._id);
  } catch (e) { console.error('[rankCheck] lead save', e.message); }

  return { terms, results, score, scoreOutOf: 30, rankedCount, leadId };
}
