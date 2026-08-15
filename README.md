# ClinicOCR

AI-assisted prescription digitization for clinician-controlled records. Upload a handwritten prescription, review the extracted draft, and explicitly approve the final text record.

**Live app:** [clinicocr-git-main-koustav5.vercel.app](https://clinicocr-git-main-koustav5.vercel.app)

## What it does

- Extracts structured prescription drafts with image preprocessing, Tesseract OCR, and Gemini Flash.
- Keeps the clinician in control: **nothing is saved until explicit approval**.
- Retains approved text records, medicines, notes, tags, and language metadata; new records do **not** store uploaded source images.
- Supports patient history, record search, starred records, multilingual text, and PDF export.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, tRPC, Framer Motion.
- **Backend:** Node.js, Express, tRPC, Zod.
- **Database:** Neon PostgreSQL with Drizzle ORM.
- **Authentication:** Clerk.
- **Extraction:** Sharp, Tesseract.js, Google Gemini Flash.
- **PDF:** html2canvas and jsPDF.

## Local setup

```bash
pnpm install
pnpm dev
```

Create a local `.env` file with the following values. Do not commit it.

```env
NEON_DATABASE_URL=
GEMINI_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Useful checks:

```bash
pnpm check
pnpm test
pnpm build:vercel
```

## Vercel deployment

1. Import this GitHub repository into [Vercel](https://vercel.com).
2. Add the four environment variables above in **Project Settings → Environment Variables** for Production and Preview.
3. Add the Vercel domain to Clerk’s allowed origins and redirect configuration.
4. Push to `main`; Vercel uses the included `vercel.json` and `pnpm build:vercel` configuration.

> Never commit populated `.env` files, database URLs, Gemini keys, or Clerk secret keys. The browser-visible Clerk publishable key should still be managed through Vercel settings.

## Clinical-record boundary

ClinicOCR is designed for a **review-first, text-only** record workflow. Source images exist only during the active OCR/review session and are discarded after approval. Legacy records may still display an existing image reference.
