// Import the founder's "Rolling 56-Day Engine" workbook as Dominate Organic
// Search missions. This new template differs from Mission_Content_Master (no
// Mission_ID; Todays_Mission_Title / Description headers; two rotation sheets),
// so it needs its own parser. Per decision: bake ONE fixed title + success
// variation per mission (deterministic rotation, no runtime randomness).
//
//   node scripts/import-56day-engine.mjs "/path/to/Curago_Rolling_Daily_Engine_56day.xlsx"
//
// Idempotent: upserts missions by { frameworkId, code }. The framework is created
// UNPUBLISHED/INACTIVE so nothing goes live until you flip it in the admin.
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import ExcelJS from 'exceljs';

const FILE = process.argv[2] || '/Users/raghavendra/Downloads/Curago_Rolling_Daily_Engine_56day (1).xlsx';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const uri = (env.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

// A cell that is only a template token like "{{primary_button_text}}" carries no
// real content — treat it as empty. (Real text with an inline {{treatment_one}}
// placeholder is kept — those resolve at runtime.)
const real = (v) => {
  const s = String(v ?? '').trim();
  return /^\{\{[^}]*\}\}(\s*\(.*\))?$/.test(s) ? '' : s;
};
const slugify = (t) => String(t || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const scoreFor = (cat) => (/blog/i.test(cat) ? 'website' : 'gbp'); // GBP post/services/product/photos → gbp
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  // --- rotation maps: category -> [variations] ---
  const readRotations = (sheetName) => {
    const ws = wb.getWorksheet(sheetName);
    const byCat = {};
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const cat = String(row.getCell(1).text).trim();
      const txt = String(row.getCell(3).text).trim();
      if (cat && txt) (byCat[cat] = byCat[cat] || []).push(txt);
    }
    return byCat;
  };
  const titleRot = readRotations('Title Rotations');
  const successRot = readRotations('Success Rotations');

  // --- main sheet: build a header->column map ---
  const s1 = wb.getWorksheet('Rolling 56-Day Engine');
  const header = s1.getRow(1);
  const col = {};
  header.eachCell({ includeEmpty: false }, (c, n) => { const k = norm(c.text); if (k && !(k in col)) col[k] = n; });
  const cell = (row, key) => real(row.getCell(col[key]).text);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // --- find or create the Dominate Organic Search framework (unpublished) ---
  const fwCol = db.collection('frameworks');
  let fw = await fwCol.findOne({ title: /^dominate organic search$/i });
  if (!fw) {
    const now = new Date();
    const res = await fwCol.insertOne({
      title: 'Dominate Organic Search',
      slug: 'dominate-organic-search',
      description: 'The 56-day rolling daily engine — a small piece of Google Business Profile and website content every day.',
      category: 'Organic Search',
      tier: 'optimization',
      tagline: 'Get found on Google, one day at a time.',
      summary: 'A rolling 56-day plan: daily GBP posts, blog pages, services, products and photos — drafted for you to review and publish.',
      outcomes: ['A steadily growing Google Business Profile', 'A library of educational blog pages', 'A complete, current services & products listing'],
      priceInInr: 0,
      mode: 'mission',
      isActive: false,   // dormant until you activate
      isPublished: false,
      totalDays: 56,
      createdAt: now, updatedAt: now,
    });
    fw = await fwCol.findOne({ _id: res.insertedId });
    console.log('Created framework "Dominate Organic Search":', String(fw._id), '(unpublished)');
  } else {
    console.log('Using existing framework:', String(fw._id), `"${fw.title}"`);
  }

  // --- walk the 58 data rows ---
  const missionsCol = db.collection('missions');
  const catOccur = {};        // per-category running index → deterministic rotation pick
  const perDayCount = {};     // missionNumber within a day
  let upserts = 0;
  const summary = [];

  for (let r = 2; r <= s1.rowCount; r++) {
    const row = s1.getRow(r);
    const dayRaw = String(row.getCell(col[norm('Day_Number')]).text).trim();
    const m = dayRaw.match(/(\d+)/);
    if (!m) continue;
    const day = parseInt(m[1], 10);
    const category = String(row.getCell(col[norm('Mission_Category')]).text).trim();
    if (!category) continue;

    perDayCount[day] = (perDayCount[day] || 0) + 1;
    const missionNumber = perDayCount[day];
    const occ = (catOccur[category] = (catOccur[category] || 0)); // 0-based
    catOccur[category] = occ + 1;

    const titles = titleRot[category] || [];
    const successes = successRot[category] || [];
    const bakedTitle = titles.length ? titles[occ % titles.length] : `${category} — Day ${day}`;
    const bakedSuccess = successes.length ? successes[occ % successes.length] : 'Published — nicely done.';

    const description = cell(row, norm('Description'));
    const prompt = cell(row, norm('Prompt_output_with_placeholder'));

    // Inputs (input_1..4 + compulsory flags); skip empty/placeholder ones.
    const inputs = [];
    for (let i = 1; i <= 4; i++) {
      const label = cell(row, norm(`input_${i}`));
      if (!label) continue;
      const comp = cell(row, norm(`input_${i}_compulsory`)).toLowerCase();
      inputs.push({ label, required: !/not/.test(comp) });
    }

    const code = `dos-day${day}-m${missionNumber}`;
    const now = new Date();
    const doc = {
      frameworkId: fw._id,
      weekNumber: Math.ceil(day / 7),
      dayNumber: day,
      missionNumber,
      code,
      category,
      missionText: bakedTitle,
      briefDescription: description,
      objective: description,
      purpose: description,
      aiContext: { systemPrompt: prompt, model: '' },
      inputs,
      successMessage: bakedSuccess,
      scoreComponent: scoreFor(category),
      estimatedMinutes: 30,
      reward: { points: 10, badge: '', message: bakedSuccess },
      status: 'published',
      isActive: true,
      unlockDelayDays: 1,
      meta: {
        source: 'rolling-56day-engine',
        instructionNote: cell(row, norm('Mission_inputs_from_doctor')),
        rotationTitleIndex: occ % (titles.length || 1),
      },
      updatedAt: now,
    };

    await missionsCol.updateOne(
      { frameworkId: fw._id, code },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    upserts++;
    summary.push(`  Day ${String(day).padStart(2)} #${missionNumber}  ${category.padEnd(10)}  ${bakedTitle.slice(0, 60)}`);
  }

  // update totalDays on the framework
  await fwCol.updateOne({ _id: fw._id }, { $set: { totalDays: 56, updatedAt: new Date() } });

  const total = await missionsCol.countDocuments({ frameworkId: fw._id });
  console.log(`\nUpserted ${upserts} missions. Framework now has ${total} missions total.`);
  console.log(summary.join('\n'));
  await mongoose.disconnect();
}

main().catch((e) => { console.error('IMPORT FAILED:', e); process.exit(1); });
