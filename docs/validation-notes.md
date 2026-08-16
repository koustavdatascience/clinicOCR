# ClinicOCR Validation Notes

## August 21, 2026

The public landing page was checked at desktop and mobile sizes. Its animated prescription preview displays Bengali script and the native-language context without layout overflow. A signed-in browser session was sent from `/` to `/workspace` as intended, confirming the public-to-protected workspace handoff.

The prescription detail page PDF export was triggered successfully in the browser and no client-side PDF, canvas, or unhandled error was recorded afterwards. Automated coverage renders a Bengali source-language record through the Unicode PDF export path and covers a canvas-render failure, where the clinician receives a retry message rather than losing access to the record.

## Animated public experience update

The public route now has three distinct sections: Hero, About ClinicOCR, and Secure Sign In. Browser inspection confirmed that the initial Hero reveal resolves to its visible state after load, and the About navigation moves the viewport to the second section. The sections use restrained continuous UI motion—including scan lines, status pulses, moving evidence flow, progress sweeps, and secure-session rings—with reduced-motion alternatives.

During navigation, the browser visibly enters each section’s short viewport reveal before it settles, confirming that the About and Secure Sign In elements participate in the entrance motion rather than being rendered as static blocks.

The public top navigation exposes Hero, About, and Sign In controls. The Sign In navigation control successfully scrolls from the Hero to the third section, where the authenticated session presents the Open workspace action.

From the settled Secure Sign In panel, activating Open workspace routed the authenticated browser session to `/workspace`, where the protected clinical dashboard loaded normally.

## Vercel encrypted configuration

The private `koustavdatascience/clinicOCR` repository was linked to the Vercel `clinicocr` project without creating a deployment. The user-confirmed `GEMINI_API_KEY` and `NEON_DATABASE_URL` were added as **Sensitive** environment variables for both Production and Preview. Their values are intentionally not recorded in this repository or in these notes.

## Independent authentication

The Vercel ClinicOCR project Integrations screen shows **Clerk** connected as an Authentication integration. The application-side migration will use this integration’s Vercel-managed configuration rather than committing authentication values to GitHub.

The Vercel Environment Variables view confirms that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are both present as **Sensitive** variables for Production and Preview. Values were not displayed or recorded.

## Post-migration browser validation status

The local development preview renders a deliberate authentication-configuration notice because the local runtime does not have a Clerk publishable key injected. This confirms that the browser does not silently fall back to the removed Manus login path.

The currently ready Vercel deployment is reachable and renders the previous landing experience. Its visible image-preservation copy predates the local Clerk and text-only-record migration, so it is not used as validation of the new source state. The updated source has passed TypeScript, automated workflow tests, Neon migration checks, and a production Vite build. Browser validation of the new Clerk sign-in and protected clinical workflow requires a fresh deployment built from the completed GitHub revision and a real Clerk session.

The GitHub-synchronized production deployment for commit `c7f228d` became ready and was opened in the browser. Its public landing route completed the Clerk session check and displayed the new text-only-record language across the Hero, About, review preview, and Sign In sections. The signer was not already authenticated in the browser, so the next validation step is the Clerk sign-in handoff; no clinical data was viewed or changed during this check.

The live Sign In navigation correctly moved the viewport to the secure sign-in section, where the explicit `Sign in to ClinicOCR` action is visible. No authentication action has been submitted and no clinical record has been created, edited, or viewed.

After the direct-CTA repair was deployed, the prominent `Enter ClinicOCR` button was tested in the browser. It now opens the Clerk sign-in modal immediately, offering supported Google and email routes, rather than only scrolling to the Sign In section. This confirms the reported no-op sign-in behavior has been corrected. Credentials were not entered and no clinical data was changed during this validation.

The subsequent production API bundle repair removed the prior missing-module failure. The server-side Clerk configuration repair was then deployed and the browser showed a signed-in session entering the ClinicOCR session-resolution state. The session request no longer produced the prior Vercel module error, but it still resolved back to the public landing page rather than `/workspace`; further tracing is required before the authenticated routing check can be marked complete.

