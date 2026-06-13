# TypewriterText Decision

> **Status**: Phase 4 / Step 4
> **Branch**: `feat/ui-ux-upgrade`
> **Date**: 2026-06-13

## Decision

**Option A: Implement actual character-by-character reveal.**

The `TypewriterText` component now performs a true typewriter animation
via `requestAnimationFrame` with a configurable rate (default 3 chars/frame,
32ms minimum frame interval).

## Rationale

Per the Phase 0 audit, `TypewriterText.tsx` was a stub:
- Rendered the full text immediately
- Showed a blinking caret (via `animate-pulse`) only when `isActive` was true
- Did NOT animate character-by-character

Two options were considered:

| Option | Pros | Cons |
|---|---|---|
| **A. Implement rAF-based reveal** | Smooth, immersive reader experience; works with or without streaming; honors a11y | More code (~80 LOC); more test surface; small perf cost during animation |
| **B. Delete the component** | Less code; simpler | Loses a nice reader UX detail; spec already declared it as part of the reader surface |

Option A wins because:
1. The reader is the core product surface — even small UX polish matters
2. The component is already mocked in StoryReaderPage tests, suggesting intent to use
3. Implementation is small and well-isolated (pure rAF + state)
4. Respects `prefers-reduced-motion` (jumps to final text)
5. Works whether text arrives via SSE streaming or as a complete chunk

## Implementation Details

```tsx
function TypewriterText({ text, isActive, charsPerFrame, minFrameMs }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed(''); // Reset on text change
    if (prefersReducedMotion() || !isActive) {
      setDisplayed(text); // Skip animation
      return;
    }
    // rAF loop with min-frame throttling
    function tick() {
      setDisplayed(current => Math.min(current.length + charsPerFrame, text.length));
      if (displayed.length < text.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [text, isActive, charsPerFrame, minFrameMs]);

  return <span>{displayed}{caret}</span>;
}
```

## Future Use

The component is NOT yet wired into StoryReaderPage (which renders
`streamingText` directly via `StoryContent`). To enable per-character
animation when SSE chunks arrive:

1. In `StoryReaderPage`, change:
   ```diff
   - {isStreaming && streamingText ? (
   -   <StoryContent text={streamingText} onEntityClick={onEntityClick} />
   - ) : (
   -   <StoryContent text={displayedChapter.content} onEntityClick={onEntityClick} />
   - )}
   + <TypewriterText text={streamingText || displayedChapter.content} isActive={isStreaming} />
   + <StoryContent text={displayedChapter.content} onEntityClick={onEntityClick} />
   ```
2. Or wrap `StoryContent` with `<TypewriterText>` for streaming only:
   ```tsx
   {isStreaming && streamingText ? (
     <TypewriterText text={streamingText} isActive>
       <StoryContent text={streamingText} />
     </TypewriterText>
   ) : (
     <StoryContent text={displayedChapter.content} />
   )}
   ```

This wiring is deferred to a future phase — current priority is the
visual polish (Typography + Choice cards) which have higher reader impact.

## Tests (8)

- Renders empty initially (effect runs synchronously after first paint)
- Respects `prefersReducedMotion` (jumps to full text)
- Displays full text after enough animation frames
- Shows blinking caret while animation is in progress
- Hides caret when animation completes
- Restarts animation when text changes
- Does not animate when `isActive` is false
- Accepts custom `className` prop

## Out of Scope (Deferred)

- Wiring TypewriterText into StoryReaderPage (Phase 7+ visual review)
- Variable speed based on text length (currently fixed charsPerFrame)
- Audio cue per character (Phase 7+ if voice narration lands)
