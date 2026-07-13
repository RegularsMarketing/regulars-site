// Regulars — shared site behaviour
// Reveal-on-load animation + pricing accordion. Navigation is now real page loads.
(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealPage() {
    var reveals = document.querySelectorAll('.reveal');
    if (prefersReducedMotion) {
      reveals.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    reveals.forEach(function (el, i) {
      var delay = Math.min(35 * i, 350);
      setTimeout(function () { el.classList.add('visible'); }, delay);
    });
  }

  // Pricing tier accordion — referenced by inline onclick="toggleAcc('...')"
  window.toggleAcc = function (id) {
    document.getElementById('content-' + id).classList.toggle('open');
    document.getElementById('btn-' + id).classList.toggle('open');
  };

  document.addEventListener('DOMContentLoaded', revealPage);
})();