After adding a token-bridge readiness gate, the direct `/workspace` route was re-tested on the latest production build. The browser waited for the secure session bridge, then displayed the workspace sign-in prompt rather than authenticated clinical content. This confirms the first-request timing issue is mitigated but that clinician identity resolution remains incomplete; no clinical data was accessed or changed.

The clinician subsequently completed the live Clerk sign-in. The protected `/workspace` route then rendered the authenticated ClinicOCR dashboard, including the clinician profile, patient and prescription metrics, recent-record list, and text-only safety guidance. Production logs recorded the combined `auth.me` and `clinic.dashboard` request as HTTP 200 after the session was established. Earlier HTTP 401 entries occurred before the completed session; no new Clerk or workspace-routing exception appeared after sign-in. No patient or prescription data was modified during validation.

The current production endpoint also returned HTTP 200 for unauthenticated `auth.me` state checks, and the landing-page regression suite confirmed the authenticated handoff to `/workspace`. The latest deployment’s post-fix runtime entries contain successful API responses; the only retained operational notice is the upstream PostgreSQL SSL-mode warning from the connection-string library, which is separate from Clerk or workspace routing.

With the authenticated clinician session active, the current production landing route was opened again. It immediately redirected to `/workspace`, and the dashboard completed loading with the authenticated clinician profile, two patients, one saved prescription, and the recent-record list visible. This is the final live confirmation that the public landing route now hands an authenticated clinician into the protected workspace without changing clinical data.

The Hero-animation deployment for commit `61a4220` is ready on Vercel. Its initial live render exposes the expected ClinicOCR navigation, clinical-review status ribbon, staged headline content, evidence-flow panel, and Sign In section. The browser capture occurred during the intentionally staggered entrance sequence, so the next review pass waits for the animated content to settle before final visual sign-off.

After the staged entrance settled, the live Hero displayed its two-line clinical headline, supporting copy, paired actions, and the original evidence-flow panel with Ink, Review, and Record states. The page retained clear contrast, readable type, clinical wording, and distinct controls while applying the requested status-pill, sequenced-reveal, and separate visual-evidence principles. The authenticated workflow was not invoked during this visual review.

The development-only landing preview was checked at **375 × 812** and **768 × 1024**. At mobile width, the headline, two calls to action, three-step evidence flow, review-status list, About content, and sign-in panel remained vertically ordered and readable without clipping. At tablet width, the Hero maintained its centered staged-copy hierarchy while the evidence cards stayed legible, the status panel retained its separation, and the surrounding About and Sign In layouts scaled cleanly. Reduced-motion behavior remains covered by the deterministic landing motion-plan test.

Headless captures of the live Vercel page at mobile and tablet dimensions successfully loaded the landing page and navigation after Clerk initialization. The browser engine captured the Framer Motion Hero before its request-animation-frame entrance settled, leaving only the navigation visible in the fixed-time frame; this is a headless animation-timing limitation rather than a failed page load. The local responsive preview and interactive live desktop review both show the settled Hero content. The live mobile/tablet visual confirmation remains an optional manual follow-up item.

The live tablet capture showed the same behavior: the ClinicOCR shell, full navigation, and Sign In control loaded at 768 pixels, but the staged Hero remained at its pre-entrance animation frame in the fixed headless capture. This confirms that the limitation is consistent across the tested live breakpoints rather than a one-off responsive layout failure.

The stable production alias (`https://clinicocr-git-main-koustav5.vercel.app`) loaded the protected workspace shell correctly but did not share the earlier deployment-specific Clerk session, so it showed the expected sign-in prompt. No data was changed. This prevents a further authenticated read-only browser walkthrough without another user sign-in and is retained as a user-deferred validation item.

The supplied production-error screenshot was reviewed in two overlapping ordered crops. It confirms that the **Analyze for review** action received HTTP 504 from `POST /api/trpc/clinic.prescriptions.analyze`, with a browser console gateway-timeout message. The client then attempted to parse the non-tRPC gateway body as JSON and displayed `Unexpected token 'A', "An error o"... is not valid JSON`. A separate Clerk development-key warning was present but is not the immediate cause of the 504.

The repaired production deployment for commit `85c3762` is ready at `https://clinicocr-h2txgosb4-koustav5.vercel.app`. Its unauthenticated public page completed the Clerk session check and rendered the expected landing content, ready for an authenticated analysis retry.

