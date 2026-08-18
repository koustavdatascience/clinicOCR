# Alternative Independent Services

Supabase cannot currently be created because the account has reached its active free-project limit. The strongest low-cost alternative that preserves the working Neon database is **Clerk for authentication** and **Cloudflare R2 for private prescription images**.

Clerk is available through the Vercel Marketplace, provides production-ready sign-in and sign-up components for React, and has Vercel-native provisioning and environment-variable support. [1]

Cloudflare R2 exposes S3-compatible APIs, so ClinicOCR’s already-added external S3 storage adapter can use it with configuration only rather than a storage-code rewrite. R2’s published free allocation includes 10 GB-month of standard storage, one million Class A operations, and ten million Class B operations per month; use a private bucket and issue short-lived server-side signed reads for prescription images. [2]

This combines cleanly with the existing architecture:

| Responsibility | Recommended service |
|---|---|
| Hosting | Vercel |
| Clinical-record database | Neon (unchanged) |
| Doctor authentication | Clerk |
| Original prescription images | Private Cloudflare R2 bucket |
| AI extraction | Gemini |

## References

[1]: https://vercel.com/marketplace/clerk "Clerk for Vercel"
[2]: https://www.cloudflare.com/products/r2/ "Cloudflare R2"
