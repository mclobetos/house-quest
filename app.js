import { createStore, dayKey } from './store.js';
import { AV, DEFAULT_AVATARS, avatarSVG, petSVG } from './avatar.js';

// ---------- Leveling ----------
// XP needed to reach level L: 50 * L * (L - 1)  -> L2: 100, L3: 300, L4: 600, L5: 1000 ...
const xpFor = (L) => 50 * L * (L - 1);
const levelOf = (xp) => Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2));

const TITLES = [
  [1, 'The Unpacking Arc'],
  [2, 'Fresh Recruits of Del Mar'],
  [3, 'Dish Pit Survivors'],
  [4, 'Laundry Mountain Climbers'],
  [5, 'Order of the Clean Counter'],
  [6, 'Husky Fur Storm Chasers'],
  [7, 'Keepers of the Hutch'],
  [8, 'Meal Prep Monks'],
  [9, 'Guardians of the Cul-de-sac'],
  [10, 'Del Mar Defense Force'],
  [12, 'Twin Flame Homesteaders'],
  [15, 'Legends of the Spotless Sink'],
  [20, 'Sovereigns of the Household'],
  [25, 'The Final Arc (there is no final arc)'],
  [30, 'Ascended Homeowners'],
  [40, 'Mythic Tier Married Couple'],
];
const titleFor = (L) => TITLES.filter(t => t[0] <= L).pop()[1];

const UNLOCKS = {
  2: 'Blaze aura', 3: 'Zigzag pattern', 4: 'Cloak outfit', 5: 'Golden egg prop', 6: 'Star pattern', 10: 'Prismatic aura',
};

const DEFAULT_PRESETS = [
  ['💩', "I'm pooping!"], ['🚽', 'I need to poop!'], ['✅', 'Just pooped!'],
  ['🏋️', 'Heading to the gym'], ['🐺', 'Walking Ocean'], ['🛒', "At the store, need anything?"],
  ['🍳', "Food's ready!"], ['🏡', "At my parents'"], ['🎮', 'Gaming, do not disturb'],
  ['🎸', 'Shredding'], ['🥚', 'In my craft era'], ['😴', 'Napping'],
  ['🚗', 'On my way home'], ['❤️', 'Love you'],
].map(([emoji, text]) => ({ emoji, text }));

const TIERS = [
  { xp: 10, label: 'Quick' }, { xp: 20, label: 'Normal' }, { xp: 35, label: 'Hard' }, { xp: 60, label: 'Boss' },
];

const PET_LINES = {
  elliott: ['*knocks a quest off the table*', 'Elliott supervises. Elliott does not assist.', '*slow blink of approval*', 'Elliott demands a tribute of treats.'],
  ocean: ['AWOOOOOO (dramatic)', 'Ocean has filed a formal complaint.', '*sheds 4 lbs of fur in protest*', 'Ocean says it is walk o\'clock. It is always walk o\'clock.'],
  hiccup: ['*binky*', 'Hiccup is plotting.', '*judges you silently*', 'Hiccup approves of this household.'],
};

