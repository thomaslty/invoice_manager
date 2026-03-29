# Fix OIDC Production Redirect URI Mismatch

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix OIDC authentication failing on production domain (`https://invoice.workfor.live`) while working on localhost.

**Root Cause:** The inner nginx (`nginx.conf`) overwrites the `X-Forwarded-Proto` header with its own `$scheme` (always `http` since it listens on port 80). This causes a redirect_uri mismatch between the authorization request (`https://...`) and the token exchange (`http://...`). Authentik rejects the token exchange with `invalid_client`.

---

## Task 1: Fix nginx X-Forwarded-Proto forwarding

**File:** `nginx.conf`

Change line 10 from:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```
to:
```nginx
proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
```

`$http_x_forwarded_proto` preserves the value set by the external reverse proxy (e.g. Caddy/Traefik). On localhost (no external proxy), the header won't be set — this is fine because localhost uses `http` anyway and there's no https mismatch.

---

## Task 2: Harden callback URL construction

**File:** `backend/src/routes/auth.js`

The callback handler (line 60) constructs `callbackUrl` from `req.protocol` + `req.get('host')`, but the login handler uses `getRedirectUri(req)` which respects `OIDC_REDIRECT_URI`. If the env var is set but proto detection fails, these diverge.

Fix: construct the callback URL base from `getRedirectUri()` so both steps use the same origin:

```js
// Before (line 60):
const callbackUrl = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);

// After:
const redirectUri = getRedirectUri(req);
const callbackUrl = new URL(req.originalUrl, new URL(redirectUri).origin);
```

This ensures the redirect_uri sent during token exchange always matches what was sent during authorization, even if proxy headers are misconfigured.

---

## Verification

- Rebuild Docker image and deploy
- Confirm OIDC login works on `https://invoice.workfor.live`
- Confirm OIDC login still works on `http://localhost:3000`
