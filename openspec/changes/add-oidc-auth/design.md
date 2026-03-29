## Context

The invoice manager is a monorepo (Express 5 backend + React 19 frontend) with PostgreSQL, currently with zero authentication. All data is globally accessible. The backend serves API routes under `/api`, with Vite (dev) or nginx (prod) reverse-proxying to it — the browser always talks to a single origin.

Existing architecture: Routes → Controllers → Services → DB (Drizzle ORM). No middleware layer exists yet. Frontend uses a simple `api.js` fetch wrapper with no auth headers.

The target IdP is Authentik (standard OAuth2/OIDC provider). The solution must work with any OIDC-compliant provider.

## Goals / Non-Goals

**Goals:**
- OIDC authentication with server-side Authorization Code flow
- Cookie-based session management (simple, no JWTs in localStorage)
- Per-user invoice and template isolation
- Font visibility shared globally, delete restricted to owner
- BYPASS_LOGIN mode for development and E2E testing
- Zero frontend awareness of auth implementation details

**Non-Goals:**
- User roles, permissions, or admin panels
- Password authentication or local user registration
- User profile customization or avatar upload
- Multi-IdP support
- CORS configuration (removed — not needed behind reverse proxy)
- Template sharing between users

## Decisions

### 1. Server-side OIDC flow (not client-side)

**Choice**: Backend handles the entire OIDC flow — redirects, code exchange, token validation. Frontend just follows HTTP redirects.

**Why over client-side (oidc-client-ts in browser)**:
- Session cookies are HttpOnly — JS never touches tokens
- No OIDC library needed on frontend — simpler, smaller bundle
- Token refresh is invisible (session renewal on backend)
- PDF download via direct URL works automatically (browser sends cookie)

**Alternative considered**: Client-side PKCE flow with `oidc-client-ts`. Rejected because it requires storing tokens in browser, adds frontend complexity, and makes direct-URL resources (PDF) harder to auth.

### 2. Email as user identifier (not OIDC `sub`)

**Choice**: Match and deduplicate users by `email` claim. Store `oidc_sub` for reference only.

**Why**: Email is human-readable, stable across IdP re-configurations, and the natural identifier for this app's use case. The `sub` claim is opaque and IdP-specific.

**Risk**: If a user changes their email in the IdP, they'll appear as a new user. Acceptable for this app's scale.

### 3. `openid-client` library

**Choice**: Use the `openid-client` npm package for OIDC discovery, auth URL generation, code exchange, and token validation.

**Why over manual HTTP**: Handles all the OIDC edge cases (nonce validation, clock skew, JWKS rotation, discovery caching). Battle-tested, maintained, and the de facto Node.js OIDC library.

### 4. Remove CORS entirely

**Choice**: Remove the `cors` npm package and middleware. No CORS headers served.

**Why**: In every deployment (nginx reverse proxy, Vite dev proxy, docker-compose dev), the browser talks to a single origin. The backend port is never exposed directly to browsers. `SameSite: Lax` on the session cookie prevents CSRF for state-changing requests.

**Alternative considered**: Restrict CORS to `APP_URL` origin. Rejected because it adds an env var, creates deployment friction (app won't start if misconfigured), and provides no security benefit when the proxy already ensures same-origin.

### 5. Session renewal: lazy (< 50% remaining)

**Choice**: Only extend session expiry when less than 50% of `SESSION_MAX_AGE` remains.

**Why over renew-every-request**: Reduces DB writes from every API call to roughly once per 15 minutes (at default 30min expiry). At this app's scale either approach works, but lazy renewal is free and avoids unnecessary writes.

### 6. OIDC discovery: dual-mode (`OIDC_DISCOVERY_URL` or `OIDC_ISSUER_URL`)

**Choice**: Accept either the full `.well-known/openid-configuration` URL or the issuer base URL.

**Why**: Authentik's discovery URL format (`/application/o/<slug>/.well-known/openid-configuration`) doesn't follow the standard convention of just appending to the issuer URL. Supporting the explicit discovery URL avoids confusion. If only issuer URL is given, the library appends the standard path.

### 7. Migration: assign existing data to `__admin__` user

**Choice**: The migration creates an `__admin__` user and assigns all existing invoices/templates to it. The `__admin__` user is also the BYPASS_LOGIN identity.

**Why over nullable user_id**: NOT NULL on `user_id` keeps queries simple — no need to handle null cases. The `__admin__` user is a real row, so all FK constraints hold.

### 8. Auth middleware placement

**Choice**: Auth middleware applied at the `/api` router level, with explicit exclusions for `/api/auth/*` and `/api/health`.

**Why over per-route**: Secure by default. New routes are automatically protected. Only auth endpoints and health check are exempt.

### 9. Frontend auth: redirect-based (not SPA route)

**Choice**: When `/api/auth/me` returns 401, the frontend does `window.location.href = '/api/auth/login'` (full page navigation), not a React Router redirect to a `/login` page.

**Why**: There is no login page to render — the backend redirects to the IdP. A full page navigation is the simplest approach and avoids needing a login route component.

## Risks / Trade-offs

**[OIDC provider downtime]** → If the IdP is unreachable, no one can log in. Existing sessions continue to work until they expire. Mitigation: session expiry is configurable; in emergencies, set `BYPASS_LOGIN=true`.

**[Email change in IdP]** → User appears as new user, loses access to old invoices. Mitigation: `oidc_sub` is stored for manual reconciliation if needed. Acceptable at current scale.

**[Session table growth]** → Expired sessions accumulate. Mitigation: cleanup expired sessions periodically (e.g., on each login, delete sessions where `expires_at < now()`). No separate cron needed.

**[No CORS = no direct API access]** → External tools can't call the API from a different origin. Mitigation: this is a single-user/small-team tool, not a platform with API consumers. If needed later, add CORS back with explicit origin.

**[BYPASS_LOGIN security]** → If accidentally enabled in production, anyone has full access. Mitigation: log a prominent warning on startup when BYPASS_LOGIN is true. Docker-compose production template does not include it.

## Migration Plan

1. Run schema migration (auto-runs via `docker-entrypoint.sh` on deploy)
2. Migration creates `__admin__` user, adds columns with defaults, applies NOT NULL
3. All existing data is accessible under `__admin__` identity
4. Configure OIDC env vars in production docker-compose
5. Deploy — new users auto-created on first login, get empty invoice/template lists
6. **Rollback**: Revert to previous Docker image. Data columns added by migration are backward-compatible (old code ignores `user_id`). No destructive changes.

## Open Questions

None — all decisions resolved during exploration phase.
