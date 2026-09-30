import React, { useState, useEffect } from 'react';
import { X, Globe, Plus } from 'lucide-react';
import { DashboardApp } from '../types';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Omit<DashboardApp, 'id' | 'createdAt'>, editingId?: string) => void;
  editingApp?: DashboardApp | null;
  isDark?: boolean;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApp,
  isDark = false,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingApp) {
      setName(editingApp.name);
      setUrl(editingApp.url);
    } else {
      setName('');
      setUrl('');
    }
    setError('');
  }, [editingApp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the dashboard or app name.');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      setError('Please enter the application URL.');
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError('Please enter a valid web address (e.g. https://my-dashboard.com).');
      return;
    }

    onSave(
      {
        name: name.trim(),
        url: formattedUrl,
        category: 'Custom',
        icon: 'LayoutDashboard',
        color: '#4f46e5',
      },
      editingApp ? editingApp.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingApp ? 'Edit Dashboard App' : 'Add Dashboard App'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter the name and URL to launch it in one click
            </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* App Name */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Dashboard / App Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Sales Metrics, Cloud Run Monitor, CRM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* App URL */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              App URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="https://your-dashboard-url.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                  isDark
                    ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingApp ? 'Save Changes' : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
