# Animation System (Motion)

> Paste-ready section for the Website Stack Playbook / Prompt Library.

Every client site ships with the same lightweight animation system. It is part of
the template — **zero per-client animation work**. It wires itself up on every page.

## What's installed

- **Motion** (motion.dev — the vanilla JS build, NOT `motion/react`, no React anywhere),
  installed via `npm install motion` and self-hosted: the build copies
  `node_modules/motion/dist/motion.js` → `/assets/vendor/motion.js` (no CDN dependency).
- Loaded in `src/_includes/base.njk` as three deferred scripts, in this order:
  `vendor/motion.js` → `animations.js` → `site.js`.

## Where it lives

```
src/assets/animations.js   ← the five reusable utilities + auto-init (the whole system)
src/assets/styles.css      ← .nav--scrolled visuals + the reduced-motion kill-switch
eleventy.config.js         ← passthrough copy of the Motion vendor file
```

## The five utilities

All exposed on `window.RegularsMotion` for one-off use; `init()` at the bottom of
`animations.js` already applies them site-wide.

| Function | What it does | One-line call |
|---|---|---|
| `scrollFadeIn(sel)` | Fade + 12px rise + blur-to-sharp the first time an element scrolls into view | `RegularsMotion.scrollFadeIn('.my-section')` |
| `hoverLift(sel)` | 3px hover lift; scale-down press feedback on links/buttons | `RegularsMotion.hoverLift('.my-card')` |
| `heroLoadIn(sel)` | Staggered hero entrance on page load (logo → eyebrow → h1 → sub → CTAs, 90ms apart) | `RegularsMotion.heroLoadIn('.hero')` |
| `pageTransition()` | Cross-page fade via the View Transitions API; unsupported browsers just navigate instantly | `RegularsMotion.pageTransition()` |
| `stickyNavShrink(sel)` | Nav gains shadow + stronger blur + slightly smaller logo past 24px of scroll | `RegularsMotion.stickyNavShrink('.nav')` |

## The three guardrails (never break these)

1. **Transform / opacity / filter only.** Never animate width, height, top/left,
   margin, or padding — those reflow layout and wreck CLS/INP.
2. **`prefers-reduced-motion` is respected everywhere.** Every utility checks it and
   shows content instantly with no motion; `styles.css` also kills all CSS
   transitions under it. Elements are hidden *by JS, not CSS*, so no-JS visitors
   (and reduced-motion users) always see everything.
3. **Short durations.** 150–250ms for interactions, ≤550ms for entrances, springs
   with `bounce: 0`. Subtle production polish — if a client comments on an
   animation, it's too loud.

One extra rule the guardrails imply: **one owner per property.** If Motion animates
an element's transform, don't also give it CSS `:hover`/`:active` transforms
(inline styles win and the CSS state silently breaks).

## Checklist for a new client build

- [ ] Nothing to install or configure — the system rides along with the template.
- [ ] Hero: works automatically for all hero variants (`textforward`, `fullbleed`,
      `split`). A *new* hero variant only needs its pieces to use the standard
      classes (`.eyebrow`, `h1`, `.sub`, `.hero-actions`, `.hero-logo`/`.hero-split-media`).
- [ ] Sections: add class `reveal` to anything that should fade in on scroll.
- [ ] Buttons/cards: `.btn`, `.service-card`, `.menu-card` get hover lift
      automatically; add new card classes to the `hoverLift()` call in `init()`.
- [ ] Nav: automatic (`.nav`).
- [ ] Before launch, rerun the Core Web Vitals check (Lighthouse on the Cloudflare
      preview URL): CLS must stay ~0, and remember the real risk on image-heavy
      client sites is unoptimized photos, not the animations — compress hero
      images first.
