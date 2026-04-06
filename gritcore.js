/* STORAGE — @capacitor/preferences (primary) with localStorage fallback for web preview */
const store={
  _p(){return window?.Capacitor?.Plugins?.Preferences||null;},
  async get(key){
    const P=this._p();
    if(P){try{const r=await P.get({key});if(r.value!==null)return{value:r.value};}catch{}}
    const v=localStorage.getItem('gc:'+key);return v!==null?{value:v}:null;
  },
  async set(key,val){
    const P=this._p();
    if(P){try{await P.set({key,value:val});return{value:val};}catch{}}
    localStorage.setItem('gc:'+key,val);return{value:val};
  }
};

/* HTML-escape user strings for safe innerHTML insertion */
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
const APP_VERSION='0.32';

/* HEAT — discipline completion accent + marble warmth overlay */
function updateHeat(completed,total){
  const pct=total>0?completed/total:0;
  const r=Math.round(232+(_accentRGB.r-232)*pct);
  const g=Math.round(232+(_accentRGB.g-232)*pct);
  const b=Math.round(232+(_accentRGB.b-232)*pct);
  const root=document.documentElement;
  root.style.setProperty('--heat',`rgb(${r},${g},${b})`);
  // Accelerating curve: barely visible at low %, dramatic at high %
  const curve = pct * pct; // quadratic acceleration
  const overlayAlpha=(completed===total&&total>0)?'0.220':(curve*0.20).toFixed(3);
  root.style.setProperty('--heat-overlay-alpha',overlayAlpha);
  root.style.setProperty('--heat-color',`rgba(${_accentRGB.r},${_accentRGB.g},${_accentRGB.b},${(0.3+pct*0.7).toFixed(3)})`);
  root.style.setProperty('--heat-pct',pct.toFixed(3));
  root.style.setProperty('--heat-glow-a',(curve*0.35).toFixed(3));
  const veil=document.getElementById('heat-veil');
  if(veil){
    document.documentElement.style.setProperty('--veil-base',overlayAlpha);
    veil.classList.toggle('pulsing',pct>=0.5&&total>0);
  }
  updateMotivation();
}
function heatFlash(){
  const veil=document.getElementById('heat-veil');
  if(!veil)return;
  veil.classList.add('flash');
  setTimeout(()=>veil.classList.remove('flash'),500);
}
function updateMotivation(){ return; }

/* ── Pixel Flame Renderer (60fps, 9×14 grid, 8 colors) ── */
const FW=9,FH=14;
const FC=['#fffbe6','#fff176','#ffcc00','#ffab00','#ff6d00','#e64a19','#bf360c','#7f1b0a'];
// 8 frames, each a flat string: chars 0-7=color index, '.'=empty, row by row top→bottom
const FF=[
  '....0....'+'.....0...'+'.....1...'+
  '...010...'+
  '...121...'+
  '..1232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+
  '....0....'+
  '...01....'+
  '...101...'+
  '...121...'+
  '..2232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+
  '...0.....'+
  '...10....'+
  '...110...'+
  '..1121...'+
  '..2232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+'.........'+
  '....0....'+
  '...010...'+
  '..1121...'+
  '..1232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+'.........'+
  '...0.....'+
  '...100...'+
  '..1121...'+
  '..2232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+
  '....0....'+
  '....10...'+
  '...011...'+
  '...1210..'+
  '..2232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '.........'+
  '.........'+
  '....0....'+
  '...010...'+
  '...1210..'+
  '..12321..'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  '',
  '....0....'+
  '.........'+
  '...0.....'+
  '...100...'+
  '...121...'+
  '..1232...'+'..23432..'+'..34543..'+'.345654.'+'..45654..'+'..56765..'+'..67676..'+'...777...'+'.........'+
  ''
];
// Pre-parse frames into pixel arrays
const FLAME_FRAMES=FF.map(s=>{
  const px=[];
  for(let i=0;i<FW*FH&&i<s.length;i++){
    if(s[i]!=='.'){px.push([i%FW,Math.floor(i/FW),parseInt(s[i])]);}
  }
  return px;
});
let _flameCanvases=[];
let _flameRafId=null,_flameFrame=0,_flameTick=0;
const FLAME_FPF=2; // frames per animation frame (60fps / 2 = 30fps animation, smooth)
function createPixelFlame(size){
  const c=document.createElement('canvas');
  c.width=FW;c.height=FH;
  c.className='pixel-flame';
  c.style.width=size+'px';
  c.style.height=Math.round(size*FH/FW)+'px';
  c.style.imageRendering='pixelated';
  _flameCanvases.push(c);
  if(!_flameRafId) _flameRafId=requestAnimationFrame(flameLoop);
  return c;
}
function drawFlameFrame(c,frameIdx){
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,FW,FH);
  const f=FLAME_FRAMES[frameIdx%FLAME_FRAMES.length];
  f.forEach(([x,y,ci])=>{ctx.fillStyle=FC[ci];ctx.fillRect(x,y,1,1);});
}
function flameLoop(){
  _flameTick++;
  if(_flameTick>=FLAME_FPF){
    _flameTick=0;
    _flameFrame=(_flameFrame+1)%FLAME_FRAMES.length;
    _flameCanvases.forEach(c=>{if(c.isConnected)drawFlameFrame(c,_flameFrame);});
    _flameCanvases=_flameCanvases.filter(c=>c.isConnected);
  }
  if(_flameCanvases.length>0) _flameRafId=requestAnimationFrame(flameLoop);
  else _flameRafId=null;
}
function pixelFlameHTML(size,id){
  return `<span class="pf-slot" data-pf-size="${size}" ${id?'id="'+id+'"':''}></span>`;
}
function emberSVGHTML(w,anim){const h=Math.round(w*1.4);return `<svg class="ember-svg" viewBox="0 0 10 14" fill="currentColor" width="${w}" height="${h}"${anim?' style="animation:emberGlow 2s ease-in-out infinite"':''}><path d="M5 0C2.5 4 0 7 0 9.5A5 5 0 0 0 10 9.5C10 7 7.5 4 5 0Z" opacity="0.55"/><path d="M5 4C3.5 6.5 2.5 8.5 2.5 10a2.5 2.5 0 0 0 5 0C7.5 8.5 6.5 6.5 5 4Z"/></svg>`;}
function initPixelFlames(){
  document.querySelectorAll('.pf-slot').forEach(el=>{
    if(el._pfDone)return;
    el._pfDone=true;
    const size=parseInt(el.dataset.pfSize)||16;
    const c=createPixelFlame(size);
    drawFlameFrame(c,_flameFrame);
    el.appendChild(c);
  });
}

/* ── Combo Streak System ── */
let comboCount=0, comboTimer=null, comboFadeTimer=null;
const COMBO_WINDOW=4000; // ms between marks to keep combo alive
const COMBO_LINGER=2000; // ms to show after last hit before fading
function comboEnabled(){ return getPref('combo'); }
function hapticEnabled(){ return getPref('haptic'); }
function comboVibrate(count){
  if(!hapticEnabled()||!navigator.vibrate)return;
  // Accelerating: short pulses that get stronger with combo
  const ms=Math.min(8+count*4,40);
  navigator.vibrate(ms);
}
function comboHit(evt){
  if(!comboEnabled())return;
  comboCount++;
  if(comboCount<2){ comboVibrate(1); return; } // vibrate on first hit but no badge
  clearTimeout(comboTimer);
  clearTimeout(comboFadeTimer);
  const badge=document.getElementById('combo-badge');
  const num=document.getElementById('combo-num');
  if(!badge||!num)return;
  // Position at finger press
  if(evt){
    const x=evt.clientX||evt.pageX||0;
    const y=evt.clientY||evt.pageY||0;
    badge.style.left=x+'px';
    badge.style.top=Math.max(y-30,60)+'px'; // offset up so it's above finger
    badge.style.transform='translate(-50%,-50%) scale(0)';
  }
  num.textContent='x'+comboCount;
  // Escalation tiers
  badge.className='combo-badge visible';
  if(comboCount>=8) badge.classList.add('x8');
  else if(comboCount>=5) badge.classList.add('x5');
  // Glow on number at x3+
  num.classList.toggle('glow',comboCount>=3);
  // Pop animation — re-trigger
  void badge.offsetWidth;
  badge.classList.add('pop');
  // Shake at x4+
  if(comboCount>=4){
    setTimeout(()=>{ badge.classList.remove('pop'); badge.classList.add('shake'); },400);
    setTimeout(()=>badge.classList.remove('shake'),750);
  }
  // Haptic — accelerates with combo
  comboVibrate(comboCount);
  // Stay visible, then fade after COMBO_WINDOW of no hits
  comboTimer=setTimeout(()=>{
    // Linger visible briefly then fade
    comboFadeTimer=setTimeout(comboFade,COMBO_LINGER);
  },COMBO_WINDOW-COMBO_LINGER);
}
function comboFade(){
  comboCount=0;
  const badge=document.getElementById('combo-badge');
  if(badge){ badge.classList.remove('visible'); setTimeout(()=>{badge.className='combo-badge';badge.style.left='';badge.style.top='';badge.style.transform='';},300); }
}
function comboReset(){
  clearTimeout(comboTimer);
  clearTimeout(comboFadeTimer);
  comboCount=0;
  const badge=document.getElementById('combo-badge');
  if(badge){badge.className='combo-badge';badge.style.left='';badge.style.top='';badge.style.transform='';}
}

/* STREAK TIERS */
const TIERS=[
  {min:0,  max:0,   name:'Awaiting',     sub:'Your forge is ready.',         color:'#b0a898',glow:'rgba(176,168,152,.1)',      anim:'none',spd:0,  sz:10,bgA:.06},
  {min:1,  max:1,   name:'Sparked',      sub:'The ember catches.',          color:'#FBBF24',glow:'rgba(251,191,36,.2)',       anim:'f1',  spd:3.5,sz:11,bgA:.07},
  {min:2,  max:2,   name:'Kindled',      sub:'Something is waking.',        color:'#F59E0B',glow:'rgba(245,158,11,.25)',      anim:'f2',  spd:3.2,sz:11,bgA:.08},
  {min:3,  max:4,   name:'Lit',          sub:'The flame is alive.',         color:'#F59E0B',glow:'rgba(245,158,11,.3)',       anim:'f3',  spd:3.0,sz:12,bgA:.09},
  {min:5,  max:6,   name:'Smouldering',  sub:'Heat without smoke.',         color:'#F07020',glow:'rgba(240,112,32,.35)',      anim:'f4',  spd:2.8,sz:12,bgA:.10},
  {min:7,  max:13,  name:'Burning',      sub:'A real flame now.',           color:'#EA580C',glow:'rgba(234,88,12,.4)',        anim:'f5',  spd:2.4,sz:13,bgA:.11},
  {min:14, max:20,  name:'On Fire',      sub:'Two weeks of iron will.',     color:'#DC4A0A',glow:'rgba(220,74,10,.45)',       anim:'f6',  spd:2.1,sz:13,bgA:.12},
  {min:21, max:29,  name:'Blazing',      sub:'Three weeks. No excuses.',    color:'#E04818',glow:'rgba(224,72,24,.5)',        anim:'f7',  spd:1.8,sz:14,bgA:.13},
  {min:30, max:59,  name:'Inferno',      sub:'A month of discipline.',      color:'#CC3010',glow:'rgba(204,48,16,.55)',       anim:'f8',  spd:1.4,sz:15,bgA:.14},
  {min:60, max:89,  name:'Scorched Earth',sub:'You burned the doubt away.', color:'#B91C1C',glow:'rgba(185,28,28,.58)',       anim:'f9',  spd:1.1,sz:15,bgA:.15},
  {min:90, max:119, name:'Iron Will',    sub:'90 days. Unshakeable.',       color:'#9F1239',glow:'rgba(159,18,57,.62)',       anim:'f10', spd:.95,sz:16,bgA:.16},
  {min:120,max:179, name:'Unbroken',     sub:'Four months. Still standing.',color:'#C2410C',glow:'rgba(194,65,12,.64)',       anim:'f11', spd:.85,sz:16,bgA:.17},
  {min:180,max:269, name:'Forge Master', sub:'Half a year of iron.',        color:'#EA580C',glow:'rgba(234,88,12,.68)',       anim:'f12', spd:.75,sz:17,bgA:.18},
  {min:270,max:364, name:'Ascendant',    sub:'Nine months. You are rare.',  color:'#FF7700',glow:'rgba(255,119,0,.72)',       anim:'f13', spd:.65,sz:17,bgA:.19},
  {min:365,max:9999,name:'Legend',       sub:'365 days. One full year.',    color:'#FF7700',glow:'rgba(255,119,0,.78)',       anim:'f14', spd:.55,sz:18,bgA:.20},
];
function getTier(n){return TIERS.find(t=>n>=t.min&&n<=t.max)||TIERS[0];}

/* ── ACCENT COLOR ── */
const ACCENT_COLORS = {
  gold:    {hex:'#c9a84c', r:201, g:168, b:76,  glow:'rgba(201,168,76,.35)',  bor:'rgba(201,168,76,.25)',  bg:'rgba(201,168,76,.12)'},
  rose:    {hex:'#c94c6e', r:201, g:76,  b:110, glow:'rgba(201,76,110,.35)',  bor:'rgba(201,76,110,.25)',  bg:'rgba(201,76,110,.12)'},
  ember:   {hex:'#c97a4c', r:201, g:122, b:76,  glow:'rgba(201,122,76,.35)',  bor:'rgba(201,122,76,.25)',  bg:'rgba(201,122,76,.12)'},
  crimson: {hex:'#c94c4c', r:201, g:76,  b:76,  glow:'rgba(201,76,76,.35)',   bor:'rgba(201,76,76,.25)',   bg:'rgba(201,76,76,.12)'},
  sunset:  {hex:'#c9884c', r:201, g:136, b:76,  glow:'rgba(201,136,76,.35)',  bor:'rgba(201,136,76,.25)',  bg:'rgba(201,136,76,.12)'},
  peach:   {hex:'#c9a07a', r:201, g:160, b:122, glow:'rgba(201,160,122,.35)', bor:'rgba(201,160,122,.25)', bg:'rgba(201,160,122,.12)'},
  ice:     {hex:'#4ca5c9', r:76,  g:165, b:201, glow:'rgba(76,165,201,.35)',  bor:'rgba(76,165,201,.25)',  bg:'rgba(76,165,201,.12)'},
  jade:    {hex:'#4cc98a', r:76,  g:201, b:138, glow:'rgba(76,201,138,.35)',  bor:'rgba(76,201,138,.25)',  bg:'rgba(76,201,138,.12)'},
  violet:  {hex:'#8a4cc9', r:138, g:76,  b:201, glow:'rgba(138,76,201,.35)',  bor:'rgba(138,76,201,.25)',  bg:'rgba(138,76,201,.12)'},
  ocean:   {hex:'#4c7ac9', r:76,  g:122, b:201, glow:'rgba(76,122,201,.35)',  bor:'rgba(76,122,201,.25)',  bg:'rgba(76,122,201,.12)'},
  mint:    {hex:'#4cc9b8', r:76,  g:201, b:184, glow:'rgba(76,201,184,.35)',  bor:'rgba(76,201,184,.25)',  bg:'rgba(76,201,184,.12)'},
  sky:     {hex:'#7ab8c9', r:122, g:184, b:201, glow:'rgba(122,184,201,.35)', bor:'rgba(122,184,201,.25)', bg:'rgba(122,184,201,.12)'},
  silver:  {hex:'#a0a0a8', r:160, g:160, b:168, glow:'rgba(160,160,168,.35)', bor:'rgba(160,160,168,.25)', bg:'rgba(160,160,168,.12)'},
  slate:   {hex:'#7088a0', r:112, g:136, b:160, glow:'rgba(112,136,160,.35)', bor:'rgba(112,136,160,.25)', bg:'rgba(112,136,160,.12)'},
  ivory:   {hex:'#c9c0a8', r:201, g:192, b:168, glow:'rgba(201,192,168,.35)', bor:'rgba(201,192,168,.25)', bg:'rgba(201,192,168,.12)'},
};
const ACCENT_GROUPS = {
  WARM:    ['gold','rose','ember','crimson','sunset','peach'],
  COOL:    ['ice','jade','violet','ocean','mint','sky'],
  NEUTRAL: ['silver','slate','ivory'],
};
let _accentKey = 'gold';
let _accentRGB = {r:201, g:168, b:76};

function setAccentColor(key) {
  if(key!=='gold'&&_paywallLocked()){showUpgradePrompt();return;}
  const c = ACCENT_COLORS[key];
  if (!c) return;
  _accentKey = key;
  _accentRGB = {r:c.r, g:c.g, b:c.b};
  const root = document.documentElement;
  root.style.setProperty('--gold', c.hex);
  root.style.setProperty('--gold-true', c.hex);
  root.style.setProperty('--gold-glow', c.glow);
  root.style.setProperty('--goldb', c.bg);
  root.style.setProperty('--goldbor', c.bor);
  root.style.setProperty('--hm1', `rgba(${c.r},${c.g},${c.b},.1)`);
  root.style.setProperty('--hm2', `rgba(${c.r},${c.g},${c.b},.25)`);
  root.style.setProperty('--hm3', `rgba(${c.r},${c.g},${c.b},.48)`);
  root.style.setProperty('--hm4', `rgba(${c.r},${c.g},${c.b},.72)`);
  root.style.setProperty('--gold-05', `rgba(${c.r},${c.g},${c.b},.05)`);
  root.style.setProperty('--gold-15', `rgba(${c.r},${c.g},${c.b},.15)`);
  root.style.setProperty('--gold-60', `rgba(${c.r},${c.g},${c.b},.60)`);
  root.style.setProperty('--accent-r', c.r);
  root.style.setProperty('--accent-g', c.g);
  root.style.setProperty('--accent-b', c.b);
  const veil = document.getElementById('heat-veil');
  if (veil) veil.style.background = `linear-gradient(180deg,rgba(${c.r},${c.g},${c.b},0.08) 0%,rgba(${c.r},${c.g},${c.b},0.03) 40%,transparent 75%)`;
  localStorage.setItem('gc1:accentColor', key);
  const hh = effH(), ll = effL(), td = getDate();
  const l = ll[td] || {};
  const done = hh.filter(h => l[h.id] === 'done').length;
  updateHeat(done, hh.length);
  _updateAccentChips();
}
function _updateAccentChips() {
  document.querySelectorAll('.accent-chip').forEach(el => {
    const k = el.dataset.accent;
    const active = k === _accentKey;
    const c = ACCENT_COLORS[k];
    if (!c) return;
    el.style.borderColor = active ? 'var(--ct)' : 'rgba(255,255,255,.15)';
    el.style.boxShadow = active ? '0 0 8px ' + c.glow : '';
    el.setAttribute('aria-checked', String(active));
    el.innerHTML = active ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ct)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '';
  });
}

/* ── ACHIEVEMENTS ── */
const ACHIEVEMENTS = [
  { id:'first_log',    icon:'⚡', name:'First Spark',     desc:'Log your first discipline' },
  { id:'first_forge',  icon:'🔨', name:'Forge Master',    desc:'Create your first discipline' },
  { id:'streak_3',     icon:'🔥', name:'On A Roll',       desc:'Achieve a 3-day streak' },
  { id:'streak_7',     icon:'⚔️', name:'Week Warrior',    desc:'Achieve a 7-day streak' },
  { id:'streak_14',    icon:'🏹', name:'Fortnight Force', desc:'Achieve a 14-day streak' },
  { id:'streak_30',    icon:'👑', name:'Iron Will',       desc:'Achieve a 30-day streak' },
  { id:'streak_60',    icon:'🗡️', name:'Relentless',      desc:'Achieve a 60-day streak' },
  { id:'streak_100',   icon:'💎', name:'Legendary',       desc:'Achieve a 100-day streak' },
  { id:'streak_365',   icon:'🌟', name:'Eternal Flame',   desc:'Achieve a 365-day streak' },
  { id:'perfect_day',  icon:'✨', name:'Perfect Day',     desc:'Complete every discipline in one day' },
  { id:'perfect_week', icon:'🏅', name:'Flawless Week',   desc:'7 consecutive perfect days' },
  { id:'centurion',    icon:'💯', name:'Centurion',       desc:'Log 100 total disciplines' },
  { id:'log_500',      icon:'📜', name:'Chronicler',      desc:'Log 500 total disciplines' },
  { id:'log_1000',     icon:'🔱', name:'Titan',           desc:'Log 1000 total disciplines' },
  { id:'five_habits',  icon:'⚒️', name:'Disciplined',    desc:'Forge 5 disciplines' },
  { id:'ten_habits',   icon:'⚙️', name:'Arsenal',        desc:'Forge 10 disciplines' },
  { id:'no_miss',      icon:'🛡️', name:'Unbroken',       desc:'Complete all with no fails today' },
  { id:'comeback',     icon:'🦅', name:'Phoenix Rise',    desc:'Complete all after a failed day' },
];

function loadAch() { try { return JSON.parse(localStorage.getItem('gc1:ach')||'{}'); } catch(e){ return {}; } }
function saveAch(a) { localStorage.setItem('gc1:ach', JSON.stringify(a)); }

function checkAchievements() {
  if(_paywallLocked())return;
  const earned = loadAch();
  if(Object.keys(earned).length >= ACHIEVEMENTS.length) return;
  const hh = effH(), ll = effL();
  let totalDone = 0, perfectDayFound = false;
  const today = getDate(), todayLog = ll[today] || {};
  const perfectDays = [];
  Object.entries(ll).forEach(([d, dayLog]) => {
    let dd = 0;
    hh.forEach(h => { if(dayLog[h.id]==='done'){ totalDone++; dd++; } });
    if(hh.length && dd === hh.length) { perfectDayFound = true; perfectDays.push(d); }
  });
  perfectDays.sort();
  let maxConsecPerfect = 0, curConsec = 1;
  for(let i = 1; i < perfectDays.length; i++){
    const prev = new Date(perfectDays[i-1]), cur = new Date(perfectDays[i]);
    if((cur - prev) === 86400000) curConsec++; else curConsec = 1;
    if(curConsec > maxConsecPerfect) maxConsecPerfect = curConsec;
  }
  if(perfectDays.length === 1) maxConsecPerfect = 1;
  const streak = calcStreak();
  const realHabits = isPlaceholder ? [] : habits;
  const yesterday = daysBack(1, today);
  const yLog = ll[yesterday] || {};
  const yFailed = hh.length > 0 && Object.values(yLog).includes('failed');
  const todayAllDone = hh.length > 0 && hh.every(h => todayLog[h.id] === 'done');

  const conditions = {
    first_log:    totalDone >= 1,
    first_forge:  realHabits.length >= 1,
    streak_3:     streak >= 3,
    streak_7:     streak >= 7,
    streak_14:    streak >= 14,
    streak_30:    streak >= 30,
    streak_60:    streak >= 60,
    streak_100:   streak >= 100,
    streak_365:   streak >= 365,
    perfect_day:  perfectDayFound,
    perfect_week: maxConsecPerfect >= 7,
    centurion:    totalDone >= 100,
    log_500:      totalDone >= 500,
    log_1000:     totalDone >= 1000,
    five_habits:  realHabits.length >= 5,
    ten_habits:   realHabits.length >= 10,
    no_miss:      hh.length > 0 && !Object.values(todayLog).includes('failed') && hh.some(h=>todayLog[h.id]==='done'),
    comeback:     yFailed && todayAllDone,
  };

  let queue = [];
  ACHIEVEMENTS.forEach(a => {
    if(!earned[a.id] && conditions[a.id]) {
      earned[a.id] = Date.now();
      queue.push(a);
    }
  });
  if(queue.length) {
    saveAch(earned);
    let i = 0;
    function showNext() {
      if(i >= queue.length) return;
      showAchBanner(queue[i++]);
      setTimeout(showNext, 4200);
    }
    showNext();
  }
}

let achBannerTimer = null;
function showAchBanner(ach) {
  const b = document.getElementById('ach-banner');
  if(!b) return;
  document.getElementById('ach-icon').textContent = ach.icon;
  document.getElementById('ach-name').textContent = ach.name;
  document.getElementById('ach-desc').textContent = ach.desc;
  b.classList.add('show');
  if(achBannerTimer) clearTimeout(achBannerTimer);
  achBannerTimer = setTimeout(() => { b.classList.remove('show'); achBannerTimer = null; }, 3500);
}
function dismissAchBanner(){
  const b = document.getElementById('ach-banner');
  if(!b) return;
  if(achBannerTimer){ clearTimeout(achBannerTimer); achBannerTimer = null; }
  b.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
  b.style.transform = 'translateX(-50%) translateY(-120%)';
  b.style.opacity = '0';
  setTimeout(() => { b.classList.remove('show'); b.style.cssText = ''; }, 300);
}
(function initAchSwipe(){
  const b = document.getElementById('ach-banner');
  if(!b) return;
  let startY = 0, curY = 0, dragging = false;
  b.addEventListener('touchstart', function(e){
    if(!b.classList.contains('show')) return;
    startY = curY = e.touches[0].clientY;
    dragging = true;
    b.style.transition = 'none';
  }, {passive:true});
  b.addEventListener('touchmove', function(e){
    if(!dragging) return;
    curY = e.touches[0].clientY;
    const dy = curY - startY;
    if(dy < 0){
      b.style.transform = `translateX(-50%) translateY(${dy}px)`;
      b.style.opacity = String(Math.max(0, 1 + dy / 80));
    }
  }, {passive:true});
  b.addEventListener('touchend', function(){
    if(!dragging) return;
    dragging = false;
    const dy = curY - startY;
    if(dy < -30){
      dismissAchBanner();
    } else {
      b.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      b.style.transform = 'translateX(-50%) translateY(0)';
      b.style.opacity = '1';
      setTimeout(() => { b.style.cssText = ''; }, 250);
    }
  }, {passive:true});
})();

