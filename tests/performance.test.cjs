const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
function luminance(hex) {
 const c=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
test('eyebrow text meets AA contrast on paper and sand',()=>{
 const css=read('assets/css/site.css');
 const color=css.match(/\.eyebrow\s*\{[^}]*color: var\(--([\w-]+)\)/)[1];
 const foreground=css.match(new RegExp('--'+color+': (#[a-f0-9]+)'))[1];
 for(const name of ['paper','sand']){
  const background=css.match(new RegExp('--'+name+': (#[a-f0-9]+)'))[1];
  assert.ok((luminance(background)+.05)/(luminance(foreground)+.05)>=4.5);
 }
});
test('optimized images use fresh URLs and are smaller than previous WebPs',()=>{
 for(const name of ['hero','chapel','lodge-timber','rafting']){
  for(const size of ['-sm','']) {
   const stem='assets/img/'+name+size;
   assert.ok(fs.statSync(stem+'-v2.webp').size<fs.statSync(stem+'.webp').size);
   assert.ok(read('index.html').includes(stem+'-v2.webp'));
  }
 }
});
test('nginx allows required third-party scripts and frames without wildcard origins',()=>{
 const config=read('deploy/jrvc-site.inc');
 const policies=[...config.matchAll(/Content-Security-Policy "([^"]+)"/g)];
 assert.equal(policies.length,3);
 for(const [,policy] of policies){
  assert.ok(policy.includes("script-src 'self' https://challenges.cloudflare.com https://zeffy-scripts.s3.ca-central-1.amazonaws.com;"));
  assert.ok(policy.includes('frame-src https://challenges.cloudflare.com https://www.zeffy.com;'));
  assert.ok(!policy.includes('*'));
 }
});
