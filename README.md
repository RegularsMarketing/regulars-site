# Regulars: Reusable Client Site Template

A config-driven static site template for independent restaurant/café client sites.
Built with **Eleventy**, edited with **Decap CMS**, deployed on **Cloudflare Pages**.

> **Note:** this repo wears two hats. It's the canonical template, and it's also the
> live instance of Regulars' own marketing site (regularsmarketing.com). The content
> in `content/site.yaml` is Regulars' own. Client sites are **copies** of this repo
> with their own `site.yaml` + images.

**A whole new client site = edit one file (`content/site.yaml`), swap the images in
`src/assets/`, and repoint `admin/config.yml` at the new client repo.** No template
code, no CSS, no Nunjucks.

> **The `admin/config.yml` repoint is not optional, on either tier.** `backend.repo`
> (line 9 of that file) is hardcoded to `RegularsMktg/regulars-template`. A copy that ships
> with it unchanged has a `/admin/` that writes the **client's** content edits into the
> Regulars template repo, and it only works at all if the client's GitHub account holds
> write access to that template. §5.5 keeps the underlying template Company's exclusive
> property, and it is the master every future client is cloned from; write access to it
> would give one restaurant owner commit rights over every future client's starting point.
> Repoint it before `/admin/` is handed to anyone. See steps 1 and 2.

## How it works

```
content/site.yaml     ← THE single config: brand, colors, fonts, copy, menu, images,
                         AND which component style each section uses. Edit this per client.
src/
  _data/site.js       ← loads content/site.yaml → available to every template as `site`
  _includes/
    base.njk          ← page shell (injects theme colors/fonts, SEO tags, nav + footer)
    components/
      nav.njk  hero.njk  menu.njk  footer.njk  proof.njk
                        ← dispatchers (pick the variant from config)
      nav/     tabs.njk · topline.njk · collapse.njk
      hero/    textforward.njk · fullbleed.njk · split.njk · statement.njk ·
               marquee.njk · ticket.njk
      menu/    list.njk · grid.njk · tiered.njk · board.njk
      footer/  columns.njk · minimal.njk · ledger.njk
      proof/   off.njk · statement.njk
  *.njk               ← the pages (structure only; all text comes from the config).
                         catering.njk is OPTIONAL; builds /catering/ only when
                         pages.catering.enabled is true in the config.
  assets/             ← styles.css, site.js, images (swap the images per client)
admin/                ← Decap CMS (edits content/site.yaml). config.yml names the repo
                         the CMS commits to; per-client, must be repointed on every copy.
eleventy.config.js    ← build config
_site/                ← build output (git-ignored; Cloudflare builds this)
```

The code structure is **identical for every client and every component combination**.
The only per-client differences are `content/site.yaml`, the image files, and
`backend.repo` in `admin/config.yml`.

## Component library (swap via `content/site.yaml` → `components:`)

| Slot | Options | Set with |
|---|---|---|
| Navigation | `tabs` (pill row), `topline` (underlined links), `collapse` (folds into one control below 860px; pick this at five or more links) | `components.nav` |
| Hero | `textforward` (logo + copy), `fullbleed` (photo/colour band), `split` (copy beside an image), `statement` (text-first, no logo in the fold), `marquee` (the name set large on an accent band), `ticket` (perforated paper dupe, hard left) | `components.hero` |
| Menu layout | `list` (numbered rows), `grid` (cards by category), `tiered` (ruled rows, badge in its own column), `board` (two-column letter board with dotted leaders and prices) | `components.menu` |
| Footer | `columns` (3-col), `minimal` (single row), `ledger` (hours and contact as dotted-leader rows on the accent) | `components.footer` |
| Pre-launch proof | `off`, `statement` (says plainly why there are no testimonials yet) | `components.proof` |

`fullbleed` and `split` heroes accept an optional `hero.bg_image` in the config for a real photo.

## Local development

Node is pinned to **22** by `.nvmrc` (`nvm use`). Eleventy is `^3.1.2` and ESM-only, so the
package is `"type": "module"`. From this folder:

```bash
npm install         # once
npm run dev         # live preview at http://localhost:8080
npm run build       # production build into _site/
npm run clean       # rm -rf _site
```

Run `npm run clean` before a release build on a client copy. Assets are passthrough-copied,
so a file deleted from `src/assets/` stays behind in an existing `_site/`, and a stale
Regulars logo can survive into a client's build that way.

## Spin up a new client site