function flameData(days){
  const t=Math.min(days,365)/365;
  const fast=Math.log(1+days*8)/Math.log(1+365*8);
  const slow=1-(1-t)*(1-t);
  function lF(a,b){return a+(b-a)*Math.min(1,Math.max(0,fast));}
  function lS(a,b){return a+(b-a)*Math.min(1,Math.max(0,slow));}
  const tierIdx=TIERS.findIndex((_,i,a)=>i===a.length-1||days<a[i+1].min);
  return{
    compactSize:Math.round(lF(11,22)),
    bigSize:Math.round(lF(32,52)),
    hue:Math.round(lS(0,-32)),
    sat:+lF(.6,1.75).toFixed(2),
    bloodOp:+lS(0,.95).toFixed(2),
    lavaH:Math.round(lS(4,82)),
    drips:Math.min(5,Math.round(lS(1,5))),
    dripSpeed:+lS(4.5,1.8).toFixed(1),
    flickerSpd:+lF(2.8,1.1).toFixed(1),
    tierIdx,
    iconSize(i){return Math.round(10+i*(18/(TIERS.length-1)));}
  };
}
function renderStreakCard(days){
  const fd=flameData(days);
  const tier=getTier(days);
  const tierIdx=TIERS.indexOf(tier);
  const nextTier=TIERS[tierIdx+1]||null;
  const pct=nextTier?Math.min(100,Math.round(((days-tier.min)/(Math.max(1,nextTier.min-tier.min)))*100)):100;
  const allTierRows=TIERS.filter(t=>t.min>0);
  const pastRows=allTierRows.filter(t=>days>t.max&&TIERS.indexOf(t)<tierIdx);
  const lockedRows=allTierRows.filter(t=>t.min>days&&t!==tier);
  const visibleTiers=[
    ...pastRows.slice(-1),
    tier,
    ...lockedRows.slice(0,3)
  ];
  let lockedCount=0;
  const lockedOpacity=[.72,.38,.14];
  const lockedBlur=[0.5,1.8,3.5];
  const rows=visibleTiers.map(t=>{
    const realIdx=TIERS.indexOf(t);
    const isPast=days>t.max&&realIdx<tierIdx;
    const isCurrent=t===tier;
    const isLocked=t.min>days;
    const li=isLocked?lockedCount++:0;
    const opacity=isLocked?lockedOpacity[Math.min(li,2)]:1;
    const blur=isLocked?lockedBlur[Math.min(li,2)]:0;
    const cls=isPast?'sp-trow sp-past':isCurrent?'sp-trow sp-current':'sp-trow';
    const lockedStyle=isLocked?`style="opacity:${opacity};filter:blur(${blur}px) grayscale(.6);"` : '';
    const iconPx=fd.iconSize(realIdx);
    const iconFilter=`saturate(${(0.5+realIdx*0.09).toFixed(2)}) hue-rotate(${Math.round(-realIdx*2.2)}deg)`;
    const nameColor=isCurrent?tier.color:isPast?'var(--ctdd)':'inherit';
    const rangeStr=t.max>=9999?`Day ${t.min}+`:(t.min===t.max?`Day ${t.min}`:`Day ${t.min}–${t.max}`);
    return `<div class="${cls}" ${lockedStyle}><span class="sp-ticon" style="color:${t.color};">${emberSVGHTML(Math.round(iconPx*0.35),isCurrent)}</span><div class="sp-tname" style="color:${nameColor};">${t.name}${isCurrent?' ← you':''}</div><div class="sp-trange">${rangeStr}</div>${isPast?'<span class="sp-check">✓</span>':''}</div>`;
  }).join('');
  const nextStr=nextTier?`Next: ${nextTier.name} — ${nextTier.min-days} day${nextTier.min-days===1?'':'s'} away`:'Legend. You are the standard.';
  return `<div class="sp-inner"><div class="sp-top"><div class="sp-flame-wrap" style="color:${tier.color};"><div class="sp-blood" style="--blood-op:${fd.bloodOp};"></div>${emberSVGHTML(Math.round(fd.bigSize*0.32),true)}</div><div class="sp-info"><div class="sp-num" style="font-size:${Math.round(36+fd.bloodOp*14)}px;color:${tier.color};">${days}</div><div class="sp-tier" style="color:${tier.color};">${tier.name}</div><div class="sp-sub">"${tier.sub}"</div></div></div><div class="sp-next">${nextStr}</div><div class="sp-pbar-wrap"><div class="sp-pbar-fill" style="width:${pct}%;background:linear-gradient(90deg,${tier.color},${nextTier?nextTier.color:tier.color});"></div></div><div class="sp-tiers">${rows}</div></div>`;
}
let streakPanelOpen=false;
let lastStreakTier=null;
function toggleStreakPanel(){streakPanelOpen=!streakPanelOpen;updateStreakPanel();}
function updateStreakPanel(){
  const panel=document.getElementById('streak-panel');
  if(!panel)return;
  const n=calcStreak();
  if(streakPanelOpen&&n>0){
    panel.classList.remove('closing');
    panel.innerHTML=renderStreakCard(n);
    // Force reflow then open
    void panel.offsetHeight;
    panel.classList.add('open');
    const sc2=document.getElementById('sc2');
    const tier=getTier(n);
    if(sc2)sc2.style.borderColor=tier.glow.replace(/[\d.]+\)$/,'0.5)');
  }else{
    panel.classList.remove('open');
    panel.classList.add('closing');
    const sc2=document.getElementById('sc2');
    if(sc2)sc2.style.borderColor='';
    setTimeout(()=>{ panel.classList.remove('closing'); panel.innerHTML=''; },280);
  }
}
function devMode(){document.body.classList.toggle('dev-mode');console.log('Dev mode:',document.body.classList.contains('dev-mode'));}
let _versionTaps=0,_versionTapTimer=null;
function onVersionTap(){
  _versionTaps++;
  if(_versionTapTimer)clearTimeout(_versionTapTimer);
  _versionTapTimer=setTimeout(()=>{_versionTaps=0;},1500);
  if(_versionTaps>=7){
    _versionTaps=0;
    localStorage.setItem('gc:dev','1');
    const btn=document.getElementById('dev-console-btn');if(btn)btn.style.display='';
    showToast('Dev mode enabled');
    closeSettings();setTimeout(()=>openSettings(),150);
  }
}

const QUOTES=[
  {t:"Waste no more time arguing what a good man should be. Be one.",a:"Marcus Aurelius"},
  {t:"You could leave life right now. Let that determine what you do and say and think.",a:"Marcus Aurelius"},
  {t:"The impediment to action advances action. What stands in the way becomes the way.",a:"Marcus Aurelius"},
  {t:"Confine yourself to the present.",a:"Marcus Aurelius"},
  {t:"It is not death that a man should fear, but he should fear never beginning to live.",a:"Marcus Aurelius"},
  {t:"Accept the things to which fate binds you, and love the people with whom fate brings you together.",a:"Marcus Aurelius"},
  {t:"Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",a:"Marcus Aurelius"},
  {t:"The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.",a:"Marcus Aurelius"},
  {t:"Difficulties strengthen the mind, as labor does the body.",a:"Seneca"},
  {t:"He who is brave is free.",a:"Seneca"},
  {t:"The greatest remedy for anger is delay.",a:"Seneca"},
  {t:"Luck is what happens when preparation meets opportunity.",a:"Seneca"},
  {t:"Begin at once to live, and count each separate day as a separate life.",a:"Seneca"},
  {t:"We suffer more in imagination than in reality.",a:"Seneca"},
  {t:"Retire into yourself as much as you can.",a:"Seneca"},
  {t:"It is not the man who has too little, but the man who craves more, that is poor.",a:"Seneca"},
  {t:"No man is free who is not master of himself.",a:"Epictetus"},
  {t:"It is not what happens to you, but how you react that matters.",a:"Epictetus"},
  {t:"Make the best use of what is in your power.",a:"Epictetus"},
  {t:"First say to yourself what you would be; then do what you have to do.",a:"Epictetus"},
  {t:"Freedom is the only worthy goal in life.",a:"Epictetus"},
  {t:"Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are.",a:"Epictetus"},
  {t:"We cannot choose our external circumstances, but we can always choose how we respond to them.",a:"Epictetus"},
  {t:"The key is to keep company only with people who uplift you, whose presence calls forth your best.",a:"Epictetus"},
  {t:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.",a:"Aristotle"},
  {t:"Through discipline comes freedom.",a:"Aristotle"},
  {t:"The secret of getting ahead is getting started.",a:"Mark Twain"},
  {t:"Do not wait to strike till the iron is hot; but make it hot by striking.",a:"W.B. Yeats"},
  {t:"Energy and persistence conquer all things.",a:"Benjamin Franklin"},
  {t:"If you are going through hell, keep going.",a:"Winston Churchill"},
  {t:"It does not matter how slowly you go as long as you do not stop.",a:"Confucius"},
  {t:"The man who moves a mountain begins by carrying away small stones.",a:"Confucius"},
  {t:"Our greatest glory is not in never falling, but in rising every time we fall.",a:"Confucius"},
  {t:"Strength does not come from physical capacity. It comes from an indomitable will.",a:"Mahatma Gandhi"},
  {t:"Discipline is the bridge between goals and accomplishment.",a:"Jim Rohn"},
  {t:"The successful warrior is the average man, with laser-like focus.",a:"Bruce Lee"},
  {t:"Absorb what is useful, discard what is not, add what is uniquely your own.",a:"Bruce Lee"},
  {t:"Be like water. Water is fluid, soft, and yielding. But water will wear away rock.",a:"Bruce Lee"},
  {t:"Whether you think you can, or you think you can't — you're right.",a:"Henry Ford"},
  {t:"A man who dares to waste one hour of time has not discovered the value of life.",a:"Charles Darwin"},
  {t:"The only person you are destined to become is the person you decide to be.",a:"Ralph Waldo Emerson"},
  {t:"Do not go where the path may lead; go instead where there is no path and leave a trail.",a:"Ralph Waldo Emerson"},
  {t:"Do one thing every day that scares you.",a:"Eleanor Roosevelt"},
  {t:"Courage is not the absence of fear, but the triumph over it.",a:"Nelson Mandela"},
  {t:"It always seems impossible until it's done.",a:"Nelson Mandela"},
  {t:"The cave you fear to enter holds the treasure you seek.",a:"Joseph Campbell"},
  {t:"In the middle of difficulty lies opportunity.",a:"Albert Einstein"},
  {t:"A smooth sea never made a skillful sailor.",a:"Franklin D. Roosevelt"},
  {t:"He who has a why to live can bear almost any how.",a:"Friedrich Nietzsche"},
  {t:"That which does not kill us makes us stronger.",a:"Friedrich Nietzsche"},
  {t:"Become who you are.",a:"Friedrich Nietzsche"},
  {t:"The secret of success is constancy to purpose.",a:"Benjamin Disraeli"},
  {t:"Fall seven times, stand up eight.",a:"Japanese Proverb"},
  {t:"Hard work beats talent when talent doesn't work hard.",a:"Tim Notke"},
  {t:"The more you sweat in training, the less you bleed in combat.",a:"Richard Marcinko"},
  {t:"I am not afraid of storms, for I am learning how to sail my ship.",a:"Louisa May Alcott"},
  {t:"Man is not the creature of circumstances. Circumstances are the creatures of men.",a:"Benjamin Disraeli"},
  {t:"You don't have to be great to start, but you have to start to be great.",a:"Zig Ziglar"},
  {t:"The reading of all good books is like a conversation with the finest minds of past centuries.",a:"René Descartes"},
  {t:"Iron rusts from disuse; water loses its purity from stagnation. Even so does inaction sap the vigor of the mind.",a:"Leonardo da Vinci"},
  {t:"Knowing is not enough; we must apply. Willing is not enough; we must do.",a:"Johann Wolfgang von Goethe"},
  {t:"With self-discipline, almost anything is possible.",a:"Theodore Roosevelt"},
];

const PH=[{id:'ph1',name:'Cold Shower',cat:'Body'},{id:'ph2',name:'Meditation',cat:'Mind'},{id:'ph3',name:'Deep Work',cat:'Craft'},{id:'ph4',name:'Evening Reflection',cat:'Ritual'}];
const PHL={};
(()=>{for(let i=1;i<=365;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];
if(Math.random()<.25)continue;
const day={};
day.ph1=Math.random()>.6?'done':'failed';
day.ph2=Math.random()>.7?'done':'failed';
day.ph3=Math.random()>.75?'done':'failed';
day.ph4=Math.random()>.65?'done':'failed';
PHL[ds]=day;}})();

let habits=[],logs={},cats=[],view='today',qi=0,selCat='';
let isPlaceholder=false,toastTimer=null;
let monthList=[], currentMonthIdx=0;

function scoreWord(pct){
  if(pct>=80)return'Forged';
  if(pct>=60)return'Holding';
  if(pct>=40)return'Wavering';
  return'Broken';
}

function getMonthList(){
  const ll=effL(),hh=effH();
  const today=getDate();
  const logKeys=Object.keys(ll).sort();
  const earliest=logKeys[0]||today;
  let[ey,em]=earliest.slice(0,7).split('-').map(Number);
  const[ty,tm]=today.slice(0,7).split('-').map(Number);
  const months=[];
  while(ey<ty||(ey===ty&&em<=tm)){
    const daysInMonth=new Date(ey,em,0).getDate();
    const startDow=new Date(ey,em-1,1).getDay();
    const prefix=`${ey}-${String(em).padStart(2,'0')}`;
    const dayPcts=[];
    for(let d=1;d<=daysInMonth;d++){
      const ds=`${prefix}-${String(d).padStart(2,'0')}`;
      const p=dayPct(ds,hh,ll);
      if(p!==null)dayPcts.push(p);
    }
    const hasData=dayPcts.length>0;
    const avg=hasData?Math.round(dayPcts.reduce((a,b)=>a+b,0)/dayPcts.length):0;
    months.push({year:ey,month:em,prefix,daysInMonth,startDow,pct:avg,hasData,word:scoreWord(avg)});
    em++;if(em>12){em=1;ey++;}
  }
  return months;
}

function renderForgeRing(){
  monthList=getMonthList();
  currentMonthIdx=Math.max(0,monthList.length-1);
  const c=document.getElementById('content');
  c.innerHTML=`
<div id="record-tab" style="display:flex;flex-direction:column;height:calc(100% + 68px + env(safe-area-inset-bottom, 10px));overflow:hidden;margin-bottom:calc(-68px - env(safe-area-inset-bottom, 10px));user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;">
  <div class="fr-hdr">
    <button class="fr-hdr-arrow" id="fr-prev" onclick="changeMonth(-1)" aria-label="Previous month">&#8249;</button>
    <span class="fr-month-title" id="fr-month-title"></span>
    <button class="fr-hdr-arrow" id="fr-next" onclick="changeMonth(1)" aria-label="Next month">&#8250;</button>
  </div>
  <div class="fr-ring-scene" id="fr-ring-scene">
    <div class="fr-selection-arrow" id="fr-selection-arrow">&#9662;</div>
    <div class="fr-wheel-wrap" id="fr-wheel-wrap">
      <svg id="fr-ring-svg" viewBox="0 0 256 256" role="group" aria-label="Monthly discipline ring">
        <defs>
          <filter id="wedge-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="var(--gold)" flood-opacity="0.85"/>
            <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="var(--gold)" flood-opacity="0.35"/>
          </filter>
        </defs>
      </svg>
      <div class="fr-ring-center" id="fr-ring-center">
        <div class="fr-rc-month" id="fr-rc-month">
          <div class="fr-rc-pct" id="fr-rc-pct"></div>
          <div class="fr-rc-word" id="fr-rc-word"></div>
          <div class="fr-rc-days" id="fr-rc-days"></div>
          <div class="fr-rc-cta">tap a day</div>
        </div>
        <div class="fr-rc-day" id="fr-rc-day" style="display:none;">
          <div class="fr-rc-day-date" id="fr-rc-day-date"></div>
          <div class="fr-rc-day-pct" id="fr-rc-day-pct"></div>
          <div class="fr-rc-day-list" id="fr-rc-day-list"></div>
          <button class="fr-rc-day-close btn-reset" onclick="closeDetail()" aria-label="Close day detail">&#10005;</button>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-terrain-section" id="fr-terrain-section">
    <div class="fr-terrain-hdr">ALL TIME &nbsp;·&nbsp; TAP TO JUMP</div>
    <div class="fr-terrain-stage" id="fr-terrain-stage">
      <div class="fr-terrain-floor">
        <div class="fr-terrain-inner" id="fr-terrain-inner"></div>
      </div>
    </div>
  </div>
</div>`;
  requestAnimationFrame(()=>{
    updateRingHeader();
    drawRing('assemble');
    buildTerrain();
    initWheelSwipe();
    initTerrainDrag();
  });
}

let _ringTextRefs=[]; // [{el,tx,ty}] for counter-rotation

function drawRing(mode){
  const m=monthList[currentMonthIdx];
  if(!m)return;
  _ringTextRefs=[];
  const hh=effH(),ll=effL();
  const today=getDate();
  const todayPrefix=today.slice(0,7);
  const isCurrentMonth=(m.prefix===todayPrefix);
  const todayDay=isCurrentMonth?parseInt(today.slice(8)):0;

  const CX=128,CY=128,R=122,RI=82;
  const GAP=1.5*Math.PI/180;
  const daysInMonth=m.daysInMonth;
  const sliceAngle=(2*Math.PI)/daysInMonth;

  function wedgePath(i){
    const a1=i*sliceAngle+GAP/2;
    const a2=(i+1)*sliceAngle-GAP/2;
    const ox1=CX+R*Math.cos(a1),oy1=CY+R*Math.sin(a1);
    const ox2=CX+R*Math.cos(a2),oy2=CY+R*Math.sin(a2);
    const ix1=CX+RI*Math.cos(a2),iy1=CY+RI*Math.sin(a2);
    const ix2=CX+RI*Math.cos(a1),iy2=CY+RI*Math.sin(a1);
    const large=(a2-a1>Math.PI)?1:0;
    return`M${ox1},${oy1} A${R},${R} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${RI},${RI} 0 ${large} 0 ${ix2},${iy2} Z`;
  }

  function wedgeFill(pct){
    const {r,g,b}=_accentRGB;
    if(pct===100)return`rgba(${r},${g},${b},0.50)`;
    if(pct>=80)return`rgba(${r},${g},${b},0.40)`;
    if(pct>=60)return`rgba(${r},${g},${b},0.30)`;
    if(pct>=40)return`rgba(${r},${g},${b},0.20)`;
    if(pct>=20)return`rgba(${r},${g},${b},0.12)`;
    return`rgba(${r},${g},${b},0.05)`;
  }

  const svg=document.getElementById('fr-ring-svg');
  if(!svg)return;
  // Preserve <defs>, remove everything else
  const defs=svg.querySelector('defs');
  while(svg.lastChild){svg.removeChild(svg.lastChild);}
  if(defs)svg.appendChild(defs);

  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.id='fr-wedges';

  let daysWithData=0;
  let todayDotEl=null;

  for(let d=1;d<=daysInMonth;d++){
    const i=d-1;
    const dateStr=`${m.prefix}-${String(d).padStart(2,'0')}`;
    const isToday=(isCurrentMonth&&d===todayDay);
    const isFuture=(isCurrentMonth&&d>todayDay)||(m.year>parseInt(today.slice(0,4)))||(m.year===parseInt(today.slice(0,4))&&m.month>parseInt(today.slice(5,7)));
    const pct=dayPct(dateStr,hh,ll);
    if(pct!==null)daysWithData++;

    // Build wedge path
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',wedgePath(i));
    path.setAttribute('data-day',String(d));

    if(isFuture){
      path.setAttribute('fill',`rgba(${_accentRGB.r},${_accentRGB.g},${_accentRGB.b},0.02)`);
      path.setAttribute('stroke','none');
      path.setAttribute('aria-hidden','true');
      path.style.transition='opacity 0.3s ease';
      g.appendChild(path);
      continue;
    }

    const fillPct=(pct!==null)?pct:0;
    const fill=(pct===null)?`rgba(${_accentRGB.r},${_accentRGB.g},${_accentRGB.b},0.05)`:wedgeFill(fillPct);
    path.setAttribute('fill',fill);

    if(isToday){
      path.setAttribute('stroke',`rgba(${_accentRGB.r},${_accentRGB.g},${_accentRGB.b},0.35)`);
      path.setAttribute('stroke-width','0.8');
      // Small gold dot at outer edge of today's wedge
      const midA=i*sliceAngle+sliceAngle/2;
      const dotCx=CX+(R+4)*Math.cos(midA);
      const dotCy=CY+(R+4)*Math.sin(midA);
      todayDotEl=document.createElementNS('http://www.w3.org/2000/svg','circle');
      todayDotEl.setAttribute('cx',dotCx.toFixed(1));
      todayDotEl.setAttribute('cy',dotCy.toFixed(1));
      todayDotEl.setAttribute('r','2.5');
      todayDotEl.setAttribute('fill',`rgba(${_accentRGB.r},${_accentRGB.g},${_accentRGB.b},0.65)`);
      todayDotEl.setAttribute('class','fr-today-dot');
      todayDotEl.setAttribute('pointer-events','none');
    } else {
      path.setAttribute('stroke','none');
    }

    const label=isToday?'Today, in progress':`Day ${d}: ${fillPct}% — ${scoreWord(fillPct)}`;
    path.setAttribute('role','button');
    path.setAttribute('tabindex','0');
    path.setAttribute('aria-label',label);
    path.style.cursor='pointer';
    path.style.transition='opacity 0.3s ease';
    path.addEventListener('click',(e)=>{
      const w=document.getElementById('fr-wheel-wrap');
      if(w&&w._suppressClick)return;
      if(w&&w._selectDayByTap)w._selectDayByTap(d);
    });
    path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const w=document.getElementById('fr-wheel-wrap');if(w&&w._selectDayByTap)w._selectDayByTap(d);}});
    g.appendChild(path);

    // Day number text (skip future days)
    const midAngle=i*sliceAngle+sliceAngle/2;
    const textR=(RI+R)/2;
    const tx=CX+textR*Math.cos(midAngle);
    const ty=CY+textR*Math.sin(midAngle);
    const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x',tx.toFixed(1));
    txt.setAttribute('y',ty.toFixed(1));
    txt.setAttribute('class','fr-day-num');
    txt.setAttribute('text-anchor','middle');
    txt.setAttribute('dominant-baseline','central');
    txt.setAttribute('pointer-events','none');
    txt.setAttribute('data-day',String(d));
    txt.textContent=String(d);
    g.appendChild(txt);
    _ringTextRefs.push({el:txt,tx:parseFloat(tx.toFixed(1)),ty:parseFloat(ty.toFixed(1))});
  }

  if(todayDotEl)g.appendChild(todayDotEl);

  // Center circle
  const centerCircle=document.createElementNS('http://www.w3.org/2000/svg','circle');
  centerCircle.setAttribute('cx','128');centerCircle.setAttribute('cy','128');centerCircle.setAttribute('r','80');
  centerCircle.setAttribute('fill','rgba(10,8,6,0.92)');centerCircle.setAttribute('pointer-events','none');

  svg.appendChild(g);
  svg.appendChild(centerCircle);

  // Update center content
  const pctEl=document.getElementById('fr-rc-pct');
  const wordEl=document.getElementById('fr-rc-word');
  const daysEl=document.getElementById('fr-rc-days');
  if(pctEl&&wordEl&&daysEl){
    if(!m.hasData&&effH().length===0){
      pctEl.textContent='—';
      wordEl.textContent='Start forging';
      daysEl.innerHTML='<a class="fr-rc-cta" style="cursor:pointer;color:var(--gold);text-decoration:none;font-size:9px;" onclick="sw(\'forge\',document.querySelector(\'.bni[data-v=forge]\'))">Set up your first discipline →</a>';
    } else if(effH().length>0&&daysWithData<3){
      pctEl.textContent='—';
      wordEl.textContent=daysWithData?daysWithData+(daysWithData===1?' day':' days'):'New month';
      daysEl.innerHTML='<span style="font-size:8px;color:var(--ctdd);line-height:1.4;text-align:center;display:block;">Complete a few days<br>to see your ring take shape</span>';
    } else {
      pctEl.textContent=(m.hasData&&m.pct!=null)?m.pct+'%':'—';
      wordEl.textContent=(m.hasData&&m.word)?m.word:'No data';
      daysEl.textContent=(m.hasData&&daysWithData!=null)?daysWithData+' of '+daysInMonth+' days':'';
    }
  }

  // Update arrow dim states
  const prevBtn=document.getElementById('fr-prev');
  const nextBtn=document.getElementById('fr-next');
  if(prevBtn)prevBtn.classList.toggle('dim',currentMonthIdx<=0);
  if(nextBtn)nextBtn.classList.toggle('dim',currentMonthIdx>=monthList.length-1);

  // Animation modes
  if(mode==='assemble'){
    const paths=g.querySelectorAll('path');
    paths.forEach((p,i)=>{
      p.style.opacity='0';
    });
    requestAnimationFrame(()=>{
      paths.forEach((p,i)=>{
        p.style.transitionDelay=`${i*20}ms`;
        p.style.opacity='1';
      });
    });
  } else if(mode==='transition'){
    svg.style.transition='opacity 150ms ease-in';
    svg.style.opacity='0';
    setTimeout(()=>{
      svg.style.transition='opacity 220ms cubic-bezier(0.22,1,0.36,1)';
      svg.style.opacity='1';
    },160);
  }
  // mode === false: instant, no animation needed
}

