import { DashboardApp } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export type AppsSnapshot = {
  apps: DashboardApp[];
  seeded: boolean;
};

export const fetchApps = async (): Promise<AppsSnapshot> => {
  const data = await request<AppsSnapshot>('/api/apps');
  return {
    apps: Array.isArray(data.apps) ? data.apps : [],
    seeded: Boolean(data.seeded),
  };
};

export const createApp = async (app: DashboardApp): Promise<DashboardApp[]> => {
  const data = await request<{ apps: DashboardApp[] }>('/api/apps', {
    method: 'POST',
    body: JSON.stringify(app),
  });
  return data.apps;
};

export const updateApp = async (
  id: string,
  patch: Partial<DashboardApp>
): Promise<DashboardApp[]> => {
  const data = await request<{ apps: DashboardApp[] }>(`/api/apps/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return data.apps;
};

export const deleteApp = async (id: string): Promise<DashboardApp[]> => {
  const data = await request<{ apps: DashboardApp[] }>(`/api/apps/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return data.apps;
};
