import * as oidc from 'openid-client';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { users, sessions } from '../db/schema.js';
import { eq, lt } from 'drizzle-orm';

const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 1800;

// OIDC client configuration (initialized lazily)
let oidcConfig = null;

export async function initOidc() {
  const discoveryUrl = process.env.OIDC_DISCOVERY_URL;
  const issuerUrl = process.env.OIDC_ISSUER_URL;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;

  let serverUrl;
  if (discoveryUrl) {
    // Use explicit discovery URL — extract the base server URL
    // openid-client v6 discovery() takes the issuer URL and appends /.well-known/openid-configuration
    // For explicit discovery URLs, we need to use the URL as-is via allowInsecureRequests or custom fetch
    serverUrl = new URL(discoveryUrl);
    // Strip the well-known path to get the issuer base
    const wellKnownSuffix = '/.well-known/openid-configuration';
    if (serverUrl.pathname.endsWith(wellKnownSuffix)) {
      serverUrl = new URL(serverUrl.href.replace(wellKnownSuffix, ''));
    }
  } else if (issuerUrl) {
    serverUrl = new URL(issuerUrl);
  } else {
    throw new Error('OIDC configuration required: set OIDC_DISCOVERY_URL or OIDC_ISSUER_URL');
  }

  oidcConfig = await oidc.discovery(serverUrl, clientId, clientSecret);
  return oidcConfig;
}

export function getOidcConfig() {
  return oidcConfig;
}

export async function buildAuthorizationUrl(state, codeVerifier) {
  const config = getOidcConfig();
  const scopes = process.env.OIDC_SCOPES || 'openid email profile';

  const params = {
    redirect_uri: process.env.OIDC_REDIRECT_URI,
    scope: scopes,
    state,
  };

  if (codeVerifier) {
    params.code_challenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    params.code_challenge_method = 'S256';
  }

  return oidc.buildAuthorizationUrl(config, params);
}

export async function exchangeCode(callbackUrl, expectedState, codeVerifier) {
  const config = getOidcConfig();
  const checks = {
    expectedState,
  };
  if (codeVerifier) {
    checks.pkceCodeVerifier = codeVerifier;
  }

  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, checks);
  const claims = tokens.claims();

  return {
    email: claims?.email,
    name: claims?.name,
    sub: claims?.sub,
    idToken: tokens.id_token,
  };
}

export function buildLogoutUrl(idToken) {
  const config = getOidcConfig();
  const serverMetadata = config.serverMetadata();
  if (!serverMetadata.end_session_endpoint) {
    return null;
  }

  const postLogoutUri = process.env.OIDC_POST_LOGOUT_REDIRECT_URI ||
    new URL('/', process.env.OIDC_REDIRECT_URI).origin;

  return oidc.buildEndSessionUrl(config, {
    id_token_hint: idToken,
    post_logout_redirect_uri: postLogoutUri,
  });
}

// User operations

export async function upsertUser({ email, name, oidcSub }) {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    if (name !== existing.name || oidcSub !== existing.oidcSub) {
      const [updated] = await db.update(users)
        .set({ name, oidcSub })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db.insert(users).values({ email, name, oidcSub }).returning();
  return created;
}

export async function findUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function ensureAdminUser() {
  const [existing] = await db.select().from(users).where(eq(users.email, 'admin@localhost'));
  if (existing) return existing;
  const [admin] = await db.insert(users).values({ email: 'admin@localhost', name: 'Admin' }).returning();
  return admin;
}

// Session operations

export async function createSession(userId) {
  const id = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({ id, userId, expiresAt });

  // Cleanup expired sessions opportunistically
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  return { id, expiresAt };
}

export async function getSession(sessionId) {
  const result = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (!result.length) return null;
  return result[0];
}

export async function renewSession(sessionId) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, sessionId));
  return expiresAt;
}

export async function deleteSession(sessionId) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function getSessionMaxAge() {
  return SESSION_MAX_AGE;
}

export function isSecureCookie() {
  const redirectUri = process.env.OIDC_REDIRECT_URI;
  if (!redirectUri) return false;
  return redirectUri.startsWith('https');
}
