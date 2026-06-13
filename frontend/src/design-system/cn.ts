/**
 * `cn()` — class name composer.
 *
 * Joins truthy class strings and dedupes Tailwind conflicts via `clsx` +
 * `tailwind-merge`. The latter is optional — if not installed we fall
 * back to a simple join so the design-system primitives still work.
 *
 * Tailwind-merge gives us proper precedence: `cn('p-2', 'p-4')` returns
 * `'p-4'`, not `'p-2 p-4'`.
 */

// Try to import optional deps; fall back gracefully.
let clsxFn: (...inputs: unknown[]) => string;
let twMergeFn: (input: string) => string;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  clsxFn = require('clsx');
} catch {
  clsxFn = (...inputs: unknown[]) =>
    inputs
      .flat(Infinity)
      .filter(Boolean)
      .map(String)
      .join(' ')
      .trim();
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  twMergeFn = require('tailwind-merge').twMerge;
} catch {
  twMergeFn = (s: string) => s;
}

export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  return twMergeFn(clsxFn(inputs));
}