function initWheelSwipe() {
  const wrap = document.getElementById('fr-wheel-wrap');
  const svg = document.getElementById('fr-ring-svg');
  if (!wrap || !svg) return;

  // Shared helpers
  function normAngle(d) { while (d > 180) d -= 360; while (d < -180) d += 360; return d; }
  function dayStr(mo, day) { return `${mo.prefix}-${String(day).padStart(2,'0')}`; }

  // Cached per-gesture to avoid repeated localStorage reads
  let cachedHH = null, cachedLL = null;
  function gestureHL() { if (!cachedHH) { cachedHH = effH(); cachedLL = effL(); } return { hh: cachedHH, ll: cachedLL }; }
  function clearGestureCache() { cachedHH = null; cachedLL = null; }

  let activePointerId = null;
  let currentRotation = 0;
  let selectedDay = null;
  let lastSamples = [];
  let lastRawAngle = 0;
  let animRAF = null;
  let isDragging = false;
  let dragStarted = false;
  let pointerDownPos = null;
  const FRICTION = 0.75;
  const MOMENTUM_DECAY = 0.86;
  const VELOCITY_THRESHOLD = 50;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initial rotation: today (or last data day) at 12 o'clock (under arrow)
  const m = monthList[currentMonthIdx];
  const sliceAngle = 360 / m.daysInMonth;
  const today = getDate();
  const isCurrentMonth = (m.prefix === today.slice(0, 7));
  const targetDay = isCurrentMonth ? parseInt(today.slice(8)) : m.daysInMonth;
  currentRotation = -90 - (targetDay - 1) * sliceAngle - sliceAngle / 2;
  applyRotation();
  selectDay(targetDay);

  function applyRotation() {
    svg.style.transform = `rotate(${currentRotation}deg)`;
    // Counter-rotate text so day numbers always face upright
    _ringTextRefs.forEach(({el, tx, ty}) => {
      el.setAttribute('transform', `rotate(${-currentRotation}, ${tx}, ${ty})`);
    });
  }

  function getAngle(e) {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }

  function getDayAtTop() {
    const daysInMonth = monthList[currentMonthIdx].daysInMonth;
    const sliceDeg = 360 / daysInMonth;
    const offset = ((-90 - currentRotation) % 360 + 360) % 360;
    return (Math.round(offset / sliceDeg) % daysInMonth) + 1;
  }

  function computeVelocity() {
    if (lastSamples.length < 2) return 0;
    const first = lastSamples[0];
    const last = lastSamples[lastSamples.length - 1];
    const dt = (last.time - first.time) / 1000;
    if (dt < 0.001) return 0;
    let dAngle = normAngle(last.angle - first.angle);
    return dAngle / dt;
  }

  function snapToDay(day, animated) {
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    const daysInMonth = monthList[currentMonthIdx].daysInMonth;
    const sliceDeg = 360 / daysInMonth;
    const dayIdx = day - 1;
    let target = -90 - dayIdx * sliceDeg - sliceDeg / 2;
    target += normAngle(target - currentRotation) - (target - currentRotation);

    if (!animated || reducedMotion) {
      currentRotation = target;
      applyRotation();
      selectDay(day);
      return;
    }
    const start = currentRotation;
    const startTime = performance.now();
    const duration = 280;
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      currentRotation = start + (target - start) * ease;
      applyRotation();
      if (t < 1) {
        animRAF = requestAnimationFrame(step);
      } else {
        animRAF = null;
        currentRotation = target;
        applyRotation();
        selectDay(day);
      }
    }
    animRAF = requestAnimationFrame(step);
  }

  function snapToNearest(animated) {
    const raw = getDayAtTop();
    const mo = monthList[currentMonthIdx];
    const dim = mo.daysInMonth;
    const { hh, ll } = gestureHL();
    const rawPct = dayPct(dayStr(mo, raw), hh, ll);
    if (rawPct && rawPct > 0) { snapToDay(raw, animated !== false); return; }
    for (let offset = 1; offset <= 3; offset++) {
      const candidates = [];
      const prev = raw - offset; if (prev >= 1) candidates.push(prev);
      const next = raw + offset; if (next <= dim) candidates.push(next);
      for (const c of candidates) {
        const p = dayPct(dayStr(mo, c), hh, ll);
        if (p && p > 0) { snapToDay(c, animated !== false); return; }
      }
    }
    snapToDay(raw, animated !== false);
  }

  function momentumCoast(vel) {
    if (reducedMotion) { snapToNearest(false); return; }
    let v = vel * 0.016;
    function step() {
      v *= MOMENTUM_DECAY;
      currentRotation += v;
      applyRotation();
      if (Math.abs(v) > 0.18) {
        animRAF = requestAnimationFrame(step);
      } else {
        animRAF = null;
        snapToNearest(true);
      }
    }
    animRAF = requestAnimationFrame(step);
  }

  function selectDay(day) {
    selectedDay = day;
    // Highlight wedge under arrow
    const paths = svg.querySelectorAll('path[data-day]');
    paths.forEach(p => {
      const d = parseInt(p.dataset.day);
      if (d === day) {
        p.style.filter = 'url(#wedge-glow)';
        p.classList.add('fr-wedge--selected');
      } else {
        p.style.filter = '';
        p.classList.remove('fr-wedge--selected');
      }
    });
    // Highlight selected day number
    svg.querySelectorAll('text[data-day]').forEach(t => {
      if (parseInt(t.dataset.day) === day) t.classList.add('fr-day-num--selected');
      else t.classList.remove('fr-day-num--selected');
    });
    const mo = monthList[currentMonthIdx];
    const ds = dayStr(mo, day);
    const { hh, ll } = gestureHL();
    const pct = dayPct(ds, hh, ll);
    const isToday = (ds === getDate());
    showDayInfo(day, ds, pct !== null ? pct : 0, isToday);
  }

  function deselectDay() {
    selectedDay = null;
    svg.querySelectorAll('path[data-day]').forEach(p => {
      p.style.filter = '';
      p.classList.remove('fr-wedge--selected');
    });
    svg.querySelectorAll('text[data-day]').forEach(t => t.classList.remove('fr-day-num--selected'));
    showMonthSummary();
  }

  // ── Pointer events — rAF-driven smooth rotation ──
  wrap.addEventListener('pointerdown', (e) => {
    if (activePointerId !== null) return;
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    activePointerId = e.pointerId;
    wrap.setPointerCapture(e.pointerId);
    lastRawAngle = getAngle(e);
    lastSamples = [{ angle: lastRawAngle, time: performance.now() }];
    isDragging = false;
    dragStarted = false;
    selectedDay = null;
    clearGestureCache();
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointerId) return;
    // Drag threshold — 5px before we start rotating
    if (!dragStarted && pointerDownPos) {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) return;
      dragStarted = true;
      isDragging = true;
    }
    const rawAngle = getAngle(e);
    let rawDelta = normAngle(rawAngle - lastRawAngle);
    lastRawAngle = rawAngle;

    const now = performance.now();
    lastSamples.push({ angle: rawAngle, time: now });
    if (lastSamples.length > 4) lastSamples.shift();

    currentRotation += rawDelta * FRICTION;
    applyRotation();
  });

  wrap.addEventListener('pointerup', (e) => {
    if (e.pointerId !== activePointerId) return;
    wrap.releasePointerCapture(e.pointerId);
    activePointerId = null;
    if (!dragStarted) return; // tap — click handler on wedge will fire
    isDragging = false;
    wrap._suppressClick = true;
    setTimeout(() => { wrap._suppressClick = false; }, 80);
    const velocity = computeVelocity();
    if (Math.abs(velocity) < VELOCITY_THRESHOLD) {
      snapToNearest(true);
    } else {
      momentumCoast(velocity);
    }
  });

  wrap.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    isDragging = false;
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    snapToNearest(true);
  });

  // Expose for external access
  wrap._suppressClick = false;
  wrap._resetRotation = function() {
    selectedDay = null;
    clearGestureCache();
    deselectDay();
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    const nm = monthList[currentMonthIdx];
    const sd = 360 / nm.daysInMonth;
    const td = nm.prefix === getDate().slice(0,7) ? parseInt(getDate().slice(8)) : nm.daysInMonth;
    snapToDay(td, true);
  };
  wrap._deselectDay = deselectDay;
  wrap._selectDayByTap = function(day) {
    snapToDay(day, true);
  };

  // Keyboard navigation
  wrap.addEventListener('keydown', (e) => {
    const daysInMonth = monthList[currentMonthIdx].daysInMonth;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const cur = getDayAtTop();
      snapToDay((cur % daysInMonth) + 1, true);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = getDayAtTop();
      snapToDay(((cur - 2 + daysInMonth) % daysInMonth) + 1, true);
    }
    if (e.key === 'Escape') { deselectDay(); }
  });
  wrap.setAttribute('tabindex', '0');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'Monthly discipline wheel — use arrow keys to navigate days');
}

function showDayInfo(day, dateStr, pct, isToday) {
  const center = document.getElementById('fr-ring-center');
  if (!center) return;
  const monthView = document.getElementById('fr-rc-month');
  const dayView = document.getElementById('fr-rc-day');
  if (!monthView || !dayView) return;

  const d = new Date(dateStr + 'T00:00:00');
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateText = `${mn[d.getMonth()]} ${d.getDate()}`;
  const word = isToday ? 'In progress' : scoreWord(pct || 0);
  const hh = effH(), ll = effL();
  const dayLog = ll[dateStr] || {};

  center.style.transition = 'opacity 100ms ease-in';
  center.style.opacity = '0';
  setTimeout(() => {
    monthView.style.display = 'none';
    dayView.style.display = 'flex';

    document.getElementById('fr-rc-day-date').textContent = dateText;
    document.getElementById('fr-rc-day-pct').textContent = `${pct || 0}% · ${word}`;

    const listEl = document.getElementById('fr-rc-day-list');
    listEl.innerHTML = '';
    hh.forEach(h => {
      const status = dayLog[h.id];
      const icon = status === 'done' ? '✓' : status === 'failed' ? '✗' : '·';
      const cls = status === 'done' ? 'done' : status === 'failed' ? 'fail' : 'skip';
      const row = document.createElement('div');
      row.className = 'fr-rc-habit-row';
      row.innerHTML = `<span class="fr-rc-habit-icon fr-rc-${cls}">${icon}</span><span class="fr-rc-habit-name">${esc(h.name)}</span>`;
      listEl.appendChild(row);
    });

    center.style.transition = 'opacity 180ms cubic-bezier(0.25,1,0.5,1)';
    requestAnimationFrame(() => center.style.opacity = '1');
  }, 110);
}

function showMonthSummary() {
  const center = document.getElementById('fr-ring-center');
  if (!center) return;
  const monthView = document.getElementById('fr-rc-month');
  const dayView = document.getElementById('fr-rc-day');
  if (!monthView || !dayView) return;
  const m = monthList[currentMonthIdx];
  center.style.transition = 'opacity 100ms ease-in';
  center.style.opacity = '0';
  setTimeout(() => {
    dayView.style.display = 'none';
    monthView.style.display = 'flex';
    document.getElementById('fr-rc-pct').textContent = (m.hasData && m.pct != null) ? `${m.pct}%` : '\u2014';
    document.getElementById('fr-rc-word').textContent = (m.hasData && m.word) ? m.word : 'No data';
    document.getElementById('fr-rc-days').textContent = (m.hasData && m.daysWithData != null) ? `${m.daysWithData} of ${m.daysInMonth} days` : '';
    center.style.transition = 'opacity 180ms cubic-bezier(0.25,1,0.5,1)';
    requestAnimationFrame(() => center.style.opacity = '1');
  }, 110);
}

function closeDetail(){
  // Deselect and return to month summary
  const wrap=document.getElementById('fr-wheel-wrap');
  if(wrap&&wrap._deselectDay) wrap._deselectDay();
}

function updateRingHeader(direction){
  const m=monthList[currentMonthIdx];
  if(!m)return;
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const name=monthNames[m.month-1];
  const year=m.year;

  // Month title
  const titleEl=document.getElementById('fr-month-title');
  if(titleEl)titleEl.textContent=`${name.slice(0,3).toUpperCase()} ${year}`;

  // Disable/enable arrows
  const prev=document.getElementById('fr-prev');
  const next=document.getElementById('fr-next');
  if(prev)prev.classList.toggle('dim',currentMonthIdx===0);
  if(next)next.classList.toggle('dim',currentMonthIdx===monthList.length-1);
}

function changeMonth(delta){
  const wrap=document.getElementById('fr-wheel-wrap');
  if(wrap&&wrap._resetRotation)wrap._resetRotation();
  const next=currentMonthIdx+delta;
  if(next<0||next>=monthList.length)return;
  currentMonthIdx=next;
  const dir=delta>0?'next':'prev';
  updateRingHeader(dir);
  drawRing('transition');
  // Terrain: just shift active class, no re-animation
  const cols=document.querySelectorAll('.fr-t-col');
  cols.forEach((col,i)=>{
    const bar=col.querySelector('.fr-t-bar');
    if(!bar)return;
    bar.classList.remove('fr-t-bar--active');
    if(i===currentMonthIdx)bar.classList.add('fr-t-bar--active');
  });
}

function buildTerrain(){
  const inner=document.getElementById('fr-terrain-inner');
  if(!inner)return;
  inner.innerHTML='';
  let lastYear=null;

  monthList.forEach((m,i)=>{
    // Year boundary marker
    if(lastYear!==null&&m.year!==lastYear){
      const ym=document.createElement('div');
      ym.className='fr-t-year-mark';
      ym.innerHTML=`<span class="fr-t-year-lbl">${m.year}</span>`;
      inner.appendChild(ym);
    }
    lastYear=m.year;

    const isActive=(i===currentMonthIdx);
    const barH=Math.max(14,Math.round((m.pct/100)*200));
    const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Determine bar state class
    let stateClass='fr-t-bar--empty';
    if(isActive){
      stateClass='fr-t-bar--active';
    } else if(m.hasData){
      if(m.pct>=80)stateClass='fr-t-bar--best';
      else if(m.pct>=60)stateClass='fr-t-bar--high';
      else if(m.pct>=40)stateClass='fr-t-bar--mid';
      else stateClass='fr-t-bar--low';
    }

    const col=document.createElement('div');
    col.className='fr-t-col';
    col.dataset.idx=i;
    col.setAttribute('role','button');
    col.setAttribute('tabindex','0');
    col.setAttribute('aria-label',`${monthNames[m.month-1]} ${m.year}: ${m.hasData?m.pct+'%':'no data'}`);
    col.addEventListener('click',()=>jumpToMonth(i));
    col.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')jumpToMonth(i);});

    const bar=document.createElement('div');
    bar.className=`fr-t-bar ${stateClass}`;
    bar.style.height=`${barH}px`;
    bar.style.animationDelay=`${i*55}ms`;

    const lbl=document.createElement('div');
    lbl.className=`fr-t-lbl${isActive?' fr-t-lbl--active':''}`;
    lbl.textContent=monthNames[m.month-1].slice(0,3);

    col.appendChild(bar);
    col.appendChild(lbl);
    inner.appendChild(col);
  });

  // Auto-scroll to active column (current month visible)
  requestAnimationFrame(()=>{
    const activeCol=inner.querySelector(`[data-idx="${currentMonthIdx}"]`);
    const stage=document.getElementById('fr-terrain-stage');
    if(activeCol&&stage){
      const colLeft=activeCol.offsetLeft;
      const colW=activeCol.offsetWidth;
      const stageW=stage.offsetWidth;
      // Center active column in view
      const targetOffset=-(colLeft-(stageW/2-colW/2));
      const maxOffset=0;
      const innerW=inner.scrollWidth;
      const minOffset=Math.min(0,stageW-innerW);
      inner.style.transform=`translateX(${Math.max(minOffset,Math.min(maxOffset,targetOffset))}px)`;
      inner._terrainOffset=Math.max(minOffset,Math.min(maxOffset,targetOffset));
    }
  });
}

function initTerrainDrag(){
  const stage=document.getElementById('fr-terrain-stage');
  const inner=document.getElementById('fr-terrain-inner');
  if(!stage||!inner)return;
  const fab=document.querySelector('.fab');

  let dragging=false,startX=0,velocity=0,offset=inner._terrainOffset||0,rafId=null;

  function clampOffset(v){
    const innerW=inner.scrollWidth;
    const stageW=stage.offsetWidth;
    const min=Math.min(0,stageW-innerW);
    return Math.max(min,Math.min(0,v));
  }

  function applyOffset(){
    inner.style.transform=`translateX(${offset}px)`;
    inner._terrainOffset=offset;
  }

  function momentum(){
    velocity*=0.88;
    offset=clampOffset(offset+velocity);
    applyOffset();
    if(Math.abs(velocity)>0.5){
      rafId=requestAnimationFrame(momentum);
    } else {
      rafId=null;
    }
  }

  function startDrag(x){
    dragging=true;
    startX=x;
    velocity=0;
    if(rafId){cancelAnimationFrame(rafId);rafId=null;}
    stage.style.cursor='grabbing';
    if(fab)fab.classList.add('terrain-dragging');
  }

  function moveDrag(x){
    if(!dragging)return;
    const dx=x-startX;
    startX=x;
    velocity=dx;
    offset=clampOffset(offset+dx);
    applyOffset();
  }

  function endDrag(){
    if(!dragging)return;
    dragging=false;
    stage.style.cursor='grab';
    if(fab){
      setTimeout(()=>{fab.classList.remove('terrain-dragging');},500);
    }
    if(Math.abs(velocity)>0.5){
      startAnimFrame();
    }
  }

  stage.addEventListener('mousedown',e=>{startDrag(e.clientX);e.preventDefault();});
  window.addEventListener('mousemove',e=>{if(dragging)moveDrag(e.clientX);});
  window.addEventListener('mouseup',endDrag);
  let touchStartX=0,touchMoved=false;
  stage.addEventListener('touchstart',e=>{
    touchStartX=e.touches[0].clientX;
    touchMoved=false;
    startDrag(e.touches[0].clientX);
  },{passive:true});
  stage.addEventListener('touchmove',e=>{
    const dx=Math.abs(e.touches[0].clientX-touchStartX);
    if(dx>8)touchMoved=true;
    if(touchMoved)e.preventDefault();
    moveDrag(e.touches[0].clientX);
  },{passive:false});
  stage.addEventListener('touchend',e=>{
    endDrag();
    if(!touchMoved){
      const touch=e.changedTouches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      if(el){
        const col=el.closest('.fr-t-col');
        if(col){
          const idx=parseInt(col.getAttribute('data-idx'),10);
          if(!isNaN(idx))jumpToMonth(idx);
        }
      }
    }
  });
  stage.style.cursor='grab';

  // Expose state for Task 10 shared rAF loop
  window._frTerrain={
    get velocity(){return velocity;},
    get dragging(){return dragging;},
    set velocity(v){velocity=v;},
    momentum:()=>{rafId=requestAnimationFrame(momentum);}
  };
}

let _frRafId=null;

function animFrame(){
  let active=false;
  const terrain=window._frTerrain;

  // Terrain momentum
  if(terrain&&!terrain.dragging&&Math.abs(terrain.velocity)>0.5){
    terrain.velocity*=0.88;
    const inner=document.getElementById('fr-terrain-inner');
    const stage=document.getElementById('fr-terrain-stage');
    if(inner&&stage){
      const innerW=inner.scrollWidth,stageW=stage.offsetWidth;
      const min=Math.min(0,stageW-innerW);
      let off=(inner._terrainOffset||0)+terrain.velocity;
      off=Math.max(min,Math.min(0,off));
      inner.style.transform=`translateX(${off}px)`;
      inner._terrainOffset=off;
    }
    active=true;
  }

  if(active){
    _frRafId=requestAnimationFrame(animFrame);
  } else {
    _frRafId=null;
  }
}

function startAnimFrame(){
  if(!_frRafId)_frRafId=requestAnimationFrame(animFrame);
}

function jumpToMonth(idx){
  const wrap=document.getElementById('fr-wheel-wrap');
  if(wrap&&wrap._resetRotation)wrap._resetRotation();
  if(idx<0||idx>=monthList.length)return;
  currentMonthIdx=idx;
  updateRingHeader();
  drawRing(false);
  // Rebuild terrain to shift active class (no bar re-animation needed — we just update classes)
  const cols=document.querySelectorAll('.fr-t-col');
  cols.forEach((col,i)=>{
    const bar=col.querySelector('.fr-t-bar');
    if(!bar)return;
    bar.classList.remove('fr-t-bar--active','fr-t-bar--best','fr-t-bar--high','fr-t-bar--mid','fr-t-bar--low','fr-t-bar--empty');
    const m=monthList[i];
    if(i===currentMonthIdx){
      bar.classList.add('fr-t-bar--active');
    } else if(m.hasData){
      if(m.pct>=80)bar.classList.add('fr-t-bar--best');
      else if(m.pct>=60)bar.classList.add('fr-t-bar--high');
      else if(m.pct>=40)bar.classList.add('fr-t-bar--mid');
      else bar.classList.add('fr-t-bar--low');
    } else {
      bar.classList.add('fr-t-bar--empty');
    }
    const lbl=col.querySelector('.fr-t-lbl');
    if(lbl)lbl.classList.toggle('fr-t-lbl--active',i===currentMonthIdx);
  });
  // Smooth scroll terrain to bring jumped column into view
  requestAnimationFrame(()=>{
    const inner=document.getElementById('fr-terrain-inner');
    const stage=document.getElementById('fr-terrain-stage');
    const activeCol=document.querySelector(`.fr-t-col[data-idx="${idx}"]`);
    if(!inner||!stage||!activeCol)return;
    const stageW=stage.offsetWidth;
    const colLeft=activeCol.offsetLeft;
    const colW=activeCol.offsetWidth;
    const target=-(colLeft-(stageW/2-colW/2));
    const innerW=inner.scrollWidth;
    const min=Math.min(0,stageW-innerW);
    const clamped=Math.max(min,Math.min(0,target));
    // Animate offset to target
    let current=inner._terrainOffset||0;
    const diff=clamped-current;
    if(Math.abs(diff)<2){return;}
    function scrollStep(){
      current+=(clamped-current)*0.18;
      inner.style.transform=`translateX(${current}px)`;
      inner._terrainOffset=current;
      if(Math.abs(clamped-current)>1)requestAnimationFrame(scrollStep);
      else{inner.style.transform=`translateX(${clamped}px)`;inner._terrainOffset=clamped;}
    }
    requestAnimationFrame(scrollStep);
  });
}

