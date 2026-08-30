import mongoose from 'mongoose';

/**
 * Practice OS — admin-managed profile field.
 *
 * Overlays the built-in default profile fields (lib/practice-os/profile-fields-
 * defaults): a config whose `key` matches a default overrides its label/hint/
 * required or hides it; a config with a new key adds a custom field the doctor
 * fills during setup. Global (not per-doctor). (#39)
 */
const ProfileFieldConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true }, // snake_case; matches a default to override it, or new = custom
  label: { type: String, trim: true, default: '' },
  hint: { type: String, trim: true, default: '' },
  type: { type: String, enum: ['text', 'textarea', 'number', 'select', 'tags'], default: 'text' },
  options: { type: [String], default: [] }, // for select / tags
  required: { type: Boolean, default: false },
  // A built-in section id ('pro'/'practice'/'voice') or a custom snake_case id the
  // admin created. Custom sections are rendered from `sectionTitle`. (no longer an
  // enum — admins can add their own sections)
  section: { type: String, trim: true, default: 'pro' },
  // Display title for a custom section (ignored for built-in sections).
  sectionTitle: { type: String, trim: true, default: '' },
  order: { type: Number, default: null },
  hidden: { type: Boolean, default: false }, // hide a default field
}, { timestamps: true });

export default mongoose.models.ProfileFieldConfig
  || mongoose.model('ProfileFieldConfig', ProfileFieldConfigSchema);
