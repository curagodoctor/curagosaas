# Image Upload & Fetch Debugging Guide

## Issue
Images are failing to upload or display in the booking pages builder.

## What Was Fixed

### 1. Enhanced Image Upload Logging
**File:** `/components/admin/booking-pages/shared/ImageUploader.js`

**Added logging for:**
- File validation details (name, size, type)
- Upload progress
- Response status
- Success/failure messages
- Image load success/failure

### 2. Enhanced API Logging
**File:** `/app/api/admin/upload-image/route.js`

**Added logging for:**
- Authentication checks
- Blob token configuration check
- Upload request details
- Blob path
- Upload success with URL
- Detailed error information

### 3. Better Error Display
- Image load errors now show in the UI
- Console logs help track the full upload flow
- Failed images display error message instead of silently failing

---

## How to Debug Image Issues

### Step 1: Open Browser Console
1. Go to booking pages builder: http://localhost:3000/admin/dashboard/pages
2. Open DevTools (F12)
3. Go to **Console** tab
4. Keep it open while testing

### Step 2: Test Image Upload
1. Create or edit a booking page
2. Add a section that uses images (e.g., Banner Image, Hero Carousel)
3. Try to upload an image
4. Watch the console for logs

### Expected Console Output (Success):
```
📤 Starting image upload: {fileName: "test.jpg", fileSize: "2.5MB", ...}
✅ File validation passed
📡 Uploading to /api/admin/upload-image...
📥 Upload response status: 200
✅ Upload successful: {url: "https://...", ...}
✅ Image URL set: https://...
✅ Image loaded successfully: https://...
```

### Common Errors & Solutions:

#### Error 1: "Blob storage is not configured"
**Symptom:** API returns 500 error
**Cause:** BLOB_READ_WRITE_TOKEN not set
**Solution:**
```bash
# Check if token exists
grep BLOB_READ_WRITE_TOKEN .env.local

# If missing, add it:
echo 'BLOB_READ_WRITE_TOKEN=your_token_here' >> .env.local

# Restart dev server
```

#### Error 2: "Unauthorized"
**Symptom:** API returns 401 error
**Cause:** Admin token invalid or expired
**Solution:**
1. Logout from admin
2. Login again
3. Try uploading again

#### Error 3: "Failed to load image"
**Symptom:** Image uploads but doesn't display
**Causes:**
- CORS issue with Vercel Blob
- Invalid URL returned from API
- Network blocking the blob URL

**Solution:**
1. Check console for the exact URL
2. Try opening the URL directly in browser
3. Check if URL is publicly accessible
4. Verify BLOB_READ_WRITE_TOKEN is correct

#### Error 4: "File size exceeds 5MB limit"
**Symptom:** Upload rejected
**Solution:** Compress the image or use a smaller file

#### Error 5: "Invalid file type"
**Symptom:** Upload rejected
**Cause:** File type not supported
**Solution:** Use JPG, PNG, or WebP format only

---

## Check Server Logs

When testing locally:
1. Check the terminal where `npm run dev` is running
2. Look for upload-related logs:

```
📤 Upload request received: {...}
📁 Blob path: booking-pages/test-page/image.jpg
☁️  Uploading to Vercel Blob...
✅ Upload successful: {...}
```

If you see errors:
```
❌ BLOB_READ_WRITE_TOKEN is not configured
OR
❌ Error uploading image: {...}
```

---

## Test Blob Storage Directly

Create a test script to verify Blob storage works:

```javascript
// test-blob-upload.js
const { put } = require('@vercel/blob');
const fs = require('fs');

async function testUpload() {
  try {
    // Read a test image
    const file = fs.readFileSync('./test-image.jpg');

    // Upload
    const blob = await put('test/image.jpg', file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ Upload successful:', blob.url);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

testUpload();
```

Run:
```bash
node test-blob-upload.js
```

---

## Check Network Tab

1. Open DevTools → **Network** tab
2. Filter by "upload-image"
3. Upload an image
4. Click on the request to see:
   - Request headers (check Authorization)
   - Request payload (check file data)
   - Response (check for errors)

---

## Common Issues in Production

### Issue: Works locally but not in production

**Possible causes:**
1. BLOB_READ_WRITE_TOKEN not set in production environment
2. Different CORS settings
3. API route not deployed

**Solution:**
1. Check environment variables in hosting platform (Vercel dashboard)
2. Verify API routes are included in build
3. Check build logs for errors

### Issue: Old images not loading

**Possible causes:**
1. Images deleted from Blob storage
2. URLs changed
3. Token expired

**Solution:**
1. Re-upload the images
2. Use the cleanup-images API to remove orphaned references
3. Check blob storage dashboard

---

## Image URL Format

Valid Vercel Blob URLs should look like:
```
https://[store-id].public.blob.vercel-storage.com/[path]
```

Example:
```
https://at0ft5wckjrp4nda.public.blob.vercel-storage.com/booking-pages/test-page/image-123456.jpg
```

If URL doesn't match this pattern, there's an upload issue.

---

## Testing Checklist

- [ ] Browser console shows upload logs
- [ ] No errors in console
- [ ] API returns 200 status
- [ ] Response contains valid `url` field
- [ ] Image preview displays correctly
- [ ] Image URL is accessible in new tab
- [ ] Server logs show successful upload
- [ ] BLOB_READ_WRITE_TOKEN is set
- [ ] Admin token is valid

---

## Quick Fix Steps

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
2. **Re-login to admin** - Get fresh token
3. **Check .env.local** - Verify BLOB_READ_WRITE_TOKEN exists
4. **Restart dev server** - Stop and run `npm run dev` again
5. **Check console** - Look for specific error messages
6. **Try smaller image** - Use image under 1MB for testing
7. **Check network tab** - Verify request is sent and response received

---

## Still Not Working?

1. Check console for logs starting with 📤 📡 ✅ or ❌
2. Share the console output
3. Check server terminal logs
4. Verify blob storage is accessible: https://vercel.com/dashboard/stores
5. Try uploading from a different browser
6. Check if other sections can upload images

---

**Last Updated:** January 24, 2026
**Status:** Enhanced logging and error handling added
