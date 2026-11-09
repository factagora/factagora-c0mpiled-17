// 11:23 game screen. Loaded as an ES module by game/index.html; the game save and API calls are in ./store.js.
(function(){
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const h = (tag, attrs, ...kids) => {
  const el = document.createElement(tag);
  for (const k in attrs || {}) {
    if (k === 'class') el.className = attrs[k];
    else if (k === 'text') el.textContent = attrs[k];
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]);
    else el.setAttribute(k, attrs[k]);
  }
  kids.forEach(c => c != null && el.append(c));
  return el;
};

/* ---------- DATA (timepoints, places and who is where follow data/case.json) ---------- */
const PEOPLE = {
  jisoo:  {name:'Julia Han',   short:'Julia',  ini:'JH', hair:'#1a1230', suit:'#2f6f8f', img:'jisoo',  face:{'2016':'neutral'}},
  dohyun: {name:'Daniel Kang', short:'Daniel', ini:'DK', hair:'#2a1d14', suit:'#4a4a6a', img:'dohyun', face:{'2016':'neutral','mid':'neutral','2026':'defensive'}},
  minjae: {name:'Marcus Oh',   short:'Marcus', ini:'MO', hair:'#141018', suit:'#6a3a5a', img:'minjae', face:{'2016':'neutral','mid':'neutral','2026':'neutral'}},
  hana:   {name:'Hannah Yoo',  short:'Hannah', ini:'HY', hair:'#5a2e1a', suit:'#c9a24a', img:'hana',   face:{'2016':'neutral','mid':'neutral','2026':'neutral'}},
  kim:    {name:'Ken Kim',     short:'Ken',    ini:'KK', hair:'#b8b4c8', suit:'#3a5a3a', img:'kim',    face:{'2016':'neutral','2026':'guilty'}},
  grace:  {name:'Grace Lee',   short:'Grace',  ini:'GL', hair:'#3a2418', suit:'#8a2a3a', img:'grace',  face:{'2016':'neutral','2026':'neutral'}}
};
// role shown in the chat intro, by year
function roleOf(k, y){
  return ({
    jisoo:  'co-founder, cto',
    dohyun: y<2025 ? 'ceo, co-founder' : 'ceo, now a unicorn',
    minjae: y<=2017 ? 'lead developer' : y<2025 ? 'now at nova ai' : 'ceo, nova ai',
    hana:   y===2016 ? 'design intern' : y===2017 ? 'former intern' : 'it reporter',
    kim:    y<=2017 ? 'building guard' : 'retired',
    grace:  'investor'
  })[k];
}
// seven timepoints: March 15 at 22:50 by radio, 2026 in person
const ERAS = ['2015','2016','2017','2018','2019','2025','2026'];
const ERA_NOTE = {
  '2015':'year one, prototype all-nighter', '2016':'33 minutes before', '2017':"first memorial, ken's last shift",
  '2018':"second memorial, hannah's first article", '2019':'third memorial, fellowship prep',
  '2025':'ninth memorial, after hannah finds the contract', '2026':'present'
};
// portrait looks: 2016 covers 2015-2016, mid covers 2017-2019, 2026 covers 2025-2026 (/assets/portraits/{id}_{look}_{expression}.webp)
const lookOf = era => era<='2016' ? '2016' : era<='2019' ? 'mid' : '2026';
function portraitSrc(k, era){
  const p=PEOPLE[k], look=lookOf(era), use = p.face[look] ? look : (look==='mid' && p.face['2016'] ? '2016' : null);   // ken has no mid look: 2017 uses 2016
  return use ? `/assets/portraits/${p.img}_${use}_${p.face[use]}.webp` : null;
}
// static tile for portraits on radio timepoints, drawn once and used as a CSS background
(()=>{ const c=document.createElement('canvas'); c.width=c.height=48; const x=c.getContext('2d'), d=x.createImageData(48,48);
  for (let i=0;i<d.data.length;i+=4){ const v=Math.random()*255|0; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; }
  x.putImageData(d,0,0); document.documentElement.style.setProperty('--snow', `url(${c.toDataURL()})`); })();