The updated public navigation was checked interactively in the landing preview. At the Hero start it remains an expanded transparent navigation with **Home**, **About**, and **Sign in** labels. After a page scroll, it contracts into a centered, bordered, translucent teal glass surface; the smaller ClinicOCR mark, navigation controls, and Sign in action remain visible and usable above the About section.

The repaired production build was reopened for the final read-only workflow confirmation. The page completed its session check and presented the expected Clerk sign-in landing state; no clinical data was accessed or changed.

Using the connected authenticated browser session, the saved legacy prescription at `/prescriptions/9` was opened and **Export PDF** was selected. The browser reproduced the toast `Could not generate the prescription PDF. Please try again.` without changing the prescription, its metadata, or doctor notes. This confirms the issue is isolated to client-side export rendering rather than record access or persistence.

## Production PDF export repair validation

Commit `699f091` (**Harden prescription PDF export**) deployed successfully to Vercel production as `dpl_39rzf84WoHfkP7DG9My6cMS9XH7N` (`clinicocr-2cwta6ej2-koustav5.vercel.app`). The connected browser completed a Google/Clerk handoff using the user-authorized clinician account and reopened `/prescriptions/9` with the expected authenticated workspace, reviewed content, medicine list, and legacy-source notice.

Selecting **Export PDF** on the repaired deployment completed without an error toast and displayed `Prescription PDF exported in a text-safe layout.` This is the intended recovery path after canvas rendering could not generate the legacy-record report. No patient, prescription, doctor-note, tag, or important-state mutation was performed.

The one-hour Vercel runtime-error review found no new PDF-export or Clerk-authentication error cluster. It surfaced the pre-existing PostgreSQL `sslmode=require` compatibility warning on `/api/index`, plus two historical 60-second runtime timeouts on an older deployment (`dpl_8unArb8BBaCJyFE9LPf16jEhZHwm`) before the bounded-analysis repair. Neither is attributed to the repaired client-only PDF export operation.

From the repaired production origin, the authenticated **Overview** route displayed the clinician profile, three-patient count, one saved-prescription count, recent record, and the review-first text-only safety statement. The **Find records** route displayed the saved Koustav Roy record with its medicine and tag fields. Finally, opening the repaired production root route redirected the active clinician session directly to `/workspace`, then loaded the populated dashboard. These read-only checks did not create, alter, approve, star, tag, or annotate any clinical record.

The current-deployment runtime log query, scoped to `dpl_39rzf84WoHfkP7DG9My6cMS9XH7N`, confirms successful `auth.me`, `clinic.dashboard`, `clinic.prescriptions.get`, and `clinic.prescriptions.search` requests after sign-in, all with HTTP 200. Two 401 `clinic.prescriptions.get` requests occurred before the OAuth/Clerk session completed; subsequent protected-route requests succeeded. The only log entry flagged at the error level was the existing PostgreSQL SSL-mode compatibility warning, not a Clerk, session, protected-route, or PDF-export failure. Browser-visible clinician screens and application toasts contained no client error message during the read-only validation; browser developer-console extraction is not available through the connected-session interface and remains separately listed if manual DevTools inspection is desired.

The clinician requested that a disruptive fresh sign-out/sign-in round-trip be deferred. It is therefore intentionally excluded from this non-disruptive validation pass. The older Manus-era Vercel variables and external S3 configuration are no longer required because Clerk now resolves clinician sessions and approved prescriptions retain reviewed text only.

## PDF layout quality restoration

The clinician-provided export was reviewed as the visual reference. Its readable teal report banner, consistent left alignment, compact patient/date context, restrained section headings, airy whitespace, and concise clinical structure are the qualities retained in the resilient direct-text export path. The previous fallback was functionally safe but visually sparse because it emitted a single unstyled transcript.

The direct-text fallback now draws a branded report banner, patient-and-date context panel, separately paced clinical sections, subtle teal evidence accents, lightly tinted reviewed-content blocks, structured medicine rows, page continuation headers, and page footers. It remains deliberately limited to Latin-script content so the Unicode-capable canvas path remains authoritative for Bengali and other non-Latin prescriptions. Focused regression coverage confirms that the fallback includes its ClinicOCR header, clinical sections, and visual container primitives before it saves a download.

