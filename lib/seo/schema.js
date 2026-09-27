// JSON-LD structured data for doctor sites.
//
// Google recommends Physician / MedicalClinic (both LocalBusiness subtypes) for
// medical-practice sites. We emit ONLY real information present on the site — no
// invented ratings, reviews, awards or medical claims (per NMC + Google policy).
// Every field is added conditionally, so a sparse profile simply yields a smaller
// (still valid) graph.

const isUrl = (s) => /^https?:\/\//i.test(String(s || '').trim());
const clean = (s) => String(s || '').trim();

// +91-normalised phone for tel/telephone fields (10-digit Indian mobiles).
function telephone(...candidates) {
  for (const c of candidates) {
    const raw = clean(c);
    if (!raw) continue;
    if (raw.startsWith('+')) return raw;
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= 11 && digits.length <= 13) return `+${digits}`;
  }
  return '';
}

function postalAddress(clinic, fields) {
  const a = clinic?.address || {};
  const street = clean(a.street) || clean(fields?.clinic_address);
  const city = clean(a.city) || clean(fields?.city);
  const state = clean(a.state) || clean(fields?.state);
  const pincode = clean(a.pincode) || clean(fields?.pin_code);
  const country = clean(a.country) || 'India';
  if (!street && !city && !state && !pincode) return null;
  const addr = { '@type': 'PostalAddress', addressCountry: country };
  if (street) addr.streetAddress = street;
  if (city) addr.addressLocality = city;
  if (state) addr.addressRegion = state;
  if (pincode) addr.postalCode = pincode;
  return addr;
}

// Real, valid external profiles only (GBP, existing site, social handles).
function sameAs(doctor, fields) {
  const out = [];
  const push = (v) => { const s = clean(v); if (isUrl(s) && !out.includes(s)) out.push(s); };
  push(doctor?.googleReviewLink);
  push(doctor?.existingWebsiteUrl);
  for (const k of ['gbp_link', 'website_url', 'instagram_url', 'facebook_url', 'youtube_url', 'linkedin_url', 'instagram', 'facebook', 'youtube', 'linkedin']) {
    push(fields?.[k]);
  }
  return out;
}

function servicesList(clinic, fields) {
  const raw = [];
  if (Array.isArray(clinic?.services)) raw.push(...clinic.services);
  if (fields?.procedures) raw.push(...String(fields.procedures).split(/[,\n;|]/));
  const seen = new Set();
  const names = [];
  for (const s of raw) {
    const n = clean(s);
    const key = n.toLowerCase();
    if (n && !seen.has(key)) { seen.add(key); names.push(n); }
  }
  return names.slice(0, 30).map((name) => ({ '@type': 'MedicalProcedure', name }));
}

/**
 * The doctor/clinic graph for the homepage: a Physician node (carrying address,
 * geo, services, contact) + a WebSite node. Returns null if there's not enough
 * real data to say anything useful.
 */
export function buildDoctorGraph({ doctor, clinics = [], fields = {}, bookingPage, baseUrl }) {
  if (!doctor || !baseUrl) return null;
  const name = clean(doctor.displayName) || clean(doctor.name);
  if (!name) return null;

  const primary = clinics.find((c) => c.isPrimary) || clinics[0] || null;
  const clinicName = clean(doctor.clinicName) || clean(primary?.name) || clean(fields.clinic_name) || `${name}'s Clinic`;
  const tel = telephone(doctor.whatsappNumber, primary?.phone, doctor.phone, fields.appointment_number, fields.whatsapp_number);
  const address = postalAddress(primary, fields);
  const services = servicesList(primary, fields);
  const links = sameAs(doctor, fields);
  const description = clean(doctor.bio) || clean(bookingPage?.metaDescription);
  const image = clean(doctor.profileImage) || clean(primary?.images?.[0]?.url);

  const physician = {
    '@type': 'Physician',
    '@id': `${baseUrl}/#physician`,
    name,
    url: baseUrl,
  };
  if (clinicName) physician.legalName = clinicName;
  if (image) physician.image = image;
  if (description) physician.description = description;
  if (doctor.specialization) physician.medicalSpecialty = clean(doctor.specialization);
  if (tel) physician.telephone = tel;
  if (clean(primary?.email)) physician.email = clean(primary.email);
  if (address) physician.address = address;
  if (primary?.coordinates?.lat != null && primary?.coordinates?.lng != null) {
    physician.geo = { '@type': 'GeoCoordinates', latitude: primary.coordinates.lat, longitude: primary.coordinates.lng };
  }
  if (isUrl(primary?.mapUrl)) physician.hasMap = clean(primary.mapUrl);
  if (services.length) physician.availableService = services;
  if (links.length) physician.sameAs = links;
  if (clean(doctor.qualification)) {
    physician.hasCredential = { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: clean(doctor.qualification) };
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: clinicName || name,
    publisher: { '@id': `${baseUrl}/#physician` },
  };

  const graph = [physician, website];

  // Extra locations beyond the primary → their own MedicalClinic nodes.
  for (const c of clinics) {
    if (c === primary) continue;
    const addr = postalAddress(c, {});
    if (!addr && !clean(c.name)) continue;
    const node = { '@type': 'MedicalClinic', name: clean(c.name) || clinicName, parentOrganization: { '@id': `${baseUrl}/#physician` } };
    if (addr) node.address = addr;
    const ctel = telephone(c.phone);
    if (ctel) node.telephone = ctel;
    if (c.coordinates?.lat != null && c.coordinates?.lng != null) node.geo = { '@type': 'GeoCoordinates', latitude: c.coordinates.lat, longitude: c.coordinates.lng };
    if (isUrl(c.mapUrl)) node.hasMap = clean(c.mapUrl);
    graph.push(node);
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Article + (optional) FAQPage + BreadcrumbList for a blog article page.
 */
export function buildArticleGraph({ article, doctor, baseUrl, pageUrl }) {
  if (!article || !baseUrl || !pageUrl) return null;
  const authorName = clean(doctor?.displayName) || clean(doctor?.name);
  const graph = [];

  const articleNode = {
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    headline: clean(article.title).slice(0, 110),
    mainEntityOfPage: pageUrl,
    url: pageUrl,
  };
  if (clean(article.metaDescription) || clean(article.excerpt)) articleNode.description = (clean(article.metaDescription) || clean(article.excerpt)).slice(0, 300);
  if (isUrl(article.featuredImage?.url)) articleNode.image = clean(article.featuredImage.url);
  if (article.publishedAt) articleNode.datePublished = new Date(article.publishedAt).toISOString();
  if (article.updatedAt) articleNode.dateModified = new Date(article.updatedAt).toISOString();
  if (authorName) articleNode.author = { '@type': 'Person', name: authorName, url: baseUrl };
  articleNode.publisher = { '@id': `${baseUrl}/#physician` };
  graph.push(articleNode);

  const faqs = (article.faqSection?.faqs || []).filter((f) => clean(f.question) && clean(f.answer));
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqs.slice(0, 10).map((f) => ({
        '@type': 'Question',
        name: clean(f.question).slice(0, 300),
        acceptedAnswer: { '@type': 'Answer', text: clean(f.answer).slice(0, 1200) },
      })),
    });
  }

  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: clean(article.title).slice(0, 110), item: pageUrl },
    ],
  });

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Render helper — the exact <script> string callers inject. */
export function jsonLdScript(data) {
  if (!data) return null;
  // Escape "<" to avoid breaking out of the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