// preload every look so switching years never shows an empty frame
const portraitCache = Object.keys(PEOPLE).flatMap(k=>ERAS.map(e=>portraitSrc(k,e))).filter((v,i,a)=>v && a.indexOf(v)===i).map(src=>Object.assign(new Image(),{src}));
// who is where (data/case.json "positions"); place ids are case.json places, offsite people carry the place they name
const POS = {
  '2015':{jisoo:'dev_floor', minjae:'dev_floor', dohyun:'ceo_room', kim:'lobby'},
  '2016':{jisoo:'dev_floor', hana:'dev_floor', kim:'lobby', dohyun:'@home', minjae:'@home', grace:'@home'},
  '2017':{dohyun:'lounge', minjae:'lounge', hana:'lounge', kim:'lobby'},
  '2018':{dohyun:'lounge', hana:'lounge', minjae:'@nova office'},
  '2019':{dohyun:'ceo_room', minjae:'lounge', hana:'lounge'},
  '2025':{dohyun:'lounge', hana:'lounge', minjae:'@nova hq'},
  '2026':{dohyun:'@moonlight hq', minjae:'@nova hq', hana:'@newsroom', kim:"@ken's home", grace:'@vc office'}
};
// who can be talked to in a year: anyone with a position that year in data/case.json
const ORDER = ['jisoo','dohyun','minjae','hana','kim','grace'];
// places of a year for the places page: five office rooms + elsewhere (radio years), or the 2026 places + evidence storage
const ROOMS = [['dev_floor','dev floor'],['ceo_room','ceo room'],['server_room','server room'],['lounge','lounge'],['lobby','lobby · security desk']];
const SUB26 = {'moonlight hq':'pangyo · a unicorn now', 'nova hq':'the competitor', 'newsroom':'it desk', "ken's home":'retired, wants to talk', 'vc office':'keeps her last email'};
function placesOf(era){
  const pos=POS[era], at=place=>Object.keys(pos).filter(k=>pos[k]===place);
  const away=[...new Set(Object.values(pos).filter(v=>v[0]==='@'))];
  if (era==='2026') return [
    ...away.map(pl=>({key:pl.slice(1), lbl:pl.slice(1), sub:SUB26[pl.slice(1)], people:at(pl)})),
    {key:'evidence storage', lbl:'evidence storage', sub:'case 2016-0315, boxed since 2016', people:[]}
  ];
  return [
    ...ROOMS.map(([id,lbl])=>({key:id, lbl, people:at(id), sub: id==='server_room' ? 'deploy-bot logs live here' : ''})),
    ...(away.length ? [{key:'elsewhere', lbl:'elsewhere', sub:away.map(v=>v.slice(1)).join(' · ')+' · by radio', people:away.flatMap(at)}] : [])
  ];
}
// each place shows a crop of existing background art: [image, x%, y%]
const ART = {
  dev_floor:['bg_office_2016',14,52], ceo_room:['bg_office_2016',74,36], server_room:['bg_server_hall',30,45], lounge:['bg_office_2016',48,34],
  lobby:['bg_office_2016',88,34], elsewhere:['bg_seoul_2026',70,45],
  'moonlight hq':['bg_seoul_2026',27,40], 'nova hq':['bg_seoul_2026',40,40], newsroom:['bg_office_2016',36,42],
  "ken's home":['bg_seoul_2026',88,44], 'vc office':['bg_office_2016',72,32], 'evidence storage':['bg_evidence_room',50,50]
};
const artStyle = key => { const a=ART[key]; return a ? `--art:url("/assets/bg/${a[0]}.webp");--ax:${a[1]}%;--ay:${a[2]}%` : ''; };
// record cards (data/case.json records); found by searching a place, only after visiting available_from or later
const RECORDS = {
  report:    {title:'Incident report (Mar 16, 2016)', line:'Server-rack cover found open. Log-server disk missing. No witness statements filed.', icon:'report', from:null},
  parking:   {title:'Parking barrier log', line:"Mar 15, 21:10: Daniel Kang's car exits. No re-entry that night.", icon:'parking', from:'2017'},
  door:      {title:'Server-room door log', line:'Mar 15, 22:40: opened with the shared admin card.', icon:'door_log', from:'2018'},
  taxi:      {title:'Taxi app receipt', line:'Mar 15, 23:06: Hannah Yoo picked up at the front entrance.', icon:'taxi_app', from:'2018'},
  messenger: {title:'Messenger backup (found 2019)', line:"Mar 15, 19:02 Julia: 'Was the deploy-bot push on the 13th you?' 19:05 Marcus: 'No idea.'", icon:'messenger_backup', from:'2019'}
};
// search spots per place: [record, x%, y%]
const SPOTS = {
  lobby:[['parking',62,50]], server_room:[['door',66,46]], ceo_room:[['messenger',58,50]],
  'evidence storage':[['report',46,52]], newsroom:[['taxi',60,50]], 'moonlight hq':[['messenger',55,48]]
};
// evidence icons and the fact ids that fill them (asset sheet); rec = the record card that also fills it
const EVIDENCE = [
  {icon:'radio', title:'The radio', refs:[], always:true},
  {icon:'report', title:'Incident report', refs:['F25'], rec:'report'},
  {icon:'parking', title:'Parking barrier', refs:['F09','F48'], rec:'parking'},
  {icon:'door_log', title:'Server-room door log', refs:['F26'], rec:'door'},
  {icon:'taxi_app', title:'Taxi app', refs:['F57'], rec:'taxi'},
  {icon:'messenger_backup', title:'Messenger backup', refs:['F52'], rec:'messenger'},
  {icon:'deploy_log', title:'deploy-bot log', refs:['F04','R03']},
  {icon:'email', title:'Last email', refs:['F13']},
  {icon:'envelope', title:'Envelope', refs:['F24']},
  {icon:'hoodie', title:'Gray hoodie', refs:['F11','F12']},
  {icon:'nova_contract', title:'Nova contract', refs:['F03','F29']},
  {icon:'terms', title:'Signing terms', refs:['F06']},
  {icon:'escrow', title:'Escrow folder', refs:['F21']},
  {icon:'hospital_bill', title:'Hospital bill', refs:['F28']}
];
const isHere = (k, era) => k in POS[era];
const S = {era:'2016', visited:new Set(), person:null, eras:new Set(['2016'])};

