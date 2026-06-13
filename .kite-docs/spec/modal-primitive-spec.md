# Tera-Story Modal Primitive Spec

> **Status**: Phase 3 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

Define the contract for a single, accessible Modal primitive that all
13 existing modal/drawer/overlay components will migrate to. Closes
the Phase 0 audit gaps:
- 0 modals had `role="dialog"`
- 0 modals had focus trap
- 0 modals had ESC handler (except MobileMenu — inline)
- 0 modals restored focus to the trigger on close
- 0 modals locked body scroll while open

Spec also defines the Drawer variant (slide-in panel).

## 2. Audit — Current State (Before Phase 3)

From the initial audit (`.kite-docs/spec/orphan-widgets-audit.md` is
about different orphans; this audit covers modal-like surfaces):

| Component | role="dialog" | aria-modal | Focus trap | ESC | Focus restore | Scroll lock |
|---|---|---|---|---|---|---|
| `EntityDetailModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `RelationshipWebModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `WhispersModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `PeekModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ChapterDetailPanel` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DailyCheckInModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `LevelUpModal` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ChapterStatusOverlay` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `CreationOverlay` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `MobileDrawer` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ReaderMobileNav` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `RPGPanel` (slide-in) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `RetryImageButton` (popover) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `Layout/MobileMenu` (drawer) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ (inline) |

→ 0/13 production modals meet the full accessibility contract.

## 3. Target Contract

### 3.1 `Modal` API

```ts
interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close (ESC, scrim click, close button) */
  onClose: () => void;
  /** Accessible label for the dialog (aria-labelledby references this id) */
  title: string;
  /** Optional longer description (aria-describedby references this id) */
  description?: string;
  /** Modal size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking the scrim closes the modal (default: true) */
  closeOnScrimClick?: boolean;
  /** Whether pressing ESC closes the modal (default: true) */
  closeOnEsc?: boolean;
  /** Initial focus target (defaults to first focusable in modal) */
  initialFocus?: 'first' | 'container' | string /* element id */;
  /** Whether to render in a portal (default: true — uses document.body) */
  portal?: boolean;
  /** Render children inside the modal panel */
  children: ReactNode;
  /** Optional className for the modal panel */
  className?: string;
}
```

### 3.2 Accessibility Contract

| Concern | Requirement |
|---|---|
| `role` | `dialog` |
| `aria-modal` | `true` |
| `aria-labelledby` | References title element id |
| `aria-describedby` | References description element id (if provided) |
| Focus trap | Tab cycles within modal; Shift+Tab reverses; cycle wraps |
| Initial focus | First focusable element inside modal (or specified target) |
| Focus restore | On close, focus returns to the trigger element |
| ESC dismiss | Default true; `closeOnEsc={false}` opt-out |
| Scrim click | Default true; `closeOnScrimClick={false}` opt-out |
| Body scroll | Locked when modal is open; restored on close |
| Stack-aware | Nested modals each have their own trap; top modal traps, lower still receives restore-on-its-close |
| Reduced motion | `prefers-reduced-motion` removes entry/exit animation; modal still functions |
| Focusable skip | Skip `[disabled]`, `[tabindex="-1"]`, `inert`, or `display:none` elements |
| iFrame support | (Phase 7+) — Phase 3: skip iframes inside modal |

### 3.3 Slot Sub-components

```tsx
<Modal title="Edit profile">
  <ModalHeader>
    <h2 id="modal-title">Edit profile</h2>
  </ModalHeader>
  <ModalBody>
    {/* main content */}
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onSave}>Save</Button>
  </ModalFooter>
