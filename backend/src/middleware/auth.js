import * as authService from '../services/authService.js';

let cachedAdminUser = null;

export function createBypassMiddleware() {
  return async (req, res, next) => {
    if (!cachedAdminUser) {
      cachedAdminUser = await authService.ensureAdminUser();
    }
    req.user = { id: cachedAdminUser.id, email: cachedAdminUser.email, name: cachedAdminUser.name };
    next();
  };
}

export function createSessionMiddleware() {
  const maxAge = authService.getSessionMaxAge();
  const renewThreshold = maxAge * 0.5 * 1000; // 50% of max age in ms

  return async (req, res, next) => {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await authService.getSession(sessionId);
    if (!session) {
      res.clearCookie('session_id', { path: '/' });
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (session.expiresAt < new Date()) {
      await authService.deleteSession(session.sessionId);
      res.clearCookie('session_id', { path: '/' });
      return res.status(401).json({ error: 'Session expired' });
    }

    // Lazy renewal: only if <50% remaining
    const remaining = session.expiresAt.getTime() - Date.now();
    if (remaining < renewThreshold) {
      const newExpiry = await authService.renewSession(session.sessionId);
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: authService.isSecureCookie(),
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge * 1000,
      });
    }

    req.user = { id: session.userId, email: session.email, name: session.name };
    next();
  };
}
