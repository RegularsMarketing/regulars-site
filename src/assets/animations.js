/* =========================================================================
   Regulars template: reusable Motion animation utilities
   =========================================================================
   Library: Motion (motion.dev) vanilla JS build, self-hosted at
   /assets/vendor/motion.js (copied from node_modules by eleventy.config.js).
   It exposes a global `Motion` object. No bundler, no React.

   Load order in base.njk (all deferred, order matters):
     1. /assets/vendor/motion.js   ← the library (window.Motion)
     2. /assets/animations.js      ← this file
     3. /assets/site.js            ← non-animation site behaviour

   THE GUARDRAILS (apply to every function here; do not break these):

   1. NEVER ANIMATE ANYTHING THAT TRIGGERS LAYOUT. Width, height, top, left,
      margin and padding reflow the page and wreck CLS/INP. Transform,
      opacity and filter are always safe. Paint-only properties
      (box-shadow, background, border-color, text-decoration-color) are
      permitted and styles.css depends on them in nine places; they repaint
      without reflowing. The old wording of this rule said "transform /
      opacity / filter only", which the stylesheet violated nine times in its
      own codebase, so the rule taught readers to skip rules.
   2. prefers-reduced-motion is respected everywhere. With it on, content is
      simply shown with no motion. Nothing is ever hidden behind an
      animation. Elements are hidden BY THIS SCRIPT, never by CSS, so a
      visitor with JS off or a failed vendor bundle sees everything.
      The media query is re-read live (see REDUCED below), so toggling the OS
      setting mid-session takes effect without a reload.
   3. SHORT DURATIONS. 150-250ms for interactions, <=550ms for entrances,
      springs with bounce 0. Two named exceptions, both because the motion
      has to feel immediate: press-down runs at 120ms and exits may run at
      140ms. Anything else under 150ms is a bug. Subtle production polish.
      If a client comments on an animation, it is too loud.

   ONE OWNER PER PROPERTY. Two cases, both real:
     · CSS vs Motion. If Motion animates an element's transform, that element
       gets no CSS :hover/:active transform. Motion writes inline styles,
       inline wins, and the CSS state silently stops working.
     · Motion vs Motion. Two utilities must never animate the same property
       on the same element. `.service-card` used to be both a staggerReveal
       child (animating y) and a hoverLift target (also animating y), so
       hovering a card mid-entrance interrupted the entrance. Cards that do
       nothing when clicked no longer get the lift, which dissolved that
       conflict; see hoverLift() for the reasoning.

   MOTION CARRIES HIERARCHY. There are three enter tiers. One recipe applied
   to a selector list is what the audit found: 8 reveals on the home page and
   7 on pricing all running the identical enter, so a 1px divider entered
   exactly like the signature ledger panel and motion carried zero
   information about what mattered. See TIERS below.

   THE UTILITIES: scrollFadeIn · staggerReveal · ledgerTally · hoverLift ·
   pressFeedback · heroLoadIn · accordion · submitFeedback · parallax ·
   pageTransition · stickyNavShrink. All are exposed on window.RegularsMotion
   for one-off use on custom pages.

   APPLYING TO A NEW CLIENT SITE: nothing to do. init() at the bottom of this
   file auto-wires the standard template selectors on every page. Only touch
   init() if a new component variant needs animating; the checklist for that
   is in PLAYBOOK-animation-system.md.
   ========================================================================= */
