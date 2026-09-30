import { createFileStore, dataFilePath } from './fileAppsStore.js';
import { createPoolFromEnv, createPostgresStore } from './postgresAppsStore.js';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

let store;
if (connectionString) {
  store = createPostgresStore(createPoolFromEnv(connectionString));
} else {
  store = createFileStore();
}

export { store };

export const storeKind = store.kind;

export const storeLocation =
  store.kind === 'postgres'
    ? connectionString.replace(/\/\/[^@]*@/, '//***@')
    : dataFilePath;

export const closeStore = () => store.close();
