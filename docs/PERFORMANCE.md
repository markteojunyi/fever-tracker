# Performance & latency diagnostics

This app sometimes feels slow on writes (renaming a record, adding a log).
This doc explains **why**, how to **measure** it, and what was changed.

## TL;DR root cause

The database and the app server are on opposite sides of the Pacific:

| Piece            | Location                  |
| ---------------- | ------------------------- |
| MongoDB Atlas    | **Singapore**             |
| Netlify Functions | **Ohio (`us-east-2`)**   |

Every database query is a round-trip across that distance (~200 ms each way).
API handlers that make **several sequential queries** multiply that latency.
Region pinning on Netlify requires a paid plan, so the fix is **not** to move
regions — it's to **make fewer round-trips** and (later) update the UI
optimistically so the wait isn't felt.

## How to measure the timing

Instrumentation lives in [`lib/api/withHandler.ts`](../lib/api/withHandler.ts),
behind a `TIMING` flag. Each authenticated API request is split into phases:

| Phase     | What it measures                | If it's high…                                  |
| --------- | ------------------------------- | ---------------------------------------------- |
| `auth`    | JWT session check               | unlikely (no DB hit with JWT sessions)         |
| `connect` | DB connection / TLS handshake   | **cold start** — first request to a new server |
| `handler` | the actual queries              | **region latency × number of round-trips**     |
| `total`   | sum of the above                | overall request time on the server             |
| `cold`    | `true` on a fresh server only   | tells you if `connect` cost was a cold start   |

### Option A — Browser (easiest)

1. Open the deployed app, open **DevTools → Network**.
2. Perform the slow action (rename a record, add a log).
3. Click the API request (e.g. `children?id=...`).
4. Look at the **`Server-Timing`** response header (also shown under the
   **Timing** tab in some browsers). You'll see:

   ```
   auth;dur=11, connect;dur=1, handler;dur=380, total;dur=392, cold;desc="false"
   ```

### Option B — Netlify function logs

1. Netlify dashboard → your site → **Logs → Functions** (or
   **Deploys → Functions**).
2. Trigger the action, then read lines like:

   ```
   [timing] PATCH /api/children cold=false auth=11 connect=1 handler=380 total=392ms
   ```

## How to read the numbers

- **`handler` is the big one, even when `cold=false`** → it's query round-trip
  latency. Confirms the Singapore ↔ Ohio distance is the cost. The fix is
  fewer queries per request (done — see below).
- **`connect` is big, only when `cold=true`** → cold-start handshake. Only the
  first request after the server idles is slow; the rest are fast. Less of a
  concern for steady use.
- **`auth` is big** → unexpected with JWT sessions; would warrant a closer look.

## What was changed

Round-trips were reduced without weakening ownership/security checks:

| Action                        | Before              | After               |
| ----------------------------- | ------------------- | ------------------- |
| Rename record (`PATCH /api/children`) | 2 round-trips | **1** |
| Add med log (`POST /api/medication-logs`) | 3 round-trips | **2** |

- **Rename**: dropped a redundant `findOne` ownership pre-check —
  `findOneAndUpdate({ _id, userId })` already enforces ownership.
- **Add med log**: the ownership check and medication lookup are independent,
  so they now run in parallel (`Promise.all`) instead of one after another.

Still on the table (not yet done):

- **Optimistic UI** in `app/page.tsx`: update the screen immediately and send
  the request in the background, so the round-trip isn't felt at all. This is
  the biggest *perceived* speed win.
- **Observations routes** (`GET/POST/DELETE /api/observations`) have a separate
  **data-isolation gap** (they don't filter by `userId`) — fix that before
  optimizing them.

## Turning the instrumentation off

When you no longer need the numbers, set `TIMING = false` in
[`lib/api/withHandler.ts`](../lib/api/withHandler.ts) (or delete the timing
block). It adds negligible overhead but produces log noise.
