// Repair Center Clicker — script.js
// Full-featured: upgrades, workers, autosave, random events, notifications.

const fmt = n => {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n/1e12).toFixed(2) + ' T';
  if (abs >= 1e9)  return (n/1e9).toFixed(2) + ' B';
  if (abs >= 1e6)  return (n/1e6).toFixed(2) + ' M';
  if (abs >= 1e3)  return (n/1e3).toFixed(2) + ' K';
  return Math.floor(n).toString();
};

const byId = id => document.getElementById(id);

const defaultState = {
  money: 0,
  perClick: 1,
  critChance: 0.06,
  critMult: 5,
  // multipliers that events change temporarily
  clickMultiplier: 1,
  perSecMultiplier: 1,
  costMultiplier: 1,
  upgrades: [
    { id: 'screwdriver', name: 'Screwdriver', base: 25, bonus: 1, count: 0, desc: '+1 zł per click' },
    { id: 'solder',      name: 'Soldering Iron', base: 180, bonus: 5, count: 0, desc: '+5 zł per click' },
    { id: 'scope',       name: 'Oscilloscope', base: 900, bonus: 25, count: 0, desc: '+25 zł per click' },
    { id: 'bench',       name: 'Workbench', base: 4500, bonus: 125, count: 0, desc: '+125 zł per click' },
  ],
  workers: [
    { id: 'intern',   name: 'Intern', base: 80, rate: .2,  count: 0, desc: '+0.2 zł/sec' },
    { id: 'tech',     name: 'Technician', base: 750, rate: 2,   count: 0, desc: '+2 zł/sec' },
    { id: 'engineer', name: 'Engineer', base: 5200, rate: 10, count: 0, desc: '+10 zł/sec' },
    { id: 'team',     name: 'Repair Team', base: 42000, rate: 60, count: 0, desc: '+60 zł/sec' },
  ],
  lastSave: Date.now(),
};

let state = load() || structuredClone(defaultState);

// transient active event trackers (not saved)
let activeEvents = []; // {name, timeoutId, revertFn, expiry}
const EVENT_HISTORY_MAX = 80;

// ---------- HELPERS ----------
function costOf(item){
  // base * 1.15^count * costMultiplier
  const basePrice = item.base * Math.pow(1.15, item.count);
  return Math.max(1, Math.floor(basePrice * (state.costMultiplier || 1)));
}

function calcPerSecond(){
  const base = state.workers.reduce((s,w)=> s + w.rate * w.count, 0);
  return base * (state.perSecMultiplier || 1);
}

function updateTopStats(){
  byId('money').textContent = fmt(state.money);
  byId('perClick').textContent = fmt(state.perClick * (state.clickMultiplier || 1));
  byId('perSec').textContent = fmt(calcPerSecond());
  renderActiveEventBadges();
}

// ---------- RENDER LISTS ----------
function renderLists(){
  const upgWrap = byId('upgrades');
  const wrkWrap = byId('workers');
  upgWrap.innerHTML = '';
  wrkWrap.innerHTML = '';

  state.upgrades.forEach(u => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `
      <div>
        <div class="title">${u.name} <span class="tiny">×${u.count}</span></div>
        <div class="desc">${u.desc}</div>
      </div>
      <div class="right">
        <div class="tiny">Cost: zł <span id="price-${u.id}">${fmt(costOf(u))}</span></div>
        <button id="buy-${u.id}">Buy</button>
      </div>`;
    upgWrap.appendChild(row);
    byId(`buy-${u.id}`).addEventListener('click', ()=> buyUpgrade(u.id));
  });

  state.workers.forEach(w => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `
      <div>
        <div class="title">${w.name} <span class="tiny">×${w.count}</span></div>
        <div class="desc">${w.desc}</div>
      </div>
      <div class="right">
        <div class="tiny">Cost: zł <span id="price-${w.id}">${fmt(costOf(w))}</span></div>
        <button id="hire-${w.id}">Hire</button>
      </div>`;
    wrkWrap.appendChild(row);
    byId(`hire-${w.id}`).addEventListener('click', ()=> hireWorker(w.id));
  });

  updateButtons();
}

function updateButtons(){
  state.upgrades.forEach(u => {
    const price = costOf(u);
    const btn = byId(`buy-${u.id}`);
    if (btn) btn.disabled = state.money < price;
    const priceEl = byId(`price-${u.id}`);
    if (priceEl) priceEl.textContent = fmt(price);
  });
  state.workers.forEach(w => {
    const price = costOf(w);
    const btn = byId(`hire-${w.id}`);
    if (btn) btn.disabled = state.money < price;
    const priceEl = byId(`price-${w.id}`);
    if (priceEl) priceEl.textContent = fmt(price);
  });
}

