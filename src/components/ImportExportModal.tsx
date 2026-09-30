import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileJson } from 'lucide-react';
import { DashboardApp } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: DashboardApp[];
  onImport: (importedApps: DashboardApp[]) => void;
  isDark?: boolean;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  apps,
  onImport,
  isDark = false,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  if (!isOpen) return null;

  const exportString = JSON.stringify(apps, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-dashboards-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a JSON array of apps.');
      }
      // Basic sanity validation
      const validApps: DashboardApp[] = parsed.map((item, idx) => ({
        id: item.id || `imported-${Date.now()}-${idx}`,
        name: String(item.name || 'Untitled Dashboard'),
        url: String(item.url || 'https://google.com'),
        category: String(item.category || 'Custom'),
        description: item.description ? String(item.description) : undefined,
        color: item.color || '#6366f1',
        icon: item.icon || 'LayoutDashboard',
        isFavorite: Boolean(item.isFavorite),
        createdAt: item.createdAt || Date.now(),
      }));

      onImport(validApps);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid JSON format. Please check your data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-600" />
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Backup & Sync Dashboards
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex border-b px-6 pt-3 gap-4 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/40'
        }`}>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Export Backup ({apps.length} apps)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Import Dashboards
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Save your dashboard collection to restore anytime or share across devices.
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={exportString}
                  rows={8}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 ${
                    isDark
                      ? 'text-slate-200 bg-slate-800 hover:bg-slate-700'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Paste your dashboard JSON array below to append or replace your list.
              </p>
              {error && (
                <div className="p-2.5 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {error}
                </div>
              )}
              <textarea
                required
                placeholder="[ { &quot;name&quot;: &quot;My Dashboard&quot;, &quot;url&quot;: &quot;https://...&quot; } ]"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import Apps
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
