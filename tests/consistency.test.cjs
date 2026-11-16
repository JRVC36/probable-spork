const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('generated pages no longer advertise retired camp dates or pricing',()=>{
 for(const name of ['faq','about','register','index','get-involved']){
  const s=read(name+'.html');
  for(const old of ['Register for 2026','$485','$545','Six sessions.','six day camp weeks']) assert.ok(!s.includes(old),name+': '+old);
 }
 assert.ok(!read('retreats.html').includes('April 17&ndash;19, 2026'));
 assert.ok(!read('mission-trips.html').includes('<option>March 2026'));
});
test('registration acknowledgment wording and details are consistent',()=>{
 assert.ok(read('register.html').includes('Registration request received.'));
 const backend=read('deploy/apps-script/Code.gs');
 assert.ok(!backend.includes('for Summer 2026 at'));
 for(const field of ['stay','occupancy','family_members'])assert.ok(backend.includes('data.'+field));
});
test('backend enforces session-specific registration requirements',()=>{
 const context=vm.createContext({console});vm.runInContext(read('deploy/apps-script/Code.gs'),context);
 const valid=context.validRegistrationOptions_;
 assert.equal(valid({session:'valleywide-1',grade:'3'}),true);
 assert.equal(valid({session:'valleywide-1',grade:'2'}),false);
 assert.equal(valid({session:'mh-paddle',grade:'Graduating senior'}),false);
 assert.equal(valid({session:'sh-paddle',grade:'Graduating senior'}),true);
 assert.equal(valid({session:'old-session',grade:'6'}),false);
 assert.equal(valid({session:'adult-camp',grade:'Adult / not applicable',stay:'full-week',occupancy:'single'}),true);
 assert.equal(valid({session:'adult-camp',grade:'Adult / not applicable'}),false);
 assert.equal(valid({session:'family-camp',stay:'first-half',family_members:'Child, 7'}),true);
 assert.equal(valid({session:'family-camp',stay:'first-half'}),false);
});
