import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, hasOptimizationAccess, hasAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// POST — the PAID disease-cluster mapping. Generate 10 diseases FRESH from the
// doctor's specialty (independent of any prior context), each with 1-2 specific
// treatments for that disease. Replaces the doctor's current cluster set. The
// doctor then reviews/edits/approves one disease at a time.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    // Grant-based access (optimization cohort) OR the paid AI tier.
    const allowed = (await hasOptimizationAccess(doctor._id)) || (await hasAiAccess(doctor._id));
    if (!allowed) return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const specialty = fields.specialty || fields.specialization || '';
    if (!specialty) return NextResponse.json({ success: false, error: 'Add your specialty in your profile first.' }, { status: 400 });

    const gen = await structureContent({
      instruction: `From the specialty "${specialty}"${fields.subspecialty ? ` (subspecialty "${fields.subspecialty}")` : ''}, generate the core DISEASE and TREATMENT architecture for an INDEPENDENT specialist practising in an Indian Tier-1 or Tier-2 city. This is architecture only — clinically coherent, commercially meaningful, SEO-useful — NOT a keyword list, NOT content.

DISEASE SELECTION — generate EXACTLY 10 distinct diseases/clinical conditions.
Prioritise, in this order: (1) common conditions with high patient demand and strong consultation/procedure potential; (2) conditions commonly managed or operated on by THIS specialty in real-world Indian practice; (3) conditions with meaningful treatment/procedure value; (4) a SMALLER number of complex/high-value conditions that establish specialist authority even at lower volume.
Weight the list toward COMMON + HIGH-DEMAND + HIGH-PRACTICE-VALUE, with only a small component of COMPLEX + HIGH-AUTHORITY. Do NOT optimise for rare diseases merely because they are medically interesting.
Each disease must be a DISTINCT patient problem with distinct symptoms, evaluation, treatment and search intent. Do NOT split one disease into artificial SEO variants (use "Gallstones" not gallbladder-stones/polyps as separate diseases; "Appendicitis" not acute/chronic; "Colorectal cancer" not colon vs rectal; "Arthritis" not separate knee/hip/shoulder pages when they are the same disease universe). But keep grouping CLINICALLY VALID — never merge genuinely distinct diseases just to reduce page count.
Order the 10 by priority (highest-demand/most-common first; the small complex/high-authority set last). Mark each disease's tier: "common" for the high-demand/high-practice-value drivers, "authority" for the complex/high-authority ones. Give each a one-line reason for inclusion.

TREATMENT DERIVATION — for each finalised disease, derive its clinically appropriate treatments/procedures. Each treatment MUST be: medically distinct; clinically legitimate; relevant to the specialty; genuinely appropriate for THAT disease; within the practical scope of an independent specialist; and consistent with current medical standards. A disease may have 1 to 3 treatments — as many DISTINCT procedures as the specialist would actually perform for it, and no more (e.g. Colorectal cancer → laparoscopic right/left hemicolectomy, anterior resection; Gallstones → laparoscopic cholecystectomy; GERD → laparoscopic Nissen fundoplication). Use full, standard medical terminology — never abbreviations.
Do NOT create separate treatments for wording/keyword variations. Do NOT list a recognised treatment the specialist would not personally perform (e.g. do NOT auto-attach RFA to liver cancer just because RFA exists for it) — include only treatments appropriate to this specialty and this specialist's actual surgical scope.
PREFER the doctor's OWN listed procedures/expertise wherever they legitimately apply to a disease; use standard, medically-accurate specialty procedures otherwise. Use correct medical terminology paired with a plain patient-facing name where helpful.

CLINICAL ACCURACY — follow current medical knowledge and accepted practice. Do NOT invent diseases, procedures, synonyms, indications or treatment relationships. Never optimise for keywords at the expense of clinical accuracy.

OVERALL LIMIT — no more than 20 treatments in TOTAL across all 10 diseases (each disease still 1-3). Prioritise the highest-value treatments; give the most common/high-demand diseases their full set and keep authority conditions lean.

Return JSON: {"diseases": [{"name": string, "tier": "common"|"authority", "reason": string (one line), "treatments": string[] (1-3 distinct, real procedures, no abbreviations)}]} with EXACTLY 10 diseases in priority order (and 20 treatments or fewer overall). NMC-compliant — factual, no superlatives, no outcome/success claims.`,
      source: `Specialty: ${specialty}\nSubspecialty: ${fields.subspecialty || '(none)'}\nProcedures the doctor listed: ${fields.procedures || '(none)'}\nAreas of expertise: ${fields.expertise || '(none)'}\nConditions the doctor listed: ${fields.diseases || '(none)'}\nCity: ${fields.city || ''}`,
      profileFields: fields,
    });
    const list = Array.isArray(gen.data?.diseases) ? gen.data.diseases : [];
    if (!list.length) return NextResponse.json({ success: false, error: 'Could not generate diseases — try again.' }, { status: 502 });

    // Replace the doctor's cluster set (fresh mapping — the paid version).
    await PracticeOsDiseaseCluster.deleteMany({ doctorId: doctor._id });
    const docs = list.slice(0, 10).map((d, i) => ({
      doctorId: doctor._id,
      name: String(d.name || '').trim() || `Condition ${i + 1}`,
      slug: slugify(d.name),
      tier: d.tier === 'authority' ? 'authority' : 'common',
      reason: String(d.reason || '').trim().slice(0, 200),
      treatments: (Array.isArray(d.treatments) ? d.treatments : []).slice(0, 3)
        .map((t) => ({ name: String(t).trim(), source: 'ai' }))
        .filter((t) => t.name),
      approved: false,
      order: i,
    }));
    // Enforce the 20-treatment overall cap: keep 1 per disease first (min), then
    // fill remaining budget in priority order — so no disease is left empty.
    const TOTAL_CAP = 20;
    for (const doc of docs) if (!doc.treatments.length) doc.treatments = []; // (defensive)
    let budget = TOTAL_CAP - docs.reduce((n, doc) => n + Math.min(1, doc.treatments.length), 0);
    for (const doc of docs) {
      const keep = 1; // guaranteed first treatment
      const extra = Math.max(0, doc.treatments.length - keep);
      const take = Math.max(0, Math.min(extra, budget));
      doc.treatments = doc.treatments.slice(0, keep + take);
      budget -= take;
    }
    await PracticeOsDiseaseCluster.insertMany(docs, { ordered: false }).catch(() => {});
    // The map changed → clear stale day content so days regenerate from this map.
    try { const { clearDayContent } = await import('@/lib/practice-os/dayContent'); await clearDayContent(doctor._id); } catch { /* best-effort */ }
    const clusters = await PracticeOsDiseaseCluster.find({ doctorId: doctor._id }).sort({ order: 1 }).lean();

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'clusters-generate', tokens: gen.usage?.total_tokens || 0 });
    return NextResponse.json({ success: true, clusters, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[clusters generate]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your diseases.' }, { status: 500 });
  }
}
