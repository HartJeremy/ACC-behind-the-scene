import { initialData } from './seed.js';
import { cloudConfig } from '../config.js';

const TABLES = { shots: 'shots', beats: 'story_beats', sessions: 'sessions', cards: 'actor_cards', footage: 'footage', comments: 'comments', links: 'board_links' };
const STORAGE_KEY = 'acc-behind-scenes-demo-v1';
const NAV = [
  ['today','Today','calendar'], ['shots','Shot list','list'], ['stories','Storylines','film'], ['board','Connections','network'],
  ['cards','Actor cards','user'], ['sessions','Schedule','clock'], ['footage','Footage log','video'], ['settings','Settings','settings']
];
const SVG = {
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4l4 16M13 4l4 16"/>',
  network:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="9" cy="19" r="2"/><path d="m7 6 10 1M6 7l2 10M18 9l-7 8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  video:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 4 4L19 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',back:'<path d="m15 18-6-6 6-6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  edit:'<path d="M12 20h9M16 4a2 2 0 0 1 3 3L9 17l-4 1 1-4L16 4Z"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  camera:'<path d="M5 6h4l2-2h4l2 2h2a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="3"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  link:'<path d="M10 14 14 10M8 10h-2a4 4 0 0 0 0 8h4a4 4 0 0 0 4-4M16 14h2a4 4 0 0 0 0-8h-4a4 4 0 0 0-4 4"/>',
  alert:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
  signout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  upload:'<path d="M12 21V9m-4 4 4-4 4 4M4 6V3h16v3"/>',
};
const I = (name,size=19) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]||SVG.more}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr = esc;
const clone = obj => JSON.parse(JSON.stringify(obj));
const textdate = value => !value ? 'Unscheduled' : new Date(value + 'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
const dateToday = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
const uid = pre => pre + '-' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
const app = document.getElementById('app');
const rootModal = document.getElementById('modal-root');
const ui = { nav:'today', more:false, cardSearch:'', cardStatus:'All', shotSearch:'', shotStatus:'All', shotCategory:'All', shotPriority:'All', selectedSession:'', selectedThread:'', boardFocus:(window.innerWidth<700?'story:Missing Turkey':'All'), boardShowCards:true, storyDetail:false, sessionDetail:false, authReady:false, connected:false, busy:false };
const cloudEnabled = Boolean(cloudConfig.url?.trim() && cloudConfig.publishableKey?.trim());
let supabase = null; let user = null; let data = clone(initialData); let subscription = null; let refreshTimer = null;

function toast(message,isError=false) {
  const t = document.getElementById('toast');
  t.textContent = message; t.className = `toast show ${isError?'error':''}`;
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>t.className='toast',3600);
}
function restoreDemo() {
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved && ['shots','beats','sessions','footage','comments'].every(k=>Array.isArray(saved[k]))) {
    data={...clone(initialData),...saved,cards:Array.isArray(saved.cards)?saved.cards:clone(initialData.cards),history:Array.isArray(saved.history)?saved.history:[],links:Array.isArray(saved.links)?saved.links:clone(initialData.links)};
    const oldJim=data.cards.find(c=>c.id==='AC-001'&&c.thread==='The Legend of Jim'&&(c.version||1)===1);
    if(oldJim) oldJim.thread='The Legend of Jim S';
  } }
  catch(e) { console.warn('Cannot load local demo',e); }
}
function saveDemo() { try {localStorage.setItem(STORAGE_KEY, JSON.stringify(data));} catch(e) {toast('Could not save to this device',true);} }
function find(table,id) {return data[table].find(r=>r.id===id);}
function nshots(status) {return data.shots.filter(s=>status.includes(s.status)).length;}
function progress(shots) { return shots.length ? Math.round(100*shots.filter(s=>['Captured','Usable'].includes(s.status)).length/shots.length) : 0; }
function parseIds(value) {
  const ids=[]; const str=String(value||'');
  for(const m of str.matchAll(/([A-Z]+)(\d{2,3})(?:-([A-Z]+)(\d{2,3}))?/g)){
    const [_,p,n,p2,n2]=m;
    if(p2 && p===p2 && Number(n2)-Number(n)<=25) for(let j=Number(n);j<=Number(n2);j++) ids.push(p+String(j).padStart(n.length,'0'));
    else ids.push(p+n);
  }
  return [...new Set(ids)];
}
function knownThreadList() {return [...new Set([...data.beats.map(b=>b.thread),...data.shots.map(s=>s.thread),...data.cards.map(c=>c.thread)].filter(t=>t && t!=='General'))].sort();}
function statusClass(status) {return /Usable|Complete|Ready|Captured/i.test(status)?'done':/reshoot|Blocked|Missing/i.test(status)?'warn':'neutral';}
function chip(label,type='neutral') {return `<span class="chip ${type}">${esc(label)}</span>`;}
function itemCountLabel() {return `${data.shots.length} shots · ${data.beats.length} story beats · ${data.sessions.length} sessions`;}
function coverLine(label,value) {return value ? `<div class="detail-line"><span>${esc(label)}</span><p>${esc(value)}</p></div>`:'';}
function formatNote(v) {return esc(v||'').replace(/\n/g,'<br>');}