// ---------- State ----------
const S = {
  store: null,
  data: { tasks: [], completions: [], totalXp: 0, totalQuests: 0, days: [], settings: {}, announcements: [], annReady: true },
  annEdit: false,
  tab: 'quests',
  me: lsGet('hq_me'),
  loaded: false,
  error: null,
  editing: 'josh',
  draft: null,
};

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Derived ----------
function periodStart(rec) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (rec === 'weekly') { const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); }
  if (rec === 'once') return new Date(0);
  return d;
}
function completionFor(task) {
  const start = periodStart(task.recurrence).getTime();
  return S.data.completions.find(c => c.task_id === task.id && new Date(c.completed_at).getTime() >= start);
}
function streak() {
  const days = new Set(S.data.days.map(String));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function avatars() {
  const s = S.data.settings;
  return {
    josh: { ...DEFAULT_AVATARS.josh, ...(s.avatar_josh || {}) },
    nat: { ...DEFAULT_AVATARS.nat, ...(s.avatar_nat || {}) },
  };
}
function presets() {
  const p = S.data.settings.presets;
  return Array.isArray(p) ? p : DEFAULT_PRESETS;
}
const other = () => (S.me === 'nat' ? 'josh' : 'nat');
function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
const clockTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function house() { return { name: 'House of Josh & Nat', ...(S.data.settings.house || {}) }; }

// ---------- Render ----------
function render() {
  const app = $('#app');
  if (!S.me) { app.innerHTML = renderWho(); bindWho(); return; }
  if (!$('#view')) { shell(); return; }
  const views = { quests: renderQuests, party: renderParty, log: renderLog, settings: renderSettings };
  $('#view').innerHTML = (views[S.tab] || renderQuests)();
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#mode').innerHTML = S.store && S.store.mode === 'demo'
    ? `<div class="banner">Demo mode: progress is saved on this phone only. Add Supabase keys in config.js to sync both phones.</div>` : '';
  if (S.error) $('#mode').innerHTML += `<div class="banner err">Can't reach the house database right now. Showing the last known state.</div>`;
  bindView();
}

function renderWho() {
  const a = avatars();
  return `<div class="who">
    <div class="who-title">Who's holding<br>this phone?</div>
    <div class="who-pick">
      ${['josh', 'nat'].map(k => `<button class="who-btn" data-me="${k}">${avatarSVG(a[k])}<span>${esc(a[k].name)}</span></button>`).join('')}
    </div>
    <p class="muted">You can change this later in Settings.</p>
  </div>`;
}
function bindWho() {
  document.querySelectorAll('[data-me]').forEach(b => b.onclick = () => { S.me = b.dataset.me; lsSet('hq_me', S.me); shell(); });
}

function heroCard() {
  const xp = S.data.totalXp, L = levelOf(xp), lo = xpFor(L), hi = xpFor(L + 1);
  const pct = Math.min(100, ((xp - lo) / (hi - lo)) * 100);
  const a = avatars();
  return `<section class="hero panel">
    <div class="speed"></div>
    <div class="hero-top">
      <div>
        <div class="house-name">${esc(house().name)}</div>
        <div class="muted small">Del Mar, CA</div>
      </div>
      <div class="lv-badge"><small>LV</small>${L}</div>
    </div>
    <div class="party">
      <div class="member">${avatarSVG(a.josh)}<div class="tag"><b>${esc(a.josh.name)}</b><span>${esc(a.josh.className)}</span></div></div>
      <div class="member">${avatarSVG(a.nat)}<div class="tag"><b>${esc(a.nat.name)}</b><span>${esc(a.nat.className)}</span></div></div>
      <div class="pets">
        <button class="pet" data-pet="elliott" aria-label="Elliott">${petSVG('elliott')}</button>
        <button class="pet" data-pet="ocean" aria-label="Ocean">${petSVG('ocean')}</button>
        <button class="pet" data-pet="hiccup" aria-label="Hiccup">${petSVG('hiccup')}</button>
      </div>
    </div>
    <div class="title-card">${esc(titleFor(L))}</div>
    <div class="xpbar"><div class="xpfill" style="width:${pct}%"></div></div>
    <div class="xpmeta"><span>${xp - lo} / ${hi - lo} XP</span><span>to Lv ${L + 1}</span></div>
  </section>`;
}

function renderQuests() {
  const tasks = S.data.tasks;
  const groups = [
    ['daily', 'Daily quests', 'Resets every night'],
    ['weekly', 'Weekly quests', 'Resets Monday'],
    ['once', 'Side quests', 'One and done'],
  ];
  const todayKey = dayKey(new Date());
  const today = S.data.completions.filter(c => dayKey(c.completed_at) === todayKey);
  const todayXp = today.reduce((s, c) => s + c.xp, 0);
  let html = heroCard();
  html += `<section class="stats">
    <div class="stat panel"><b>${streak()}</b><span>day streak 🔥</span></div>
    <div class="stat panel"><b>${todayXp}</b><span>XP today</span></div>
    <div class="stat panel"><b>${S.data.totalQuests}</b><span>quests cleared</span></div>
  </section>`;
  html += announcePanel();
  for (const [rec, label, sub] of groups) {
    const list = tasks.filter(t => t.recurrence === rec);
    if (!list.length && rec === 'once') continue;
    const withState = list.map(t => ({ t, c: completionFor(t) }));
    withState.sort((x, y) => (!!x.c - !!y.c) || (x.t.sort - y.t.sort));
    const left = withState.filter(x => !x.c).length;
    html += `<section class="group">
      <div class="group-head"><h2>${label}</h2><span class="muted small">${left ? `${left} left · ${sub}` : 'All clear ✨'}</span></div>
      ${withState.map(({ t, c }) => questCard(t, c)).join('') || `<div class="muted small empty">No quests here yet.</div>`}
    </section>`;
  }
  html += `<button class="fab" id="addQuest" aria-label="Add quest">＋</button>`;
  return html;
}

function announcePanel() {
  const a = avatars();
  const latest = (k) => S.data.announcements.find(x => x.from_who === k);
  const line = (k) => {
    const m = latest(k);
    return `<div class="ann-line"><span class="ann-who">${esc(a[k].name)}</span>${m
      ? `<span class="ann-msg">${esc(m.emoji)} ${esc(m.text)}</span><span class="ann-time">${timeAgo(m.created_at)}</span>`
      : `<span class="ann-msg muted">No announcements yet</span>`}</div>`;
  };
  return `<section class="ann-panel panel">
    <div class="ann-lines">${line('josh')}${line('nat')}</div>
    <button class="btn primary wide ann-btn" id="openAnnounce">📣 Announce</button>
  </section>`;
}

function questCard(t, c) {
  const a = avatars();
  const who = c ? (c.by_who === 'together' ? 'Together' : (a[c.by_who]?.name || c.by_who)) : '';
  return `<button class="quest panel ${c ? 'done' : ''}" data-task="${t.id}">
    <span class="q-icon">${esc(t.icon)}</span>
    <span class="q-body"><span class="q-title">${esc(t.title)}</span>
      <span class="q-sub">${c ? `Cleared by ${esc(who)} · tap to undo` : tierLabel(t.xp)}</span></span>
    <span class="q-xp">${c ? '✓' : `+${t.xp}`}</span>
  </button>`;
}
const tierLabel = (xp) => (TIERS.slice().reverse().find(t => xp >= t.xp) || TIERS[0]).label + ' quest';

function renderParty() {
  const a = avatars();
  const k = S.editing;
  const d = S.draft || { ...a[k] };
  S.draft = d;
  const L = levelOf(S.data.totalXp);
  const chip = (field, opt) => {
    const locked = opt.lv && L < opt.lv;
    return `<button class="chip ${d[field] === opt.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-f="${field}" data-v="${opt.id}" ${locked ? 'disabled' : ''}>${esc(opt.label)}${locked ? ` <small>🔒 Lv${opt.lv}</small>` : ''}</button>`;
  };
  const swatch = (field) => AV[field].map(c => `<button class="sw ${d[field] === c ? 'on' : ''}" style="background:${c}" data-f="${field}" data-v="${c}" aria-label="${c}"></button>`).join('');
  const row = (label, inner) => `<div class="ed-row"><div class="ed-label">${label}</div><div class="ed-opts">${inner}</div></div>`;
  return `<section class="party-edit">
    <div class="seg">
      <button class="${k === 'josh' ? 'on' : ''}" data-edit="josh">${esc(a.josh.name)}</button>
      <button class="${k === 'nat' ? 'on' : ''}" data-edit="nat">${esc(a.nat.name)}</button>
    </div>
    <div class="preview panel"><div class="speed"></div>${avatarSVG(d)}</div>
    <div class="panel ed">
      ${row('Name', `<input class="inp" data-text="name" value="${esc(d.name)}" maxlength="20">`)}
      ${row('Class title', `<input class="inp" data-text="className" value="${esc(d.className)}" maxlength="28" placeholder="Make up your own">`)}
      ${row('Hair', AV.hairFront.map(o => chip('hairFront', o)).join(''))}
      ${row('Back hair', AV.hairBack.map(o => chip('hairBack', o)).join(''))}
      ${row('Facial hair', AV.facialHair.map(o => chip('facialHair', o)).join(''))}
      ${row('Hair color', swatch('hairColor'))}
      ${row('Skin', swatch('skin'))}
      ${row('Eyes', swatch('eyeColor'))}
      ${row('Expression', AV.expression.map(o => chip('expression', o)).join(''))}
      ${row('Outfit', AV.outfit.map(o => chip('outfit', o)).join(''))}
      ${row('Outfit color', swatch('outfitColor'))}
      ${row('Pattern', AV.pattern.map(o => chip('pattern', o)).join(''))}
      ${row('Accessory', AV.accessory.map(o => chip('accessory', o)).join(''))}
      ${row('Held item', AV.prop.map(o => chip('prop', o)).join(''))}
      ${row('Aura', AV.aura.map(o => chip('aura', o)).join(''))}
      ${row('Aura color', swatch('auraColor'))}
    </div>
    <button class="btn primary wide" id="saveAvatar">Save ${esc(d.name)}</button>
    <div class="panel unlocks"><h3>House unlocks</h3>
      ${Object.entries(UNLOCKS).map(([lv, name]) => `<div class="unl ${L >= lv ? 'got' : ''}"><span>Lv ${lv}</span>${esc(name)}${L >= lv ? ' ✓' : ''}</div>`).join('')}
    </div>
  </section>`;
}

function renderLog() {
  const a = avatars();
  const items = S.data.completions.slice(0, 80);
  if (!items.length) return `<div class="panel empty-log"><h2>Adventure log</h2><p class="muted">Nothing yet. Clear a quest and it shows up here.</p></div>`;
  let lastDay = '';
  let html = `<h2 class="page-h">Adventure log</h2>`;
  for (const c of items) {
    const dk = dayKey(c.completed_at);
    if (dk !== lastDay) {
      lastDay = dk;
      const d = new Date(c.completed_at);
      const label = dk === dayKey(new Date()) ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      html += `<div class="log-day">${label}</div>`;
    }
    const who = c.by_who === 'together' ? `${esc(a.josh.name)} & ${esc(a.nat.name)}` : esc(a[c.by_who]?.name || c.by_who);
    const time = new Date(c.completed_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    html += `<div class="log-item panel"><span class="q-icon">${esc(c.icon)}</span>
      <span class="q-body"><span class="q-title">${esc(c.title)}</span><span class="q-sub">${who}${c.by_who === 'together' ? ' · combo!' : ''} · ${time}</span></span>
      <span class="q-xp">+${c.xp}</span></div>`;
  }
  return html;
}

function renderSettings() {
  const h = house();
  const a = avatars();
  return `<h2 class="page-h">Settings</h2>
  <div class="panel form">
    <label>House name<input class="inp" id="setName" value="${esc(h.name)}" maxlength="40"></label>
    <button class="btn primary" id="saveHouse">Save</button>
  </div>
  <div class="panel form">
    <div class="ed-label">This phone belongs to</div>
    <div class="seg">
      <button class="${S.me === 'josh' ? 'on' : ''}" data-setme="josh">${esc(a.josh.name)}</button>
      <button class="${S.me === 'nat' ? 'on' : ''}" data-setme="nat">${esc(a.nat.name)}</button>
    </div>
  </div>
  <h2 class="page-h">Manage quests</h2>
  ${S.data.tasks.map(t => `<button class="quest panel" data-edittask="${t.id}">
    <span class="q-icon">${esc(t.icon)}</span>
    <span class="q-body"><span class="q-title">${esc(t.title)}</span><span class="q-sub">${t.recurrence} · ${t.xp} XP</span></span>
    <span class="q-xp">Edit</span></button>`).join('')}
  <button class="btn wide" id="addQuest2">＋ New quest</button>
  <p class="muted small center">House Quest · ${S.store?.mode === 'live' ? 'synced' : 'demo mode'}</p>`;
}

// ---------- Binding ----------
function bindView() {
  document.querySelectorAll('[data-task]').forEach(b => b.onclick = () => openQuest(b.dataset.task));
  document.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => {
    const lines = PET_LINES[b.dataset.pet];
    toast(lines[Math.floor(Math.random() * lines.length)]);
    b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop');
  });
  const oa = $('#openAnnounce'); if (oa) oa.onclick = openAnnounce;
  const add = $('#addQuest') || $('#addQuest2');
  if (add) add.onclick = () => openTaskEditor(null);
  const add2 = $('#addQuest2'); if (add2) add2.onclick = () => openTaskEditor(null);

  // party editor
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { S.editing = b.dataset.edit; S.draft = null; render(); });
  document.querySelectorAll('.ed [data-f]').forEach(b => b.onclick = () => {
    S.draft[b.dataset.f] = b.dataset.v;
    const sy = window.scrollY; render(); window.scrollTo(0, sy);
  });
  document.querySelectorAll('[data-text]').forEach(i => i.oninput = () => {
    S.draft[i.dataset.text] = i.value;
    $('.preview').innerHTML = `<div class="speed"></div>${avatarSVG(S.draft)}`;
  });
  const sa = $('#saveAvatar');
  if (sa) sa.onclick = async () => {
    const d = { ...S.draft }; d.name = (d.name || '').trim() || DEFAULT_AVATARS[S.editing].name;
    await safe(() => S.store.setSetting('avatar_' + S.editing, d));
    S.draft = null; toast(`${d.name} saved`);
  };

  // settings
  const sh = $('#saveHouse');
  if (sh) sh.onclick = async () => {
    await safe(() => S.store.setSetting('house', { ...house(), name: $('#setName').value.trim() || 'Our House'}));
    toast('House updated');
  };
  document.querySelectorAll('[data-setme]').forEach(b => b.onclick = () => { S.me = b.dataset.setme; lsSet('hq_me', S.me); render(); });
  document.querySelectorAll('[data-edittask]').forEach(b => b.onclick = () => openTaskEditor(b.dataset.edittask));
}