function getDate(){const sim=localStorage.getItem('gc:sim_date');return sim||new Date().toISOString().split('T')[0];}
function getHour(){return new Date().getHours();}
function daysBack(n,ref){const d=ref?new Date(ref+'T12:00'):new Date();d.setDate(d.getDate()-n);return d.toISOString().split('T')[0];}
function last7(){const a=[];for(let i=6;i>=0;i--)a.push(daysBack(i,getDate()));return a;}
function last30(){const a=[];for(let i=29;i>=0;i--)a.push(daysBack(i,getDate()));return a;}
function last365(){const a=[];for(let i=364;i>=0;i--)a.push(daysBack(i,getDate()));return a;}
function effH(){return isPlaceholder?PH:habits;}
function effL(){return isPlaceholder?PHL:logs;}
function dayPct(date,hh,ll){const l=ll[date]||{};const done=hh.filter(h=>l[h.id]==='done').length;return hh.length>0?Math.round((done/hh.length)*100):null;}
function todayLabel(p){if(p===null)return'—';if(p>=80)return'Iron';if(p>=60)return'Solid';if(p>=40)return'Holding';return'Weak';}
function weekLabel(p){if(p===null)return'—';if(p>=80)return'Forged';if(p>=60)return'Steady';if(p>=40)return'Wavering';return'Broken';}
function calcStreak(){const hh=effH(),ll=effL();let s=0;const todayP=dayPct(getDate(),hh,ll);const startI=(todayP!==null&&todayP>=50)?0:1;for(let i=startI;i<=400;i++){const p=dayPct(daysBack(i,getDate()),hh,ll);if(p===null||p<50)break;s++;}return s;}
function calcHabitStreak(habitId){const ll=effL();let s=0;for(let i=1;i<=400;i++){const d=daysBack(i,getDate());if((ll[d]||{})[habitId]!=='done')break;s++;}return s;}
function getPersonalBests() {
  const hh = effH(), ll = effL();
  if (!hh.length) return { bestStreak: null, bestMonth: null, bestWeek: null };

  // Best all-time streak (≥50% completion days chained consecutively)
  let bestStreak = 0, cur = 0;
  const allDates = Object.keys(ll).sort();
  if (allDates.length) {
    let prev = null;
    allDates.forEach(d => {
      const pct = dayPct(d, hh, ll);
      if (pct !== null && pct >= 50) {
        if (prev) {
          const diff = (new Date(d) - new Date(prev)) / 86400000;
          cur = diff === 1 ? cur + 1 : 1;
        } else { cur = 1; }
        if (cur > bestStreak) bestStreak = cur;
        prev = d;
      } else { cur = 0; prev = null; }
    });
  }

  // Best elapsed full calendar month
  let bestMonth = null;
  const monthMap = {};
  Object.keys(ll).forEach(d => {
    const key = d.slice(0, 7); // "YYYY-MM"
    if (!monthMap[key]) monthMap[key] = [];
    monthMap[key].push(d);
  });
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  Object.entries(monthMap).forEach(([key, dates]) => {
    if (key === curMonthKey) return; // skip current incomplete month
    const [y, m] = key.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const pct = Math.round((dates.filter(d => dayPct(d, hh, ll) >= 50).length / daysInMonth) * 100);
    if (bestMonth === null || pct > bestMonth) bestMonth = pct;
  });

  // Best elapsed full Mon-Sun calendar week
  let bestWeek = null;
  const weekMap = {};
  Object.keys(ll).forEach(d => {
    const date = new Date(d + 'T12:00');
    const dow = (date.getDay() + 6) % 7; // Mon=0
    const mon = new Date(date); mon.setDate(date.getDate() - dow);
    const key = mon.toISOString().slice(0, 10);
    if (!weekMap[key]) weekMap[key] = [];
    weekMap[key].push(d);
  });
  const todayD = new Date();
  const todayDow = (todayD.getDay() + 6) % 7;
  const thisMon = new Date(todayD); thisMon.setDate(todayD.getDate() - todayDow);
  const thisMonKey = thisMon.toISOString().slice(0, 10);
  Object.entries(weekMap).forEach(([key, dates]) => {
    if (key === thisMonKey) return; // skip current incomplete week
    const pct = Math.round((dates.filter(d => dayPct(d, hh, ll) >= 50).length / 7) * 100);
    if (bestWeek === null || pct > bestWeek) bestWeek = pct;
  });

  return { bestStreak, bestMonth, bestWeek };
}
function getBestDayOfWeek() {
  const hh = effH(), ll = effL();
  const dates = Object.keys(ll);
  if (dates.length < 7) return null;
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const daySums = [0,0,0,0,0,0,0];
  const dayCounts = [0,0,0,0,0,0,0];
  dates.forEach(d => {
    const pct = dayPct(d, hh, ll);
    if (pct === null) return;
    const dow = new Date(d + 'T12:00').getDay();
    daySums[dow] += pct;
    dayCounts[dow]++;
  });
  let bestDay = -1, bestAvg = -1;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] === 0) continue;
    const avg = daySums[i] / dayCounts[i];
    if (avg > bestAvg) { bestAvg = avg; bestDay = i; }
  }
  if (bestDay === -1) return null;
  return { day: dayNames[bestDay], pct: Math.round(bestAvg) };
}
function getWeeklyBars() {
  const hh = effH(), ll = effL();
  const today = getDate();
  const days = [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = daysBack(i, today);
    const pct = dayPct(d, hh, ll);
    const date = new Date(d + 'T12:00');
    days.push({ date: d, pct, label: dayNames[date.getDay()], isToday: d === today });
  }
  return days;
}
function getMonthOverMonth() {
  const hh = effH(), ll = effL();
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function monthStats(year, month) { // month is 1-based
    const key = `${year}-${String(month).padStart(2,'0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    let doneDays = 0, discDone = 0, discTotal = 0;
    const elapsed = year === now.getFullYear() && month === now.getMonth()+1
      ? now.getDate() : daysInMonth;
    for (let d = 1; d <= elapsed; d++) {
      const dateStr = `${key}-${String(d).padStart(2,'0')}`;
      const dayLog = ll[dateStr] || {};
      let dayDone = 0;
      hh.forEach(h => { if (dayLog[h.id] === 'done') { dayDone++; discDone++; } });
      discTotal += hh.length;
      const pct = dayPct(dateStr, hh, ll);
      if (pct !== null && pct >= 50) doneDays++;
    }
    const pct = elapsed > 0 ? Math.round((doneDays / elapsed) * 100) : 0;
    return { name: monthNames[month-1], pct: doneDays > 0 ? pct : null, elapsed, daysInMonth, doneDays, discDone, discTotal };
  }

  const curM = now.getMonth() + 1, curY = now.getFullYear();
  const prevM = curM === 1 ? 12 : curM - 1;
  const prevY = curM === 1 ? curY - 1 : curY;

  return { current: monthStats(curY, curM), previous: monthStats(prevY, prevM) };
}
function todayPct(){return dayPct(getDate(),effH(),effL());}
function weekPct(){const hh=effH(),ll=effL(),days=last7();let td=0;days.forEach(d=>{const l=ll[d]||{};hh.forEach(h=>{if(l[h.id]==='done')td++;});});return hh.length>0?Math.round((td/(hh.length*7))*100):null;}

async function load(){
  // One-time migration: copy localStorage data into Preferences on first run
  if(!localStorage.getItem('gc:pref_migrated')){
    const P=store._p();
    if(P){
      for(const k of['gc1:habits','gc1:logs','gc1:cats','gc:onboarded']){
        const v=localStorage.getItem('gc:'+k);
        if(v!==null){try{await P.set({key:k,value:v});}catch{}}
      }
      localStorage.setItem('gc:pref_migrated','1');
    }
  }
  try{const h=await store.get('gc1:habits');if(h)habits=JSON.parse(h.value);}catch{}
  try{const l=await store.get('gc1:logs');if(l)logs=JSON.parse(l.value);}catch{}
  try{
    const catsRaw=await store.get('gc1:cats');
    if(catsRaw){cats=JSON.parse(catsRaw.value);}
    else{cats=[{id:'c1',name:'Body'},{id:'c2',name:'Mind'},{id:'c3',name:'Craft'},{id:'c4',name:'Ritual'}];await saveCats();}
  }catch{cats=[{id:'c1',name:'Body'},{id:'c2',name:'Mind'},{id:'c3',name:'Craft'},{id:'c4',name:'Ritual'}];}
  selCat=cats[0]?.id||'';
  qi=Math.floor(Math.random()*QUOTES.length);
  isPlaceholder=habits.length===0;
}
async function saveH(){try{await store.set('gc1:habits',JSON.stringify(habits));}catch(e){showToast('Save failed');console.error('saveH:',e);}}
async function saveL(){try{await store.set('gc1:logs',JSON.stringify(logs));}catch(e){showToast('Save failed');console.error('saveL:',e);}}
async function saveCats(){try{await store.set('gc1:cats',JSON.stringify(cats));}catch(e){showToast('Save failed');console.error('saveCats:',e);}}
function _paywallLocked(){return typeof paywall!=='undefined'&&paywall.isLocked();}
function showUpgradePrompt(){
  if(typeof paywall!=='undefined')paywall.purchase().catch(()=>{});
  else showToast('Upgrade to unlock');
}
function showToast(msg, sub) {
  const t = document.getElementById('toast');
  if (!t) return;
  const hdrH = document.getElementById('hdr')?.offsetHeight || 56;
  document.documentElement.style.setProperty('--hdr-h', hdrH + 'px');
  document.getElementById('toast-msg').textContent = msg;
  const subEl = document.getElementById('toast-sub');
  if (subEl) { subEl.textContent = sub || ''; subEl.style.display = sub ? '' : 'none'; }
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
function showToastWithUndo(msg, undoFn) {
  const t = document.getElementById('toast');
  if (!t) return;
  const hdrH = document.getElementById('hdr')?.offsetHeight || 56;
  document.documentElement.style.setProperty('--hdr-h', hdrH + 'px');
  const msgEl = document.getElementById('toast-msg');
  const subEl = document.getElementById('toast-sub');
  if (msgEl) msgEl.innerHTML = esc(msg) + ' <span class="toast-undo" onclick="event.stopPropagation();(window._undoFn)()">UNDO</span>';
  if (subEl) { subEl.textContent = ''; subEl.style.display = 'none'; }
  window._undoFn = undoFn;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}
function addRipple(btn, e) {
  const r = document.createElement('span');
  r.className = 'ripple';
  const sz = Math.max(btn.offsetWidth, btn.offsetHeight);
  r.style.width = r.style.height = sz + 'px';
  if (e) {
    const rect = btn.getBoundingClientRect();
    r.style.left = (e.clientX - rect.left - sz / 2) + 'px';
    r.style.top  = (e.clientY - rect.top  - sz / 2) + 'px';
  } else {
    r.style.left = r.style.top = '0';
  }
  btn.appendChild(r);
  setTimeout(() => r.remove(), 500);
}
function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`${r},${g},${b}`;}

function updateStreakBadge(){
  const n=calcStreak(),tier=getTier(n);
  const fire=document.getElementById('sfire'),txt=document.getElementById('stxt'),badge=document.getElementById('sbadge');
  if(!fire||!txt||!badge)return;
  fire.style.color=tier.color;
  const emberSvg=document.getElementById('ember-svg');
  if(n===0){
    fire.style.animation='none';fire.style.filter='none';
    if(emberSvg){emberSvg.style.transform='scale(0)';emberSvg.style.opacity='0';}
  }else{
    fire.style.animation=`emberGlow ${Math.max(tier.spd,1.2)}s ease-in-out infinite`;
    const esz=Math.round(6+(tier.sz-10)*0.6);
    if(emberSvg){emberSvg.style.width=esz+'px';emberSvg.style.height=Math.round(esz*1.4)+'px';emberSvg.style.transform='scale(1)';emberSvg.style.opacity='1';}
  }
  const tierLabel = document.getElementById('stier');
  if(n===0){txt.textContent='0';txt.style.color='var(--blood)';badge.className='sbadge bad';badge.style.borderColor='';badge.style.background='rgba(176,168,152,0.08)';if(tierLabel)tierLabel.textContent='';}
  else{txt.textContent=String(n);txt.style.color=tier.color;badge.className='sbadge';badge.style.borderColor=tier.glow.replace(/[\d.]+\)$/,'0.35)');badge.style.background=`rgba(${hexToRgb(tier.color)},${tier.bgA})`;if(tierLabel){tierLabel.textContent=tier.name!=='Awaiting'?tier.name.toUpperCase():'';tierLabel.style.color=tier.color;}}
  if(n>0&&lastStreakTier!==null&&lastStreakTier!==tier.name){
    const sc2=document.getElementById('sc2');
    if(sc2){sc2.style.position='relative';const f=document.createElement('div');f.className='tier-up-flash';sc2.appendChild(f);setTimeout(()=>f.remove(),950);}
  }
  if(n>0)lastStreakTier=tier.name;
  updateStreakPanel();
  if(n>0){
    badge.style.background=`rgba(${hexToRgb(tier.color)||'234,88,12'},.07)`;
  }
}

function sw(v,el){
  if(view===v)return;
  const prevView=view;
  if(view==='record'&&v!=='record')currentMonthIdx=Math.max(0,monthList.length-1);
  view=v;
  document.querySelectorAll('.bni').forEach(b=>{b.classList.toggle('on',b.dataset.v===v);if(b.dataset.v===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(el){el.classList.add('tap');setTimeout(()=>el.classList.remove('tap'),300);}
  const c=document.getElementById('content');
  if(c)c.classList.add('tab-fade-out');
  setTimeout(()=>{
    if(c)c.classList.remove('tab-fade-out');
    render();
    if(c){c.classList.remove('tab-fade-in');void c.offsetWidth;c.classList.add('tab-fade-in');c.addEventListener('animationend',()=>c.classList.remove('tab-fade-in'),{once:true});}
    if(v==='today'||prevView==='today')setTimeout(updateStreakPanel,0);
  },150);
}
function swTo(v){view=v;document.querySelectorAll('.bni').forEach(b=>{b.classList.toggle('on',b.dataset.v===v);if(b.dataset.v===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});render();}
function nextQ(){const qc=document.getElementById('qcard');if(qc){qc.classList.add('flash');setTimeout(()=>qc.classList.remove('flash'),250);}qi=(qi+1)%QUOTES.length;const q2=document.getElementById('qcard');if(q2){q2.querySelector('.qtext').textContent=QUOTES[qi].t;q2.querySelector('.qauth').textContent='— '+QUOTES[qi].a;}}
function getTodayQuote(){const d=Math.floor(Date.now()/86400000);return QUOTES[d%QUOTES.length];}
function getTomorrowQuote(){const d=Math.floor(Date.now()/86400000)+1;return QUOTES[d%QUOTES.length];}
let quoteIdx = -1;
function qPreview(el){if(QUOTES.length<=1)return;const txt=el.querySelector('.qtext');const auth=el.querySelector('.qauth');if(quoteIdx===-1){const today=getTodayQuote();quoteIdx=QUOTES.findIndex(q=>q.t===today.t);}quoteIdx=(quoteIdx+1)%QUOTES.length;txt.textContent=QUOTES[quoteIdx].t;auth.textContent='— '+QUOTES[quoteIdx].a;}
function initQuoteLongPress(){
  const qcard=document.querySelector('.qcard');
  if(!qcard||qcard._lpInit)return;
  qcard._lpInit=true;
  let timer=null;
  qcard.addEventListener('pointerdown',(e)=>{
    if(e.target.closest('button'))return;
    timer=setTimeout(()=>{
      const txt=qcard.querySelector('.qtext');
      if(!txt)return;
      const text=txt.textContent.replace(/^"|"$/g,'').trim();
      if(!text)return;
      let saved=[];try{saved=JSON.parse(localStorage.getItem('gc1:savedQuotes')||'[]');}catch{saved=[];}
      if(!saved.includes(text)){saved.push(text);localStorage.setItem('gc1:savedQuotes',JSON.stringify(saved));
        qcard.style.transition='box-shadow .3s';qcard.style.boxShadow='0 0 20px var(--gold-15)';
        setTimeout(()=>{qcard.style.boxShadow='';},800);
        if(typeof comboVibrate==='function')comboVibrate(1);
        showToast('Quote saved');
      } else {showToast('Already saved');}
    },600);
  });
  qcard.addEventListener('pointerup',()=>clearTimeout(timer));
  qcard.addEventListener('pointercancel',()=>clearTimeout(timer));
  qcard.addEventListener('pointermove',()=>clearTimeout(timer));
}
const STREAK_MILESTONES = [
  { days: 7,   msg: '7-Day Streak',   sub: 'One week of iron will.' },
  { days: 14,  msg: '14-Day Streak',  sub: 'Two weeks. Unshakeable.' },
  { days: 30,  msg: '30-Day Streak',  sub: 'A month of discipline.' },
  { days: 60,  msg: '60-Day Streak',  sub: 'Two months forged.' },
  { days: 100, msg: '100-Day Streak', sub: 'Legendary commitment.' },
  { days: 365, msg: '365-Day Streak', sub: 'One full year. You are rare.' },
];
function checkStreakMilestone() {
  const streak = calcStreak();
  if (streak < 7) return;
  let shown;
  try { shown = JSON.parse(localStorage.getItem('gc1:milestones') || '{}'); } catch(e) { shown = {}; }
  const milestone = STREAK_MILESTONES.slice().reverse().find(m => streak >= m.days && !shown[m.days]);
  if (milestone) {
    shown[milestone.days] = Date.now();
    localStorage.setItem('gc1:milestones', JSON.stringify(shown));
    setTimeout(() => showToast(milestone.msg, milestone.sub), 1200);
  }
}
function fireConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';
  cvs.width = window.innerWidth * (window.devicePixelRatio || 1);
  cvs.height = window.innerHeight * (window.devicePixelRatio || 1);
  cvs.style.width = window.innerWidth + 'px';
  cvs.style.height = window.innerHeight + 'px';
  document.getElementById('app').appendChild(cvs);
  const cx = cvs.getContext('2d');
  cx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  const ac = ACCENT_COLORS[_accentKey] || ACCENT_COLORS.gold;
  const cols = [
    ac.hex,
    `rgba(${ac.r},${ac.g},${ac.b},0.7)`,
    `rgba(${Math.min(ac.r+40,255)},${Math.min(ac.g+40,255)},${Math.min(ac.b+40,255)},0.9)`,
    '#f5f2ec',
    `rgba(${Math.max(ac.r-30,0)},${Math.max(ac.g-30,0)},${Math.max(ac.b-30,0)},0.8)`,
  ];
  const pcs = [];
  for (let i = 0; i < 70; i++) {
    pcs.push({
      x: Math.random() * W, y: -10 - Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      rot: Math.random() * 360, rv: (Math.random() - 0.5) * 8,
      w: 4 + Math.random() * 6, h: 3 + Math.random() * 4,
      color: cols[Math.floor(Math.random() * cols.length)],
    });
  }
  const t0 = performance.now();
  function frame(now) {
    const el = now - t0;
    if (el > 2500) { cvs.remove(); return; }
    cx.clearRect(0, 0, W, H);
    const fade = el > 1800 ? 1 - (el - 1800) / 700 : 1;
    pcs.forEach(p => {
      p.x += p.vx; p.vy += 0.08; p.y += p.vy;
      p.rot += p.rv; p.vx *= 0.99;
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.rot * Math.PI / 180);
      cx.globalAlpha = fade;
      cx.fillStyle = p.color;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function pdShownCheck(){ try{ return localStorage.getItem('gc1:pdShown')===getDate(); }catch{return false;} }
function showPerfectDay() {
  if (pdShownCheck()) return;
  try{ localStorage.setItem('gc1:pdShown',getDate()); }catch{}
  const o = document.getElementById('pd-overlay');
  const m = document.getElementById('pd-modal');
  if (o) o.classList.add('show');
  if (m) { m.classList.remove('pd-exit'); m.classList.add('show'); }
  comboVibrate(5);
  fireConfetti();
  window._pdPrevFocus = document.activeElement;
  setTimeout(() => document.getElementById('pd-modal').focus(), 50);
  document.addEventListener('keydown', function pdEsc(e) {
    if (e.key === 'Escape') { closePerfectDay(); document.removeEventListener('keydown', pdEsc); }
  });
}
function closePerfectDay() {
  const o = document.getElementById('pd-overlay');
  const m = document.getElementById('pd-modal');
  if (o) { o.classList.add('pd-fade-out'); setTimeout(()=>{o.classList.remove('show','pd-fade-out');},350); }
  if (m) { m.classList.add('pd-exit'); setTimeout(()=>{m.classList.remove('show','pd-exit');},350); }
  if (window._pdPrevFocus) { window._pdPrevFocus.focus(); window._pdPrevFocus = null; }
}
/* ── Weekly Report ── */
let _wrPanel=0;
const HERO_QUOTES={
  perfect:["The summit is not the end. It is where the wind is strongest.","Perfection is a door, not a destination — what lies beyond it is what defines you.","Even fire must rest to burn again. You have earned this.","The rarest victories are the quiet ones. This was one.","You did not bend. The world noticed, even if it said nothing.","To complete everything is human. To begin again tomorrow is divine."],
  crushing:["Momentum is invisible until it isn't. You are building something others cannot see.","The days you did not feel like it were the ones that mattered most. You showed up anyway.","Discipline is choosing between what you want now and what you want most.","You are not lucky. You are relentless.","The forge glows hottest for those who refuse to leave it.","Consistency is not glamorous. It is just powerful."],
  comeback:["The forge does not remember your absence. Only your return.","Falling is not failure. Staying down is. You stood.","There is no shame in the restart. Only in the refusal to begin again.","The blade that breaks and is reforged cuts deeper than one never tested.","You came back. That is the whole story.","Most people stay down. You did not. Remember that."],
  strong:["You are not where you were. That is enough.","The compound effect is silent until it roars. Keep going.","Most quit at this stage. You did not.","Quiet consistency is the loudest form of ambition.","The work you cannot see is the work that matters most.","You have become someone who shows up. That changes everything."],
  steady:["Not every day will be a fire. Some will be embers. Both matter.","The forge respects the one who shows up, not the one who shines.","Quiet discipline outlasts loud motivation. Every time.","You are holding the line. The line is what keeps everything together.","Progress whispers. Regression shouts. Trust the whisper.","The middle of the journey is where most people turn back. You are still here."],
  slipping:["The crack in the blade is where the light enters.","You are not starting over. You are starting from experience.","One discipline. One day. That is all the forge asks of you.","The distance between where you are and where you want to be is one decision.","What matters now is not what happened. It is what happens next.","You have survived worse. This is just a chapter."],
  cold:["The ember never truly dies. It waits beneath the ash.","You have been here before. You know the way back.","The hardest step is always the next one. Take it.","The forge is patient. It does not close. It does not judge. It waits.","Begin again. Not because it is easy, but because you are still here.","Something in you brought you back to this screen. Listen to it."],
  newForge:["Every master was once a disaster. Begin.","The first strike shapes the metal. You have already begun.","Small fires grow. Trust the process.","You do not need to see the whole staircase. Just the next step.","What you start today will thank you in six months.","The forge was empty before you arrived. Now it is not. That matters."]
};
const Q_TEMPLATES=["{S} {B} {E}.","Not all progress is visible. {C}.","The forge {B} {E} — {R}.","Strength {B} {E}, {T}."];
const Q_PARTS={
  S:{up:["Your fire","What you built","This momentum","The heat in you","Your discipline"],down:["The ash","What fell away","The silence","This weight","The gap"],any:["The forge","Discipline","The blade","Iron","The anvil","The path","Strength","The work"]},
  B:{up:["was earned by","belongs to","rewards","sharpens","recognizes"],down:["forgives","does not remember","waits beneath","asks only for","heals through"],any:["was never about","is not measured by","transforms","outlasts","begins with"]},
  E:{up:["those who refused to stop","the ones who stayed","every quiet morning you chose this","hands that would not let go","the relentless"],down:["your absence — only your return","the willingness to begin again","one more honest day","showing up imperfectly","the courage to restart"],any:["what others see","talent — only by persistence","a single step repeated","the days no one was watching"]},
  C:{up:["Now protect it","Do not mistake the view for the peak","Keep the fire fed"],down:["But you are still moving","And you are still here","Begin with what you have"],any:["The forge knows","That is enough for today","Everything else is noise"]},
  R:{up:["because you earned it","because consistency is its own proof"],down:["because starting over is still starting","because the forge does not close"],any:["because that is what iron does","because you chose to be here"]},
  T:{up:["and the forge remembers","and that changes everything"],down:["and that is enough","and tomorrow is unwritten"],any:["always","every single time","without exception"]}
};

function _wrSeed(){return Math.floor(Date.now()/604800000);}
function _wrRng(seed){let s=seed|0;return()=>{s=s*1664525+1013904223&0x7fffffff;return(s>>>0)/0x80000000;};}
function _wrHash(str){let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return Math.abs(h);}

function getWeeklyState(){
  const wp=weekPct();const streak=calcStreak();
  const joined=localStorage.getItem('gc1:joined')||getDate();
  const daysSinceJoin=Math.floor((new Date()-new Date(joined+'T00:00:00'))/86400000);
  if(daysSinceJoin<14)return 'newForge';
  const hh=effH(),ll=effL();
  let lwDone=0,lwTotal=0;
  for(let i=7;i<14;i++){const d=daysBack(i);const dl=ll[d]||{};hh.forEach(h=>{if(dl[h.id]==='done')lwDone++;if(dl[h.id])lwTotal++;});}
  const lwPct=lwTotal>0?Math.round(lwDone/lwTotal*100):null;
  const delta=lwPct!==null&&wp!==null?wp-lwPct:0;
  if(wp===100)return 'perfect';
  if(wp>=85&&streak>=7)return 'crushing';
  if(delta>=20&&wp>=50)return 'comeback';
  if(wp>=70)return 'strong';
  if(wp>=50)return 'steady';
  if(wp>=30)return 'slipping';
  return 'cold';
}

function getWeeklyQuote(state){
  const mood=['perfect','crushing','strong','comeback'].includes(state)?'up':['slipping','cold'].includes(state)?'down':'any';
  const rng=_wrRng(_wrSeed()+_wrHash(state));
  if(rng()<0.5&&HERO_QUOTES[state]?.length){
    return HERO_QUOTES[state][Math.floor(rng()*HERO_QUOTES[state].length)];
  }
  const tpl=Q_TEMPLATES[Math.floor(rng()*Q_TEMPLATES.length)];
  return tpl.replace(/\{(\w+)\}/g,(_,key)=>{
    const p=Q_PARTS[key];if(!p)return '';
    const pool=[...(p[mood]||[]),...(p.any||[])];
    return pool[Math.floor(rng()*pool.length)]||'';
  });
}

function getLastWeekPct(){
  const hh=effH(),ll=effL();
  let done=0,total=0;
  for(let i=7;i<14;i++){const d=daysBack(i);const dl=ll[d]||{};hh.forEach(h=>{if(dl[h.id]==='done')done++;if(dl[h.id])total++;});}
  return total>0?Math.round(done/total*100):null;
}

function buildWeeklyReport(){
  const wp=weekPct()||0;
  const bars=getWeeklyBars();
  const streak=calcStreak();
  const tier=getTier(streak);
  const best=bestHabit(effH(),effL());
  const worst=worstHabit(effH(),effL());
  const state=getWeeklyState();
  const quote=getWeeklyQuote(state);
  const lwPct=getLastWeekPct();
  const delta=lwPct!==null?wp-lwPct:null;
  const hh=effH(),ll=effL();
  let perfectDays=0;
  for(let i=0;i<7;i++){const d=daysBack(i);const p=dayPct(d,hh,ll);if(p===100)perfectDays++;}
  const wLabel=wp>=90?'Forged':wp>=70?'Strong':wp>=50?'Holding':wp>=30?'Wavering':'Rebuilding';
  const panels=document.getElementById('wr-panels');
  const dots=document.getElementById('wr-dots');
  if(!panels||!dots)return;
  const p1=`<div class="wr-panel">
    <div class="wr-title">YOUR WEEK</div>
    <div class="wr-big-num" id="wr-counter" data-target="${wp}">0</div>
    <div class="wr-score-word">${wLabel}</div>
    <div class="wr-ember">${typeof emberSVGHTML==='function'?emberSVGHTML(Math.max(16,Math.round(wp/100*40)),wp>=70):''}</div>
  </div>`;
  const maxPct=Math.max(...bars.map(b=>b.pct||0),10);
  const barHTML=bars.map((b,i)=>{
    const h=b.pct!==null?Math.max(4,Math.round((b.pct/maxPct)*120)):4;
    const cls=b.pct>=80?'high':b.pct>=50?'mid':'low';
    return `<div class="wr-bar-col">
      <div class="wr-bar-pct">${b.pct!==null?b.pct+'%':''}</div>
      <div class="wr-bar ${cls}" style="height:4px;--target-h:${h}px;" data-rise="${i}"></div>
      <div class="wr-bar-lbl">${b.label}</div>
    </div>`;
  }).join('');
  const p2=`<div class="wr-panel"><div class="wr-title">7 DAYS</div><div class="wr-bar-row">${barHTML}</div></div>`;
  let statsHTML='';
  if(best)statsHTML+=`<div class="wr-stat-row"><span class="wr-stat-label">Best Discipline</span><span class="wr-stat-value">${esc(best.name)} ${best.pct}%</span></div>`;
  if(worst)statsHTML+=`<div class="wr-stat-row"><span class="wr-stat-label">Needs Work</span><span class="wr-stat-value">${esc(worst.name)} ${worst.pct}%</span></div>`;
  statsHTML+=`<div class="wr-stat-row"><span class="wr-stat-label">Perfect Days</span><span class="wr-stat-value">${perfectDays} of 7</span></div>`;
  statsHTML+=`<div class="wr-stat-row"><span class="wr-stat-label">Streak</span><span class="wr-stat-value">${streak>0?streak+'d · '+tier.name:'No streak'}</span></div>`;
  if(delta!==null)statsHTML+=`<div class="wr-stat-row"><span class="wr-stat-label">vs Last Week</span><span class="wr-stat-value">${delta>=0?'<span class="wr-up">+'+delta+'%</span>':'<span class="wr-down">'+delta+'%</span>'}</span></div>`;
  const p3=`<div class="wr-panel"><div class="wr-title">HIGHLIGHTS</div>${statsHTML}</div>`;
  const hintShown=localStorage.getItem('gc1:quoteSaveHintShown');
  const hintHTML=hintShown?'':'<div class="wr-hint">hold to save</div>';
  const p4=`<div class="wr-panel" style="position:relative;">
    <div class="wr-quote-mark">\u201C</div>
    <div class="wr-title">THE FORGE SPEAKS</div>
    <div class="wr-quote-text" id="wr-quote-text">${esc(quote)}</div>
    <div class="wr-divider"></div>
    <button class="wr-btn" onclick="closeWeeklyReport()">CONTINUE</button>
    ${hintHTML}
  </div>`;
  panels.innerHTML=p1+p2+p3+p4;
  dots.innerHTML=[0,1,2,3].map(i=>`<div class="wr-dot${i===0?' active':''}" data-panel="${i}"></div>`).join('');
  _wrPanel=0;
  panels.style.transform='translateX(0)';
}

function showWeeklyReport(){
  if(_paywallLocked())return;
  if(!getPref('weeklyReport'))return;
  const joined=localStorage.getItem('gc1:joined');
  if(!joined)return;
  const daysSinceJoin=Math.floor((new Date()-new Date(joined+'T00:00:00'))/86400000);
  if(daysSinceJoin<7)return;
  const lastShown=localStorage.getItem('gc1:weeklyReportShown');
  if(lastShown){const daysSince=Math.floor((new Date()-new Date(lastShown+'T00:00:00'))/86400000);if(daysSince<7)return;}
  localStorage.setItem('gc1:weeklyReportShown',getDate());
  buildWeeklyReport();
  const o=document.getElementById('wr-overlay');
  const m=document.getElementById('wr-modal');
  if(o)o.classList.add('show');
  if(m)m.classList.add('show');
  setTimeout(()=>document.getElementById('wr-modal')?.focus(),50);
  const counter=document.getElementById('wr-counter');
  if(counter){
    const target=parseInt(counter.dataset.target)||0;
    let current=0;const duration=1200;const start=performance.now();
    const anim=(now)=>{
      const elapsed=now-start;const progress=Math.min(elapsed/duration,1);
      const eased=1-Math.pow(1-progress,3);
      current=Math.round(eased*target);
      counter.textContent=current+'%';
      if(progress<1)requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }
  const wp=weekPct()||0;
  if(wp>=80&&typeof fireConfetti==='function')setTimeout(fireConfetti,600);
  setTimeout(()=>{
    document.querySelectorAll('.wr-bar[data-rise]').forEach((bar,i)=>{
      setTimeout(()=>{bar.style.height=bar.style.getPropertyValue('--target-h');},i*100);
    });
  },400);
  document.addEventListener('keydown',function wrEsc(e){
    if(e.key==='Escape'){closeWeeklyReport();document.removeEventListener('keydown',wrEsc);}
  });
  _initWRSwipe();
  _initWRQuoteLongPress();
}

function closeWeeklyReport(){
  const o=document.getElementById('wr-overlay');
  const m=document.getElementById('wr-modal');
  if(o){o.classList.remove('show');}
  if(m){m.classList.remove('show');}
}

function _initWRSwipe(){
  const panels=document.getElementById('wr-panels');
  if(!panels)return;
  let startX=0,currentX=0,dragging=false;
  const totalPanels=4;
  panels.addEventListener('pointerdown',(e)=>{if(e.pointerType==='mouse'&&e.button!==0)return;startX=e.clientX;currentX=0;dragging=true;panels.style.transition='none';});
  panels.addEventListener('pointermove',(e)=>{if(!dragging)return;currentX=e.clientX-startX;const offset=-_wrPanel*100;const pct=offset+(currentX/panels.offsetWidth)*100;panels.style.transform=`translateX(${pct}%)`;});
  panels.addEventListener('pointerup',(e)=>{if(!dragging)return;dragging=false;panels.style.transition='';
    if(Math.abs(currentX)>50){
      if(currentX<0&&_wrPanel<totalPanels-1)_wrPanel++;
      else if(currentX>0&&_wrPanel>0)_wrPanel--;
    }
    panels.style.transform=`translateX(-${_wrPanel*100}%)`;
    document.querySelectorAll('.wr-dot').forEach((d,i)=>d.classList.toggle('active',i===_wrPanel));
    if(_wrPanel===1){document.querySelectorAll('.wr-bar[data-rise]').forEach((bar,i)=>{setTimeout(()=>{bar.style.height=bar.style.getPropertyValue('--target-h');},i*100);});}
  });
  panels.addEventListener('pointercancel',()=>{dragging=false;panels.style.transition='';panels.style.transform=`translateX(-${_wrPanel*100}%)`;});
  document.getElementById('wr-modal')?.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowRight'&&_wrPanel<totalPanels-1){_wrPanel++;panels.style.transform=`translateX(-${_wrPanel*100}%)`;document.querySelectorAll('.wr-dot').forEach((d,i)=>d.classList.toggle('active',i===_wrPanel));}
    if(e.key==='ArrowLeft'&&_wrPanel>0){_wrPanel--;panels.style.transform=`translateX(-${_wrPanel*100}%)`;document.querySelectorAll('.wr-dot').forEach((d,i)=>d.classList.toggle('active',i===_wrPanel));}
  });
}

function _initWRQuoteLongPress(){
  const el=document.getElementById('wr-quote-text');
  if(!el)return;
  let timer=null;
  el.addEventListener('pointerdown',()=>{
    timer=setTimeout(()=>{
      const text=el.textContent;if(!text)return;
      let saved=[];try{saved=JSON.parse(localStorage.getItem('gc1:savedQuotes')||'[]');}catch{saved=[];}
      if(!saved.includes(text)){saved.push(text);localStorage.setItem('gc1:savedQuotes',JSON.stringify(saved));
        localStorage.setItem('gc1:quoteSaveHintShown','1');
        el.style.transition='color .3s';el.style.color='var(--gold)';setTimeout(()=>{el.style.color='';},800);
        if(typeof comboVibrate==='function')comboVibrate(1);
        showToast('Quote saved');
      } else {showToast('Already saved');}
    },600);
  });
  el.addEventListener('pointerup',()=>clearTimeout(timer));
  el.addEventListener('pointercancel',()=>clearTimeout(timer));
  el.addEventListener('pointermove',()=>clearTimeout(timer));
}

function openSettings() {
  const el = document.getElementById('settings-sheet');
  const backdrop = document.getElementById('settings-backdrop');
  const list = document.getElementById('settings-list');
  if (!el || !list) return;
  if (el.classList.contains('open')) { closeSettings(); return; }
  const hh = effH();
  const totalLogs = Object.keys(effL()).length;
  list.innerHTML = `
    <div class="settings-row" role="button" tabindex="0" onclick="exportData();closeSettings();" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon">↓</span><span class="settings-row-label">Export Record</span></div>
      <span class="settings-row-value">${totalLogs} day${totalLogs!==1?'s':''} logged</span>
    </div>
    <div class="settings-row" role="button" tabindex="0" onclick="localStorage.removeItem('gc1:milestones');closeSettings();showToast('Milestones reset');" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon">↻</span><span class="settings-row-label">Reset Milestones</span></div>
      <span class="settings-row-value">Celebrations only</span>
    </div>
    <div class="settings-row" role="button" tabindex="0" onclick="rptSheet('about');closeSettings();" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon">◆</span><span class="settings-row-label">About GRITCORE</span></div>
      <span class="settings-row-value"></span>
    </div>
    <div class="settings-pref-header">ACCENT COLOR</div>
    ${Object.entries(ACCENT_GROUPS).map(([group, keys]) => `
      <div class="accent-section-label">${group}</div>
      <div style="display:flex;gap:8px;padding:4px 16px 12px;flex-wrap:wrap;">
        ${keys.map(key => {
          const c = ACCENT_COLORS[key];
          return `<div class="accent-chip${_accentKey===key?' selected':''}" data-accent="${key}" role="radio" aria-checked="${_accentKey===key}" aria-label="${key} accent color" tabindex="0" onclick="setAccentColor('${key}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}" style="width:32px;height:32px;border-radius:50%;background:${c.hex};border:2px solid ${_accentKey===key?'var(--ct)':'rgba(255,255,255,.12)'};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .2s;${_accentKey===key?'box-shadow:0 0 8px '+c.glow:''}">${_accentKey===key?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ct)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>`;
        }).join('')}
      </div>
    `).join('')}
    <div class="accent-selected-name" style="text-align:center;padding:0 16px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:'Josefin Sans',sans-serif;">${_accentKey.toUpperCase()}</div>
    <div class="settings-pref-header">CUSTOMISATION</div>
    ${[
      {icon:'◈',label:'Streak Badges',sub:'Show streak count on cards',key:'streaks'},
      {icon:'×',label:'Combo Counter',sub:'x1, x2, x3 on rapid logging',key:'combo'},
      {icon:'◇',label:'Button Effects',sub:'Ripple & glow on log',key:'buttonFx'},
      {icon:'≡',label:'Haptic Feedback',sub:'Vibration on interactions',key:'haptic'},
      {icon:'○',label:'Background Animations',sub:'Marble glow, ambient pulse',key:'bgAnim'},
      {icon:'△',label:'Heat System',sub:'Silver → gold color shift',key:'heat'},
      {icon:'◐',label:'Reduced Animations',sub:'~33% intensity',key:'reducedAnim'},
      {icon:'✦',label:'Perfect Day',sub:'Celebration when all done',key:'perfectDay'},
      {icon:'★',label:'Achievements',sub:'Streak milestones',key:'achievements'},
      {icon:'❝',label:'Motivational Quotes',sub:'Quote on Today tab',key:'quotes'},
      {icon:'◆',label:'Weekly Report',sub:'Summary after each week',key:'weeklyReport'},
    ].map(r=>`<div class="settings-pref-row"><span class="settings-pref-icon">${r.icon}</span><div style="flex:1"><div class="settings-pref-label">${r.label}</div><div class="settings-pref-sublabel">${r.sub}</div></div><div class="ob-pill-switch${getPref(r.key)?' on':''}" role="switch" aria-checked="${getPref(r.key)}" tabindex="0" data-pref="${r.key}" onclick="toggleSettingsPref(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><div class="ob-pill-knob"></div></div></div>`).join('')}
    ${localStorage.getItem('gc:dev')==='1'?`
    <div class="settings-row" role="button" tabindex="0" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:8px;" onclick="if(confirm('Generate 1 year of sample data? This will overwrite existing logs.')){devGenYear();closeSettings();}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon">⚙</span><span class="settings-row-label">Generate 1 Year Data</span></div>
      <span class="settings-row-value" style="color:rgba(251,191,36,0.6);">Dev</span>
    </div>
    <div class="settings-row" role="button" tabindex="0" onclick="if(confirm('Reset ALL data? Habits, logs, milestones — everything goes back to day zero. This cannot be undone.')){devResetAll();closeSettings();}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon" style="color:rgba(220,80,80,0.8);">⊘</span><span class="settings-row-label" style="color:rgba(220,80,80,0.8);">Reset All Data</span></div>
      <span class="settings-row-value" style="color:rgba(220,80,80,0.5);">Dev</span>
    </div>
    <div class="settings-row" role="button" tabindex="0" onclick="devTriggerOnboarding()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="settings-row-left"><span class="settings-row-icon">⚙</span><span class="settings-row-label">Show Onboarding</span></div>
      <span class="settings-row-value" style="color:rgba(251,191,36,0.6);">Dev</span>
    </div>`:''}
    <div class="settings-version" onclick="onVersionTap()" style="cursor:pointer;">GritCore v${APP_VERSION}</div>
  `;
  backdrop.style.display = 'block';
  requestAnimationFrame(() => el.classList.add('open'));
  window._settingsPrevFocus = document.activeElement;
  setTimeout(() => document.getElementById('settings-sheet').focus(), 50);
  // Swipe-to-close handled by universal initSheetSwipe()
}
function toggleSettingsPref(el){
  const key=el.dataset.pref;
  const on=!el.classList.contains('on');
  el.classList.toggle('on',on);
  el.setAttribute('aria-checked',String(on));
  setPref(key,on);
  if(key==='reminder'){on?gcNotifications.scheduleDailyReminder(9,0):gcNotifications.cancelReminder();}
  render();
}
function closeSettings() {
  const el = document.getElementById('settings-sheet');
  const bd = document.getElementById('settings-backdrop');
  if (!el) return;
  el.classList.remove('open');
  if (bd) { bd.classList.remove('open'); setTimeout(() => { bd.style.display = 'none'; }, 380); }
  if (window._settingsPrevFocus) { window._settingsPrevFocus.focus(); window._settingsPrevFocus = null; }
}
/* ── Dev Tools ── */
function devGenYear(){
  if(!habits.length){showToast('Add at least one discipline first');return;}
  const today=new Date();
  for(let i=365;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    if(!logs[ds])logs[ds]={};
    habits.forEach(h=>{
      const r=Math.random();
      if(r<0.72)logs[ds][h.id]='done';
      else if(r<0.88)logs[ds][h.id]='failed';
      // else skip (no entry) ~12%
    });
  }
  saveL();render();
  showToast('1 year generated','366 days of sample logs');
}
function markH(id,status,btnEl,evt){
  if(isPlaceholder)return;
  const t=getDate();if(!logs[t])logs[t]={};
  const prev=logs[t][id];logs[t][id]=prev===status?null:status;saveL();checkAchievements();
  if(btnEl){btnEl.classList.add(status==='done'?'stamp-done':'stamp-fail');setTimeout(()=>btnEl.classList.remove('stamp-done','stamp-fail'),320);addRipple(btnEl,evt);}
  const done2 = habits.filter(h => logs[t][h.id] === 'done').length;
  const tot2 = habits.length;
  const undoFn=()=>{logs[t][id]=prev;saveL();patchHabitCard(id,prev);renderScores();updateHeader();};
  if(logs[t][id]==='done'){ showToastWithUndo(tot2>0?`Marked \u2713 \u00b7 ${done2} of ${tot2} today`:'Marked \u2713',undoFn); heatFlash(); comboHit(evt); }
  else if(logs[t][id]==='failed'){ showToastWithUndo('Logged \u2717 \u00b7 face it',undoFn); comboReset(); }
  else { showToastWithUndo('Cleared',undoFn); comboReset(); }
  patchHabitCard(id,logs[t][id]);renderScores();updateHeader();
  const _tl=logs[t]||{};updateHeat(habits.filter(h=>_tl[h.id]==='done').length,habits.length);
  // Perfect Day check
  if (done2 === tot2 && tot2 > 0 && logs[t][id] === 'done') {
    setTimeout(showPerfectDay, 600);
  }
  checkStreakMilestone();
}
function renderScores(){
  const tp=todayPct(),wp=weekPct(),streak=calcStreak(),tier=getTier(streak);
  const scores=[
    {id:'sc0',num:tp!==null?tp+'%':'—',word:tp!==null?todayLabel(tp):'',cls:tp!==null&&tp>=70?'lit':tp!==null&&tp<40?'bad':tp!==null?'ok':''},
    {id:'sc1',num:wp!==null?wp+'%':'—',word:wp!==null?weekLabel(wp):'',cls:wp!==null&&wp>=70?'lit':wp!==null&&wp<40?'bad':wp!==null?'ok':''},
    {id:'sc2',num:streak>0?streak:'—',word:streak>0?tier.name:'No Streak',cls:streak>=3?'lit':streak>0?'ok':'bad'},
  ];
  scores.forEach(s=>{
    const el=document.getElementById(s.id);if(!el)return;
    el.className=`sc card ${s.cls}`;
    const n=el.querySelector('.sc-num');
    if(n&&n.textContent!==String(s.num)){n.classList.remove('upd');void n.offsetWidth;n.classList.add('upd');setTimeout(()=>n.classList.remove('upd'),350);}
    if(n)n.textContent=s.num;
    const w=el.querySelector('.sc-word');if(w)w.textContent=s.word;
  });
}
function renderHabits(){
  const w=document.getElementById('hlist-wrap');if(!w)return;
  const t=getDate(),hh=effH(),ll=effL(),tl=ll[t]||{};
  let h='<div class="hlist">';
  hh.forEach((hb,i)=>{const s=tl[hb.id],dis=isPlaceholder?'style="opacity:.55;pointer-events:none"':'';
    const hStreak=isPlaceholder?0:calcHabitStreak(hb.id);
    const tierClass=hStreak>=30?'tier-fire':hStreak>=14?'tier-gold':hStreak>=7?'tier-bronze':'';
    const streakBadge=hStreak>=2?`<span class="hcard-streak ${tierClass}">${hStreak}d</span>`:'';
    h+=`<div class="hcard card ${s||''} af s${Math.min(i+1,6)}" data-id="${hb.id}" ${dis}><div class="hcard-meta"><div class="hcard-name">${esc(hb.name)}</div><div class="hcard-cat">${esc(getCatName(hb.cat))}${isPlaceholder?' · Sample':''}</div>${streakBadge}</div><div class="hcard-btns"><button class="hbtn ${s==='done'?'don':''}" onclick="markH('${hb.id}','done',this,event)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${s==='done'?'var(--gold)':'var(--ctd)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="hbtn ${s==='failed'?'fai':''}" onclick="markH('${hb.id}','failed',this,event)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${s==='failed'?'var(--blood)':'var(--ctd)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>`;
  });
  h+='</div>';w.innerHTML=h;
}
function patchHabitCard(id,status){
  const card=document.querySelector(`.hcard[data-id="${id}"]`);if(!card)return;
  card.className=`hcard card ${status||''}`;
  const btns=card.querySelectorAll('.hbtn');
  if(btns[0]){btns[0].className='hbtn'+(status==='done'?' don':'');btns[0].querySelector('svg').setAttribute('stroke',status==='done'?'var(--gold)':'var(--ctd)');}
  if(btns[1]){btns[1].className='hbtn'+(status==='failed'?' fai':'');btns[1].querySelector('svg').setAttribute('stroke',status==='failed'?'var(--blood)':'var(--ctd)');}
  if(status==='failed'){card.classList.add('crack-anim');card.addEventListener('animationend',()=>card.classList.remove('crack-anim'),{once:true});}
  if(status==='done'){card.classList.add('done-anim');card.addEventListener('animationend',()=>card.classList.remove('done-anim'),{once:true});}
}
function addH(){const v=document.getElementById('fi')?.value?.trim();if(!v)return;habits.push({id:Date.now().toString(),name:v,cat:selCat,created:getDate()});isPlaceholder=false;saveH();checkAchievements();showToast('Discipline forged');render();setTimeout(()=>{const e=document.getElementById('fi');if(e){e.value='';e.focus();}},60);}
/* ── Edit Discipline ── */
let _editingId = null;
function editH(id) { _editingId = id; render(); }
function saveEdit(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  const nameInput = document.getElementById('edit-name-' + id);
  const newName = nameInput?.value?.trim();
  if (newName) h.name = newName;
  _editingId = null;
  saveH();
  render();
  showToast('Updated');
}
function cancelEdit() { _editingId = null; render(); }
function setEditCat(id, catId) { const h = habits.find(h => h.id === id); if (h) h.cat = catId; }