1. **Copy this repo into a new repo, in the account that client's tier requires.** Two
   engagements produce a site, and they own it differently. Foundation and Growth include no
   website at all, and a Full House site is not built until RUNBOOK **C8**.
   - **Website Launch (Door Two): the client's own GitHub account.** §5.2(a) delivers all
     website code, files, and repository access to Client, and they become Client's property
     on final payment and project delivery.
   - **Full House (Door Three retainer): Regulars' own GitHub. Never the client's account.**
     §5.2(b) keeps website code and hosting managed by Company for the duration of the active
     Agreement and bars transfer to Client during the engagement. Creating the repo under the
     client's account hands over exactly what that clause withholds. At exit, §5.2(c) runs a
     30-day offboarding period billed at Company's then-current Care Plan rate, prorated, and
     ends in a static export.
2. **Repoint the CMS at the new repo. Required on both tiers, before anything touches
   `/admin/`.** In `admin/config.yml`, change `backend.repo` (line 9) from
   `RegularsMktg/regulars-template` to the new `owner/repo`, and confirm `backend.branch`
   matches its default branch. This is the one file outside `content/site.yaml` that every
   client copy must change.
   - On a **Website Launch**, the target is the client's own repo.
   - On **Full House**, the target is the Regulars-held client repo. The repoint still
     matters here: left pointing at the template, that client's edits commit into the
     template and their editor account needs write access to it.

   Then confirm the `sveltia-cms-auth` Worker at `backend.base_url` authorizes the new repo
   before handing `/admin/` over.
3. Edit `content/site.yaml`: business name, colors, fonts, all copy, `menu_items`, and the
   `components:` choices. Nothing lives outside this file, including the 404 page
   (`pages.not_found`), interface micro-labels (`ui:`), the contact-form fields/subject
   (`pages.contact.form_fields` / `form_subject`), newsletter strings (`pages.ledger.signup_*`),
   robots/sitemap URLs (derived from `business.url`), and `business.lang`.
4. Swap the brand images. There are no fixed image filenames: the templates read
   `images.logo_mark` and `images.hero_logo` from `content/site.yaml`. In this repo those
   point at `/assets/logo-mark.webp` and `/assets/logo-wordmark.webp`, the web assets. The
   full-resolution masters those were exported from live in `src/assets/brand/` as
   `logo-mark.png` and `logo-wordmark.png`, and nothing renders them. Either drop the
   client's files into `src/assets/` and set those two paths, or upload them through the Logo
   mark / Hero logo fields in `/admin/`, which writes the paths for you (`media_folder` is
   `src/assets`, so the config stores the public `/assets/...` form). Delete every Regulars
   image the client is replacing, `src/assets/brand/` included: the whole of `src/assets/` is
   passthrough-copied into the build, so anything left there is served publicly on the
   client's domain. The `fullbleed` and `split` heroes take an optional photo via
   `pages.home.hero.bg_image`.
5. Set the client's own Formspree IDs under `contact:`.
6. Neutralize Regulars-flavored strings for the client: form placeholders (e.g.
   "Restaurant name" → "Business name"), `form_subject` (e.g. "New inquiry from <domain>"),
   newsletter placeholder/subject, and `menu_items[].badge` (optional freeform tag; leave
   empty for no chip, or use e.g. "New" / "Chef's Pick").
7. Hours (`contact.hours`) render automatically on the contact page and in both footers;
   leave the list empty to hide them.
8. **Catering & events page (part of the standard offer; don't skip it):** set
   `pages.catering.enabled: true`, edit the copy/packages/FAQs, and paste the client's
   GHL catering-form embed into `pages.catering.form_embed` (submissions then fire the
   Speed-to-Lead workflow; see §6, "Catering & Events Engine", in
   `../Knowledge/Foundation/regulars-ghl-master-snapshot.md`). Until the
   GHL form exists, leave `form_embed` empty and the page falls back to a styled
   Formspree form using `pages.catering.form_fields`. Add a "Catering" link to
   `nav.links` and the footer. The page auto-suppresses the chat widget (carrier rule:
   no SMS-consent widget on phone-collecting form pages).
9. `npm run build`, deploy.

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
GitHub OAuth Worker. Every field in the config is exposed in the CMS, organized by
section, including the **Components** dropdowns, so the site can be restyled without code.

The CMS commits to whatever `backend.repo` in `admin/config.yml` names, which in this repo
is `RegularsMktg/regulars-template`. Editors sign in with GitHub and need write access to
**that** repo, so on a client copy the pointer and the access grant must both move to the
new repo together (steps 1 and 2 of the clone procedure). Anyone given editor access to a
copy that still names the template has been given write access to the template.

On a **Website Launch** the editor is the client, on their own repo, and that is the end of
it. On **Full House** the repo is Regulars-held, so a client editor means granting a client
GitHub identity write access to a Regulars-owned repo. That grant has never been run
end to end; treat the first one as a test, and see `Knowledge/Regulars/feasibility-2026-07-19.md`
(matrix row 9) before promising a client CMS access on that tier.
