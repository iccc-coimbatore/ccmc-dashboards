import pg from 'pg';
import { InvalidPayloadError, sanitizeApp } from './fileAppsStore.js';

const { Pool } = pg;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS dashboard_apps (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    url            TEXT NOT NULL,
    category       TEXT NOT NULL DEFAULT 'Custom',
    description    TEXT,
    color          TEXT,
    icon           TEXT,
    is_favorite    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     BIGINT NOT NULL,
    last_opened_at BIGINT,
    position       BIGINT NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS dashboard_apps_position_idx ON dashboard_apps (position)',
  `CREATE TABLE IF NOT EXISTS dashboard_store_meta (
    id         INTEGER PRIMARY KEY,
    seeded     BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  'INSERT INTO dashboard_store_meta (id, seeded) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING',
];

const LIST_SQL = `
  SELECT id, name, url, category, description, color, icon, is_favorite, created_at, last_opened_at
  FROM dashboard_apps
  ORDER BY position ASC, created_at ASC
`;

const PATCH_COLUMNS = {
  name: 'name',
  url: 'url',
  category: 'category',
  description: 'description',
  color: 'color',
  icon: 'icon',
  isFavorite: 'is_favorite',
  lastOpenedAt: 'last_opened_at',
};

const toApp = (row) => {
  const app = {
    id: row.id,
    name: row.name,
    url: row.url,
    category: row.category || 'Custom',
    color: row.color || '#4f46e5',
    icon: row.icon || 'LayoutDashboard',
    isFavorite: Boolean(row.is_favorite),
    createdAt: Number(row.created_at),
  };
  if (row.description) app.description = row.description;
  if (row.last_opened_at !== null && row.last_opened_at !== undefined) {
    app.lastOpenedAt = Number(row.last_opened_at);
  }
  return app;
};

const toParams = (app) => [
  app.id,
  app.name,
  app.url,
  app.category,
  app.description ?? null,
  app.color,
  app.icon,
  app.isFavorite,
  app.createdAt,
  app.lastOpenedAt ?? null,
];

const toValues = (app, position) => [
  ...toParams(app),
  position,
];

function coercePatchValue(key, value) {
  if (value === undefined) return undefined;
  if (key === 'isFavorite') return Boolean(value);
  if (key === 'lastOpenedAt') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new InvalidPayloadError('Invalid lastOpenedAt');
    return parsed;
  }
  if (key === 'description' && value === null) return null;
  const text = typeof value === 'string' ? value.trim() : String(value);
  const limit = key === 'name' ? 120 : key === 'url' ? 2000 : key === 'description' ? 500 : 60;
  if (key === 'name' && !text) throw new InvalidPayloadError('App name cannot be empty');
  if (key === 'url' && !/^https?:\/\//i.test(text)) throw new InvalidPayloadError('App URL must start with http:// or https://');
  return text.slice(0, limit);
}

export function createPostgresStore(pool) {
  let schemaReady = null;

  async function ensureSchema() {
    if (!schemaReady) {
      schemaReady = (async () => {
        for (const statement of SCHEMA_STATEMENTS) {
          await pool.query(statement);
        }
      })().catch((err) => {
        schemaReady = null;
        throw err;
      });
    }
    return schemaReady;
  }

  const query = async (text, params) => {
    await ensureSchema();
    return pool.query(text, params);
  };

  const withClient = async (fn) => {
    await ensureSchema();
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  };

  const listApps = async (client) => {
    const runner = client ?? { query };
    const result = await runner.query(LIST_SQL);
    return result.rows.map(toApp);
  };

  const markSeeded = async (client) => {
    const runner = client ?? { query };
    await runner.query(
      'UPDATE dashboard_store_meta SET seeded = TRUE, updated_at = NOW() WHERE id = 1'
    );
  };

  return {
    kind: 'postgres',

    list: () => listApps(),

    info: async () => {
      const { rows } = await query('SELECT seeded FROM dashboard_store_meta WHERE id = 1');
      const apps = await listApps();
      return { apps, seeded: Boolean(rows[0]?.seeded) };
    },

    get: async (id) => {
      const { rows } = await query(
        `SELECT id, name, url, category, description, color, icon, is_favorite, created_at, last_opened_at
         FROM dashboard_apps WHERE id = $1`,
        [id]
      );
      return rows[0] ? toApp(rows[0]) : null;
    },

    add: async (input) => {
      const app = sanitizeApp(input);
      if (!app) throw new InvalidPayloadError('Invalid app payload');

      await query(
        `INSERT INTO dashboard_apps
           (id, name, url, category, description, color, icon, is_favorite, created_at, last_opened_at, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           COALESCE((SELECT MIN(position) FROM dashboard_apps), 0) - 1)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           url = EXCLUDED.url,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           color = EXCLUDED.color,
           icon = EXCLUDED.icon,
           is_favorite = EXCLUDED.is_favorite,
           last_opened_at = EXCLUDED.last_opened_at,
           updated_at = NOW()`,
        toParams(app)
      );
      await markSeeded();
      return listApps();
    },

    update: async (id, patch) => {
      if (!patch || typeof patch !== 'object') return listApps();

      const assignments = [];
      const params = [id];
      for (const [key, column] of Object.entries(PATCH_COLUMNS)) {
        if (!(key in patch)) continue;
        const value = coercePatchValue(key, patch[key]);
        if (value === undefined) continue;
        params.push(value);
        assignments.push(`${column} = $${params.length}`);
      }

      if (assignments.length === 0) return listApps();

      await query(
        `UPDATE dashboard_apps SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $1`,
        params
      );
      await markSeeded();
      return listApps();
    },

    remove: async (id) => {
      await query('DELETE FROM dashboard_apps WHERE id = $1', [id]);
      await markSeeded();
      return listApps();
    },

    replaceAll: async (list) => {
      if (!Array.isArray(list)) throw new InvalidPayloadError('Expected an array of apps');

      const seen = new Set();
      const apps = list
        .map(sanitizeApp)
        .filter((app) => {
          if (!app || seen.has(app.id)) return false;
          seen.add(app.id);
          return true;
        });

      await withClient(async (client) => {
        await client.query('BEGIN');
        try {
          await client.query('DELETE FROM dashboard_apps');
          if (apps.length > 0) {
            const params = [];
            const tuples = apps.map((app, index) => {
              const row = toValues(app, index);
              const offset = params.length;
              params.push(...row);
              return `(${row.map((_, column) => `$${offset + column + 1}`).join(', ')})`;
            });
            await client.query(
              `INSERT INTO dashboard_apps
                 (id, name, url, category, description, color, icon, is_favorite, created_at, last_opened_at, position)
               VALUES ${tuples.join(', ')}`,
              params
            );
          }
          await client.query(
            'UPDATE dashboard_store_meta SET seeded = TRUE, updated_at = NOW() WHERE id = 1'
          );
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK').catch(() => {});
          throw err;
        }
      });

      return listApps();
    },

    clear: async () => {
      await query('DELETE FROM dashboard_apps');
      await markSeeded();
      return [];
    },

    close: async () => {
      schemaReady = null;
      await pool.end();
    },
  };
}

export function createPoolFromEnv(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const sslSetting = (process.env.DATABASE_SSL || '').toLowerCase();
  const useSsl = sslSetting === 'disable' ? false : { rejectUnauthorized: sslSetting !== 'strict' };

  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX) || 2,
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS) || 10000,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS) || 10000,
    statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS) || 10000,
    ssl: useSsl,
    application_name: 'ccmc-dashboards',
  });
}
