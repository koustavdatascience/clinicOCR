# Resu reference review notes

The supplied `koustavdatascience/resu` repository is a private monorepo with a Next.js frontend under `frontend/` and an Express/Prisma backend. The public repository overview identifies a polished resume-optimization product rather than a medical workflow, so ClinicOCR will adopt only reusable motion principles and will retain its own clinical language, palette, data visuals, and accessibility safeguards.

The frontend source is located at `frontend/src`. The next review step is to inspect its landing-page implementation for transferable composition patterns such as staged hero reveals, layered background accents, directional micro-motion, and loading-state rhythm. No source code or branding will be copied verbatim.

The reference frontend uses a Next.js application route at `frontend/src/app/page.tsx`, separate authenticated routes, and reusable components. The latest commit description on the landing page indicates responsive typography and spacing refinement, reinforcing the need to keep the ClinicOCR adaptation mobile-aware rather than translating the reference’s resume-product visuals directly.

The reference landing page composes a dedicated `Hero` copy/action component with a separate `HeroIllustrations` layer, followed by product preview and explanatory sections. ClinicOCR can adopt this **separation of semantic copy from motion-rich visual evidence**: the clinical statement and sign-in action remain readable and keyboard-safe while a separate visual layer carries the richer animation.

The reference Hero uses a sequenced entrance rather than a single uniform fade: a small context pill rises first, the headline appears through per-letter blurred stagger timing, supporting copy follows, then the primary CTA arrives last. Its motion uses a snappy cubic-bezier easing (`[0.22, 1, 0.36, 1]`), small vertical travel, and mobile-aware type scaling. ClinicOCR will reinterpret these principles as a clinical status ribbon, staged line-based headline reveal, and an animated evidence-flow visual—without reusing reference text, colors, or components.