/* ── Delete with Undo ── */
let _pendingDelete = null;
let _deleteTimer = null;
function delH(id) {
  if (_pendingDelete) { _commitDelete(); }
  const idx = habits.findIndex(h => h.id === id);
  if (idx === -1) return;
  _pendingDelete = { habit: habits[idx], index: idx };
  habits.splice(idx, 1);
  isPlaceholder = habits.length === 0;
  render();
  showToastWithUndo('Discipline removed', () => {
    if (_pendingDelete) {
      habits.splice(_pendingDelete.index, 0, _pendingDelete.habit);
      isPlaceholder = false;
      _pendingDelete = null;
      clearTimeout(_deleteTimer);
      _deleteTimer = null;
      saveH();
      render();
      showToast('Restored');
    }
  });
  _deleteTimer = setTimeout(_commitDelete, 5000);
}
function _commitDelete() {
  _pendingDelete = null;
  if (_deleteTimer) { clearTimeout(_deleteTimer); _deleteTimer = null; }
  saveH();
}
function selCatFn(id){selCat=id;document.querySelectorAll('.catpill').forEach(p=>p.classList.toggle('sel',p.dataset.c===id));}
function getCatName(id){return cats.find(c=>c.id===id||c.id.toLowerCase()===id?.toLowerCase())?.name||(id?id.charAt(0).toUpperCase()+id.slice(1):'');}
function catHasHabits(id){return habits.some(h=>h.cat===id);}
function addCat(){
  if(cats.length>=8)return;
  const list=document.querySelector('.cat-mgr-list');
  if(!list||list.querySelector('.cat-inline-input'))return;
  const row=document.createElement('div');
  row.className='cat-pill-mgr';
  row.innerHTML='<input class="forge-input cat-inline-input" placeholder="Category name" maxlength="20" style="flex:1;padding:6px 10px;font-size:12px;">';
  list.appendChild(row);
  const inp=row.querySelector('input');
  inp.focus();
  const commit=()=>{
    const name=inp.value.trim().slice(0,20);
    if(name){cats.push({id:'c'+Date.now(),name});saveCats();}
    render();
  };
  inp.onkeydown=(e)=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape')render();};
  inp.onblur=commit;
}
function renameCat(id){
  const cat=cats.find(c=>c.id===id);
  if(!cat)return;
  const nameEl=document.querySelector(`.cat-pill-mgr [onclick*="${id}"]`)?.closest('.cat-pill-mgr')?.querySelector('.cat-pill-name');
  if(!nameEl)return;
  const oldName=cat.name;
  const inp=document.createElement('input');
  inp.className='forge-input cat-inline-input';
  inp.value=oldName;
  inp.maxLength=20;
  inp.style.cssText='flex:1;padding:4px 8px;font-size:12px;width:80px;';
  nameEl.replaceWith(inp);
  inp.focus();
  inp.select();
  const commit=()=>{
    const name=inp.value.trim().slice(0,20);
    if(name){cat.name=name;saveCats();}
    render();
  };
  inp.onkeydown=(e)=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape')render();};
  inp.onblur=commit;
}
function deleteCat(id){if(cats.length<=1)return;if(catHasHabits(id)){showToast('Remove disciplines first');return;}cats=cats.filter(c=>c.id!==id);if(selCat===id)selCat=cats[0]?.id||'';saveCats();render();}
function exportData(){if(_paywallLocked()){showUpgradePrompt();return;}let txt=`GRITCORE — DISCIPLINE RECORD\nExported: ${getDate()}\n${'═'.repeat(40)}\n\nHABITS:\n`;habits.forEach(h=>{txt+=`  • ${h.name} [${getCatName(h.cat)}]\n`;});txt+=`\n30-DAY LOG:\n\n`;last30().forEach(d=>{const l=logs[d]||{};const done=habits.filter(h=>l[h.id]==='done').length;const tot=habits.filter(h=>l[h.id]).length;txt+=`${d}: ${tot?`${done}/${habits.length}`:'-'}\n`;});const blob=new Blob([txt],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='gritcore-log.txt';a.click();URL.revokeObjectURL(url);showToast('Exported');}
function bestHabit(hh,ll){if(!hh.length)return null;let best=null,bs=-1;hh.forEach(h=>{let d=0,t=0;last30().forEach(day=>{const l=ll[day]||{};if(l[h.id]==='done'){d++;t++;}else if(l[h.id]==='failed')t++;});if(t>0){const s=d/t;if(s>bs){bs=s;best={name:h.name,pct:Math.round(s*100)};}}});return best;}
function worstHabit(hh,ll){if(!hh.length)return null;let worst=null,ws=2;hh.forEach(h=>{let d=0,t=0;last30().forEach(day=>{const l=ll[day]||{};if(l[h.id]==='done'){d++;t++;}else if(l[h.id]==='failed')t++;});if(t>2){const s=d/t;if(s<ws){ws=s;worst={name:h.name,pct:Math.round(s*100)};}}});return worst;}
function bestDayStr(hh,ll){const days=[0,0,0,0,0,0,0],tots=[0,0,0,0,0,0,0];last30().forEach(d=>{const wd=new Date(d+'T12:00').getDay();const p=dayPct(d,hh,ll);if(p!==null){days[wd]+=p;tots[wd]++;}});const avgs=days.map((s,i)=>tots[i]?s/tots[i]:0);const mx=avgs.indexOf(Math.max(...avgs));return tots[mx]?`${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][mx]} (${Math.round(avgs[mx])}%)`:'—';}


function updateHeader(){
  updateStreakBadge();
}

function renderToday(){
  const t=getDate(),hh=effH(),ll=effL(),tl=ll[t]||{};
  const tp=todayPct(),wp=weekPct(),streak=calcStreak();
  const d=new Date();
  const ds=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
  let hhtml='';
  if(!hh.length){hhtml=`<button class="empty-card card af btn-reset" onclick="swTo('forge')"><div class="empty-title">Your disciplines await.</div><div class="empty-sub">Nothing is forged without a first strike.<br>Add your first discipline to begin.</div><div class="empty-cta">Open Forge →</div></button>`;}
  else{
    hhtml=`<div id="hlist-wrap"><div class="hlist">`;
    hh.forEach((hb,i)=>{const s=tl[hb.id],dis=isPlaceholder?'style="opacity:.55;pointer-events:none"':'';
      const hStreak=isPlaceholder?0:calcHabitStreak(hb.id);
      const tierClass=hStreak>=30?'tier-fire':hStreak>=14?'tier-gold':hStreak>=7?'tier-bronze':'';
      const streakBadge=hStreak>=2?`<span class="hcard-streak ${tierClass}">${hStreak}d</span>`:'';
      hhtml+=`<div class="hcard card ${s||''} af s${Math.min(i+1,6)}" data-id="${hb.id}" style="animation-delay:${i*40}ms" ${dis}><div class="hcard-meta"><div class="hcard-name">${esc(hb.name)}</div><div class="hcard-cat">${esc(getCatName(hb.cat))}${isPlaceholder?' · Sample':''}</div>${streakBadge}</div><div class="hcard-btns"><button class="hbtn ${s==='done'?'don':''}" onclick="markH('${hb.id}','done',this,event)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${s==='done'?'var(--gold)':'var(--ctd)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="hbtn ${s==='failed'?'fai':''}" onclick="markH('${hb.id}','failed',this,event)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${s==='failed'?'var(--blood)':'var(--ctd)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>`;
    });
    hhtml+='</div></div>';
    if(isPlaceholder)hhtml+=`<button class="sample-banner btn-reset" onclick="swTo('forge')"><span class="sample-banner-icon">⚒</span><div><div class="sample-banner-tag">Sample Data</div><div class="sample-banner-sub">Tap to forge your own →</div></div></button>`;
  }
  const q=getTodayQuote();
  return `
  <div class="scrow af s1">
    <div class="sc card ${tp!==null&&tp>=70?'lit':tp!==null&&tp<40?'bad':tp!==null?'ok':''}" id="sc0"><div class="sc-num">${tp!==null?tp+'%':'—'}</div><div class="sc-word">${tp!==null?todayLabel(tp):''}</div><div class="sc-lbl">Today</div></div>
    <div class="sc card ${wp!==null&&wp>=70?'lit':wp!==null&&wp<40?'bad':wp!==null?'ok':''}" id="sc1"><div class="sc-num">${wp!==null?wp+'%':'—'}</div><div class="sc-word">${wp!==null?weekLabel(wp):''}</div><div class="sc-lbl">7 Day</div></div>
    <div class="sc card ${streak>=3?'lit':streak>0?'ok':'bad'}" id="sc2" role="button" tabindex="0" onclick="toggleStreakPanel()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleStreakPanel()}" style="cursor:pointer;"><div class="sc-num">${streak>0?streak:'—'}</div><div class="sc-word">${streak>0?getTier(streak).name:'No Streak'}</div><div class="sc-lbl">Streak</div></div>
  </div>
  <div id="streak-panel"></div>
  <div class="shdr af s2"><span class="shdr-l">Today's Disciplines</span></div>
  ${hhtml}
  ${q?`<div class="qcard card af s4" role="button" tabindex="0" onclick="qPreview(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();qPreview(this)}"><div class="qtext">"${q.t}"</div><div class="qauth">— ${q.a}</div></div>`:''}
  <div class="ftr"><div class="ftr-logo">GRITCORE</div><div class="ftr-sub">Discipline is freedom</div></div>`;
}
function catStats(){const hh=effH(),ll=effL();return cats.filter(c=>hh.some(h=>h.cat===c.id)).map(c=>{let done=0,total=0;Object.values(ll).forEach(dayLog=>{hh.filter(h=>h.cat===c.id).forEach(h=>{if(dayLog[h.id]==='done'){done++;total++;}else if(dayLog[h.id]==='failed')total++;});});return{cat:c.name,pct:total>0?Math.round((done/total)*100):0};});}
function renderReport() {
  const hh = effH(), ll = effL();
  const streak = calcStreak();
  const tier = getTier(streak);
  const nextTier = TIERS.find(t => t.min > streak);
  const daysToNext = nextTier ? nextTier.min - streak : 0;
  const tierPct = nextTier
    ? Math.round(((streak - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  // Lifetime stats
  let totalDone = 0, perfectDays = 0;
  const bestCount = {};
  Object.entries(ll).forEach(([date, dayLog]) => {
    let dayDone = 0;
    hh.forEach(h => {
      if (dayLog[h.id] === 'done') { totalDone++; dayDone++; bestCount[h.id] = (bestCount[h.id] || 0) + 1; }
    });
    if (hh.length && dayDone === hh.length) perfectDays++;
  });
  const bestId = Object.entries(bestCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestName = hh.find(h => h.id === bestId)?.name || '—';

  // Category bars
  const catData = catStats();
  const catBars = catData.length
    ? catData.map(c => `
        <div class="rpt-cat-row">
          <span class="rpt-cat-name">${c.cat}</span>
          <div class="rpt-cat-bar-wrap"><div class="rpt-cat-bar" style="width:${c.pct}%"></div></div>
          <span class="rpt-cat-pct">${c.pct}%</span>
        </div>`).join('')
    : '<div class="rpt-empty">Log disciplines to see category stats</div>';

  const weekBars = getWeeklyBars();
  const weekHtml = `
  <div class="shdr shdr-m af s3"><span class="shdr-l">Last 7 Days</span></div>
  <div class="rpt-week-wrap af s4">
    <div class="rpt-week-bars">
      ${weekBars.map(d => `
        <div class="rpt-wbar-col">
          <div class="rpt-wbar ${d.isToday?'today':''} ${d.pct===null?'empty':''}"
               style="height:${d.pct !== null ? Math.max(d.pct, 4) : 100}%"></div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:4px;">
      ${weekBars.map(d => `<div class="rpt-wday ${d.isToday?'today':''}" style="flex:1;text-align:center;">${d.label}</div>`).join('')}
    </div>
  </div>`;

  const mom = getMonthOverMonth();
  const momDelta = (mom.current.pct !== null && mom.previous.pct !== null)
    ? mom.current.pct - mom.previous.pct : null;
  const momDeltaHtml = momDelta !== null
    ? `<span class="rpt-month-delta ${momDelta >= 0 ? 'up' : 'down'}">${momDelta >= 0 ? '+' : ''}${momDelta}%</span>`
    : '';
  const momHtml = `
  <div class="shdr shdr-m af s4"><span class="shdr-l">Month Over Month</span></div>
  <div class="rpt-month-row af s5">
    <div class="rpt-month-card current">
      <div class="rpt-month-name">${mom.current.name}</div>
      <div class="rpt-month-pct">${mom.current.pct !== null ? mom.current.pct + '%' : '—'} <span class="rpt-month-disc">(${mom.current.discDone}/${mom.current.discTotal})</span> ${momDeltaHtml}</div>
      <div class="rpt-month-sub">${mom.current.doneDays}/${mom.current.elapsed} days done</div>
    </div>
    <div class="rpt-month-card">
      <div class="rpt-month-name">${mom.previous.name}</div>
      <div class="rpt-month-pct">${mom.previous.pct !== null ? mom.previous.pct + '%' : '—'} <span class="rpt-month-disc">(${mom.previous.discDone}/${mom.previous.discTotal})</span></div>
      <div class="rpt-month-sub">${mom.previous.doneDays}/${mom.previous.daysInMonth} days done</div>
    </div>
  </div>`;

  document.getElementById('content').innerHTML = `
    <div class="shdr shdr-m af s1"><span class="shdr-l">Report</span></div>

    <div class="rpt-stats-row af s2">
      <div class="card rpt-stat-card">
        <div class="rpt-stat-label">Next Tier</div>
        <div class="rpt-stat-num" style="color:${tier.color}">${streak}</div>
        <div class="rpt-stat-sub">${tier.name}</div>
        <div class="rpt-pbar-wrap"><div class="rpt-pbar-fill" style="width:${tierPct}%;background:${tier.color}"></div></div>
        <div class="rpt-stat-hint">${nextTier ? `${daysToNext} day${daysToNext !== 1 ? 's' : ''} to ${nextTier.name}` : 'Max tier reached'}</div>
      </div>
      <div class="card rpt-stat-card">
        <div class="rpt-stat-label">All Time</div>
        <div class="rpt-stat-num">${totalDone}</div>
        <div class="rpt-stat-sub">${perfectDays} perfect day${perfectDays !== 1 ? 's' : ''}</div>
        <div class="rpt-stat-hint" style="margin-top:auto">Best: ${bestName}</div>
      </div>
    </div>
    ${(()=>{const bests=getPersonalBests();return`<div class="shdr shdr-m af s2"><span class="shdr-l">Personal Bests</span></div><div class="rpt-bests-grid af s3"><div class="rpt-best-card"><div class="rpt-best-val">${bests.bestStreak>0?bests.bestStreak:'—'}</div><div class="rpt-best-lbl">Best Streak</div></div><div class="rpt-best-card"><div class="rpt-best-val">${bests.bestMonth!==null?bests.bestMonth+'%':'—'}</div><div class="rpt-best-lbl">Best Month</div></div><div class="rpt-best-card"><div class="rpt-best-val">${bests.bestWeek!==null?bests.bestWeek+'%':'—'}</div><div class="rpt-best-lbl">Best Week</div></div><div class="rpt-best-card"><div class="rpt-best-val">${perfectDays}</div><div class="rpt-best-lbl">Perfect Days</div></div>${(()=>{const bd=getBestDayOfWeek();return bd?'<div class="rpt-best-card"><div class="rpt-best-val" style="font-size:22px;letter-spacing:3px">'+bd.day+'</div><div class="rpt-best-lbl">Best Day '+bd.pct+'%</div></div>':'';})()}</div>`;})()}
    ${weekHtml}
    ${momHtml}

    <div class="shdr shdr-m af s3"><span class="shdr-l">By Category</span></div>
    <div class="card af s3" style="padding:14px;margin:0 18px 12px;">
      ${catBars}
    </div>

    <div class="rpt-icon-row af s4">
      <button class="rpt-icon-btn" onclick="rptPump(this,'profile')">
        <svg class="rpt-svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 16 0v1"/></svg><span class="rpt-icon-lbl">Profile</span>
      </button>
      <button class="rpt-icon-btn" onclick="rptPump(this,'achievements')">
        <svg class="rpt-svg" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"/></svg><span class="rpt-icon-lbl">Achievements</span>
      </button>
      <button class="rpt-icon-btn" onclick="rptPump(this,'about')">
        <svg class="rpt-svg" viewBox="0 0 24 24"><path d="M12 2l8 4.5v7L12 18l-8-4.5v-7L12 2z"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5"/></svg><span class="rpt-icon-lbl">About</span>
      </button>
      <button class="rpt-icon-btn" onclick="rptPump(this,'quotes')">
        <svg class="rpt-svg" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        <span class="rpt-icon-lbl">Quotes</span>
      </button>
    </div>
    <div class="rpt-labs-header" role="button" tabindex="0"
      style="padding:10px 18px 8px;font-size:10px;letter-spacing:3px;color:var(--ctdd);font-family:'Josefin Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;margin-top:4px;"
      onclick="(function(h){const c=document.getElementById('rpt-labs-c');const open=c.style.display!=='none'&&c.style.display!=='';c.style.display=open?'none':'block';h.querySelector('.rpt-labs-arrow').textContent=open?'\u25be':'\u25b4';})(this)"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <span class="rpt-labs-arrow" style="font-size:9px;">\u25be</span>LABS
    </div>
    <div id="rpt-labs-c" style="display:none">
      <div class="rpt-icon-row" style="margin-bottom:4px">
        <button class="rpt-icon-btn" onclick="rptPump(this,'calories')">
          <svg class="rpt-svg" viewBox="0 0 24 24"><path d="M12 2c-4 5-7 8-7 12a7 7 0 0 0 14 0c0-4-3-7-7-12z"/><path d="M12 22a3 3 0 0 1-3-3c0-2 3-5 3-5s3 3 3 5a3 3 0 0 1-3 3z"/></svg><span class="rpt-icon-lbl">Calories</span>
        </button>
        <button class="rpt-icon-btn" onclick="rptPump(this,'workouts')">
          <svg class="rpt-svg" viewBox="0 0 24 24"><path d="M6 7v10M18 7v10M2 10v4M22 10v4M6 12h12M2 12h4M18 12h4"/></svg><span class="rpt-icon-lbl">Workouts</span>
        </button>
      </div>
    </div>

  `;
}

/* ── Calorie Calculator ── */
function loadCalData(){
  return {
    age: localStorage.getItem('gc1:cal.age')||'25',
    gender: localStorage.getItem('gc1:cal.gender')||'male',
    height: localStorage.getItem('gc1:cal.height')||'175',
    weight: localStorage.getItem('gc1:cal.weight')||'70',
    activity: localStorage.getItem('gc1:cal.activity')||'1.55'
  };
}
function saveCalData(d){
  localStorage.setItem('gc1:cal.age',d.age);
  localStorage.setItem('gc1:cal.gender',d.gender);
  localStorage.setItem('gc1:cal.height',d.height);
  localStorage.setItem('gc1:cal.weight',d.weight);
  localStorage.setItem('gc1:cal.activity',d.activity);
}
let _calSaveT;
function calculateCalories(){
  const age=parseInt(document.getElementById('cal-age')?.value)||25;
  const gender=document.querySelector('.cal-gender-btn.active')?.dataset.g||'male';
  const height=parseFloat(document.getElementById('cal-height')?.value)||175;
  const weight=parseFloat(document.getElementById('cal-weight')?.value)||70;
  const activity=parseFloat(document.getElementById('cal-activity')?.value)||1.55;
  clearTimeout(_calSaveT);_calSaveT=setTimeout(()=>saveCalData({age,gender,height,weight,activity}),400);
  const bmr=gender==='male'
    ? 10*weight+6.25*height-5*age+5
    : 10*weight+6.25*height-5*age-161;
  const maintain=Math.round(bmr*activity);
  const lose=Math.round(maintain-500);
  const gain=Math.round(maintain+500);
  const el=document.getElementById('cal-results');
  if(el) el.innerHTML=`
    <div class="cal-result-card highlight"><div><div class="cal-result-label">Maintain Weight</div></div><div class="cal-result-val">${maintain.toLocaleString()}<span class="cal-result-unit">cal/day</span></div></div>
    <div class="cal-result-card"><div><div class="cal-result-label">Lose Weight</div><div style="font-size:10px;color:var(--ctdd);margin-top:2px;">-500 cal/day</div></div><div class="cal-result-val">${lose.toLocaleString()}<span class="cal-result-unit">cal/day</span></div></div>
    <div class="cal-result-card"><div><div class="cal-result-label">Gain Weight</div><div style="font-size:10px;color:var(--ctdd);margin-top:2px;">+500 cal/day</div></div><div class="cal-result-val">${gain.toLocaleString()}<span class="cal-result-unit">cal/day</span></div></div>
    <div style="font-size:10px;color:var(--ctdd);text-align:center;padding:4px 0;font-family:'Josefin Sans',sans-serif;letter-spacing:.5px;">Based on Mifflin-St Jeor equation</div>`;
}

/* ── Workout Tracker ── */
const DEFAULT_EXERCISES=['Push-ups','Pull-ups','Squats','Deadlift','Bench Press','Overhead Press','Barbell Rows','Lunges','Plank','Dumbbell Curls','Tricep Dips','Leg Press','Calf Raises','Lat Pulldown','Shoulder Press'];
function loadWorkouts(){ try{return JSON.parse(localStorage.getItem('gc1:workouts')||'[]');}catch(e){return[];} }
function saveWorkouts(w){ localStorage.setItem('gc1:workouts',JSON.stringify(w)); }
function loadCustomExercises(){ try{return JSON.parse(localStorage.getItem('gc1:exercises')||'[]');}catch(e){return[];} }
function saveCustomExercises(e){ localStorage.setItem('gc1:exercises',JSON.stringify(e)); }
function getAllExercises(){ return [...DEFAULT_EXERCISES,...loadCustomExercises()]; }

let wkActiveWorkout=null;
function wkStartWorkout(){
  wkActiveWorkout={id:Date.now().toString(),date:getDate(),exercises:[]};
  renderWkActive();
}
function wkAddExercise(name){
  if(!wkActiveWorkout)return;
  wkActiveWorkout.exercises.push({name,sets:[{reps:'',weight:''}]});
  renderWkActive();
}
function wkAddSet(exIdx){
  if(!wkActiveWorkout||!wkActiveWorkout.exercises[exIdx])return;
  wkActiveWorkout.exercises[exIdx].sets.push({reps:'',weight:''});
  renderWkActive();
}
function wkRemoveExercise(exIdx){
  if(!wkActiveWorkout)return;
  wkActiveWorkout.exercises.splice(exIdx,1);
  renderWkActive();
}
function wkSaveWorkout(){
  if(!wkActiveWorkout||!wkActiveWorkout.exercises.length){showToast('Add exercises first');return;}
  const cont=document.getElementById('rpt-sheet-content');
  wkActiveWorkout.exercises.forEach((ex,ei)=>{
    ex.sets.forEach((s,si)=>{
      const r=cont.querySelector(`[data-reps="${ei}-${si}"]`);
      const w=cont.querySelector(`[data-weight="${ei}-${si}"]`);
      if(r)s.reps=r.value;
      if(w)s.weight=w.value;
    });
  });
  wkActiveWorkout.exercises=wkActiveWorkout.exercises.filter(ex=>ex.sets.some(s=>s.reps));
  if(!wkActiveWorkout.exercises.length){showToast('Log at least one set');return;}
  const all=loadWorkouts();
  all.unshift(wkActiveWorkout);
  saveWorkouts(all);
  wkActiveWorkout=null;
  showToast('Workout saved');
  rptSheet('workouts');
}
function wkCancelWorkout(){
  wkActiveWorkout=null;
  rptSheet('workouts');
}
function wkDeleteWorkout(id){
  const all=loadWorkouts().filter(w=>w.id!==id);
  saveWorkouts(all);
  rptSheet('workouts');
}
function wkAddCustomExercise(){
  const inp=document.getElementById('wk-custom-input');
  if(!inp)return;
  const name=inp.value.trim();
  if(!name)return;
  const custom=loadCustomExercises();
  if(custom.includes(name)||DEFAULT_EXERCISES.includes(name)){showToast('Already exists');return;}
  custom.push(name);
  saveCustomExercises(custom);
  inp.value='';
  renderWkActive();
}
function renderWkActive(){
  const cont=document.getElementById('rpt-sheet-content');
  if(!cont||!wkActiveWorkout)return;
  const allEx=getAllExercises();
  const usedNames=wkActiveWorkout.exercises.map(e=>e.name);
  const picks=allEx.filter(n=>!usedNames.includes(n));
  const pickChips=picks.map(n=>`<div class="wk-pick-chip" onclick="wkAddExercise('${n.replace(/'/g,"\\'")}')">${esc(n)}</div>`).join('');
  const exercises=wkActiveWorkout.exercises.map((ex,ei)=>{
    const sets=ex.sets.map((s,si)=>`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="font-size:10px;color:var(--ctdd);width:18px;font-family:var(--fnt-ui);">S${si+1}</span>
      <input class="wk-input wk-input-sm" type="number" inputmode="numeric" placeholder="Reps" data-reps="${ei}-${si}" value="${s.reps}">
      <span style="font-size:10px;color:var(--ctdd);">x</span>
      <input class="wk-input wk-input-sm" type="number" inputmode="decimal" placeholder="kg" data-weight="${ei}-${si}" value="${s.weight}">
    </div>`).join('');
    return `<div class="wk-exercise-row" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span class="wk-exercise-name">${ex.name}</span>
        <button class="wk-del-btn" onclick="wkRemoveExercise(${ei})">x</button>
      </div>
      ${sets}
      <div class="wk-add-btn" onclick="wkAddSet(${ei})" style="padding:6px;font-size:10px;">+ Add Set</div>
    </div>`;
  }).join('');
  cont.innerHTML=`<div class="sheet-header"><span class="sheet-title">Log Workout</span><button class="sheet-close-btn" onclick="wkCancelWorkout()">x</button></div>
    <div class="wk-section">
      <div class="rpt-section-hdr">Exercises</div>
      ${exercises||'<div class="wk-empty">Tap an exercise below to add it</div>'}
      <div class="rpt-section-hdr" style="margin-top:12px;">Add Exercise</div>
      <div class="wk-exercise-picker">${pickChips}</div>
      <div style="display:flex;gap:6px;">
        <input class="wk-input" id="wk-custom-input" placeholder="Custom exercise name" style="flex:1;">
        <button class="wk-add-btn" onclick="wkAddCustomExercise()" style="padding:8px 12px;white-space:nowrap;">+ Add</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="wk-save-btn" onclick="wkSaveWorkout()" style="flex:1;">Save Workout</button>
      </div>
    </div>`;
}

function rptPump(btn, type) {
  if(_paywallLocked()&&['calories','workouts','achievements'].includes(type)){showUpgradePrompt();return;}
  btn.classList.remove('pumping');
  void btn.offsetWidth;
  btn.classList.add('pumping');
  btn.addEventListener('animationend', () => btn.classList.remove('pumping'), {once:true});
  setTimeout(() => rptSheet(type), 120);
}

function hideFab(){ const f=document.querySelector('.fab'); if(f){f.style.transition='opacity 0.22s ease';f.style.opacity='0';f.style.pointerEvents='none';} }
function showFab(){ const f=document.querySelector('.fab'); if(f){f.style.transition='opacity 0.18s ease';f.style.opacity='1';f.style.pointerEvents='';} }

function rptSheet(type) {
  const el = document.getElementById('rpt-sheet');
  const content = document.getElementById('rpt-sheet-content');
  const backdrop = document.getElementById('rpt-sheet-backdrop');
  hideFab();

  if (type === 'workouts' && wkActiveWorkout) {
    backdrop.style.display = 'block';
    requestAnimationFrame(() => { backdrop.classList.add('open'); el.classList.add('open'); });
    document.getElementById('content').style.overflow = 'hidden';
    renderWkActive();
    return;
  }

  const sheets = {
    profile: () => {
      const earned = loadAch();
      const unlockedCount = Object.keys(earned).length;
      const streak = calcStreak();
      const tier = getTier(streak);
      const bests = getPersonalBests();
      const name = localStorage.getItem('gc1:profile.name') || 'Warrior';
      const safeName = name.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
      const hh = effH(), ll = effL();
      let totalLogged = 0;
      Object.values(ll).forEach(day => { Object.values(day).forEach(v => { if(v==='done') totalLogged++; }); });
      const joinDate = localStorage.getItem('gc1:joined') || getDate();
      if(!localStorage.getItem('gc1:joined')) localStorage.setItem('gc1:joined', getDate());
      const joinStr = new Date(joinDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      return `<div class="sheet-header"><span class="sheet-title">Profile</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
    <div style="padding:20px 18px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="width:68px;height:68px;border-radius:50%;background:var(--heat);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:28px;color:#111;font-weight:700;box-shadow:0 0 24px var(--heat);">${name[0].toUpperCase()}</div>
      <input id="profile-name-input" value="${safeName}" maxlength="20" inputmode="text"
        style="background:none;border:none;border-bottom:1px solid rgba(255,255,255,.15);text-align:center;font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--cthi);letter-spacing:2px;width:180px;padding:4px 0;outline:none;"
        onchange="localStorage.setItem('gc1:profile.name',this.value.trim()||'Warrior');closeRptSheet();render();">
      <div style="font-size:11px;letter-spacing:2px;color:var(--gold);text-transform:uppercase;font-family:'Josefin Sans',sans-serif;">${tier.name}</div>
      <div style="font-size:10px;color:var(--ctdd);font-family:'Josefin Sans',sans-serif;letter-spacing:1px;">Joined ${joinStr}</div>
    </div>
    <div class="rpt-section-hdr" style="padding:14px 16px 6px;">Stats</div>
    <div class="prof-stat-grid">
      <div class="prof-stat-card"><div class="prof-stat-val">${streak}</div><div class="prof-stat-lbl">Current Streak</div></div>
      <div class="prof-stat-card"><div class="prof-stat-val">${bests.bestStreak>0?bests.bestStreak:'--'}</div><div class="prof-stat-lbl">Best Streak</div></div>
      <div class="prof-stat-card"><div class="prof-stat-val">${totalLogged}</div><div class="prof-stat-lbl">Total Logged</div></div>
      <div class="prof-stat-card"><div class="prof-stat-val">${unlockedCount}/${ACHIEVEMENTS.length}</div><div class="prof-stat-lbl">Achievements</div></div>
      <div class="prof-stat-card"><div class="prof-stat-val">${hh.length}</div><div class="prof-stat-lbl">Disciplines</div></div>
      <div class="prof-stat-card"><div class="prof-stat-val">${bests.bestMonth!==null?bests.bestMonth+'%':'--'}</div><div class="prof-stat-lbl">Best Month</div></div>
    </div>
    <div style="padding:4px 16px 20px;display:flex;flex-direction:column;gap:12px;">
      <div class="rpt-section-hdr">Data</div>
      <div style="background:rgba(255,255,255,.03);border-radius:12px;overflow:hidden;">
        <button onclick="if(confirm('Reset today\\'s log?')){const t=getDate();delete logs[t];saveL();closeRptSheet();render();}" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 14px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;">
          <span style="font-size:14px;">🔄</span>
          <span style="flex:1;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cthi);font-family:'Josefin Sans',sans-serif;">Reset Today</span>
          <span style="color:var(--ctdd);font-size:12px;">></span>
        </button>
        <button onclick="exportData()" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 14px;background:none;border:none;cursor:pointer;">
          <span style="font-size:14px;">↓</span>
          <span style="flex:1;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cthi);font-family:'Josefin Sans',sans-serif;">Export Record</span>
          <span style="color:var(--ctdd);font-size:12px;">></span>
        </button>
      </div>
      <div style="background:rgba(239,68,68,.06);border-radius:12px;overflow:hidden;border:1px solid rgba(239,68,68,.15);">
        <button onclick="if(confirm('Clear all data? This cannot be undone.')){['gc1:habits','gc1:logs','gc1:cats','gc1:workouts','gc1:exercises','gc1:ach','gc1:milestones','gc1:profile','gc1:profile.name','gc1:pdShown','gc1:joined','gc1:cal','gc1:cal.age','gc1:cal.sex','gc1:cal.height','gc1:cal.weight','gc1:cal.activity','gc1:accentColor','gc1:savedQuotes','gc1:weeklyReportShown'].forEach(k=>localStorage.removeItem(k));['gc:onboarded','gc:gc1:habits','gc:gc1:logs','gc:sim_date'].forEach(k=>{localStorage.removeItem(k);try{store.set(k.replace('gc:',''),null)}catch{}});location.reload();}" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 14px;background:none;border:none;cursor:pointer;">
          <span style="font-size:14px;">🗑</span>
          <span style="flex:1;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#f57a7a;font-family:'Josefin Sans',sans-serif;">Clear All Data</span>
          <span style="color:rgba(239,68,68,.5);font-size:12px;">></span>
        </button>
      </div>
    </div>`;
    },
    calories: () => {
      const d = loadCalData();
      return `<div class="sheet-header"><span class="sheet-title">Calorie Calculator</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
    <div class="cal-form">
      <div class="cal-field">
        <label class="cal-label">Age</label>
        <input class="cal-input" id="cal-age" type="number" inputmode="numeric" min="15" max="80" value="${d.age}" placeholder="25" oninput="if(+this.value>80)this.value=80;calculateCalories()">
      </div>
      <div class="cal-field">
        <label class="cal-label">Gender</label>
        <div class="cal-gender-row">
          <button class="cal-gender-btn ${d.gender==='male'?'active':''}" data-g="male" onclick="document.querySelectorAll('.cal-gender-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');calculateCalories();">Male</button>
          <button class="cal-gender-btn ${d.gender==='female'?'active':''}" data-g="female" onclick="document.querySelectorAll('.cal-gender-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');calculateCalories();">Female</button>
        </div>
      </div>
      <div class="cal-row">
        <div class="cal-field">
          <label class="cal-label">Height (cm)</label>
          <input class="cal-input" id="cal-height" type="number" inputmode="decimal" min="100" max="250" value="${d.height}" placeholder="175" oninput="if(+this.value>250)this.value=250;calculateCalories()">
        </div>
        <div class="cal-field">
          <label class="cal-label">Weight (kg)</label>
          <input class="cal-input" id="cal-weight" type="number" inputmode="decimal" min="30" max="300" value="${d.weight}" placeholder="70" oninput="if(+this.value>300)this.value=300;calculateCalories()">
        </div>
      </div>
      <div class="cal-field">
        <label class="cal-label">Activity Level</label>
        <select class="cal-select" id="cal-activity" onchange="calculateCalories()">
          <option value="1.2" ${d.activity==='1.2'?'selected':''}>Sedentary (little/no exercise)</option>
          <option value="1.375" ${d.activity==='1.375'?'selected':''}>Light (1-3 days/week)</option>
          <option value="1.55" ${d.activity==='1.55'?'selected':''}>Moderate (3-5 days/week)</option>
          <option value="1.725" ${d.activity==='1.725'?'selected':''}>Active (6-7 days/week)</option>
          <option value="1.9" ${d.activity==='1.9'?'selected':''}>Very Active (hard daily exercise)</option>
        </select>
      </div>
    </div>
    <div class="cal-results" id="cal-results"></div>`;
    },
    achievements: () => {
      const earned = loadAch();
      const rows = ACHIEVEMENTS.map(a => {
        const isEarned = !!earned[a.id];
        const date = isEarned ? new Date(earned[a.id]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
        return `<div style="display:flex;align-items:center;gap:12px;padding:13px 12px;background:rgba(255,255,255,.03);border-radius:10px;margin-bottom:2px;opacity:${isEarned?1:.35};">
      <span style="font-size:20px;${isEarned?'':'filter:grayscale(1)'}">${a.icon}</span>
      <div style="flex:1;"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${isEarned?'var(--cthi)':'var(--ctd)'};font-family:'Josefin Sans',sans-serif;">${a.name}</div><div style="font-size:10px;color:var(--ctdd);margin-top:2px;font-family:'Josefin Sans',sans-serif;">${a.desc}</div></div>
      ${isEarned?`<span style="font-size:10px;color:var(--gold);letter-spacing:1px;font-family:'Josefin Sans',sans-serif;">${date}</span>`:'<span style="font-size:14px;color:var(--ctdd);">🔒</span>'}
    </div>`;
      }).join('');
      const count = Object.keys(earned).length;
      const pct = ACHIEVEMENTS.length ? Math.round((count/ACHIEVEMENTS.length)*100) : 0;
      return `<div class="sheet-header"><span class="sheet-title">Achievements</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
    <div style="padding:0 16px 6px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:11px;letter-spacing:1.5px;color:var(--gold);font-family:'Josefin Sans',sans-serif;">${count} / ${ACHIEVEMENTS.length} unlocked</span>
        <span style="font-size:11px;color:var(--ctdd);font-family:'Josefin Sans',sans-serif;">${pct}%</span>
      </div>
      <div style="height:4px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;margin-bottom:14px;">
        <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:4px;transition:width .4s;"></div>
      </div>
    </div>
    <div style="padding:0 16px 20px;">${rows}</div>`;
    },
    workouts: () => {
      const all = loadWorkouts();
      const history = all.slice(0,20).map(w => {
        const dateStr = new Date(w.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
        const exList = w.exercises.map(ex => {
          const setStr = ex.sets.filter(s=>s.reps).map(s => s.weight ? `${s.reps}x${s.weight}kg` : `${s.reps} reps`).join(', ');
          return `<div class="wk-history-exercise">${esc(ex.name)}</div><div class="wk-history-sets">${setStr}</div>`;
        }).join('');
        return `<div class="wk-history-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="wk-history-date">${dateStr}</div>
            <button class="wk-del-btn" onclick="wkDeleteWorkout('${w.id}')">x</button>
          </div>
          ${exList}
        </div>`;
      }).join('');
      return `<div class="sheet-header"><span class="sheet-title">Workouts</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
    <div class="wk-section">
      <button class="wk-start-btn" onclick="wkStartWorkout()">Start Workout</button>
    </div>
    <div style="padding:0 16px;">
      <div class="rpt-section-hdr">History${all.length?' ('+all.length+')':''}</div>
      ${history || '<div class="wk-empty">No workouts logged yet</div>'}
    </div>`;
    },
    about: () => `<div class="sheet-header"><span class="sheet-title">About</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
  <div style="padding:24px 20px;text-align:center;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;letter-spacing:10px;text-transform:uppercase;background:linear-gradient(180deg,#f5f2ec 0%,var(--gold) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px;">GRITCORE</div>
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:'Josefin Sans',sans-serif;margin-bottom:24px;">Forge your discipline.</div>
    <div style="font-size:11px;line-height:1.9;color:var(--ctd);font-family:'Josefin Sans',sans-serif;letter-spacing:.5px;max-width:280px;margin:0 auto;margin-bottom:20px;">
      <span style="font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);text-shadow:0 0 12px var(--gold-glow);">GRITCORE</span> is a daily discipline tracker built on one belief: small, consistent actions compound into extraordinary character.
    </div>
    <div class="rpt-section-hdr" style="text-align:center;">What You Get</div>
    <div style="display:flex;flex-direction:column;gap:6px;max-width:260px;margin:8px auto 20px;text-align:left;">
      ${[['Track daily disciplines with streaks','Stay accountable every day'],['Forge Ring calendar visualization','See your month at a glance'],['18 achievements to unlock','Celebrate real milestones'],['Calorie calculator','Know your daily targets'],['Workout tracker','Log every session'],['Category-based organization','Group your disciplines'],['Export your data anytime','Your data, your control']].map(([t,s])=>`<div style="padding:10px 12px;background:rgba(255,255,255,.03);border-radius:8px;"><div style="font-size:11px;color:var(--cthi);font-family:'Josefin Sans',sans-serif;letter-spacing:.5px;">${t}</div><div style="font-size:10px;color:var(--ctdd);margin-top:2px;font-family:'Josefin Sans',sans-serif;">${s}</div></div>`).join('')}
    </div>
    <div class="rpt-section-hdr" style="text-align:center;">Philosophy</div>
    <div style="font-size:11px;line-height:1.9;color:var(--ctd);font-family:'Josefin Sans',sans-serif;letter-spacing:.5px;max-width:280px;margin:8px auto 20px;font-style:italic;">
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
      <div style="color:var(--ctdd);margin-top:4px;font-style:normal;letter-spacing:1.5px;text-transform:uppercase;font-size:10px;">Will Durant</div>
    </div>
    <div style="height:1px;background:rgba(255,255,255,.06);margin:16px auto;max-width:200px;"></div>
    <div style="font-size:10px;color:var(--ctdd);letter-spacing:1px;font-family:'Josefin Sans',sans-serif;line-height:2;">
      Built with discipline.<br>
      <span onclick="onVersionTap()" style="cursor:pointer;">Version ${APP_VERSION}</span>
    </div>
  </div>`,
    quotes: () => {
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem('gc1:savedQuotes') || '[]'); } catch { saved = []; }
      const list = saved.length
        ? saved.map((q, i) => `<div class="saved-quote-card card" style="padding:14px 16px;margin-bottom:8px;position:relative;">
            <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--ct);line-height:1.6;">"${esc(q)}"</div>
            <button class="del-btn" style="position:absolute;top:8px;right:8px;" onclick="removeSavedQuote(${i})">&#10005;</button>
          </div>`).join('')
        : '<div style="padding:32px 20px;text-align:center;font-size:11px;color:var(--ctd);letter-spacing:1.5px;font-family:\'Josefin Sans\',sans-serif;line-height:2;text-transform:uppercase;">Long press any quote<br>to save it here</div>';
      return `<div class="sheet-header"><span class="sheet-title">Saved Quotes</span><button class="sheet-close-btn" onclick="closeRptSheet()">x</button></div>
        <div style="padding:12px 16px;">${list}</div>`;
    },
  };
  content.innerHTML = sheets[type]?.() || '';
  if (type === 'profile') {
    const inp = document.getElementById('profile-name-input');
    if (inp) inp.addEventListener('focusin', () => {
      setTimeout(() => inp.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    });
  }
  if (type === 'calories') {
    setTimeout(calculateCalories, 50);
  }
  backdrop.style.display = 'block';
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    el.classList.add('open');
  });
  document.getElementById('content').style.overflow = 'hidden';
  window._rptPrevFocus = document.activeElement;
  setTimeout(() => document.getElementById('rpt-sheet').focus(), 50);
}

function closeRptSheet() {
  const el = document.getElementById('rpt-sheet');
  const backdrop = document.getElementById('rpt-sheet-backdrop');
  el.classList.remove('open');
  backdrop.classList.remove('open');
  setTimeout(() => { backdrop.style.display = 'none'; }, 300);
  document.getElementById('content').style.overflow = '';
  wkActiveWorkout = null;
  showFab();
  if (window._rptPrevFocus) { window._rptPrevFocus.focus(); window._rptPrevFocus = null; }
}

function removeSavedQuote(index) {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('gc1:savedQuotes') || '[]'); } catch { saved = []; }
  saved.splice(index, 1);
  localStorage.setItem('gc1:savedQuotes', JSON.stringify(saved));
  rptSheet('quotes');
}

/* ── Universal swipe-to-close on all sheet handles ── */
(function initSheetSwipe(){
  const closers = {
    'fab-sheet': () => closeFabSheet(),
    'settings-sheet': () => closeSettings(),
    'rpt-sheet': () => closeRptSheet(),
    'dev-console-drawer': () => closeDevConsole()
  };
  document.addEventListener('touchstart', function(e){
    const zone = e.target.closest('.sheet-handle-zone');
    if(!zone) return;
    const sheetId = zone.dataset.sheet;
    const sheet = document.getElementById(sheetId);
    if(!sheet) return;
    const startY = e.touches[0].clientY;
    let curY = startY;
    function onMove(ev){
      curY = ev.touches[0].clientY;
      const dy = curY - startY;
      if(dy > 0){
        sheet.classList.add('dragging');
        sheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
      }
    }
    function onEnd(){
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      const dy = curY - startY;
      sheet.classList.remove('dragging');
      sheet.style.transform = '';
      if(dy > 60 && closers[sheetId]){
        closers[sheetId]();
      }
    }
    document.addEventListener('touchmove', onMove, {passive:true});
    document.addEventListener('touchend', onEnd, {passive:true});
  }, {passive:true});
})();


function renderForge(){
  const hh=habits;
  let mlist='';
  if(!hh.length)mlist=`<div style="padding:22px;text-align:center;font-family:'Josefin Sans',sans-serif;font-size:11px;letter-spacing:3px;color:var(--ctd);text-transform:uppercase;line-height:2.5;text-shadow:var(--ts)">No disciplines yet.</div>`;
  else hh.forEach((h,i)=>{
    if(_editingId===h.id){
      mlist+=`<div class="manage-item card editing" data-id="${h.id}" style="animation-delay:${i*.04}s">
        <input id="edit-name-${h.id}" class="forge-input" value="${esc(h.name)}" style="margin-bottom:8px;" onkeydown="if(event.key==='Enter')saveEdit('${h.id}');else if(event.key==='Escape')cancelEdit()">
        <div class="cats" style="margin-bottom:8px;">${cats.map(c=>`<button class="catpill${h.cat===c.id?' sel':''}" onclick="setEditCat('${h.id}','${c.id}');this.parentElement.querySelectorAll('.catpill').forEach(p=>p.classList.remove('sel'));this.classList.add('sel')">${esc(c.name)}</button>`).join('')}</div>
        <div style="display:flex;gap:8px;">
          <button class="forge-btn" onclick="saveEdit('${h.id}')" style="flex:1;padding:8px;">Save</button>
          <button class="forge-btn" onclick="cancelEdit()" style="flex:1;padding:8px;background:rgba(255,255,255,.05);color:var(--ctd);">Cancel</button>
        </div>
      </div>`;
    } else {
      mlist+=`<div class="manage-item card" data-id="${h.id}" style="animation-delay:${i*.04}s"><span class="drag-handle">&#9776;</span><div class="mi-meta"><div class="mi-name">${esc(h.name)}</div><div class="mi-cat">${esc(getCatName(h.cat))}</div></div><button class="edit-btn" onclick="editH('${h.id}')">&#9998;</button><button class="del-btn" onclick="delH('${h.id}')">&#10005;</button></div>`;
    }
  });
  const catPills=cats.map(c=>`<div class="cat-pill-mgr"><span class="cat-pill-name">${esc(c.name)}</span><button class="cat-pill-edit" onclick="renameCat('${c.id}')">✏</button><button class="cat-pill-del"${cats.length<=1?' disabled style="opacity:.2"':''}${catHasHabits(c.id)?' disabled title="Remove disciplines first" style="opacity:.2"':''} onclick="deleteCat('${c.id}')">×</button></div>`).join('');
  return `<div class="shdr af s1"><span class="shdr-l">Categories</span><button class="sheet-done-btn" onclick="addCat()"${cats.length>=8?' disabled style="opacity:.3"':''}>+ Add</button></div>
  <div class="card af s2" style="padding:12px 14px;"><div class="cat-mgr-list">${catPills}</div>${cats.length>=8?'<div class="rpt-empty">Maximum 8 categories</div>':''}</div>
  <div class="shdr af s3"><span class="shdr-l">Forge a New Discipline</span></div>
  <div class="forge-form card af s4"><input id="fi" class="forge-input" placeholder="Name your discipline…" onkeydown="if(event.key==='Enter')addH()"><div class="cats">${cats.map(c=>`<button class="catpill${selCat===c.id?' sel':''}" data-c="${c.id}" onclick="selCatFn('${c.id}')">${c.name}</button>`).join('')}</div><button class="forge-btn" onclick="addH()">Forge Discipline</button></div>
  <div class="shdr af s5 mt6"><span class="shdr-l">Active (${hh.length})</span></div>
  <div class="manage-list">${mlist}</div>
  <button class="export-btn af s6" onclick="exportData()">↓ Export Record</button>
  <div class="ftr"><div class="ftr-logo">GRITCORE</div><div class="ftr-sub">Build the person you intend to be</div></div>`;
}
/* ── Discipline Reorder (touch drag) ── */
let dragEl=null,dragClone=null,dragStartY=0,dragOffsetY=0;
let dragItems=[],dragIdx=-1;
function initReorder(){
  const list=document.querySelector('.manage-list');
  if(!list)return;
  list.addEventListener('touchstart',onDragStart,{passive:false});
  list.addEventListener('touchmove',onDragMove,{passive:false});
  list.addEventListener('touchend',onDragEnd);
}
function onDragStart(e){
  const handle=e.target.closest('.drag-handle');
  if(!handle)return;
  const item=handle.closest('.manage-item');
  if(!item)return;
  e.preventDefault();
  dragEl=item;
  dragItems=Array.from(item.parentElement.children);
  dragIdx=dragItems.indexOf(item);
  const touch=e.touches[0];
  const rect=item.getBoundingClientRect();
  dragStartY=touch.clientY;
  dragOffsetY=touch.clientY-rect.top;
  dragClone=item.cloneNode(true);
  dragClone.classList.add('drag-clone');
  dragClone.style.width=rect.width+'px';
  dragClone.style.top=rect.top+'px';
  dragClone.style.left=rect.left+'px';
  document.body.appendChild(dragClone);
  item.classList.add('drag-placeholder');
}
function onDragMove(e){
  if(!dragEl||!dragClone)return;
  e.preventDefault();
  const touch=e.touches[0];
  dragClone.style.top=(touch.clientY-dragOffsetY)+'px';
  const items=Array.from(dragEl.parentElement.children);
  for(let i=0;i<items.length;i++){
    if(items[i]===dragEl)continue;
    const rect=items[i].getBoundingClientRect();
    const mid=rect.top+rect.height/2;
    if(touch.clientY<mid&&i<items.indexOf(dragEl)){
      dragEl.parentElement.insertBefore(dragEl,items[i]);
      break;
    }else if(touch.clientY>mid&&i>items.indexOf(dragEl)){
      dragEl.parentElement.insertBefore(dragEl,items[i].nextSibling);
      break;
    }
  }
}
function onDragEnd(){
  if(!dragEl)return;
  const newOrder=Array.from(dragEl.parentElement.children).map(el=>el.dataset.id).filter(Boolean);
  if(newOrder.length===habits.length){
    const map={};habits.forEach(h=>map[h.id]=h);
    habits=newOrder.map(id=>map[id]).filter(Boolean);
    saveH();
  }
  dragEl.classList.remove('drag-placeholder');
  if(dragClone){dragClone.remove();dragClone=null;}
  dragEl=null;dragItems=[];dragIdx=-1;
}

/* ── Today Tab Long-Press Reorder ── */
let tdDragEl=null,tdDragClone=null,tdDragOffsetY=0,tdLongPress=null,tdDragging=false,tdStartX=0,tdStartY=0;
let tdFingerY=0,tdRafId=null;
const TD_HOLD_MS=350;
const TD_MOVE_THRESHOLD=10;
let tdReorderBound=false;
function initTodayReorder(){
  if(tdReorderBound||isPlaceholder)return;
  tdReorderBound=true;
  document.addEventListener('touchstart',tdTouchStart,{passive:false});
  document.addEventListener('touchmove',tdTouchMove,{passive:false});
  document.addEventListener('touchend',tdTouchEnd);
  document.addEventListener('touchcancel',tdTouchEnd);
}
function tdTouchStart(e){
  if(view!=='today')return;
  const card=e.target.closest('.hcard');
  if(!card||!card.closest('.hlist'))return;
  if(e.target.closest('.hbtn'))return;
  const touch=e.touches[0];
  tdStartX=touch.clientX;
  tdStartY=touch.clientY;
  tdLongPress=setTimeout(()=>{
    tdDragging=true;
    tdDragEl=card;
    const rect=card.getBoundingClientRect();
    tdDragOffsetY=tdStartY-rect.top;
    // Build clone
    tdDragClone=card.cloneNode(true);
    tdDragClone.className='hcard card td-drag-clone';
    tdDragClone.style.cssText=`position:fixed;z-index:800;pointer-events:none;width:${rect.width}px;top:${rect.top}px;left:${rect.left}px;border:1px solid var(--cbor);`;
    document.body.appendChild(tdDragClone);
    card.classList.add('td-drag-placeholder');
    const hlist=card.closest('.hlist');
    if(hlist)hlist.classList.add('reordering');
    tdFingerY=tdStartY;
    tdDragLoop();
    comboVibrate(3);
  },TD_HOLD_MS);
}
function tdDragLoop(){
  if(!tdDragging){tdRafId=null;return;}
  if(tdDragClone) tdDragClone.style.top=(tdFingerY-tdDragOffsetY)+'px';
  // Reorder cards
  if(tdDragEl&&tdDragEl.parentElement){
    const items=Array.from(tdDragEl.parentElement.children);
    const curIdx=items.indexOf(tdDragEl);
    for(let i=0;i<items.length;i++){
      if(items[i]===tdDragEl)continue;
      const rect=items[i].getBoundingClientRect();
      const mid=rect.top+rect.height/2;
      if(tdFingerY<mid&&i<curIdx){
        tdDragEl.parentElement.insertBefore(tdDragEl,items[i]);
        comboVibrate(1);
        break;
      }else if(tdFingerY>mid&&i>curIdx){
        tdDragEl.parentElement.insertBefore(tdDragEl,items[i].nextSibling);
        comboVibrate(1);
        break;
      }
    }
  }
  tdRafId=requestAnimationFrame(tdDragLoop);
}
function tdTouchMove(e){
  const touch=e.touches[0];
  if(tdLongPress&&!tdDragging){
    const dx=touch.clientX-tdStartX,dy=touch.clientY-tdStartY;
    if(Math.sqrt(dx*dx+dy*dy)>TD_MOVE_THRESHOLD){
      clearTimeout(tdLongPress);
      tdLongPress=null;
    }
    return;
  }
  if(!tdDragging)return;
  e.preventDefault();
  tdFingerY=touch.clientY;
}
function tdTouchEnd(){
  clearTimeout(tdLongPress);
  tdLongPress=null;
  if(!tdDragging){return;}
  tdDragging=false;
  if(tdRafId){cancelAnimationFrame(tdRafId);tdRafId=null;}
  if(tdDragEl){
    const newOrder=Array.from(tdDragEl.parentElement.children).map(el=>el.dataset.id).filter(Boolean);
    if(newOrder.length===habits.length){
      const map={};habits.forEach(h=>map[h.id]=h);
      habits=newOrder.map(id=>map[id]).filter(Boolean);
      saveH();
    }
    tdDragEl.classList.remove('td-drag-placeholder');
    const hlist=tdDragEl.closest('.hlist');
    if(hlist)hlist.classList.remove('reordering');
  }
  if(tdDragClone){tdDragClone.remove();tdDragClone=null;}
  tdDragEl=null;
}

function render(){
  const c=document.getElementById('content');
  if(view==='today')c.innerHTML=renderToday();
  else if(view==='record'){renderForgeRing();}
  else if(view==='report')renderReport();
  else if(view==='forge')c.innerHTML=renderForge();
  if(view==='forge')setTimeout(initReorder,0);
  if(view==='today')setTimeout(initTodayReorder,0);
  if(view==='today')setTimeout(initQuoteLongPress,100);
  updateHeader();
  setTimeout(initPixelFlames,0);
  setTimeout(()=>document.querySelectorAll('.cbar-fill[data-pct]').forEach(el=>{el.style.width=el.dataset.pct+'%';}),80);
}

/* FAB SHEET */
function openFabSheet(){
  document.querySelector('.fab-icon')?.classList.add('rotating');
  const t=getDate(),tl=logs[t]||{};
  const list=document.getElementById('sheet-list');
  if(!habits.length||isPlaceholder){
    list.innerHTML='<div class="sheet-empty">No disciplines forged yet</div>';
  } else {
    list.innerHTML=habits.map(h=>{
      const done=tl[h.id]==='done';
      const failed=tl[h.id]==='failed';
      return `<div class="sheet-item${done?' ticked':failed?' failed':''}" id="si-${h.id}">
        <span class="sheet-dot"></span>
        <div class="sheet-item-meta">
          <div class="sheet-item-name">${h.name}</div>
          <div class="sheet-item-cat">${getCatName(h.cat)}</div>
        </div>
        <button class="sheet-tick" onclick="sheetTick('${h.id}',this,event)">
          ${done?'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--heat)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
        </button>
        <button class="sheet-fail" onclick="sheetFail('${h.id}',this,event)">
          ${failed?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,80,0.9)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>':''}
        </button>
      </div>`;
    }).join('');
  }

  document.getElementById('fab-backdrop').classList.add('open');
  document.getElementById('fab-sheet').classList.add('open');
  updateSheetProgress();
  window._fabPrevFocus = document.activeElement;
  setTimeout(() => document.getElementById('fab-sheet').focus(), 50);
}
function closeFabSheet(){
  document.querySelector('.fab-icon')?.classList.remove('rotating');
  document.getElementById('fab-backdrop').classList.remove('open');
  document.getElementById('fab-sheet').classList.remove('open');
  if (window._fabPrevFocus) { window._fabPrevFocus.focus(); window._fabPrevFocus = null; }
}
function updateSheetProgress(){
  const t=getDate(),hh=effH(),ll=effL();
  const done=hh.filter(h=>(ll[t]||{})[h.id]==='done').length;
  const total=hh.length;
  const countEl=document.getElementById('sheet-count');
  const fillEl=document.getElementById('sheet-progress-fill');
  if(countEl) countEl.textContent=total?`${done}/${total}`:'';
  if(fillEl) fillEl.style.width=total?`${(done/total)*100}%`:'0%';
}
function _sheetAnimate(btn,cls){
  btn.classList.add(cls);
  setTimeout(()=>btn.classList.remove(cls),300);
}
function sheetTick(id,btn,evt){
  const t=getDate();
  if(!logs[t])logs[t]={};
  logs[t][id]=logs[t][id]==='done'?null:'done';
  saveL();
  const item=document.getElementById('si-'+id);
  const isDone=logs[t][id]==='done';
  item.classList.toggle('ticked',isDone);
  item.classList.remove('failed');
  btn.innerHTML=isDone?'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--heat)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'';
  item.querySelector('.sheet-fail').innerHTML='';
  _sheetAnimate(btn,'stamp-done');
  const tl=logs[t]||{};
  updateHeat(habits.filter(h=>tl[h.id]==='done').length,habits.length);

  patchHabitCard(id,logs[t][id]);
  renderScores();updateHeader();
  updateSheetProgress();
  if(isDone){ heatFlash(); comboHit(evt); } else { comboReset(); }
}
function sheetFail(id,btn,evt){
  const t=getDate();
  if(!logs[t])logs[t]={};
  logs[t][id]=logs[t][id]==='failed'?null:'failed';
  saveL();
  const item=document.getElementById('si-'+id);
  const isFailed=logs[t][id]==='failed';
  item.classList.toggle('failed',isFailed);
  item.classList.remove('ticked');
  btn.innerHTML=isFailed?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,80,0.9)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>':'';
  item.querySelector('.sheet-tick').innerHTML='';
  _sheetAnimate(btn,'stamp-fail');
  const tl=logs[t]||{};
  updateHeat(habits.filter(h=>tl[h.id]==='done').length,habits.length);

  patchHabitCard(id,logs[t][id]);
  renderScores();updateHeader();
  updateSheetProgress();
  comboReset();
}

/* DEV CONSOLE — dormant, will be reimplemented later */
function initDevConsole(){}

/* PREFERENCES */
function getPref(key){
  const D={streaks:'1',buttonFx:'1',bgAnim:'1',heat:'1',reducedAnim:'0',achievements:'1',reminder:'0',quotes:'1',combo:'1',haptic:'1',perfectDay:'1',weeklyReport:'1'};
  const v=localStorage.getItem('gc:pref:'+key);
  return (v!==null?v:(D[key]||'1'))==='1';
}
function setPref(key,val){
  localStorage.setItem('gc:pref:'+key,val?'1':'0');
}

/* ONBOARDING */
let currentScreen=0,addedDisciplines=[],screenSeen=new Set([0]);
const OB_CHIPS=[{n:'Exercise',c:'Health'},{n:'Meditate',c:'Mind'},{n:'Read',c:'Mind'},{n:'Wake Early',c:'Productivity'},{n:'Journal',c:'Mind'}];
const OB_CATS=['Health','Mind','Productivity','Lifestyle'];
let prefState={streaks:true,buttonFx:true,bgAnim:true,heat:true,reducedAnim:false,achievements:true,reminder:false,quotes:true,combo:true,haptic:true,perfectDay:true,weeklyReport:true};
let selectedPlan='yearly';

function showOnboarding(){
  currentScreen=0;addedDisciplines=[];screenSeen=new Set([0]);
  prefState={streaks:true,buttonFx:true,bgAnim:true,heat:true,reducedAnim:false,achievements:true,reminder:false,quotes:true,combo:true,haptic:true,perfectDay:true,weeklyReport:true};
  selectedPlan='yearly';

  const ol=document.createElement('div');
  ol.id='onboarding';ol.setAttribute('role','dialog');ol.setAttribute('aria-modal','true');

  // Progress bar
  const prog=document.createElement('div');prog.className='ob-progress';
  for(let i=0;i<6;i++){const b=document.createElement('div');b.className='ob-progress-bar'+(i===0?' active':'');prog.appendChild(b);}

  // Screen 0 — Brand Reveal
  const s0=document.createElement('div');s0.className='ob-screen active';
  s0.innerHTML=`<div class="ob-screen-inner" style="justify-content:center;" aria-label="Brand reveal, screen 1 of 6"><div class="ob-glow"></div><div class="ob-glow ob-glow-2"></div><div id="ob-wordmark" class="ob-fade-in">GRITCORE</div><div class="ob-divider ob-fade-in ob-stagger-1"></div><div id="ob-tagline" class="ob-fade-in ob-stagger-2">Built for the days you don\u2019t feel like it. The discipline is already in you \u2014 this is where you forge it.</div><div class="ob-tap-hint ob-fade-in ob-stagger-4">Tap to continue</div></div>`;
  // Tap navigation handled by global touchend handler

  // Screen 1 — Forge Metaphor
  const s1=document.createElement('div');s1.className='ob-screen';
  s1.innerHTML=`<div class="ob-screen-inner" style="justify-content:center;" aria-label="The forge metaphor, screen 2 of 6"><div class="ob-skip" role="button" tabindex="0" onclick="skipOnboarding()">SKIP</div><div class="ob-glow ob-glow-sm"></div><div class="ob-hammer ob-drop-in">\u2692</div><div class="ob-headline ob-fade-up ob-stagger-1">Habits are temporary.<br>Disciplines are forged.</div><div class="ob-divider ob-fade-in ob-stagger-2"></div><div class="ob-subtext ob-fade-in ob-stagger-3">Track what matters. Build streaks of iron.<br>Watch your progress burn brighter every day.</div><div class="ob-tap-hint ob-fade-in ob-stagger-5">Tap to continue</div></div>`;

  // Screen 2 — First Discipline
  const s2=document.createElement('div');s2.className='ob-screen';
  s2.innerHTML=`<div class="ob-screen-inner" style="justify-content:center;" aria-label="Choose your disciplines, screen 3 of 6"><div class="ob-skip" role="button" tabindex="0" onclick="skipOnboarding()">SKIP</div><div class="ob-title">Choose your disciplines</div><div class="ob-subtitle">Tap to add, or type your own</div><div class="ob-chips" id="ob-chips-area"></div><div class="ob-disc-list" id="ob-disc-list"></div><div class="ob-custom-wrap"><input class="ob-input" id="ob-custom-input" type="text" placeholder="Add your own..." maxlength="40" onkeydown="if(event.key==='Enter'){event.preventDefault();_obAddCustom()}"><button class="ob-add-btn" onclick="_obAddCustom()">+</button></div><div class="ob-cat-label">Category for custom disciplines:</div><div class="ob-cat-row" id="ob-cat-row"><div class="ob-cat-pill active" data-cat="Health" onclick="_obSelCat(this)">Health</div><div class="ob-cat-pill" data-cat="Mind" onclick="_obSelCat(this)">Mind</div><div class="ob-cat-pill" data-cat="Productivity" onclick="_obSelCat(this)">Productivity</div><div class="ob-cat-pill" data-cat="Lifestyle" onclick="_obSelCat(this)">Lifestyle</div><button class="ob-cat-new" onclick="_obNewCat()">+ New</button></div><div class="ob-nav"><button class="ob-nav-back" onclick="goToScreen(1)">\u2190 Back</button><button class="ob-btn" onclick="goToScreen(3)">NEXT</button></div></div>`;
  // Render initial chips
  setTimeout(()=>_obRenderScreen2(),0);

  // Screen 3 — Make It Yours
  const s3=document.createElement('div');s3.className='ob-screen';
  s3.innerHTML=`<div class="ob-screen-inner" style="justify-content:flex-start;padding-top:max(60px,calc(env(safe-area-inset-top)+28px));" aria-label="Make it yours, screen 4 of 6"><div class="ob-skip" role="button" tabindex="0" onclick="skipOnboarding()">SKIP</div><div class="ob-title">Make it yours</div><div class="ob-subtitle">Choose how GritCore feels</div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'streaks')"><span class="ob-card-icon">\u25C8</span><div class="ob-card-text"><div class="ob-card-title">Streak Badges</div><div class="ob-card-desc">Show streak count on each card</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'combo')"><span class="ob-card-icon">\u00D7</span><div class="ob-card-text"><div class="ob-card-title">Combo Counter</div><div class="ob-card-desc">x1, x2, x3 on rapid logging</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'buttonFx')"><span class="ob-card-icon">\u25C7</span><div class="ob-card-text"><div class="ob-card-title">Button Effects</div><div class="ob-card-desc">Ripple &amp; glow when logging</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'haptic')"><span class="ob-card-icon">\u2261</span><div class="ob-card-text"><div class="ob-card-title">Haptic Feedback</div><div class="ob-card-desc">Vibration on interactions</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'bgAnim')"><span class="ob-card-icon">\u25CB</span><div class="ob-card-text"><div class="ob-card-title">Background Animations</div><div class="ob-card-desc">Marble glow, ambient pulse</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'heat')"><span class="ob-card-icon">\u25B3</span><div class="ob-card-text"><div class="ob-card-title">Heat System</div><div class="ob-card-desc">Silver \u2192 gold color shift</div></div><div class="ob-toggle-circle on">\u2713</div></div><div style="display:flex;align-items:center;gap:12px;margin-top:12px;width:100%;max-width:340px;"><div class="ob-pill-switch" role="switch" aria-checked="false" tabindex="0" onclick="_obPill(this,'reducedAnim')"><div class="ob-pill-knob"></div></div><div style="font-family:'Josefin Sans',sans-serif;font-size:10px;color:var(--ctd);">\u25D0 Reduced Animations (~33%)</div></div><div class="ob-settings-note">All settings available later in Settings \u2192 Customisation</div><div class="ob-nav"><button class="ob-nav-back" onclick="goToScreen(2)">\u2190 Back</button><button class="ob-btn" onclick="goToScreen(4)">NEXT</button></div></div>`;

  // Screen 4 — Stay Motivated
  const s4=document.createElement('div');s4.className='ob-screen';
  s4.innerHTML=`<div class="ob-screen-inner" style="justify-content:flex-start;padding-top:max(60px,calc(env(safe-area-inset-top)+28px));" aria-label="Stay motivated, screen 5 of 6"><div class="ob-skip" role="button" tabindex="0" onclick="skipOnboarding()">SKIP</div><div class="ob-title">Stay motivated</div><div class="ob-subtitle">Choose what keeps you going</div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'perfectDay')"><span class="ob-card-icon">\u2726</span><div class="ob-card-text"><div class="ob-card-title">Perfect Day</div><div class="ob-card-desc">Celebration when all disciplines done</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'achievements')"><span class="ob-card-icon">\u2605</span><div class="ob-card-text"><div class="ob-card-title">Achievements</div><div class="ob-card-desc">Streak milestones (7, 14, 30, 60, 100 days)</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-card" role="switch" aria-checked="false" tabindex="0" onclick="_obCard(this,'reminder')"><span class="ob-card-icon">\u25F7</span><div class="ob-card-text"><div class="ob-card-title">Daily Reminder</div><div class="ob-card-desc">9:00 AM default \u00B7 change later in Settings</div></div><div class="ob-toggle-circle">\u2713</div></div><div class="ob-card active" role="switch" aria-checked="true" tabindex="0" onclick="_obCard(this,'quotes')"><span class="ob-card-icon">\u275D</span><div class="ob-card-text"><div class="ob-card-title">Motivational Quotes</div><div class="ob-card-desc">Daily quote on Today tab</div></div><div class="ob-toggle-circle on">\u2713</div></div><div class="ob-settings-note">All settings available later in Settings \u2192 Customisation</div><div class="ob-nav"><button class="ob-nav-back" onclick="goToScreen(3)">\u2190 Back</button><button class="ob-btn" onclick="goToScreen(5)">NEXT</button></div></div>`;

  // Screen 5 — Paywall
  const s5=document.createElement('div');s5.className='ob-screen';
  s5.innerHTML=`<div class="ob-screen-inner" aria-label="Your forge is ready, screen 6 of 6"><div class="ob-title statement">Your forge is ready</div><div class="ob-subtitle">Start your free trial to begin</div><div class="ob-value-row"><span class="ob-check-circle">\u2713</span><span>Unlimited disciplines with streak tracking</span></div><div class="ob-value-row"><span class="ob-check-circle">\u2713</span><span>Daily heat system that rewards consistency</span></div><div class="ob-value-row"><span class="ob-check-circle">\u2713</span><span>Achievements and milestone celebrations</span></div><div class="ob-stat-line">Users who track daily are 85% more likely to build lasting habits</div><div class="ob-plan-cards"><div class="ob-plan-card" id="ob-plan-weekly" role="radio" aria-checked="false" tabindex="0" onclick="_obPlan('weekly')" onkeydown="if(event.key==='Enter'){this.click()}"><div class="ob-plan-radio"></div><div><div class="ob-plan-label">WEEKLY</div><div class="ob-plan-price">$6.99</div><div class="ob-plan-period">/ week</div></div></div><div class="ob-plan-card selected" id="ob-plan-yearly" role="radio" aria-checked="true" tabindex="0" onclick="_obPlan('yearly')" onkeydown="if(event.key==='Enter'){this.click()}"><div class="ob-plan-radio selected"></div><div><div class="ob-plan-label">YEARLY</div><div class="ob-plan-price">$39.99</div><div class="ob-plan-period">/ year</div><div class="ob-plan-savings">Save 85%</div></div><div class="ob-plan-badge">BEST VALUE</div></div></div><button class="ob-cta-trial" onclick="startFreeTrial()">START FREE TRIAL</button><div class="ob-trial-detail" id="ob-trial-detail">7 days free, then $39.99 per year. Cancel anytime.</div><div class="ob-maybe-later" role="button" tabindex="0" onclick="dismissOnboarding('today')" onkeydown="if(event.key==='Enter'){this.click()}">Maybe later</div><div class="ob-restore" role="button" tabindex="0" onclick="if(typeof paywall!=='undefined')paywall.restore()">Already purchased? Restore</div><button class="ob-nav-back" onclick="goToScreen(4)" style="margin-top:12px;">\u2190 Back</button></div>`;

  ol.appendChild(prog);
  [s0,s1,s2,s3,s4,s5].forEach(s=>ol.appendChild(s));
  document.body.appendChild(ol);

  // Tap navigation — click event is more reliable than touchend on iOS
  ol.addEventListener('click',function(e){
    const t=e.target;
    if(t.closest('button,input,a,.ob-card,.ob-chip,.ob-skip,.ob-pill-switch,.ob-plan-card,.ob-cta-trial,.ob-maybe-later,.ob-restore,.ob-disc-row,.ob-cat-pill,.ob-cat-new,.ob-cat-row,.ob-toggle-circle,.ob-custom-wrap,.ob-nav,.ob-add-btn,.ob-btn,.ob-nav-back'))return;
    const x=e.clientX,w=window.innerWidth;
    if(x<w*0.45&&currentScreen>0)goToScreen(currentScreen-1);
    else if(x>w*0.55&&currentScreen<5)goToScreen(currentScreen+1);
  });

  // Keyboard nav
  document.addEventListener('keydown',function _obKey(e){
    if(!document.getElementById('onboarding'))return document.removeEventListener('keydown',_obKey);
    if(e.key==='ArrowRight'&&currentScreen<5)goToScreen(currentScreen+1);
    if(e.key==='ArrowLeft'&&currentScreen>0)goToScreen(currentScreen-1);
  });
}

function _obSelectChip(name){
  const def=OB_CHIPS.find(c=>c.n===name);
  if(!def||addedDisciplines.some(d=>d.name===name))return;
  addedDisciplines.push({name:def.n,cat:def.c,fromChip:true});
  _obRenderScreen2();
}
function _obRemoveDisc(idx){
  addedDisciplines.splice(idx,1);
  _obRenderScreen2();
}
function _obRenderScreen2(){
  const ca=document.getElementById('ob-chips-area');
  const dl=document.getElementById('ob-disc-list');
  if(!ca||!dl)return;
  const taken=new Set(addedDisciplines.filter(d=>d.fromChip).map(d=>d.name));
  ca.innerHTML=OB_CHIPS.filter(c=>!taken.has(c.n)).map(c=>`<div class="ob-chip" tabindex="0" onclick="_obSelectChip('${c.n}')">${c.n}</div>`).join('');
  if(!OB_CHIPS.some(c=>!taken.has(c.n)))ca.style.display='none';else ca.style.display='';
  dl.innerHTML=addedDisciplines.map((d,i)=>`<div class="ob-disc-row"><span class="ob-disc-name">${d.name}</span><span class="ob-disc-cat">${d.cat||'Uncategorized'}</span><button class="ob-disc-x" onclick="_obRemoveDisc(${i})">\u00D7</button></div>`).join('');
}
function _obSelCat(el){
  document.querySelectorAll('.ob-cat-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
}
function _obNewCat(){
  const row=document.getElementById('ob-cat-row');
  const btn=row.querySelector('.ob-cat-new');
  // If input already exists, focus it
  if(row.querySelector('.ob-cat-input')){row.querySelector('.ob-cat-input').focus();return;}
  const inp=document.createElement('input');
  inp.className='ob-cat-input';inp.type='text';inp.placeholder='Name...';inp.maxLength=20;
  inp.style.cssText='width:80px;padding:6px 10px;border-radius:8px;border:1px solid var(--gold);background:var(--gold-05);font-family:"Josefin Sans",sans-serif;font-size:10px;color:var(--gold);outline:none;letter-spacing:1px;';
  function addCat(){
    const name=inp.value.trim();
    if(!name){inp.remove();return;}
    const p=document.createElement('div');
    p.className='ob-cat-pill active';p.dataset.cat=name;p.textContent=name;
    p.onclick=function(){_obSelCat(this);};
    document.querySelectorAll('.ob-cat-pill').forEach(x=>x.classList.remove('active'));
    row.insertBefore(p,btn);
    inp.remove();
  }
  inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();addCat();}};
  inp.onblur=addCat;
  row.insertBefore(inp,btn);
  inp.focus();
}
function _obCard(el,key){
  const on=!el.classList.contains('active');
  el.classList.toggle('active',on);
  el.setAttribute('aria-checked',String(on));
  const circle=el.querySelector('.ob-toggle-circle');
  if(circle)circle.classList.toggle('on',on);
  prefState[key]=on;
  if(key==='reminder'&&on){gcNotifications.requestPermission().then(granted=>{if(granted)gcNotifications.scheduleDailyReminder(9,0);});}
}
function _obPill(el,key){
  const on=!el.classList.contains('on');
  el.classList.toggle('on',on);
  el.setAttribute('aria-checked',String(on));
  prefState[key]=on;
}
function _obAddCustom(){
  const inp=document.getElementById('ob-custom-input');
  if(!inp)return;
  const name=inp.value.trim();
  if(!name||addedDisciplines.some(d=>d.name===name))return;
  const catEl=document.querySelector('.ob-cat-pill.active');
  const cat=catEl?catEl.dataset.cat:'';
  addedDisciplines.push({name:name,cat:cat,fromChip:false});
  inp.value='';
  _obRenderScreen2();
}
function _obPlan(plan){
  selectedPlan=plan;
  const wk=document.getElementById('ob-plan-weekly'),yr=document.getElementById('ob-plan-yearly');
  wk.classList.toggle('selected',plan==='weekly');wk.setAttribute('aria-checked',String(plan==='weekly'));
  wk.querySelector('.ob-plan-radio').classList.toggle('selected',plan==='weekly');
  yr.classList.toggle('selected',plan==='yearly');yr.setAttribute('aria-checked',String(plan==='yearly'));
  yr.querySelector('.ob-plan-radio').classList.toggle('selected',plan==='yearly');
  const det=document.getElementById('ob-trial-detail');
  if(det)det.textContent=plan==='yearly'?'7 days free, then $39.99 per year. Cancel anytime.':'7 days free, then $6.99 per week. Cancel anytime.';
}

