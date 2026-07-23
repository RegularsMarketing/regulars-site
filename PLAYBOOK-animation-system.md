# Animation System (Motion)

> Paste-ready section for the Website Stack Playbook / Prompt Library.

Every client site ships with the same animation system. It is part of the
template, so there is **zero per-client animation work**. It wires itself up on
every page.

## What's installed

- **Motion** (motion.dev, the vanilla JS build, NOT `motion/react`, no React
  anywhere), installed via `npm install motion` and self-hosted: the build
  copies `node_modules/motion/dist/motion.js` → `/assets/vendor/motion.js`
  (no CDN dependency).
- Loaded in `src/_includes/base.njk` as three deferred scripts, in this order:
  `vendor/motion.js` → `animations.js` → `site.js`.

## Where it lives

```
src/assets/animations.js   ← every utility + auto-init (the whole system)
src/assets/styles.css      ← the MOTION block: reduced-motion kill switch,
                             the one-owner hooks, cross-page continuity
eleventy.config.js         ← passthrough copy of the Motion vendor file
```

---

## Motion carries hierarchy: the three enter tiers

This is the part to understand before anything else.

An audit measured **8 `.reveal` elements on the home page and 7 on pricing all
running the identical enter**. A 1px divider entered exactly like the signature
ledger panel. When every element enters the same way, motion carries no
information about what matters, and a uniform fade on every element is the
single clearest fingerprint of generated motion.

There are now three recipes, assigned per element by `tierFor()` in
`animations.js`.

| Tier | Recipe | For |
|---|---|---|
| `reveal--anchor` | opacity 0→1, y 16→0, **blur 6px→0**, spring 0.5, bounce 0 | The one element in a section that holds the section's meaning |
| `reveal--group` | per child: opacity 0→1, y 12→0, spring 0.4, bounce 0, computed step | A container whose children deal out |
| `reveal--quiet` | opacity 0→1, 220ms, `--ease-out` | Everything else. The default. |

**Blur lives on the anchor tier only.** A 4px blur on a Fraunces headline at the
moment a reader arrives costs legibility for a decorative gain, and
blur-everywhere entrances are one of the three named tells of generated motion.

**Assignment.** An explicit class wins. Otherwise a default map covers the
markup the template ships, so the pages get hierarchy with no template edit:

- **Anchors:** `.ledger-panel`, `.cta-panel`, `.story-hero`, `.contact-panel`,
  `.signup-panel`, `.issue-card`, `.proof-none`, `.price-card.flagship`
- **Groups:** `.pricing-grid`, `.menu-grid`, `.tier-list`, `.service-grid`
- **Skipped entirely** (they show the instant they are on screen):
  `.eyebrow`, `.divider`, and any bare `<p class="reveal">`
- **Everything else:** quiet

**Precedence:** skip list → explicit class → default map → quiet.
A group's direct children are animated by the group, so an anchor sitting
inside a staggered grid keeps the group's timing.

### Two rules the group tier enforces

**The step is computed.** `min(0.05, 0.4/n)` caps the whole sequence at roughly
400ms whether a client's config produces three menu items or thirty. A fixed
60ms step turns a twenty-item menu into a 1.2 second wait for the last row.
Measured: 20 items give a 20ms step and 380ms of total delay.

**One staggered group per screen.** Two *different* lists dealing out in the
same viewport is the identical-card-grids reflex wearing motion. A group closer
than one viewport-height to the last accepted group **of a different kind** is
demoted and simply shows. Repeated instances of the same container class are
exempt, because a menu with four category blocks is one component keeping one
rhythm.

### The ownership inversion

`staggerReveal()` used to skip any container sitting inside a `.reveal`. Right
in intent (it prevents a double entrance), wrong in effect: measured across all
seven built pages, **seven of the eight listed selectors never fired**. Both
menu variants wrapped their content in `.reveal`, so a client restaurant's menu,
the densest and most-scanned component in the product, faded in as one blurred
block.

It is inverted now. A container that deals its own children out, and a ledger
panel that draws its own rows, **claim** their `.reveal` ancestor (marked with
`data-rm-claimed`, visible in devtools) and `scrollFadeIn()` leaves it alone.
The specific entrance beats the generic one. This is why `init()` calls
`staggerReveal()` and `ledgerTally()` **before** `scrollFadeIn()`.

---

## The utilities

All exposed on `window.RegularsMotion` for one-off use; `init()` at the bottom
of `animations.js` already applies them site-wide.

