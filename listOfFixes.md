# Production Readiness — List of Fixes

## Critical

- [x] **1. Remove `MONGODB_URI` from `next.config.ts` `env` block** — DONE. Verified no
      Mongo URI appears in `.next/static` client bundles. → **Follow-up (you): rotate
      the Atlas password, since past builds may contain it.**
- [ ] **2. Rebuild password reset (token-based flow)** — endpoint currently returns 503;
      forgotten password = locked out. _(Needs your input: pick an email provider —
      Resend / SES / other — and provide API credentials.)_
- [ ] **3. Rate limiting on auth/register/reset** — no brute-force protection. On
      Netlify serverless, needs an external store. _(Needs your input: Upstash Redis
      account or Netlify edge rate limiting choice.)_
- [ ] **4. Fix DB region mismatch** — Atlas (Singapore) ↔ Netlify (Ohio) adds huge
      latency to every request. Move one to co-locate. _(Needs your input: infra
      decision — migrate Atlas cluster or change Netlify region.)_

## High

- [x] **5. Request-body validation with zod** — DONE. `lib/api/validation.ts` has
      schemas for every mutating route (children, temperatures, observations,
      medications, medication-logs, reminders, register); malformed payloads now
      return 400 with a field-level message instead of Mongoose 500s. Bonus fix:
      observations GET/POST/DELETE were missing ownership checks (any logged-in user
      could read/write/delete another user's observations) — now enforced via
      `requireOwnedChild`.
- [x] **6. CI workflow for lint / typecheck / tests / build** — DONE.
      `.github/workflows/ci.yml` runs lint, format check, tsc, vitest, and build on
      push/PR to main. Also fixed the pre-existing lint errors and 66 failing/stale
      tests so the gate starts green (suite: 103/103 passing).
- [x] **7. Pin `next-auth` beta to exact version** — DONE. Pinned to `5.0.0-beta.30`.
- [ ] **8. Auth/session hardening** — verify `AUTH_SECRET` is set in Netlify, cookie
      flags, session maxAge; consider email verification at registration. _(Partly
      needs you: check Netlify env vars.)_

## Medium

- [x] **9. Tighten CSP** — DONE. `unsafe-eval` is now dev-only in `next.config.ts`.
- [x] **10. Health check endpoint** — DONE. `GET /api/health` pings the DB, returns
      200/503. **You: point UptimeRobot (or similar) at it after deploy.**
- [x] **11. Audit DB indexes** — DONE (audited; already good — compound indexes on
      userId/childId/timestamp exist on all models). **You: confirm Atlas automated
      backups are on and test a restore.**
- [x] **12. Error responses never leak internals** — DONE. `withHandler` now returns a
      generic 500 message in production; details go to logs/Sentry only.
- [ ] **13. Fix local dev credentials** — `.env.local` Atlas password rejected; create a
      separate Atlas dev user/DB so local dev never touches prod. _(Needs you: Atlas
      console.)_

## Lower priority

- [x] **14. Test coverage gaps** — DONE. Added `medications.test.ts` and
      `reminders.test.ts` (28 new tests incl. cross-user isolation checks; `register`
      was already covered by `auth.test.ts`). Suite: 131 tests, all passing.
- [ ] **15. Data lifecycle** — account deletion with cascade + data export. _(Needs your
      input: product/scope decision.)_
- [ ] **16. Operational runbook** — deploy, rollback, secret rotation, backup restore.
      _(Claude can draft; you fill in Netlify/Atlas specifics.)_
- [x] **17. Dependabot for security patches** — DONE. `.github/dependabot.yml` — weekly
      npm + github-actions updates, minor/patch grouped, gated by CI from item 6.