async function init() {
  restoreDemo();
  if(!cloudEnabled){ui.authReady=true;ui.connected=false;render(); registerPwa();return;}
  try {
    const lib=await import('https://esm.sh/@supabase/supabase-js@2');
    supabase=lib.createClient(cloudConfig.url.trim(),cloudConfig.publishableKey.trim());
    const {data:authData,error}=await supabase.auth.getSession();
    if(error) throw error;
    user=authData.session?.user||null;
    supabase.auth.onAuthStateChange((_event,session)=>{
      const changed=user?.id!==session?.user?.id;
      user=session?.user||null;
      if(changed){ if(subscription){supabase.removeChannel(subscription);subscription=null;} if(user) loadCloud(true); else {ui.connected=false;render();} }
    });
    ui.authReady=true;
    if(user) await loadCloud(true); else render();
  } catch(e) {ui.authReady=true; ui.connected=false;render();toast('Cloud connection failed: '+e.message,true);}
  registerPwa();
}
function registerPwa() {if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('/sw.js').catch(console.warn);}
async function loadCloud(addListener=false) {
  if(!supabase||!user)return;
  try {
    const {data:membership,error:memberError}=await supabase.from('app_members').select('email,active').eq('email',user.email.toLowerCase()).maybeSingle();
    if(memberError)throw memberError;
    if(!membership?.active){ui.connected=false; render(); return;}
    const all=await Promise.all(Object.entries(TABLES).map(async ([k,db])=>{
      const {data:rows,error}=await supabase.from(db).select('*').limit(5000);
      if(error)throw error; return [k,rows||[]];
    }));
    data=Object.fromEntries(all);
    const {data:history,error:historyError}=await supabase.from('card_history').select('*').order('changed_at',{ascending:false}).limit(500);
    if(historyError)throw historyError;
    data.history=history||[];
    ui.connected=true;
    render();
    if(addListener && !subscription){
      subscription=supabase.channel('acc-planner').on('postgres_changes',{event:'*',schema:'public'},()=>{
        clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>loadCloud(false),450);
      }).subscribe();
    }
  } catch(e){ui.connected=false; render();toast('Cloud data error: '+e.message,true);}
}
async function persist(kind, record,original=null) {
  const table=TABLES[kind];
  if(!table)throw Error('Unknown record type');
  const payload={...record};
  delete payload.updated_at; delete payload.created_at;
  if(kind==='footage' && !payload.shot_id) payload.shot_id=null;
  if(!cloudEnabled){
    const at=data[kind].findIndex(r=>r.id===payload.id);
    if(kind==='cards'){data.history ||= []; data.history.unshift({id:uid('H'),card_id:payload.id,change_kind:at>=0?'Edited':'Created',editor:'Local demo',changed_at:new Date().toISOString(),before_state:at>=0?clone(data[kind][at]):null,after_state:clone(payload)});}
    if(at>=0) data[kind][at]={...data[kind][at],...payload,version:(data[kind][at].version||1)+1,updated_at:new Date().toISOString()};
    else data[kind].unshift({...payload,version:1,updated_at:new Date().toISOString()});
    saveDemo();render();return;
  }
  if(!user||!ui.connected) throw Error('Sign in and connect to save changes');
  let response;
  if(original){
    payload.version=(original.version||1)+1;
    response=await supabase.from(table).update(payload).eq('id',original.id).eq('version',original.version||1).select().maybeSingle();
    if(!response.error && !response.data){await loadCloud();throw Error('Someone edited this record first. Data refreshed; reopen and try again.');}
  } else response=await supabase.from(table).insert(payload).select().single();
  if(response.error)throw response.error;
  await loadCloud(false);
}
async function erase(kind,id) {
  if(!confirm('Delete this record? This cannot be undone.'))return;
  try{
    if(cloudEnabled){if(!user||!ui.connected)throw Error('Not connected');const {error}=await supabase.from(TABLES[kind]).delete().eq('id',id);if(error)throw error;await loadCloud();}
    else {if(kind==='cards'){data.history ||= [];data.history.unshift({id:uid('H'),card_id:id,change_kind:'Deleted',editor:'Local demo',changed_at:new Date().toISOString(),before_state:clone(find(kind,id)),after_state:null});}data[kind]=data[kind].filter(r=>r.id!==id);saveDemo();render();}
    closeModal();toast('Record deleted');
  }catch(e){toast(e.message,true);}
}
function sectionHeader(title,subtitle,action='') {return `<div class="section-head"><div><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${action}</div>`;}
function button(label, action, id='',extra='') {return `<button class="btn ${extra}" data-action="${action}" data-id="${attr(id)}">${label}</button>`;}
function pageTop(eyebrow,title,desc,action='') {return `<div class="page-top"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${action}</div>`;}
function shotCard(s,compact=false) {
  const captured=['Captured','Usable'].includes(s.status);
  return `<article class="shot-card ${captured?'shot-done':''}">
    <div class="shot-top"><div class="shot-id">${esc(s.id)}</div><div class="shot-tags">${chip(s.priority,s.priority==='Must'?'gold':'neutral')}${chip(s.status,statusClass(s.status))}</div></div>
    <button class="card-title-link" data-action="detail" data-kind="shots" data-id="${attr(s.id)}">${esc(s.title)} ${I('chevron',15)}</button>
    <p class="shot-tech">${I('camera',15)} ${esc(s.technique||'Documentary observation')}</p>
    ${compact?'':`<p class="shot-instruction">${esc(s.instructions)}</p>`}
    ${!compact&&s.thread!=='General'?`<p class="muted-sm">Story: ${esc(s.thread)}</p>`:''}
    <div class="card-actions">
      ${button(captured?I('check',15)+' Captured':I('check',15)+' Mark captured','capture',s.id,captured?'soft':'primary')}
      ${button('Log footage','log',s.id,'ghost')}
      ${button(I('edit',16),'edit',s.id,'icon-btn')}
    </div>
  </article>`;
}
function sessionForToday() {
  const list=[...data.sessions].sort((a,b)=>a.date.localeCompare(b.date));
  return list.find(s=>s.id===ui.selectedSession)||list.find(s=>s.date>=dateToday())||list.at(-1);
}
function renderToday() {
  const session=sessionForToday();
  if(!session)return `<div class="empty">No sessions yet. Add one from Schedule.</div>`;
  const mapped=parseIds(session.shot_ids).map(id=>find('shots',id)).filter(Boolean);
  const list=mapped.length?mapped:data.shots.filter(s=>s.priority==='Must').slice(0,7);
  const perc=progress(list);
  const future=[...data.sessions].sort((a,b)=>a.date.localeCompare(b.date));
  return `${pageTop('Your shooting desk','Today’s shoot','Pick a rehearsal, see the story goal, and capture only what matters.',button(I('plus',17)+' Add shot','new','shots','primary'))}
  <div class="stats">
    <div class="stat"><b>${data.shots.length}</b><span>Total shots</span></div>
    <div class="stat"><b>${nshots(['Captured','Usable'])}</b><span>Captured</span></div>
    <div class="stat"><b>${data.cards.length}</b><span>Actor cards</span></div>
  </div>
  <div class="session-hero">
    <div class="hero-head"><div><div class="eyebrow gold-text">SHOOTING WINDOW</div><h2>${esc(textdate(session.date))}</h2><p>${I('pin',16)} ${esc(session.venue)}</p></div>${chip(session.status,statusClass(session.status))}</div>
    <label class="screen-label" for="session-picker">Choose a rehearsal</label>
    <select id="session-picker" class="input">${future.map(s=>`<option value="${attr(s.id)}" ${s.id===session.id?'selected':''}>${esc(textdate(s.date))} — ${esc(s.venue)}</option>`).join('')}</select>
    <div class="hero-plan"><span>DIRECTOR'S GOAL</span><strong>${esc(session.goal)}</strong><p>${esc(session.capture)}</p></div>
    <div class="progress-label"><span>Selected shots captured</span><b>${perc}%</b></div><div class="progress"><span style="width:${perc}%"></span></div>
    <div class="notice">${I('alert',17)} ${esc(session.approach||'Do not interrupt active rehearsal.')}</div>
    ${session.pickup?`<div class="pickup"><b>Outside rehearsal:</b> ${esc(session.pickup)}</div>`:''}
    <div class="hero-actions">${button('Open session plan','detail-session',session.id,'subtle')}${button('All sessions','nav','sessions','ghost')}</div>
  </div>
  <div class="hero-actions">${button('Open actor cards','nav','cards','subtle')}</div>
  ${sectionHeader('Priority shots','From this session’s director plan',button('View all shots '+I('chevron',15),'nav','shots','text'))}
  <div class="shot-grid">${list.map(s=>shotCard(s,true)).join('')||'<p>No shot IDs on this session yet.</p>'}</div>
  <div class="footer-note">If a planned moment does not happen naturally, leave it for another rehearsal or schedule a separate pickup.</div>`;
}
function renderShots() {
  const list=data.shots.filter(s=>
    (ui.shotStatus==='All'||s.status===ui.shotStatus)&&
    (ui.shotCategory==='All'||s.category===ui.shotCategory)&&
    (ui.shotPriority==='All'||s.priority===ui.shotPriority)&&
    [s.id,s.title,s.technique,s.instructions,s.thread,s.opportunity].join(' ').toLowerCase().includes(ui.shotSearch.toLowerCase())
  ).sort((a,b)=>(a.priority==='Must'?0:1)-(b.priority==='Must'?0:1) || a.id.localeCompare(b.id));
  const options=(values,selected)=>values.map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('');
  return `${pageTop('Production library','Shot list',`${data.shots.length} shots with filming instructions, story connections and review status.`,button(I('plus',17)+' New shot','new','shots','primary'))}
  <div class="filter-box">
    <label class="search-wrap">${I('search',18)}<input id="shot-search" placeholder="Search shots, characters or techniques" value="${attr(ui.shotSearch)}" /></label>
    <div class="filter-row">
      <select id="shot-status" class="input" aria-label="Filter by status">${options(['All','Not shot','Planned','Captured','Usable','Needs reshoot'],ui.shotStatus)}</select>
      <select id="shot-priority" class="input" aria-label="Filter by priority">${options(['All','Must','Useful','Optional'],ui.shotPriority)}</select>
      <select id="shot-category" class="input" aria-label="Filter by category">${options(['All',...[...new Set(data.shots.map(s=>s.category))].sort()],ui.shotCategory)}</select>
    </div>
  </div>
  <div class="list-summary">Showing ${list.length} shots</div>
  <div class="shot-grid">${list.map(s=>shotCard(s)).join('')||'<div class="empty">No matching shots. Adjust the filters or add a shot.</div>'}</div>`;
}
// A derived evidence wall: storylines and actor cards are live records, NOT duplicate board entities.
// Only optional editorial connections are persisted as board_links.
function boardStoryKey(thread) {return 'story:'+thread;}
function boardCardKey(id) {return 'card:'+id;}
function boardNodes() {
  return [
    ...knownThreadList().map(name=>({key:boardStoryKey(name),kind:'story',title:name,sub:`${data.beats.filter(b=>b.thread===name).length} story beats`})),
    ...data.cards.map(c=>({key:boardCardKey(c.id),kind:'card',title:c.actor_name||'Unnamed performer',sub:c.scene_title||'Actor card',thread:c.thread,recordId:c.id}))
  ];
}
function boardGraph() {
  const all=boardNodes();const available=new Set(all.map(n=>n.key));
  const auto=data.cards.filter(c=>available.has(boardStoryKey(c.thread))).map(c=>({id:'auto:'+c.id,source_key:boardStoryKey(c.thread),target_key:boardCardKey(c.id),relation:'Actor card',status:'Confirmed',automatic:true}));
  const manual=data.links.filter(l=>available.has(l.source_key)&&available.has(l.target_key)&&l.source_key!==l.target_key&&l.status!=='Cut').map(l=>({...l,automatic:false}));
  const links=[...auto,...manual];
  const focus=ui.boardFocus==='All'||!available.has(ui.boardFocus)?'All':ui.boardFocus;
  let visible=new Set(all.map(n=>n.key));
  if(focus!=='All'){
    visible=new Set([focus]);for(const l of links){if(l.source_key===focus)visible.add(l.target_key);if(l.target_key===focus)visible.add(l.source_key);}
  }
  const nodes=all.filter(n=>visible.has(n.key)&&(ui.boardShowCards||n.kind==='story'));
  const show=new Set(nodes.map(n=>n.key));
  return {all,nodes,links:links.filter(l=>show.has(l.source_key)&&show.has(l.target_key)),focus};
}
function boardPositioning(nodes) {
  const stories=nodes.filter(n=>n.kind==='story');const cards=nodes.filter(n=>n.kind==='card');
  const pos=new Map();
  if(window.innerWidth<700){
    // Phone: the evidence wall becomes a single, readable vertical column.
    // The focus selector keeps the default case to a manageable few pins.
    const ordered=[...stories,...cards];
    ordered.forEach((node,i)=>pos.set(node.key,{x:74,y:42+i*137}));
    return {pos,height:Math.max(340,ordered.length*137+80),width:330};
  }
  const rows=Math.max(3,Math.ceil(stories.length/2),cards.length);
  const height=Math.max(520,rows*142+110);
  stories.forEach((node,i)=>pos.set(node.key,{x:i%2===0?24:290,y:65+Math.floor(i/2)*142}));
  cards.forEach((node,i)=>pos.set(node.key,{x:566,y:65+i*142}));
  return {pos,height,width:790};
}
function renderBoard() {
  const graph=boardGraph(), layout=boardPositioning(graph.nodes), linked=new Set(graph.links.flatMap(l=>[l.source_key,l.target_key]));
  const selector=[{key:'All',title:'All storylines'},...graph.all.filter(n=>n.kind==='story')].map(n=>`<option value="${attr(n.key)}" ${ui.boardFocus===n.key?'selected':''}>${esc(n.title)}</option>`).join('');
  const pos=layout.pos;
  const paths=graph.links.map((l,i)=>{
    const a=pos.get(l.source_key),b=pos.get(l.target_key);if(!a||!b)return '';
    const ax=a.x+88,ay=a.y+48,bx=b.x+88,by=b.y+48;
    const mx=(ax+bx)/2+(window.innerWidth<700?(i%2?75:-75):0);const wiggle=18*(i%2?1:-1);
    return `<path d="M${ax} ${ay} Q${mx} ${(ay+by)/2+wiggle} ${bx} ${by}" class="string-path ${l.automatic?'auto':l.status==='Idea'?'idea':'confirmed'}" />`;
  }).join('');
  const pins=graph.nodes.map((n,i)=>{
    const xy=pos.get(n.key);if(!xy)return '';
    return `<button type="button" class="evidence-card ${n.kind} ${linked.has(n.key)?'linked':''}" style="left:${xy.x}px;top:${xy.y}px;--turn:${(i%5-2)*0.7}deg" data-action="board-node" data-id="${attr(n.key)}" aria-label="Open ${attr(n.kind)}: ${attr(n.title)}"><span class="paper-pin"></span><span class="evidence-kicker">${n.kind==='story'?'STORY FILE':'ACTOR CARD'}</span><strong>${esc(n.title)}</strong><small>${esc(n.sub)}</small></button>`;
  }).join('');
  const allManual=[...data.links].sort((a,b)=>a.status.localeCompare(b.status)||a.relation.localeCompare(b.relation));
  const byKey=new Map(graph.all.map(n=>[n.key,n.title]));
  const list=allManual.map(l=>`<div class="connection-item"><div><strong>${esc(byKey.get(l.source_key)||'Missing: '+l.source_key)} <span class="gold-text">↔</span> ${esc(byKey.get(l.target_key)||'Missing: '+l.target_key)}</strong><div class="muted-sm">${esc(l.relation||'Connection')} · ${esc(l.status||'Idea')}${!byKey.has(l.source_key)||!byKey.has(l.target_key)?' · Needs reconnection':''}</div>${l.description?`<p>${esc(l.description)}</p>`:''}</div><div class="card-actions">${button(I('edit',16)+' Edit','board-edit',l.id,'subtle')}${button(I('close',15),'board-delete',l.id,'ghost')}</div></div>`).join('');
  return `${pageTop('Story development','Connections board','A detective-style wall for the mockumentary. Cards and story names come directly from the live records; add only the connections you want.',button(I('plus',17)+' Add connection','board-new','','primary'))}
  <div class="board-toolbox"><label class="field"><span>Focus the board</span><select class="input" id="board-focus">${selector}</select></label><label class="board-check"><input type="checkbox" id="board-show-cards" ${ui.boardShowCards?'checked':''}/> Include actor cards</label><div class="board-key"><span class="legend-string confirmed"></span> Connection <span class="legend-string idea"></span> Idea <span class="legend-string auto"></span> Actor card</div></div>
  <div class="board-scroller" role="region" aria-label="Scrollable connections board" tabindex="0"><div class="board-surface" style="width:${layout.width}px;height:${layout.height}px"><svg class="board-wires" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true">${paths}</svg>${pins||'<div class="board-blank">No stories or actor cards yet. Add one to begin.</div>'}</div></div>
  <div class="board-hint">Tap a pinned card to open its source record. Red strings represent editable story connections. Dotted strings show automatic actor-card associations. Scroll sideways on a phone.</div>
  ${sectionHeader('Connections & theories',`${allManual.length} editable connections`,button(I('plus',17)+' New link','board-new','','subtle'))}
  <div class="connection-list">${list||'<div class="empty">No deliberate connections yet. Link two storylines to create a callback, crossover, or red herring.</div>'}</div>
  <div class="note-panel">${I('alert',18)} Connections labeled “Idea” are proposed story devices, not established events. Changing an actor card immediately updates its position and associations here. Use “Rename storyline” on a story pin to change that name throughout the filming records.</div>`;
}
function openBoardLinkEditor(id=null) {
  const current=id?find('links',id):null;
  const nodes=boardNodes();
  const options=value=>`<option value="">Select a card or storyline</option>`+nodes.map(n=>`<option value="${attr(n.key)}" ${n.key===value?'selected':''}>${n.kind==='story'?'Story: ':'Actor: '}${esc(n.title)}${n.kind==='card'?' · '+esc(n.sub):''}</option>`).join('');
  rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="Connection editor"><div class="modal-head"><div><div class="eyebrow">CONNECTIONS BOARD</div><h2>${current?'Edit connection':'Add a connection'}</h2></div>${button(I('close',18),'close-modal','','icon-btn')}</div><form id="board-link-form" data-id="${attr(id||'')}"><div class="editor-grid"><label class="field wide"><span>From</span><select class="input" name="source_key" required>${options(current?.source_key)}</select></label><label class="field wide"><span>To</span><select class="input" name="target_key" required>${options(current?.target_key)}</select></label><label class="field"><span>Relationship</span><select class="input" name="relation">${['Callback','Cross-over','Red herring','Shared character','Clue','Other'].map(x=>`<option ${x===(current?.relation||'Callback')?'selected':''}>${x}</option>`).join('')}</select></label><label class="field"><span>Development status</span><select class="input" name="status">${['Idea','Confirmed','Cut'].map(x=>`<option ${x===(current?.status||'Idea')?'selected':''}>${x}</option>`).join('')}</select></label><label class="field wide"><span>Why they connect / how the callback works</span><textarea class="input" name="description" rows="3" placeholder="For example: The missing turkey becomes part of the ghost rumor.">${esc(current?.description||'')}</textarea></label></div><div class="modal-actions">${current?button('Delete','board-delete',id,'danger'):''}<button type="submit" class="btn primary">Save connection</button></div></form></section>`;
}
function openBoardStoryTools(name) {
 rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="Storyline actions"><div class="modal-head"><div><div class="eyebrow">STORY FILE</div><h2>${esc(name)}</h2></div>${button(I('close',18),'close-modal','','icon-btn')}</div><div class="modal-button-row">${button('Open storyline','board-story-go',name,'primary')}${button('Rename storyline','board-story-rename',name,'subtle')}</div><p class="muted-sm">Changing the title here also updates linked actor cards, shots, story beats and board connections.</p></section>`;
}
function openBoardStoryRename(oldName) {
  rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="Rename storyline"><div class="modal-head"><div><div class="eyebrow">UPDATE ALL REFERENCES</div><h2>Rename storyline</h2></div>${button(I('close',18),'close-modal','','icon-btn')}</div><form id="rename-story-form" data-old="${attr(oldName)}"><div class="editor-grid"><label class="field wide"><span>Current name</span><input class="input" value="${attr(oldName)}" disabled /></label><label class="field wide"><span>New name</span><input class="input" name="new_name" value="${attr(oldName)}" maxlength="160" required /></label></div><div class="notice">Updates story beats, shot assignments, actor cards and the connection strings together. Changes appear on the shared board.</div><div class="modal-actions"><button class="btn primary" type="submit">Rename everywhere</button></div></form></section>`;
}
async function renameStoryline(oldName,newName) {
  newName=String(newName||'').trim();if(!newName||newName==='General')throw Error('Choose a valid storyline name.');
  if(oldName===newName)return;
  if(knownThreadList().includes(newName))throw Error('That storyline already exists. Choose another name.');
  if(cloudEnabled){
    if(!user||!ui.connected)throw Error('Not connected');
    const {error}=await supabase.rpc('acc_rename_storyline',{old_name:oldName,new_name:newName});
    if(error)throw error;await loadCloud(false);
  }else{
    let total=0;
    for(const key of ['shots','beats','cards'])for(const record of data[key])if(record.thread===oldName){record.thread=newName;record.version=(record.version||1)+1;total++;}
    if(!total)throw Error('That storyline is not available anymore.');
    for(const l of data.links){if(l.source_key===boardStoryKey(oldName))l.source_key=boardStoryKey(newName);if(l.target_key===boardStoryKey(oldName))l.target_key=boardStoryKey(newName);}
    saveDemo();
  }
  if(ui.boardFocus===boardStoryKey(oldName))ui.boardFocus=boardStoryKey(newName);
  if(ui.selectedThread===oldName)ui.selectedThread=newName;
  render();
}
function renderStories() {
  const threads=knownThreadList();
  const current=threads.includes(ui.selectedThread)?ui.selectedThread:threads[0]; ui.selectedThread=current;
  const bs=data.beats.filter(b=>b.thread===current);
  const complete=bs.filter(b=>/Captured|Ready|Complete/i.test(b.status)).length;
  const storyList=`<div class="thread-list">${threads.map(thread=>{
    const b=data.beats.filter(x=>x.thread===thread);const n=b.filter(x=>/Captured|Ready|Complete/i.test(x.status)).length;
    return `<button class="thread-row ${thread===current?'active':''}" data-action="thread" data-id="${attr(thread)}"><div><strong>${esc(thread)}</strong><span>${n} of ${b.length} beats covered</span></div>${I('chevron',17)}</button>`;
  }).join('')}</div>`;
  const detail=`<div class="story-detail">
    <div class="detail-panel-head"><div><div class="eyebrow">STORY THREAD</div><h2>${esc(current||'No story')}</h2><p>${complete} / ${bs.length} beats covered</p></div><div class="card-actions">${button('Actor card','new-card-thread',current,'ghost')}${button(I('plus',16)+' Add beat','new-beat',current,'subtle')}</div></div>
    <div class="progress"><span style="width:${bs.length?Math.round(complete*100/bs.length):0}%"></span></div>
    ${bs.map((b,i)=>`<article class="beat-card"><div class="beat-head"><div class="beat-no">${String(i+1).padStart(2,'0')}</div><div class="beat-copy"><strong>${esc(b.beat)}</strong><div>${chip(b.status,statusClass(b.status))} ${chip(b.priority,b.priority==='Must'?'gold':'neutral')}</div></div>${button(I('edit',17),'edit-beat',b.id,'icon-btn')}</div><p>${esc(b.evidence)}</p>${coverLine('When',b.opportunity)}${coverLine('Related shots',b.shot_ids)}<div class="beat-action">${button('Mark covered','cover-beat',b.id,'ghost')}${button('Notes','detail-beat',b.id,'ghost')}</div></article>`).join('')||'<div class="empty">No beats yet. Add one to develop this storyline.</div>'}
  </div>`;
  return `${pageTop('Narrative coverage','Storylines','Track the setup, evidence, escalation and payoff—not just the footage.',button(I('plus',17)+' New beat','new','beats','primary'))}
    <div class="stories-layout"><div class="story-list-area ${ui.storyDetail?'mobile-hide':''}">${sectionHeader('All storylines','Choose a thread')}${storyList}</div>
    <div class="story-detail-area ${ui.storyDetail?'mobile-show':''}"><div class="mobile-only">${button(I('back',17)+' All storylines','stories-back','','ghost')}</div>${detail}</div></div>`;
}
function renderCards() {
  const cards=[...data.cards].filter(c =>
    (ui.cardStatus==='All'||c.status===ui.cardStatus)&&
    [c.actor_name,c.scene_title,c.thread,c.actor_brief,c.questions].join(' ').toLowerCase().includes(ui.cardSearch.toLowerCase())
  ).sort((a,b)=>a.actor_name.localeCompare(b.actor_name)||a.scene_title.localeCompare(b.scene_title));
  return `${pageTop('Interview & scene prompts','Actor cards','Shared editable briefs for Jeremy, Courtney and Alex. Use between rehearsals, not during active scenes.',button(I('plus',17)+' Add actor card','new','cards','primary'))}
    <div class="filter-box"><label class="search-wrap">${I('search',18)}<input id="card-search" placeholder="Search actor, scene or storyline" value="${attr(ui.cardSearch)}" /></label>
      <div class="filter-row"><select class="input" id="card-status" aria-label="Filter actor cards"><option>All</option>${['Idea','Ready','Scheduled','Filmed','Reviewed'].map(x=>`<option ${ui.cardStatus===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="list-summary">Showing ${cards.length} of ${data.cards.length} cards · Any approved editor can add or adjust questions.</div>
    <div class="shot-grid">${cards.map(c=>`<article class="shot-card"><div class="shot-top"><span class="shot-id">${esc(c.actor_name||'Unassigned')}</span>${chip(c.status,statusClass(c.status))}</div>
      <button class="card-title-link" data-action="detail" data-kind="cards" data-id="${attr(c.id)}">${esc(c.scene_title)} ${I('chevron',15)}</button>
      <p class="shot-tech">${I('film',15)} ${esc(c.thread||'General')}</p><p class="shot-instruction">${esc(c.actor_brief||'Add the scene context for this performer.')}</p>
      <div class="muted-sm">${c.questions?esc(c.questions.split('\n').filter(Boolean).length)+' interview questions':''}${c.session_date?' · '+esc(textdate(c.session_date)):''}</div>
      <div class="card-actions">${button('Actor brief','actor-brief',c.id,'primary')}${button(I('edit',16)+' Edit','edit-cards',c.id,'subtle')}<button class="btn ghost" data-action="detail" data-kind="cards" data-id="${attr(c.id)}">Notes &amp; history</button></div>
    </article>`).join('')||'<div class="empty">No actor cards yet. Add a scene and questions for someone to film.</div>'}</div>`;
}
function actorBriefText(c) {
  return `ACC · BEHIND THE SCENES\n${c.scene_title}\nFor: ${c.actor_name}\n\nTHE SCENE\n${c.actor_brief}\n\nWHAT TO DO\n${c.actor_direction||'Answer naturally. No scripted lines required.'}\n${c.optional_action?'\nOPTIONAL MOMENT\n'+c.optional_action:''}\n\nINTERVIEW QUESTIONS\n${c.questions||'Questions to be selected during filming.'}\n\nPlan this for a break or separate pickup; do not interrupt rehearsal.`;
}
function openActorBrief(id) {
  const c=find('cards',id);if(!c)return;
  rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="Shareable actor brief"><div class="modal-head"><div><div class="eyebrow">ACTOR VIEW · SHAREABLE</div><h2>${esc(c.scene_title)}</h2><p class="muted-sm">${esc(c.actor_name)}</p></div>${button(I('close',19),'close-modal','','icon-btn')}</div><div class="modal-scroll"><div class="notice">The actor brief does not include director-only notes or the intended punchline.</div>
    ${coverLine('The scene',c.actor_brief)}${coverLine('What we need you to do',c.actor_direction)}${coverLine('Optional moment',c.optional_action)}${coverLine('Possible interview questions',c.questions)}
    <div class="modal-button-row">${button(I('copy',16)+' Copy actor brief','copy-brief',id,'primary')}${button('Edit card','edit-cards',id,'subtle')}</div></div></section>`;
}
function renderSessions() {
  const sessions=[...data.sessions].sort((a,b)=>a.date.localeCompare(b.date));
  const current=sessions.find(s=>s.id===ui.selectedSession)||sessionForToday();
  if(current)ui.selectedSession=current.id;
  const list=`<div class="thread-list">${sessions.map(s=>`<button class="thread-row ${current?.id===s.id?'active':''}" data-action="session" data-id="${attr(s.id)}"><div><strong>${esc(textdate(s.date))}</strong><span>${esc(s.venue)}</span></div>${I('chevron',17)}</button>`).join('')}</div>`;
  const detail=current?`<div class="story-detail"><div class="detail-panel-head"><div><div class="eyebrow">REHEARSAL / PICKUP</div><h2>${esc(textdate(current.date))}</h2><p>${I('pin',16)} ${esc(current.venue)}</p></div>${button(I('edit',17)+' Edit','edit-session',current.id,'subtle')}</div>
    <div class="detail-card">${coverLine('Narrative goal',current.goal)}${coverLine('Must capture',current.capture)}${coverLine('Shot IDs',current.shot_ids)}${coverLine('No-interruption approach',current.approach)}${coverLine('Outside rehearsal',current.pickup)}${coverLine('Notes',current.notes)}<div class="space-top">${chip(current.status,statusClass(current.status))}</div></div>
    ${sectionHeader('Related shots','Based on the director plan')}
    <div class="shot-grid small-grid">${parseIds(current.shot_ids).map(id=>find('shots',id)).filter(Boolean).map(s=>shotCard(s,true)).join('')||'<div class="empty">No related master shot IDs entered.</div>'}</div>
   </div>`:'<div class="empty">No sessions yet.</div>';
  return `${pageTop('Filming schedule','Rehearsals & pickups','Plan around rehearsals. Record pickups separately without interrupting the cast.',button(I('plus',17)+' Add session','new','sessions','primary'))}
    <div class="stories-layout"><div class="story-list-area ${ui.sessionDetail?'mobile-hide':''}">${sectionHeader('Planned sessions',`${sessions.length} sessions`)}${list}</div>
    <div class="story-detail-area ${ui.sessionDetail?'mobile-show':''}"><div class="mobile-only">${button(I('back',17)+' All sessions','sessions-back','','ghost')}</div>${detail}</div></div>`;
}
function renderFootage() {
  const f=[...data.footage].sort((a,b)=>(b.taken_on||'').localeCompare(a.taken_on||''));
  return `${pageTop('Edit-ready references','Footage log','Record each usable take, original filename, camera and where it was saved.',button(I('plus',17)+' Log footage','new','footage','primary'))}
    <div class="note-panel">${I('folder',18)} Store original videos in your private shared Drive folder; paste the filename or access-controlled link here. This app stores references, not video uploads.</div>
    <div class="footage-grid">${f.map(x=>`<article class="footage-card"><div class="shot-top">${chip(x.review_status,statusClass(x.review_status))}<small>${esc(textdate(x.taken_on))}</small></div><h3>${esc(x.title)}</h3><p>${esc(x.camera||'Camera not recorded')}${x.shot_id?' · '+esc(x.shot_id):''}</p><div class="filename">${I('folder',16)} ${esc(x.file_ref||'No filename yet')}</div><p class="footage-notes">${esc(x.notes)}</p><div class="card-actions">${button('Details','detail-footage',x.id,'ghost')}${button(I('edit',17)+' Edit','edit-footage',x.id,'subtle')}${validWebLink(x.file_ref)?`<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="${attr(x.file_ref)}">${I('link',15)} Open</a>`:''}</div></article>`).join('')||'<div class="empty">No footage logged yet. Use “Log footage” from a shot or add a new record here.</div>'}</div>`;
}
function validWebLink(x) {try {return ['https:','http:'].includes(new URL(x).protocol);}catch{return false;}}
function renderSettings() {
  return `${pageTop('Team tools','Settings','Shared access, backups and filming defaults.')}
    <div class="settings-grid">
      <section class="settings-card"><h3>${I('camera',19)} Camera standard</h3><p><b>Primary:</b> Courtney · Galaxy S24<br><b>B-roll:</b> Jeremy · iPhone 16 Pro Max</p><p>Match existing Galaxy footage where practical. For new shoots, use horizontal 4K / 30 fps, SDR, and a 1× lens.</p></section>
      <section class="settings-card"><h3>${I('settings',19)} Current mode</h3><p><b>${cloudEnabled?'Cloud configuration present':'Local demo mode'}</b></p><p>${cloudEnabled?(ui.connected?'Shared database connected for '+esc(user?.email):'Not connected. Sign in with an approved team account.'):'Changes save only in this browser. To sync with Courtney and Alex, connect a Supabase project using config.js and the SQL scripts.'}</p>${cloudEnabled&&user?button('Sign out','signout','','subtle'):''}</section>
      <section class="settings-card"><h3>${I('download',19)} Back up all records</h3><p>Export shots, story beats, actor cards, board connections, rehearsal sessions, footage references and comments as a JSON backup.</p>${button(I('download',17)+' Export JSON','export','','primary')}</section>
      <section class="settings-card"><h3>${I('upload',19)} Restore local demo</h3><p>Import a saved JSON backup into this browser. Only available in local demo mode, and replaces local data.</p>${!cloudEnabled?`<label class="btn subtle upload-label">Choose JSON file<input id="import-file" type="file" accept=".json,application/json" hidden /></label>`:'<p class="muted-sm">Cloud records are seeded with the database setup scripts. Do not replace a live shared database with an unreviewed backup.</p>'}</section>
      <section class="settings-card"><h3>${I('list',19)} Original director plan</h3><p>Imported from the ACC director workbook: ${itemCountLabel()}.</p><p>Source instructions, story threads and filming opportunities remain editable.</p></section>
      <section class="settings-card"><h3>${I('alert',19)} Rehearsal rules</h3><p>No interruptions, staged retakes or blocking of active paths. Adult-focused coverage unless permission for minors is confirmed. Approve any separate pickups with rehearsal leadership.</p></section>
    </div>`;
}
function pageBody(){switch(ui.nav){case'today':return renderToday();case'shots':return renderShots();case'stories':return renderStories();case'board':return renderBoard();case'cards':return renderCards();case'sessions':return renderSessions();case'footage':return renderFootage();default:return renderSettings();}}
function navButton([id,label,ic],mobile=false){return `<button class="${mobile?'bottom-link':'nav-link'} ${ui.nav===id?'active':''}" data-action="nav" data-id="${id}" aria-label="${label}">${I(ic,mobile?21:18)}<span>${esc(label)}</span></button>`;}
function render(){
  if(!ui.authReady){app.innerHTML='<div class="splash">Connecting to project…</div>';return;}
  if(cloudEnabled && (!user||!ui.connected)){
    app.innerHTML=`<main class="login-shell"><div class="login-card"><div class="brand-mark">${I('video',27)}</div><div class="eyebrow">ACC PRODUCTION</div><h1>Behind the Scenes</h1><p>Your shared filming desk. Sign in with your approved team email.</p>${!user?`<form id="login-form"><label>Email address<input name="email" type="email" class="input" placeholder="you@example.com" required /></label><button class="btn primary full" type="submit">Send sign-in link</button></form>`:`<div class="notice">This account is not in the approved team list or the database is unavailable. Contact the project administrator.</div>${button('Sign out','signout','','subtle')}`}<p class="tiny">Private project · Members only</p></div></main>`;
    return;
  }
  const current=ui.nav; const title=NAV.find(x=>x[0]===current)?.[1]||'Today';
  app.innerHTML=`<div class="shell">
    <aside class="sidebar"><div class="brand"><div class="brand-symbol">${I('video',23)}</div><div><strong>ACC</strong><span>BEHIND THE SCENES</span></div></div><div class="sidebar-caption">PRODUCTION</div><nav>${NAV.map(x=>navButton(x)).join('')}</nav><div class="side-bottom"><div class="side-note">${I('camera',18)} <span>Keep rehearsals uninterrupted.</span></div><div class="connection ${cloudEnabled?'cloud':'demo'}"><span class="dot"></span>${cloudEnabled?'Live shared database':'Local demo · this device only'}</div></div></aside>
    <div class="workspace"><header class="topbar"><div class="top-title"><div class="small-logo">${I('video',20)}</div><div><strong>ACC <span>· Behind the Scenes</span></strong><small>${esc(title)}</small></div></div><div class="top-actions"><div class="top-mode">${cloudEnabled?'● Shared':'● Local demo'}</div>${button(I('plus',18)+' Add shot','new','shots','top-add')}</div></header>
    ${!cloudEnabled?`<div class="demo-strip">Local demo: changes stay on this device. Connect Supabase before relying on shared updates with Courtney and Alex. ${button('Setup','nav','settings','text')}</div>`:''}
    <main class="content">${pageBody()}</main></div>
    <nav class="bottom-nav" aria-label="Mobile navigation">${[NAV[0],NAV[1],NAV[3]].map(x=>navButton(x,true)).join('')}<button class="bottom-link ${!['today','shots','cards'].includes(ui.nav)?'active':''}" data-action="more">${I('more',21)}<span>More</span></button></nav>
    ${ui.more?`<div class="more-scrim" data-action="close-more"></div><div class="more-menu"><div class="more-head"><b>All sections</b>${button(I('close',19),'close-more','','icon-btn')}</div>${NAV.map(x=>navButton(x)).join('')}</div>`:''}
  </div>`;
}

// Field definitions are also used for editing existing records: every setting is reachable on mobile.
const FIELDS={
  shots:[['title','Shot / subject','text',true],['status','Status','select',false,['Not shot','Planned','Captured','Usable','Needs reshoot']],['priority','Priority','select',false,['Must','Useful','Optional']],['category','Category','text'],['technique','Camera technique','text'],['instructions','How to capture','textarea'],['purpose','Editing purpose','textarea'],['opportunity','Best opportunity','text'],['people','People / restrictions','text'],['thread','Story thread','text'],['captured_at','Capture date','date'],['camera','Camera / operator','text'],['file_ref','Original file / folder','text'],['notes','Production notes','textarea'],['review_notes','Review / pickup notes','textarea']],
  beats:[['thread','Storyline','text',true],['beat','Story beat','text',true],['evidence','What audience should see','textarea'],['status','Status','select',false,['Not planned','Planned','In progress','Captured','Ready','Blocked']],['priority','Priority','select',false,['Must','Useful','Optional']],['opportunity','Best opportunity','text'],['shot_ids','Related shot IDs','text'],['approach','Film without disruption','textarea'],['notes','Notes / clip references','textarea']],
  cards:[['actor_name','Actor / crew member','text',true],['scene_title','Scene / card title','text',true],['thread','Storyline','text',true],['status','Status','select',false,['Idea','Ready','Scheduled','Filmed','Reviewed']],['session_date','Possible filming date','date'],['actor_brief','Scene setup (visible to actor)','textarea'],['actor_direction','What we need them to do (visible to actor)','textarea'],['questions','Possible questions — one per line (visible to actor)','textarea'],['optional_action','Optional filmed moment (visible to actor)','textarea'],['director_goal','Director goal / comedy beat (internal)','textarea'],['director_notes','Director notes / hidden payoff (internal)','textarea'],['shot_ids','Related shot IDs','text']],
  sessions:[['date','Session date','date',true],['venue','Venue / time','text'],['goal','Narrative goal','text'],['capture','Must capture','textarea'],['shot_ids','Related shot IDs','text'],['approach','No-interruption approach','textarea'],['pickup','Outside rehearsal pickup','textarea'],['status','Status','select',false,['Not planned','Planned','In progress','Completed','Cancelled']],['notes','Notes','textarea']],
  footage:[['title','Take description','text',true],['shot_id','Linked shot ID','text'],['taken_on','Date recorded','date'],['camera','Camera / operator','text'],['file_ref','Video filename or private Drive link','text'],['review_status','Review status','select',false,['Needs review','Usable','Select','Needs reshoot','Rejected']],['notes','Edit notes / timecode','textarea']]
};
function formField(field,value=''){
  const [key,label,type,required,opts]=field;
  const val=value??'';
  if(type==='select'){const choices=[...new Set([...(opts||[]),...(val&&!(opts||[]).includes(val)?[val]:[])])];return `<label class="field"><span>${esc(label)}</span><select class="input" name="${key}">${choices.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;}
  if(type==='textarea')return `<label class="field wide"><span>${esc(label)}</span><textarea class="input" rows="3" name="${key}">${esc(val)}</textarea></label>`;
  return `<label class="field"><span>${esc(label)}</span><input class="input" type="${type}" name="${key}" ${required?'required':''} value="${attr(val)}" /></label>`;
}
function openEditor(kind,id=null,defaults={}) {
  const current=id?find(kind,id):null;
  const r=current||defaults;
  const title= current?'Edit '+({shots:'shot',beats:'story beat',sessions:'session',cards:'actor card',footage:'footage'}[kind]):'New '+({shots:'shot',beats:'story beat',sessions:'session',cards:'actor card',footage:'footage'}[kind]);
  rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-head"><div><div class="eyebrow">ACC PRODUCTION</div><h2>${title}</h2></div>${button(I('close',19),'close-modal','','icon-btn')}</div><form id="editor-form" data-kind="${kind}" data-id="${attr(id||'')}"><div class="editor-grid">${FIELDS[kind].map(f=>formField(f,r[f[0]])).join('')}</div><div class="modal-actions">${current?button('Delete','delete-'+kind,id,'danger'):''}<button class="btn primary" type="submit">Save changes</button></div></form></section>`;
  document.querySelector('.modal .input')?.focus();
}
function closeModal(){rootModal.innerHTML='';}
function openDetail(kind,id) {
  const r=find(kind,id); if(!r)return;
  const comments=data.comments.filter(c=>c.target_type===TABLES[kind]&&c.target_id===id).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));
  const labels= kind==='shots'? [['Technique',r.technique],['How to film',r.instructions],['Editing purpose',r.purpose],['When',r.opportunity],['Storyline',r.thread],['People / restrictions',r.people],['Camera',r.camera],['Original clip',r.file_ref],['Production notes',r.notes],['Review notes',r.review_notes],['Last edited by',r.updated_by]] :
     kind==='beats'? [['What audience sees',r.evidence],['When',r.opportunity],['Related shots',r.shot_ids],['Without interruption',r.approach],['Notes',r.notes],['Last edited by',r.updated_by]] :
     kind==='cards'? [['Scene setup',r.actor_brief],['Actor directions',r.actor_direction],['Questions',r.questions],['Optional filmed moment',r.optional_action],['Filming date',r.session_date],['Related shots',r.shot_ids],['Director goal — internal',r.director_goal],['Director notes — internal',r.director_notes],['Last edited by',r.updated_by]] :
     kind==='sessions'? [['Director goal',r.goal],['Must capture',r.capture],['Shot IDs',r.shot_ids],['Without interruption',r.approach],['Separate pickup',r.pickup],['Notes',r.notes],['Last edited by',r.updated_by]] :
     [['Shot ID',r.shot_id],['Camera',r.camera],['Date',r.taken_on],['File / link',r.file_ref],['Review notes',r.notes],['Last edited by',r.updated_by]];
  const head=kind==='shots'?r.title:kind==='beats'?r.thread+' · '+r.beat:kind==='sessions'?textdate(r.date):kind==='cards'?r.actor_name+' · '+r.scene_title:r.title;
  rootModal.innerHTML=`<div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-label="Details"><div class="modal-head"><div><div class="eyebrow">${esc(r.id)}</div><h2>${esc(head)}</h2></div>${button(I('close',19),'close-modal','','icon-btn')}</div><div class="modal-scroll">
    <div class="detail-meta">${chip(r.status||r.review_status||'Needs review',statusClass(r.status||r.review_status||''))}${r.priority?chip(r.priority,r.priority==='Must'?'gold':'neutral'):''}</div>
    ${labels.map(([l,v])=>coverLine(l,v)).join('')}
    <div class="modal-button-row">${button(I('edit',17)+' Edit details','edit-'+kind,r.id,'subtle')}${kind==='shots'?button(I('camera',17)+' Log take','log',r.id,'primary'):''}${kind==='cards'?button('Actor brief','actor-brief',r.id,'primary'):''}</div>${kind==='cards'?`<div class="comment-section"><h3>Change history</h3>${(data.history||[]).filter(h=>h.card_id===r.id).slice(0,8).map(h=>`<p class="muted-sm">${esc(h.change_kind||'Edited')} · ${esc(h.editor||'Team member')} · ${esc(new Date(h.changed_at).toLocaleString())}</p>`).join('')||'<p class="muted-sm">No changes logged yet.</p>'}</div>`:''}
    <div class="comment-section"><h3>Team notes</h3><div class="comments">${comments.map(c=>`<div class="comment"><b>${esc(c.author_email||'Team member')}</b><p>${formatNote(c.body)}</p></div>`).join('')||'<p class="muted-sm">No notes yet.</p>'}</div>
    <form id="comment-form" data-kind="${kind}" data-id="${attr(id)}"><textarea class="input" name="body" rows="2" placeholder="Add an observation or editing note" required></textarea><button class="btn subtle" type="submit">Add note</button></form></div></div></section>`;
}
function exportJson() {
  const payload={format:'ACC_BTS_v1',exported_at:new Date().toISOString(),data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`acc-bts-backup-${dateToday()}.json`;a.click();URL.revokeObjectURL(url);
  toast('Backup downloaded');
}
async function importJson(file) {
  try{
    const json=JSON.parse(await file.text());const d=json.data||json;
    if(!['shots','beats','sessions','footage','comments'].every(k=>Array.isArray(d[k])))throw Error('Not an ACC filming backup');
    if(!confirm('Replace the local demo records with this backup?'))return;
    data={...clone(initialData),...d,cards:Array.isArray(d.cards)?d.cards:clone(initialData.cards),history:Array.isArray(d.history)?d.history:[],links:Array.isArray(d.links)?d.links:clone(initialData.links)};saveDemo();render();toast('Local backup restored');
  }catch(e){toast(e.message,true);}
}
function chooseNav(id){ui.nav=id;ui.more=false;window.scrollTo({top:0,behavior:'instant'});render();}
function handleAction(el){
  const action=el.dataset.action,id=el.dataset.id||'',kind=el.dataset.kind||'';
  if(action==='nav'){chooseNav(id);return;}
  if(action==='more'){ui.more=true;render();return;}
  if(action==='close-more'){ui.more=false;render();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='new'){openEditor(id,null,id==='cards'?{status:'Idea'}:id==='sessions'?{date:dateToday(),status:'Not planned'}:id==='footage'?{taken_on:dateToday(),camera:'iPhone 16 Pro Max',review_status:'Needs review'}:{});return;}
  if(action==='new-card-thread'){openEditor('cards',null,{thread:id,status:'Idea'});return;}
  if(action==='actor-brief'){openActorBrief(id);return;}
  if(action==='copy-brief'){const c=find('cards',id);if(c){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(actorBriefText(c)).then(()=>toast('Actor brief copied')).catch(()=>toast('Could not copy. Select the text manually.',true));else toast('Copy is available on the deployed HTTPS app. Select and copy the brief here.',true);}return;}
  if(action==='board-new'){openBoardLinkEditor();return;}
  if(action==='board-edit'){openBoardLinkEditor(id);return;}
  if(action==='board-delete'){erase('links',id);return;}
  if(action==='board-node'){if(id.startsWith('card:'))openDetail('cards',id.slice(5));else if(id.startsWith('story:'))openBoardStoryTools(id.slice(6));return;}
  if(action==='board-story-go'){ui.selectedThread=id;ui.storyDetail=true;closeModal();chooseNav('stories');return;}
  if(action==='board-story-rename'){openBoardStoryRename(id);return;}
  if(action==='new-beat'){openEditor('beats',null,{thread:id,status:'Not planned',priority:'Must'});return;}
  if(action==='detail'){openDetail(kind,id);return;}
  if(action==='detail-beat'){openDetail('beats',id);return;}
  if(action==='detail-session'){openDetail('sessions',id);return;}
  if(action==='detail-footage'){openDetail('footage',id);return;}
  if(action==='edit'){openEditor('shots',id);return;}
  if(action==='edit-beat'){openEditor('beats',id);return;}
  if(action==='edit-session'){openEditor('sessions',id);return;}
  if(action==='edit-footage'){openEditor('footage',id);return;}
  if(/^edit-/.test(action)){openEditor(action.slice(5),id);return;}
  if(/^delete-/.test(action)){erase(action.slice(7),id);return;}
  if(action==='log'){openEditor('footage',null,{title:find('shots',id)?.title||'',shot_id:id,taken_on:dateToday(),camera:'iPhone 16 Pro Max',review_status:'Needs review'});return;}
  if(action==='capture'){const s=find('shots',id);if(!s)return;persist('shots',{...s,status:['Captured','Usable'].includes(s.status)?'Not shot':'Captured',captured_at:['Captured','Usable'].includes(s.status)?null:dateToday()},s).then(()=>toast('Shot status updated')).catch(e=>toast(e.message,true));return;}
  if(action==='cover-beat'){const b=find('beats',id);persist('beats',{...b,status:'Captured'},b).then(()=>toast('Story beat updated')).catch(e=>toast(e.message,true));return;}
  if(action==='thread'){ui.selectedThread=id;ui.storyDetail=true;render();return;}
  if(action==='session'){ui.selectedSession=id;ui.sessionDetail=true;render();return;}
  if(action==='stories-back'){ui.storyDetail=false;render();return;}
  if(action==='sessions-back'){ui.sessionDetail=false;render();return;}
  if(action==='export'){exportJson();return;}
  if(action==='signout'){supabase?.auth.signOut().catch(e=>toast(e.message,true));return;}
}
async function handleSubmit(form){
  if(form.id==='login-form'){
    const email=new FormData(form).get('email').toString().trim().toLowerCase();
    try{const {error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});if(error)throw error;toast('Check your email for the sign-in link');}
    catch(e){toast(e.message,true);}return;
  }
  if(form.id==='comment-form'){
    const fd=new FormData(form),body=String(fd.get('body')||'').trim();if(!body)return;
    try{await persist('comments',{id:uid('C'),target_type:TABLES[form.dataset.kind],target_id:form.dataset.id,body,author_email:user?.email||'Local demo',version:1,created_at:new Date().toISOString()});openDetail(form.dataset.kind,form.dataset.id);toast('Note added');}catch(e){toast(e.message,true);}return;
  }
  if(form.id==='board-link-form'){
    const id=form.dataset.id;const original=id?find('links',id):null;const fd=new FormData(form);
    const record=original?{...original}:{id:uid('L')};
    for(const k of ['source_key','target_key','relation','status','description'])record[k]=String(fd.get(k)||'').trim();
    const keys=new Set(boardNodes().map(n=>n.key));
    if(!keys.has(record.source_key)||!keys.has(record.target_key)){toast('Choose two available cards or storylines',true);return;}
    if(record.source_key===record.target_key){toast('A connection needs two different items',true);return;}
    if(data.links.some(l=>l.id!==record.id && ((l.source_key===record.source_key&&l.target_key===record.target_key)||(l.target_key===record.source_key&&l.source_key===record.target_key)))){toast('This pair is already connected. Edit the existing connection.',true);return;}
    try{await persist('links',record,original);closeModal();toast('Connection saved');}catch(e){toast(e.message,true);}return;
  }
  if(form.id==='rename-story-form'){
    try{await renameStoryline(form.dataset.old,String(new FormData(form).get('new_name')||''));closeModal();toast('Storyline renamed throughout the project');}catch(e){toast(e.message,true);}return;
  }
  if(form.id!=='editor-form')return;
  const kind=form.dataset.kind,id=form.dataset.id,old=id?find(kind,id):null;
  const formData=new FormData(form);const record=old?{...old}:{id:kind==='shots'?uid('U'):kind==='beats'?uid('B'):kind==='sessions'?uid('S'):kind==='cards'?uid('A'):uid('F')};
  for(const field of FIELDS[kind])record[field[0]]=String(formData.get(field[0])??'').trim();
  if(kind==='shots'){record.captured_at ||= null;record.priority ||= 'Useful';record.status ||= 'Not shot';record.thread ||= 'General';}
  if(kind==='cards'){record.status ||= 'Idea';record.session_date ||= null;}
  if(kind==='footage'){record.shot_id ||= null;record.taken_on ||= null;}
  if(kind==='sessions'){
    if(!record.date){toast('Date required',true);return;}
    if(!old && data.sessions.some(s=>s.id===record.date))record.id=uid('S');
    else if(!old)record.id=record.date;
  }
  try{const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Saving…';await persist(kind,record,old);closeModal();toast('Saved');}
  catch(e){toast(e.message,true);const submit=form.querySelector('[type=submit]');submit.disabled=false;submit.textContent='Save changes';}
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');if(el){e.preventDefault();handleAction(el);}
});
document.addEventListener('submit',e=>{e.preventDefault();handleSubmit(e.target);});
document.addEventListener('change',e=>{
  if(e.target.id==='session-picker'){ui.selectedSession=e.target.value;render();}
  if(e.target.id==='board-focus'){ui.boardFocus=e.target.value;render();}
  if(e.target.id==='board-show-cards'){ui.boardShowCards=e.target.checked;render();}
  if(e.target.id==='card-status'){ui.cardStatus=e.target.value;render();}
  if(e.target.id==='shot-status'){ui.shotStatus=e.target.value;render();}
  if(e.target.id==='shot-category'){ui.shotCategory=e.target.value;render();}
  if(e.target.id==='shot-priority'){ui.shotPriority=e.target.value;render();}
  if(e.target.id==='import-file'&&e.target.files[0])importJson(e.target.files[0]);
});
document.addEventListener('input',e=>{
  if(e.target.id==='card-search'){ui.cardSearch=e.target.value;const start=e.target.selectionStart;render();const el=document.getElementById('card-search');el?.focus();try{el?.setSelectionRange(start,start);}catch{};return;}
  if(e.target.id==='shot-search'){
    ui.shotSearch=e.target.value;
    const start=e.target.selectionStart;render();
    const el=document.getElementById('shot-search');el?.focus();try{el?.setSelectionRange(start,start);}catch{}
  }
});
window.addEventListener('online',()=>{if(cloudEnabled&&user)loadCloud();});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
init();
