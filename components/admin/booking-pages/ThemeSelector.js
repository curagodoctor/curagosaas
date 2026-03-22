"use client";

import { PRESET_THEMES } from '@/lib/themes';

export default function ThemeSelector({ selectedTheme, onChange }) {
  const themes = Object.values(PRESET_THEMES);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Page Theme
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Choose a color scheme for your booking page
      </p>

      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedTheme === theme.id
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {/* Color swatches */}
            <div className="flex gap-1.5 mb-2">
              <div
                className="w-6 h-6 rounded-full shadow-sm border border-white/50"
                style={{ backgroundColor: theme.colors.primary[600] }}
                title="Primary"
              />
              <div
                className="w-6 h-6 rounded-full shadow-sm border border-white/50"
                style={{ backgroundColor: theme.colors.secondary[400] }}
                title="Secondary"
              />
              <div
                className="w-6 h-6 rounded-full shadow-sm border border-white/50"
                style={{ backgroundColor: theme.colors.accent[500] }}
                title="Accent"
              />
            </div>

            <div className="font-medium text-sm text-gray-900">
              {theme.name}
            </div>
            <div className="text-xs text-gray-500 line-clamp-1">
              {theme.description}
            </div>

            {/* Selected indicator */}
            {selectedTheme === theme.id && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