// ---------- ACTIONS ----------
function repairClick(x, y){
  const isCrit = Math.random() < state.critChance;
  const base = state.perClick;
  const gain = (isCrit ? base * state.critMult : base) * (state.clickMultiplier || 1);
  state.money += gain;
  floatLabel(x, y, `+zł${fmt(gain)}${isCrit ? ' ⚡' : ''}`);
  updateTopStats();
  updateButtons();
}

function buyUpgrade(id){
  const u = state.upgrades.find(v=>v.id===id);
  if (!u) return;
  const price = costOf(u);
  if (state.money < price) return;
  state.money -= price;
  u.count++;
  state.perClick += u.bonus;
  renderLists();
  updateTopStats();
  pushEventLog(`Bought ${u.name} (×${u.count}) — paid zł ${fmt(price)}`);
}

function hireWorker(id){
  const w = state.workers.find(v=>v.id===id);
  if (!w) return;
  const price = costOf(w);
  if (state.money < price) return;
  state.money -= price;
  w.count++;
  renderLists();
  updateTopStats();
  pushEventLog(`Hired ${w.name} (×${w.count}) — paid zł ${fmt(price)}`);
}

// ---------- FLOAT LABEL & NOTIFICATIONS ----------
function floatLabel(x, y, text){
  const btn = byId('repairBtn');
  const rect = btn.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float';
  // position near click, fallback to button center
  const left = (typeof x === 'number') ? x : rect.left + rect.width/2;
  const top  = (typeof y === 'number') ? y : rect.top + rect.height/2;
  el.style.left = `${left}px`;
  el.style.top  = `${top}px`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 900);
}

function showEventNotification(text, type='neutral'){
  // small popup near top-right
  const container = document.createElement('div');
  container.className = 'badge ' + (type==='positive' ? 'positive' : (type==='negative' ? 'negative' : ''));
  container.textContent = text;
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.right = '20px';
  wrap.style.top = '20px';
  wrap.style.zIndex = 9999;
  wrap.appendChild(container);
  document.body.appendChild(wrap);
  setTimeout(()=> {
    container.style.opacity = '0';
    container.style.transform = 'translateY(-8px)';
  }, 2200);
  setTimeout(()=> wrap.remove(), 2800);
}

// events log in UI
function pushEventLog(msg){
  const log = byId('eventsLog');
  const p = document.createElement('p');
  p.textContent = `${new Date().toLocaleTimeString()} — ${msg}`;
  log.prepend(p);
  // cap
  while(log.children.length > EVENT_HISTORY_MAX) log.removeChild(log.lastChild);
}

// display badges for active events
function renderActiveEventBadges(){
  const wrap = byId('activeEvents');
  wrap.innerHTML = '';
  activeEvents.forEach(a=>{
    const el = document.createElement('div');
    el.className = 'badge ' + (a.type==='positive'?'positive':(a.type==='negative'?'negative':''));;
    const remaining = Math.max(0, Math.ceil((a.expiry - Date.now())/1000));
    el.textContent = `${a.name} (${remaining}s)`;
    wrap.appendChild(el);
  });
}

// ---------- SAVE / LOAD / RESET ----------
function save(){
  // do not save activeEvents (transient)
  state.lastSave = Date.now();
  localStorage.setItem('svcClickerSave', JSON.stringify(state));
  pushEventLog('Game saved');
}

function load(){
  try{
    const raw = localStorage.getItem('svcClickerSave');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // basic validation
    if (typeof obj.money !== 'number') return null;
    // ensure missing keys filled
    return Object.assign(structuredClone(defaultState), obj);
  }catch(e){ return null; }
}

function resetGame(){
  if (!confirm('Reset progress?')) return;
  state = structuredClone(defaultState);
  clearAllEvents();
  renderLists();
  updateTopStats();
  save();
  pushEventLog('Progress reset');
}

function clearAllEvents(){
  activeEvents.forEach(a=> clearTimeout(a.timeoutId));
  activeEvents = [];
  // reset multipliers to default
  state.clickMultiplier = 1;
  state.perSecMultiplier = 1;
  state.costMultiplier = 1;
  renderActiveEventBadges();
}