Commit `91910f5` (**Restore polished PDF fallback layout**) reached Vercel production as `dpl_2UhBUxLLtoUkXAic5mFrQBXJpajq` at `clinicocr-lmnqctrub-koustav5.vercel.app`. The signed-in saved-record page loaded successfully and the unchanged legacy prescription export action was invoked. The connected-browser bridge disconnected while attempting to inspect the downloads page, but the action showed no clinician-facing export failure and the deployment recorded an authenticated `auth.me,clinic.prescriptions.get` HTTP 200 request.

To validate the direct-render report independently of that bridge limitation, the same saved-record content was rendered locally through the production-equivalent fallback layout and visually compared against the attached reference. The resulting one-page report retained the reference’s teal title band and clinical simplicity while improving hierarchy: patient/date are paired in a context band; corrected text, summary, medicines, and notes are individually grouped; the reviewed sections use restrained pale-teal surfaces; and footer page metadata is present. The temporary local fixture and output were removed after verification.

The clinician subsequently requested that the reviewed-summary label be shortened to **Summary**. Both the Unicode canvas report and the resilient direct-text fallback now use this concise PDF-only heading. The focused export suite, full 46-test suite, Vercel production build, and serverless smoke test passed. Commit `77d76ab` deployed successfully as `dpl_2qPT41A7wrRrb4ev9B2zVhA2aeqE` at `clinicocr-q74u8w4g1-koustav5.vercel.app`.

## Editorial landing and visual-identity refinement

The live deployment for commit `bb17135` (`https://clinicocr-3kjiju43u-koustav5.vercel.app`) loaded the refreshed public route and exposed the intended concise content: **Clinician-led**, **Prescriptions, made clear.**, **From handwriting to reviewed records.**, and the single **Enter ClinicOCR** action. The page retained Home, About, and Sign in navigation plus the clinical evidence-flow section. A follow-up live capture after the entrance transition confirmed the complete centered editorial composition: high-contrast Bodoni Moda display type, teal second line, short supporting copy, one dominant CTA, and the redesigned evidence panel below. The same release replaces legacy record-list image previews with an accessible person icon and adds `/favicon.svg` as the ClinicOCR browser-tab icon.

The current public landing release (`https://clinicocr-f1qr3yk0u-koustav5.vercel.app`, deployment `dpl_5ZcxGXu91zDnJ72XKfMmw5k2XmhH`) was visually verified after animation completion. The top navigation is now geometrically centered independent of the wider ClinicOCR brand and the right-side action; its labels are **Home**, **About**, and **Workflow**, with the sole **Sign in** label reserved for the right-side action. The hero badge reads **Language aware**. The enlarged, lower Instrument Serif heading has no crossing divider; its supporting line and primary button are intentionally smaller. The new interactive **How ClinicOCR works** section exposes the clinician-safe progression: upload the prescription, review the draft, and explicitly approve the text-only record.

The stable production alias, `https://clinicocr-git-main-koustav5.vercel.app`, was then opened in the connected browser and resolved to the same completed landing release. It exposes the centered **Home · About · Workflow** navigation, the single right-side **Sign in** action, the **Language aware** badge, and the three-step clinical workflow section.

The scroll-driven workflow release (`https://clinicocr-coghk7w2o-koustav5.vercel.app`, deployment `dpl_BGUoCB6tYp5bWwWGTUbeoM2r9vx8`) is READY. Its initial live state shows the expected **Upload the prescription** step and the temporary-source visual before the scroll-progression check.

During the production scroll check, the sticky source panel remained paired with the first upload step when the workflow heading entered view. Continuing down reached the lower **Approve the record** stage and the end of the enlarged workflow scroll area immediately before the secure-sign-in section. The active panel content is being verified separately from the rendered DOM because the lower sticky panel moves out of view at the section boundary.

The rendered DOM confirmed the lower scroll position advanced the visual panel to **Text-only record / Approved / Ready to save** without a step click. Scrolling back to the upper workflow position returned the panel to **Temporary source / Rx**, after its short transition completed. The companion regression test drives the same threshold logic through upload, review, and approval states. This verifies scroll-synchronized active-state progression while retaining click, hover, focus, and `aria-pressed` controls as optional accessible alternatives.