</Modal>
```

- `ModalHeader`: sticky top, contains title + optional close button
- `ModalBody`: scrollable content (overflow-y-auto)
- `ModalFooter`: sticky bottom, contains actions
- `ModalTitle`: renders `<h2>` with id for aria-labelledby

### 3.4 Drawer variant

```ts
interface DrawerProps extends Omit<ModalProps, 'size'> {
  /** Which edge to slide from */
  side?: 'right' | 'left' | 'top' | 'bottom';
  /** Drawer width */
  width?: 'sm' | 'md' | 'lg' | string; // can be a Tailwind class
}
```

- Renders a panel that slides in from the chosen edge
- Uses Modal primitive for focus trap, ESC, etc.
- Backdrop is full-screen scrim with click-to-close
- Slide animation respects `prefers-reduced-motion`

## 4. Implementation Plan

### 4.1 `design-system/focusTrap.ts` (Step 2 — ~50 LOC)

```ts
/**
 * Returns an object with `activate(container)` and `deactivate()`.
 * `activate` wires a keydown listener that cycles Tab/Shift+Tab within
 * the container. `deactivate` removes the listener and returns the
 * element that had focus before activation (for restoration).
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
};
```

Edge cases to handle:
- Container has 0 focusable elements → focus container itself, set tabIndex={-1}
- Container has 1 focusable element → no cycling needed
- Container has hidden focusables (display:none) → skip them
- Nested trap: inner trap pushes outer onto a stack; when inner deactivates, outer resumes

### 4.2 `design-system/Modal.tsx` (Step 3)

```tsx
export function Modal({ open, onClose, title, children, ... }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const trapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  // Capture trigger element on open
  useEffect(() => {
    if (open && !triggerRef.current) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Activate trap when modal opens
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const trap = createFocusTrap(modalRef.current);
    trapRef.current = trap;
    trap.activate();
    return () => {
      trap.deactivate();
      // Restore focus to trigger
      triggerRef.current?.focus();
    };
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC handler
  useEffect(() => {
    if (!open || props.closeOnEsc === false) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <>
      <div className="bg-scrim animate-fade-in" onClick={onClose} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="..."
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
```

### 4.3 `design-system/Drawer.tsx` (Step 4)

Wrapper around Modal that:
- Renders content at chosen edge
- Uses `animate-slide-in-right/left/top/bottom`
- Sets panel `position: fixed` at chosen edge
- Reduces z-index for sub-modals in same stack

### 4.4 Migration order (Steps 5-6)

Priority for migration (least complex first):
1. `EntityDetailModal` — simple modal, no animation
2. `LevelUpModal` — modal, has animation
3. `DailyCheckInModal` — modal
4. `PeekModal` — modal
5. `WhispersModal` — modal
6. `ChapterStatusOverlay` — overlay (no close button)
7. `RelationshipWebModal` — modal (large)
8. `CreationOverlay` — overlay (no close)
9. `ChapterDetailPanel` → Drawer (slide from right)
10. `MobileDrawer` → Drawer
11. `ReaderMobileNav` → Drawer
12. `RPGPanel` → Drawer
13. `RetryImageButton` → popover (Modal size sm)

### 4.5 Reduced motion (Step 7)

Already implemented in Phase 1 (`index.css` global override). Step 7
verifies with a media-query test that:
- `prefers-reduced-motion: reduce` → all `animation` + `transition` classes become effectively 0ms duration
- Modal still functions (just no slide animation)
- Drawer appears without animation

### 4.6 Axe-core integration (Step 8)

Install `vitest-axe` (after user pre-authorizes). Create smoke test
that audits all 15 routes for axe violations.

## 5. Stacking & Nesting

When a modal opens from inside another modal:
- Both traps are active (innermost traps; outermost "remembers" focus)
- Outer modal's trap is paused (its activate() doesn't run while inner is active)
- When inner closes, outer resumes; outer still traps to itself
- Z-index: base 1000, increment by 100 per nested level

## 6. Animation Contract

| Animation | Duration | Easing | Honors reduced-motion |
|---|---|---|---|
| Open (fade-in backdrop + scale-in modal) | 200ms / 320ms | decelerate / spring | ✓ (becomes 0ms) |
| Close (fade-out) | 200ms | accelerate | ✓ |
| Drawer slide | 320ms | standard | ✓ |

All animations use the motion tokens from Phase 1 (`--duration-*`, `--ease-*`).

## 7. Testing Contract

| Test type | Coverage |
|---|---|
| Unit (focus trap) | Tab cycle, Shift-Tab cycle, focus restore, disabled skip, hidden skip, nested stack |
| Component (Modal) | role, aria-modal, aria-labelledby, open/close, ESC, scrim click, scroll lock, focus trap, focus restore |
| Component (Drawer) | slide animation, side prop, modal compliance |
| Integration | Each migrated modal renders correctly, traps focus, restores on close |
| A11y (axe-core) | 0 violations across all migrated modals |
| Manual | Keyboard walkthrough of every modal at 320/768/1280px |

## 8. Out of Scope (Deferred)

- iFrame focus support (Phase 7+)
- Non-modal popovers/tooltips (separate spec)
- Async-confirmation dialogs with loading state (Phase 5+)