/* ---------- SKY (pixel stars, moon, horizon) ---------- */
const sky=$('#sky'), sctx=sky.getContext('2d'); let stars=[], SW=0, SH=0, frame=0;
function sizeSky(){ SW=Math.ceil(innerWidth/3); SH=Math.ceil(innerHeight/3); sky.width=SW; sky.height=SH; stars=[]; for(let i=0;i<SW*SH/90;i++) stars.push({x:Math.random()*SW|0,y:Math.random()*SH*.66|0,b:Math.random(),big:Math.random()<.06}); }
function drawSky(){
  const g=sctx.createLinearGradient(0,0,0,SH*.68); g.addColorStop(0,'#0d0930'); g.addColorStop(1,'#2e238f'); sctx.fillStyle=g; sctx.fillRect(0,0,SW,SH);
  stars.forEach(s=>{ const tw = reduced?1:(.5+.5*Math.sin(frame*.15+s.b*20)); sctx.fillStyle=`rgba(236,234,255,${.35+.65*tw*s.b})`; sctx.fillRect(s.x,s.y,1,1); if (s.big && tw>.6){ sctx.fillRect(s.x-1,s.y,3,1); sctx.fillRect(s.x,s.y-1,1,3); } });
  const mx=SW*.86|0, my=SH*.12|0, r=Math.max(6,SH*.045|0);
  sctx.fillStyle='rgba(245,232,180,.18)'; sctx.beginPath(); sctx.arc(mx,my,r*2.2,0,7); sctx.fill();
  sctx.fillStyle='#f3e7bf'; sctx.beginPath(); sctx.arc(mx,my,r,0,7); sctx.fill(); sctx.fillStyle='#d9cba0'; sctx.fillRect(mx-2,my-1,2,2); sctx.fillRect(mx+2,my+2,3,2);
  // city skyline instead of the sea: low pixel blocks with a few lit windows
  const sy=SH*.68|0; sctx.fillStyle='#120e4c'; sctx.fillRect(0,sy,SW,SH-sy);
  for (let x=0, i=0; x<SW; i++){ const w=8+(i*37%14), bh=10+(i*53%28); sctx.fillStyle='#0b0930'; sctx.fillRect(x,sy-bh,w,bh+2);
    for (let wy=sy-bh+3; wy<sy-2; wy+=4) for (let wx=x+2; wx<x+w-2; wx+=3) if ((wx*7+wy*13+i)%11===0){ sctx.fillStyle='rgba(245,196,81,.55)'; sctx.fillRect(wx,wy,1,1); }
    x+=w+1; }
}
const skyHidden = () => ['title','brief','map','places'].includes(document.documentElement.dataset.screen);
let lastT=0; function skyLoop(t){ if (t-lastT>110 && !skyHidden()){ lastT=t; frame++; drawSky(); } if (!reduced) requestAnimationFrame(skyLoop); }
sizeSky(); drawSky(); if (!reduced) requestAnimationFrame(skyLoop); addEventListener('resize',()=>{ sizeSky(); drawSky(); });

/* ---------- NOISE (radio static) ---------- */
const noise=$('#noise'), nctx=noise.getContext('2d'); let noiseLevel=0, noiseRAF=0;
function noiseTick(){ if (noiseLevel<=0.01){ noise.style.opacity=0; noiseRAF=0; return; } const img=nctx.createImageData(160,90); for (let i=0;i<img.data.length;i+=4){ const v=Math.random()*255|0; img.data[i]=v*.85|0; img.data[i+1]=v*.8|0; img.data[i+2]=v; img.data[i+3]=255; } nctx.putImageData(img,0,0); noise.style.opacity=noiseLevel; noiseRAF=requestAnimationFrame(noiseTick); }
function setNoise(l){ noiseLevel = reduced ? Math.min(l,.15) : l; if (!noiseRAF && noiseLevel>0.01) noiseRAF=requestAnimationFrame(noiseTick); if (noiseLevel<=.01) noise.style.opacity=0; }
function burst(ms){ setNoise(.85); setTimeout(()=>setNoise(0), ms); }

/* ---------- UTIL ---------- */
let toastT; function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2600); }
let typeTok=0;
function typeInto(el, text, speed){ const tok=++typeTok; if (reduced){ el.textContent=text; return Promise.resolve(); } el.textContent=''; return new Promise(res=>{ let i=0; (function step(){ if (tok!==typeTok) return res(); el.textContent=text.slice(0, ++i); if (i<text.length) setTimeout(step, speed||22); else res(); })(); }); }
function phEl(k, style){ const p=PEOPLE[k], el=h('div',{class:'ph',text:p.ini,style:`--hair:${p.hair};--suit:${p.suit};${style||''}`}); setFace(el, k, S.era); return el; }
// swap the drawn placeholder for the portrait of this era. With no art for this era (julia in 2026) keep the
// current picture, so the leaving portrait fades out as itself; the initials show only if a file fails to load
function setFace(ph, k, era){
  const src=portraitSrc(k, era); let img=ph.querySelector('img');
  if (!src) return;
  if (!img){ img=h('img',{alt:'',decoding:'async'}); img.addEventListener('error',()=>{ img.remove(); ph.classList.remove('art'); }); ph.append(img); }
  if (img.getAttribute('src')!==src){ img.dataset.want=src; const next=new Image(); next.src=src;
    next.decode().catch(()=>{}).then(()=>{ if (img.dataset.want===src) img.src=src; }); }
  ph.classList.add('art');
}

function updateHud(){
  const now=S.era==='2026', i=ERAS.indexOf(S.era);
  $('#hudTime').textContent = now ? 'NOW  2026' : `RADIO  ${S.era}-03-15  22:50`;
  $('#timeOut').textContent = now ? 'in person' : 'radio 22:50';
  ['#timeOut','#timeRange'].forEach(q=>$(q).classList.toggle('y26', now));
  const bars=$('#bars'); bars.innerHTML='';
  ERAS.forEach((e,j)=>bars.append(h('i',{class: j===i ? (now?'on26':'on') : ''})));
}

/* ---------- ERA ---------- */
// moving the time bar switches the year at once: no VHS bands or static burst
function setEra(era){
  if (era===S.era) return;
  S.era=era; S.eras.add(era);
  if (S.person && !(S.person in POS[era])) S.person=null;   // only people present in that year can be asked
  updateHud(); renderMap(); renderChat();
}
$('#timeRange').addEventListener('input', e=>setEra(ERAS[+e.target.value]));