The Resu source comparison confirmed that its workflow chooses the active step when its top reaches roughly 45% of the viewport, keeps the left visual sticky, expands the active progress indicator, and reduces opacity/scale on inactive steps. ClinicOCR already used the same 46% reading-line approach; it now also provides a teal active vertical progress rail beside the sticky clinical visual and 95% scale treatment for inactive workflow stages. Live review of `https://clinicocr-rc7far6hf-koustav5.vercel.app` confirmed the upload state, active expanded rail, compact inactive dots, and muted later steps in the expected layout.

The stable `clinicocr-git-main-koustav5.vercel.app` alias also resolved successfully after the refinement, showing the public landing with its Language aware badge, centered navigation, and clinical workflow content.

## Exact ResuMatch hero display font

The referenced ResuMatch source declares `Instrument Serif` as a local hero font in `frontend/src/lib/fonts.ts`. Its upstream project licenses the family under the SIL Open Font License 1.1. ClinicOCR now loads the exact **Instrument Serif** family from Google Fonts and uses it only through the `.font-editorial` hero class, with Georgia as an accessible fallback; the clinical workspace continues to use its existing readable sans-serif type. Production deployment `dpl_BFiAsWdZmjrH86o49MB5byNrsisa` (`https://clinicocr-eb3sknllz-koustav5.vercel.app`) is READY. A live browser capture confirms the condensed high-contrast Instrument Serif headline is rendered for **“Prescriptions, made clear.”**

## August 22, 2026 production non-destructive validation

The stable production alias (`https://clinicocr-git-main-koustav5.vercel.app`) resolved to deployment `dpl_FvTWBf4oYvLnkBBLzYc1jmzL1Vac`, built from commit `3e7c0dfac5974531269726a7c77481fe0648fe80`, with `READY` production status. The settled desktop landing page showed the centered **Home**, **About**, and **Workflow** navigation, the sole right-side **Sign in** action, the **Language aware** badge, and the Instrument Serif Hero. Navigating to Workflow reached the sticky clinical visual and live scroll progression: the initial temporary-source / upload state appeared at the top of the section, while the lower state reached **Approve the record** before the secure-sign-in panel. No public action submitted clinical information.

The user-authorized Google/Clerk handoff completed from the live Sign In panel and reached `/workspace`. The protected dashboard loaded with three patients and one saved prescription. A read-only medicine search for `Calpol` returned the existing approved record; its detail page showed clinician-reviewed content and the legacy-source notice, without exposing a raw-OCR panel. Opening `/upload` without selecting a patient or file showed the temporary-image guidance and did not submit analysis. Returning to the dashboard confirmed the saved-prescription count remained one, so this validation did not create, alter, approve, export, star, tag, or annotate a clinical record.

Vercel runtime logs scoped to the current deployment during this pass recorded successful HTTP 200 responses for `auth.me`, `clinic.dashboard`, `clinic.prescriptions.search`, `clinic.prescriptions.get`, and `clinic.patients.list`. No Clerk, session, protected-route, or analysis-timeout failure occurred in these requests. The only error-level entry was the pre-existing PostgreSQL connection-string SSL-mode compatibility warning emitted with a successful `auth.me` response; it is not a Clerk or routing failure. The connected-browser interface does not expose DevTools console or direct network panels, so the production runtime log query provides the available request-level evidence. Direct live mobile/tablet viewport capture remains incomplete because the connected-browser interface cannot select those viewport dimensions.

## Fixed workflow-card refinement

In commit `636a153`, the scroll-driven workflow now keeps the outer left clinical card static at its desktop sticky position throughout Upload, Review, and Approve. The former vertical floating animation was removed from that outer wrapper; only the keyed inner visual transitions between temporary source, doctor review, and text-only approval content. The existing 46%-viewport scroll threshold, optional click/hover/focus step controls, `aria-pressed` semantics, and active progress rail remain unchanged. The landing regression suite now asserts the fixed wrapper contract and its active-stage updates; the complete suite passed with 47 tests across 17 files, together with TypeScript, Vercel build, serverless-smoke, and secret-scan checks. Production deployment `dpl_DpizcMjfaczQTrqcpzyqCYtZz1jD` is READY at `https://clinicocr-dq1emul7a-koustav5.vercel.app` and holds the stable production alias. Its landing page rendered successfully before the connected browser extension timed out during the subsequent scroll interaction; no further browser interaction was attempted in that session.