async function safe(fn) {
  try { await fn(); } catch (e) { console.error(e); toast('Could not save. Check your connection.'); }
}

// ---------- Sheets ----------
function sheet(html) {
  const el = $('#sheet');
  el.innerHTML = `<div class="sheet-bg"></div><div class="sheet-card panel">${html}</div>`;
  el.classList.add('open');
  el.querySelector('.sheet-bg').onclick = closeSheet;
  return el;
}
function closeSheet() { $('#sheet').classList.remove('open'); $('#sheet').innerHTML = ''; }

function openQuest(id) {
  const t = S.data.tasks.find(x => x.id === id); if (!t) return;
  const c = completionFor(t);
  const a = avatars();
  if (c) {
    const el = sheet(`<div class="sh-icon">${esc(t.icon)}</div><h3>${esc(t.title)}</h3>
      <p class="muted">Already cleared. Undo it? The house loses ${c.xp} XP.</p>
      <div class="sh-actions"><button class="btn" data-x="cancel">Keep it</button><button class="btn danger" data-x="undo">Undo</button></div>`);
    el.querySelector('[data-x=cancel]').onclick = closeSheet;
    el.querySelector('[data-x=undo]').onclick = async () => { closeSheet(); await safe(() => S.store.deleteCompletion(c)); toast('Undone'); };
    return;
  }
  const combo = Math.round(t.xp * 1.25);
  const order = S.me === 'nat' ? ['nat', 'josh'] : ['josh', 'nat'];
  const el = sheet(`<div class="sh-icon">${esc(t.icon)}</div><h3>${esc(t.title)}</h3>
    <p class="muted">Who cleared it? Every point goes to the house.</p>
    <div class="who-grid">
      ${order.map(k => `<button class="who-mini" data-by="${k}">${avatarSVG(a[k], { animate: false })}<span>${esc(a[k].name)}</span><small>+${t.xp} XP</small></button>`).join('')}
      <button class="who-mini combo" data-by="together"><span class="combo-art">${avatarSVG(a.josh, { animate: false })}${avatarSVG(a.nat, { animate: false })}</span><span>Together</span><small>+${combo} XP combo</small></button>
    </div>`);
  el.querySelectorAll('[data-by]').forEach(b => b.onclick = async () => {
    const by = b.dataset.by;
    const xp = by === 'together' ? combo : t.xp;
    closeSheet();
    burst(`+${xp} XP`, by === 'together');
    await safe(() => S.store.addCompletion({ task_id: t.id, title: t.title, icon: t.icon, by_who: by, xp }, t));
  });
}

