const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('deploy/availability/Code.gs','utf8'),ctx);
function event(summary,status='confirmed'){return {summary,status,start:{date:'2027-01-01'},end:{date:'2027-01-04'}};}
test('only sanitized public fields, never private titles',()=>{
 const result=ctx.publicReservation_(event('[MT ZION] [DINING HALL] Private guest name'));
 assert.equal(result.status,'limited');
 assert.equal(JSON.stringify(result.spaces),'["Mt. Zion","Dining Hall"]');
 assert.deepEqual(Object.keys(result).sort(),['end','spaces','start','status']);
 assert.ok(!JSON.stringify(result).includes('Private'));
});
test('closed, unknown, informational and cancelled events',()=>{
 assert.equal(ctx.publicReservation_(event('[CLOSED] Summer camp')).status,'unavailable');
 assert.equal(ctx.publicReservation_(event('Private booking')).status,'confirm');
 assert.equal(ctx.publicReservation_(event('[LODGE: private-name]')).status,'confirm');
 assert.equal(ctx.publicReservation_(event('[INFO] Meeting')),null);
 assert.equal(ctx.publicReservation_(event('[WHOLE CAMP] Cancelled','cancelled')),null);
});
test('tentative holds and Free events still block',()=>{
 assert.equal(ctx.publicReservation_(event('[MT ZION] Hold','tentative')).status,'hold');
 const free=event('[WHOLE CAMP] Booking');free.transparency='transparent';
 assert.equal(ctx.publicReservation_(free).status,'unavailable');
});
test('camp-wide privacy-safe range uses exclusive Google end unchanged',()=>{
 const result=ctx.publicReservation_(event('[WHOLE CAMP] Private title'));
 assert.equal(result.start,'2027-01-01');assert.equal(result.end,'2027-01-04');
});
