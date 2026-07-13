# Regulars Design Workflow

Adapted from the "Build $10K Websites in Claude Code" guide for this stack:
**Eleventy 3 + Nunjucks + CSS custom properties + Decap CMS + Cloudflare Pages.**
No React, no Tailwind, no Next.js — ever.

Two modes. Know which one you're in before starting.

---

## Business guardrails (from the Mastermind File v4 — these OUTRANK the guide)

- **Standardization is the product** (Failure Mode #7). The full workflow below
  is TEMPLATE MODE work — occasional, bounded, Tier B/C. Never run it per client.
- **Deadlines beat polish** (Failure Mode #1). One bounded quality pass on the
  template, then back to demos/pilots. `/impeccable` must not become
  perfectionism-as-procrastination.
- **The half-day bar** (Mastermind 5.3): a new client/demo site goes live within
  half a day using config + existing variants only. Template Mode must never add
  a per-client manual design step — if it does, that's a regression, not polish.
- **Variety comes from the component library** (Failure Mode #12): 3 heroes ×
  2 menus × 2 navs × 2 footers today. Growing THAT library is how client sites
  stay distinct — never one-off styling.
- **Production deploys are never automated** (Mastermind 7.1 QA gate): build →
  Cloudflare preview URL → mobile check, real form test submission, no broken
  links, quick Lighthouse pass → the human approves the merge. Every deploy,
  template or client, no exceptions — even a small text edit.

---

## TEMPLATE MODE — improving the Regulars template itself

Use when raising design quality or adding new component variants. Paste into
Claude Code:

```
Improve the Regulars template: [GOAL — e.g. "add an animated hero variant"].

1. Context — run /impeccable teach → PRODUCT.md
   - Product: reusable restaurant/café site template; buyers are indie
     restaurant owners; editors use Decap CMS, not code
   - Tone: [warm, confident, local — not corporate, not startup-bro]
   - Anti-references: generic AI restaurant template, Squarespace sameness
   - Register: brand — design IS the product

2. Design system — run ui-ux-pro-max:
   python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py \
     "restaurant cafe [style keywords]" --design-system --persist -p "Regulars"
   → design-system/MASTER.md.
   MASTER.md = DESIGN-TIME source of truth. Its chosen tokens get written
   into content/site.yaml (theme colors/fonts), which stays the RUNTIME
   source of truth. Nothing hardcoded in templates or CSS.

3. Shape — run /impeccable shape. Confirm the brief before writing any code.

4. Research — browse 21st.dev / references per section as INSPIRATION ONLY.
   Their components are React — never paste; rebuild in Nunjucks + CSS.

5. Craft — run /impeccable craft section by section; show each section
   before moving to the next.
   New looks become COMPONENT VARIANTS (e.g. src/_includes/components/hero/animated.njk)
   selectable via components: in site.yaml — never one-off edits that fork
   the template.

6. Animate — npm install motion   (vanilla Motion — NOT framer-motion)
   - Scroll reveals: inView() · hero entrance: staggered · hover/tap
     micro-interactions on buttons and cards
   - Default enter recipe (Jakub Krehel): opacity 0→1, translateY 8px→0,
     blur 4px→0, spring, duration 0.45, bounce 0
   - All variants live in src/assets/animations.js
   Then run /impeccable animate to catch missing motion.
   Then run design-motion-principles to audit (Jakub primary, Jhey secondary).

7. QA — run /impeccable polish across templates/CSS/JS, then
   /impeccable audit (accessibility, performance, responsive), then a
   Lighthouse pass.

Hard constraints:
- content/site.yaml stays THE single runtime config (Decap-editable).
  Design work touches only templates, CSS, and JS.
- Every new site.yaml field or component variant is ALSO added to
  admin/config.yml so clients can use it in Decap.
- Variants must work for EVERY client via config — never styled around one.
- Category-reflex check at the variant level: if a variant is predictable
  from "restaurant website" alone, rework it.
- Bans: gradient text, glassmorphism by default, identical card grids,
  side-stripe borders on cards.
- Images: plain <img> with alt, width/height, loading="lazy"
  (this is Eleventy — there is no next/image).
- prefers-reduced-motion respected on every animation.
- CLIENT sites: no Inter, Roboto, or Arial — fonts with character, set
  per client in site.yaml. EXCEPTION — regularsmarketing.com itself uses
  the LOCKED Regulars brand (Mastermind §2): cream #FAF6EF, charcoal
  #2B2926, burnt orange #C4551F, Fraunces display serif + Inter body.
  The brand kit outranks this workflow; no skill may restyle it.
- Mobile-first, tested at 375 / 768 / 1024 / 1440.
```

---

## CLIENT MODE — spinning up a new client site (NO CODE)

Per README: a new client site = one file + images. No skills required.

1. Copy this repo.
2. Optional: `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py
   "[client cuisine/vibe keywords]"` to pick colors, fonts, and component
   combos with intent.
3. Edit `content/site.yaml` only: business info, copy, menu_items, theme
   colors/fonts, `components:` picks.
4. Swap images in `src/assets/`. Set Formspree IDs under `contact:`.
5. `npm run build` → push to a Cloudflare **preview URL** → run the 7.1 QA
   gate (mobile view, real form test, no broken links, Lighthouse) → approve
   → production on the client's domain.

Checkpoint (Mastermind 5.3): the whole thing fits in half a day. If it
doesn't, the leak is in the template/config separation — fix the template,
not your speed.

If a client needs a look no variant offers → switch to TEMPLATE MODE and
build it as a new variant first, then come back and select it in config.

---

## Installed tooling this depends on (all in ~/.claude/skills/)

impeccable · ui-ux-pro-max (+ design, design-system, ui-styling, brand,
banner-design, slides) · frontend-design · design-motion-principles

Runtime: Node 18+ (nvm), Python 3 (system). No pip packages, no other
connectors. 21st.dev MCP optional — inspiration only.
