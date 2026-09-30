import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { DashboardApp } from '../types';
import { AppIcon } from './AppIcon';

// Full vibrant gradients and solid color themes for each card
const FULL_COLOR_PALETTES = [
  {
    bgClass: 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-700',
    shadowClass: 'shadow-indigo-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-indigo-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700',
    shadowClass: 'shadow-emerald-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-emerald-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700',
    shadowClass: 'shadow-orange-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-orange-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700',
    shadowClass: 'shadow-purple-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-purple-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700',
    shadowClass: 'shadow-rose-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-rose-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-700',
    shadowClass: 'shadow-sky-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-sky-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800',
    shadowClass: 'shadow-teal-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-teal-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-fuchsia-600 via-pink-600 to-purple-700',
    shadowClass: 'shadow-fuchsia-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-fuchsia-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700',
    shadowClass: 'shadow-cyan-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-cyan-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-red-600 via-orange-600 to-rose-700',
    shadowClass: 'shadow-red-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-red-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800',
    shadowClass: 'shadow-violet-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-violet-400/30',
  },
  {
    bgClass: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
    shadowClass: 'shadow-slate-500/25',
    accentBadge: 'bg-white/20 text-white',
    iconBg: 'bg-white/20 text-white',
    borderClass: 'border-slate-500/30',
  },
];

interface AppCardProps {
  app: DashboardApp;
  index: number;
  onOpenApp: (app: DashboardApp) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onEditApp: (app: DashboardApp, e: React.MouseEvent) => void;
  onDeleteApp: (id: string, e: React.MouseEvent) => void;
  isDark?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  index,
  onOpenApp,
  onToggleFavorite,
  onEditApp,
  onDeleteApp,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Each card receives a rich full color palette based on its index
  const palette = FULL_COLOR_PALETTES[index % FULL_COLOR_PALETTES.length];

  // Extract hostname for clean domain display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  return (
    <div
      onClick={() => onOpenApp(app)}
      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left text-white ${palette.bgClass} ${palette.borderClass} border shadow-md hover:shadow-xl ${palette.shadowClass} hover:-translate-y-0.5 overflow-hidden`}
    >
      {/* Subtle ambient light gradient highlight inside card */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          {/* App Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-inner ${palette.iconBg} backdrop-blur-md`}
            >
              <AppIcon name={app.icon || 'LayoutDashboard'} className="w-6 h-6 text-white" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:drop-shadow-xs transition-all">
                {app.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                <Globe className="w-3.5 h-3.5 text-white/70 shrink-0" />
                <span className="truncate max-w-[180px] font-mono text-[11px] text-white/85">
                  {getDomain(app.url)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Top Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Favorite toggle */}
            <button
              onClick={(e) => onToggleFavorite(app.id, e)}
              className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/20 transition-colors"
              title={app.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star
                className={`w-4 h-4 ${
                  app.isFavorite ? 'fill-amber-300 text-amber-300' : 'text-white/80'
                }`}
              />
            </button>

            {/* More options menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/20 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-38 rounded-xl shadow-2xl py-1.5 z-30 text-xs bg-white text-slate-800 border border-slate-200">
                    <button
                      onClick={(e) => {
                        setShowMenu(false);
                        onEditApp(app, e);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 font-medium text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      Edit Details
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 font-medium text-slate-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          Copy URL
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        setShowMenu(false);
                        onDeleteApp(app.id, e);
                      }}
                      className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      Delete App
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Full colored launch bar */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
        <span className="font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs animate-pulse" />
          Click to open website
        </span>
        <div className="p-1 rounded-md bg-white/15 group-hover:bg-white/25 transition-colors">
          <ExternalLink className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  );
};
