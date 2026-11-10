/* Public, privacy-filtered availability only; never consume raw calendar events. */
(function () {
  'use strict';
  var root = document.querySelector('[data-availability-endpoint]');
  if (!root) return;
  var zone = 'America/New_York';
  var dayFormat = new Intl.DateTimeFormat('en-CA', {timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit'});
  function dayKey(date) {
    var p = dayFormat.formatToParts(date), values = {};
    p.forEach(function (x) { values[x.type] = x.value; });
    return values.year + '-' + values.month + '-' + values.day;
  }
  var today = dayKey(new Date()), base = new Date(today + 'T12:00:00Z');
  var month = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  var firstMonth = month.getTime(), lastMonth = Date.UTC(base.getUTCFullYear(), base.getUTCMonth()+12, 1);
  var data = null, selected = null;
  var grid = root.querySelector('[data-availability-grid]');
  var message = root.querySelector('[data-availability-message]');
  function fresh() { return data && Date.now() - Date.parse(data.updated) < 15*60000 && Date.parse(data.updated) <= Date.now()+60000; }
  function render() {
    root.querySelector('[data-month-label]').textContent = month.toLocaleDateString('en-US', {month:'long',year:'numeric',timeZone:'UTC'});
    root.querySelector('[data-month-prev]').disabled = month.getTime() <= firstMonth;
    root.querySelector('[data-month-next]').disabled = month.getTime() >= lastMonth;
    grid.replaceChildren();
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function (day) {var el=document.createElement('span');el.textContent=day;el.className='availability-weekday';grid.append(el);});
    for (var i=0;i<month.getUTCDay();i++) {var blank=document.createElement('span');blank.setAttribute('aria-hidden','true');grid.append(blank);}
    var count = new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
    for (var n=1;n<=count;n++) {
      var key = month.getUTCFullYear()+'-'+String(month.getUTCMonth()+1).padStart(2,'0')+'-'+String(n).padStart(2,'0');
      var status = 'confirm', spaces=[];
      if (fresh() && key >= data.from && key < data.through) {
        status='open';
        var priority={open:0,limited:1,hold:2,confirm:3,unavailable:4};
        data.ranges.forEach(function (r) {
          var start=r.start.length===10?r.start:dayKey(new Date(r.start));
          // Google all-day ends are exclusive. For timed ends, subtract a millisecond.
          var end=r.end.length===10?r.end:dayKey(new Date(Date.parse(r.end)-1))+'~';
          if(key>=start && key<end) {if(priority[r.status]>priority[status])status=r.status;spaces=spaces.concat(r.spaces);}
        });
      }
      var labels={open:'Open',limited:'Limited',hold:'Hold',confirm:'Confirm',unavailable:'Unavailable'};
      var button=document.createElement('button');button.type='button';button.className='availability-day availability-'+status;
      button.textContent=n+' · '+labels[status];button.disabled=key<today;
      button.setAttribute('aria-label',key+': '+labels[status]+(spaces.length?' — reserved: '+Array.from(new Set(spaces)).join(', '):''));
      button.setAttribute('aria-pressed',String(key===selected));
      button.dataset.date=key;
      button.addEventListener('click',function(e){selected=e.currentTarget.dataset.date;var arrival=document.getElementById('rin');if(arrival){arrival.value=selected;arrival.dispatchEvent(new Event('change',{bubbles:true}));}root.querySelector('[data-selected-date]').textContent='Preferred arrival: '+selected+'. Add your departure date in the inquiry form. Availability requires confirmation.';render();});
      grid.append(button);
    }
  }
  root.querySelector('[data-month-prev]').addEventListener('click',function(){month.setUTCMonth(month.getUTCMonth()-1);render();});
  root.querySelector('[data-month-next]').addEventListener('click',function(){month.setUTCMonth(month.getUTCMonth()+1);render();});
  async function refresh() {
    var endpoint=root.dataset.availabilityEndpoint;
    if(!endpoint){message.textContent='Contact us to confirm availability. Online availability is not connected yet.';render();return;}
    try {
      var response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error();
      var next=await response.json();
      if(!next.ok || next.timeZone!==zone || !Array.isArray(next.ranges) || !Number.isFinite(Date.parse(next.updated)))throw Error();
      next.ranges.forEach(function(r){if(!['confirm','hold','unavailable','limited'].includes(r.status)||!Array.isArray(r.spaces)||!r.start||!r.end)throw Error();});
      data=next;
      message.textContent=fresh()?'Last updated '+new Date(data.updated).toLocaleString('en-US',{timeZone:zone})+' Eastern Time.':'Availability is out of date. Contact us to confirm.';
    } catch(e) {data=null;message.textContent='Availability could not be verified. Please contact us to confirm your dates.';}
    render();
  }
  render();refresh();setInterval(refresh,5*60000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});
})();