| Function | What it does | Wired in `init()` to |
|---|---|---|
| `scrollFadeIn(sel)` | First-time scroll reveal, at the tier `tierFor()` gives each element | `main .reveal`, excluding hero descendants and claimed elements |
| `staggerReveal(sel, step)` | Container's children deal out, computed step, one group per screen | `.pricing-grid, .menu-grid, .tier-list, .service-grid` |
| `ledgerTally(sel)` | Dotted leaders draw left to right, each value lands as its leader arrives | `.ledger-panel` |
| `hoverLift(sel)` | 3px hover lift plus 0.97 press scale | `.btn` |
| `pressFeedback(sel, scale)` | Press scale with no lift | `.acc-toggle` at 0.98 |
| `heroLoadIn(sel)` | Staggered page-load entrance, 60ms apart | every hero variant |
| `accordion(sel)` | Interruptible open **and exit** for the pricing accordion | `.acc-toggle` |
| `submitFeedback(sel)` | In-flight state for a form submit | `form[action*="formspree.io"]` |
| `parallax(sel, dist)` | Scroll-linked drift, transform only | opt-in via `[data-media-motion="drift"]` |
| `pageTransition()` | Cross-document View Transitions | once per page |
| `stickyNavShrink(sel)` | Adds `.nav--scrolled` past a threshold, with hysteresis | `.nav` |

### The signature moment: `ledgerTally()`

The ledger row is the brand's own metaphor and the component `styles.css` itself
calls the signature stat component: a label, a dotted leader, a value. Its own
mechanics were untapped. Each leader now draws left to right and its value lands
as the leader reaches it, so the panel reads as a sheet being totted up.

- Leader: `scaleX` from a left origin, 320ms, `--ease-out`. Transform only, so
  no width is ever animated.
- Value: opacity plus a 4px settle, spring bounce 0, timed to the leader's
  arrival.
- Rows step by `min(0.07, 0.22/(n-1))`, so three rows finish near 460ms and nine
  finish near 540ms.
- Below 520px `styles.css` drops the leader (a label, a leader and a nowrap
  value cannot share a 375px line), so the values settle in sequence with no
  draw. Handled at reveal time, so a resize between load and scroll is safe.
- Opt out per panel with `.ledger-panel--plain`.

Nothing about a tally is predictable from "restaurant website", which is the
category-reflex check it has to pass.

### The accordion has an exit

It used to have an entrance and no exit: opening ran a 0.22s CSS keyframe,
closing went straight back to `display:none`. Opening was soft and closing was a
hard cut, on the highest-consideration interaction on the site.

`accordion()` takes the control over from the inline `onclick` that `site.js`
installs, by removing the attribute and binding its own handler. This is
order-independent: whenever it runs it takes over, and `window.toggleAcc` stays
intact for anything else that calls it. It also sets `aria-expanded` and
`aria-controls`, which the markup never had.

- Open: 200ms, `--ease-out`, opacity and a 4px rise.
- Close: 140ms, ease-in, opacity and a 2px rise. **Exits get out of the way.**
- Mid-flight toggles retarget from the current value instead of restarting.
- The chevron keeps its CSS rotate and stays the sole owner of its own
  transform. The button classes flip immediately on both paths, so the control
  answers the click before the panel finishes moving.
- Height is never animated. The display flip costs one layout, which is
  unavoidable and is recorded at the `.acc-content` rule in `styles.css`.

Under reduced motion this does not run at all, so the inline handler keeps
working and the toggle is instant. It **does** run under `motion: quiet`, since
quiet is a setting about entrances and a control that opens softly and shuts
with a hard cut is louder than one that does both gently.

---

## The three guardrails (never break these)

**1. Never animate anything that triggers layout.** Width, height, top, left,
margin and padding reflow the page and wreck CLS/INP. Transform, opacity and
filter are always safe. **Paint-only properties are permitted**: `box-shadow`,
`background`, `border-color`, `backdrop-filter` and `text-decoration-color`
repaint without reflowing, and `styles.css` depends on them in nine places.

> The old wording was "transform / opacity / filter only". Nine of the
> stylesheet's thirteen transition rules violated it, none of them harmfully.
> A rule broken nine times in its own codebase teaches people to skip rules,
> so the letter now matches the intent.

One paint-only property is still banned: **`.nav` must not transition
`backdrop-filter`.** Animating a backdrop blur *radius* re-blurs the full-width
backdrop every frame. It was the most expensive paint in the file and the least
perceptible part of the scrolled state. One blur value is held across both
states.

**2. `prefers-reduced-motion` is respected everywhere.** Every utility except
`stickyNavShrink` returns early. Content is shown with no motion and nothing is
ever hidden behind an animation.

- **Elements are hidden BY JS, never by CSS.** There is deliberately no
  `.reveal{opacity:0}` rule. That one line would make every fade a single point
  of failure for anyone whose JS or vendor bundle never arrives.
- **The media query is live.** It used to be read once at load, so a visitor who
  turned the setting on mid-session kept every animation until they reloaded.
  Turning it on now settles every hidden element straight to its final state.
  Turning it off binds the interaction feedback that was skipped at load.
  Entrances are not replayed retroactively, because that content is already on
  screen.
