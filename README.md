# Regulars — Static Site

Flat-rate marketing site for independent restaurants and cafés. Plain static HTML/CSS/JS —
no build step required — ready to deploy to **Cloudflare Pages**.

## Structure

```
.
├── index.html              # Home                → /
├── our-story/index.html    # Our Story           → /our-story/
├── services/index.html     # Services            → /services/
├── process/index.html      # Process             → /process/
├── pricing/index.html      # Pricing             → /pricing/
├── ledger/index.html       # The Ledger          → /ledger/
├── book-a-call/index.html  # Contact / Book a Call → /book-a-call/
├── 404.html                # Not-found page
├── assets/
│   ├── styles.css          # All styles (shared)
│   ├── site.js             # Reveal animation + pricing accordion
│   ├── logo-mark.png       # Logo mark (nav/footer/favicon)
│   └── hero-logo.png       # Hero wordmark
├── admin/                  # Decap CMS
│   ├── index.html
│   └── config.yml
├── content/                # CMS-editable content (see "Content / CMS" below)
│   ├── settings.yml        # Contact details + hours
│   ├── menu.yml            # The five services ("the menu")
│   └── pages/*.yml         # Key text + SEO per page
├── _headers                # Cloudflare cache headers for /assets/*
├── robots.txt
└── sitemap.xml
```

Each page has a unique `<title>`, meta description, canonical URL, and Open Graph tags,
written for local restaurant-marketing SEO.

## Local preview

Any static server works. From this folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

(Clean URLs like `/our-story/` resolve to the folder's `index.html`.)

## Deploy to Cloudflare Pages

1. Push this folder to a Git repo (GitHub/GitLab).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (the repo root)
4. Deploy. Then add your custom domain `regularsmarketing.com` under **Custom domains**.

`_headers` gives hashed-forever caching to `/assets/*`. `robots.txt` + `sitemap.xml`
reference `https://regularsmarketing.com` — update those if the domain changes.

## Contact form (Formspree)

The audit form on **/book-a-call/** and the newsletter form on **/ledger/** post to
[Formspree](https://formspree.io). They are wired and working except for the endpoint ID:

1. Create a free Formspree account and a new form.
2. Copy the form's endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. In `book-a-call/index.html`, replace `YOUR_FORM_ID` in the form's `action`.
4. In `ledger/index.html`, replace `YOUR_NEWSLETTER_ID` (a separate Formspree form).

The forms include a hidden `_gotcha` honeypot for spam and a `_subject` line. To show a
custom "thanks" page instead of Formspree's, add `<input type="hidden" name="_next"
value="https://regularsmarketing.com/">`.

## Content / CMS (Decap)

`content/` holds editable content as YAML, and `admin/` is a ready-to-use
[Decap CMS](https://decapcms.org) instance so the menu, hours, and key text/SEO fields can
be edited without touching code.

- **Site Settings → Contact & Hours** → `content/settings.yml`
- **Services Menu** → `content/menu.yml`
- **Pages** → `content/pages/*.yml` (headline, sub-headline, SEO title/description)

**Edit locally right now (no auth):** keep `local_backend: true` in `admin/config.yml`, then:

```bash
npx decap-server           # in one terminal
python3 -m http.server 8080  # in another
# open http://localhost:8080/admin/
```

**In production:** set `repo:` in `admin/config.yml` to your GitHub repo and add a GitHub
OAuth handler (e.g. a Cloudflare Worker OAuth proxy) so editors can log in from
`/admin/`. See the comments at the top of `admin/config.yml`.

> Note: the page HTML currently carries this same copy inline, so it renders with zero
> JavaScript and no build step. The `content/` files are the CMS-managed source of truth;
> wiring a small template/build step to render them into the HTML is a later step and does
> not change how the site deploys today.
