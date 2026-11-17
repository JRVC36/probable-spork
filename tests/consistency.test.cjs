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
test('approved family, retreat, arrival and retention policies remain published',()=>{
 const registration=read('register.html'), faq=read('faq.html');
 assert.ok(registration.includes('one $100 deposit per family reservation'));
 assert.ok(registration.includes('name="payment_choice"'));
 assert.ok(registration.includes('No payment is collected on this page'));
 for(const page of ['register.html','index.html','summer-camp.html','faq.html']){
  const text=read(page);assert.ok(text.includes('Wednesday checkout is at 10:00 a.m. and check-in is at 4:00 p.m.'),page);
 }
 assert.ok(faq.includes('Both discounts can apply together'));
 assert.ok(faq.includes('$30 per person per day'));
 assert.ok(read('retreats.html').includes('up to one week'));
 assert.ok(read('privacy.html').includes('up to seven years'));
});
test('camp payment links remain separate from donations and do not assert paid status',()=>{
 const page=read('register.html'),backend=read('deploy/apps-script/Code.gs');
 for(const url of ['https://www.zeffy.com/en-US/ticketing/summer-camp-deposit-4','https://www.zeffy.com/en-US/ticketing/campsevents']){
  assert.ok(page.includes(url));assert.ok(backend.includes(url));
 }
 assert.ok(page.includes('wait for staff to confirm'));
 assert.ok(page.includes('There are no automatic future charges'));
 assert.ok(page.includes('not enrollment or a zero balance'));
 assert.ok(read('get-involved.html').includes('jrvc-donations'));
 assert.ok(!read('get-involved.html').includes('summer-camp-deposit-4'));
});
test('visitor clarity: calendar first, registration steps, meals and donation designations',()=>{
 const camp=read('summer-camp.html');
 assert.ok(camp.indexOf('id="camp-calendar"')<camp.indexOf('id="how-to-register"'));
 assert.equal((camp.match(/class="arrow-link camp-faq-link"/g)||[]).length,7);
 assert.ok(read('facilities.html').includes('$30 per person per day'));
 assert.ok(read('retreats.html').includes('Published rates'));
 assert.ok(!read('retreats.html').includes('Publishable rates'));
 assert.ok(!read('visit.html').includes('90 minutes from Charlotte'));
 assert.ok(read('get-involved.html').includes('Before you give:'));
 assert.ok(read('register.html').includes('Staff matches your payment'));
});
test('2027 homepage pricing and registration CTA tell one consistent story',()=>{
 const home=read('index.html');
 assert.ok(home.includes('<th scope="col">Tuition</th>'));
 for(const text of ['$99/night double; $125/night single','$475/camper/session','$560/camper/session','$75/adult (18+); $50/teen (12–17); $30/child (4–11) per night']) assert.ok(home.includes(text));
 assert.ok(home.includes('submitting a request does not reserve a place'));
 assert.ok(!home.includes('Contact us for registration details'));
 assert.ok(!home.includes('Registration is open now'));
 assert.ok(!home.includes('both day and residential campers'));
 assert.ok(home.includes('Choose a camp'));
});
test('2027 camp FAQ and gallery do not imply a JRVC day-camp program',()=>{
 const faq=read('faq.html'),home=read('index.html');
 assert.ok(faq.includes('Adult Camp, Valleywide 1 and 2, Drama Camp, Family Camp'));
 assert.ok(!faq.includes('youth day-camp program'));
 assert.ok(!faq.includes('day camp groups'));
 assert.ok(!home.includes('both day and residential campers'));
 // Community partner mission projects are distinct from JRVC's camp schedule.
 assert.ok(read('mission-trips.html').includes('running children&rsquo;s day camps'));
});
test('rendered phone links and contact/registration form endpoints are valid',()=>{
 const pages=['index.html','about.html','faq.html','facilities.html','get-involved.html','mission-trips.html','privacy.html','register.html','retreats.html','summer-camp.html','visit.html'];
 for(const page of pages){
  const html=read(page);
  assert.ok(!html.includes('about:invalid'),page);
  for(const [,phone] of html.matchAll(/href="tel:([^"]+)"/g)) assert.match(phone,/^\+1\d{10}$/,page+' phone '+phone);
 }
 const home=read('index.html');
 assert.ok(home.includes('class="head-phone" href="tel:+18283875736"'));
 const forms={ 'register.html':'registration','retreats.html':'retreat','mission-trips.html':'mission','visit.html':'contact','get-involved.html':'newsletter' };
 for(const [page,name] of Object.entries(forms)){
  const html=read(page);
  assert.ok(html.includes('action="https://script.google.com/macros/s/'),page+' form action');
  assert.ok(!html.includes('action="__ENDPOINT_'),page+' endpoint placeholder');
  assert.ok(html.includes('data-form="'+name+'"'),page+' form route '+name);
 }
});
test('Facilities meal rate has a contrast callout and no longer promotes climbing challenges',()=>{
 const facilities=read('facilities.html');
 const css=read('assets/css/site.css');
 assert.ok(facilities.includes('class="note facility-meal-note"'));
 assert.ok(facilities.includes('$30 per person per day'));
 assert.ok(facilities.includes('class="grid grid-3"'));
 assert.ok(!facilities.includes('Climbing &amp; challenge'));
 assert.ok(!facilities.includes('Climbing wall, low ropes'));
 assert.ok(css.includes('.bg-forest .facility-meal-note'));
 assert.ok(css.includes('background: var(--paper);'));
 assert.ok(css.includes('color: var(--ink);'));
 assert.ok(!read('mission-trips.html').includes('no rental charge for the climbing wall'));
});
