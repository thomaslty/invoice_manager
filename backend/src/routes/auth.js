import { Router } from 'express';
import * as oidc from 'openid-client';
import * as authService from '../services/authService.js';

const router = Router();
const isBypass = process.env.BYPASS_LOGIN === 'true';

function getRedirectUri(req) {
  return process.env.OIDC_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/callback`;
}

// Public config endpoint (no auth required)
router.get('/config', (req, res) => {
  res.json({ oidcName: process.env.OIDC_NAME || 'SSO' });
});

if (isBypass) {
  router.get('/me', async (req, res) => {
    const admin = await authService.ensureAdminUser();
    res.json({ id: admin.id, email: admin.email, name: admin.name });
  });

  router.get('/login', (req, res) => res.redirect('/'));
  router.post('/logout', (req, res) => res.redirect('/'));
} else {
  // Store PKCE verifiers and state in memory (keyed by state)
  // In production this should use a proper store, but for this app's scale it's fine
  const pendingLogins = new Map();

  router.get('/login', async (req, res) => {
    try {
      const state = oidc.randomState();
      const codeVerifier = oidc.randomPKCECodeVerifier();

      pendingLogins.set(state, { codeVerifier, createdAt: Date.now() });

      // Cleanup old entries (>10 min)
      for (const [key, val] of pendingLogins) {
        if (Date.now() - val.createdAt > 600000) pendingLogins.delete(key);
      }

      const redirectUri = getRedirectUri(req);
      const authUrl = await authService.buildAuthorizationUrl(state, codeVerifier, redirectUri);
      res.redirect(authUrl.href);
    } catch (err) {
      console.error('OIDC login error:', err);
      res.status(500).json({ error: 'Authentication service unavailable' });
    }
  });

  router.get('/callback', async (req, res) => {
    try {
      const state = req.query.state;
      const pending = pendingLogins.get(state);
      if (!pending) {
        return res.redirect('/login');
      }
      pendingLogins.delete(state);

      const redirectUri = getRedirectUri(req);
      const callbackUrl = new URL(req.originalUrl, new URL(redirectUri).origin);
      const claims = await authService.exchangeCode(callbackUrl, state, pending.codeVerifier);

      if (!claims.email) {
        return res.status(400).send('Email claim missing from identity provider. Ensure "email" scope is requested.');
      }

      // Check auto-create setting
      const autoCreate = process.env.OIDC_AUTO_CREATE_USER !== 'false';
      const existingUser = await authService.findUserByEmail(claims.email);

      if (!existingUser && !autoCreate) {
        return res.status(403).send('Account not found. Contact your administrator.');
      }

      const user = await authService.upsertUser({
        email: claims.email,
        name: claims.name,
        oidcSub: claims.sub,
      });

      const session = await authService.createSession(user.id);

      res.cookie('session_id', session.id, {
        httpOnly: true,
        secure: authService.isSecureCookie(redirectUri),
        sameSite: 'lax',
        path: '/',
        maxAge: authService.getSessionMaxAge() * 1000,
      });

      res.redirect('/');
    } catch (err) {
      console.error('OIDC callback error:', err);
      res.redirect('/login');
    }
  });

  router.get('/me', (req, res) => {
    // This route is behind the auth middleware exclusion,
    // so we need to check the session manually
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    authService.getSession(sessionId).then(session => {
      if (!session || session.expiresAt < new Date()) {
        if (session) authService.deleteSession(session.sessionId);
        res.clearCookie('session_id', { path: '/' });
        return res.status(401).json({ error: 'Authentication required' });
      }
      res.json({ id: session.userId, email: session.email, name: session.name });
    }).catch(() => {
      res.status(401).json({ error: 'Authentication required' });
    });
  });

  router.post('/logout', async (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      await authService.deleteSession(sessionId);
    }
    res.clearCookie('session_id', { path: '/' });

    const redirectUri = getRedirectUri(req);
    const logoutUrl = authService.buildLogoutUrl(null, redirectUri);
    if (logoutUrl) {
      res.redirect(logoutUrl.href);
    } else {
      res.redirect('/login');
    }
  });
}

export default router;
