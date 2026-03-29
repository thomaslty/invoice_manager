## Why

The app currently has no authentication — anyone can access all invoices, templates, and fonts. Adding OIDC authentication enables multi-user support with SSO, scoping each user's data while keeping the deployment simple (no password management, no user registration forms).

## What Changes

- **OIDC login flow**: Server-side Authorization Code flow via `openid-client`. Authentik is the first-class IdP; any OIDC-compliant provider works. No frontend OIDC library needed — backend handles redirects and token exchange.
- **Login page**: Frontend `/login` route with SSO button ("Sign in with {OIDC_NAME}"). Unauthenticated users see the login page first; clicking the button initiates the OIDC flow. Logout redirects back to this page.
- **Session management**: Cookie-based sessions (`session_id`, HttpOnly, SameSite=Lax) with configurable expiry (default 30 min), auto-renewed on activity. New `sessions` DB table.
- **User model**: New `users` table keyed by `email`. Users auto-created on first OIDC login (configurable via `OIDC_AUTO_CREATE_USER`).
- **Invoice/template scoping**: `user_id` FK added to `invoices` and `templates`. All queries filtered by authenticated user. Existing data migrated to `__admin__` user.
- **Font ownership**: `uploaded_by` FK added to `fonts` (nullable — null means system font). System fonts cannot be deleted. Users can only delete their own uploaded fonts. All fonts remain globally visible.
- **Sidebar NavUser**: New user dropdown in sidebar footer with avatar, theme toggle (Light/Dark/System), and logout. Replaces standalone ModeToggle.
- **BYPASS_LOGIN mode**: When `BYPASS_LOGIN=true`, skip all OIDC, auto-login as `__admin__` user. Designed for dev and Playwright E2E testing.
- **CORS removal**: Remove `cors` package entirely. All deployments use a reverse proxy (nginx or Vite), so browsers only talk to a single origin. `SameSite: Lax` cookies handle CSRF. **BREAKING** for anyone hitting the backend directly on :3000 from a different origin (not a supported deployment).

## Capabilities

### New Capabilities
- `oidc-auth`: OIDC authentication flow — discovery, login redirect, callback, token exchange, user upsert, session creation/validation/renewal/logout, BYPASS_LOGIN mode
- `user-scoping`: Per-user data isolation — user_id on invoices/templates, uploaded_by on fonts, query filtering, ownership checks on mutations
- `nav-user`: Sidebar user dropdown — avatar with fallback, theme toggle (replaces ModeToggle), logout action

### Modified Capabilities
- `dark-mode-toggle`: Theme toggle moves from standalone sidebar footer component into the NavUser dropdown menu. Same functionality (Light/Dark/System), different location.

## Impact

- **Database**: 2 new tables (`users`, `sessions`), 3 altered tables (`invoices`, `templates`, `fonts`). Migration assigns existing data to `__admin__` user.
- **Backend dependencies**: Add `openid-client`, `cookie-parser`. Remove `cors`.
- **Backend code**: New auth middleware, auth routes, auth service. All controllers/services updated to pass and filter by `userId`.
- **Frontend code**: New `AuthProvider` context, `LoginPage` component, `NavUser` component. Modified `App.jsx` (login route + auth redirect), `Sidebar.jsx`, `api.js`, `FontCard.jsx` (use `canDelete` flag). New shadcn `avatar` and `card` components.
- **Docker**: OIDC env vars in production compose, `BYPASS_LOGIN=true` in dev compose.
- **E2E tests**: 2 new test files (`auth.spec.js`, `user-scoping.spec.js`). Existing tests unaffected (BYPASS_LOGIN).
- **Environment**: 11 new env vars (4 required for OIDC mode, rest optional with defaults).