(function () {
  'use strict';

  // If the vendor bundle failed to load, do nothing. The site is fully usable
  // without animations. They are decorative; the site never depends on them,
  // and nothing is hidden until this file decides to hide it.
  if (!window.Motion) return;

  var animate = window.Motion.animate;
  var inView = window.Motion.inView;
  var hover = window.Motion.hover;
  var press = window.Motion.press;
  var stagger = window.Motion.stagger;
  var scroll = window.Motion.scroll;

  var ROOT = document.documentElement;

  /* -----------------------------------------------------------------------
     REDUCED, re-read live on every change.
     Previously this was a single boolean captured at load, so a visitor who
     turned the OS setting on mid-session kept every animation until they
     reloaded. The query object is kept and a change listener settles
     everything that is running (see watchReducedMotion at the bottom).
     ----------------------------------------------------------------------- */
  var REDUCE_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCED = REDUCE_QUERY.matches;

  /* -----------------------------------------------------------------------
     MOTION LEVEL: `full` (default) or `quiet`, read from a data-motion
     attribute on <html> or <body>.

     `quiet` runs opacity-only entrances with no rise, no blur, no stagger,
     no ledger draw, no parallax and no cross-page transition. It exists for
     a client whose photography is the point, or an owner who simply wants a
     calm site, and it is what lets the menu grid's stagger be a config
     decision without a second menu variant.

     CONFIG WIRING IS NOT DONE YET. This reads the attribute defensively and
     defaults to `full`, so it costs nothing while unwired. Shipping it needs
     three one-line changes outside this file, listed in
     PLAYBOOK-animation-system.md under "Pending config wiring".
     ----------------------------------------------------------------------- */
  function motionLevel() {
    var v = ROOT.getAttribute('data-motion') ||
      (document.body && document.body.getAttribute('data-motion'));
    return v === 'quiet' ? 'quiet' : 'full';
  }
  var QUIET_SITE = motionLevel() === 'quiet';

  /* -----------------------------------------------------------------------
     SHARED CURVES. --ease-out in styles.css holds the same numbers, so CSS
     transitions and Motion animations move on one curve.
     ----------------------------------------------------------------------- */
  var EASE_OUT = [0.25, 0.46, 0.45, 0.94];
  var EASE_IN = [0.4, 0, 1, 1];

  /* -----------------------------------------------------------------------
     THE THREE ENTER TIERS.

     anchor  the one element in a section that holds the section's meaning:
             the ledger panel, the CTA panel, the story hero, the contact
             panel. Blur-to-sharp lives HERE ONLY, where it reads as material
             arriving.
     group   a container whose children deal out. The step is computed so the
             whole sequence is capped no matter how many items a client's
             config produces.
     quiet   everything else. Opacity alone. No rise, no blur.

     Blur is off every other tier on purpose. A 4px blur on a Fraunces
     headline at the moment a reader arrives costs legibility for a
     decorative gain, and blur-everywhere entrances are one of the three
     named tells of generated motion.
     ----------------------------------------------------------------------- */
  var TIERS = {
    anchor: {
      keyframes: { opacity: [0, 1], y: [16, 0], filter: ['blur(6px)', 'blur(0px)'] },
      options: { type: 'spring', duration: 0.5, bounce: 0 }
    },
    group: {
      keyframes: { opacity: [0, 1], y: [12, 0] },
      options: { type: 'spring', duration: 0.4, bounce: 0 }
    },
    quiet: {
      keyframes: { opacity: [0, 1] },
      options: { duration: 0.22, ease: EASE_OUT }
    }
  };

  /* Elements promoted to the anchor tier. `.reveal--anchor` is the explicit
     opt-in for a new component; the rest is the default map for the markup
     the template ships, so today's pages get hierarchy with no template
     edit. A client build adds a class here or in its own markup. */
  var ANCHOR_SELECTOR = '.reveal--anchor, .ledger-panel, .cta-panel, .story-hero, ' +
    '.contact-panel, .signup-panel, .issue-card, .proof-none, .price-card.flagship';

  /* Elements whose `.reveal` is ignored entirely: they show the instant they
     are on screen. An eyebrow is four tracked words, a divider is a 1px rule
     with a dot, and a bare paragraph is body copy. Motion on any of them has
     no purpose except the entrance itself, which is motion-on-mount for
     static content, another named tell.

     These still carry `class="reveal"` in src/*.njk. Removing the class from
     the page templates is the correct fix and those files are outside this
     partition, so the skip is enforced here and the cleanup is logged in the
     playbook. */
  var SKIP_SELECTOR = '.reveal--none, .eyebrow, .divider, p';

  /* Containers whose direct children deal out. Order matters only for the
     one-group-per-screen guardrail below.

     Deliberately short. `.stat-grid`, `.addon-grid`, `.exclusion-row`,
     `.values-grid` and `.project-grid` were all listed here once and all
     five were skipped at runtime, so cutting them costs nothing visible. A
     stagger on a row of struck-through chips is noise. What is left is the
     three places where dealing out means something: comparing tiers,
     reading a menu, scanning the service set.

     KEEP IN SYNC with the group list in PLAYBOOK-animation-system.md. */
  var GROUP_SELECTORS = ['.reveal--group', '.pricing-grid', '.menu-grid', '.tier-list', '.service-grid'];

  /* Elements this script hid, so a mid-session flip to reduced motion can
     put every one of them back. */
  var HIDDEN = [];

  /* -----------------------------------------------------------------------
     PAINTED: the flash guard.

     Reveals are hidden by JS after a deferred 46 KB gzipped bundle downloads
     and parses. On a fast connection that happens before first paint and the
     ordering holds. On a cold mobile connection the browser can paint first,
     and then this script hides content the visitor is already looking at and
     fades it back in. That is a visible flash on the fold.

     The precise test is whether a paint has already happened. If it has,
     anything currently on screen has been seen and must not be hidden;
     anything still below the fold has not been seen and is safe to animate.
     So the guard is per element instead of per page, and the system keeps working
     on slow connections instead of switching itself off.

     This also protects LCP. heroLoadIn used to set opacity 0 on a hero logo
     carrying fetchpriority="high", so the template paid to prioritise an
     image and then hid it in JS; an element at opacity 0 does not count as
     LCP until it becomes visible. After a paint, the hero stands down.

     Hiding stays in JS. Doing this in CSS would mean a visitor whose JS
     never arrives sees nothing at all, which is the contract this template
     deliberately does not break.
     ----------------------------------------------------------------------- */
  function hasPainted() {
    try {
      if (window.performance && performance.getEntriesByType) {
        return performance.getEntriesByType('paint').length > 0;
      }
      // No Paint Timing support: fall back to a conservative clock reading.
      return window.performance && performance.now() > 800;
    } catch (e) {
      return false;
    }
  }
  var PAINTED = false;

  function canHide(el) {
    if (!PAINTED) return true;
    var vh = window.innerHeight || 0;
    var top = el.getBoundingClientRect().top;
    return top > vh; // strictly below the fold, so it has not been seen
  }

  function hide(el) {
    el.style.opacity = '0';
    HIDDEN.push(el);
  }

  function noop() {}

  /* -----------------------------------------------------------------------
     OWNERSHIP MARKERS.

     A container that deals its own children out, and a ledger panel that
     draws its own rows, both take over their entrance from any `.reveal`
     ancestor wrapping them. The old code did the opposite: staggerReveal
     skipped any container sitting inside a `.reveal`, which was right in
     intent (it prevents a double entrance) and wrong in effect. Measured
     across all seven built pages, seven of the eight listed selectors never
     fired. Worst of all, both menu variants wrapped their content in
     `.reveal`, so a client restaurant's menu, the densest and most-scanned
     component in the whole product, faded in as one blurred block.

     Inverting it: the owner wins and marks the ancestor, so the specific
     entrance beats the generic one.
     ----------------------------------------------------------------------- */
  function claim(el) {
    var wrapper = el.closest('.reveal');
    if (wrapper) wrapper.setAttribute('data-rm-claimed', '');
    if (el.classList.contains('reveal')) el.setAttribute('data-rm-claimed', '');
  }

  function isClaimed(el) {
    return el.hasAttribute('data-rm-claimed');
  }

  /* -----------------------------------------------------------------------
     revealAmount(el)
     How much of an element must be visible before its reveal fires.
     0.2 is the house default, but an element taller than ~5 viewports can
     never show 20% of itself at once. inView would never fire and the
     element, pre-hidden by JS, would stay invisible forever. On long pages
     (pricing, legal) a `.reveal` wrapper really can get that tall on a short
     phone, so the threshold is capped instead of assumed.
     ----------------------------------------------------------------------- */
  function revealAmount(el) {
    var vh = window.innerHeight || 800;
    var h = el.offsetHeight || 0;
    if (h * 0.2 > vh * 0.75) return Math.max(0.02, (vh * 0.75) / h);
    return 0.2;
  }

  /* -----------------------------------------------------------------------
     tierFor(el): which of the three enter recipes an element gets.
     Precedence: skip list, then explicit class, then the default map.
     Under `motion: quiet` every surviving element collapses to the quiet
     tier, which is the whole point of that setting.
     ----------------------------------------------------------------------- */
  function tierFor(el) {
    if (el.matches(SKIP_SELECTOR)) return null;
    if (QUIET_SITE) return 'quiet';
    if (el.matches('.reveal--quiet')) return 'quiet';
    if (el.matches(ANCHOR_SELECTOR)) return 'anchor';
    return 'quiet';
  }

  /* -----------------------------------------------------------------------
     scrollFadeIn(selector)
     Reveals each matched element the first time it scrolls into view, at the
     tier tierFor() gives it.
     Call:  scrollFadeIn('main .reveal')
     Notes: elements are hidden by THIS script, never by CSS, so with JS off
     or the vendor bundle missing everything stays visible. Fires once per
     element; reveals do not replay on every scroll past. Elements claimed by
     staggerReveal() or ledgerTally() are left alone, so call those first.
     ----------------------------------------------------------------------- */
  function scrollFadeIn(selector) {
    if (REDUCED) return;
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      if (isClaimed(el)) return;
      var tier = tierFor(el);
      if (!tier) return;
      if (!canHide(el)) return;
      var recipe = TIERS[tier];
      hide(el);
      inView(el, function () {
        animate(el, recipe.keyframes, recipe.options);
        // returning nothing = the element stops being observed after the
        // first enter
      }, { amount: revealAmount(el) });
    });
  }

  /* -----------------------------------------------------------------------
     staggerReveal(selector, step)
     Reveals a container's direct children one after another so a grid of
     cards deals itself out.
     Call:  staggerReveal('.pricing-grid, .menu-grid')

     Two rules are enforced here and both matter:

     THE STEP IS COMPUTED, NOT FIXED. min(0.05, 0.4/n) caps the whole
     sequence at roughly 400ms whether a client's config produces three menu
     items or thirty. A fixed 60ms step turns a twenty-item menu into a
     1.2-second wait for the last row.

     ONE STAGGERED GROUP PER SCREEN. Two different lists dealing out in the
     same viewport is the "identical card grids" reflex wearing motion. A
     group closer than one viewport-height to the last accepted group of a
     DIFFERENT kind is demoted and simply shows. Repeated instances of the
     same container class are exempt, because a menu with four category
     blocks is one component keeping one rhythm.
     ----------------------------------------------------------------------- */
  function staggerReveal(selector, step) {
    if (REDUCED || QUIET_SITE) return;
    var containers = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!containers.length) return;

    var vh = window.innerHeight || 800;
    var lastKey = null;
    var lastTop = -1e9;

    containers.forEach(function (container) {
      var items = Array.prototype.slice.call(container.children);
      if (!items.length) return;

      // Which listed selector this container matched, used as the "same
      // component" key for the one-group-per-screen guardrail.
      var key = null;
      for (var i = 0; i < GROUP_SELECTORS.length; i++) {
        if (container.matches(GROUP_SELECTORS[i])) { key = GROUP_SELECTORS[i]; break; }
      }
      if (key === null) key = container.className;

      var top = container.getBoundingClientRect().top + (window.scrollY || 0);
      if (key !== lastKey && (top - lastTop) < vh) return; // demoted: shows with no motion
      lastKey = key;
      lastTop = top;

      claim(container);
      if (!canHide(container)) return; // painted and on screen: leave it alone
      items.forEach(hide);

      var s = step || Math.min(0.05, 0.4 / items.length);
      inView(container, function () {
        animate(items, TIERS.group.keyframes, {
          type: 'spring',
          duration: 0.4,
          bounce: 0,
          delay: stagger(s)
        });
      }, { amount: revealAmount(container) });
    });
  }

  /* -----------------------------------------------------------------------
     ledgerTally(selector)
     The one moment on the site worth consciously noticing.

     The ledger row is the brand's own metaphor and the component styles.css
     itself calls the signature stat component: a label, a dotted leader, a
     value. Its own mechanics were untapped. Here each leader draws left to
     right and its value lands as the leader reaches it, so the panel reads
     as a sheet being totted up.

     Technique: the leader is animated with scaleX from a left origin, which
     is transform only and never touches width. The value gets opacity plus a
     small settle, timed to the leader's arrival.

     Nothing about a tally is predictable from "restaurant website", which is
     the category-reflex check this has to pass.

     Call:  ledgerTally('.ledger-panel')
     Opt out per panel with `.ledger-panel--plain`. Reduced motion and
     `motion: quiet` skip the draw entirely and the panel appears complete.
     ----------------------------------------------------------------------- */
  function ledgerTally(selector) {
    if (REDUCED || QUIET_SITE) return;
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (panel) {
      if (panel.classList.contains('ledger-panel--plain')) return;
      var rows = Array.prototype.filter.call(panel.children, function (c) {
        return c.classList && c.classList.contains('ledger-row');
      });
      if (rows.length < 2) return; // one row is not a tally

      claim(panel);
      if (!canHide(panel)) return;

      // The hook class moves the leader's static -5px optical offset from
      // `transform` to `translate` so Motion can own `transform` outright.
      // Two owners of one property is the rule this exists to keep.
      panel.classList.add('ledger-panel--tally');

      var leaders = [];
      var values = [];
      rows.forEach(function (row) {
        var dots = row.querySelector('.dots');
        var value = row.querySelector('.value');
        if (dots) leaders.push(dots);
        if (value) values.push(value);
      });
      if (!values.length) { panel.classList.remove('ledger-panel--tally'); return; }

      hide(panel);
      values.forEach(hide);
      leaders.forEach(function (d) { d.style.transform = 'scaleX(0)'; HIDDEN.push(d); });

      inView(panel, function () {
        animate(panel, TIERS.quiet.keyframes, TIERS.quiet.options);

        // Below 520px styles.css drops the leader entirely, because a label,
        // a leader and a nowrap value cannot share a 375px line. With no
        // leader to follow, the values simply settle in sequence.
        var drawable = leaders.filter(function (d) { return d.offsetWidth > 0; });
        var step = Math.min(0.07, 0.22 / Math.max(1, rows.length - 1));

        if (drawable.length) {
          animate(drawable, { scaleX: [0, 1] }, {
            duration: 0.32,
            ease: EASE_OUT,
            delay: stagger(step)
          });
        } else {
          leaders.forEach(function (d) { d.style.transform = ''; });
        }

        animate(values, { opacity: [0, 1], y: [4, 0] }, {
          type: 'spring',
          duration: 0.28,
          bounce: 0,
          delay: stagger(step, { startDelay: drawable.length ? 0.22 : 0.06 })
        });
      }, { amount: 0.25 });
    });
  }

  /* -----------------------------------------------------------------------
     hoverLift(selector)
     A 3px lift on hover plus scale-down press feedback for buttons and other
     things you can actually activate. Transform only, so no layout shift.
     Call:  hoverLift('.btn')

     WHAT IS DELIBERATELY NOT IN THIS LIST. `.service-card` and `.menu-card`
     used to be. Neither contains a link or a handler: they rose 3px on hover
     and did nothing when clicked, so the motion was signalling clickability
     on inert content. On touch, hover() is correctly suppressed and press()
     binds only to activatable elements, so those cards had no touch state at
     all. Their CSS paint hover (border-colour to the accent, a deeper
     shadow) already says "this is a surface" and promises nothing. Removing
     them also dissolved the Motion-vs-Motion transform conflict with
     staggerReveal, in one edit.

     If a client build makes those cards clickable, the correct move is a
     variant that adds the anchor AND restores the lift together.

     Notes: Motion's hover() ignores emulated hover events on touch devices;
     press() also handles keyboard activation. Because Motion writes inline
     transforms, these elements get no CSS :hover/:active transform.
     ----------------------------------------------------------------------- */
  function hoverLift(selector) {
    if (REDUCED) return;
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!els.length) return;

    hover(els, function (el) {
      animate(el, { y: -3 }, { duration: 0.18, ease: EASE_OUT });
      return function () {
        animate(el, { y: 0 }, { duration: 0.22, ease: EASE_OUT });
      };
    });

    pressFeedback(els.filter(function (el) {
      return el.matches('a, button, [role="button"]');
    }), 0.97);
  }

  /* -----------------------------------------------------------------------
     pressFeedback(selectorOrElements, scale)
     Press feedback on its own, for a control that should answer a tap
     without rising.
     Call:  pressFeedback('.acc-toggle', 0.98)

     `.acc-toggle` is the reason this is separate. It is a real <button>
     gating the most consequential content on the site, "See everything
     included" on three pricing tiers, and its entire motion budget was
     `transition: text-decoration-color .15s`. Meanwhile a decorative divider
     got a full spring entrance. It needs an answer to a tap; it does not
     need a lift, because a text button that rises 3px reads wrong.
     ----------------------------------------------------------------------- */
  function pressFeedback(target, scale) {
    if (REDUCED) return;
    var els = typeof target === 'string'
      ? Array.prototype.slice.call(document.querySelectorAll(target))
      : target;
    if (!els || !els.length) return;
    var to = scale || 0.98;
    els.forEach(function (el) {
      press(el, function (t) {
        animate(t, { scale: to }, { duration: 0.12, ease: EASE_OUT });
        return function () {
          animate(t, { scale: 1 }, { duration: 0.16, ease: EASE_OUT });
        };
      });
    });
  }

  /* -----------------------------------------------------------------------
     heroLoadIn(selector)
     Staggered entrance for the hero on page load.
     Call:  heroLoadIn('.hero, .hero-fullbleed, .hero-split')

     THE HERO IMAGE IS NOT IN THIS LIST, on purpose. It used to be, while
     carrying fetchpriority="high" in two hero variants. Prioritising an
     image and then setting it to opacity 0 in JS is self-defeating: an
     element at opacity 0 is not counted as LCP until it becomes visible. The
     media paints immediately now and the sequence starts at the eyebrow.

     The timing also came down. Five items at 90ms on a 550ms spring put the
     last element near 1.0 second, which complies per element and is roughly
     double the entrance guardrail as a perceived event. Four items at 60ms
     on a 450ms spring settle near 690ms, and a slow hero is the first thing
     a visitor judges.

     Works with every hero variant: it animates the standard hero pieces it
     finds inside the matched section, so a new variant only needs to use
     those classes.
     ----------------------------------------------------------------------- */
  function heroLoadIn(selector) {
    if (REDUCED) return;
    var heroEl = document.querySelector(selector);
    if (!heroEl) return;
    if (!canHide(heroEl)) return; // already painted and above the fold
    var ITEMS = '.eyebrow, h1, .sub, .hero-actions';
    var items = Array.prototype.slice.call(heroEl.querySelectorAll(ITEMS));
    if (!items.length) return;
    items.forEach(hide);
    var kf = QUIET_SITE ? TIERS.quiet.keyframes : TIERS.group.keyframes;
    animate(items, kf, {
      type: 'spring',
      duration: 0.45,
      bounce: 0,
      delay: stagger(0.06)
    });
  }

  /* -----------------------------------------------------------------------
     accordion(selector)
     The pricing accordion, given an exit.

     It had an entrance and no exit: opening ran a 0.22s keyframe, closing
     went straight back to display:none. Opening was soft and closing was a
     hard cut, on the highest-consideration interaction on the site. A
     keyframe also restarts from zero on every toggle, so rapid clicking
     stuttered instead of retargeting.

     This takes the control over from the inline onclick that site.js
     installs, by removing the attribute and binding a handler that does the
     same class work plus a real open and close. Order-independent: whenever
     this runs, it takes over, and site.js's window.toggleAcc is left intact
     for anything else that calls it. Under reduced motion this does not run
     at all, so the inline handler keeps working and the toggle stays
     instant, which is the correct outcome.

     The close is faster and smaller than the open (140ms against 200ms, 2px
     against 4px). Exits should get out of the way.

     The chevron keeps its CSS rotate and stays the sole owner of its own
     transform. The button classes flip immediately on both paths, so the
     control answers the click before the panel finishes moving.

     Height is not animated. The display flip costs one layout, which is
     unavoidable and is recorded at the .acc-content rule in styles.css. The
     previous implementation animated max-height, which animates layout.

     THIS RUNS UNDER `motion: quiet` TOO. Quiet is a setting about entrances,
     and a control that opens softly and shuts with a hard cut is louder than
     one that does both gently. Only reduced motion turns it off.
     ----------------------------------------------------------------------- */
  function accordion(selector) {
    if (REDUCED) return;
    var toggles = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!toggles.length) return;

    // Tells styles.css to drop the acc-in keyframe, which is the baseline
    // for the reduced-motion and no-Motion paths. Two owners of opacity on
    // one element is exactly what this prevents.
    ROOT.classList.add('acc-motion');

    toggles.forEach(function (btn) {
      var content = contentFor(btn);
      if (!content) return;

      btn.removeAttribute('onclick');
      if (content.id) btn.setAttribute('aria-controls', content.id);
      btn.setAttribute('aria-expanded', content.classList.contains('open') ? 'true' : 'false');

      btn.addEventListener('click', function () {
        var st = accState(content);
        if (st.phase === 'open' || st.phase === 'opening') closeAcc(btn, content);
        else openAcc(btn, content);
      });
    });
  }

  function contentFor(btn) {
    var id = btn.getAttribute('aria-controls');
    if (id) return document.getElementById(id);
    if (btn.id && btn.id.indexOf('btn-') === 0) {
      var byId = document.getElementById('content-' + btn.id.slice(4));
      if (byId) return byId;
    }
    var next = btn.nextElementSibling;
    return next && next.classList.contains('acc-content') ? next : null;
  }

  function accState(el) {
    if (!el.rmAcc) el.rmAcc = { phase: 'closed', anim: null };
    return el.rmAcc;
  }

  function openAcc(btn, content) {
    var st = accState(content);
    var fromRest = st.phase === 'closed';
    st.phase = 'opening';
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    content.classList.add('open'); // display flip: the one layout
    if (fromRest) content.style.opacity = '0';
    // From rest, explicit keyframes. Mid-flight, single targets so Motion
    // retargets from wherever the panel currently is.
    var kf = fromRest ? { opacity: [0, 1], y: [-4, 0] } : { opacity: 1, y: 0 };
    st.anim = animate(content, kf, { duration: 0.2, ease: EASE_OUT });
    st.anim.finished.then(function () {
      if (st.phase === 'opening') { st.phase = 'open'; st.anim = null; }
    }).catch(noop);
  }

  function closeAcc(btn, content) {
    var st = accState(content);
    st.phase = 'closing';
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    st.anim = animate(content, { opacity: 0, y: -2 }, { duration: 0.14, ease: EASE_IN });
    st.anim.finished.then(function () {
      if (st.phase !== 'closing') return; // reopened mid-flight
      content.classList.remove('open');
      st.phase = 'closed';
      st.anim = null;
    }).catch(noop);
  }

  /* -----------------------------------------------------------------------
     submitFeedback(selector)
     The highest-intent moment on the site, given a state.

     site.js disables the submit button and swaps its label to "Sending…".
     The button looked identical while in flight, so the form had less
     feedback than hovering a card that does nothing. styles.css now carries
     a real .btn:disabled rule, which is a missing visual state before it is
     a missing animation, and this adds the movement on top:

       · a short opacity dip that the label swap lands inside, so the text
         changes under cover instead of popping
       · the button settling to 0.99 and holding, so it reads as committed

     The dip is bound in the capture phase, which runs before the form's own
     submit handler, so it starts before site.js touches the label. The
     inline opacity is cleared when the dip ends and .btn:disabled takes the
     surface from there.

     On success the page navigates, so there is no exit. On the failure path
     site.js re-enables the button; the observer below reverses the scale so
     retry reads as pressable again.

     Reduced motion: none of this runs and the disabled styling still
     applies. The state is fully legible with zero motion.
     ----------------------------------------------------------------------- */
  function submitFeedback(selector) {
    if (REDUCED) return;
    var forms = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!forms.length) return;

    // One live dip per button. Motion commits an animation's final value to
    // the inline style, so a dip left running when the button is re-enabled
    // would write 0.65 back over the cleared value and strand a live control
    // looking disabled. Stopping it first is synchronous, which makes the
    // ordering certain instead of a race between a commit and a promise.
    var dips = new WeakMap();

    function buttonFor(form) {
      return form.querySelector('button[type="submit"]') || form.querySelector('button');
    }

    function endDip(btn) {
      var d = dips.get(btn);
      if (d) { d.stop(); dips.delete(btn); }
      btn.style.opacity = ''; // hand the surface back to .btn:disabled
    }

    // Bound on the document in the capture phase. A listener on the form
    // itself would run in the target phase, where ordering falls back to
    // registration order and site.js could get there first.
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || forms.indexOf(form) === -1) return;
      var btn = buttonFor(form);
      if (!btn) return;
      endDip(btn);
      var dip = animate(btn, { opacity: [1, 0.35, 0.65] }, { duration: 0.26, ease: EASE_OUT });
      dips.set(btn, dip);
      dip.finished.then(function () {
        // Only if this dip is still the current one and the button is still
        // in flight. Otherwise the failure path has already taken over.
        if (dips.get(btn) === dip && btn.disabled) { dips.delete(btn); btn.style.opacity = ''; }
      }).catch(noop);
      animate(btn, { scale: 0.99 }, { duration: 0.16, ease: EASE_OUT });
    }, true);

    if (!window.MutationObserver) return;
    forms.forEach(function (form) {
      var btn = buttonFor(form);
      if (!btn) return;
      new MutationObserver(function () {
        if (btn.disabled) return; // still in flight
        endDip(btn);
        animate(btn, { scale: 1 }, { duration: 0.16, ease: EASE_OUT });
      }).observe(btn, { attributes: true, attributeFilter: ['disabled'] });
    });
  }

  /* -----------------------------------------------------------------------
     parallax(selector, distance)
     Scroll-linked drift: the element travels `distance` px against the page
     as its container passes through the viewport. Transform only, driven by
     Motion's scroll() so it runs off the main thread where supported.
     Call:  parallax('[data-media-motion="drift"] img', 8)

     NO LONGER CALLED UNCONDITIONALLY. It only ever targeted the split hero's
     media panel, which exists in one variant the site does not ship, so it
     resolved to zero elements on every page load of every page. init() now
     checks for the opt-in hook first, which is one cheap query, and the
     `hero.media_motion: none | drift` config field that emits it is listed
     in the playbook under "Pending config wiring".

     Notes: keep this OFF anything heroLoadIn() or hoverLift() touches, since
     those own transform on their elements. The hero media panel clips
     (overflow:hidden in styles.css) so nothing spills.
     ----------------------------------------------------------------------- */
  function parallax(selector, distance) {
    if (REDUCED || QUIET_SITE || typeof scroll !== 'function') return;
    var d = distance || 8;
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      var container = el.parentElement || el;
      scroll(
        animate(el, { y: [d, -d] }, { ease: 'linear' }),
        { target: container, offset: ['start end', 'end start'] }
      );
    });
  }

  /* -----------------------------------------------------------------------
     pageTransition()
     Cross-page transition using the View Transitions API (MPA form).
     Call:  pageTransition()   (once per page; init() does this)

     The root cross-fade is deliberately fast, because navigation is a
     high-frequency action. The spatial continuity, which is the part that
     carries meaning, lives in styles.css: the nav bar, the logo and the
     active nav link each hold a view-transition-name, so they persist across
     the load instead of dissolving with the document. They are pixel
     identical on both sides, and the active indicator travels from the old
     link to the new one.

     Fallback: browsers without cross-document View Transitions ignore the
     @view-transition rule entirely and navigate instantly. No polyfill, no
     broken state. Reduced motion keeps instant navigation too.
     ----------------------------------------------------------------------- */
  function pageTransition() {
    if (REDUCED || QUIET_SITE) return;
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
     Past a small scroll threshold the nav gains a shadow and the logo scales
     down slightly (transform only, so the nav's box never changes size and
     layout shift stays at zero). All the visuals live in CSS under
     .nav--scrolled; this flips the class, with hysteresis so it does not
     flicker at the boundary.
     Call:  stickyNavShrink('.nav')

     THE ONE UTILITY WITH NO REDUCED-MOTION GUARD, and that is deliberate.
     It sets a state indicator, and the CSS transitions it triggers are
     already killed by the reduced-motion block in styles.css, so under
     reduced motion the scrolled state snaps instead of animating. Snapping
     is the correct outcome for a state indicator. Do not "fix" this by
     adding a guard: that would leave the nav with no scrolled state at all.
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
     watchReducedMotion()
     REDUCED used to be read once at load, so a visitor who turned the OS
     setting on mid-session kept every animation until they reloaded.

     Turning it ON settles every element this script hid straight to its
     final state, so nothing is left stranded behind an animation that will
     now never run.

     Turning it OFF binds the interaction feedback that was skipped at load.
     Entrances are not retroactively replayed: that content is already on
     screen and hiding it to fade it back in would be the flash this file
     works to avoid.
     ----------------------------------------------------------------------- */
  var interactionsBound = false;

  function settleAll() {
    HIDDEN.forEach(function (el) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
    });
    HIDDEN.length = 0;
    Array.prototype.forEach.call(
      document.querySelectorAll('.ledger-panel--tally'),
      function (p) { p.classList.remove('ledger-panel--tally'); }
    );
  }

  function watchReducedMotion() {
    function onChange() {
      REDUCED = REDUCE_QUERY.matches;
      if (REDUCED) settleAll();
      else if (!interactionsBound) bindInteractions();
    }
    if (REDUCE_QUERY.addEventListener) REDUCE_QUERY.addEventListener('change', onChange);
    else if (REDUCE_QUERY.addListener) REDUCE_QUERY.addListener(onChange);
  }

  /* -----------------------------------------------------------------------
     bindInteractions(): everything that answers a pointer or a key.
     Split out from init() so it can also be bound later, if a visitor turns
     reduced motion off mid-session.
     ----------------------------------------------------------------------- */
  function bindInteractions() {
    if (REDUCED) return;
    interactionsBound = true;
    // .service-card and .menu-card are deliberately absent; see hoverLift().
    hoverLift('.btn');
    pressFeedback('.acc-toggle', 0.98);
    accordion('.acc-toggle');
    submitFeedback('form[action*="formspree.io"]');
  }

  /* -----------------------------------------------------------------------
     init(): standard wiring for every page of the template.
     Runs automatically. Every call no-ops if its selector matches nothing,
     so this is safe on all pages and all component variants.

     ORDER MATTERS in one place: staggerReveal() and ledgerTally() claim
     their `.reveal` ancestors, and scrollFadeIn() honours those claims, so
     the two owners run first.
     ----------------------------------------------------------------------- */
  function init() {
    PAINTED = hasPainted();

    var HEROES = '.hero, .hero-fullbleed, .hero-split, .hero-statement, .hero-marquee, .hero-ticket';

    heroLoadIn(HEROES);

    // Owners first: a grid that deals its own children out, and a ledger
    // panel that draws its own rows, both beat a generic wrapper reveal.
    staggerReveal(GROUP_SELECTORS.join(', '));
    ledgerTally('.ledger-panel');

    // Then the generic reveals, minus anything inside a hero (heroLoadIn
    // already owns those) and minus anything an owner claimed above.
    try {
      scrollFadeIn('main .reveal:not(:is(' + HEROES + ') *, :is(' + HEROES + '))');
    } catch (e) {
      scrollFadeIn('main .reveal'); // ancient-browser fallback
    }

    bindInteractions();

    stickyNavShrink('.nav');
    pageTransition();

    // Opt-in only. See parallax() for why this is no longer unconditional.
    if (document.querySelector('[data-media-motion="drift"]')) {
      parallax('[data-media-motion="drift"] img', 8);
    }

    watchReducedMotion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed for one-off use on custom pages (call from a page's script):
  window.RegularsMotion = {
    scrollFadeIn: scrollFadeIn,
    staggerReveal: staggerReveal,
    ledgerTally: ledgerTally,
    hoverLift: hoverLift,
    pressFeedback: pressFeedback,
    heroLoadIn: heroLoadIn,
    accordion: accordion,
    submitFeedback: submitFeedback,
    parallax: parallax,
    pageTransition: pageTransition,
    stickyNavShrink: stickyNavShrink
  };
})();
