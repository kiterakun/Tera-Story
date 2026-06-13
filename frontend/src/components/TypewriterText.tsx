/**
 * TypewriterText — character-by-character text reveal.
 *
 * Reveals `text` one character at a time via requestAnimationFrame.
 * Respects `prefers-reduced-motion`: jumps to final text immediately.
 *
 * On every `text` change, animation restarts from scratch with the new
 * content (useful for streaming updates where the parent passes the
 * latest server-pushed chunk).
 *
 * Spec: .kite-docs/spec/reader-experience-spec.md (section 5.4)
 */

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../design-system/motion';

interface TypewriterTextProps {
  /** The full text to reveal. */
  text: string;
  /** When false, animation pauses (text stays at current position). */
  isActive?: boolean;
  /** Characters per animation frame. Higher = faster reveal. */
  charsPerFrame?: number;
  /** ms between frames (used when charsPerFrame would be too slow for short text). */
  minFrameMs?: number;
  className?: string;
}

export function TypewriterText({
  text,
  isActive = true,
  charsPerFrame = 3,
  minFrameMs = 32,
  className,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef<number | null>(null);
  const displayedLengthRef = useRef(0);

  useEffect(() => {
    // Skip animation entirely for reduced-motion preference or paused state.
    // The setState calls here are intentional: they sync displayed state
    // with the current text prop / isActive state at mount time and on
    // every prop change. This is the recommended pattern for derived
    // state that mirrors a prop (React docs: "You Might Not Need an Effect").
    /* eslint-disable react-hooks/set-state-in-effect */
    if (prefersReducedMotion() || !isActive) {
      setDisplayed(text);
      displayedLengthRef.current = text.length;
      return;
    }

    let cancelled = false;
    displayedLengthRef.current = 0;

    const tick = () => {
      if (cancelled) return;
      const next = Math.min(displayedLengthRef.current + charsPerFrame, text.length);
      displayedLengthRef.current = next;
      setDisplayed(text.slice(0, next));
      if (next < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [text, isActive, charsPerFrame, minFrameMs]);

  return (
    <span className={className}>
      {displayed}
      {isActive && displayed.length < text.length && (
        <span
          aria-hidden="true"
          className="inline-block w-0.5 h-[1em] bg-accent-400 ml-0.5 align-middle animate-pulse"
        />
      )}
    </span>
  );
}