// ---------- RANDOM EVENTS SYSTEM ----------
/*
Event model:
{ id, name, type ('positive'|'negative'|'neutral'), duration(ms), apply:()=>revertFn OR apply:()=>void }
When applied, if it returns revertFn it will be used to revert after duration.
*/
const EVENTS = [
  {
    id:'rush',
    name:'Rush Hour',
    type:'positive',
    duration: 15000,
    apply(){
      state.clickMultiplier *= 2;
      updateTopStats();
      return ()=> { state.clickMultiplier /= 2; updateTopStats(); };
    },
    desc:'+100% click income for 15s'
  },
  {
    id:'bonusOrder',
    name:'Big Order',
    type:'positive',
    duration: 0,
    apply(){
      const amount = 20 + Math.floor(Math.random()*60);
      state.money += amount;
      updateTopStats();
      return ()=>{};
    },
    desc:'Instant cash bonus'
  },
  {
    id:'freeTool',
    name:'Old Spare',
    type:'positive',
    duration:0,
    apply(){
      // give random small tool (increment cheapest upgrade)
      const sorted = [...state.upgrades].sort((a,b)=>a.base-b.base);
      sorted[0].count++;
      state.perClick += sorted[0].bonus;
      renderLists();
      updateTopStats();
      return ()=>{};
    },
    desc:'You found a free tool'
  },
  {
    id:'supplyShortage',
    name:'Supply Shortage',
    type:'negative',
    duration: 20000,
    apply(){
      state.costMultiplier *= 1.5;
      updateButtons();
      return ()=> { state.costMultiplier /= 1.5; updateButtons(); };
    },
    desc:'Prices increased for 20s'
  },
  {
    id:'discount',
    name:'Supplier Discount',
    type:'positive',
    duration: 20000,
    apply(){
      state.costMultiplier *= 0.7;
      updateButtons();
      return ()=> { state.costMultiplier /= 0.7; updateButtons(); };
    },
    desc:'Costs reduced for 20s'
  },
  {
    id:'staffStrike',
    name:'Staff Strike',
    type:'negative',
    duration: 15000,
    apply(){
      // temporarily reduce passive income to 0
      const prev = state.perSecMultiplier;
      state.perSecMultiplier = 0;
      updateTopStats();
      return ()=> { state.perSecMultiplier = prev; updateTopStats(); };
    },
    desc:'No passive income for 15s'
  },
  {
    id:'powerSurge',
    name:'Power Surge',
    type:'negative',
    duration:0,
    apply(){
      const loss = Math.min(state.money, 8 + Math.floor(Math.random()*30));
      state.money -= loss;
      updateTopStats();
      return ()=>{};
    },
    desc:'Unexpected loss (repairs damaged)'
  }
];

// choose random event by weight (positive and negative mixed)
function pickRandomEvent(){
  // slight bias: more neutral/positive than very-negative
  return EVENTS[Math.floor(Math.random()*EVENTS.length)];
}

function activateEvent(ev){
  // Apply effect; if it returns a revert function and duration > 0, schedule revert
  const revert = ev.apply();
  const expiry = Date.now() + (ev.duration || 0);
  let tid = null;
  if (ev.duration && ev.duration > 0 && typeof revert === 'function'){
    tid = setTimeout(()=>{
      try { revert(); } catch(e){ console.error(e); }
      removeActiveEventByTid(tid);
      pushEventLog(`${ev.name} ended`);
    }, ev.duration);
  } else {
    // immediate / one-shot event
    tid = null;
  }

  if (ev.duration && ev.duration > 0) {
    activeEvents.push({name:ev.name, type: ev.type || 'neutral', timeoutId: tid, revertFn: revert, expiry});
    pushEventLog(`${ev.name} started — ${ev.desc}`);
    showEventNotification(ev.name + (ev.desc ? `: ${ev.desc}` : ''), ev.type);
  } else {
    pushEventLog(`${ev.name}: ${ev.desc}`);
    showEventNotification(ev.name + (ev.desc ? `: ${ev.desc}` : ''), ev.type);
  }
  renderActiveEventBadges();
}

function removeActiveEventByTid(tid){
  activeEvents = activeEvents.filter(a=> a.timeoutId !== tid);
  renderActiveEventBadges();
}

// random event trigger loop
setInterval(()=>{
  // chance to trigger an event roughly every 6-10s
  if (Math.random() < 0.33) {
    const ev = pickRandomEvent();
    activateEvent(ev);
    updateButtons();
  }
}, 7000 + Math.random()*4000);

// also update active badges every second so timers decrease
setInterval(()=> renderActiveEventBadges(), 1000);

// ---------- TICKERS: passive income & autosave ----------
setInterval(()=>{
  const add = calcPerSecond() / 10; // 10 ticks per sec
  if (add > 0){
    state.money += add;
    updateTopStats();
    updateButtons();
  }
}, 100);

setInterval(()=>{ save(); }, 5000);

// ---------- UI hooks ----------
byId('repairBtn').addEventListener('click', (e)=>{
  repairClick(e.clientX, e.clientY);
});

window.addEventListener('keydown', (e)=>{
  if (e.code === 'Space') {
    e.preventDefault();
    const btn = byId('repairBtn');
    const r = btn.getBoundingClientRect();
    repairClick(r.left + r.width/2, r.top + r.height/2);
  }
});

byId('saveBtn').addEventListener('click', ()=>{
  save();
  floatLabel(window.innerWidth-120, 100, '💾 Saved');
});
byId('resetBtn').addEventListener('click', ()=> resetGame());

// ---------- Initialization ----------
renderLists();
updateTopStats();
pushEventLog('Game loaded');

// expose some functions for simple debugging (optional)
window.__svc = {
  state,
  save,
  load,
  resetGame,
  activateEventById: id=>{
    const e = EVENTS.find(x=>x.id===id);
    if (e) activateEvent(e);
  }
};
