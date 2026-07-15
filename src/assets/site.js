// Shared site behaviour (template)
// Animations live in animations.js (Motion). Navigation is real page loads.
(function () {
  // Pricing tier accordion — referenced by inline onclick="toggleAcc('...')"
  window.toggleAcc = function (id) {
    document.getElementById('content-' + id).classList.toggle('open');
    document.getElementById('btn-' + id).classList.toggle('open');
  };
})();
