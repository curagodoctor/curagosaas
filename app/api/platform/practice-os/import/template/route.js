import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { MISSION_COLUMNS, RESOURCE_COLUMNS } from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/platform/practice-os/import/template
 * A pre-formatted, filled-in .xlsx sample matching the importer:
 *  - "Instructions" sheet explaining the format.
 *  - "Mission_Content_Master" with the header + a worked example that shows the
 *    KEY rule: one mission per Week+Day, one ROW per module. The example has a
 *    3-module mission (W1/D1) and a 1-module mission (W1/D2).
 *  - "Resources" keyed by Mission_ID (per module).
 */
export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const styleHeader = (row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096B17' } };
      cell.alignment = { horizontal: 'center' };
    });
  };

  // Build a full row array from a { columnName: value } object, so the example is
  // readable and stays correct if column order ever changes.
  const row = (obj) => MISSION_COLUMNS.map((name) => (obj[name] ?? ''));

  // --- Instructions ---
  const info = workbook.addWorksheet('Instructions');
  info.columns = [{ width: 100 }];
  [
    'HOW TO FILL THIS IN',
    '',
    '1. One MISSION = one Week + Day. All rows that share the same Week_Number AND Day_Number become a single mission.',
    '2. One ROW = one MODULE. To give a mission several modules, add several rows with the SAME Week/Day and different Module_Number (1, 2, 3…).',
    '3. Put the mission-level fields (Todays_Mission, Mission_Objective, Why_This_Matters, Category) on the FIRST module row of the mission. Later module rows only need their module fields.',
    '4. Mission_Number should match the mission (same on every module row of that mission). Module_Number orders the modules within the mission.',
    '5. Mission_ID is a free label per row (it is NOT used to group — Week+Day is). Keep it unique if you like.',
    '6. input-1..4 + their compulsory columns become the module inputs. "compulsory" means the doctor cannot finish the module until it is filled.',
    '7. Video_Link can be a YouTube/Vimeo URL. Buttons, Documentation_URL and Article_URL are optional.',
    '8. The "Resources" sheet (optional) adds extra links to a module, matched by Mission_ID.',
    '',
    'The example in Mission_Content_Master shows a 3-module mission (Week 1 / Day 1) and a 1-module mission (Week 1 / Day 2).',
  ].forEach((line, i) => {
    const r = info.addRow([line]);
    if (i === 0) r.getCell(1).font = { bold: true, size: 14 };
  });

  // --- Mission_Content_Master ---
  const missions = workbook.addWorksheet('Mission_Content_Master');
  styleHeader(missions.addRow(MISSION_COLUMNS));
  missions.columns = MISSION_COLUMNS.map(() => ({ width: 22 }));

  // Mission 1 (Week 1, Day 1) — three modules.
  missions.addRow(row({
    Mission_ID: 'GBP-D1-M1', Week_Number: 1, Day_Number: 1, Mission_Number: 1,
    Todays_Mission: 'Create your Google Business Profile and add clinic name, address and phone.',
    Mission_Category: 'Google Business Profile',
    Mission_Objective: 'Get your clinic listed so nearby patients can find you.',
    Why_This_Matters: 'A complete profile is the single biggest driver of local search visibility.',
    Estimated_Time: '35 min', Difficulty_Level: 'Easy',
    Module_ID: 'MOD-GBP-1', Module_Number: 1, Module_Name: 'Create your Google Business Profile',
    Brief_Description: 'Set up and verify a Google Business Profile for your clinic.',
    Step_By_Step_Guide: '1. Open Google Business Profile\n2. Enter clinic name, address, phone\n3. Submit for verification',
    Video_Link: 'https://youtu.be/example',
    Prompt_output_with_placeholder: 'Help this doctor create a complete, NMC-compliant Google Business Profile. Stay on this task only.',
    XP_Reward: 4,
    'Primary_Button_Text': 'Open GBP', 'Primary_Button_Action': 'link', 'Primary_button_link': 'https://business.google.com',
    Documentation_URL: 'https://support.google.com/business',
    'input-1': 'Clinic name', 'input-1_compulsory/not_compulsory': 'compulsory',
    'input_2': 'Clinic phone', 'input-2_compulsory/not_compulsory': 'compulsory',
    Success_Message: 'Your clinic is now on the map.', Status: 'live',
  }));
  missions.addRow(row({
    Mission_ID: 'GBP-D1-M2', Week_Number: 1, Day_Number: 1, Mission_Number: 1,
    Module_ID: 'MOD-GBP-2', Module_Number: 2, Module_Name: 'Write your GBP business description',
    Brief_Description: 'Write a clear, compliant description of your practice.',
    Step_By_Step_Guide: '1. Open your profile\n2. Add a 750-character description\n3. Save',
    XP_Reward: 3,
    'input-1': 'Business description', 'input-1_compulsory/not_compulsory': 'compulsory', Status: 'live',
  }));
  missions.addRow(row({
    Mission_ID: 'GBP-D1-M3', Week_Number: 1, Day_Number: 1, Mission_Number: 1,
    Module_ID: 'MOD-GBP-3', Module_Number: 3, Module_Name: 'Add your first 5 services',
    Brief_Description: 'List your key services so patients can find them.',
    Step_By_Step_Guide: '1. Open Services\n2. Add 5 services\n3. Save',
    XP_Reward: 3,
    'input-1': 'Services added (comma separated)', 'input-1_compulsory/not_compulsory': 'compulsory', Status: 'live',
  }));

  // Mission 2 (Week 1, Day 2) — one module.
  missions.addRow(row({
    Mission_ID: 'REEL-D2-M1', Week_Number: 1, Day_Number: 2, Mission_Number: 2,
    Todays_Mission: 'Script your first 5 Instagram & Facebook reels.',
    Mission_Category: 'Social presence',
    Mission_Objective: 'Have 5 ready-to-record reel scripts.',
    Why_This_Matters: 'Short video builds trust and reach faster than posts.',
    Estimated_Time: '40 min', Difficulty_Level: 'Medium',
    Module_ID: 'MOD-REEL-1', Module_Number: 1, Module_Name: 'Write 5 reel scripts',
    Brief_Description: 'Draft five 30-second scripts on common patient questions.',
    Step_By_Step_Guide: '1. Pick 5 FAQs\n2. Write a 30s script for each\n3. Save',
    XP_Reward: 5,
    'input-1': 'Reel script 1', 'input-1_compulsory/not_compulsory': 'compulsory', Status: 'live',
  }));

  // --- Resources (optional; matched to a module by Mission_ID) ---
  const resources = workbook.addWorksheet('Resources');
  styleHeader(resources.addRow(RESOURCE_COLUMNS));
  resources.columns = RESOURCE_COLUMNS.map(() => ({ width: 22 }));
  resources.addRow(['GBP-D1-M1', 1, 'Video', 'Official GBP Tutorial', 'https://example.com/video', 'Yes', 'Primary tutorial']);
  resources.addRow(['REEL-D2-M1', 1, 'Article', 'Reel scripting guide', 'https://example.com/reels', 'No', 'Reference']);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="practice-os-content-template.xlsx"',
    },
  });
}
