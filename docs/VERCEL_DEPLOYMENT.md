# Secure Vercel Deployment Guide

ClinicOCR can use GitHub as its source repository without committing operational credentials. The committed [`VERCEL_ENVIRONMENT_TEMPLATE.txt`](./VERCEL_ENVIRONMENT_TEMPLATE.txt) contains **variable names only**. Add values in **Vercel Project Settings → Environment Variables** so they are injected into the deployed runtime rather than stored in Git history. [1]

> **Never commit a populated `.env` file.** In particular, `NEON_DATABASE_URL`, `GEMINI_API_KEY`, and `CLERK_SECRET_KEY` must remain server-only. Clerk’s publishable key is browser-visible by design, but it should still be configured in Vercel rather than copied into source code.

## 1. Required Vercel variables

| Variable | Purpose | Vercel scope |
|---|---|---|
| `NEON_DATABASE_URL` | Canonical Neon PostgreSQL clinical-record database connection | Sensitive; Production and Preview |
| `GEMINI_API_KEY` | Server-side prescription OCR/AI extraction | Sensitive; Production and Preview |
| `CLERK_SECRET_KEY` | Server-side Clerk request verification | Sensitive; Production and Preview |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser Clerk configuration; mapped to Vite’s public Clerk variable during build | Production and Preview |
| `NODE_ENV=production` | Production runtime setting | Production |

The Vercel project already contains the required Clerk values. ClinicOCR deliberately reads the public Clerk value from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` at build time and maps it to the Vite-compatible browser setting, so a second `VITE_CLERK_PUBLISHABLE_KEY` is not required.

## 2. Authentication cutover and legacy records

ClinicOCR now uses Clerk for clinician sign-in. The Express API verifies each Clerk session before creating its tRPC context. The client also forwards a current Clerk session token for API requests, which supports normal browser sessions and authenticated client calls.

For a seamless one-time cutover, the first Clerk sign-in should use the **same verified email address** stored on the legacy ClinicOCR clinician profile. ClinicOCR then safely changes that single matching Neon user record to the Clerk user ID, preserving the owner relationship for its patients and prescriptions. If there is no verified email match, ClinicOCR creates a separate clinician workspace rather than guessing ownership.

| Record type | Cutover behavior |
|---|---|
| Newly approved prescriptions | Store doctor-reviewed text, raw OCR evidence, medicines, tags, notes, language metadata, and audit timestamps; no uploaded image reference is saved. |
| In-review upload | Kept only in the browser session for the clinician’s review and discarded after explicit approval or draft discard. |
| Existing prescriptions | Remain readable as Neon records. Their legacy image references are not required for clinical text, and are not migrated to a new storage provider. |

Before inviting any clinician, set the production Vercel domain in Clerk’s allowed origins and redirect configuration. Clerk’s hosted sign-in uses the configured instance and publishable key; follow Clerk’s production-instance/domain guidance when changing domains. [2]

## 3. GitHub safety

The repository ignores `.env`, `.env.*`, and `.vercel/`. Run the following command before push or in CI:

```bash
pnpm verify:secrets
```

The scan reports only affected filenames if a tracked file resembles a credential pattern; it never prints a detected value. Do not commit Vercel exports, `.vercel/project.json`, or a populated environment file.

## 4. OCR runtime boundary

The Vercel function is configured with a `maxDuration` of 60 seconds. The prescription pipeline performs image preprocessing, Tesseract OCR, and Gemini structured extraction during the temporary analysis request. Monitor representative upload duration after deployment and increase the configured duration only if the selected Vercel plan supports it. [3]

If sustained OCR traffic exceeds the serverless execution window, move only the OCR worker to queue-backed or always-on compute while retaining the React application, Clerk authentication, Neon database, and text-only clinical record boundary.

## 5. Build and publish sequence

Import the GitHub repository in Vercel with the repository root as the project root. The committed `vercel.json` builds the Vite client into `dist/public`, sends `/api/*` to the Express function in `api/index.ts`, and rewrites browser routes to the SPA entry point. Vercel supports a default-exported Express application as a Node.js function. [4]

Run the following locally before the first production deployment:

```bash
pnpm check
pnpm test
pnpm build:vercel
```

After a clean checkpoint is created, use the **Publish** button in the project interface to deploy. Do not commit secrets or manually modify production database data during the cutover.

## 6. If a credential is exposed

Immediately rotate the exposed value at the corresponding provider. Enter the replacement only through Vercel’s sensitive environment settings, redeploy, and review GitHub history and provider access logs. Removing a value in a later commit is insufficient because prior Git history may remain reachable.

## References

[1]: https://vercel.com/docs/cli/env "Vercel CLI environment variables"
[2]: https://clerk.com/docs/deployments/overview "Clerk deployment overview"
[3]: https://vercel.com/docs/functions/configuring-functions/duration "Vercel function duration configuration"
[4]: https://vercel.com/docs/frameworks/backend/express "Vercel Express deployment"
