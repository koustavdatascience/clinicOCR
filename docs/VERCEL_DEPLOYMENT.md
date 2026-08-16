# Secure Vercel Deployment Guide

ClinicOCR can be connected to a Git repository without placing secrets in that repository. The committed [`VERCEL_ENVIRONMENT_TEMPLATE.txt`](./VERCEL_ENVIRONMENT_TEMPLATE.txt) intentionally contains **variable names only**. Put real values in **Vercel Project Settings → Environment Variables**, where sensitive variables are protected from ordinary dashboard display and injected into the serverless runtime rather than written to source control. [1]

> **Do not use any `VITE_*` variable for a secret.** Vite embeds `VITE_*` values in browser JavaScript. In ClinicOCR, `VITE_APP_ID` and `VITE_OAUTH_PORTAL_URL` are public client configuration; database URLs, Gemini keys, JWT material, object-storage credentials, and OAuth service values must remain server-only.

## 1. GitHub safety

The repository ignores `.env`, `.env.*`, and `.vercel/`. Before connecting GitHub to Vercel, run the following command locally or in CI:

```bash
pnpm verify:secrets
```

This reports only affected filenames if a tracked file resembles a supported credential pattern; it never prints a detected secret. Never commit a populated `.env` file, exported Vercel settings, or a `.vercel/project.json` file.

## 2. Vercel environment variables

| Variable | Purpose | Set in Vercel as |
|---|---|---|
| `NEON_DATABASE_URL` | Canonical PostgreSQL connection | Sensitive, Production and Preview |
| `GEMINI_API_KEY` | Server-side prescription extraction | Sensitive, Production and Preview |
| `JWT_SECRET` | Session-cookie signing | Sensitive, Production and Preview |
| `OAUTH_SERVER_URL` | OAuth service endpoint | Sensitive, Production and Preview |
| `OWNER_OPEN_ID` | Initial clinic owner identifier | Sensitive, Production and Preview |
| `STORAGE_PROVIDER=s3` | Enables external object storage | Normal configuration |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` | External image-storage location | Sensitive, Production and Preview |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | External image-storage access | Sensitive, Production and Preview |
| `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL` | Public browser OAuth configuration | Normal configuration |

Add sensitive values through the Vercel dashboard or with `vercel env add NAME production --sensitive`; do **not** store them in GitHub Actions variables unless an automation workflow truly needs them. Vercel documents sensitive environment-variable management for deployment environments. [1]

## 3. External services required outside Manus

ClinicOCR currently uses Manus Forge storage by default. A Vercel deployment must set `STORAGE_PROVIDER=s3` and provide a private S3-compatible bucket. The server creates pre-signed read URLs; original prescription images stay private and are not copied into the Git repository. Existing Manus-stored images must be migrated separately before switching a live clinic to external storage.

The Manus OAuth callback must permit the deployed URL:

```text
https://YOUR-VERCEL-DOMAIN/api/oauth/callback
```

Update the OAuth application’s allowed callback URL before production traffic. After the first deployment, add the exact Vercel preview or production domain required by the OAuth provider.

## 4. Runtime boundary for OCR

The Vercel function is configured with a `maxDuration` of 60 seconds. This is appropriate for a first deployment, but the prescription pipeline includes image preprocessing and Tesseract OCR before Gemini extraction. Monitor real upload timings and increase the configured duration only when the Vercel plan supports it; Vercel supports per-function duration settings in `vercel.json`. [3]

If sustained OCR traffic or long-language-model processing exceeds the serverless execution window, move only the OCR worker to a queue-backed or always-on compute service while keeping the React application, API, Neon database, and private object storage on their current interfaces.

## 5. Vercel project setup

Import the repository in Vercel and keep the root directory at the repository root. The committed `vercel.json` builds the Vite client into `dist/public`, routes `/api/*` to the default-exported Express function in `api/index.ts`, and rewrites browser routes to the SPA entry point. Vercel supports a default-exported Express application as a Node.js function. [2]

Run `pnpm build:vercel` locally before creating the deployment. Do **not** publish a Vercel project until all required environment variables, the OAuth callback, and external S3-compatible storage are configured.

## 6. If a credential is exposed

Immediately revoke or rotate the exposed value at its provider. Update the replacement only in Vercel’s sensitive environment settings, redeploy, and review GitHub history and access logs. Removing a value from a later commit is insufficient because the previous Git history may remain reachable.

## References

[1]: https://vercel.com/docs/cli/env "Vercel CLI environment variables"
[2]: https://vercel.com/docs/frameworks/backend/express "Vercel Express deployment"
[3]: https://vercel.com/docs/functions/configuring-functions/duration "Vercel function duration configuration"
