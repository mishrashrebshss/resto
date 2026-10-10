import React from 'react';
import { Check, Coffee, Moon, Sun } from 'lucide-react';
import type { MenuTheme } from '../types';

interface ThemeSelectorProps {
  value: MenuTheme;
  onChange: (theme: MenuTheme) => void;
}

const THEME_OPTIONS: {
  id: MenuTheme;
  label: string;
  description: string;
  icon: React.ReactNode;
  swatches: { bg: string; card: string; accent: string };
}[] = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Default neutral menu look',
    icon: <Moon className="w-4 h-4" />,
    swatches: { bg: '#f8f9fa', card: '#ffffff', accent: '#f97316' }
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean airy blue-tinted menu',
    icon: <Sun className="w-4 h-4" />,
    swatches: { bg: '#eef2f7', card: '#ffffff', accent: '#0284c7' }
  },
  {
    id: 'cafe',
    label: 'Café',
    description: 'Warm cozy cream & roasted brown',
    icon: <Coffee className="w-4 h-4" />,
    swatches: { bg: '#f6ecdc', card: '#fffaf0', accent: '#b45309' }
  }
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {THEME_OPTIONS.map(option => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isSelected}
            className={`relative rounded-2xl border-2 p-3 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-orange-500 ring-2 ring-orange-500/25'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            {/* Mini live menu preview */}
            <div
              className="rounded-xl overflow-hidden mb-2.5 border border-slate-700/60"
              style={{ backgroundColor: option.swatches.bg }}
            >
              <div className="h-9 w-full" style={{ background: 'linear-gradient(135deg, #1e293b, #475569)' }} />
              <div className="p-2 space-y-1.5">
                <div
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: option.swatches.card, border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="h-1.5 w-2/3 rounded" style={{ backgroundColor: option.swatches.accent }} />
                  <div className="h-1.5 w-1/3 rounded bg-slate-300 mt-1" />
                </div>
                <div
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: option.swatches.card, border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: option.swatches.accent }} />
                  <div className="h-1.5 w-2/5 rounded bg-slate-300 mt-1" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                {option.icon}
                <span>{option.label}</span>
              </div>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                  isSelected ? 'bg-orange-500' : 'bg-slate-700'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
};
