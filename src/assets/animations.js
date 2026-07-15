/* =========================================================================
   Regulars template — reusable Motion animation utilities
   =========================================================================
   Library: Motion (motion.dev) vanilla JS build, self-hosted at
   /assets/vendor/motion.js (copied from node_modules by eleventy.config.js).
   It exposes a global `Motion` object — no bundler, no React.

   Load order in base.njk (all deferred, order matters):
     1. /assets/vendor/motion.js   ← the library (window.Motion)
     2. /assets/animations.js      ← this file
     3. /assets/site.js            ← non-animation site behaviour

   GUARDRAILS (apply to every function here — do not break these):
   - Only transform / opacity / filter are ever animated. Never width,
     height, top, left, margin, padding — those cause layout reflow and
     hurt CLS/INP.
   - Every animation respects prefers-reduced-motion: with it on, content
     is simply shown with no motion. Nothing is hidden behind an animation.
   - Durations stay short (150–400ms interactions, ≤550ms entrances),
     springs with bounce 0 — polished, never bouncy.

   APPLYING TO A NEW CLIENT SITE: nothing to do. init() at the bottom of
   this file auto-wires the standard template selectors on every page.
   Only touch init() if a new component variant needs animating.
   ========================================================================= */
(function () {
  'use strict';

  // If the vendor bundle failed to load, do nothing — the site is fully
  // usable without animations (they are decorative, never functional).
  if (!window.Motion) return;

  var animate = window.Motion.animate;
  var inView = window.Motion.inView;
  var hover = window.Motion.hover;
  var press = window.Motion.press;
  var stagger = window.Motion.stagger;

  // One check, used by every function. When true, scroll/hero reveals are
  // skipped entirely (content just shows), hover/press feedback is skipped,
  // and page transitions are left off.
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // House enter recipe (Jakub Krehel): fade + small rise + blur-to-sharp,
  // on a bounce-0 spring. Blur makes elements "materialize" rather than
  // just fade — more physical, still subtle.
  var ENTER_KEYFRAMES = {
    opacity: [0, 1],
    y: [12, 0],
    filter: ['blur(4px)', 'blur(0px)']
  };
  var ENTER_SPRING = { type: 'spring', duration: 0.45, bounce: 0 };

  /* -----------------------------------------------------------------------
     scrollFadeIn(selector)
     Fades + slides + sharpens each matched element the first time it
     scrolls into view. Use on sections, cards, and images.
     Call:  scrollFadeIn('main .reveal')
     Notes: elements are hidden by THIS script (not CSS), so with JS off or
     the vendor bundle missing, everything stays visible. Fires once per
     element — reveals don't replay on every scroll past.
     ----------------------------------------------------------------------- */
  function scrollFadeIn(selector) {
    if (REDUCED) return;
    var els = Array.from(document.querySelectorAll(selector));
    els.forEach(function (el) {
      el.style.opacity = '0'; // pre-hide only once we know we can animate
      inView(el, function () {
        animate(el, ENTER_KEYFRAMES, ENTER_SPRING);
        // returning nothing = element stops being observed after first enter
      }, { amount: 0.2 });
    });
  }

  /* -----------------------------------------------------------------------
     hoverLift(selector)
     Subtle lift on hover + scale-down press feedback for buttons, menu
     items, and cards. Transform-only, so no layout shift.
     Call:  hoverLift('.btn, .service-card, .menu-card')
     Notes: Motion's hover() ignores emulated hover events on touch
     devices; press() also handles keyboard activation. Because Motion
     writes inline transforms, do NOT also give these elements CSS
     :hover/:active transforms — one owner per property.
     ----------------------------------------------------------------------- */
  function hoverLift(selector) {
    if (REDUCED) return;
    var els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;

    hover(els, function (el) {
      animate(el, { y: -3 }, { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] });
      return function () {
        animate(el, { y: 0 }, { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] });
      };
    });

    // Press feedback only makes sense on things you can activate.
    els.forEach(function (el) {
      if (!el.matches('a, button, [role="button"]')) return;
      press(el, function (target) {
        animate(target, { scale: 0.97 }, { duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] });
        return function () {
          animate(target, { scale: 1 }, { duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] });
        };
      });
    });
  }

  /* -----------------------------------------------------------------------
     heroLoadIn(selector)
     Staggered entrance for the hero on page load: logo/media, eyebrow,
     headline, subhead, CTAs rise in one after another (90ms apart).
     Call:  heroLoadIn('.hero, .hero-fullbleed, .hero-split')
     Notes: works with all three hero variants — it animates the standard
     hero pieces it finds inside the matched section. A new hero variant
     only needs its pieces to use these classes (or extend ITEMS below).
     ----------------------------------------------------------------------- */
  function heroLoadIn(selector) {
    if (REDUCED) return;
    var heroEl = document.querySelector(selector);
    if (!heroEl) return;
    var ITEMS = '.hero-logo, .hero-split-media, .eyebrow, h1, .sub, .hero-actions';
    var items = Array.from(heroEl.querySelectorAll(ITEMS));
    if (!items.length) return;
    items.forEach(function (el) { el.style.opacity = '0'; });
    animate(
      items,
      ENTER_KEYFRAMES,
      { type: 'spring', duration: 0.55, bounce: 0, delay: stagger(0.09) }
    );
  }

  /* -----------------------------------------------------------------------
     pageTransition()
     Cross-page transition using the View Transitions API (MPA form): the
     old page fades out, the new one fades/rises in — fast, because page
     navigation is a high-frequency action.
     Call:  pageTransition()   (once per page; init() does this)
     Fallback: browsers without cross-document View Transitions ignore the
     @view-transition rule entirely and navigate instantly — no polyfill,
     no broken state. Reduced motion keeps instant navigation too.
     ----------------------------------------------------------------------- */
  function pageTransition() {
    if (REDUCED) return;
    var style = document.createElement('style');
    style.textContent =
      '@view-transition { navigation: auto; }' +
      '::view-transition-old(root) { animation: 150ms cubic-bezier(0.4, 0, 1, 1) both rm-page-out; }' +
      '::view-transition-new(root) { animation: 200ms cubic-bezier(0, 0, 0.2, 1) both rm-page-in; }' +
      '@keyframes rm-page-out { to { opacity: 0; } }' +
      '@keyframes rm-page-in { from { opacity: 0; transform: translateY(6px); } }';
    document.head.appendChild(style);
  }

  /* -----------------------------------------------------------------------
     stickyNavShrink(selector)
     Past a small scroll threshold the nav gains a shadow, a stronger
     backdrop blur, and the logo scales down slightly (transform only —
     the nav's box never changes size, so zero layout shift). All the
     visuals live in CSS under .nav--scrolled; this just flips the class,
     with hysteresis so it doesn't flicker at the boundary.
     Call:  stickyNavShrink('.nav')
     ----------------------------------------------------------------------- */
  function stickyNavShrink(selector, threshold) {
    var nav = document.querySelector(selector);
    if (!nav) return;
    var ON = (threshold || 24) + 8;
    var OFF = (threshold || 24) - 8;
    var shrunk = false;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      if (!shrunk && y > ON) {
        shrunk = true;
        nav.classList.add('nav--scrolled');
      } else if (shrunk && y < OFF) {
        shrunk = false;
        nav.classList.remove('nav--scrolled');
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* -----------------------------------------------------------------------
     init() — standard wiring for every page of the template.
     Runs automatically. Every call no-ops if its selector matches nothing,
     so this is safe on all pages and all component variants.
     ----------------------------------------------------------------------- */
  function init() {
    var HEROES = '.hero, .hero-fullbleed, .hero-split';

    heroLoadIn(HEROES);

    // Reveal sections on scroll — but not .reveal elements inside a hero,
    // which heroLoadIn already owns.
    try {
      scrollFadeIn('main .reveal:not(:is(' + HEROES + ') *, :is(' + HEROES + '))');
    } catch (e) {
      scrollFadeIn('main .reveal'); // ancient-browser fallback
    }

    hoverLift('.btn, .service-card, .menu-card');
    stickyNavShrink('.nav');
    pageTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed for one-off use on custom pages (call from a page's script):
  window.RegularsMotion = {
    scrollFadeIn: scrollFadeIn,
    hoverLift: hoverLift,
    heroLoadIn: heroLoadIn,
    pageTransition: pageTransition,
    stickyNavShrink: stickyNavShrink
  };
})();
