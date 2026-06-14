/**
 * ThemeToggle — cycle button through 5 themes.
 *
 * Cycles light → dark → cyberpunk → sepia → abyssal → light.
 * Icon-only button with proper aria-label (announces current +
 * next theme for screen readers).
 */

import { Sun, Moon, Palette } from 'lucide-react';
import { useUIStore, type AppTheme } from '../../stores/uiStore';
import { useTranslation } from '../../i18n';

const NEXT_THEME: Record<AppTheme, AppTheme> = {
  light: 'dark',
  dark: 'cyberpunk',
  cyberpunk: 'sepia',
  sepia: 'abyssal',
  abyssal: 'light',
};

const THEME_ICON: Record<AppTheme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  cyberpunk: Palette,
  sepia: Palette,
  abyssal: Palette,
};

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);;
  const t = useTranslation();
  const next = NEXT_THEME[theme];
  const Icon = THEME_ICON[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t.layout?.switchTheme ?? `Switch theme (current: ${theme}, next: ${next})`}
      className={
        'min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 ' +
        'hover:text-ink-100 hover:bg-ink-800 ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ' +
        'transition-colors duration-base ease-standard ' +
        'inline-flex items-center justify-center ' +
        (className ?? '')
      }
    >
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}