/* ---------- MAP (main screen) ---------- */
const pols={};
Object.keys(PEOPLE).forEach(k=>{ const b=h('button',{class:'pol','data-p':k,'aria-label':'question '+PEOPLE[k].name}, phEl(k), h('span',{text:PEOPLE[k].short})); b.addEventListener('click', ()=>openTalk(k)); pols[k]=b; });
function openTalk(k){ if (!isHere(k, S.era)) return; S.visited.add(k+S.era); S.person=k; polBadges(); renderChat(); $('#chatInput').focus(); }
const status = k => S.visited.has(k+S.era) ? 'some' : 'new';
function polBadges(){ Object.entries(pols).forEach(([k,el])=>{ el.querySelectorAll('.mark,.new').forEach(n=>n.remove()); el.classList.toggle('sel', k===S.person); if (isHere(k, S.era) && status(k)==='new') el.append(h('span',{class:'new',text:'★ NEW'})); }); }
function renderMap(){
  const era=S.era, plan=$('#plan');
  Object.entries(pols).forEach(([k,el])=>setFace(el.querySelector('.ph'), k, era));
  plan.classList.toggle('y26', era==='2026');
  plan.classList.toggle('radio', era!=='2026');
  document.documentElement.dataset.bg = era>='2025' ? 'seoul' : 'office';
  $('#planTitle').textContent = era==='2026' ? 'Seoul · 2026' : 'Moonlight Labs · Pangyo';
  $('#planDate').textContent = era==='2026' ? 'where are they now' : `${era}-03-15 · 22:50 · ${ERA_NOTE[era]}`;
  // all six people every year; the ones not in this year are grayed out and cannot be asked.
  // The slots are built once; a year change only flips classes and text, so nothing is re-laid out from scratch.
  if (!plan.childElementCount) ORDER.forEach(k=>plan.append(h('div',{class:'cell slot','data-k':k}, pols[k], h('span',{class:'note'}))));
  plan.querySelectorAll('.slot').forEach(slot=>{
    const k=slot.dataset.k, here=isHere(k, era), el=pols[k];
    slot.classList.toggle('away', !here); el.classList.toggle('away', !here); el.disabled=!here;
    el.setAttribute('aria-label', here ? 'question '+PEOPLE[k].name : `${PEOPLE[k].name} is not here in ${era}`);
    slot.lastElementChild.textContent = here ? roleOf(k, +era) : `not in ${era}`;
  });
  polBadges();
}
/* ---------- CHAT (answers from /api/ask; turns are kept in localStorage by ./store.js) ---------- */
// The case data calls Julia "jisoo"; the map era picks the case time point.
const apiId = k => k;   // screen ids are the case data ids (jisoo, dohyun, ...)
let G=null, game=null, asking=false;
// Every answered radio call is a new game, so people sharing one browser never see each other's chats.
let fresh=false;
function startGame(){ fresh=true; $('#memo').value=''; if (!G) return; game=G.newGame(); renderChat(); }
import('./store.js').then(m=>{ G=m; game = fresh ? G.newGame() : G.loadGame(); $('#memo').value=game.memo; renderChat(); }).catch(()=>toast('could not load the chat'));
// The memo is part of the game save; a new game clears it.
$('#memo').addEventListener('input', e=>{ if (!game) return; game.memo=e.target.value; G.saveGame(game); });
// Copies one answer into the memo with when and who, so the player can line up statements across time points.
function toMemo(t, p){
  const when = t.timepoint==='T2026' ? '2026 · now' : `${t.timepoint.slice(1)}-03-15 22:50`;
  const memo=$('#memo'), line=`[${when} · ${p.short}] ${t.answer}`;
  memo.value = memo.value ? `${memo.value.replace(/\s+$/,'')}\n${line}` : line;
  game.memo=memo.value; G.saveGame(game); memo.scrollTop=memo.scrollHeight; toast('added to memo');
}
const turnsHere = () => game ? game.turns.filter(t=>t.character===apiId(S.person) && t.timepoint==='T'+S.era) : [];

/* ---------- SHOW CARDS (pinned answers and evidence go with every question; the right ones open locked memories) ---------- */
const turnCard = t => ({ text: `${PEOPLE[t.character]?.short || t.character} (${t.timepoint.slice(1)}): ${t.answer}`, refs: t.refs || [] });
const eviCard = e => ({ text: `[evidence] ${e.title}`, refs: e.refs });
const isShown = card => !!game && game.pins.some(c=>c.text===card.text);
function toggleShow(card){
  if (!game) return;
  if (isShown(card)) G.unpin(game, card.text);
  else if (!G.pin(game, card)) return toast('you can show 10 cards at most. take one back first.');
  toast(isShown(card) ? 'you will show this to the people you question' : 'card taken back');
  renderChat();
}

/* ---------- EVIDENCE slots (memo window) ---------- */
let eviSeen=null, eviSel=null;
// where each clue came from: the first chat turn whose answer used one of its facts, or the place it was searched in
function evidenceFound(){
  const got={};
  EVIDENCE.forEach(e=>{
    if (e.always) { got[e.icon]='in the evidence box, 2026'; return; }
    if (e.rec && game && (game.records||[]).includes(e.rec)) { got[e.icon]='found by searching'; return; }
    const t = game && game.turns.find(t=>(t.refs||[]).some(r=>e.refs.includes(r)));
    if (t) got[e.icon]=`${PEOPLE[t.character]?.short || t.character} · ${t.timepoint==='T2026' ? '2026' : t.timepoint.slice(1)}`;
  });
  return got;
}
function renderEvidence(){
  const box=$('#evi'); if (!box) return;
  const got=evidenceFound(), fresh = eviSeen ? Object.keys(got).filter(k=>!eviSeen.has(k)) : [];
  box.innerHTML='';
  EVIDENCE.forEach(e=>{
    const has=e.icon in got;
    const b=h('button',{type:'button',class:(has?'got':'')+(has && isShown(eviCard(e))?' shown':'')+(fresh.includes(e.icon)?' fresh':'')+(eviSel===e.icon?' sel':''),'aria-label': has ? e.title : 'not found yet'},
      has ? h('img',{src:`/assets/items/${e.icon}.webp`,alt:''}) : '?');
    if (has) b.addEventListener('click', ()=>{ eviSel=e.icon; renderEvidence(); showEvidence(e, got[e.icon]); });
    box.append(b);
  });
  fresh.forEach(k=>toast('evidence added: '+EVIDENCE.find(e=>e.icon===k).title));
  eviSeen=new Set(Object.keys(got));
}
function showEvidence(e, from){
  const note=$('#eviNote'); note.innerHTML='';
  note.append(h('b',{text:e.title}), ` · ${from}`, h('button',{type:'button',text:'+ memo',onclick:()=>{
    const memo=$('#memo'), line=`[evidence] ${e.title} (${from})`;
    memo.value = memo.value ? `${memo.value.replace(/\s+$/,'')}\n${line}` : line;
    if (game){ game.memo=memo.value; G.saveGame(game); } toast('added to memo');
  }}), e.refs.length ? h('button',{type:'button',text: isShown(eviCard(e)) ? 'shown ✓' : 'show',onclick:()=>{ toggleShow(eviCard(e)); showEvidence(e, from); }}) : null);
}

