const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('VULTR global nginx config loads site files at http context',()=>{
 const main=read('deploy/vultr/nginx.conf');
 assert.match(main,/^http\s*\{/m);
 assert.ok(main.includes('include /etc/nginx/conf.d/*.conf;'));
 assert.ok(!main.includes('sites-enabled'));
});

test('JRVC vhost has HTTP ACME/redirect and canonical HTTPS servers',()=>{
 const vhost=read('deploy/vultr/jrvc.org.conf');
 assert.ok(vhost.includes('location ^~ /.well-known/acme-challenge/'));
 assert.ok(vhost.includes('return 301 https://www.jrvc.org$request_uri;'));
 assert.ok(vhost.includes('server_name jrvc.org;'));
 assert.ok(vhost.includes('server_name www.jrvc.org;'));
 assert.ok(vhost.includes('include /etc/nginx/snippets/jrvc-site.inc;'));
 assert.ok(!vhost.includes('fastcgi_pass'));
});

test('VULTR install guide warns to disable duplicate sample vhosts',()=>{
 const guide=read('deploy/vultr/README.md');
 assert.ok(guide.includes('Do **not** leave those old server blocks enabled'));
 assert.ok(guide.includes('sudo nginx -t'));
 assert.ok(guide.includes('No production server is changed'));
});
