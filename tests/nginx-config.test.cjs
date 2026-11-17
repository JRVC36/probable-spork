const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('shared nginx rules cannot exact-match the root ahead of an HTTP redirect',()=>{
 const shared=read('deploy/jrvc-site.inc');
 assert.ok(!/^location\s*=\s*\/\s*\{/m.test(shared));
 assert.ok(shared.includes('location ^~ /assets/'));
 assert.ok(shared.includes('location ~* \\.html$'));
});

test('nginx setup symlink matches the Debian sites-enabled conf glob',()=>{
 const main=read('deploy/nginx.conf');
 const setup=read('deploy/SETUP.md');
 assert.ok(main.includes('/etc/nginx/sites-enabled/jrvc.org.conf'));
 assert.ok(setup.includes('/etc/nginx/sites-enabled/jrvc.org.conf'));
 assert.ok(!setup.includes('/etc/nginx/sites-enabled/jrvc.org\n'));
});

test('cache-fix runbook covers VULTR server-context include and safe TLS verification',()=>{
 const doc=read('deploy/NGINX-CACHE-FIX.md');
 assert.ok(doc.includes('/etc/nginx/site-extras/*.conf'));
 assert.ok(doc.includes('server_name www.jrvc.org jrvc.org'));
 assert.ok(doc.includes('Do not place a `server {}` block in `site-extras`'));
 assert.ok(doc.includes('proxy/CDN'));
});

test('VULTR wrapper includes shared policies and asset prefix outranks regex cache rules',()=>{
 assert.ok(read('deploy/vultr-site-extra.conf').includes('include /etc/nginx/snippets/jrvc-site.inc;'));
 assert.ok(read('deploy/jrvc-site.inc').includes('location ^~ /assets/'));
});
