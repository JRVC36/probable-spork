/* Explicit rendering keeps a separate token and reset lifecycle for each form. */
(function () {
  'use strict';
  window.jrvcTurnstileReady = function () {
    document.querySelectorAll('[data-turnstile-action]').forEach(function (container) {
      if (container.dataset.widgetId) return;
      var form = container.closest('form');
      var widgetId = window.turnstile.render(container, {
        sitekey: container.dataset.sitekey,
        action: container.dataset.turnstileAction,
        size: 'flexible',
        'refresh-expired': 'auto',
        'error-callback': function () {
          var status = form.querySelector('.form-status');
          if (status) {
            status.textContent = 'Bot verification could not load. Please retry, or call 828-387-5736.';
            status.hidden = false;
          }
        }
      });
      container.dataset.widgetId = widgetId;
      form.addEventListener('reset', function () {
        setTimeout(function () { window.jrvcResetTurnstile(form); }, 0);
      });
    });
  };
  window.jrvcResetTurnstile = function (form) {
    var container = form.querySelector('[data-turnstile-action]');
    if (container && container.dataset.widgetId && window.turnstile) {
      window.turnstile.reset(container.dataset.widgetId);
    }
  };
})();
