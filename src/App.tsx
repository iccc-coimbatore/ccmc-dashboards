import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Star,
  X,
  Sun,
  Moon,
  LayoutGrid
} from 'lucide-react';
import { DashboardApp } from './types';
import { INITIAL_APPS } from './data/defaultApps';
import { AppCard } from './components/AppCard';
import { AddAppModal } from './components/AddAppModal';
import { deleteApp, createApp, updateApp } from './lib/appsApi';

const LOCAL_STORAGE_KEY = 'iccc_dashboard_apps_v2';
const LEGACY_STORAGE_KEY = 'workspace_dashboard_apps_v1';
const THEME_STORAGE_KEY = 'iccc_theme_pref';

const ICCC_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/d/df/K1Af86T5-1.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original';

export default function App() {
  // Preserve existing user-entered data safely without resetting
  const [apps, setApps] = useState<DashboardApp[]>(() => {
    try {
      const savedV2 = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      // If v2 is not found yet, check previous v1 key so no user data is lost
      const savedV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (Array.isArray(parsedV1)) {
          return parsedV1;
        }
      }
    } catch (err) {
      console.error('Failed to load apps from storage', err);
    }
    return INITIAL_APPS;
  });

  // Default to white theme (light mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DashboardApp | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  };

  // Safely persist apps in localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [apps]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  // Filtered apps by search & favorites
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFavorite = !filterFavorites || app.isFavorite;

      return matchesSearch && matchesFavorite;
    });
  }, [apps, searchQuery, filterFavorites]);

  // Add or update an app
  const handleSaveApp = (
    appData: Omit<DashboardApp, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setApps((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...appData } : item
        )
      );
      updateApp(editingId, appData).catch(() => {});
    } else {
      const newApp: DashboardApp = {
        ...appData,
        id: `app-${Date.now()}`,
        createdAt: Date.now(),
        isFavorite: false,
      };
      setApps((prev) => [newApp, ...prev]);
      createApp(newApp).catch(() => {});
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, isFavorite: !app.isFavorite } : app
      )
    );
  };

  // Delete an app
  const handleDeleteApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApps((prev) => prev.filter((app) => app.id !== id));
    // Best-effort sync to server (app still removed locally if API is down)
    deleteApp(id).catch(() => {});
  };

  // Edit app handler
  const handleEditApp = (app: DashboardApp, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setIsAddModalOpen(true);
  };

  // Direct redirection to the external dashboard website in a new tab/window
  const handleOpenApp = (app: DashboardApp) => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      {/* Full-Width Top Bar (No side gaps) */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-3.5 backdrop-blur-md transition-colors w-full ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white/95 border-slate-200/90 shadow-2xs'
      }`}>
        <div className="w-full flex items-center justify-between gap-4">
          {/* Brand with Custom Image Logo & CCMC Dashboards by ICCC */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center p-0.5">
              <img
                src={ICCC_LOGO_URL}
                alt="ICCC Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className={`text-lg font-bold tracking-tight block leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                CCMC Dashboards
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                by ICCC
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-2">
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dashboards by name or URL... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-colors border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-100/70 hover:bg-slate-100 focus:bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute inset-y-0 right-0 pr-2.5 flex items-center ${
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to White Theme' : 'Switch to Dark Theme'}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Add App Button */}
            <button
              onClick={() => {
                setEditingApp(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Area (Edge-to-edge with balanced padding) */}
      <main className="flex-1 w-full px-4 sm:px-6 py-5 flex flex-col space-y-4">
        {/* Subheader: Count & Favorites filter */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              My Dashboards ({filteredApps.length})
            </span>
            {searchQuery && (
              <span className="text-xs text-slate-400">
                matching "{searchQuery}"
              </span>
            )}
          </div>

          {/* Favorites Only toggle */}
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filterFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                : isDark
                ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-current text-amber-500' : ''}`} />
            <span>Favorites Only</span>
          </button>
        </div>

        {/* Full Screen Responsive Grid (Takes entire screen resolution) */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 w-full">
            {filteredApps.map((app, idx) => (
              <AppCard
                key={app.id}
                app={app}
                index={idx}
                onOpenApp={handleOpenApp}
                onToggleFavorite={handleToggleFavorite}
                onEditApp={handleEditApp}
                onDeleteApp={handleDeleteApp}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className={`text-center py-24 px-4 border border-dashed rounded-3xl max-w-lg mx-auto my-12 ${
            isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {searchQuery ? 'No dashboards found' : 'No dashboards added yet'}
            </h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {searchQuery
                ? `No dashboards matching "${searchQuery}". Try a different keyword.`
                : 'Your dashboard list is empty. Click below to add your first app or dashboard.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-colors ${
                    isDark ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => {
                  setEditingApp(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dashboard App</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Full-Width Footer */}
      <footer className={`border-t px-4 sm:px-6 py-4 text-xs transition-colors w-full ${
        isDark ? 'border-slate-800/80 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CCMC Dashboards by ICCC · Full resolution grid view</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Press <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>/</kbd> to search</span>
          </div>
        </div>
      </footer>

      {/* Add / Edit App Modal */}
      <AddAppModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApp}
        editingApp={editingApp}
        isDark={isDark}
      />
    </div>
  );
}