function goToScreen(n){
  if(n<0||n>5)return;
  const screens=document.querySelectorAll('.ob-screen');
  screens[currentScreen].classList.remove('active');
  currentScreen=n;
  screens[n].classList.add('active');
  if(!screenSeen.has(n))screenSeen.add(n);
  document.querySelectorAll('.ob-progress-bar').forEach((b,i)=>{b.classList.toggle('active',i<=n);});
}

function dismissOnboarding(targetTab){
  Object.entries(prefState).forEach(([k,v])=>setPref(k,v));
  const newHabits=[];
  // Auto-capture any text still in the input
  const obInp=document.getElementById('ob-custom-input');
  if(obInp&&obInp.value.trim()){
    const catEl=document.querySelector('.ob-cat-pill.active');
    addedDisciplines.push({name:obInp.value.trim(),cat:catEl?catEl.dataset.cat:'',fromChip:false});
  }
  addedDisciplines.forEach(d=>{newHabits.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),name:d.name,cat:d.cat||'',order:habits.length+newHabits.length});});
  if(newHabits.length){const hh=effH();newHabits.forEach(h=>hh.push(h));habits=hh;save();}
  store.set('gc:onboarded','1');
  const ol=document.getElementById('onboarding');
  if(ol){
    ol.style.pointerEvents='none';
    // Render behind the overlay before fading out
    sw(targetTab||'today');render();
    requestAnimationFrame(()=>{
      ol.style.transition='opacity 0.4s ease-out';ol.style.opacity='0';
      setTimeout(()=>ol.remove(),420);
    });
  }
}

