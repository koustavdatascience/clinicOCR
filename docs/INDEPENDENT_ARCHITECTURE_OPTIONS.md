# Independent Architecture Options

## Neon and Supabase: distinct roles

Neon is the existing ClinicOCR **PostgreSQL database provider**. Its serverless Postgres architecture emphasizes autoscaling, scale-to-zero, branching, and point-in-time restores. It now also offers additional products, but ClinicOCR currently uses Neon only through its PostgreSQL connection string. [1]

Supabase is a broader backend platform built around Postgres. A project includes a PostgreSQL database plus managed Auth, Storage, APIs, Realtime, and functions. Its Auth uses JWTs and can support email/password, magic links, social sign-in, and more; its Storage offers S3-compatible file storage with policy-based access controls. [2] [3] [4]

## Recommended independent path for ClinicOCR

To minimize disruption, keep **Neon** as the canonical clinical-record database and use **Supabase Auth plus Supabase Storage** only for login and private prescription images. This avoids a risky database migration while replacing the two remaining Manus-bound services. Supabase Auth and Storage can be used as platform services, while ClinicOCR continues to query Neon through its existing server-side database layer.

The alternative is to migrate database, authentication, and storage completely to Supabase. That yields one vendor but requires a planned PostgreSQL export/import, new database security policies, and careful validation of current patient and prescription records. It is a larger migration with no immediate benefit for ClinicOCR because Neon is already functioning as the canonical database.

## References

[1]: https://neon.com/docs/introduction/about "Neon: Why Neon?"
[2]: https://supabase.com/docs/guides/getting-started/architecture "Supabase architecture"
[3]: https://supabase.com/docs/guides/auth "Supabase Auth"
[4]: https://supabase.com/docs/guides/storage "Supabase Storage"
