# Regulars Site Template: Claude Instructions

Config-driven static site template for restaurant/café client sites.
Stack: **Eleventy 3 + Nunjucks + CSS custom properties + Decap CMS +
Cloudflare Pages.** Never React, Tailwind, Next.js, or framer-motion
(vanilla `motion` is the animation library).

## One repo, two hats (read before anything looks contradictory)

This repo is **both** the canonical client-site template **and** the live
instance of Regulars' own marketing site (regularsmarketing.com, deployed
from this repo, `regulars-template` in the RegularsMktg org). That's the
architecture:

- Templates/CSS/JS hold **structure only**. All branded content, including
  the Regulars services/pricing/ledger copy in `content/site.yaml`, is
  config. Regulars' site is simply the **first instance** of the template,
  eating its own dog food.
- A client site = a **copy of this repo** with a different `site.yaml` +
  images + a repointed `admin/config.yml` (CLIENT MODE). Client content never
  goes into THIS repo's `site.yaml`. That file is Regulars' own content, on
  the LOCKED brand. The `admin/config.yml` repoint is what enforces that: an
  un-repointed copy's CMS commits the client's edits back here.
- Code changes made here ship to Regulars' site AND every future client
  copy. Keep them generic and config-driven, never Regulars-specific.
- Optional features (e.g. the `/catering` page via `pages.catering.enabled`)
  default **OFF** in this repo and get switched on per client.

So if the source pages "look like Regulars' branded content": correct and
intended. The brand lives in the config.

## The rule that governs everything

**For ANY design work, client site build, redesign, or "make this look
better" request: follow [DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md). Read it
first, before writing code.** It defines two modes:

- **CLIENT MODE** (new client site): edit `content/site.yaml` + swap images
  in `src/assets/`. No template code changes: no Nunjucks, no CSS, no JS.
  **One config file outside site.yaml must change on every copy, both tiers:
  `admin/config.yml`.** Its `backend.repo` (line 9) is hardcoded to
  `RegularsMktg/regulars-template` and must be repointed at the new client
  repo. Left unchanged, that client's `/admin/` writes their content into the
  template repo and needs write access to it, and §5.5 keeps that template
  Company's exclusive property.
  **Which account the repo lives in forks by tier:** a Door Two **Website
  Launch** repo is the client's own under §5.2(a); a **Full House** repo stays
  with Regulars for the duration under §5.2(b) and is never created under the
  client's account. Procedure and clause detail: [README.md](README.md) steps 1-2.
  That is the whole exception. Nothing else in the repo is edited.
  The half-day bar covers this config pass alone; full C8 client onboarding is
  a much larger budget (`Knowledge/Regulars/feasibility-2026-07-19.md`).
- **TEMPLATE MODE** (improving the template): new looks become component
  variants selectable via `components:` in site.yaml, never one-off edits.
  Uses the impeccable / ui-ux-pro-max / design-motion-principles skills.

If a request mixes both ("build client X a site with a new hero style"),
do the Template Mode variant first, then the Client Mode config.

## Hard rules (from the Mastermind File v4; outrank everything)

- `content/site.yaml` is the single runtime source of truth; all copy,
  menus, hours, colors, fonts live there (Decap-editable). Templates hold
  structure only.
- Every new site.yaml field or component variant must ALSO be added to
  `admin/config.yml` (Decap parity); otherwise clients can't edit it.
- Standardization is the product: per-client work is config, never code.
- Deploys are never automated: build → Cloudflare preview → QA (mobile,
  real form test, links, Lighthouse) → the human approves production.
- Client sites: distinctive fonts (no Inter/Roboto/Arial), unique
  palette + component combo per client; no two clients share a recipe.
- Regulars' own brand is LOCKED and exempt from design workflows:
  sand #D5B38E (page ground) · sand-2 #E3CBAF · charcoal #2B2926 ·
  evergreen #004437 · Helvetica everywhere (system stack, no webfont).
  Owner-directed change 2026-07-23; what "locked" means and the naming
  trap live in DESIGN-WORKFLOW.md.

## Commands

- `npm run dev`: live preview at localhost:8080
- `npm run build`: production build into `_site/`
- Node via nvm (`.nvmrc` = 22); Eleventy 3 is ESM-only.

## Context docs

- [DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md): the design/build process (both modes)
- [README.md](README.md): architecture, component library, deploy setup
- `../Knowledge/Foundation/`: business docs (Mastermind v4, launch checklist,
  stack playbook, `regulars-ghl-master-snapshot.md`); the PDFs there need
  pypdf to extract
