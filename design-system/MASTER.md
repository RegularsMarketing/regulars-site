# MASTER.md — design-time source of truth

Referenced by [DESIGN-WORKFLOW.md](../DESIGN-WORKFLOW.md) TEMPLATE MODE step 2.
Context brief: [PRODUCT.md](../PRODUCT.md).

**What this file is.** The design decisions and the *reasoning behind them*, recorded so
the next session does not re-derive them from scratch. This is the **design-time**
authority. It is not read at build time.

**What it is not.** It is not the runtime config. Tokens chosen here get written into
`content/site.yaml`, which stays the **runtime** source of truth. Nothing here is
hardcoded into templates or CSS.

```
MASTER.md  (design-time: why these values)
    ↓  chosen tokens written into
content/site.yaml  (runtime: theme.colors, theme.fonts)
    ↓  injected as CSS custom properties in <head>
src/_includes/base.njk  →  :root{ --cream, --charcoal, --orange, ... }
    ↓  consumed by
src/assets/styles.css  (structure only — no brand values)
```

**Last verified against the code:** 2026-07-19, after the craft pass that rebuilt the type
ramp, introduced the spacing tokens, art-directed optical sizing, added eight component
variants, and recorded the two palette invariants in §1.2.1. Every value below was read from
`src/assets/styles.css`, `content/site.yaml`, `src/_includes/base.njk`, or
`src/assets/animations.js`. Where the code does not define a rule, this file says so
explicitly rather than inventing one — see [§9 Gaps](#9-gaps-in-the-system).

---

## 1. Palette

Defined in `content/site.yaml` under `theme.colors`; injected as custom properties by
`base.njk`. The YAML key and the CSS variable name differ — both are listed, because
mixing them up is the most common way to break a build.

| YAML key (`site.yaml`) | CSS var | Value | Role |
|---|---|---|---|
| `cream` | `--cream` | `#D5B38E` | Warm sand — the page field |
| `cream2` | `--cream-2` | `#E3CBAF` | Lighter sand tint — alt sections, cards, panels |
| `charcoal` | `--charcoal` | `#2B2926` | Body text; inverted panel grounds |
| `charcoal2` | `--charcoal-2` | `#4A453E` | Muted/secondary text |
| `orange` | `--orange` | `#004437` | Deep green — the accent |
| `orange_dark` | `--orange-dark` | `#00332A` | Deeper green — hover/pressed |
| `line` | `--line` | `rgba(43,41,38,0.15)` | Borders, rules, dividers |
| `line_soft` | `--line-soft` | `rgba(43,41,38,0.09)` | Interior list separators |

`line` and `line_soft` are charcoal-based rgba by design — they tint with the ground
rather than sitting on it. Keep them charcoal-derived.

### 1.1 Measured contrast — do not regress

WCAG 2.1 ratios, measured (not estimated):

| Pair | Ratio | Verdict |
|---|---|---|
| charcoal on sand | **7.37:1** | Body text — passes AAA |
| charcoal2 on sand | **4.82:1** | Muted text — passes AA, **tight** |
| green on sand | **5.67:1** | Accent, links — passes AA |
| white on green | **11.16:1** | Button labels |
| sand on green | **5.67:1** | Inverted sections |

> **charcoal2 on sand at 4.82:1 is the tightest pair in the system and must not be
> lightened.** It clears the 4.5:1 AA threshold by 0.32. Any lightening of `charcoal2`
> — or any darkening of `cream` — drops muted body copy below AA. `charcoal2` is used
> for nearly all secondary text in `styles.css` (`.section-head p`, `.split p`,
> `.service-card p`, `.step p`, `.story-body p`, footer text, and ~20 more), so this is
> not an edge case; it is most of the running text on the site.

**The accent change fixed a real defect, it was not only taste.** The previous accent
burnt orange `#C4551F` on the previous cream `#FAF6EF` measured **4.18:1** — *below* the
4.5:1 AA threshold. Accent-colored body copy and links were non-compliant. Green
`#004437` on sand `#D5B38E` measures 5.67:1 and passes. Record this so no future session
proposes reverting on aesthetic grounds without knowing it reintroduces a WCAG failure.

### 1.2 The naming trap — read before "cleaning up" the config

**The tokens are still named `cream` and `orange`. They now hold sand and green.**

This mismatch is deliberate and it stays. Renaming the keys would require simultaneous,
coordinated edits to:

- every `var(--cream)` / `var(--orange)` reference in `src/assets/styles.css`
- the `:root` block in `src/_includes/base.njk`
- `theme.colors` in `content/site.yaml`
- the matching field names in `admin/config.yml` (Decap parity)
- **every existing and future client clone**, each of which carries its own `site.yaml`
  written against these key names

The cost is unbounded and the benefit is cosmetic. **Leave the keys alone; only the
values change.** This is flagged for the owner as a known naming debt — the correct
resolution is an owner decision, not a cleanup a design session performs on its own
initiative.

Practical consequence for anyone reading the CSS: `--orange` means *accent*, and
`--cream` means *page ground*. Read them as role names, not color names.

### 1.2.1 The two palette preconditions — INVARIANTS, not preferences

**These are the answer to "the two undocumented constraints the CSS encodes."** They were
load-bearing and implicit; they are now stated in three places: here, in the header of
`src/assets/styles.css`, and as `hint:` text on the colour fields in `admin/config.yml`
(which is where the decision is actually made, by an editor who will never read this file).

> **INVARIANT 1 — the accent must be dark, measured against TWO grounds.**
> `--ink:var(--orange)` makes the accent the *text ground* for eight components
> (`.hero-fullbleed`, `.story-hero`, `.signup-panel`, `.contact-panel`, `.cta-panel`,
> `.ledger-panel.dark`, `.price-card.flagship`, and the new `.band-ink` / `.footer--ledger`).
> Two ratios must clear 4.5:1:
>
> | Pair | Why it exists | Current |
> |---|---|---|
> | `--on-ink-strong` (white) on accent | headings, button labels | **11.16:1** |
> | `--on-ink` (the page field) on accent | body copy, `.sub`, muted rows | **5.67:1** |
>
> **Checking white alone is not enough, and that is the trap.** Measured against plausible
> client picks: amber `#E8A33D` → 2.16 / 1.10 (fails both). Olive `#7A9E4B` → 3.08 / 1.56
> (fails both). This repo's own accent from before the rebrand, burnt orange `#C4551F` →
> **4.50 / 2.29** — it *passes* the white test and *fails* the page-field test, which would
> have made `.hero-fullbleed .sub` and every muted row on an inverted band an AA failure
> while looking fine in a spot check.

> **INVARIANT 2 — `cream2` must be lighter than `cream`.**
> `--paper:var(--cream-2)` plus the `--edge-lit` white inset encodes *raised = a lighter
> tint of the page field*. Measured relative luminance: cream `0.483`, cream2 `0.621`,
> delta **+0.138** — correct. A plausible darker client tint (`#C9A379`, delta **−0.084**)
> inverts the entire elevation model: every raised card reads as a hole punched in the page,
> and the lit edge becomes a highlight on the wrong side of the surface.

**Why these are documented preconditions and NOT runtime fallbacks.** An adaptive `--ink`
that auto-picks a text colour when the accent is too light produces a site that silently
looks different per client, which breaks the "design for the twentieth clone" promise in a
way nobody can preview. A silent fallback also *masks* a bad palette choice instead of
stopping it, so the client ships a site where the accent quietly stopped being structural
and nobody notices. Pure-CSS defence is not genuinely available either: the primitive you
would want is `contrast-color()`, which is not broadly supported, so a CSS guard would be
theatre.

**Outstanding — the enforcement half is NOT yet built.** The preconditions are documented
and surfaced to editors, but nothing fails a build that violates them. The right home is
`src/_data/site.js` (11 lines today, the single point where `site.yaml` becomes template
data, and it runs on every clone's build). Required behaviour:

- compute relative luminance of `theme.colors.orange` and `theme.colors.cream2`;
- **throw** — never warn — when white-on-accent < 4.5:1, when page-field-on-accent < 4.5:1,
  or when `cream2` is not lighter than `cream`.

Make it an error, because the half-day bar guarantees nobody reads warnings. A bad clone
then fails loudly in seconds instead of shipping an AA failure. That file was outside the
partition of the session that wrote this section, so it is recorded here as the next action
rather than silently left undone.

### 1.3 How color is actually applied

Observed conventions in `styles.css`, worth preserving:

- **Ground vs. raised.** `--cream` is the page. `--cream-2` is every raised surface
  (cards, panels, chips, badges). The lift is a *fill change plus a border*, never a
  shadow — see [§4](#4-radius-and-elevation).
- **Inverted panels use `--charcoal` ground with `--cream` text**, and pull their
  interior rules from `color-mix(in srgb, var(--cream) N%, transparent)` rather than
  hardcoded greys. `.story-hero`, `.contact-panel`, `.signup-panel`, `.ledger-panel.dark`,
  `.price-card.flagship`, `.hero-fullbleed`.
- **The accent is rationed.** `--orange` appears as: the eyebrow rule and text, the
  divider dot, focus rings, numerals and stat values, list-marker dashes, card hover
  borders, and primary button fill. It is never a large field. That restraint is what
  keeps the deep green reading as ink rather than as a brand block.
- **`color-mix()` is the house method** for every tint and translucency. There are no
  hand-mixed intermediate hexes, which is why one token swap re-skins the whole site.

### 1.4 Literal colors present in styles.css

The "zero brand hex values in `styles.css`" property holds, with one caveat that should
be known rather than discovered:

- `#fff` appears 3× (`.btn-primary`, `.flagship-tag`, `.issue-tag`) — all of them white
  text on the green accent, measured at 11.16:1. This is a neutral, not a brand value.
- **`.nav--scrolled` has `box-shadow:0 8px 24px -18px rgba(43,41,38,0.45)` (line 24).**
  `rgb(43,41,38)` *is* `#2B2926` — charcoal, hardcoded in rgb form. It is not a hex
  literal, so it passes a hex grep, but it is a brand value baked into the stylesheet. On
  a client clone with a different charcoal, the nav shadow keeps Regulars' charcoal. The
  fix is `color-mix(in srgb, var(--charcoal) 45%, transparent)`. Logged in
  [§9](#9-gaps-in-the-system); not fixed here (outside this document's remit).

---

## 2. Type system

Two families, loaded via a **single Google Fonts href** in `site.yaml`
(`theme.fonts.google_href`) — one request, preloaded and applied non-blocking in
`base.njk` with a `<noscript>` fallback.

| Role | Stack | YAML key |
|---|---|---|
| Headings | `'Fraunces', serif` | `theme.fonts.heading` |
| Body | `'Inter', sans-serif` | `theme.fonts.body` |

Axes actually requested: **Fraunces** roman + italic, optical size `9..144`, weights
300/400/500/600/700 (italic 400/500/600). **Inter** 400/500/600/700.

Applied in `styles.css` by `h1,h2,h3,.serif{font-family:var(--font-heading)}` — everything
else inherits Inter from `body`.

### 2.1 The italic-Fraunces signature

The single most distinctive type decision in the system, and it is easy to erase by
accident. **Italic Fraunces in the accent green is the house treatment for numerals and
quantities.** Eight call sites, all consistent:

| Element | Size / weight |
|---|---|
| `.stat-card .sval` | 36px / 600 |
| `.step .snum` | 32px |
| `.ledger-row .value` | 24px / 600 |
| `.pull-quote` | 24px / 500 (charcoal, not green) |
| `.door-num` | 15px |
| `.addon-card .ap` | 15px |
| `.service-num` | 14px |
| `.story-hero h2` | 30px / 500 (cream on charcoal) |

Numbers are set as *editorial figures*, not as UI data. This is the main reason the site
does not read as a dashboard, and it is the payoff for loading Fraunces' italics at all.
Any new component displaying a number should use this treatment.

(`styles.css` contains 10 `font-style:italic` declarations total. The other two —
`.acc-inner .not-inc` and `.issue-card .sig` — are plain italic *body* text at 12–13px
for asides and signatures. They are not part of this signature and should not be
converted to it.)

**The figure split — measured, and the reason it is not "inconsistent".**

The served **Fraunces subset carries no `tnum`**. Verified two ways in-page: both
`font-variant-numeric:tabular-nums` and `font-feature-settings:'tnum' 1` leave it untouched
(`'1111111111'` = 358.2px vs `'0000000000'` = 592.8px, identical before and after). Inter's
works and equalises both strings to 648.4px.

So the rule is **where digits stack vertically in a column, the figures change family**:

| Treatment | Where | Why |
|---|---|---|
| Inter + `tabular-nums` | `.board-item .bprice` (menu board), `.fledger-row .fl-val` (ledger footer hours) | genuine columns; a menu price list and a column of times must line up |
| Italic Fraunces (the signature) | everything in the §2.1 table | standalone editorial figures where nothing has to align |

**`.ledger-row .value` deliberately keeps the signature.** The direction proposed converting
it, but Regulars' own ledger rows are heterogeneous strings — `65–80%`, `~70%`, `26×`,
`Month-to-month`, `Autopay, 1st` — which have nothing to align. Converting the site's most
distinctive component to fix an alignment problem it does not have would be a net loss. A
client whose ledger *is* a numeric column (covers, average check) opts in with
`.ledger-panel--figures`, which switches that panel's values to Inter tabular.

> **Do NOT sprinkle `tabular-nums` onto Fraunces elements.** It is inert there and it
> creates a false sense that alignment has been handled. That was the state before this pass.

### 2.2 The scale — a real modular ramp (rebuilt)

**Superseded the ad-hoc list.** `styles.css` previously had 26 fixed px values on a 0.5px
granularity: in the 12–17px band the steps ran 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 /
15.5 / 16 / 16.5 / 17, roughly **1.03x** apart. Size therefore could not signal rank, so
hierarchy fell entirely to weight (only 600/700/500 declared) and colour (charcoal vs
charcoal2) — both binary — and whole pages read as one flat texture.

There is now a **1.25x modular ramp of ten steps**, declared as `--step-1` … `--step-10` in
the `:root` block. **All 128 `font-size` declarations in the file resolve to a step; zero
ad-hoc values remain**, and every one of the ten steps is in use.

| Token | Value | Role |
|---|---|---|
| `--step-1` | 12px | tracked uppercase micro-labels ONLY |
| `--step-2` | 15px | dense copy floor: card body, list items, chips |
| `--step-3` | 18px | running body copy, sub-headings |
| `--step-4` | 23px | card titles, panel headings |
| `--step-5` | 29px | small display |
| `--step-6` | 36px | display |
| `--step-7` | 45px | large display |
| `--step-8` | 56px | section display ceiling |
| `--step-9` | 70px | hero display |
| `--step-10` | 88px | register ceiling — nothing goes above this |

**Add a component by picking a step. Never invent an intermediate value** — the ramp is
worthless the moment something is 14.5px again.

Two consequences worth knowing rather than rediscovering:

- **Body copy moved 16px → `--step-3` (18px).** The measure caps came down proportionally
  to hold the same 65–75ch target (`.section-head` 640→580px, `.story-body p` 680→620px);
  left alone they would have drifted to ~74ch.
- **The sub-12px running-copy roles are gone.** `.stat-card .ssrc` (was 10.5px) and the
  12.5px list items in `.project-card` / `.acc-inner` moved onto steps 1 and 2. Sub-12px is
  now genuinely reserved for tracked uppercase labels, which was always the house rule and
  was simply not being followed.

**Optical size is art-directed, at zero byte cost.** Fraunces' `opsz` axis (9–144) is
already inside the downloaded file. Measured in-page: the same string sets **23.1% narrower
at opsz 144 than at opsz 9**. Left on `auto` the axis is slaved to font-size, so with
nothing previously set above 50px the display cut was *never reached* and every heading was
a text cut scaled up. Two pinned bands now exist (`--opsz-display:144`, `--opsz-text:14`),
applied to heading-family selectors only; everything between stays on `auto`.

**Fluid display now actually engages.** `.hero h1` was `clamp(30px,5vw,50px)`: the 5vw term
wanted 72px at 1440 and the clamp pinned it to 50, so the fluid term stopped doing anything
above a ~1000px viewport and every desktop saw the identical 50px. Clamps are now written
so the vw term stays live across the desktop range, with the ceiling at or below `--step-10`.

**SOFT and WONK: declined, deliberately.** Measured — the current Google subset has stripped
both axes (`'SOFT' 0` and `'SOFT' 100` produce identical set widths; same for WONK).
Unlocking them means requesting the true variable range, which takes the latin payload from
149,092 B to 270,312 B: **+121 KB, +81%**. WONK is only visible at display sizes. The
distinctiveness was taken from opsz art-direction instead, at zero cost. Do not enable
SOFT/WONK silently as a template default on a product whose QA gate is a Lighthouse pass;
if an owner wants it, scope it to one display role and re-measure.

**Fraunces 300 is now used.** It was requested in the font href and referenced nowhere in
511 lines — downloaded every page load and never rendered. It is the display weight for
`hero/statement` and `hero/marquee`, which is where it earns the request.

**Fluid display (the only `clamp()` sizes):**

| Element | Value |
|---|---|
| `.hero h1`, `.hero-fullbleed h1` | `clamp(30px, 5vw, 50px)` |
| `.hero-split-text h1` | `clamp(28px, 4.4vw, 46px)` |
| `.section-head h2` | `clamp(28px, 4vw, 36px)` |

**Fixed sizes by role (px):**

| Band | Values | Typical use |
|---|---|---|
| Display | 36, 34, 32, 30, 29, 26 | stat values, price amounts, step numerals, story/split headings |
| Section heading | 24, 23, 22, 21, 20, 19 | ledger values, pull quotes, panel headings, logo word |
| Sub-heading | 18, 17, 16.5 | card titles, FAQ summaries, hero sub |
| Body | 16, 15.5, 15, 14.5 | running copy, buttons, panel copy |
| Secondary | 14, 13.5, 13 | card copy, footer links, dense lists |
| Micro | 12.5, 12, 11.5, 10.5 | eyebrows, stamps, tags, source lines |

**Weights are restricted to three:** 600 (25 uses — all headings and emphasis), 700
(5 — uppercase micro-labels only), 500 (3 — large italic display). Regular 400 is the
inherited default and is never declared. Keep new work inside these three.

### 2.3 Rules that *are* consistent

Unlike the size list, these hold across the whole stylesheet and should be treated as
real rules:

- **Line-height tightens as size grows.** 1.08 (hero h1) → 1.12 (section h2) → 1.15
  (split h2) → 1.3–1.35 (sub-headings) → 1.5–1.75 (body) → 1.85 (`.story-body p`,
  long-form). New type must follow this curve.
- **Letter-spacing follows size inversely.** `-0.01em` on large headings; `0` on body;
  `+0.14em` on `.eyebrow`; `+0.04em`–`0.06em` on uppercase micro-labels. Uppercase text
  is *always* tracked out and *always* ≤12.5px.
- **Measure is capped explicitly**, never left to the container: 600px (`.hero p.sub`),
  640px (`.section-head`, `.pull-quote`, `.story-hero h2`), 680px (`.story-body p`),
  760px (`.hero h1`). Any new long-form block needs its own `max-width`.

---

## 3. Spacing

**There is now a spacing token layer.** `--space-1` … `--space-8` (4 / 8 / 12 / 16 / 24 /
32 / 48 / 64px) plus three section weights. Previously every value was a literal and the
literals were unrelated to each other and to the section rhythm.

**Section rhythm is three weights, not two.** The measured home page ran **219 / 140 / 112 /
112 / 112 px** between sections — four identical gaps in a row, which is the absence of a
rhythm rather than a rhythm. Four of six home sections carried `.tight`, so the documented
"84px section rhythm" was the exception in practice.

| Token | Value | Use |
|---|---|---|
| `--section-tight` | 48px | this section continues the previous thought |
| `--section` | 96px | standard |
| `--section-major` | 160px | a change of subject, or a change of ground |

Applied as `section{padding:var(--section) 0}` · `section.tight{…--section-tight…}` ·
`section.major{…--section-major…}`.

> **Open handoff:** `.major` is available but no page template uses it yet, and
> `src/index.njk` still carries `.tight` on four consecutive sections, so the home page
> still reads 96 / 96 / 96 after this pass. Page templates were outside this session's
> partition. The rhythm fix is one class per section in `index.njk`, plus the `.band-ink`
> device below.

**A change of ground beats any amount of padding.** `.band-ink` is a new section-level
device that puts a full-width accent band into a long page. The accent measures 11.16:1
against white and 5.67:1 against the page field — the widest, safest range in the palette —
and it was rationed to trim and a full stop at the bottom of the page while sand carried
~90% of every surface. Target for a long page: 25–40% of scroll height on the accent.

| Layer | Value |
|---|---|
| Container | `.wrap` — `max-width:1080px`, `padding:0 var(--space-6)` |
| Hero | `.hero` 80/70 · `.hero-split` 70/60 · `.hero-fullbleed` 110 |
| Footer | `footer` 56/32 · `.footer--minimal` 40/28 |
| Large panel padding | 32–46px (`.ledger-panel` 36/40, `.contact-panel` 46/42, `.story-hero` 52/42) |
| Card padding | 18–28px (`.service-card`/`.menu-card`/`.project-card` 24/22) |
| Chip padding | 4–8px vertical, 10–18px horizontal |
| Grid gaps | 14–20px between cards; 40–60px between major columns |

**Breakpoints — three, ad hoc:** `860px` (nav collapses), `760px` (splits, hero-split,
contact panel), `700px` (footer grid). Plus `prefers-reduced-motion`. Note that these do
**not** align with the 375 / 768 / 1024 / 1440 test widths named in DESIGN-WORKFLOW.md —
768 falls between the 760 and 860 breakpoints, so it is worth checking explicitly.

Grids are `repeat(auto-fit, minmax(Npx, 1fr))` with N between 200 and 250. They reflow
by content width rather than by breakpoint, which is why so few media queries are needed.

---

## 4. Radius and elevation

### Radius

Ten distinct values, no tokens. The consistent pattern is **radius scales with the
element**:

| Element class | Radius |
|---|---|
| Buttons, signup inputs | `30px` (pill) |
| Chips, tags, tabs, small pills | `20px` (pill at that height) |
| Circles (logo mark, dots, icons) | `50%` |
| Form inputs, small cards | `10–14px` |
| Content cards | `16–18px` |
| Large panels | `20–24px` |

`20px` is the most-used value (9 occurrences) and is the safe default for a new panel.

### Elevation

**CORRECTED 2026-07-19.** This section previously claimed "there is exactly one `box-shadow`
in the entire stylesheet" and instructed "do not introduce shadow-based elevation." Both
were false and the instruction was actively harmful: the code had already, and correctly,
outgrown them. A stale design-time source of truth is more dangerous than no document,
because the next session "restores" the flat model and regresses real work.

**There is a deliberate four-token elevation scale**, driven by a *tone step plus a lit edge
plus a short contact shadow* — never a wide soft drop shadow.

| Token | Use |
|---|---|
| `--edge-lit` | inset white highlight along the top edge — the "lit edge" on paper |
| `--raise-1` | edge + 1px contact (badges, stat cards) |
| `--raise-2` | edge + contact + short cast (service cards, ledger panel, issue card) |
| `--raise-3` | edge + contact + deeper cast (price cards, hover state of `--raise-2`) |
| `--raise-ink` | the inverted-surface equivalent, no lit edge |

The original reasoning still holds and is why the shadows are *short and tight* rather than
absent: **wide soft shadows on a warm mid-tone ground read as grey smudge**, because there
is not enough luminance range below the ground to cast into. Separation comes from tone and
edge first; shadow is only a contact hint.

> **The rule that replaces the old one:** a raised surface is a *lighter tint* + a hairline
> + a short contact shadow. Never a wide soft drop shadow, and never a translucent blur —
> that is what the "no glassmorphism by default" ban protects.
>
> This depends on **Invariant 2** (§1.2.1): the whole model assumes `cream2` is lighter
> than `cream`.

**Texture now exists on both grounds.** The paper grain is three speck layers on coprime
13/19/31px tiles (not the single 24px radial-gradient §7 used to describe). The accent bands
were perfectly flat next to it, so they read as digital rectangles dropped onto printed
paper; `--grain-ink` is the same field re-tinted for a dark ground, measured at 1.06–1.15:1
against the accent — texture, not pattern. Both are CSS only: no image request.

---

## 5. Component variant matrix

**5 slots × 18 variants = 432 recipes.** Selected per site in `content/site.yaml` under
`components:`, with matching `select` widgets in `admin/config.yml`.

| Slot | Variants | Files |
|---|---|---|
| `nav` | `tabs` · `topline` · **`collapse`** | `src/_includes/components/nav/*.njk` |
| `hero` | `textforward` · `fullbleed` · `split` · **`statement`** · **`marquee`** · **`ticket`** | `src/_includes/components/hero/*.njk` |
| `menu` | `list` · `grid` · **`tiered`** · **`board`** | `src/_includes/components/menu/*.njk` |
| `footer` | `columns` · `minimal` · **`ledger`** | `src/_includes/components/footer/*.njk` |
| **`proof`** | **`off`** · **`statement`** | `src/_includes/components/proof/*.njk` |

3 × 6 × 4 × 3 × 2 = **432 distinct site recipes** from one codebase, up from 24.

**Current selection (Regulars' own site):** `collapse` / `statement` / `tiered` / `ledger` /
`statement`. Each pick answers a measured defect — see the comments in `site.yaml`.

**What the new variants are for** (the category-reflex check in §8 was run on each):

| Variant | Serves | Why it is not predictable from "restaurant website" |
|---|---|---|
| `nav/collapse` | any site with 5+ links | fixes a measured phone defect: six pills wrapping to two rows, 32px targets, 17.6% of the viewport |
| `hero/statement` | any client whose headline is the argument | text-first, hard-left, no logo in the fold; inverts this template's own centring reflex |
| `hero/marquee` | an established place whose *sign* is the brand | the type IS the image; the band is bounded and the supporting copy leaves it entirely |
| `hero/ticket` | counter-service, delis, coffee bars | an asymmetric perforated paper column (CSS `mask`) with no photograph |
| `menu/tiered` | a services catalogue | plan membership gets its own scannable column instead of a 10.5px chip inside the heading |
| `menu/board` | a long real menu, 20+ items | a typographic letter board with dotted leaders — the correct affordance for a long list, and it carries the tabular-figure fix structurally |
| `footer/ledger` | cafés/bakeries/bars with awkward hours | the footer as the last piece of *information*, not a sitemap; reuses the brand's own ledger metaphor |
| `proof/statement` | any pre-launch business, i.e. every clone in month one | states plainly why there are no testimonials, sourced from the process page so the claim has one canonical home |

> **`nav/rail` was proposed and deliberately NOT built.** It alters page layout rather than
> one component, so it needs a body-level class and explicit reconciliation with
> `stickyNavShrink()` in `animations.js`. Shipping it half-wired would be worse than not
> shipping it. It remains a good idea for image-led clients.

### How the mechanism works

Each slot has a **dispatcher** at `components/<slot>.njk` that is a single line:

```njk
{% include "components/nav/" + site.components.nav + ".njk" %}
```

Pages include the dispatcher; the dispatcher resolves the variant from config. Adding a
variant means adding one file and one option — no template surgery.

> **`proof` is built but not yet wired.** Unlike the other four slots, no page includes
> `components/proof.njk` yet, because page templates were outside the partition of the
> session that built it. It is a one-line include in `src/index.njk` — the intended position
> is immediately **before** the services grid, since it answers the "where are the case
> studies?" objection a visitor forms in the first ten seconds:
> `{% include "components/proof.njk" %}`.
> The dispatcher defaults to `off`, so an existing client config without the key still
> builds, and the component self-guards on the process copy being present.

### The rule this exists to enforce

> **Variety comes from growing this library. Never from per-client styling.**

This is the load-bearing rule of the whole product (Failure Mode #12). When a client
needs a look no variant offers, the sanctioned path is: switch to TEMPLATE MODE → build
it as a **new variant** → return to CLIENT MODE and select it in config. That path is
slower once and faster forever, because the next client can select it too. One-off
styling forks the template into N unmaintainable copies and silently kills the half-day
bar.

**Checklist for adding a variant** (all four, or it ships broken):

1. New file at `src/_includes/components/<slot>/<name>.njk`.
2. Variant CSS in the `SWAPPABLE COMPONENT VARIANTS` section of `styles.css`, scoped to
   its own classes — never modifying a shared class.
3. Option added to the matching `select` in `admin/config.yml` (**Decap parity — parity
   is 363/363 with zero dead fields; do not regress it**).
4. Motion check: reuse the standard classes (`.eyebrow`, `h1`, `.sub`, `.hero-actions`,
   `.hero-logo`/`.hero-split-media`) and animation is automatic. A new *card* class must
   be added to the `hoverLift()` call in `animations.js` `init()` or it silently gets no
   hover motion.

---

## 6. Motion system

Vanilla **Motion** (motion.dev), self-hosted at `/assets/vendor/motion.js` (copied from
`node_modules` by `eleventy.config.js` — no CDN). **Never framer-motion; there is no
React here.** Load order in `base.njk`, all deferred: `vendor/motion.js` →
`animations.js` → `site.js`.

Everything lives in `src/assets/animations.js`, which auto-wires itself via `init()`.
Per-client animation work: **zero**.

### The five utilities

Exposed on `window.RegularsMotion`; `init()` already applies them site-wide.

| Utility | Behavior | Wired in `init()` to |
|---|---|---|
| `scrollFadeIn(sel)` | First-time scroll reveal | `main .reveal`, excluding elements inside a hero |
| `hoverLift(sel)` | 3px lift on hover; 0.97 scale on press | `.btn, .service-card, .menu-card` |
| `heroLoadIn(sel)` | Staggered page-load entrance, 90ms apart | `.hero, .hero-fullbleed, .hero-split` |
| `pageTransition()` | Cross-document View Transitions fade | once per page |
| `stickyNavShrink(sel)` | Adds `.nav--scrolled` past threshold, with hysteresis | `.nav` |

**The house enter recipe** (Jakub Krehel), shared by `scrollFadeIn` and `heroLoadIn`:

```js
{ opacity:[0,1], y:[12,0], filter:['blur(4px)','blur(0px)'] }
{ type:'spring', duration:0.45, bounce:0 }   // 0.55 + stagger(0.09) for hero
```

The blur is what makes elements *materialize* rather than merely fade. Keep it — it is
the difference between this and default template motion.

`stickyNavShrink` is the one utility that runs under reduced motion (it toggles a class;
the CSS transitions are themselves killed by the reduced-motion block). All four others
return early.

### The three guardrails — never break these

1. **Transform / opacity / filter only.** Never animate width, height, top/left, margin,
   or padding. Those reflow layout and wreck CLS/INP. This is why `.nav--scrolled`
   shrinks the *logo* with `transform:scale(0.9)` instead of reducing nav padding — the
   nav's box never changes size, so layout shift stays at zero.
2. **`prefers-reduced-motion` is respected everywhere.** Every utility checks it;
   `styles.css` also kills all CSS transitions and animations under it. Critically,
   elements are hidden **by JS, not by CSS** — so no-JS visitors, reduced-motion users,
   and anyone whose vendor bundle fails to load still see all content. Animation is
   decorative, never functional. `animations.js` opens with `if (!window.Motion) return;`
   for exactly this reason.
3. **Short durations.** 150–250ms for interactions, ≤550ms for entrances, springs with
   `bounce: 0`. Subtle production polish — *if a client comments on an animation, it is
   too loud.*

### The one-owner-per-property rule

> **If Motion animates a property on an element, CSS must not also animate that
> property on that element.** Motion writes inline styles; inline wins; the CSS state
> silently stops working and the failure is invisible in review.

In practice this means: elements in the `hoverLift()` selector get **no** CSS
`:hover`/`:active` `transform`. They may still transition `border-color`, `background`,
or `opacity` in CSS — those properties have no Motion owner. `.service-card` models this
correctly: CSS owns `border-color`, Motion owns `transform`.

**There is a live violation of this rule in the code today.** `styles.css:318` sets
`.menu-card:hover{transform:translateY(-3px)}` while `animations.js:211` passes
`.menu-card` to `hoverLift()`. Both own `transform`. See [§9](#9-gaps-in-the-system).

---

## 7. Design direction — "Nature Distilled"

**Why this family, and why it was not an arbitrary pick:** the owner chose sand
`#D5B38E` and deep green `#004437` independently, on instinct. Run through
`ui-ux-pro-max`, that pairing lands almost exactly on the **Nature Distilled** style
family. The direction was not selected off a list and applied to the brand — **the brand
independently arrived there, and the style family was identified afterward as the
description of where it already was.** That is why this direction is trustworthy and why
it should not be casually overridden: it is descriptive of the owner's actual taste, not
prescriptive from a tool.

- **Keywords:** muted earthy · sand · terracotta · warmth · organic materials ·
  handmade warmth
- **Effects:** subtle parallax · natural easing (ease-out) · texture overlays · grain ·
  soft shadows
- **Ratings:** WCAG AA · Performance Excellent · Complexity Low · CSS compatibility 10/10

It also fits the product argument in [PRODUCT.md](../PRODUCT.md): warm, local, and
material is what an independent restaurant *is*, and it is the opposite of both
anti-references (cold agency minimalism and interchangeable Squarespace tastefulness).

### Where the direction is already implemented

- **Grain/texture:** `body` carries a `radial-gradient` dot field at `24px 24px`, tinted
  `color-mix(in srgb, var(--charcoal) 5%, transparent)` — a paper tooth over the sand,
  not a flat fill. This is the "organic materials" cue, and it is nearly free.
- **Natural easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad) on every
  `hoverLift` and on the nav logo — decelerating, never linear, never bouncy.
- **Handmade warmth:** the italic-Fraunces figures (§2.1), the dotted leader in
  `.ledger-row .dots`, the dashed `.note-panel` border, the struck-through
  `.exclusion-chip`. These read as ledger, menu board, and margin note — dining-room
  metaphors rendered in CSS.

### Where it is deliberately **not** followed

Two of the family's listed effects are overridden by higher-priority local constraints.
Record this so a future session does not "complete" the direction and regress the system:

- **Soft shadows → rejected.** Superseded by the flat border+fill elevation model
  (§4). Soft shadows on a mid-tone sand ground read as grey smudge.
- **Subtle parallax → not implemented.** Parallax done properly needs scroll-linked
  transforms; done cheaply it costs CLS and INP, which guardrail #1 forbids. Not banned,
  but it must clear the guardrails and the "if a client comments on it, it is too loud"
  bar before it ships.

---

## 8. Standing bans and the category-reflex check

### Bans (DESIGN-WORKFLOW.md — these still apply after the rebrand)

| Ban | Why |
|---|---|
| **No gradient text** | Dates instantly; fails contrast measurement (no single ratio to verify); reads startup-bro, against the tone in PRODUCT.md. |
| **No glassmorphism by default** | The nav's `backdrop-filter:blur(8px)` over a 94% `--cream` ground is the one sanctioned use — it is legibility for a sticky bar, not decoration. Do not extend it to cards or panels. |
| **No identical card grids** | Repeating the same card N times is the strongest single tell of a template. Vary density, treatment, and emphasis (`.price-card.flagship` inverting to charcoal is the model). |
| **No side-stripe borders on cards** | The 2010s dashboard reflex. The house method for marking a card is a **fill + border-color change** (`.service-card:hover{border-color:var(--orange)}`). |

Additional constraints from the same source: images are plain `<img>` with `alt`,
`width`/`height`, and `loading="lazy"` (this is Eleventy — there is no `next/image`);
`prefers-reduced-motion` on every animation; mobile-first, tested at 375/768/1024/1440.
**Client** sites get fonts with character — no Inter, Roboto, or Arial. (Regulars' own
site uses Inter by explicit exception; it is the correct warm-editorial partner for
Fraunces here.)

### The category-reflex check

> **If a variant is predictable from "restaurant website" alone, rework it.**

Run this at the variant level, before writing code, not after. The test: describe the
proposed section in one sentence, then ask whether that sentence would have been
produced by someone told only "make a restaurant website." Full-bleed food hero with
centered white serif over a dark scrim — yes, predictable, rework. A pricing page built
as numbered "doors," or a stats page built as a dotted-leader ledger — no, those came
from the brand's own metaphor set.

This check is the practical defense against both anti-references in PRODUCT.md, and it
is the reason the component library is allowed to grow at all.

---

## 9. Gaps in the system

**Recorded as unknowns rather than invented.** These are not instructions to fix
anything; they are the honest state of the code as of 2026-07-19.

### Defects found while documenting

1. ~~**`one owner per property` is violated on `.menu-card`.**~~ **CLOSED.** CSS now sets
   only `border-color` and `box-shadow` on `.menu-card:hover`; Motion owns transform.
2. ~~**Charcoal is hardcoded in `styles.css:24`**~~ **CLOSED.** Verified by grep: zero
   `rgb()`/`rgba()` literals remain in the stylesheet, and the only hex literal is `#fff`.

### Fixed in the 2026-07-19 craft pass

3. **`.btn-outline`'s border failed WCAG 1.4.11.** It measured **2.23:1** against the page
   field and it is the secondary CTA's *only* visual affordance — a real failure on a real
   control, not a decorative rule. Now `--control-line` at 70% charcoal: **4.34:1** measured
   in-page. (The purely decorative hairlines — `--line`, `--line-soft`, `--line-strong` at
   1.16–1.50:1 — are left alone; they carry no information.)
4. **The banned side-stripe was present.** `.project-card` carried
   `border-top:3px solid var(--orange)` — the 2010s dashboard reflex rotated 90°. Replaced
   with the house fill + border-colour method, matching `.service-card`.
5. **Dead SPA-era CSS removed.** `.page`, `.page.active` and `@keyframes pagefade` had zero
   matching elements in `src/`; navigation has been real page loads for some time.
6. **`.nav` no longer transitions `backdrop-filter`.** Animating a backdrop blur *radius*
   re-blurs the full-width backdrop every frame — the most expensive paint in the file and
   the least perceptible part of the scrolled state. One blur value is held across both
   states; shadow, background and border still transition.
7. **Hero images now carry intrinsic dimensions.** `hero/textforward.njk` and
   `hero/split.njk` emitted the LCP image with no `width`/`height` — the page's only real
   CLS source, contradicting the documented image rule and every other `<img>` in the repo.
   Both now carry the wordmark's intrinsic 900×600, keep `fetchpriority="high"`, and
   correctly do **not** get `loading="lazy"`.
8. **Touch targets.** Every interactive control now clears 44px (`--tap`). Verified across
   10 pages × 4 widths: **zero sub-44px targets, zero horizontal overflow.** Previously
   `.tab-btn` was 32px, `.nav-cta` 39px, and footer links 16–17px.

### Undefined by the code — do not invent

### Undefined by the code — do not invent

3. **No spacing token layer.** No `--space-*` variables. §3 documents observed clustering,
   not an enforced scale. Whether to introduce one is an open decision.
4. **No radius or elevation tokens.** Ten literal radius values; one literal shadow.
5. **The type scale is not modular.** 28 ad-hoc sizes at 0.5px granularity. §2.2 records
   roles as observed. There is no ratio to extrapolate from — a new size cannot be
   "derived," only chosen and added to the table.
6. **Breakpoints do not match the documented test widths.** CSS breaks at 700/760/860;
   DESIGN-WORKFLOW.md says test at 375/768/1024/1440. 768px sits in the gap between the
   760 and 860 breakpoints. Whether the breakpoints or the test widths are wrong is
   undetermined.
7. **`z-index` has exactly two declarations** — `.nav{z-index:50}` (styles.css:20) and
   `.hero-fullbleed-inner{z-index:1}` (styles.css:301). No layering scale exists, and the
   two values are unrelated to each other, so there is nothing to extrapolate from.
8. **The naming mismatch (`cream`/`orange` holding sand/green) is flagged for the owner,
   not resolved.** See §1.2. Its resolution is an owner decision.
