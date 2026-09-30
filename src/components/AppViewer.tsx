import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  X,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { DashboardApp } from '../types';
import { AppIcon } from './AppIcon';

interface AppViewerProps {
  app: DashboardApp;
  allApps: DashboardApp[];
  onSelectApp: (app: DashboardApp) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const AppViewer: React.FC<AppViewerProps> = ({
  app,
  allApps,
  onSelectApp,
  onClose,
  isDark = false,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setIframeKey((prev) => prev + 1);
    setHasLoaded(false);
  }, [app.id, app.url]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    setHasLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const openInNewTab = () => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden transition-all duration-200 border ${
        isDark
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200 shadow-md'
      } ${
        isFullscreen
          ? 'fixed inset-3 z-50 shadow-2xl'
          : 'w-full h-[calc(100vh-140px)] min-h-[500px]'
      }`}
    >
      {/* Top Controller Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b gap-3 ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
      }`}>
        {/* Left: Back + App Name + Category */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              isDark
                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
                : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs'
            }`}
            title="Return to Dashboard list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Apps</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: app.color ? `${app.color}20` : '#6366f120',
                color: app.color || '#6366f1',
              }}
            >
              <AppIcon name={app.icon} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-semibold truncate leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {app.name}
              </h2>
              <div className={`flex items-center gap-2 text-[11px] mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span>{app.category}</span>
                <span aria-hidden="true">·</span>
                <span className={`truncate max-w-[200px] font-mono text-[10px] ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {app.url}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Quick Switcher */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-md py-0.5">
          {allApps.map((otherApp) => {
            const isActive = otherApp.id === app.id;
            return (
              <button
                key={otherApp.id}
                onClick={() => onSelectApp(otherApp)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-medium'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <AppIcon name={otherApp.icon} className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{otherApp.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy URL */}
          <button
            onClick={handleCopyUrl}
            title="Copy URL"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Reload Frame */}
          <button
            onClick={handleReload}
            title="Reload frame"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Open in New Window */}
          <button
            onClick={openInNewTab}
            title="Open in new window"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>

          {/* Close Viewer */}
          <button
            onClick={onClose}
            title="Close view"
            className={`p-1.5 rounded-lg transition-colors ml-1 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative flex-1 bg-slate-100 flex flex-col items-center justify-center">
        {!hasLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-2xs z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-slate-600">Loading {app.name}...</span>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={app.url}
          title={app.name}
          onLoad={() => setHasLoaded(true)}
          className="w-full h-full border-none bg-white"
          allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; geolocation; gyroscope; microphone; midi"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
        />

        {/* Security & CSP Helpful Hint at bottom */}
        <div className={`w-full px-4 py-1.5 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              If this external dashboard blocks embedded frames (CSP / X-Frame-Options), click:
            </span>
            <button
              onClick={openInNewTab}
              className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-0.5 ml-1"
            >
              Open in New Window <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <span className="hidden md:inline text-slate-400 font-mono text-[10px]">
            {app.url}
          </span>
        </div>
      </div>
    </div>
  );
};
