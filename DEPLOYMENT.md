# Deployment Guide - Vercel Setup

This guide covers deploying your booking system to Vercel with image upload functionality.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository connected to Vercel

---

## 1️⃣ Enable Vercel Blob Storage

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → Select **Blob**
4. Click **Create** (this will auto-generate `BLOB_READ_WRITE_TOKEN`)
5. The token is automatically added to your environment variables ✅

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Link your project
vercel link

# Enable Blob storage
vercel blob enable

# The BLOB_READ_WRITE_TOKEN will be auto-added
```

---

## 2️⃣ Set Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

### Required Variables

⚠️ **NEVER commit actual credentials to git!** Copy these from your `.env.local` file.

```bash
# MongoDB - Get from MongoDB Atlas
MONGODB_URI=<your-mongodb-connection-string>

# Admin Credentials - Set your own secure password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-secure-password>

# Session Secret - Generate with: openssl rand -hex 32
SESSION_SECRET=<run-openssl-rand-hex-32>

# Razorpay - Get from Razorpay Dashboard
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
RAZORPAY_PAYMENT_BUTTON_ID=<your-payment-button-id>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key-id>

# Google Calendar - Get from Google Cloud Console
GOOGLE_SERVICE_ACCOUNT_EMAIL=<your-service-account-email>
GOOGLE_CALENDAR_ID=<your-calendar-id>

# Google Private Key (BASE64 encoded - avoids newline issues in Vercel)
# Generate: cat key.json | base64
GOOGLE_PRIVATE_KEY_BASE64=<your-base64-encoded-private-key>

# Doctor Info
DOCTOR_EMAIL=<your-email>
DOCTOR_NAME=<your-name>

# Vercel Blob Storage
# ⚠️ AUTO-GENERATED when you enable Blob storage in Vercel
# No need to manually set this - Vercel handles it automatically
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
```

**Note:** The `BLOB_READ_WRITE_TOKEN` is automatically created when you enable Blob storage in step 1. You don't need to manually add it.

---

## 3️⃣ Deploy

### Via GitHub (Recommended)

1. Push your code to GitHub
2. Vercel will auto-deploy on every push to `main` branch
3. Check deployment logs in Vercel Dashboard

### Via Vercel CLI

```bash
# Build and deploy
vercel --prod
```

---

## 4️⃣ Test Image Upload in Production

1. Go to your production URL: `https://your-app.vercel.app`
2. Login to admin panel: `/admin`
3. Create a new booking page
4. Upload an image in any section (Hero Carousel, Banner, etc.)
5. Images will now be stored in Vercel Blob and display correctly ✅

---

## 🔍 Troubleshooting

### Images not showing?

**Check 1:** Verify Blob storage is enabled
```bash
vercel env ls
# Should show BLOB_READ_WRITE_TOKEN
```

**Check 2:** Check deployment logs
- Go to Vercel Dashboard → Deployments → Click latest deployment → View Logs
- Look for any upload errors

**Check 3:** Test upload API directly
```bash
# Login first to get token
curl -X POST https://your-app.vercel.app/api/admin/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "slug=test"
```

### Environment Variable Issues?

- Make sure all env vars from `.env.local` are added in Vercel Dashboard
- Redeploy after adding/updating env vars
- Use `GOOGLE_PRIVATE_KEY_BASE64` instead of `GOOGLE_PRIVATE_KEY` on Vercel

---

## 📦 What Changed for Image Storage?

### Before (Filesystem - ❌ Doesn't work on Vercel)
```javascript
// Saved to /public/uploads/... (lost on deployment)
await writeFile(filepath, buffer);
```

### After (Vercel Blob - ✅ Works everywhere)
```javascript
// Saved to Vercel Blob Storage (permanent CDN URLs)
const blob = await put(blobPath, file, { access: 'public' });
```

**Benefits:**
- ✅ Images persist across deployments
- ✅ Fast CDN delivery worldwide
- ✅ Automatic image optimization
- ✅ 10GB free storage on Vercel

---

## 💰 Pricing (Vercel Blob)

**Hobby (Free) Plan:**
- 10GB storage
- 100GB bandwidth/month
- More than enough for most booking sites

**Pro Plan ($20/month):**
- 100GB storage
- 1TB bandwidth/month

---

## 🚀 Quick Deploy Checklist

- [ ] Enable Vercel Blob storage
- [ ] Add all environment variables from `.env.local`
- [ ] Deploy to production
- [ ] Test image upload in admin panel
- [ ] Verify images display on public booking pages

---

## Need Help?

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