function openTaskEditor(id) {
  const t = id ? S.data.tasks.find(x => x.id === id) : { title: '', icon: '✨', xp: 20, recurrence: 'daily', category: 'home' };
  const el = sheet(`<h3>${id ? 'Edit quest' : 'New quest'}</h3>
    <div class="form">
      <label>Quest name<input class="inp" id="tTitle" value="${esc(t.title)}" maxlength="60" placeholder="Defeat the junk drawer"></label>
      <label>Emoji<input class="inp" id="tIcon" value="${esc(t.icon)}" maxlength="4"></label>
      <div class="ed-label">Difficulty</div>
      <div class="ed-opts">${TIERS.map(x => `<button class="chip ${t.xp === x.xp ? 'on' : ''}" data-xp="${x.xp}">${x.label} · ${x.xp}</button>`).join('')}</div>
      <div class="ed-label">Repeats</div>
      <div class="ed-opts">${[['daily', 'Daily'], ['weekly', 'Weekly'], ['once', 'One time']].map(([v, l]) => `<button class="chip ${t.recurrence === v ? 'on' : ''}" data-rec="${v}">${l}</button>`).join('')}</div>
    </div>
    <div class="sh-actions">
      ${id ? `<button class="btn danger" data-x="del">Delete</button>` : `<button class="btn" data-x="cancel">Cancel</button>`}
      <button class="btn primary" data-x="save">Save</button>
    </div>`);
  let xp = t.xp, rec = t.recurrence;
  if (!TIERS.some(x => x.xp === xp)) xp = 20;
  el.querySelectorAll('[data-xp]').forEach(b => b.onclick = () => { xp = +b.dataset.xp; el.querySelectorAll('[data-xp]').forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { rec = b.dataset.rec; el.querySelectorAll('[data-rec]').forEach(x => x.classList.toggle('on', x === b)); });
  const cancel = el.querySelector('[data-x=cancel]'); if (cancel) cancel.onclick = closeSheet;
  const del = el.querySelector('[data-x=del]');
  if (del) del.onclick = async () => { closeSheet(); await safe(() => S.store.deleteTask(id)); toast('Quest removed'); };
  el.querySelector('[data-x=save]').onclick = async () => {
    const title = el.querySelector('#tTitle').value.trim();
    if (!title) { el.querySelector('#tTitle').focus(); return; }
    const icon = el.querySelector('#tIcon').value.trim() || '✨';
    closeSheet();
    await safe(() => id ? S.store.updateTask(id, { title, icon, xp, recurrence: rec }) : S.store.addTask({ title, icon, xp, recurrence: rec, category: 'home' }));
    toast(id ? 'Quest updated' : 'New quest added');
  };
}

// ---------- Announcements ----------
function openAnnounce() {
  const a = avatars();
  if (!S.data.annReady) {
    const el = sheet(`<div class="sh-icon">📣</div><h3>Almost there</h3>
      <p class="muted">Announcements need one quick database update first. Run the announcements SQL snippet in Supabase, then reopen the app.</p>
      <div class="sh-actions"><button class="btn primary" data-x="ok" style="grid-column:1/-1">OK</button></div>`);
    el.querySelector('[data-x=ok]').onclick = closeSheet;
    return;
  }
  const list = presets();
  const hist = S.data.announcements.slice(0, 20);
  const el = sheet(`<h3>📣 Announce to ${esc(a[other()].name)}</h3>
    <p class="muted small">${S.annEdit ? 'Tap × to remove a button.' : 'Tap one to send it instantly.'}</p>
    <div class="preset-grid">
      ${list.map((p, i) => `<button class="preset ${S.annEdit ? 'editing' : ''}" data-p="${i}"><span class="pe">${esc(p.emoji)}</span><span class="pt">${esc(p.text)}</span>${S.annEdit ? '<b class="px">×</b>' : ''}</button>`).join('')}
    </div>
    <button class="linkish" data-x="edit">${S.annEdit ? 'Done editing' : 'Edit buttons'}</button>
    <div class="custom panel">
      <div class="ed-label">Custom announcement</div>
      <div class="custom-row">
        <input class="inp emo" id="cEmoji" value="📣" maxlength="4" aria-label="Emoji">
        <input class="inp" id="cText" maxlength="80" placeholder="Type anything…">
      </div>
      <label class="chk"><input type="checkbox" id="cSave"> Save as a button</label>
      <button class="btn primary wide" data-x="send">Send</button>
    </div>
    ${hist.length ? `<div class="ed-label" style="margin-top:16px">Recent</div>
      ${hist.map(m => `<div class="hist ${m.from_who === S.me ? 'mine' : ''}"><span class="hist-who">${esc(a[m.from_who]?.name || m.from_who)}</span><span class="hist-msg">${esc(m.emoji)} ${esc(m.text)}</span><span class="hist-time">${timeAgo(m.created_at)}</span></div>`).join('')}` : ''}`);

  el.querySelectorAll('[data-p]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.p;
    if (S.annEdit) {
      const next = list.filter((_, j) => j !== i);
      await safe(() => S.store.setSetting('presets', next));
      S.data.settings.presets = next; openAnnounce();
      return;
    }
    send(list[i].emoji, list[i].text);
  });
  el.querySelector('[data-x=edit]').onclick = () => { S.annEdit = !S.annEdit; openAnnounce(); };
  el.querySelector('[data-x=send]').onclick = async () => {
    const text = el.querySelector('#cText').value.trim();
    if (!text) { el.querySelector('#cText').focus(); return; }
    const emoji = el.querySelector('#cEmoji').value.trim() || '📣';
    if (el.querySelector('#cSave').checked) {
      const next = [...list, { emoji, text }];
      await safe(() => S.store.setSetting('presets', next));
    }
    send(emoji, text);
  };
}