function skipOnboarding(){
  dismissOnboarding('today');
}

function startFreeTrial(){
  // Dismiss first, then attempt purchase in background
  dismissOnboarding('today');
  try{if(typeof paywall!=='undefined')paywall.purchase().catch(()=>{});}catch(e){}
}

/* INIT */
load().then(async()=>{
  if(typeof paywall!=='undefined'){await paywall.init();paywall.initTrial();}
  if(localStorage.getItem('gc:dev')==='1'){const btn=document.getElementById('dev-console-btn');if(btn)btn.style.display='';}
  {const k=localStorage.getItem('gc1:accentColor');if(k&&ACCENT_COLORS[k])setAccentColor(k);}
  const onboarded=await store.get('gc:onboarded');
  if(!onboarded){showOnboarding();}
  render();

  (function(){
    const TAGLINES=[
      "Forge your discipline.",
      "Discipline is freedom.",
      "Every mark is proof.",
      "Truth before comfort.",
      "Be the standard.",
      "Show up. Every. Day."
    ];
    const el=document.getElementById('logo-tagline');
    if(el)el.textContent=TAGLINES[Math.floor(Math.random()*TAGLINES.length)];
  })();

  const _t=getDate();const _tl=logs[_t]||{};updateHeat(habits.filter(h=>_tl[h.id]==='done').length,habits.length);updateMotivation();
  setTimeout(showWeeklyReport,1500);
});
/* ── Dev Console ── */
let devConsoleOpen = false;