## Resu-style sticky workflow verification

Commit `31346d6` (**Remove sticky workflow overflow constraints**) reached Vercel production as `dpl_DDoURMx9bWYxWw4j6MNuWD4eVXYm` with READY status at `https://clinicocr-a70dgsdy7-koustav5.vercel.app`; the stable main-branch alias is assigned to this release. The change removes the landing root overflow utility that had stopped the desktop sticky container from staying engaged across the full workflow range.

On the settled desktop production page, navigating to Workflow showed the left clinical card and its adjacent vertical progress rail at the same viewport position through all three states. The right-hand column alone progressed from **Upload the prescription**, to **Review the draft**, to **Approve the record**. Within the fixed card, the clinical visual changed from **Temporary source**, to **Doctor review**, to **Text-only record / Approved / Ready to save**, while the active rail followed the stage. The final approval check specifically confirmed that the card remained visible and fixed rather than releasing before the approval content. No sign-in action was submitted and no clinical data was viewed or changed during this public-page validation.

## Approval-stage normal-scroll adjustment

Following the requested interaction refinement, commit `9bdfbc7` removes the desktop-only extended bottom spacer from the right-hand workflow-stage list. Upload and Review retain the fixed left clinical visual, but the visual now exits its sticky range as the **Approve the record** stage moves upward, allowing the workflow and its card to continue in ordinary document flow into the Secure Sign In section.

The production deployment `dpl_EZjKsGYWNF4rFzhXwCp7Su1ywR1U` is READY at `https://clinicocr-lcl46j62l-koustav5.vercel.app`. In the desktop browser, the approval stage was reached with **Text-only record / Approved / Ready to save** active; the card was scrolling upward normally and the Secure Sign In panel had entered the viewport directly below it. This is the requested release behavior. The focused landing suite and full regression suite passed, for 47 tests across 17 files, with TypeScript clean. No clinical action was invoked.

## Delayed approval release correction

The first normal-scroll release was observed to begin too early, while the Review stage was still moving through the viewport. Commit `7d0754b` restores a measured desktop-only `50vh` workflow tail, so the visual stays fixed through the full Review stage and holds while the approval content first reaches the reading path. It then exits sticky flow only after **Approve the record** has moved upward, allowing the Secure Sign In section to follow naturally.

Deployment `dpl_HEL9XG5NcFEJ3YZDi7nSNKCgCTqH` is READY at `https://clinicocr-dh8ltb2i8-koustav5.vercel.app`. In the desktop production browser, **Approve the record** was visible near the top of the workflow with the **Approved** visual still held in its sticky position; continuing downward released the card and brought the Secure Sign In panel into view. This confirms the corrected timing. The focused landing test, full 47-test suite, and TypeScript check passed. No clinical action was invoked.

## Repository cleanup and public address

Commit `ca497e5` reorganizes the tracked application code into `frontend/`, `backend/`, and `shared/` areas, while retaining compact `api/`, `drizzle/`, and `scripts/` support folders. Vite, TypeScript, Vitest, the Vercel function entrypoint, build scripts, and deployment tests were updated to use the new paths. The tracked Manus runtime/debug collector, unused dialog component, and template metadata were removed; the development dependencies for the removed Vite hooks were also removed. The README is now a concise project guide with folder explanations and a clear credit line, and the root `LICENSE` adds the MIT license.

The refactor passed TypeScript, all 47 tests across 17 test files, the Vercel production build, serverless smoke test, and secret scan. Vercel deployment `dpl_8MA4ABc458jUcmGgWNPArNyGvPb9` is READY. The existing short stable alias `https://clinicocr-three.vercel.app` was opened successfully in the browser and is now the canonical address documented in the README; the random per-deployment Vercel URL is no longer presented as the public link.
