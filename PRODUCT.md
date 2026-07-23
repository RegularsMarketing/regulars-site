# PRODUCT.md — context brief

The standing answer to "what are we building and for whom." Referenced by
[DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md) TEMPLATE MODE step 1. Read this before any
design work so the brief is not re-derived (and re-invented) every session.

Companion doc: [design-system/MASTER.md](design-system/MASTER.md) — the design-time
source of truth for tokens, type, motion, and variants.

---

## The product

A **reusable, config-driven restaurant/café website template**. Not a website. Not an
agency deliverable. A template that gets cloned.

- **Buyers** are owner-operators of independent, single-location restaurants and cafés.
  They are doing five jobs at once and doing marketing after a double shift. They think
  in covers, regulars, and slow Tuesdays — not in funnels, conversion rates, or brand
  systems. They are skeptical of agencies, usually because they have been burned.
- **Editors are not developers.** Content is edited through Decap CMS at `/admin/`, by
  the owner or whoever they hand the password to. If a thing cannot be changed from
  Decap, for that user it cannot be changed at all.
- **Deliberately excluded:** chains, franchises, multi-location groups. See
  `../Knowledge/Regulars/brand-foundation.md` for the full anti-audience.

### What that implies for design

Three consequences that should decide arguments:

1. **Every design decision must survive being cloned.** A choice that looks great for
   one restaurant and breaks for the next is a bug, not a flourish. Design for the
   twentieth clone, not the first.
2. **Anything an editor cannot reach does not exist.** New field or variant → it goes
   into `content/site.yaml` *and* `admin/config.yml`, or it shipped broken.
3. **The half-day bar governs.** A new client site goes live in half a day using config
   and existing variants only. Any design step that requires per-client hand-styling is
   a regression in the product, however good it looks.

---

## Tone

**Warm, confident, local.** A small business talking to another small business as
equals.

Not corporate — no "solutions," "platforms," "leveraging," passive voice, or the
corporate we. Not startup-bro — no growth-hacking, no manufactured urgency, no
countdown timers, no "crushing it."

The visual register has to carry the same voice the copy does: plain-spoken, receipts
over promises, restaurant-native metaphors, transparent to a fault. The full voice
table (traits, do/don't, the eleven things we would never say) lives in
`../Knowledge/Regulars/brand-foundation.md` — that file is the voice authority; this
section only records what the voice demands of the *design*.

Design-side translation:

| Voice trait | What it looks like visually |
|---|---|
| Plain-spoken | Real hierarchy, no decoration standing in for structure. Prices shown, not teased. |
| Receipts, not promises | Room for a source line under every number (`.stat-card .ssrc` exists for exactly this). |
| Restaurant-native | Menu, ledger, doors, stamps — the layout metaphors come from the dining room. |
| Transparent to a fault | Pricing is a full designed page, not a gated CTA. |
| Small and human | Warm ground, generous type, no enterprise-SaaS chrome. |

---

## Anti-references

What we are actively steering away from. These are the failure states.

- **The generic AI restaurant template.** Full-bleed dark food photo, centered white
  serif headline, three icon-topped feature cards, "About Us / Our Menu / Contact,"
  a script-font accent. If a section could have been generated from the prompt
  "restaurant website" alone, it is this, and it gets reworked.
- **Squarespace sameness.** Technically competent, tasteful, and utterly
  interchangeable. Every business rendered in the same eight sections with different
  photos. The tell is that swapping the logo would change nothing.
- **Agency-site coldness.** Grey-on-white, stock gradient, glassmorphic hero,
  "Solutions" nav item. Reads as a vendor, not a neighbor.

The category-reflex check exists to catch all three: *if a variant is predictable from
"restaurant website" alone, rework it.*

---

## Register

**Brand.** The design **is** the product.

This is not a UI where visual polish is a nice-to-have wrapped around the real value.
The look, and the fact that it does not look like everyone else's, is the thing being
sold. A client is buying "my site does not look like a template" from a template. That
paradox is resolved in exactly one place — the component variant library — and nowhere
else. Variety comes from growing that library, never from styling around one client.

---

## The dual identity

**This one repo is both the template and Regulars' own live marketing site**
(regularsmarketing.com, deployed from this repo as `RegularsMktg/regulars-template`).

That is the architecture, not a mess to clean up:

- Templates, CSS, and JS hold **structure only**. All branded content — including the
  Regulars services, pricing, and Ledger copy — lives in `content/site.yaml` as config.
- **Regulars' site is the first instance of the template, eating its own dog food.** If
  the template cannot express Regulars' own site through config alone, the template is
  not finished. Regulars' site is the standing proof and the standing test case.
- A client site is a **copy of this repo** with a different `site.yaml`, different
  images, and a repointed `admin/config.yml` — that repoint is the one code edit a
  clean clone requires, and skipping it sends the client's CMS writes back into this
  repo.
- Code changes here ship to Regulars' site **and** every future client copy. Keep them
  generic and config-driven. Nothing Regulars-specific belongs in code.

So when source pages look like Regulars' branded content: correct and intended. **The
brand lives in the config, not the code.**

One consequence worth stating plainly: Regulars' own palette and font pairing are
LOCKED (owner-directed changes excepted — see MASTER.md), while client sites must each
get a *distinct* palette, font pairing, and component combo. No two clients share a
recipe, and no client reuses Regulars' recipe.