/* ---------- PLACES page ---------- */
const recordOpen = id => { const f=RECORDS[id].from; return !f || [...S.eras].some(e=>e>=f); };
function showPlaces(){
  document.documentElement.dataset.screen='places'; navCurrent('places');
  $('#plTitle').textContent = S.era==='2026' ? 'places · seoul 2026' : `places · moonlight labs ${S.era}`;
  $('#plDate').textContent = S.era==='2026' ? 'in person' : `${S.era}-03-15 · 22:50 · by radio`;
  const grid=$('#pgrid'); grid.innerHTML=''; grid.hidden=false; $('#room').hidden=true;
  placesOf(S.era).forEach(c=>{
    const card=h('button',{type:'button',class:'pcard',style:artStyle(c.key)}, h('span',{class:'lbl',text:c.lbl}), c.sub ? h('span',{class:'sub',text:c.sub}) : null,
      h('span',{class:'faces'}, ...c.people.map(k=>h('img',{src:portraitSrc(k,S.era),alt:PEOPLE[k].short,title:PEOPLE[k].short}))),
      h('span',{class:'go',text: SPOTS[c.key] ? 'search ▶' : 'enter ▶'}));
    card.addEventListener('click', ()=>openRoom(c));
    grid.append(card);
  });
}
function openRoom(c){
  const room=$('#room'); room.innerHTML=''; room.setAttribute('style', artStyle(c.key));
  const card=h('div',{class:'room-card',hidden:''});
  room.append(h('div',{class:'room-head'}, h('button',{type:'button',class:'back',text:'◀ places',onclick:showPlaces}), h('span',{class:'rname',text:c.lbl}), c.sub ? h('span',{class:'rsub',text:c.sub}) : null));
  const people=h('div',{class:'room-people'});
  c.people.forEach(k=>people.append(h('button',{type:'button',onclick:()=>{ showMap(); openTalk(k); }}, h('img',{src:portraitSrc(k,S.era),alt:''}), `talk to ${PEOPLE[k].short}`)));
  room.append(people, card);
  const spots=SPOTS[c.key]||[];
  spots.forEach(([id,x,y])=>{
    const r=RECORDS[id], open=recordOpen(id), found=()=>game && (game.records||[]).includes(id);
    const b=h('button',{type:'button',class:'spot'+(open?'':' locked')+(found()?' found':''),style:`left:${x}%;top:${y}%`,'aria-label': open ? 'search: '+r.title : `locked: visit ${r.from} or later`}, h('img',{src:`/assets/items/${r.icon}.webp`,alt:''}));
    b.addEventListener('click', ()=>{
      card.hidden=false; card.innerHTML='';
      if (!open){ card.append(h('div',{}, h('b',{text:'something is here…'}), h('p',{text:`Not yet. Visit ${r.from} or later on the radio, then come back.`}))); return; }
      if (game && !found()){ (game.records ||= []).push(id); G.saveGame(game); renderEvidence(); }
      b.classList.add('found');
      card.append(h('img',{src:`/assets/items/${r.icon}.webp`,alt:''}), h('div',{}, h('b',{text:r.title}), h('p',{text:r.line}), h('small',{text:'record card · added to your evidence'})));
    });
    room.append(b);
  });
  if (!spots.length) room.append(h('span',{class:'room-empty',text: c.people.length ? 'nothing to search here. talk to who is here.' : 'nothing here tonight.'}));
  $('#pgrid').hidden=true; room.hidden=false; room.querySelector('.back').focus();
}
function navCurrent(go){ document.querySelectorAll('.navbox [data-go]').forEach(b=>b.setAttribute('aria-current', b.dataset.go===go ? 'true' : 'false')); }
function showMap(){ document.documentElement.dataset.screen='map'; navCurrent('map'); renderMap(); }
document.querySelector('[data-go="places"]').addEventListener('click', showPlaces);
document.querySelector('[data-go="map"]').addEventListener('click', showMap);
const introOf = era => era==='2026'
  ? 'Ten years later. The survivors remember less and hide more. Ask the same things and listen for what changed.'
  : `March 15, ${era}, 22:50 · ${ERA_NOTE[era]}. The radio is live and nobody knows what is coming. Pick someone on the map to talk.`;
