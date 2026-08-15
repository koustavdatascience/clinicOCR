# ClinicOCR

ClinicOCR turns handwritten prescriptions into clear, clinician-reviewed digital records.

**Live app:** [clinicocr-three.vercel.app](https://clinicocr-three.vercel.app)

## What it does

- Reads prescription images with OCR and AI assistance.
- Lets the clinician review and correct every draft before saving.
- Saves approved text records, not new source images.
- Supports search, patient history, multiple languages, notes, and PDF export.

## Project folders

| Folder | Purpose |
| --- | --- |
| `frontend/` | React website and user interface. |
| `backend/` | Express API, authentication, OCR, and record logic. |
| `shared/` | Types and constants used by both sides. |
| `drizzle/` | Database schema and migrations. |
| `api/` | Small Vercel serverless entrypoint. |
| `scripts/` | Build and safety-check scripts. |

## Run it locally

```bash
pnpm install
pnpm dev
```

Create a local `.env` file with the required database, Gemini, and Clerk keys. Do not commit it.

```bash
pnpm test
pnpm check
pnpm build:vercel
```

## Deploy

Push to `main`. Vercel builds the project with the included `vercel.json` file. Keep all secrets in Vercel environment variables, never in GitHub.

## Credits

Made with **Manus** and open-source tools including React, Express, Clerk, Neon, Tesseract, and Gemini.

## License

This project is available under the [MIT License](LICENSE).
