import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import { MISSION_COLUMNS } from '@/lib/practice-os/import-helpers';
import { resolveMissionModules } from '@/lib/practice-os/modules';
import { slugify } from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/frameworks/[id]/export
// Exports ONE pack's full curriculum (every mission + every module) as an .xlsx
// in the same "Mission_Content_Master" layout the importer reads — one row per
// module, mission-level fields on the first module row — so a pack can be backed
// up, edited in Excel and re-imported. Two extra columns (hidden prompt + input
// variable names) preserve fields the base template lacks; the importer ignores
// unknown columns. (#31)
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const framework = await Framework.findById(id).lean();
    if (!framework) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });

    const missions = await Mission.find({ frameworkId: id })
      .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, createdAt: 1 }).lean();

    const COLUMNS = [...MISSION_COLUMNS, 'Hidden_Assistant_Prompt', 'input-1_variable', 'input-2_variable', 'input-3_variable', 'input-4_variable'];
    const rows = [];

    for (const mission of missions) {
      const modules = resolveMissionModules(mission);
      modules.forEach((mod, mi) => {
        const first = mi === 0;                 // mission-level fields go on the first module row
        const b = mod.buttons || [];
        const edu = mod.education || [];
        const docRes = edu.find((e) => /doc/i.test(e.label)) || edu[0] || null;
        const artRes = edu.find((e) => /article|blog|read/i.test(e.label)) || edu[1] || null;
        const inp = mod.inputs || [];
        const compulsory = (f) => (f ? (f.required ? 'compulsory' : 'not compulsory') : '');

        rows.push({
          Mission_ID: String(mission._id),
          Day_Number: mission.dayNumber ?? '',
          Week_Number: mission.weekNumber ?? '',
          Mission_Number: mission.missionNumber ?? '',
          Todays_Mission: first ? (mission.missionText || '') : '',
          Mission_Category: first ? (mission.category || '') : '',
          Mission_Objective: first ? (mission.objective || '') : '',
          Brief_Description: first ? (mission.briefDescription || '') : '',
          Why_This_Matters: first ? (mission.purpose || '') : '',
          Estimated_Time: first && mission.estimatedMinutes ? `${mission.estimatedMinutes} min` : '',
          Difficulty_Level: first ? (mission.difficulty || '') : '',
          Module_ID: String(mod.id || `${mission._id}-m${mi + 1}`),
          Module_Number: mi + 1,
          Module_Name: mod.title || '',
          Expected_Outcome: mod.expectedOutcome || '',
          Prerequisites: mod.prerequisites || '',
          Step_By_Step_Guide: (mod.steps || []).join('\n'),
          Video_Link: mod.videoUrl || '',
          Prompt_output_with_placeholder: mod.aiPrompt || '',
          XP_Reward: mod.xp ?? '',
          Primary_Button_Text: b[0]?.label || '',
          Primary_Button_Action: b[0] ? 'link' : '',
          Primary_button_link: b[0]?.url || '',
          Secondary_button_text: b[1]?.label || '',
          Secondary_button_action: b[1] ? 'link' : '',
          Secondary_button_link: b[1]?.url || '',
          Tertiary_button_text: b[2]?.label || '',
          Tertiary_button_action: b[2] ? 'link' : '',
          Tertiary_button_link: b[2]?.url || '',
          Documentation_URL: docRes?.url || '',
          Article_URL: artRes?.url || '',
          'input-1': inp[0]?.label || '',
          'input-1_compulsory/not_compulsory': compulsory(inp[0]),
          'input_2': inp[1]?.label || '',
          'input-2_compulsory/not_compulsory': compulsory(inp[1]),
          'input_3': inp[2]?.label || '',
          'input-3_compulsory/not_compulsory': compulsory(inp[2]),
          'input_4': inp[3]?.label || '',
          'input-4_compulsory/not_compulsory': compulsory(inp[3]),
          Success_Message: first ? (mission.reward?.message || '') : '',
          Status: mission.status === 'published' ? 'live' : 'draft',
          // Extra (non-template) columns so nothing is lost in the file.
          Hidden_Assistant_Prompt: mod.aiSystemPrompt || '',
          'input-1_variable': inp[0]?.variable || '',
          'input-2_variable': inp[1]?.variable || '',
          'input-3_variable': inp[2]?.variable || '',
          'input-4_variable': inp[3]?.variable || '',
        });
      });
    }

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Mission_Content_Master');
    sheet.columns = COLUMNS.map((c) => ({ header: c, key: c, width: 22 }));
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096B17' } };
      cell.alignment = { horizontal: 'center' };
    });
    rows.forEach((r) => sheet.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    const name = slugify(framework.title) || 'pack';
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${name}-curriculum.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[Practice OS pack export]', error);
    return NextResponse.json({ success: false, error: 'Failed to export pack' }, { status: 500 });
  }
}
