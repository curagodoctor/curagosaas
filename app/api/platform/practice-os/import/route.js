import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import {
  buildHeaderMap, slugify, parseEvidence, parseKpiFields,
  buildEducation, buildButtons, toInt,
} from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

/**
 * POST /api/platform/practice-os/import
 * Bulk-import missions from an Excel sheet (one row = one mission). Auto-creates
 * the Framework → Module hierarchy and upserts missions by
 * {frameworkId, moduleId, weekNumber, dayNumber, missionNumber}.
 * Returns { created, updated, skipped, errors[] }.
 */
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // --- receive + validate file ---
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum 5MB.' }, { status: 400 });
    }
    if (!(file.name || '').match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Upload .xlsx or .xls file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ success: false, error: 'No worksheet found in file' }, { status: 400 });
    }

    // --- header-name -> column-index map (robust to column reordering) ---
    const headerMap = buildHeaderMap(worksheet.getRow(1));
    const col = (name) => headerMap[name.toLowerCase()];
    if (!col('framework') || !col('module') || !col('mission')) {
      return NextResponse.json(
        { success: false, error: 'Missing required columns. The sheet must include Framework, Module and Mission columns.' },
        { status: 400 }
      );
    }

    // --- collect rows ---
    const errors = [];
    const rows = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // header
      const cell = (name) => {
        const idx = col(name);
        return idx ? row.getCell(idx).text?.trim() ?? '' : '';
      };
      const frameworkTitle = cell('framework');
      const moduleTitle = cell('module');
      const missionText = cell('mission');
      // Skip fully blank rows silently.
      if (!frameworkTitle && !moduleTitle && !missionText) return;

      if (!frameworkTitle || !moduleTitle || !missionText) {
        errors.push({ row: rowIndex, error: 'Framework, Module and Mission are all required' });
        return;
      }
      const missionNumber = toInt(cell('mission number'), null);
      if (missionNumber === null) {
        errors.push({ row: rowIndex, error: 'Mission Number must be a number' });
        return;
      }
      rows.push({ rowIndex, frameworkTitle, moduleTitle, missionText, missionNumber, cell });
    });

    // --- upsert hierarchy + missions ---
    const frameworkCache = new Map(); // slug -> framework doc
    const moduleCache = new Map();    // `${frameworkId}::${title}` -> module doc
    let created = 0;
    let updated = 0;

    for (const r of rows) {
      try {
        // Framework (upsert by slug)
        const fwSlug = slugify(r.frameworkTitle);
        let framework = frameworkCache.get(fwSlug);
        if (!framework) {
          framework = await Framework.findOneAndUpdate(
            { slug: fwSlug },
            { $setOnInsert: { title: r.frameworkTitle, slug: fwSlug } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          frameworkCache.set(fwSlug, framework);
        }

        // Module (upsert by framework + title)
        const modKey = `${framework._id}::${r.moduleTitle}`;
        let mod = moduleCache.get(modKey);
        if (!mod) {
          mod = await Module.findOneAndUpdate(
            { frameworkId: framework._id, title: r.moduleTitle },
            { $setOnInsert: { frameworkId: framework._id, title: r.moduleTitle, order: moduleCache.size } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          moduleCache.set(modKey, mod);
        }

        // Build the mission document from the row
        const c = r.cell;
        const doc = {
          frameworkId: framework._id,
          moduleId: mod._id,
          weekNumber: toInt(c('week'), 1),
          dayNumber: toInt(c('day'), 1),
          missionNumber: r.missionNumber,
          category: c('category'),
          purpose: c('purpose'),
          missionText: r.missionText,
          education: buildEducation({
            videoUrl: c('video url'), pdfUrl: c('pdf url'), externalLink: c('external link'),
          }),
          buttons: buildButtons([
            { label: c('button label 1'), url: c('button url 1') },
            { label: c('button label 2'), url: c('button url 2') },
          ]),
          aiContext: { systemPrompt: c('gpt prompt'), model: '' },
          evidence: parseEvidence(c('evidence required')),
          reward: {
            points: toInt(c('reward points'), 10),
            badge: '',
            message: c('celebration message'),
          },
          kpiFields: parseKpiFields(c('kpi fields')),
          completionRules: c('completion rules') ? { note: c('completion rules') } : {},
          unlockDelayDays: toInt(c('unlock delay'), 1),
          isActive: true,
        };

        const key = {
          frameworkId: framework._id,
          moduleId: mod._id,
          weekNumber: doc.weekNumber,
          dayNumber: doc.dayNumber,
          missionNumber: doc.missionNumber,
        };
        // New missions publish immediately; re-importing preserves an existing
        // mission's publish state (admin may have unpublished it).
        const res = await Mission.updateOne(
          key,
          { $set: doc, $setOnInsert: { status: 'published' } },
          { upsert: true }
        );
        if (res.upsertedCount > 0) created++;
        else updated++;
      } catch (rowError) {
        errors.push({ row: r.rowIndex, error: rowError.message });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped: errors.length,
      total: rows.length + errors.length,
      frameworks: frameworkCache.size,
      modules: moduleCache.size,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Practice OS Import]', error);
    return NextResponse.json({ success: false, error: 'Failed to import missions' }, { status: 500 });
  }
}
