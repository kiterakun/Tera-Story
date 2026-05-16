import { useSettingsStore } from '../stores/settingsStore';
import en from './en';
import vi from './vi';
import type { Translations } from './en';

const locales: Record<string, Translations> = { en, vi };

/**
 * Returns the full translation object for the current language.
 * Falls back: settingsStore.language → localStorage → 'en'
 *
 * Usage:
 *   const t = useTranslation();
 *   <h1>{t.login.title}</h1>
 */
export function useTranslation(): Translations {
  const language = useLanguage();
  return (locales[language] as Translations) || locales.en;
}

/**
 * Returns the current language code (e.g., 'en', 'vi').
 */
export function useLanguage(): string {
  return useSettingsStore(s => s.settings?.language) || getStoredLanguage();
}

/** Get the current language code outside of a React component. */
export function getLanguage(): string {
  return getStoredLanguage();
}

/** Read language preference from localStorage (for unauthenticated pages). */
function getStoredLanguage(): string {
  try {
    return localStorage.getItem('tera-lang') || 'en';
  } catch {
    return 'en';
  }
}

/** Persist language to localStorage so unauthenticated pages keep the preference. */
export function persistLanguage(lang: string): void {
  try {
    localStorage.setItem('tera-lang', lang);
  } catch {
    // localStorage unavailable
  }
}

export type { Translations };
