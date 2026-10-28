# AMA Lipa BagGuard

Student bag registration and campus gate verification for AMA Computer College – Lipa Campus.

## What BagGuard does

- Students submit one bag registration per USN. New registrations remain pending until an administrator reviews them.
- BagTracker checks one exact USN and reports its current registration status without exposing a searchable registry.
- Signed-in guards and administrators can verify bags at the gate. Each completed gate check records the searched USN, result, timestamp, checkpoint, and operator.
- Administrators can approve, reject, deactivate, revoke, reactivate, or archive records; review staff access and audit history; and search paginated registration reports.
- Report downloads contain only the 25 records on the current page. The admin dashboard export contains the pending and approved rows currently displayed.

## Pages

- `/` — campus welcome and service links
- `/register` — student bag registration
- `/bagtracker` — exact-USN status lookup
- `/scan` — guard/admin checkpoint verification
- `/report` — administrator registration report
- `/admin/login` — staff sign-in and account creation
- `/admin/setup` — one-time first-administrator setup
- `/admin` — registration approvals, staff access, and recent activity
- `/admin/audit` — searchable, paginated checkpoint history

## Stack and data

This project runs on Next.js, React, TypeScript, Tailwind CSS, the included Imagine database, Better Auth, and Imagine file storage. It does not use Supabase because the project is configured to keep the included database service.

The Drizzle schema in `src/db/schema.ts` defines profiles, registrations, gate scans, administrative events, and the one-time admin bootstrap record. Apply schema changes with `npm run db:push`. All data access runs through server-side functions and Server Actions; role checks are enforced there rather than trusted to browser state.

Registration photos are optional bag-only images. The included file service makes uploaded files publicly readable to anyone with the link, so the form warns students not to upload faces, student IDs, or documents. Private documents are not accepted.

## First administrator setup

1. Add `BAGGUARD_ADMIN_SETUP_TOKEN` using Imagine’s secure key prompt. Use a unique, strong code and share it only with the intended first administrator.
2. Open `/admin/setup`, create an account with an email address the administrator can verify, and confirm the email.
3. Sign in at `/admin/login`, return to `/admin/setup`, and enter the setup code. Only the first verified account can claim this role.
4. From the admin dashboard, assign Guard or Admin access to existing staff accounts. Staff members first create an account and sign in once; they cannot choose their own role.

No administrator password or role is hard-coded. The setup code is checked only on the server and the bootstrap claim can succeed once.

## Local development

```sh
npm install
npm run db:push
npm run dev
```

The app expects the Imagine-provided database, authentication, and storage environment to be available. Never commit a real secret or put a server credential in a browser-accessible variable.

## Manual acceptance checks

1. Submit a registration with a valid USN and confirm it appears as pending in the admin dashboard.
2. Submit the same USN again and confirm the app rejects the duplicate.
3. Search BagTracker using that USN and confirm it reports pending approval, not authorization.
4. Approve it from the admin dashboard and verify the same USN through BagTracker and Gate Scan.
5. Revoke or deactivate the record and confirm the next gate check denies it immediately.
6. Check an unknown USN at the gate and confirm the attempt appears in the scan history.
7. Search and filter the report, move between pages, and export the current page only.
8. Sign in as an account without a staff role and confirm it cannot open protected reports, administration, or gate verification.

## Build checks

Run `npx tsc --noEmit` for a strict TypeScript check. The live preview is provided by Imagine after the build.
