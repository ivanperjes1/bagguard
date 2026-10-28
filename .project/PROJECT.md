<!-- OWNER: Build (with the user) · READERS: every agent · READ THIS FIRST -->
# AMA Lipa BagGuard

**One-liner:** A student bag registration and campus gate verification system for AMA Computer College – Lipa Campus.

## Goal
Help students register bags, staff review requests, and campus guards verify active approvals at the gate.

## Target users
Students, campus security guards, and administrators at AMA Computer College – Lipa Campus.

## Status
- Stage: building
- Live URL: —
- Repo: —

## What exists today
<!-- Kept current by the Build agent after each build -->
- Student registration with USN normalization, duplicate prevention, pending approval, and optional bag-only photo upload saved in this browser.
- Exact-USN BagTracker lookup and local-preview gate verification with audit records.
- Browser-local administrator setup, staff role assignment, approvals, rejection, revoke/deactivate/archive, bulk approval, searchable scan history, and reports.
- Responsive navy, maroon, and gold campus gatehouse interface with per-route metadata and generated public sitemap entries.

## Constraints / must-nots
The current preview stores registrations, roles, approvals, photos, and scan history in this browser only; data is not synced across devices and local roles are not real access control. Do not enter real student records until a shared, secure backend is connected. Uploaded images must be bag-only; no faces, student IDs, or documents are accepted.
