## ADDED Requirements

### Requirement: OIDC discovery and client initialization
The backend SHALL support two modes of OIDC discovery configuration:
1. `OIDC_DISCOVERY_URL` — fetch the full OpenID Configuration endpoint directly
2. `OIDC_ISSUER_URL` — append `/.well-known/openid-configuration` to discover

If both are provided, `OIDC_DISCOVERY_URL` takes precedence. At least one MUST be provided unless `BYPASS_LOGIN=true`. The discovered configuration SHALL be used to obtain `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `end_session_endpoint`, and `jwks_uri`.

#### Scenario: Discovery via explicit configuration URL
- **WHEN** `OIDC_DISCOVERY_URL` is set to a valid OpenID Configuration endpoint
- **THEN** the backend SHALL fetch that URL and initialize the OIDC client with the discovered endpoints

#### Scenario: Discovery via issuer URL
- **WHEN** `OIDC_ISSUER_URL` is set and `OIDC_DISCOVERY_URL` is not set
- **THEN** the backend SHALL append `/.well-known/openid-configuration` to the issuer URL and discover endpoints

#### Scenario: Missing OIDC configuration without bypass
- **WHEN** neither `OIDC_DISCOVERY_URL` nor `OIDC_ISSUER_URL` is set and `BYPASS_LOGIN` is not `true`
- **THEN** the backend SHALL fail to start with a clear error message indicating OIDC configuration is required

### Requirement: OIDC environment variables
The backend SHALL accept the following environment variables for OIDC configuration:
- `OIDC_CLIENT_ID` (required unless BYPASS_LOGIN)
- `OIDC_CLIENT_SECRET` (required unless BYPASS_LOGIN)
- `OIDC_REDIRECT_URI` (required unless BYPASS_LOGIN)
- `OIDC_POST_LOGOUT_REDIRECT_URI` (optional, defaults to origin derived from `OIDC_REDIRECT_URI`)
- `OIDC_SCOPES` (optional, defaults to `openid email profile`)
- `OIDC_NAME` (optional, defaults to `SSO`)
- `OIDC_AUTO_CREATE_USER` (optional, defaults to `true`)
- `SESSION_MAX_AGE` (optional, defaults to `1800` seconds)

#### Scenario: All required vars present
- **WHEN** `OIDC_DISCOVERY_URL` (or `OIDC_ISSUER_URL`), `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_REDIRECT_URI` are set
- **THEN** the backend SHALL start successfully and serve OIDC auth routes

#### Scenario: Missing required var
- **WHEN** any required OIDC variable is missing and `BYPASS_LOGIN` is not `true`
- **THEN** the backend SHALL fail to start with an error naming the missing variable

### Requirement: Login redirect
The `GET /api/auth/login` route SHALL build an OIDC authorization URL using the discovered `authorization_endpoint`, configured `OIDC_CLIENT_ID`, `OIDC_REDIRECT_URI`, and `OIDC_SCOPES`, then redirect the browser (HTTP 302) to the IdP.

#### Scenario: Unauthenticated user visits app
- **WHEN** a user navigates to the app and has no valid session
- **THEN** the frontend SHALL redirect to `/api/auth/login`, which returns HTTP 302 to the IdP authorization endpoint

### Requirement: OIDC callback and user upsert
The `GET /api/auth/callback` route SHALL exchange the authorization code for tokens, extract `email`, `name`, and `sub` claims, and upsert the user in the database.

#### Scenario: First-time login with auto-create enabled
- **WHEN** the IdP redirects to `/api/auth/callback` with a valid code, the email does not exist in the `users` table, and `OIDC_AUTO_CREATE_USER=true`
- **THEN** the backend SHALL create a new user with the email, name, and oidc_sub from the token claims, create a session, set the `session_id` cookie, and redirect (HTTP 302) to `/`

#### Scenario: First-time login with auto-create disabled
- **WHEN** the IdP redirects to `/api/auth/callback` with a valid code, the email does not exist in the `users` table, and `OIDC_AUTO_CREATE_USER=false`
- **THEN** the backend SHALL respond with HTTP 403 and a message "Account not found. Contact your administrator." without creating a session

#### Scenario: Returning user login
- **WHEN** the IdP redirects to `/api/auth/callback` with a valid code and the email already exists in the `users` table
- **THEN** the backend SHALL update the user's name and oidc_sub if changed, create a session, set the `session_id` cookie, and redirect to `/`

#### Scenario: Invalid or expired callback code
- **WHEN** the IdP redirects to `/api/auth/callback` with an invalid or expired code
- **THEN** the backend SHALL redirect to `/api/auth/login` to restart the flow

### Requirement: Session cookie specification
The session cookie SHALL be configured as follows:
- Name: `session_id`
- Value: 64-character hex string from `crypto.randomBytes(32)`
- `HttpOnly: true`
- `Secure: true` when `OIDC_REDIRECT_URI` starts with `https`; `false` when `BYPASS_LOGIN=true` (no `OIDC_REDIRECT_URI` available)
- `SameSite: Lax`
- `Path: /`
- `MaxAge: SESSION_MAX_AGE`

#### Scenario: Cookie set on login
- **WHEN** a session is created after successful OIDC callback
- **THEN** the response SHALL include a `Set-Cookie` header with the specified attributes

#### Scenario: Cookie Secure flag in bypass mode
- **WHEN** `BYPASS_LOGIN=true` and no `OIDC_REDIRECT_URI` is configured
- **THEN** the `Secure` flag SHALL be `false`

### Requirement: Session middleware
The session middleware SHALL be applied to all `/api/*` routes except `/api/auth/*` and `/api/health`. It SHALL read the `session_id` cookie, look up the session in the database (joining with users), validate expiry, and attach `req.user = { id, email, name }`.

#### Scenario: Valid session
- **WHEN** a request includes a `session_id` cookie with a valid, non-expired session
- **THEN** the middleware SHALL set `req.user` and pass to the next handler

#### Scenario: Session renewal
- **WHEN** a valid session has less than 50% of `SESSION_MAX_AGE` remaining
- **THEN** the middleware SHALL extend `expires_at` by `SESSION_MAX_AGE` and update the cookie

#### Scenario: No session renewal when not needed
- **WHEN** a valid session has 50% or more of `SESSION_MAX_AGE` remaining
- **THEN** the middleware SHALL NOT update the session expiry

#### Scenario: Expired session
- **WHEN** a request includes a `session_id` cookie with an expired session
- **THEN** the middleware SHALL delete the session row, clear the cookie, and return HTTP 401

#### Scenario: Missing or invalid cookie
- **WHEN** a request to a protected route has no `session_id` cookie or the session ID is not found
- **THEN** the middleware SHALL return HTTP 401

### Requirement: Auth me endpoint
The `GET /api/auth/me` route SHALL return the current user's `{ id, email, name }` if a valid session exists, or HTTP 401 otherwise.

#### Scenario: Authenticated user
- **WHEN** a request to `/api/auth/me` has a valid session
- **THEN** the response SHALL be HTTP 200 with JSON `{ id, email, name }`

#### Scenario: Unauthenticated user
- **WHEN** a request to `/api/auth/me` has no valid session
- **THEN** the response SHALL be HTTP 401

### Requirement: Logout
The `POST /api/auth/logout` route SHALL delete the session from the database, clear the `session_id` cookie, and redirect to the IdP's `end_session_endpoint` (if available) or `/`.

#### Scenario: Successful logout
- **WHEN** an authenticated user sends `POST /api/auth/logout`
- **THEN** the backend SHALL delete the session, clear the cookie, and redirect (HTTP 302) to the IdP logout endpoint with `post_logout_redirect_uri` set to `OIDC_POST_LOGOUT_REDIRECT_URI`

#### Scenario: Logout without IdP end_session_endpoint
- **WHEN** the discovered OIDC config does not include `end_session_endpoint`
- **THEN** the backend SHALL delete the session, clear the cookie, and redirect to `/`

### Requirement: Expired session cleanup
The backend SHALL delete expired sessions from the database during login operations to prevent unbounded table growth.

#### Scenario: Cleanup on login
- **WHEN** a new session is created during OIDC callback
- **THEN** the backend SHALL delete all sessions where `expires_at < now()`

### Requirement: BYPASS_LOGIN mode
When `BYPASS_LOGIN=true`, the backend SHALL skip all OIDC operations and authenticate every request as the `__admin__` user (email: `admin@localhost`, name: `Admin`).

#### Scenario: Bypass startup
- **WHEN** the backend starts with `BYPASS_LOGIN=true`
- **THEN** the backend SHALL ensure the `__admin__` user exists (create if not) and log a warning that authentication is bypassed

#### Scenario: Bypass middleware
- **WHEN** `BYPASS_LOGIN=true` and any API request arrives
- **THEN** the middleware SHALL set `req.user` to the `__admin__` user without checking cookies or sessions

#### Scenario: Bypass auth routes
- **WHEN** `BYPASS_LOGIN=true` and `/api/auth/me` is called
- **THEN** the response SHALL return the `__admin__` user

#### Scenario: Bypass login/logout routes
- **WHEN** `BYPASS_LOGIN=true` and `/api/auth/login` or `/api/auth/logout` is called
- **THEN** the response SHALL redirect to `/`

### Requirement: Users database table
The backend SHALL maintain a `users` table with columns: `id` (serial PK), `email` (varchar 255, unique, not null), `name` (varchar 255), `oidc_sub` (varchar 255), `created_at` (timestamp, default now).

#### Scenario: User created on first login
- **WHEN** a new user authenticates via OIDC with `OIDC_AUTO_CREATE_USER=true`
- **THEN** a row SHALL be inserted with email, name, and oidc_sub from token claims

#### Scenario: Unique email constraint
- **WHEN** an OIDC callback attempts to create a user with an email that already exists
- **THEN** the existing user SHALL be returned (upsert behavior)

### Requirement: Sessions database table
The backend SHALL maintain a `sessions` table with columns: `id` (varchar 64, PK), `user_id` (integer FK to users, not null), `expires_at` (timestamp, not null), `created_at` (timestamp, default now). An index SHALL exist on `expires_at`.

#### Scenario: Session created on login
- **WHEN** a user completes OIDC authentication
- **THEN** a session row SHALL be inserted with a cryptographically random 64-char hex ID and `expires_at` set to `now() + SESSION_MAX_AGE`

### Requirement: CORS removal
The backend SHALL NOT use CORS middleware. The `cors` npm package SHALL be removed.

#### Scenario: No CORS headers
- **WHEN** any API request is made
- **THEN** the response SHALL NOT include `Access-Control-Allow-Origin` or other CORS headers
