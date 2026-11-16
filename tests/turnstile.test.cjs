const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('deploy/apps-script/Code.gs','utf8');
function backend(options={}) {
 let calls=0,writes=0,mails=0;
 const context=vm.createContext({console,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='TURNSTILE_SECRET'?(options.noSecret?'':'test-secret'):(options.hosts??'www.jrvc.org,jrvc.org')})},
  UrlFetchApp:{fetch:(url,request)=>{
   calls++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
   assert.equal(request.payload.response,'fresh-token');assert.equal(request.followRedirects,false);
   if(options.throws)throw Error('network failure');
   const result=options.result??{success:true,action:'newsletter',hostname:'www.jrvc.org'};
   return {getResponseCode:()=>options.http??200,getContentText:()=>options.malformed?'not json':JSON.stringify(result)};
  }},
  MailApp:{sendEmail:()=>mails++}
 });
 vm.runInContext(source,context);
 vm.runInContext(`respond_ = function(ok,code){return {ok:ok,code:code};}; getTargetSheet_ = function(){return {appendRow:function(){countWrite();}};};`,context);
 context.countWrite=()=>writes++;
 return {context,verify:(token,action='newsletter')=>context.verifyTurnstile_(token,action),counts:()=>({calls,writes,mails})};
}
test('missing and oversized tokens fail without outbound requests',()=>{
 const b=backend();for(const token of [undefined,null,'',' ',42,'x'.repeat(2049)])assert.equal(b.verify(token),false);
 assert.equal(b.counts().calls,0);
});
test('missing secret and unsafe/empty host configuration fail closed',()=>{
 for(const opts of [{noSecret:true},{hosts:''},{hosts:'localhost'},{hosts:'jrvc.org,127.0.0.1'},{hosts:'evil.example'}]) {
  const b=backend(opts);assert.equal(b.verify('fresh-token'),false);assert.equal(b.counts().calls,0);
 }
});
test('only strict success with correct action and exact production hostname passes',()=>{
 assert.equal(backend().verify('fresh-token'),true);
 for(const result of [{success:false},{success:'true',action:'newsletter',hostname:'jrvc.org'},{success:true,action:'contact',hostname:'jrvc.org'},{success:true,action:'newsletter',hostname:'jrvc.org.evil.example'},{success:true,action:'newsletter',hostname:'localhost'}])assert.equal(backend({result}).verify('fresh-token'),false);
 assert.equal(backend({result:{success:true,action:'contact',hostname:'jrvc.org'}}).verify('fresh-token','contact'),true);
});
test('upstream errors, malformed responses and replay rejection fail closed',()=>{
 for(const opts of [{http:500},{throws:true},{malformed:true},{result:{success:false,'error-codes':['timeout-or-duplicate']}}])assert.equal(backend(opts).verify('fresh-token'),false);
});
test('actual doPost rejects unverified submissions before any write or email',()=>{
 const b=backend();const secret=vm.runInContext('SECRET',b.context);
 const result=b.context.doPost({postData:{contents:JSON.stringify({_ajax:'1',_form:'newsletter',_secret:secret,email:'test@example.com'})}});
 assert.equal(result.ok,false);assert.equal(result.code,'verification_failed');
 assert.deepEqual(b.counts(),{calls:0,writes:0,mails:0});
});
test('actual handler proceeds only after accepted verification',()=>{
 const b=backend();const secret=vm.runInContext('SECRET',b.context);
 const result=b.context.doPost({postData:{contents:JSON.stringify({_ajax:'1',_form:'newsletter',_secret:secret,email:'test@example.com','cf-turnstile-response':'fresh-token'})}});
 assert.equal(result.ok,true);assert.equal(b.counts().calls,1);assert.equal(b.counts().writes,1);
});
test('all five generated forms have matching actions and a single API script',()=>{
 for(const [page,action] of [['register','registration'],['retreats','retreat'],['mission-trips','mission'],['visit','contact'],['get-involved','newsletter']]) {
  const html=fs.readFileSync(page+'.html','utf8');
  assert.ok(html.includes('data-turnstile-action="'+action+'"'));
  assert.ok(html.includes('data-sitekey="0x4AAAAAAGDaf1mnfpcLVWMM"'));
  assert.equal((html.match(/challenges.cloudflare.com\/turnstile\/v0\/api.js/g)||[]).length,1);
 }
});
