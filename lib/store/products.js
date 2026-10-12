import StoreProduct from '@/models/store/Product';
import { getSignedReadUrl, isGsUri } from '@/lib/gcs';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

// Cover images may be stored as gs:// (private) or an external URL. Resolve to
// something a browser can load (short-lived signed URL for gs://).
async function resolveCover(coverImage) {
  if (!coverImage) return '';
  if (isGsUri(coverImage)) { try { return (await getSignedReadUrl(coverImage)) || ''; } catch { return ''; } }
  return coverImage;
}

// Public card shape (no file refs, no readerHtml — never leak the asset).
export async function toCard(p) {
  return {
    id: String(p._id),
    slug: p.slug,
    title: p.title,
    type: p.type,
    summary: p.summary || '',
    description: p.description || '',
    priceInInr: p.priceInInr || 0,
    isFree: !(p.priceInInr > 0),
    coverUrl: await resolveCover(p.coverImage),
    lessonCount: p.type === 'course' ? (p.lessons?.length || 0) : 0,
  };
}

/** All published products as public cards, in display order. */
export async function getPublishedCards() {
  const products = await StoreProduct.find({ isPublished: true }).select('-readerHtml').sort({ order: 1, createdAt: -1 }).lean();
  return Promise.all(products.map(toCard));
}

export async function getProductByIdOrSlug(key) {
  if (!key) return null;
  const byId = /^[a-f0-9]{24}$/i.test(key) ? await StoreProduct.findById(key).lean() : null;
  return byId || StoreProduct.findOne({ slug: key }).lean();
}

/** Authoritative server-side price (never trust the client). 0 = free. */
export async function getProductPriceInr(productId) {
  const p = await StoreProduct.findById(productId).select('priceInInr isPublished').lean();
  if (!p || !p.isPublished) return null; // not purchasable
  return p.priceInInr || 0;
}

export async function uniqueSlug(title, existingId = null) {
  let base = slugify(title) || 'product';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await StoreProduct.findOne({ slug, ...(existingId ? { _id: { $ne: existingId } } : {}) }).select('_id').lean()) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