async function send(emoji, text) {
  closeSheet(); S.annEdit = false;
  const a = avatars();
  await safe(async () => {
    await S.store.addAnnouncement({ from_who: S.me, emoji, text });
    toast(`Sent to ${a[other()].name}: ${emoji} ${text}`);
  });
}

let bannerTimer;
function checkAnnouncements() {
  const incoming = S.data.announcements.find(m => m.from_who !== S.me);
  if (!incoming) return;
  const seen = lsGet('hq_seen_ann');
  if (!seen) { lsSet('hq_seen_ann', incoming.created_at); return; }
  if (incoming.created_at <= seen) return;
  lsSet('hq_seen_ann', incoming.created_at);
  const a = avatars();
  const who = a[incoming.from_who] || { name: incoming.from_who };
  const b = $('#ann');
  b.innerHTML = `<div class="ann-banner">
    <div class="ann-av">${a[incoming.from_who] ? avatarSVG(a[incoming.from_who], { animate: false }) : ''}</div>
    <div class="ann-body"><div class="ann-head">📣 ${esc(who.name)} announces <span>${clockTime(incoming.created_at)}</span></div>
    <div class="ann-text">${esc(incoming.emoji)} ${esc(incoming.text)}</div></div></div>`;
  b.classList.add('show');
  b.onclick = () => b.classList.remove('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 12000);
}

// ---------- Effects ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function burst(text, big) {
  const b = document.createElement('div');
  b.className = 'burst' + (big ? ' big' : '');
  b.innerHTML = `<span>${esc(text)}</span>` + Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * (360 / 14)}deg;--d:${60 + Math.random() * 60}px"></i>`).join('');
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1200);
}
function checkLevelUp() {
  const L = levelOf(S.data.totalXp);
  const seen = parseInt(lsGet('hq_seen_level') || '0', 10);
  if (!seen) { lsSet('hq_seen_level', String(L)); return; }
  if (L > seen) {
    lsSet('hq_seen_level', String(L));
    const unlock = Object.entries(UNLOCKS).filter(([lv]) => +lv > seen && +lv <= L).map(([, n]) => n);
    const o = $('#levelup');
    o.innerHTML = `<div class="lu-rays"></div><div class="lu-card">
      <div class="lu-kicker">THE HOUSE LEVELED UP</div>
      <div class="lu-num">LV ${L}</div>
      <div class="lu-title">${esc(titleFor(L))}</div>
      ${unlock.length ? `<div class="lu-unlock">Unlocked: ${unlock.map(esc).join(', ')}</div>` : ''}
      <button class="btn primary">Let's go</button></div>`;
    o.classList.add('open');
    o.querySelector('button').onclick = () => o.classList.remove('open');
  } else if (L < seen) {
    lsSet('hq_seen_level', String(L));
  }
}

