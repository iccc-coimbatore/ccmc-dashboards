import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { store, storeKind, storeLocation, closeStore } from './appsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, 'dist');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ARGS = process.argv.slice(2);
const IS_PROD = ARGS.includes('--dev')
  ? false
  : ARGS.includes('--prod') || process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, store: storeKind, location: storeLocation });
});

const fail = (res, err) => {
  if (err?.name === 'InvalidPayloadError') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('[server] Store operation failed', err);
  res.status(503).json({ error: `The dashboard database is unavailable: ${err.message}` });
};

app.get('/api/apps', async (_req, res) => {
  try {
    res.json(await store.info());
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/apps', async (req, res) => {
  try {
    const apps = await store.add(req.body);
    res.status(201).json({ apps });
  } catch (err) {
    fail(res, err);
  }
});

app.put('/api/apps', async (req, res) => {
  try {
    const apps = await store.replaceAll(req.body?.apps);
    res.json({ apps });
  } catch (err) {
    fail(res, err);
  }
});

app.put('/api/apps/:id', async (req, res) => {
  try {
    const apps = await store.update(req.params.id, req.body ?? {});
    res.json({ apps });
  } catch (err) {
    fail(res, err);
  }
});

app.delete('/api/apps/:id', async (req, res) => {
  try {
    const apps = await store.remove(req.params.id);
    res.json({ apps });
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/apps/clear', async (_req, res) => {
  try {
    const apps = await store.clear();
    res.json({ apps });
  } catch (err) {
    fail(res, err);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));

if (IS_PROD) {
  app.use(express.static(DIST_DIR, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.use((err, _req, res, _next) => {
  console.error('[server]', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (!IS_PROD && !fs.existsSync(path.join(ROOT, 'src', 'main.tsx'))) {
  console.warn('[server] src/main.tsx not found - the dev UI may not load.');
}

const server = app.listen(PORT, HOST, () => {
  console.log(`[server] CCMC Dashboards running on http://${HOST}:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  console.log(`[server] Store: ${storeKind} -> ${storeLocation}`);
  if (storeKind === 'file') {
    const warning =
      IS_PROD
        ? 'DATABASE_URL is not set, so data is written to a local file. Serverless platforms wipe this disk on every deploy - set DATABASE_URL.'
        : 'DATABASE_URL is not set, falling back to the local JSON file. Set DATABASE_URL to use PostgreSQL.';
    console.warn(`[server] ${warning}`);
  }
});

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, closing...`);
  server.close();
  try {
    await closeStore();
  } catch (err) {
    console.error('[server] Error closing store', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
