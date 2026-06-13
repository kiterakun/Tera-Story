/**
 * Focus trap — minimal implementation of WAI-ARIA dialog keyboard nav.
 *
 * - Tab / Shift+Tab cycle focus within the container
 * - Skip hidden, disabled, or [tabindex="-1"] elements
 * - On activate, capture the previously-focused element for restoration
 * - On deactivate, restore focus to the captured element
 * - Stack-aware: nested traps push onto a module-level stack
 *
 * Spec: .kite-docs/spec/modal-primitive-spec.md (section 4.1)
 */

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
  'select:not([disabled]),textarea:not([disabled]),' +
  '[tabindex]:not([tabindex="-1"]),audio[controls],video[controls]';

const trapStack: Array<{ container: HTMLElement; handler: (e: KeyboardEvent) => void }> = [];

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden')) return false;
  // Use getComputedStyle when available; jsdom doesn't compute layout,
  // so we can't rely on offsetParent alone.
  if (typeof window === 'undefined') return true;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return true;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && isVisible(el),
  );
}

function handleKey(e: KeyboardEvent, container: HTMLElement): void {
  if (e.key !== 'Tab') return;
  const items = getFocusable(container);
  if (items.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey) {
    if (active === first || !container.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last || !container.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }
}

export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
  let active = false;
  let previouslyFocused: HTMLElement | null = null;
  let handler: (e: KeyboardEvent) => void = () => {};

  return {
    activate() {
      if (active) return;
      active = true;
      previouslyFocused = (document.activeElement as HTMLElement) ?? null;
      handler = (e: KeyboardEvent) => handleKey(e, container);
      document.addEventListener('keydown', handler);
      trapStack.push({ container, handler });

      const items = getFocusable(container);
      const target = items[0] ?? (() => {
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        return container;
      })();
      target.focus();
    },
    deactivate() {
      if (!active) return;
      active = false;
      document.removeEventListener('keydown', handler);
      const idx = trapStack.findIndex((t) => t.container === container);
      if (idx >= 0) trapStack.splice(idx, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
      previouslyFocused = null;
    },
  };
}