function renderChat(){
  renderEvidence();
  const log=$('#chatlog'), p=PEOPLE[S.person]; log.innerHTML='';
  $('#chatTab').textContent = p ? `chat · ${p.short} · ${S.era}` : 'CASE FILE';
  $('#chatInput').disabled = $('#chatSend').disabled = !p || !game || asking;
  $('#chatInput').placeholder = p ? `message ${p.short} (${S.era === '2026' ? 'in person' : 'by radio'})…` : 'pick someone on the map to talk';
  if (!p) { log.append(h('p',{class:'intro',text:introOf(S.era)})); return; }
  const msgs = turnsHere();
  if (!msgs.length && !asking) log.append(h('p',{class:'intro muted',text:`${p.name} · ${roleOf(S.person, +S.era)} · ${S.era}. Ask anything.`}));
  msgs.forEach(t=>log.append(
    h('div',{class:'msg me'}, h('b',{text:'you'}), t.question),
    h('div',{class:'msg'}, h('b',{text:p.short}), t.answer, h('div',{class:'acts'},
      h('button',{type:'button',class:'tomemo',text:'→ memo',onclick:()=>toMemo(t, p)}),
      h('button',{type:'button',class:'tomemo'+(isShown(turnCard(t))?' on':''),text:isShown(turnCard(t))?'pinned ✓':'pin',onclick:()=>toggleShow(turnCard(t))})))));
  if (game?.pins.length) log.append(h('p',{class:'intro muted',text:`you are showing ${game.pins.length} card${game.pins.length>1?'s':''}: pinned answers and evidence.`}));
  if (asking) log.append(h('div',{class:'msg me'}, h('b',{text:'you'}), asking), h('p',{class:'intro muted',text:`${p.short} is answering…`}));
  log.scrollTop=log.scrollHeight;
}
/* chat height: drag the grip or use arrow keys; kept only for this page load */
{
  const grip=$('#chatGrip'), chat=grip.parentElement, wrap=chat.parentElement;
  const setH=px=>{
    const max=wrap.clientHeight-280-40;   // keep the map/memo row at its minimum (--topMin) plus the row gap
    const v=Math.round(Math.max(120, Math.min(max, px)));
    wrap.style.setProperty('--chatH', v+'px'); grip.setAttribute('aria-valuenow', v);
  };
  grip.addEventListener('pointerdown', e=>{
    grip.setPointerCapture(e.pointerId);
    const bottom=chat.getBoundingClientRect().bottom;
    const move=ev=>setH(bottom-ev.clientY);
    grip.addEventListener('pointermove', move);
    grip.classList.add('drag');
    grip.addEventListener('lostpointercapture', ()=>{ grip.removeEventListener('pointermove', move); grip.classList.remove('drag'); }, {once:true});
  });
  grip.addEventListener('dblclick', ()=>{ wrap.style.removeProperty('--chatH'); grip.removeAttribute('aria-valuenow'); });
  grip.addEventListener('keydown', e=>{
    const d={ArrowUp:20,ArrowDown:-20}[e.key]; if (!d) return;
    e.preventDefault(); setH(chat.offsetHeight+d);
  });
}
$('#chatform').addEventListener('submit', async e=>{
  e.preventDefault();
  const v=$('#chatInput').value.trim(); if (!v || !S.person || !game || asking) return;
  const who=S.person, era=S.era;
  asking=v; $('#chatInput').value=''; renderChat();
  try { await G.ask(game, apiId(who), 'T'+era, v); }
  catch (err) { toast(err.message || 'no answer, try again'); $('#chatInput').value=v; }
  finally { asking=false; renderChat(); $('#chatInput').focus(); }
});

