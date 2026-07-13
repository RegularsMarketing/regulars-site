# Regulars — Reusable Client Site Template

A config-driven static site template for independent restaurant/café client sites.
Built with **Eleventy**, edited with **Decap CMS**, deployed on **Cloudflare Pages**.

**A whole new client site = edit one file (`content/site.yaml`) + swap the images in
`src/assets/`.** Nothing else changes.

## How it works

```
content/site.yaml     ← THE single config: brand, colors, fonts, copy, menu, images,
                         AND which component style each section uses. Edit this per client.
src/
  _data/site.js       ← loads content/site.yaml → available to every template as `site`
  _includes/
    base.njk          ← page shell (injects theme colors/fonts, SEO tags, nav + footer)
    components/
      nav.njk  hero.njk  menu.njk  footer.njk   ← dispatchers (pick the variant from config)
      nav/     tabs.njk · topline.njk
      hero/    textforward.njk · fullbleed.njk · split.njk
      menu/    list.njk · grid.njk
      footer/  columns.njk · minimal.njk
  *.njk               ← the 7 pages (structure only; all text comes from the config)
  assets/             ← styles.css, site.js, images (swap the images per client)
admin/                ← Decap CMS (edits content/site.yaml)
eleventy.config.js    ← build config
_site/                ← build output (git-ignored; Cloudflare builds this)
```

The code structure and CMS wiring are **identical for every client and every component
combination** — only `content/site.yaml` and the image files differ.

## Component library (swap via `content/site.yaml` → `components:`)

| Slot | Options | Set with |
|---|---|---|
| Navigation | `tabs` (pill), `topline` (underline) | `components.nav` |
| Hero | `textforward` (logo + texture), `fullbleed` (dark band / photo), `split` (text + image) | `components.hero` |
| Menu layout | `list` (numbered), `grid` (categorized cards) | `components.menu` |
| Footer | `columns` (3-col), `minimal` (single row) | `components.footer` |

`fullbleed` and `split` heroes accept an optional `hero.bg_image` in the config for a real photo.

## Local development

Requires Node 18+. From this folder:

```bash
npm install         # once
npm run dev         # live preview at http://localhost:8080
npm run build       # production build into _site/
```

## Spin up a new client site

1. Copy this repo.
2. Edit `content/site.yaml`: business name, colors, fonts, all copy, `menu_items`, and the
   `components:` choices. Nothing lives outside this file — including the 404 page
   (`pages.not_found`), interface micro-labels (`ui:`), the contact-form fields/subject
   (`pages.contact.form_fields` / `form_subject`), newsletter strings (`pages.ledger.signup_*`),
   robots/sitemap URLs (derived from `business.url`), and `business.lang`.
3. Replace `src/assets/logo-mark.png` and `src/assets/hero-logo.png` with the client's images
   (keep the filenames, or update the paths under `images:` in the config). The `fullbleed`
   and `split` heroes take an optional photo via `pages.home.hero.bg_image`.
4. Set the client's own Formspree IDs under `contact:`.
5. Neutralize Regulars-flavored strings for the client: form placeholders (e.g.
   "Restaurant name" → "Business name"), `form_subject` (e.g. "New inquiry from <domain>"),
   newsletter placeholder/subject, and `menu_items[].badge` (optional freeform tag — leave
   empty for no chip, or use e.g. "New" / "Chef's Pick").
6. Hours (`contact.hours`) render automatically on the contact page and in both footers;
   leave the list empty to hide them.
7. `npm run build`, deploy.

## Deploy to Cloudflare Pages

This is now a **built** site, so the Pages project needs a build step:

- **Framework preset:** None (or Eleventy)
- **Build command:** `npm run build`
- **Build output directory:** `_site`

`_headers` (long-cache for `/assets/*`), `robots.txt`, and `sitemap.xml` are generated into
`_site/` automatically. Update `business.url` in the config if the domain changes.

## Contact forms (Formspree)

The audit form (`/book-a-call/`) and newsletter form (`/ledger/`) post to Formspree. Set the
IDs in `content/site.yaml`:

```yaml
contact:
  formspree_contact_id: xxxxxxxx      # from https://formspree.io
  formspree_newsletter_id: yyyyyyyy
```

## Content editing (Decap CMS)

`/admin/` opens Decap CMS, which edits `content/site.yaml` through the `sveltia-cms-auth`
GitHub OAuth Worker (see `admin/config.yml`). Editors sign in with GitHub and need write
access to this repo only. Every field in the config is exposed in the CMS, organized by
section — including the **Components** dropdowns, so the site can be restyled without code.
