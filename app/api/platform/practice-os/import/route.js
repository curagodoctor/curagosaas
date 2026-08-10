import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import {
  slugify, toInt, parseScoreComponent, parseSubSteps,
  buildColumnMap, findHeaderRow, parseEstimatedTime, buildInputs,
  buildButtonTriples, normalizeResourceType, buildDocEducation, parseStatus,
} from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

/**
 * POST /api/platform/practice-os/import
 *
 * Bulk-import Practice OS content from the "Mission_Content_Master" template.
 * There is no Framework column: all missions go under a single framework
 * (default "Practice OS", or a `frameworkName` form field if supplied). Modules
 * are auto-created from Module_Name (+ Module_Number for order). A second
 * "Resources" sheet, keyed by Mission_ID, is merged into each mission's
 * education[]. Missions upsert by Mission_ID (code) when present, else by
 * {framework, module, week, day, missionNumber}.
 *
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

    const frameworkId = String(formData.get('frameworkId') || '').trim();
    const frameworkName = String(formData.get('frameworkName') || '').trim();

    const buffer = Buffer.from(await file.arrayBuffer());
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // --- locate the Mission_Content_Master sheet (by name, else the one whose
    //     header row contains Mission_ID) ---
    let missionSheet = workbook.worksheets.find(
      (ws) => slugify(ws.name).includes('mission') && slugify(ws.name).includes('content')
    ) || workbook.getWorksheet('Mission_Content_Master');
    let header = missionSheet ? findHeaderRow(missionSheet) : null;
    if (!header) {
      for (const ws of workbook.worksheets) {
        const h = findHeaderRow(ws);
        if (h) { missionSheet = ws; header = h; break; }
      }
    }
    if (!missionSheet || !header) {
      return NextResponse.json(
        { success: false, error: 'Could not find a header row containing "Mission_ID". Start from the template.' },
        { status: 400 }
      );
    }

    const colMap = buildColumnMap(header.row);
    const col = (key) => colMap[key];
    const cellOf = (row, key) => {
      const idx = col(key);
      if (!idx) return '';
      const t = row.getCell(idx).text;
      return (t == null ? '' : String(t)).trim();
    };

    // --- parse the Resources sheet (grouped by Mission_ID) ---
    const resourcesByMission = new Map(); // code -> [{ type, label, url, order }]
    const resourceSheet = workbook.worksheets.find((ws) => slugify(ws.name) === 'resources')
      || workbook.getWorksheet('Resources');
    if (resourceSheet) {
      const rHeader = findHeaderRow(resourceSheet) || { rowNumber: 1, row: resourceSheet.getRow(1) };
      const rMap = buildColumnMap(rHeader.row);
      const rCell = (row, key) => {
        const idx = rMap[key];
        if (!idx) return '';
        const t = row.getCell(idx).text;
        return (t == null ? '' : String(t)).trim();
      };
      resourceSheet.eachRow((row, rowIndex) => {
        if (rowIndex <= rHeader.rowNumber) return;
        const missionId = rCell(row, 'missionid');
        const url = rCell(row, 'url');
        const title = rCell(row, 'title');
        if (!missionId || (!url && !title)) return;
        const list = resourcesByMission.get(missionId) || [];
        list.push({
          type: normalizeResourceType(rCell(row, 'resourcetype')),
          label: title || 'Resource',
          url,
          order: toInt(rCell(row, 'resourceorder'), list.length + 1),
        });
        resourcesByMission.set(missionId, list);
      });
    }

    // --- collect mission rows ---
    const errors = [];
    const rows = [];
    missionSheet.eachRow((row, rowIndex) => {
      if (rowIndex <= header.rowNumber) return; // instructions + header
      const missionText = cellOf(row, 'todaysmission');
      const code = cellOf(row, 'missionid');
      const moduleName = cellOf(row, 'modulename');
      // Skip fully blank rows silently.
      const anyContent = code || missionText || moduleName
        || cellOf(row, 'missionobjective') || cellOf(row, 'briefdescription');
      if (!anyContent) return;
      if (!missionText && !code) {
        errors.push({ row: rowIndex, error: 'Row needs at least a Mission_ID or Todays_Mission' });
        return;
      }
      rows.push({ rowIndex, row, code, missionText, moduleName });
    });

    // --- resolve the target Builder Pack ---
    // Prefer an explicit frameworkId (the pack chosen in the UI) so content lands
    // in the RIGHT pack and we never silently create a stray "Practice OS" pack.
    // Only fall back to name-based upsert if the caller passed a name and no id.
    let framework;
    if (frameworkId) {
      framework = await Framework.findById(frameworkId);
      if (!framework) {
        return NextResponse.json({ success: false, error: 'Selected Builder Pack was not found. Refresh and choose a pack.' }, { status: 400 });
      }
    } else if (frameworkName) {
      const fwSlug = slugify(frameworkName) || 'practice-os';
      framework = await Framework.findOneAndUpdate(
        { slug: fwSlug },
        { $setOnInsert: { title: frameworkName, slug: fwSlug } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      return NextResponse.json({ success: false, error: 'Choose a Builder Pack to import into before uploading.' }, { status: 400 });
    }

    // --- group rows into missions, then upsert each with its modules[] ---
    // The product rule is ONE mission per day with MULTIPLE modules. In the sheet
    // that means several rows share a Mission_ID (or a week+day) — one row per
    // module. We group those rows and build the mission's modules[] from all of
    // them, so multiple modules per mission actually import (and re-import).
    const groups = new Map(); // key -> [rows in sheet order]
    for (const r of rows) {
      const gWeek = toInt(cellOf(r.row, 'weeknumber'), 1);
      const gDay = toInt(cellOf(r.row, 'daynumber'), 1);
      // A mission is ONE per Week+Day. Mission_ID in the template is per-MODULE
      // (e.g. "GBP-D1-M1", "GBP-D1-M2"), so it must NOT drive grouping — otherwise
      // each module row becomes its own mission. Group purely by Week+Day.
      const key = `wd:${gWeek}:${gDay}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const moduleTitles = new Set();
    let created = 0;
    let updated = 0;
    let totalModules = 0;
    let seq = 0;

    // Build one embedded module from a single row.
    const buildModuleFromRow = (row, order, fallbackTitle) => {
      const rc = (key) => cellOf(row, key);
      const modInputs = buildInputs([
        { label: rc('input1'), compulsory: rc('input1compulsorynotcompulsory') },
        { label: rc('input2'), compulsory: rc('input2compulsorynotcompulsory') },
        { label: rc('input3'), compulsory: rc('input3compulsorynotcompulsory') },
        { label: rc('input4'), compulsory: rc('input4compulsorynotcompulsory') },
      ]);
      const { buttons: modButtons } = buildButtonTriples([
        { text: rc('primarybuttontext'), action: rc('primarybuttonaction'), link: rc('primarybuttonlink') },
        { text: rc('secondarybuttontext'), action: rc('secondarybuttonaction'), link: rc('secondarybuttonlink') },
        { text: rc('tertiarybuttontext'), action: rc('tertiarybuttonaction'), link: rc('tertiarybuttonlink') },
      ]);
      // Per-module education = this row's Documentation/Article + its Resources
      // (Resources are keyed by Mission_ID, which is per-module in the template).
      const moduleResources = (resourcesByMission.get(rc('missionid')) || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(({ type, label, url }) => ({ type, label, url }));
      const moduleEducation = [
        ...buildDocEducation({ documentationUrl: rc('documentationurl'), articleUrl: rc('articleurl') }),
        ...moduleResources,
      ];
      return {
        title: rc('modulename') || rc('missionobjective') || fallbackTitle || `Module ${order + 1}`,
        order,
        xp: toInt(rc('xpreward'), 10),
        videoUrl: rc('videolink'),
        expectedOutcome: rc('expectedoutcome'),
        prerequisites: rc('prerequisites'),
        lecture: rc('briefdescription'),
        education: moduleEducation,
        steps: parseSubSteps(rc('stepbystepguide')),
        aiPrompt: rc('promptoutputwithplaceholder'),
        aiSystemPrompt: '',
        buttons: modButtons,
        inputs: modInputs.map((x) => ({ label: x.label, placeholder: '', required: !!x.required })),
      };
    };

    for (const [, groupRows] of groups) {
      seq += 1;
      try {
        // Representative row carries the mission-level fields.
        const rep = groupRows.find((r) => r.missionText) || groupRows[0];
        const c = (key) => cellOf(rep.row, key);

        const weekNumber = toInt(c('weeknumber'), 1);
        const dayNumber = toInt(c('daynumber'), 1);
        const missionNumber = toInt(c('missionnumber'), null)
          ?? toInt(c('daynumber'), null)
          ?? seq;

        // ALL modules for this mission, ordered by Module_Number (then sheet order).
        const sortedRows = groupRows
          .map((r, i) => ({ r, i, n: toInt(cellOf(r.row, 'modulenumber'), i + 1) }))
          .sort((a, b) => (a.n - b.n) || (a.i - b.i))
          .map((x) => x.r);
        const modules = sortedRows.map((r, i) => buildModuleFromRow(r.row, i, rep.missionText));
        totalModules += modules.length;

        // Standalone module doc for the mission's moduleId (keeps the unique key).
        const primaryModuleTitle = c('modulename') || 'General';
        moduleTitles.add(primaryModuleTitle);
        const mod = await Module.findOneAndUpdate(
          { frameworkId: framework._id, title: primaryModuleTitle },
          { $setOnInsert: { frameworkId: framework._id, title: primaryModuleTitle }, $set: { order: toInt(c('modulenumber'), 0) } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Mission-level fields from the representative row (per-module inputs live
        // on each module above). evidence.required if ANY module has a required input.
        const inputs = buildInputs([
          { label: c('input1'), compulsory: c('input1compulsorynotcompulsory') },
          { label: c('input2'), compulsory: c('input2compulsorynotcompulsory') },
          { label: c('input3'), compulsory: c('input3compulsorynotcompulsory') },
          { label: c('input4'), compulsory: c('input4compulsorynotcompulsory') },
        ]);
        const anyCompulsory = modules.some((m) => m.inputs.some((i) => i.required));

        const { buttons, actions } = buildButtonTriples([
          { text: c('primarybuttontext'), action: c('primarybuttonaction'), link: c('primarybuttonlink') },
          { text: c('secondarybuttontext'), action: c('secondarybuttonaction'), link: c('secondarybuttonlink') },
          { text: c('tertiarybuttontext'), action: c('tertiarybuttonaction'), link: c('tertiarybuttonlink') },
        ]);

        const resourceEducation = (resourcesByMission.get(rep.code) || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(({ type, label, url }) => ({ type, label, url }));
        const education = [
          ...buildDocEducation({ documentationUrl: c('documentationurl'), articleUrl: c('articleurl') }),
          ...resourceEducation,
        ];

        const successMessage = c('successmessage');
        const points = toInt(c('xpreward'), 10);

        const doc = {
          frameworkId: framework._id,
          moduleId: mod._id,
          weekNumber,
          dayNumber,
          missionNumber,
          code: rep.code,
          category: c('missioncategory'),
          scoreComponent: parseScoreComponent(c('missioncategory')),
          purpose: c('whythismatters'),
          missionText: rep.missionText,
          objective: c('missionobjective'),
          briefDescription: c('briefdescription'),
          lecture: c('briefdescription'),
          expectedOutcome: c('expectedoutcome'),
          prerequisites: c('prerequisites'),
          difficulty: c('difficultylevel'),
          subSteps: parseSubSteps(c('stepbystepguide')),
          estimatedMinutes: parseEstimatedTime(c('estimatedtime'), 35),
          lectureVideoUrl: c('videolink'),
          education,
          buttons,
          inputs,
          aiContext: { systemPrompt: c('promptoutputwithplaceholder'), model: '' },
          evidence: { required: anyCompulsory, allowedTypes: ['image', 'url', 'text'] },
          reward: { points, badge: '', message: successMessage },
          successMessage,
          failureMessage: c('failuremessage'),
          failureCriteria: c('failurecriteria'),
          nextMissionCode: c('nextmissionid'),
          status: parseStatus(c('status')),
          isActive: true,
          meta: {
            moduleId: c('moduleid'),
            createdBy: c('createdby'),
            version: c('version'),
            internalNotes: c('internalnotes'),
            feedbackForUs: c('feedbackforus'),
            notesToSelfEnabled: c('notestoselfenabled'),
            missionInputsFromDoctor: c('missioninputsfromdoctor'),
            instareelNumberLive: c('instareelnumberbeinglive'),
            gbpPotNumberLive: c('gbppotnumberthatisbeinglive'),
            buttonActions: actions,
          },
        };

        // Upsert by the STABLE mission identity: Week + Day (one mission per day).
        // We can't key on missionNumber — the renumber pass below rewrites it — nor
        // on the per-module Mission_ID, so re-import matches on Week + Day.
        const existing = await Mission.findOne({
          frameworkId: framework._id,
          weekNumber,
          dayNumber,
        });

        // The sheet is the source of truth, so modules[] is written on both create
        // and re-import — this is what makes multiple modules per mission stick.
        if (existing) {
          await Mission.updateOne({ _id: existing._id }, { $set: { ...doc, modules } });
          updated += 1;
        } else {
          await Mission.create({ ...doc, modules });
          created += 1;
        }
      } catch (rowError) {
        errors.push({ row: groupRows[0].rowIndex, error: rowError.message });
      }
    }

    // Give the pack's published missions clean, sequential missionNumbers (the
    // sheet may omit or duplicate them), so the UI shows Mission 1, 2, 3… in
    // curriculum order. Two-pass to avoid transient unique-index collisions.
    try {
      const pub = await Mission.find({ frameworkId: framework._id, status: 'published' })
        .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, createdAt: 1 })
        .select('_id').lean();
      for (let i = 0; i < pub.length; i++) await Mission.updateOne({ _id: pub[i]._id }, { $set: { missionNumber: 100000 + i } });
      for (let i = 0; i < pub.length; i++) await Mission.updateOne({ _id: pub[i]._id }, { $set: { missionNumber: i + 1 } });
    } catch (e) {
      console.error('[Practice OS import] renumber failed:', e.message);
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped: errors.length,
      total: rows.length + errors.length,
      frameworks: 1,
      modules: totalModules,
      resources: Array.from(resourcesByMission.values()).reduce((n, l) => n + l.length, 0),
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
