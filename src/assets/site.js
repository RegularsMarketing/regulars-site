// Shared site behaviour (template)
// Animations live in animations.js (Motion). Navigation is real page loads.
(function () {
  // Pricing tier accordion — referenced by inline onclick="toggleAcc('...')"
  window.toggleAcc = function (id) {
    document.getElementById('content-' + id).classList.toggle('open');
    document.getElementById('btn-' + id).classList.toggle('open');
  };

  // ---- Formspree submit -> our own thank-you page ----
  // Formspree's "Redirect" setting and the _next field are PAID features. On the
  // free plan a native submit always lands the visitor on formspree.io/thanks —
  // third-party branding, off-domain, at the highest-intent moment on the site.
  // Submitting via fetch keeps control of where they go next, on any plan.
  //
  // Progressive enhancement: if fetch fails for any reason we fall through to a
  // native submit, so a submission is never lost — worst case the visitor sees
  // Formspree's page, which is exactly the old behaviour.
  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('form[action*="formspree.io"]');

    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener('submit', function (e) {
        if (form.dataset.nativeSubmit === 'true') return; // fallback path
        e.preventDefault();

        var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        var nextField = form.querySelector('input[name="_next"]');
        var next = (nextField && nextField.value) || '/thanks/';
        var label = btn ? btn.textContent : null;

        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

        var nativeFallback = function () {
          form.dataset.nativeSubmit = 'true';
          form.submit();
        };

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          if (!res.ok) throw new Error('Formspree responded ' + res.status);
          window.location.assign(next);
        }).catch(function () {
          if (btn) { btn.disabled = false; if (label) btn.textContent = label; }
          nativeFallback();
        });
      });
    });
  });
})();
