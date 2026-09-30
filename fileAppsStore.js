import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'apps.json');

let cache = null;
let seeded = null;
let queue = Promise.resolve();

export class InvalidPayloadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidPayloadError';
  }
}

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const toTimestamp = (value) => (Number.isFinite(value) ? value : undefined);

export function sanitizeApp(input) {
  if (!input || typeof input !== 'object') return null;

  const name = clean(input.name, 120);
  const url = clean(input.url, 2000);
  if (!name || !/^https?:\/\//i.test(url)) return null;

  const app = {
    id: clean(input.id, 64) || `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    url,
    category: clean(input.category, 60) || 'Custom',
    color: clean(input.color, 32) || '#4f46e5',
    icon: clean(input.icon, 60) || 'LayoutDashboard',
    isFavorite: Boolean(input.isFavorite),
    createdAt: toTimestamp(input.createdAt) ?? Date.now(),
  };

  const description = clean(input.description, 500);
  if (description) app.description = description;

  const lastOpenedAt = toTimestamp(input.lastOpenedAt);
  if (lastOpenedAt) app.lastOpenedAt = lastOpenedAt;

  return app;
}

async function readFromDisk() {
  try {
    const raw = await fsp.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.apps;
    if (!Array.isArray(list)) return { apps: [], seeded: false };
    const seen = new Set();
    const apps = list
      .map(sanitizeApp)
      .filter((app) => {
        if (!app || seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      });
    return { apps, seeded: true };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[appsStore] Failed to read apps file, starting empty:', err.message);
    }
    return { apps: [], seeded: false };
  }
}

async function writeToDisk(apps) {
  const payload = JSON.stringify({ updatedAt: Date.now(), seeded: true, apps }, null, 2);
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.writeFile(tmpFile, payload, 'utf8');
    await fsp.rename(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('[appsStore] Failed to persist apps:', err.message);
    await fsp.rm(tmpFile, { force: true }).catch(() => {});
    throw err;
  }
}

function run(task) {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function state() {
  if (!cache) {
    const loaded = await readFromDisk();
    cache = loaded.apps;
    seeded = loaded.seeded;
  }
  return cache;
}

async function commit(next) {
  cache = next;
  seeded = true;
  await writeToDisk(next);
  return next;
}

export function createFileStore() {
  return {
    kind: 'file',
    location: DATA_FILE,

    list: () => run(async () => [...(await state())]),

    info: () =>
      run(async () => {
        const apps = await state();
        return { apps: [...apps], seeded };
      }),

    get: (id) => run(async () => (await state()).find((app) => app.id === id) ?? null),

    add: (input) =>
      run(async () => {
        const app = sanitizeApp(input);
        if (!app) throw new InvalidPayloadError('Invalid app payload');
        const current = await state();
        if (current.some((item) => item.id === app.id)) {
          const merged = current.map((item) => (item.id === app.id ? { ...item, ...app } : item));
          return commit(merged);
        }
        return commit([app, ...current]);
      }),

    update: (id, patch) =>
      run(async () => {
        const current = await state();
        if (!current.some((item) => item.id === id)) return current;
        const updated = current.map((item) => {
          if (item.id !== id) return item;
          const merged = sanitizeApp({ ...item, ...patch, id: item.id, createdAt: item.createdAt });
          return merged ?? item;
        });
        return commit(updated);
      }),

    remove: (id) =>
      run(async () => {
        const current = await state();
        return commit(current.filter((app) => app.id !== id));
      }),

    replaceAll: (list) =>
      run(async () => {
        if (!Array.isArray(list)) throw new InvalidPayloadError('Expected an array of apps');
        const seen = new Set();
        const next = list
          .map(sanitizeApp)
          .filter((app) => {
            if (!app || seen.has(app.id)) return false;
            seen.add(app.id);
            return true;
          });
        return commit(next);
      }),

    clear: () => run(async () => commit([])),

    close: async () => {},
  };
}

export const dataFilePath = DATA_FILE;
