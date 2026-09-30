import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardApp } from '../types';
import { INITIAL_APPS } from '../data/defaultApps';
import { createApp, deleteApp, fetchApps, updateApp } from '../lib/appsApi';

const CACHE_KEY = 'iccc_dashboard_apps_v2';
const LEGACY_CACHE_KEY = 'workspace_dashboard_apps_v1';
const POLL_INTERVAL_MS = 5000;

export type SyncStatus = 'connecting' | 'synced' | 'offline';

type PendingOp =
  | { kind: 'add'; app: DashboardApp }
  | { kind: 'update'; id: string; patch: Partial<DashboardApp> }
  | { kind: 'remove'; id: string };

function readCache(): DashboardApp[] {
  try {
    for (const key of [CACHE_KEY, LEGACY_CACHE_KEY]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as DashboardApp[];
    }
  } catch (err) {
    console.error('Failed to read cached apps', err);
  }
  return INITIAL_APPS;
}

function writeCache(apps: DashboardApp[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('Failed to cache apps locally', err);
  }
}

export function useSharedApps() {
  const [apps, setApps] = useState<DashboardApp[]>(readCache);
  const [status, setStatus] = useState<SyncStatus>('connecting');

  const appsRef = useRef(apps);
  const pendingRef = useRef<PendingOp[]>([]);
  const syncingRef = useRef(false);
  const bootstrappedRef = useRef(false);

  appsRef.current = apps;

  useEffect(() => {
    writeCache(apps);
  }, [apps]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (syncingRef.current) return true;
    if (pendingRef.current.length === 0) return true;

    syncingRef.current = true;
    try {
      let remote = (await fetchApps()).apps;
      for (const op of pendingRef.current) {
        if (op.kind === 'add') remote = await createApp(op.app);
        else if (op.kind === 'update') remote = await updateApp(op.id, op.patch);
        else remote = await deleteApp(op.id);
      }
      pendingRef.current = [];
      setApps(remote);
      setStatus('synced');
      return true;
    } catch (err) {
      console.warn('Sync failed, keeping changes queued', err);
      setStatus('offline');
      return false;
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const sync = useCallback(async () => {
    if (pendingRef.current.length > 0) {
      await flush();
      return;
    }
    if (syncingRef.current) return;

    syncingRef.current = true;
    try {
      const snapshot = await fetchApps();
      setApps(snapshot.apps);
      setStatus('synced');

      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        const cached = readCache();
        if (!snapshot.seeded && snapshot.apps.length === 0 && cached.length > 0) {
          pendingRef.current = cached.map((app) => ({ kind: 'add' as const, app }));
          syncingRef.current = false;
          await flush();
        }
      }
    } catch (err) {
      if (!bootstrappedRef.current) bootstrappedRef.current = true;
      setStatus('offline');
    } finally {
      syncingRef.current = false;
    }
  }, [flush]);

  useEffect(() => {
    void sync();
    const timer = window.setInterval(() => void sync(), POLL_INTERVAL_MS);
    const onWake = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onWake);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [sync]);

  const enqueue = useCallback(
    (op: PendingOp, optimistic: (prev: DashboardApp[]) => DashboardApp[]) => {
      setApps(optimistic);
      pendingRef.current = [...pendingRef.current, op];
      void flush();
    },
    [flush]
  );

  const saveApp = useCallback(
    (appData: Omit<DashboardApp, 'id' | 'createdAt'>, editingId?: string) => {
      if (editingId) {
        enqueue(
          { kind: 'update', id: editingId, patch: appData },
          (prev) => prev.map((item) => (item.id === editingId ? { ...item, ...appData } : item))
        );
        return;
      }

      const newApp: DashboardApp = {
        ...appData,
        id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        isFavorite: false,
      };
      enqueue({ kind: 'add', app: newApp }, (prev) => [newApp, ...prev]);
    },
    [enqueue]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const target = appsRef.current.find((item) => item.id === id);
      if (!target) return;
      const patch = { isFavorite: !target.isFavorite };
      enqueue({ kind: 'update', id, patch }, (prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    [enqueue]
  );

  const removeApp = useCallback(
    (id: string) => {
      enqueue({ kind: 'remove', id }, (prev) => prev.filter((item) => item.id !== id));
    },
    [enqueue]
  );

  return { apps, status, saveApp, toggleFavorite, removeApp, refresh: sync };
}
