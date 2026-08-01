/**
 * `settings/app` — shared with the PWA, which reads the same document.
 * Only add fields here that the PWA tolerates; it ignores unknown keys.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface AppSettings {
  companyName: string;
  appSubtitle: string;
  /** Data-URL or remote URL. Empty renders the monogram fallback. */
  logoUri?: string;
  /** Station categories the team added on top of the built-ins. */
  customStationCategories?: string[];
  customPurchaseCategories?: string[];
  customSuppliers?: string[];
  /** The PWA's own colour theme id — surfaced read-only here. */
  themeId?: string;
}

export interface SettingsFormValues {
  companyName: string;
  appSubtitle: string;
  logoUri: string;
  customStationCategories: string[];
  customPurchaseCategories: string[];
  customSuppliers: string[];
}

/** Admin-console-only preferences. Persisted locally, never written to Firestore. */
export interface ConsolePreferences {
  theme: ThemeMode;
  primaryColor: string;
  compactTables: boolean;
}