- **`stickyNavShrink` is the one utility with no guard, and that is
  deliberate.** It sets a state indicator, and the CSS transitions it triggers
  are already killed by the reduced-motion block, so the scrolled state snaps.
  Snapping is the correct outcome for a state indicator. **Never "fix" this by
  adding a guard**: that leaves the nav with no scrolled state at all.

**3. Short durations.** 150 to 250ms for interactions, 550ms or less for
entrances, springs with `bounce: 0`. Two named exceptions, both because the
motion has to feel immediate: **press-down is 120ms** and **exits may go to
140ms**. Anything else below 150ms is a bug. Subtle production polish; if a
client comments on an animation, it is too loud.

## One owner per property

> **If something animates a property on an element, nothing else may animate
> that property on that element.**

Two cases, both real, and the old wording only covered the first:

- **CSS vs Motion.** Motion writes inline styles and inline wins, so the CSS
  state silently stops working and the failure is invisible in review. Elements
  in `hoverLift()` get no CSS `:hover`/`:active` transform. They may still
  transition `border-color`, `background` or `box-shadow`; those have no Motion
  owner. `.service-card` models this correctly.
- **Motion vs Motion.** `.service-card` used to be both a `staggerReveal` child
  (animating `y`) and a `hoverLift` target (also animating `y`), so hovering a
  card mid-entrance interrupted its entrance. It is out of `hoverLift` now, for
  a second reason below.

Two hooks in `styles.css` exist purely to keep this honest:

- `html.acc-motion .acc-content.open{animation:none}` stands the CSS keyframe
  down when `accordion()` takes over.
- `.ledger-panel--tally .ledger-row .dots` moves the leader's static -5px
  optical offset from `transform` to the `translate` property, so Motion can own
  `transform` outright with identical rendering.

## Hover promises a click

`.service-card` and `.menu-card` are **deliberately not** in `hoverLift()`.
Neither contains a link or a handler: they rose 3px on hover and did nothing
when clicked, so the motion signalled clickability on inert content. On touch,
`hover()` is correctly suppressed and `press()` binds only to activatable
elements, so those cards had no touch state at all. Their CSS paint hover
(border-colour to the accent, a deeper shadow) already says "this is a surface"
and promises nothing.

If a client build makes those cards clickable, the correct move is a variant
that adds the anchor **and** restores the lift together.

## The flash guard, and LCP

Reveals are hidden by JS after a deferred 46 KB gzipped bundle downloads and
parses. On a fast connection that happens before first paint. On a cold mobile
connection the browser can paint first, and then the script hides content the
visitor is already looking at and fades it back in.

`animations.js` tests whether a paint has already happened
(`performance.getEntriesByType('paint')`). If it has, **anything currently on
screen is left alone and anything still below the fold is animated normally**.
The guard is per element instead of per page, so the system keeps working on slow
connections instead of switching itself off, and no CSS rule can ever strand
content invisible.

This also protects LCP. `heroLoadIn()` used to set opacity 0 on a hero logo
carrying `fetchpriority="high"`, so the template paid to prioritise an image and
then hid it in JS; an element at opacity 0 is not counted as LCP until it
becomes visible. **The hero image is no longer in the entrance list.** The
sequence starts at the eyebrow, and after a paint the whole hero stands down.

The hero timing came down too. Five items at 90ms on a 550ms spring put the last
element near 1.0 second, which complies per element and is roughly double the
entrance guardrail as a perceived event. Four items at 60ms on a 450ms spring
settle near 690ms.

## Cross-page continuity

`pageTransition()` installs a fast root cross-fade (150ms out, 200ms in). That
fade used to take the nav with it: the bar, the wordmark and the active link
dissolved and rebuilt on every navigation even though all three are pixel
identical on both sides.

The MOTION block in `styles.css` gives three elements a `view-transition-name`:

- `.nav` and `.nav .logo` hold still, with no cross-fade, so identical content
  does not flicker.
- The active nav link (`.tab-btn.active`, `.topnav-link.active`,
  `.navc-link.active`) keeps its default cross-fade, so the indicator travels
  from the old link to the new one. That is the one thing that actually changed.

A name must be unique per document. One nav variant renders per site and one
link is active per page, so all three stay unique across `tabs`, `topline` and
`collapse`. Browsers without cross-document view transitions ignore the lot and
navigate instantly.

## Why there is no `will-change` in `styles.css`

Motion sets `will-change` on the elements it is animating, for exactly as long
as it animates them. Pinning it in CSS across dozens of `.reveal` elements would
hold a compositor layer per element for the life of the page, which costs memory
on the phones this template is mostly read on and buys nothing.

---

