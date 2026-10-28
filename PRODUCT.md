<!-- Generated from .project/PROJECT.md by the engine — do not run `impeccable init`, which would interview a user who isn't here. Edit .project/PROJECT.md; this file is regenerated from it. -->
# AMA Lipa BagGuard

**Platform:** Responsive web — Next.js, React, Tailwind. shadcn/ui and lucide are installed and available; the direction decides whether they fit or whether this surface needs its own vocabulary.
**Task mode:** Operate (pass as `--mode operate` to any script)

## What this is

A student bag registration and campus gate verification system for AMA Computer College – Lipa Campus.

## What it enables

Help students register bags, staff review requests, and campus guards verify active approvals at the gate.

## Primary user

Students, campus security guards, and administrators at AMA Computer College – Lipa Campus.

## What exists today

Student registration with USN normalization, duplicate prevention, pending approval, and optional bag-only photo upload saved in this browser. - Exact-USN BagTracker lookup and local-preview gate verification with audit records. - Browser-local administrator setup, staff role assignment, approvals, rejection, revoke/deactivate/archive, bulk approval, searchable scan history, and reports. - Responsive navy, maroon, and gold campus gatehouse interface with per-route metadata and generated public sitemap entries.

## Brand commitments & durable constraints

The current preview stores registrations, roles, approvals, photos, and scan history in this browser only; data is not synced across devices and local roles are not real access control. Do not enter real student records until a shared, secure backend is connected. Uploaded images must be bag-only; no faces, student IDs, or documents are accepted.

- **This project already HAS a committed visual world — do NOT offer a design picker.** `.project/DESIGN_SYSTEM.md` records a direction someone decided on, and the code, tokens and components are built around it. Read it, inherit it, and make the requested change inside it. Dealing six alternative worlds here offers to throw away a working design system nobody asked you to replace.
- **Tailoring is not redesigning.** "Make it about my business", new copy, a different logo, swapped imagery, a brand colour — all of that lands INSIDE the committed world. Change what was asked for and leave the direction alone.
- **The one exception is an explicit, whole-app redesign** — the user asking for a different look outright, not merely a change that happens to be large. Then the direction is open again and the picker applies. When they name the new direction themselves, that is the decision: pin it and build, still without a picker.
- Never run `impeccable serve-question`, with any flag (`--schema` included). It is disabled in this sandbox and always fails. Ask only through the design-picker command, and only when the instructions above say the user is choosing.
- Design tooling is one launcher, `scripts/impeccable <verb>` in the skill folder (`build-phase status`, `concept-seed`, and so on). The `node …/scripts/*.mjs` files from older versions do not exist here; never run one.
- The user's own words always outrank the roll. A direction, palette, face or reference they named is pinned; the roll only decides what they left open.
- Two review rounds is the budget, then ship and report open items honestly under the reviewer's own verdict — never announce a table with open findings as a pass.
- Web fonts load through Fontsource, never `next/font/google` — this sandbox has no Google egress, so the fetch hangs at compile and the preview renders blank.
- No AI-builder badge, watermark, or attribution anywhere in the product.
- Decisions recorded in `.project/` (ledger, DESIGN_SYSTEM.md) are commitments; contradict one only when the user asks.

## Positioning

A student bag registration and campus gate verification system for AMA Computer College – Lipa Campus.

## Operating Context

Responsive web, built unattended in one pass. Task mode: Operate.

## Evidence on Hand

Student registration with USN normalization, duplicate prevention, pending approval, and optional bag-only photo upload saved in this browser. - Exact-USN BagTracker lookup and local-preview gate verification with audit records. - Browser-local administrator setup, staff role assignment, approvals, rejection, revoke/deactivate/archive, bulk approval, searchable scan history, and reports. - Responsive navy, maroon, and gold campus gatehouse interface with per-route metadata and generated public sitemap entries.

## Product Principles

- Clarity of the task beats decoration; the interface earns attention only where the product does.
- Say what is true: no invented prices, customers, benchmarks or capabilities the product does not have.
