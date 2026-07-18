// One-time backfill: repair workflow steps whose templateId points to a
// deleted MessageTemplate (orphaned ref). Reassign each orphaned step to the
// doctor's current template for that step's channel. Orphaned refs break both
// editing (validation 500) and automation (template not found → nothing sends).
//
//   node scripts/backfill-workflow-templates.mjs
//
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;
const Workflows = db.collection('workflows');
const Templates = db.collection('messagetemplates');

const workflows = await Workflows.find({}).toArray();

// Cache templates per doctor: { doctorId: { valid:Set, sms:id, email:id } }
const cache = new Map();
async function templatesFor(doctorId) {
  const key = String(doctorId);
  if (cache.has(key)) return cache.get(key);
  const tpls = await Templates.find({ doctorId }).toArray();
  const info = {
    valid: new Set(tpls.map(t => String(t._id))),
    sms: tpls.find(t => t.channel === 'sms')?._id,
    email: tpls.find(t => t.channel === 'email')?._id,
  };
  cache.set(key, info);
  return info;
}

let wfFixed = 0, stepsFixed = 0, unresolved = 0;
for (const w of workflows) {
  const info = await templatesFor(w.doctorId);
  let changed = false;
  const steps = (w.steps || []).map((s) => {
    const ok = s.templateId && info.valid.has(String(s.templateId));
    if (ok) return s;
    const replacement = s.channel === 'email' ? info.email : info.sms;
    if (!replacement) { unresolved++; return s; }
    changed = true; stepsFixed++;
    return { ...s, templateId: replacement };
  });
  if (changed) {
    await Workflows.updateOne({ _id: w._id }, { $set: { steps } });
    wfFixed++;
  }
}

console.log('workflows updated:', wfFixed, '| steps repaired:', stepsFixed, '| unresolved (no template for channel):', unresolved);
await mongoose.disconnect();
