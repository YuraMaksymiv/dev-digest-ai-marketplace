# Engineering Insights — worked examples

Vague (don't write like this) vs useful (write like this). Source of the
pattern — see `references.md`.

---

## 1. General examples

**Vague:**
> Promises can be tricky.

**Useful:**
> - 2026-05-14 — `Promise.all()` on the ingest pipeline times out after
>   ~30 items under load; switch to `Promise.allSettled()` with batches of
>   10. `src/ingest/pipeline.ts:112`.

**Vague:**
> Be careful with async in checkout.

**Useful:**
> - 2026-05-14 — Checkout-flow state always goes through Zustand
>   (`cartStore.ts`), because 3 components share the cart — local
>   `useState` in any of them desyncs the item count.

---

## 2. Examples per heading (illustrative, for format only)

A fictional repository with an `api/` service and a `web/` app.

### What Works
> - 2026-05-14 — Input validation already happens at the HTTP edge
>   (`api/src/http/validate.ts`) — services can trust their arguments;
>   don't re-validate inside `api/src/orders/service.ts`.

### What Doesn't Work
> - 2026-05-14 — Don't assume `api/src/contracts` and `web/src/contracts`
>   are identical — they are copies, not a shared package, and have
>   already drifted (`order.ts`). A contract change must be mirrored by hand.

### Codebase Patterns & Tool/Library Notes
> - 2026-05-14 — Migrations never run on `npm run dev` or on server start —
>   after a schema change in `api/src/db/schema/*` run `npm run db:migrate`
>   by hand, or you hit `relation ... does not exist`.

### Decisions
> - 2026-05-14 — Order totals are recomputed on the server from line items
>   (`api/src/orders/helpers.ts:40`), never taken from the client payload —
>   the client cannot inflate or discount its own total.

### Recurring Errors & Fixes
> - 2026-05-14 — `extension "vector" does not exist` during migrate → the
>   tests ran against a local Postgres instead of the Docker one from
>   `docker-compose.yml`.

### Session Notes
> - 2026-05-14 — The e2e suite only passes on an empty database; use the
>   hermetic runner (`scripts/e2e.sh`), not a plain `npm test`.

### Open Questions
> - 2026-05-14 — Unclear whether the drift between the two contract copies
>   is intentional; check with the module owner before writing a sync
>   script.

---

## What makes an entry "useful" instead of "vague"

- Names a concrete file/function/library, not an abstract category
  ("Promise.all() in pipeline.ts", not "async").
- Gives an action or a reason that applies without remembering the session
  ("switch to allSettled with batches of 10", not "be careful").
- Reads "cold": someone (or some agent) who never saw this session
  understands the point from one line.