## The Motion library decision (recorded, do not relitigate)

**Keep Motion.** Recorded here so the next session does not reopen it.

The audit was right that shipping 46 KB gzipped to deliver eight scroll fades, a
3px hover lift and a class toggle was a library tax on a CSS-sized problem. That
is no longer what it delivers. The template now uses the things only Motion
gives you:

- **Mid-flight retargeting** on the accordion (a fast double-click retargets
  from the current value; a CSS keyframe restarts from zero).
- **A computed stagger step**, recalculated from the child count a client's
  config produces.
- **A coordinated sequence** in `ledgerTally()`, where one timeline drives the
  leaders and a second, offset, drives the values.
- **Interruptible, promise-aware controls**, which is what makes the submit dip
  safe to cancel.
- **A real hero timeline** with its own stagger and spring.

If a future pass strips these back to plain fades, replace Motion with
`IntersectionObserver` plus CSS transitions and delete the vendor passthrough.
Shipping 46 KB to deliver eight fades is not defensible; shipping it for the
list above is.

---

## Checklist for a new client build

- [ ] Nothing to install or configure. The system rides along with the template.
- [ ] **Hero:** automatic for every variant. A *new* hero variant only needs its
      pieces to use the standard classes (`.eyebrow`, `h1`, `.sub`,
      `.hero-actions`). Do **not** add the hero image to the entrance list; it
      is the LCP element.
- [ ] **Sections:** add `reveal` to anything that should enter on scroll. It
      gets the quiet tier by default. Add `reveal--anchor` to the one element
      per section that holds the section's meaning, and nothing else.
- [ ] **Do not** put `reveal` on an eyebrow, a divider, or a bare paragraph.
      Those are skipped in `animations.js`, so the class does nothing there.
- [ ] **New grid that should deal out:** add its class to `GROUP_SELECTORS` in
      `animations.js`, or give the container `reveal--group`. Check the
      one-group-per-screen guardrail still holds on the page.
- [ ] **New card class:** it gets hover lift only if it is genuinely clickable.
      If it is, add it to the `hoverLift()` call in `bindInteractions()`. If it
      is not, leave it out and let CSS carry the hover.
- [ ] **New ledger-style panel:** `ledgerTally()` picks up any `.ledger-panel`
      with two or more `.ledger-row` children. Opt out with
      `.ledger-panel--plain`.
- [ ] **Nav:** automatic (`.nav`). A new nav variant needs its active-link class
      added to the `view-transition-name` rule in the MOTION block, or the
      active indicator will dissolve with the page instead of travelling.
- [ ] **Before launch,** rerun the Core Web Vitals check (Lighthouse on the
      Cloudflare preview URL). CLS must stay at ~0. The real risk on
      image-heavy client sites is unoptimised photos rather than the animations, so
      compress hero images first.

---

## Pending config wiring (mechanism shipped, config not)

Three features read defensively and default to today's behaviour, so they cost
nothing while unwired. Each needs the same three-line pattern: a `site.yaml`
key, the matching `admin/config.yml` field (Decap parity is mandatory), and one
line of template output.

| Feature | Reads | Still needs |
|---|---|---|
| `motion: full \| quiet` | `data-motion` on `<html>` or `<body>` | `components.motion` in `site.yaml`, the Decap field, and the attribute emitted in `base.njk` |
| `ledger: plain \| tally` | `.ledger-panel--plain` on the panel | `components.ledger` in `site.yaml`, the Decap field, and the class emitted where the panel is rendered |
| `hero.media_motion: none \| drift` | `[data-media-motion="drift"]` | the field in `site.yaml`, a Decap field with a hint that it only applies to `hero=split`, and the attribute on the hero media panel |

`quiet` runs opacity-only entrances with no rise, no blur, no stagger, no ledger
draw, no parallax and no cross-page transition. Interaction feedback and the
accordion stay on. It is the cleanest way to let the menu grid's stagger be a
config decision without a second menu variant, and it turns the 432-recipe
matrix into 864 for almost no code.

## Known cleanup outside this partition

- **`src/*.njk` carry `class="reveal"` on eyebrows, dividers and bare
  paragraphs.** `animations.js` skips them, so the behaviour is correct, but the
  class is misleading in the markup and should be removed from the page
  templates.
- **`design-system/MASTER.md` §6 is stale.** It documents five utilities, quotes
  the old single enter recipe, restates the old "transform / opacity / filter
  only" guardrail, and reports a `.menu-card` one-owner violation that no longer
  exists. It should be rewritten against this file.
- **The submit label cross-fade needs one line in `site.js`.** Wrapping the
  button's label in a `<span>` before `btn.textContent` is reassigned would let
  `submitFeedback()` cross-fade the two labels. Without it the swap is masked by
  an opacity dip, which is close but not the same thing.
