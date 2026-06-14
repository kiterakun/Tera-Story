# Public Share Page Media Spec

Drop these optional assets in `frontend/public/share/` to upgrade the public `/share/:token` page beyond the gradient-based layout.

## Required slot — none
The page renders entirely with CSS gradients, Tailwind tokens, and the existing design system. All visual elements are decorative and ship without media. The list below is only relevant if you want to add real art.

## Optional cover image
- `frontend/public/share/cover-default.webp`
- Format: WebP, 1600 × 1000 (16:10), under 600 kB
- Visual: a moody "Tera-Story · Shared chapter" hero card matching the LandingPage hero. Dark navy + gold + soft glow. No readable fake text.

## Optional per-arc chapter art
- `frontend/public/share/chapter-1.webp`, `chapter-2.webp`, …
- Format: WebP, 1200 × 800, under 400 kB each
- Visual: cinematic wide scene that matches the world/arc mood. No readable text, no real logos.

## Optional QR code
- The page is fully responsive; users can copy the URL. A QR code is not currently rendered. If you want one, generate it server-side at share time and inject the SVG into the page.

## AI prompt for cover image

```
Premium dark cinematic card titled "Tera-Story · Shared chapter" in elegant gold serif over a deep navy background. Soft radial gold glow behind the text, faint world-map silhouettes, no readable fake UI text, subtle film grain, 16:10, 1600x1000.
```

## AI prompt for chapter art

```
Cinematic dark fantasy sci-fi scene, deep navy and gold palette, soft volumetric light, wide 3:2 framing, an implied story moment without text, no readable UI, no real logos, moody atmosphere, 1200x800.
```

## Integration

When assets exist, mount them in `SharePage.tsx` between the heading and TOC. A `useState<boolean>(false)` can drive a lazy `<img>` tag, and a `picture` element with `<source media="(min-width: 768px)" srcSet="/share/cover-default.webp">` lets larger screens get the full hero while mobile keeps the gradient.
