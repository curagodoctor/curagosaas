'use client';

// Shared client-side image validation for website-building uploads. We only
// accept photos that fit the slot they're going into:
//   - 'landscape' (hero / website photos): wide, not tall — min 1200×675.
//   - 'portrait'  (profile headshot): tall, not wide — min 600×750.
// This blocks a portrait dropped into a landscape slot (and vice-versa) and
// rejects images that are too small to render cleanly.

export const IMAGE_RULES = {
  landscape: { minW: 1200, minH: 675, orient: 'landscape', label: 'landscape (wide)', example: '1600×900' },
  portrait: { minW: 600, minH: 750, orient: 'portrait', label: 'portrait (tall)', example: '800×1000' },
};

// Read a file's pixel dimensions in the browser.
export function readImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
    img.src = url;
  });
}

// Validate a file for a given kind. Returns { ok, error, width, height }.
export async function validateImage(file, kind) {
  const rule = IMAGE_RULES[kind];
  if (!rule) return { ok: true };
  let size;
  try { size = await readImageSize(file); }
  catch { return { ok: false, error: 'Could not read this image — try another file.' }; }
  const { width, height } = size;

  const isLandscape = width > height;
  const isPortrait = height > width;

  if (rule.orient === 'landscape' && !isLandscape) {
    return { ok: false, width, height, error: `This needs a landscape (wide) photo — you uploaded a ${isPortrait ? 'portrait (tall)' : 'square'} one. Please upload a wide photo, e.g. ${rule.example}.` };
  }
  if (rule.orient === 'portrait' && !isPortrait) {
    return { ok: false, width, height, error: `Your profile photo must be a portrait (tall) photo — you uploaded a ${isLandscape ? 'landscape (wide)' : 'square'} one. Please upload a tall headshot, e.g. ${rule.example}.` };
  }
  if (width < rule.minW || height < rule.minH) {
    return { ok: false, width, height, error: `This image is too small (${width}×${height}). Please upload at least ${rule.minW}×${rule.minH} px (recommended ${rule.example}).` };
  }
  return { ok: true, width, height };
}
