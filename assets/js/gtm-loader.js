/* First-party bootstrap for JRVC's Google Tag Manager container.
   The actual GA4 tag/configuration is managed and published in GTM. */
(function (window, document) {
  'use strict';
  var loader = document.currentScript;
  var containerId = loader && loader.getAttribute('data-gtm-id');
  if (!/^GTM-[A-Z0-9]+$/.test(containerId || '')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  var firstScript = document.getElementsByTagName('script')[0];
  var gtmScript = document.createElement('script');
  gtmScript.async = true;
  gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
  firstScript.parentNode.insertBefore(gtmScript, firstScript);
})(window, document);
