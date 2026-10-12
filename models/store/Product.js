import mongoose from 'mongoose';

/**
 * A store product — a book (PDF/DOCX/TXT read in-app) or a video course (streamed
 * from GCS). Created and priced by a platform admin; shown on the public /store
 * page. Owning one == having a completed StorePurchase for (doctor, product).
 */
const LessonSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  videoRef: { type: String, default: '' },      // gs:// URI (streamed via signed URL)
  durationLabel: { type: String, default: '' },  // e.g. "12 min" (free text)
  order: { type: Number, default: 0 },
}, { _id: true });

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['book', 'course'], required: true },

  summary: { type: String, default: '' },        // short — the card
  description: { type: String, default: '' },     // long — the detail/buy view
  coverImage: { type: String, default: '' },      // gs:// URI or external image URL

  priceInInr: { type: Number, default: 0 },       // FINAL price shown & charged (GST-inclusive); 0 = free

  // Book
  fileRef: { type: String, default: '' },         // gs:// to the PDF/DOCX/TXT
  fileType: { type: String, default: '' },        // 'pdf' | 'docx' | 'txt'
  readerHtml: { type: String, default: '' },      // extracted, sanitized content for the in-app reader

  // Course
  lessons: { type: [LessonSchema], default: [] },

  isPublished: { type: Boolean, default: false, index: true },
  order: { type: Number, default: 0 },            // display order on the store
}, { timestamps: true });

export default mongoose.models.StoreProduct || mongoose.model('StoreProduct', ProductSchema);
