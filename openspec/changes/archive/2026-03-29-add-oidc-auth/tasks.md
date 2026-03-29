## 1. Database Schema & Migration

- [x] 1.1 Add `users` and `sessions` tables to `backend/src/db/schema.js`
- [x] 1.2 Add `user_id` FK to `invoices` and `templates` tables in schema
- [x] 1.3 Add `uploaded_by` FK (nullable) to `fonts` table in schema
- [x] 1.4 Generate and apply Drizzle migration (`npm run db:generate && npm run db:migrate`)
- [x] 1.5 Write migration seed logic: create `__admin__` user, backfill `user_id`/`uploaded_by` defaults, apply NOT NULL constraints

## 2. Backend Auth Foundation

- [x] 2.1 Install `openid-client` and `cookie-parser`; remove `cors` from dependencies
- [x] 2.2 Create `backend/src/services/authService.js` — OIDC client init (dual discovery mode), user upsert by email, session CRUD (create, lookup+join, delete, cleanup expired)
- [x] 2.3 Create `backend/src/middleware/auth.js` — session validation middleware (cookie read, DB lookup, expiry check, lazy renewal) and bypass middleware (always set `__admin__` user)
- [x] 2.4 Create `backend/src/routes/auth.js` — GET `/login`, GET `/callback`, POST `/logout`, GET `/me` with bypass-mode variants
- [x] 2.5 Update `backend/src/index.js` — remove `cors()`, add `cookieParser()`, mount auth routes, apply session middleware to `/api` (exclude `/api/auth/*` and `/api/health`), add bypass startup logic with warning log
- [x] 2.6 Update `backend/.env.example` with all new environment variables and Authentik example comments

## 3. Backend Query Scoping

- [x] 3.1 Update `invoiceService.js` — add `userId` parameter to `listInvoices`, `getInvoiceById`, `createInvoice`, `updateInvoice`, `deleteInvoice`
- [x] 3.2 Update `invoicesController.js` — pass `req.user.id` to all service calls
- [x] 3.3 Update `templateService.js` — add `userId` parameter to all CRUD operations
- [x] 3.4 Update `templatesController.js` — pass `req.user.id` to all service calls
- [x] 3.5 Update `snapshotService.js` — `cloneSnapshot` sets `userId` on the new invoice; add helper to verify snapshot's parent invoice ownership by looking up `snapshot.invoiceId` and checking `invoice.userId === userId`
- [x] 3.6 Update `snapshotsController.js` — pass `req.user.id`; for nested routes (`/invoices/:invoiceId/snapshots`), verify the invoice belongs to `req.user.id` before list/create; for direct routes (`/snapshots/:id`, `/snapshots/:id/clone`), look up snapshot → parent invoice → verify ownership before get/delete/clone
- [x] 3.7 Update `fontService.js` — add `uploadedBy` to `createFont`/`createFontWithFile`, add ownership check to `deleteFont` (system font 403, wrong user 403)
- [x] 3.8 Update `fontsController.js` — pass `req.user.id` to create/delete, return 403 responses; in `list`, append a `canDelete` boolean to each font in the response (true if font is non-system AND `uploaded_by === req.user.id`, false otherwise)

## 4. Docker & Environment

- [x] 4.1 Update `docker-compose.yml` — add OIDC env vars to backend service
- [x] 4.2 Update `docker-compose.dev.yml` — add `BYPASS_LOGIN: "true"` to backend environment

## 5. Frontend Auth

- [x] 5.1 Add shadcn `avatar` component (`npx shadcn@latest add avatar`)
- [x] 5.2 Create `frontend/src/components/auth/AuthProvider.jsx` — context with `/api/auth/me` call, loading state, 401 redirect to `/api/auth/login`
- [x] 5.3 Update `frontend/src/lib/api.js` — add global 401 handler that redirects to `/api/auth/login`
- [x] 5.4 Update `frontend/src/App.jsx` — wrap routes with `<AuthProvider>`
- [x] 5.5 Create `frontend/src/components/auth/LoginPage.jsx` — login page with shadcn Card, app name, "Sign in with {OIDC_NAME}" button that navigates to `/api/auth/login`
- [x] 5.6 Update `frontend/src/App.jsx` — add `/login` route rendering `LoginPage`, unauthenticated redirect goes to `/login` instead of `/api/auth/login`
- [x] 5.7 Update `frontend/src/components/auth/AuthProvider.jsx` — redirect to `/login` on 401 instead of `/api/auth/login`
- [x] 5.8 Update `frontend/src/lib/api.js` — global 401 handler redirects to `/login` instead of `/api/auth/login`
- [x] 5.9 Update `backend/src/routes/auth.js` — callback error and logout redirect to `/login` instead of `/api/auth/login` or `/`
- [x] 5.10 Add `GET /api/auth/config` endpoint — returns `{ oidcName }` so the login page can display the provider name without hardcoding

## 6. Frontend NavUser, Sidebar & Font UI

- [x] 6.1 Create `frontend/src/components/layout/NavUser.jsx` — user dropdown with avatar fallback, theme toggle (Light/Dark/System), logout action
- [x] 6.2 Update `frontend/src/components/layout/Sidebar.jsx` — replace `<ModeToggle>` in footer with `<NavUser>`, remove ModeToggle import
- [x] 6.3 Update `frontend/src/components/fonts/FontCard.jsx` — use `canDelete` flag from API response instead of `font.source === "system"` check; disable delete button when `canDelete` is false

## 7. E2E Tests

- [x] 7.1 Create `e2e/auth.spec.js` — auth bypass and NavUser UI tests:
  - App loads without login redirect (BYPASS_LOGIN works end-to-end)
  - `GET /api/auth/me` returns `{ email: 'admin@localhost', name: 'Admin' }`
  - NavUser visible in sidebar footer showing user name and email
  - NavUser dropdown opens with theme options (Light, Dark, System) and Log out
  - Clicking "Dark" applies dark class to document root
  - Clicking "Light" removes dark class from document root
  - Clicking "Log out" in bypass mode redirects to `/` (no-op logout)
  - Standalone ModeToggle button is no longer in sidebar footer
- [x] 7.2 Create `e2e/user-scoping.spec.js` — data ownership and font restrictions:
  - Create invoice via UI → appears in dashboard invoice list
  - Edit invoice from dashboard → navigate, update field, save, verify change persists
  - Delete invoice from dashboard → confirm removal from list
  - System font (e.g. Arial) has delete button disabled (`canDelete: false`)
  - Upload a font via UI → font appears in list with delete button enabled (`canDelete: true`)
  - Delete own uploaded font → succeeds, font removed from list
  - `DELETE /api/fonts/:id` for system font returns 403 (API-level check)
- [x] 7.3 Add login page E2E tests to `e2e/auth.spec.js`:
  - Login page renders at `/login` with SSO button
  - SSO button navigates to `/api/auth/login`
  - Authenticated user visiting `/login` redirects to `/`
- [x] 7.4 Run existing `invoice-editor.spec.js` tests (7 tests) to verify no regressions with auth middleware
- [x] 7.5 Run existing `fonts.spec.js` tests (3 tests) to verify no regressions with auth middleware
