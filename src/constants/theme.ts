export interface ColorPreset {
  name: string;
  value: string;
}

/** Brand presets offered on the Settings page. `value` becomes `--primary`. */
export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Party Blue', value: '#2563eb' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Slate', value: '#334155' },
];

export const DEFAULT_PRIMARY_COLOR = COLOR_PRESETS[0]!.value;

/** Categorical series palette for charts — readable on both themes. */
export const CHART_SERIES = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
} as const;

/** Gradient accents used by catalogue placeholder tiles. */
export const CATALOGUE_ACCENTS = [
  'from-blue-500/90 to-indigo-500/90',
  'from-teal-500/90 to-emerald-500/90',
  'from-fuchsia-500/90 to-purple-500/90',
  'from-amber-500/90 to-orange-500/90',
  'from-rose-500/90 to-pink-500/90',
  'from-cyan-500/90 to-sky-500/90',
  'from-lime-500/90 to-green-500/90',
  'from-slate-500/90 to-slate-700/90',
] as const;
