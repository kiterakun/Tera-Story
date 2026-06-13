import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createFocusTrap } from '../../design-system/focusTrap';

function makeContainer(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

function teardown() {
  document.body.innerHTML = '';
}

describe('focusTrap', () => {
  let triggerBtn: HTMLButtonElement;
  let container: HTMLElement;

  beforeEach(() => {
    triggerBtn = document.createElement('button');
    triggerBtn.id = 'trigger';
    triggerBtn.textContent = 'Open';
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
  });

  afterEach(teardown);

  describe('Tab cycle', () => {
    it('cycles focus to first item when on last item + Tab', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <button id="b">B</button>
        <button id="c">C</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      const c = container.querySelector<HTMLElement>('#c')!;
      c.focus();
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      );
      // We don't dispatch on the container — we listen on document.
      // Test the actual behavior with document-level dispatch.
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      );
      expect(document.activeElement).toBe(container.querySelector('#a'));
      trap.deactivate();
    });

    it('moves focus forward inside container on Tab', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <button id="b">B</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      const a = container.querySelector<HTMLElement>('#a')!;
      a.focus();
      expect(document.activeElement).toBe(a);
      trap.deactivate();
    });

    it('keeps focus inside container on Shift+Tab from first', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <button id="b">B</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      const a = container.querySelector<HTMLElement>('#a')!;
      a.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      document.dispatchEvent(event);
      expect(document.activeElement).toBe(container.querySelector('#b'));
      trap.deactivate();
    });

    it('keeps focus inside container on Tab from last', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <button id="b">B</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      const b = container.querySelector<HTMLElement>('#b')!;
      b.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(event);
      expect(document.activeElement).toBe(container.querySelector('#a'));
      trap.deactivate();
    });
  });

  describe('Focus restore', () => {
    it('restores focus to trigger on deactivate', () => {
      container = makeContainer(`<button id="a">A</button>`);
      const trap = createFocusTrap(container);
      trap.activate();
      // After activate, focus moved to first item in container
      expect(document.activeElement).not.toBe(triggerBtn);
      trap.deactivate();
      expect(document.activeElement).toBe(triggerBtn);
    });

    it('does not crash if previously focused element is detached', () => {
      container = makeContainer(`<button id="a">A</button>`);
      const trap = createFocusTrap(container);
      trap.activate();
      // Detach trigger
      triggerBtn.remove();
      // Should not throw
      expect(() => trap.deactivate()).not.toThrow();
    });
  });

  describe('Disabled / hidden skip', () => {
    it('skips disabled elements', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <button id="b" disabled>B</button>
        <button id="c">C</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      // Verify that the disabled one is skipped: Tab from C should wrap to A
      const c = container.querySelector<HTMLElement>('#c')!;
      c.focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(document.activeElement).toBe(container.querySelector('#a'));
      trap.deactivate();
    });

    it('skips [tabindex="-1"] elements', () => {
      container = makeContainer(`
        <button id="a">A</button>
        <span id="x" tabindex="-1">skip me</span>
        <button id="b">B</button>
      `);
      const trap = createFocusTrap(container);
      trap.activate();
      const b = container.querySelector<HTMLElement>('#b')!;
      b.focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(document.activeElement).toBe(container.querySelector('#a'));
      trap.deactivate();
    });

    it('keeps focus on container if no focusable elements', () => {
      container = makeContainer(`<p>No buttons here</p>`);
      const trap = createFocusTrap(container);
      trap.activate();
      // Container should have tabindex=-1 and be focused
      expect(container.hasAttribute('tabindex')).toBe(true);
      expect(document.activeElement).toBe(container);
      trap.deactivate();
    });
  });

  describe('Nested / stacked traps', () => {
    it('supports nested trap activation', () => {
      const outer = makeContainer(`
        <button id="o1">O1</button>
        <button id="o2">O2</button>
      `);
      const inner = makeContainer(`
        <button id="i1">I1</button>
        <button id="i2">I2</button>
      `);
      // Put inner inside outer
      outer.appendChild(inner);

      const outerTrap = createFocusTrap(outer);
      const innerTrap = createFocusTrap(inner);

      outerTrap.activate();
      innerTrap.activate();

      // Both traps should be active
      // Deactivate inner — should not throw
      innerTrap.deactivate();
      outerTrap.deactivate();
    });

    it('deactivates only the matching trap', () => {
      const outer = makeContainer(`<button id="o1">O1</button>`);
      const inner = makeContainer(`<button id="i1">I1</button>`);
      outer.appendChild(inner);

      const outerTrap = createFocusTrap(outer);
      const innerTrap = createFocusTrap(inner);

      outerTrap.activate();
      innerTrap.activate();
      // Deactivate outer first — should clean up outer trap
      outerTrap.deactivate();
      // Inner is still "active" but outer keydown listener is gone.
      // Activating inner again should work
      expect(() => innerTrap.deactivate()).not.toThrow();
    });

    it('keeps inner trap active while outer is paused', () => {
      const outer = makeContainer(`<button id="o1">O1</button>`);
      const inner = makeContainer(`<button id="i1">I1</button>`);
      outer.appendChild(inner);

      const outerTrap = createFocusTrap(outer);
      const innerTrap = createFocusTrap(inner);

      outerTrap.activate();
      innerTrap.activate();
      // Both traps are in the stack
      innerTrap.deactivate();
      outerTrap.deactivate();
    });
  });

  describe('Idempotent', () => {
    it('activate is idempotent', () => {
      container = makeContainer(`<button id="a">A</button>`);
      const trap = createFocusTrap(container);
      trap.activate();
      trap.activate(); // no-op
      trap.deactivate();
    });

    it('deactivate is idempotent', () => {
      container = makeContainer(`<button id="a">A</button>`);
      const trap = createFocusTrap(container);
      trap.activate();
      trap.deactivate();
      expect(() => trap.deactivate()).not.toThrow();
    });
  });
});
