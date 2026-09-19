# PTCI Cultural Night Tabulation API — Agent Context

**Purpose:** Backend for the PTCI Cultural Night tabulation system. Judges score three categories from the Vue frontend; admins manage teams/contestants/accounts and read scoreboards.

**Domain:** Vocal Solo is scored per **contestant**; Interpretative Dance and Modern Dance are scored per **team**. Each category's `subject` in `scoring/categories.ts` decides which, and every subject-dependent query derives from it. A contestant belongs to a team (`contestants.team_id`). `cand_gender` is stored and displayed but is **never** a judging axis — all contestants are judged in one list.

**Frontend:** `../Frontend` (Vue 3 + Pinia + TanStack Query). It talks to this API only, with `axios { withCredentials: true }` and `VITE_API_URL=<origin>/api`. Its DTOs (`src/features/**/types`) are the contract — ids and decimals are strings there.

**Stack:** Fastify 5 · TypeScript ESM (`NodeNext`, imports end in `.js`) · mysql2 pool · jose HS256 JWT in an httpOnly cookie · bcryptjs · zod

## Rules

- **Response contract:** success bodies carry `status` (200 or `"success"`), `message`, and usually `data`; errors are always `{ status, message }` with the same HTTP status. Never return raw DB rows — map through the service layer (`scoreboardService` stringifies numbers/ids).
- **Layering:** `routes/` parse + call services · `services/` validate (zod via `lib/validate.ts` → 422) + business rules · `repositories/` SQL only. No SQL in routes/services.
- **Categories live in one place:** `src/scoring/categories.ts` — criteria, maxima *and* the scoring subject. Adding a criterion or category = edit that file (tables are generated from it by `db/initSchema.ts`; regenerate the `db/schema.sql` mirror).
- **SQL identifiers** (table/column names) are interpolated only from that static config. Every user value goes through `?` placeholders.
- **Auth:** `plugins/auth.ts` → `authenticate` (cookie → JWT → fresh user row) and `requireRole('admin')`. Judges submit, admins read/manage. `has_submitted` flips only once a judge has scored every subject in a category (batch submit, inside the transaction).
- **Errors:** throw `HttpError` (`lib/httpError.ts` helpers) — the global handler formats it. Don't `reply.send` errors manually.
- **Logging side effects:** `logActivity(request, action, details)` is fire-and-forget; never await it in the hot path.
- **Tests:** `npm run test:api` — end-to-end via `app.inject()` against `<MYSQL_DATABASE>_test`. Add a `check(...)` there when you add an endpoint.

## Routes (prefix `/api`)

auth: `POST login` · `POST check-session` · `GET me` · `POST logout` · `PUT has-submitted`
teams: `GET /` · `POST /` · `PUT /:id` · `DELETE /:id`
contestants: `GET /` · `POST /` · `PUT /:id` · `DELETE /:id`
scores: `POST /:category` · `POST /:category/batch` · `GET /:category/mine` · `GET /:category/judges` · `GET /:category/final` · `GET /categories` (categories: `vocal`, `interpretative`, `modern`)
users (admin): `GET /` · `POST /` · `PUT /:id/password` · `PUT /:id/reset-submission` · `PUT /:id/active` · `DELETE /:id`
activity-logs (admin): `GET /`
`GET /health` (no prefix)

Details: `docs/API.md`. Deploy: `docs/HOSTINGER.md`.
