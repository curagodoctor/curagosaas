// Generates a realistic sample mission sheet (practice-os-sample.xlsx) at the
// repo root. Open it, tweak the content, and upload it via
// Platform Admin → Practice OS → Import Missions to see the full flow.
//
//   node scripts/practice-os-sample.mjs
//
import ExcelJS from 'exceljs';
import { IMPORT_COLUMNS } from '../lib/practice-os/import-helpers.js';

const rows = [
  // Framework, Module, Week, Day, MissionNo, Category, Purpose, Mission, Video, PDF, Link, GPT, BL1, BU1, BL2, BU2, Evidence, Reward, Celebration, KPI, Completion, Unlock
  ['Practice Building', 'Google Business Profile', 1, 1, 1, 'Google Business Profile',
    'A complete Google Business Profile is how local patients find you.',
    'Create your Google Business Profile with clinic name, address, phone and hours.',
    'https://youtu.be/example1', '', 'https://business.google.com',
    'You are helping this doctor create a complete, NMC-compliant Google Business Profile. Only help with this task.',
    'Open GBP', 'https://business.google.com', '', '', 'image', 10,
    'Your clinic is now on the map!', 'Google Business Profile Views', 'Screenshot of live profile', 1],
  ['Practice Building', 'Google Business Profile', 1, 2, 2, 'Google Business Profile',
    'Photos build trust before a patient ever calls.',
    'Add at least 5 high-quality photos of your clinic and team.',
    '', '', 'https://business.google.com', 'Help this doctor choose and caption clinic photos for GBP.',
    'Open GBP', 'https://business.google.com', 'Open Canva', 'https://canva.com', 'image', 10,
    'Looking professional!', 'Google Business Profile Views', 'Screenshot of photos added', 1],
  ['Practice Building', 'Reviews', 1, 3, 3, 'Reviews',
    'Reviews are the single biggest driver of local trust.',
    'Send review requests to your last 10 happy patients.',
    'https://youtu.be/example3', '', '', 'Help this doctor write a warm, compliant review-request message.',
    'Copy Message', '', '', '', 'text', 15,
    'First reviews on the way!', 'Google Reviews', 'Number of requests sent', 1],
  ['Practice Building', 'Website', 2, 1, 4, 'Website',
    'A simple website converts searches into appointments.',
    'Publish your CuraGo booking website and set your consultation hours.',
    '', 'https://example.com/website-guide.pdf', 'https://curago.in', 'Help this doctor write clear website copy for their clinic.',
    'Create Website', 'https://curago.in', '', '', 'url', 20,
    'You are live online!', 'Website Visitors, Appointments', 'Website URL', 1],
  ['Practice Building', 'Instagram', 2, 2, 5, 'Instagram',
    'Instagram keeps you visible between visits.',
    'Create your clinic Instagram account and write an NMC-compliant bio.',
    'https://youtu.be/example5', '', 'https://instagram.com', 'Create an NMC-compliant Instagram bio for this doctor. Do not answer outside this scope.',
    'Open Instagram', 'https://instagram.com', 'Open Canva', 'https://canva.com', 'image', 15,
    'Your practice is on Instagram!', 'Instagram Followers', 'Screenshot of profile', 1],
];

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Missions');
const header = ws.addRow(IMPORT_COLUMNS);
header.eachCell((cell) => {
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
});
ws.columns = IMPORT_COLUMNS.map(() => ({ width: 22 }));
rows.forEach((r) => ws.addRow(r));

await wb.xlsx.writeFile('practice-os-sample.xlsx');
console.log('Wrote practice-os-sample.xlsx (' + rows.length + ' missions). Upload it via Practice OS → Import Missions.');
