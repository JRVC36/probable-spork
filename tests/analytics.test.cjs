const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('GTM bootstrap loads the requested container asynchronously and queues initialization',()=>{
 const loader=read('assets/js/gtm-loader.js');
 assert.ok(loader.includes("window.gtag('js', new Date())"));
 assert.ok(loader.includes("event: 'gtm.js'"));
 assert.ok(loader.includes("https://www.googletagmanager.com/gtm.js?id="));
 assert.ok(loader.includes('gtmScript.async = true'));
 assert.ok(read('build.mjs').includes('GTM-KM869M7R'));
});

test('every generated page includes GTM bootstrap and no-script fallback',()=>{
 for(const page of ['index','about','faq','facilities','get-involved','mission-trips','privacy','register','retreats','summer-camp','visit','404']){
  const html=read(page+'.html');
  assert.ok(html.includes('data-gtm-id="GTM-KM869M7R"'),page+' GTM bootstrap');
  assert.ok(html.includes('googletagmanager.com/ns.html?id=GTM-KM869M7R'),page+' GTM fallback');
 }
});

test('privacy policy discloses analytics and avoids claiming no analytics cookies',()=>{
 const privacy=read('privacy.html');
 assert.ok(privacy.includes('Google Analytics'));
 assert.ok(privacy.includes('Google Tag Manager container GTM-KM869M7R'));
 assert.ok(privacy.includes('We do not intentionally send registration form answers'));
 assert.ok(privacy.includes('Google Analytics opt-out browser add-on'));
 assert.ok(!privacy.includes('This site does not set advertising cookies'));
});