// ---------- Boot ----------
async function refresh() {
  try {
    S.data = await S.store.load();
    S.error = null;
  } catch (e) {
    console.error(e); S.error = e;
  }
  S.loaded = true;
  if (!S.me) { render(); return; }
  if (!$('#view')) { shell(); return; }
  // don't clobber an in-progress avatar edit
  if (!(S.tab === 'party' && S.draft)) { const sy = window.scrollY; render(); window.scrollTo(0, sy); }
  checkLevelUp();
  checkAnnouncements();
}

function shell() {
  $('#app').innerHTML = `<div id="mode"></div><main id="view"></main>
    <nav class="nav">
      <button data-tab="quests"><span>⚔️</span>Quests</button>
      <button data-tab="party"><span>🎭</span>Party</button>
      <button data-tab="log"><span>📜</span>Log</button>
      <button data-tab="settings"><span>⚙️</span>Settings</button>
    </nav>`;
  document.querySelectorAll('.nav button').forEach(b => b.onclick = () => {
    if (S.tab === b.dataset.tab) return;
    S.tab = b.dataset.tab; S.draft = null; render(); window.scrollTo(0, 0);
  });
  render();
  checkLevelUp();
  checkAnnouncements();
}

(async function boot() {
  S.store = await createStore();
  S.store.onChange(refresh);
  await refresh();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
  // re-render at midnight-ish so daily quests reset without reopening
  setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 5 * 60 * 1000);
  setInterval(() => { if (S.tab === 'quests' && $('.ann-panel') && !$('#sheet.open')) { const sy = window.scrollY; render(); window.scrollTo(0, sy); } }, 60 * 1000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
