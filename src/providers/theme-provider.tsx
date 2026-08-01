import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_PRIMARY_COLOR } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/app';
import { isValidHex, readableForeground, shade, withAlpha } from '@/utils/color';
import type { ResolvedTheme, ThemeMode } from '@/types';

interface ThemeContextValue {
  /** What the user picked — may be `system`. */
  theme: ThemeMode;
  /** What is actually rendered right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return (window.localStorage.getItem(key) as T | null) ?? fallback;
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Writes the derived brand tokens so every `--primary*` consumer updates at once. */
function applyPrimaryColor(hex: string): void {
  const root = document.documentElement;
  root.style.setProperty('--primary', hex);
  root.style.setProperty('--primary-foreground', readableForeground(hex));
  root.style.setProperty(
    '--primary-soft',
    root.classList.contains('dark') ? withAlpha(hex, 0.18) : shade(hex, 0.92),
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    readStored<ThemeMode>(STORAGE_KEYS.theme, 'system'),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined'
      ? 'light'
      : theme === 'system'
        ? systemTheme()
        : (theme as ResolvedTheme),
  );
  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    const stored = readStored(STORAGE_KEYS.primaryColor, DEFAULT_PRIMARY_COLOR);
    return isValidHex(stored) ? stored : DEFAULT_PRIMARY_COLOR;
  });

  // Resolve `system` and keep following the OS while it stays selected.
  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme);
      return;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setResolvedTheme(mql.matches ? 'dark' : 'light');
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [theme]);

  // Reflect the resolved theme on <html> and re-derive the brand tint.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
    applyPrimaryColor(primaryColor);
  }, [resolvedTheme, primaryColor]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEYS.theme, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode =
        current === 'dark' ? 'light' : current === 'light' ? 'dark' : systemTheme() === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  const setPrimaryColor = useCallback((hex: string) => {
    if (!isValidHex(hex)) return;
    setPrimaryColorState(hex);
    window.localStorage.setItem(STORAGE_KEYS.primaryColor, hex);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme, primaryColor, setPrimaryColor }),
    [theme, resolvedTheme, setTheme, toggleTheme, primaryColor, setPrimaryColor],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a <ThemeProvider>');
  return context;
}