/* ---------- ACCUSE (swaps the memo panel; one submission, judged by /api/accuse) ---------- */
const SUSPECTS = Object.keys(PEOPLE).filter(k=>k!=='jisoo');   // jisoo (Julia) is the victim
SUSPECTS.forEach(k=>{ const p=PEOPLE[k];
  $('#susOpts').append(h('label',{class:'sus'}, h('input',{type:'radio',name:'suspect',value:k}), phEl(k), h('span',{}, p.name, h('small',{class:'muted',text:roleOf(k, 2016)}))));
});
$('#susOpts').addEventListener('change', e=>{
  const b=$('#susPicked'); b.textContent=PEOPLE[e.target.value].name; b.classList.add('on');
});
function showAccuse(on){
  $('#memoView').hidden=on; $('#accuseView').hidden=!on;
  (on ? ($('#susOpts input:checked') || $('#susOpts input')) : $('#memo')).focus();
}
$('#toAccuse').addEventListener('click', ()=>showAccuse(true));
$('#toMemo').addEventListener('click', ()=>showAccuse(false));
document.querySelector('[data-go="accuse"]').addEventListener('click', ()=>{ if (document.documentElement.dataset.screen!=='map') showMap(); showAccuse(true); });
$('#accuseView').addEventListener('submit', e=>{
  e.preventDefault();
  const pick=$('#accuseView input:checked'), msg=$('#accuseMsg');
  if (!pick){ msg.textContent='pick who did it.'; $('#susOpts input').focus(); return; }
  const lock = on => $('#accuseView').querySelectorAll('input,#accuseSubmit').forEach(el=>el.disabled=on);
  lock(true); msg.textContent='sending…';
  fetch('/api/accuse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({who:pick.value, memo:$('#memo').value.slice(-8000)})})
    .then(r=>{ if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(v=>{
      S.verdict=v;
      $('#accuseView').classList.add('done');
      $('#accuseTitle').textContent='accusation sent';
      msg.textContent=`you named ${PEOPLE[pick.value].name}.`;
      $('#toMemo').before(h('button',{type:'button',class:'pbtn ghostb',text:'verdict',onclick:()=>$('#verdict').showModal()}));
      showVerdict(v, pick.value);
    })
    .catch(()=>{ lock(false); msg.textContent='could not reach the case server. try again.'; });
});
function showVerdict(v, who){
  const d=$('#verdict');
  d.classList.toggle('bad', !v.correct);
  $('#vTitle').textContent=v.title;
  $('#vWho').textContent=PEOPLE[who].name;
  $('#vMark').textContent = v.correct ? '✓ correct' : '! wrong';
  $('#vMark').className = v.correct ? 'ok' : 'no';
  const total = v.total_score ?? v.score;   // culprit points + motive points
  $('#vScore').textContent = `${total} / 100`;
  // the bar is 100 points wide: the culprit track (green) is 30 of them, the motive track (gold) 70; each fills by the points earned
  const culprit = v.culprit_points ?? (v.correct ? 30 : 0);
  const motive = v.motive_points ?? total - culprit;
  const part = (cls, label, points, max) => {
    const pct = Math.min(100, points / max * 100);
    return h('div',{class:'sgroup '+cls}, h('span',{class:'slab',text:label}),
      h('div',{class:'track'}, h('i',{class:'fill',style:`width:${pct}%${pct>0?';min-width:3px':''}`})));
  };
  const seg=$('#vSeg'); seg.innerHTML='';
  seg.append(part('c','culprit',culprit,30), part('m','motive',motive,70));
  const ul=$('#vMotives'); ul.innerHTML='';
  if (!v.motives.length) ul.append(h('li',{text:'no known motive found in what you wrote.'}));
  v.motives.forEach(m=>ul.append(h('li',{class:m.counted?'on':''}, h('span',{text:(m.counted?'✓ ':'— ')+m.label}), h('span',{text:m.counted?(m.earned ?? m.points):0}))));
  $('#vQuote').textContent=`${PEOPLE[who].short}: “${v.reaction}”`;
  const sm=$('#vSummary'); sm.innerHTML=''; v.summary.forEach(t=>sm.append(h('p',{text:t})));
  d.showModal();
}
$('#vClose').addEventListener('click', ()=>$('#verdict').close());

/* ---------- REGISTER SCORE → LEADERBOARD ---------- */
// shortcut: no score API yet; the board is sample data plus this player's entry, kept in memory. Swap for GET/POST /api/scores when the backend exists.
const BOARD = [
  {nick:'noir_cat',  ending:'SOLVED',  score:100},
  {nick:'radio1123', ending:'SOLVED',  score:90},
  {nick:'jiwonee',   ending:'SOLVED',  score:80},
  {nick:'sherlock_k',ending:'SOLVED',  score:70},
  {nick:'minty',     ending:'PARTLY',  score:60},
  {nick:'detective9',ending:'PARTLY',  score:40},
  {nick:'hana_fan',  ending:'PARTLY',  score:20},
  {nick:'static',    ending:'WRONG',   score:50},
  {nick:'guesswho',  ending:'WRONG',   score:10},
];
const ENDING_RANK={SOLVED:0,PARTLY:1,WRONG:2};
const ENDING_LABEL={SOLVED:'solved',PARTLY:'partly solved',WRONG:'wrong suspect'};
// a right culprit always beats a wrong one; ties keep the earlier entry first
const rankBoard = rows => rows.slice().sort((a,b)=>ENDING_RANK[a.ending]-ENDING_RANK[b.ending] || b.score-a.score);
let myEntry=null;
const NICK_OK=/^[\p{L}\p{N}_-]{2,12}$/u;

function showNick(on){
  $('#vBtns').hidden=on; $('#nickForm').hidden=!on;
  if (on) $('#nick').focus(); else $('#vRegister').focus();
}
$('#vRegister').addEventListener('click', ()=> myEntry ? showBoard() : showNick(true));
$('#nickBack').addEventListener('click', ()=>showNick(false));
$('#nick').addEventListener('input', ()=>{ $('#nick').removeAttribute('aria-invalid'); $('#nickMsg').textContent=''; $('#nickMsg').className=''; });
$('#nickForm').addEventListener('submit', e=>{
  e.preventDefault();
  const nick=$('#nick').value.trim(), msg=$('#nickMsg');
  const fail = t => { msg.textContent=t; msg.className='err'; $('#nick').setAttribute('aria-invalid','true'); $('#nick').focus(); };
  if (!NICK_OK.test(nick)) return fail('use 2–12 letters, numbers, _ or -.');
  if (BOARD.some(r=>r.nick.toLowerCase()===nick.toLowerCase())) return fail('that name is taken. try another.');
  $('#nick').disabled=$('#nickSubmit').disabled=true; msg.className=''; msg.textContent='registering…';
  setTimeout(()=>{   // stands in for the network round trip
    myEntry={nick, ending:S.verdict.ending, score:S.verdict.total_score ?? S.verdict.score, me:true};
    BOARD.push(myEntry);
    $('#vRegister').textContent='leaderboard ▶';
    showNick(false);
    showBoard();
  }, reduced?0:500);
});
function showBoard(){
  $('#verdict').close();
  const rows=rankBoard(BOARD), ol=$('#bRows'); ol.innerHTML='';
  rows.forEach((r,i)=>ol.append(h('li',{class:r.me?'me':''},
    h('span',{class:'rk',text:'#'+(i+1)}),
    h('span',{class:'nm',text:r.nick+(r.me?'  (you)':'')}),
    h('span',{class:'end '+(r.ending==='WRONG'?'no':r.ending==='SOLVED'?'ok':''),text:ENDING_LABEL[r.ending]}),
    h('span',{class:'sc',text:r.score+' pts'}))));
  const rank=rows.indexOf(myEntry)+1;
  $('#bMe').textContent=`registered. ${myEntry.nick}, you placed #${rank} of ${rows.length}.`;
  document.documentElement.dataset.screen='board';
  scrollTo(0,0);
  ol.querySelector('.me')?.scrollIntoView({block:'nearest'});
  $('#bBack').focus();
}
$('#bBack').addEventListener('click', ()=>{ document.documentElement.dataset.screen='map'; renderMap(false); });
$('#bAgain').addEventListener('click', ()=>location.reload());

/* ---------- TITLE: tune to 11.23 MHz, answer, then the map opens ---------- */
// five wide stations instead of a fine dial: the knob snaps to one; only 11.23 carries the voice
const STATIONS=[9.0, 10.0, 11.23, 12.0, 13.0], TARGET_I=2;
const dial=$('#dial'); let tuned=false, answered=false, tSecs=41, tStaticLevel=1;
// speaker static: a small canvas inside the radio, drawn at ~12fps while the title is up
const tsc=$('#tStatic').getContext('2d');
(function speakerStatic(){
  if (answered) return;
  const img=tsc.createImageData(48,48);
  for (let i=0;i<img.data.length;i+=4){ const v=Math.random()*255*tStaticLevel|0; img.data[i]=v*.85|0; img.data[i+1]=v*.8|0; img.data[i+2]=v; img.data[i+3]=255; }
  tsc.putImageData(img,0,0);
  if (!reduced) setTimeout(()=>requestAnimationFrame(speakerStatic), 80);
})();
const touch = () => $('#tDialbox').classList.add('touched');
['pointerdown','keydown','input'].forEach(ev=>dial.addEventListener(ev, touch));
function tune(){
  const i=+dial.value, f=STATIONS[i], d=Math.abs(i-TARGET_I), ok=d===0;
  // needle and knob sit on the station's tick (ticks span the bar minus 8px padding on each side)
  $('#tNeedle').style.left = $('#tKnob').style.left = `calc(8px + ${i*25}% - ${i*4}px)`;
  dial.setAttribute('aria-valuetext', (i===TARGET_I ? '11.23' : f.toFixed(1))+' MHz');
  tStaticLevel = ok ? 0 : .55 + d*.2;   // speaker static: lighter one station away, heavy far away
  if (ok===tuned) return;
  tuned=ok;
  ['#tClock','#tLogo','#tTuner','#tSpeaker'].forEach(q=>$(q).classList.toggle('live', ok));
  $('#tStatus').classList.toggle('live', ok);
  $('#tStatus').textContent = ok ? '…something is on this channel. Answer it.' : 'Drag the knob to ▼11.23 until the static clears';
  $('#tAnswer').disabled = !ok;
  if (ok) $('#tTime').textContent='23:23:00';
}
const tClock = setInterval(()=>{ if (tuned) return; tSecs=(tSecs+1)%60; $('#tTime').textContent=`23:22:${String(tSecs).padStart(2,'0')}`; }, 1000);
function answer(){
  if (!tuned || answered) return;
  answered=true; dial.disabled=true; $('#tAnswer').disabled=true; clearInterval(tClock);
  startGame();
  $('#tStatus').textContent='connecting…';
  burst(reduced?0:420);
  setTimeout(()=>{ document.documentElement.dataset.screen='brief'; playBrief(); }, reduced?0:420);
}
$('#bStart').addEventListener('click', ()=>{ document.documentElement.dataset.screen='map'; renderMap(false); $('#timeRange').focus(); });
/* brief intro: case number, typed headline and story, report slides in and gets stamped, then the two modes,
   the four steps and the start button. Plays once after the title; any click, Space or Enter shows everything. */
let briefRun=0;
function playBrief(){
  const sec=$('#s-brief'), parts=[...sec.querySelectorAll('.bx')], run=++briefRun;
  const done=()=>{ if (run!==briefRun) return; briefRun++; typeTok++; sec.classList.remove('playing'); parts.forEach(p=>{ p.classList.add('in'); p.classList.remove('typing'); if (p.dataset.full) p.textContent=p.dataset.full; }); $('#twSheet').classList.remove('strike'); $('#twWin').scrollTop=$('#twWin').scrollHeight; $('#bStart').focus(); };
  if (reduced){ done(); return; }
  const win=$('#twWin'), sheet=$('#twSheet');
  sec.classList.add('playing'); parts.forEach(p=>p.classList.remove('in'));
  const feed=setInterval(()=>{ win.scrollTop=win.scrollHeight; if (!sec.classList.contains('playing')) clearInterval(feed); }, 60);
  const wait=ms=>new Promise(r=>setTimeout(r,ms)), live=()=>run===briefRun;
  const show=async (el, ms)=>{ if (!live()) return; el.classList.add('in'); await wait(ms); };
  const type=async (el, speed)=>{ if (!live()) return; el.dataset.full ||= el.textContent; el.classList.add('in','typing'); sheet.classList.add('strike'); await typeInto(el, el.dataset.full, speed); el.classList.remove('typing'); sheet.classList.remove('strike'); };
  (async ()=>{
    const [eyebrow, title, lede, report, radio, now, ...rest] = parts;
    await show(eyebrow, 350); await type(title, 26); await wait(200); await type(lede, 9); await wait(150);
    await show(report, 1100); await show(radio, 300); await show(now, 450);
    for (const p of rest) await show(p, 260);
    done();
  })();
  const skip=e=>{ if (e.type==='keydown' && !(e.key===' '||e.key==='Enter')) return; if (!sec.classList.contains('playing')) return; e.preventDefault(); done(); };
  sec.addEventListener('click', skip); addEventListener('keydown', skip);
  const stop=setInterval(()=>{ if (!sec.classList.contains('playing')){ sec.removeEventListener('click', skip); removeEventListener('keydown', skip); clearInterval(stop); } }, 300);
}
// reopen the briefing from the menu; the map keeps its state, so the button just goes back
$('#toBrief').addEventListener('click', ()=>{ $('#bStart').textContent='Back to the map ▶'; document.documentElement.dataset.screen='brief'; $('#twWin').scrollTop=0; $('#bStart').focus(); });
dial.addEventListener('input', tune);
$('#tAnswer').addEventListener('click', answer);
addEventListener('keydown', e=>{
  if (document.documentElement.dataset.screen!=='title') return;
  if (e.key==='Enter' && document.activeElement!==$('#tAnswer')) answer();
  if (!dial.disabled && (e.key==='ArrowLeft'||e.key==='ArrowRight') && document.activeElement!==dial){ dial.value=Math.max(0,Math.min(4,+dial.value+(e.key==='ArrowRight'?1:-1))); touch(); tune(); }
});
tune();

$('#timeRange').value=ERAS.indexOf(S.era); updateHud(); renderMap(false); renderChat();
})();