function toggleDevConsole() {
  devConsoleOpen ? closeDevConsole() : openDevConsole();
}
function openDevConsole() {
  devConsoleOpen = true;
  document.getElementById('dev-console-drawer').classList.add('open');
  document.getElementById('dev-console-backdrop').classList.add('open');
}
function closeDevConsole() {
  devConsoleOpen = false;
  document.getElementById('dev-console-drawer').classList.remove('open');
  document.getElementById('dev-console-backdrop').classList.remove('open');
}
function devDayPlus() {
  const cur = getDate();
  const d = new Date(cur + 'T12:00'); d.setDate(d.getDate() + 1);
  localStorage.setItem('gc:sim_date', d.toISOString().split('T')[0]);
  closeDevConsole(); render(); updateHeader();
}
function devDayMinus() {
  const cur = getDate();
  const d = new Date(cur + 'T12:00'); d.setDate(d.getDate() - 1);
  localStorage.setItem('gc:sim_date', d.toISOString().split('T')[0]);
  closeDevConsole(); render(); updateHeader();
}
function devAllDone() {
  const today = getDate(); const hh = effH();
  if (!logs[today]) logs[today] = {};
  hh.forEach(h => { logs[today][h.id] = 'done'; });
  saveL(); closeDevConsole(); render();
}
function devAllFailed() {
  const today = getDate(); const hh = effH();
  if (!logs[today]) logs[today] = {};
  hh.forEach(h => { logs[today][h.id] = 'failed'; });
  saveL(); closeDevConsole(); render();
}
function devSetStreak() {
  const n = parseInt(prompt('Set streak to how many days?'), 10);
  if (isNaN(n) || n < 1) return;
  const hh = effH(); if (!hh.length) { showToast('Add disciplines first'); return; }
  for (let i = 1; i <= n; i++) {
    const d = daysBack(i, getDate());
    if (!logs[d]) logs[d] = {};
    hh.forEach(h => { logs[d][h.id] = 'done'; });
  }
  saveL(); closeDevConsole(); render();
}
function devAddTestData() {
  const testHabits = [
    {id:'t1',name:'Cold Shower',cat:'c1',created:daysBack(30,getDate())},
    {id:'t2',name:'Meditation',cat:'c2',created:daysBack(30,getDate())},
    {id:'t3',name:'Deep Work',cat:'c3',created:daysBack(30,getDate())},
    {id:'t4',name:'Evening Reflection',cat:'c4',created:daysBack(30,getDate())},
    {id:'t5',name:'Exercise',cat:'c1',created:daysBack(20,getDate())},
  ];
  habits = testHabits; isPlaceholder = false;
  const testLogs = {};
  for (let i = 1; i <= 30; i++) {
    const d = daysBack(i, getDate());
    testLogs[d] = {};
    testHabits.forEach(h => {
      testLogs[d][h.id] = Math.random() > 0.25 ? 'done' : 'failed';
    });
  }
  logs = testLogs;
  saveH(); saveL(); closeDevConsole(); render();
  showToast('Test data added');
}
function devTriggerOnboarding() {
  localStorage.removeItem('gc:onboarded');
  closeSettings();
  showOnboarding();
}
function devResetDate() {
  localStorage.removeItem('gc:sim_date');
  closeDevConsole(); render(); updateHeader();
}
function devResetAll() {
  habits=[];logs={};
  localStorage.removeItem('gc1:habits');
  localStorage.removeItem('gc1:logs');
  localStorage.removeItem('gc1:milestones');
  localStorage.removeItem('gc1:ach');
  localStorage.removeItem('gc:sim_date');
  isPlaceholder=true;
  saveH();saveL();render();
  showToast('All data reset','Back to day zero');
}
