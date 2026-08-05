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

    const frameworkName = String(formData.get('frameworkName') || '').trim() || 'Practice OS';

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

    // --- upsert framework (single, shared) ---
    const fwSlug = slugify(frameworkName) || 'practice-os';
    const framework = await Framework.findOneAndUpdate(
      { slug: fwSlug },
      { $setOnInsert: { title: frameworkName, slug: fwSlug } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // --- upsert modules + missions ---
    const moduleCache = new Map(); // title -> module doc
    let created = 0;
    let updated = 0;
    let seq = 0;

    for (const r of rows) {
      seq += 1;
      try {
        const c = (key) => cellOf(r.row, key);

        // Module (upsert by framework + title; default title when blank)
        const moduleTitle = r.moduleName || 'General';
        let mod = moduleCache.get(moduleTitle);
        if (!mod) {
          const order = toInt(c('modulenumber'), moduleCache.size);
          mod = await Module.findOneAndUpdate(
            { frameworkId: framework._id, title: moduleTitle },
            { $setOnInsert: { frameworkId: framework._id, title: moduleTitle }, $set: { order } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          moduleCache.set(moduleTitle, mod);
        }

        const weekNumber = toInt(c('weeknumber'), 1);
        const dayNumber = toInt(c('daynumber'), 1);
        const missionNumber = toInt(c('missionnumber'), null)
          ?? toInt(c('daynumber'), null)
          ?? seq;

        // Inputs (input-1..4 + compulsory columns)
        const inputs = buildInputs([
          { label: c('input1'), compulsory: c('input1compulsorynotcompulsory') },
          { label: c('input2'), compulsory: c('input2compulsorynotcompulsory') },
          { label: c('input3'), compulsory: c('input3compulsorynotcompulsory') },
          { label: c('input4'), compulsory: c('input4compulsorynotcompulsory') },
        ]);
        const anyCompulsory = inputs.some((i) => i.required);

        // Buttons (primary / secondary / tertiary triples)
        const { buttons, actions } = buildButtonTriples([
          { text: c('primarybuttontext'), action: c('primarybuttonaction'), link: c('primarybuttonlink') },
          { text: c('secondarybuttontext'), action: c('secondarybuttonaction'), link: c('secondarybuttonlink') },
          { text: c('tertiarybuttontext'), action: c('tertiarybuttonaction'), link: c('tertiarybuttonlink') },
        ]);

        // Education = Documentation/Article + Resources sheet rows (sorted by order)
        const resourceEducation = (resourcesByMission.get(r.code) || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(({ type, label, url }) => ({ type, label, url }));
        const education = [
          ...buildDocEducation({
            documentationUrl: c('documentationurl'),
            articleUrl: c('articleurl'),
          }),
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
          code: r.code,
          category: c('missioncategory'),
          scoreComponent: parseScoreComponent(c('missioncategory')),
          purpose: c('whythismatters'),
          missionText: r.missionText,
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
          evidence: {
            required: anyCompulsory,
            allowedTypes: ['image', 'url', 'text'],
          },
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

        // Prefer keying by Mission_ID (code) within this framework; otherwise
        // fall back to the {framework, module, week, day, missionNumber} unique key.
        let existing = null;
        if (r.code) existing = await Mission.findOne({ frameworkId: framework._id, code: r.code });
        if (!existing) {
          existing = await Mission.findOne({
            frameworkId: framework._id,
            moduleId: mod._id,
            weekNumber,
            dayNumber,
            missionNumber,
          });
        }

        if (existing) {
          // Don't overwrite admin-authored modules[] on re-import.
          await Mission.updateOne({ _id: existing._id }, { $set: doc });
          updated += 1;
        } else {
          // New missions are module-native: seed a single module from the row's
          // rich fields so the content lives in modules[] (editable in the admin).
          const importedModule = {
            title: c('missionobjective') || r.missionText || 'Complete this mission',
            order: 0,
            xp: points,
            videoUrl: c('videolink'),
            expectedOutcome: c('expectedoutcome'),
            prerequisites: c('prerequisites'),
            steps: parseSubSteps(c('stepbystepguide')),
            aiPrompt: c('promptoutputwithplaceholder'),
            aiSystemPrompt: '',
            buttons,
            inputs: inputs.map((i) => ({ label: i.label, placeholder: '', required: !!i.required })),
          };
          await Mission.create({ ...doc, modules: [importedModule] });
          created += 1;
        }
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
      frameworks: 1,
      modules: moduleCache.size,
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
