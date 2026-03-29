import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index.js';
import authRouter from './routes/auth.js';
import { createSessionMiddleware, createBypassMiddleware } from './middleware/auth.js';
import { initOidc, ensureAdminUser } from './services/authService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;
const isBypass = process.env.BYPASS_LOGIN === 'true';

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/fonts', express.static(path.join(__dirname, '../fonts')));

// Auth routes (unprotected)
app.use('/api/auth', authRouter);

// Auth middleware for all other /api routes
const authMiddleware = isBypass ? createBypassMiddleware() : createSessionMiddleware();
app.use('/api', (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') return next();
  authMiddleware(req, res, next);
});

// API routes
app.use('/api', router);

async function start() {
  if (isBypass) {
    console.warn('⚠️  BYPASS_LOGIN is enabled — all requests authenticated as __admin__. Do not use in production!');
    await ensureAdminUser();
  } else {
    // Validate required OIDC env vars
    const required = ['OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET'];
    const missing = required.filter(k => !process.env[k]);
    if (!process.env.OIDC_DISCOVERY_URL && !process.env.OIDC_ISSUER_URL) {
      missing.push('OIDC_DISCOVERY_URL or OIDC_ISSUER_URL');
    }
    if (missing.length) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    await initOidc();
    console.log('OIDC client initialized');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
