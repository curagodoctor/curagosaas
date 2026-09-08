// One-off backfill: for every doctor with a customDomain, run the SAME live check
// the "Verify" button uses and persist customDomainVerified. This flips on the
// subdomain->customDomain 301 only for domains that are actually serving.
//   node --env-file=.env.local scripts/backfill-domain-verified.mjs           (dry run)
//   node --env-file=.env.local scripts/backfill-domain-verified.mjs --apply   (writes)
import mongoose from 'mongoose';
import { domainServesOurSite } from '../lib/domainLive.js';

const APPLY = process.argv.includes('--apply');

await mongoose.connect(process.env.MONGODB_URI);
const doctors = mongoose.connection.collection('doctors');

const list = await doctors.find(
  { customDomain: { $ne: null, $exists: true } },
  { projection: { name: 1, subdomain: 1, customDomain: 1, customDomainVerified: 1 } },
).toArray();

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${list.length} doctor(s) with a custom domain\n`);

for (const d of list) {
  const cd = d.customDomain;
  // Authoritative gate: does the domain actually serve our site over HTTPS now?
  const connected = await domainServesOurSite(cd);
  const was = d.customDomainVerified === undefined ? '(absent)' : d.customDomainVerified;
  console.log(`  ${d.name} | ${d.subdomain} | ${cd} : ${was} -> ${connected}`);
  if (APPLY) {
    await doctors.updateOne(
      { _id: d._id },
      { $set: { customDomainVerified: connected, customDomainVerifiedAt: connected ? new Date() : null } },
    );
  }
}

console.log(`\nDone.${APPLY ? '' : '  Re-run with --apply to write.'}`);
await mongoose.disconnect();
