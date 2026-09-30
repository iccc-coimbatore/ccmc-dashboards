export interface DashboardApp {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
  color?: string;
  icon?: string;
  isFavorite?: boolean;
  createdAt: number;
  lastOpenedAt?: number;
}

export type ViewMode = 'grid' | 'split' | 'fullscreen';
