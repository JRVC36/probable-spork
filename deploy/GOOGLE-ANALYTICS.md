# Google Analytics via Google Tag Manager

The site loads GTM container `GTM-KM869M7R` on every generated page using a first-party bootstrap (`assets/js/gtm-loader.js`). This avoids an inline script, which the site's strict Content-Security-Policy would block. The bootstrap queues `gtag('js', new Date())` and the standard `gtm.js` event, then asynchronously loads Google's GTM script. A no-script iframe fallback is also present.

## GTM account configuration required

A GTM container ID alone does not guarantee that GA4 receives page views. In Google Tag Manager:

1. Confirm `GTM-KM869M7R` is the correct JRVC production container.
2. Configure a GA4 Google tag with the JRVC GA4 Measurement ID (`G-...`) and an all-pages/page-view trigger.
3. Publish the container changes. Until published, the site bootstrap may load an empty or older container and Analytics may show no traffic.
4. Keep this container limited to approved measurement. Do not create tags that transmit registration fields, health/dietary data, names, email addresses, payment choices, or payment details. Avoid advertising/user-profiling tags unless separately approved and disclosed.
5. Set the GA4 data-retention and data-sharing options according to JRVC policy. Confirm consent requirements for the audience and regions served; this implementation does not add a consent banner or Consent Mode.

## Site and server deployment

The static site build adds the versioned loader script and no-script iframe on all generated pages. The privacy policy now describes Google Analytics. The nginx CSP in `deploy/jrvc-site.inc` permits the GTM script/frame and the GA collection endpoints, with explicit hosts only. Install the changed privacy policy/assets and nginx snippet, run `nginx -t`, and reload the active JRVC TLS vhost as appropriate. Do not assume repository changes alter the live server automatically.

## Verification

- Use GTM Preview / Tag Assistant on `https://www.jrvc.org/` and a content page. Confirm the production container loads and the GA4 Google tag fires once per page view.
- Inspect browser Network for `gtm.js` and GA collection requests (for example `/g/collect`). Confirm no CSP errors and no form values or personal information in analytics payloads.
- Verify expected page-view events in GA4 Realtime/DebugView after publishing the tag.
- Test with JavaScript disabled only if validating the optional GTM no-script iframe; it does not replace normal GA4 tag behavior.
- Review cookies in a clean browser profile and compare with the published privacy policy. No real registration or payment is needed for an analytics smoke test.
