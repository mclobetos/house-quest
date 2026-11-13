// House Quest home screen widget for the Scriptable app (iOS, free).
// 1. Paste your Supabase URL + anon key below (same values as config.js).
// 2. Paste your GitHub Pages app link in APP_URL so tapping the widget opens the app.
// Works as a Small or Medium widget.

const SUPABASE_URL = 'https://gjjecmpfuhwlkmppmfjv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_X4K4-Wy6hSiH4MHCbx8m9w_P5kymGOq';
const APP_URL = 'https://mclobetos.github.io/house-quest/';

// ---------- same leveling math as the app ----------
const xpFor = (L) => 50 * L * (L - 1);
const levelOf = (xp) => Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2));
const TITLES = [[1, 'The Unpacking Arc'], [2, 'Fresh Recruits of Del Mar'], [3, 'Dish Pit Survivors'], [4, 'Laundry Mountain Climbers'], [5, 'Order of the Clean Counter'], [6, 'Husky Fur Storm Chasers'], [7, 'Keepers of the Hutch'], [8, 'Meal Prep Monks'], [9, 'Guardians of the Cul-de-sac'], [10, 'Del Mar Defense Force'], [12, 'Twin Flame Homesteaders'], [15, 'Legends of the Spotless Sink'], [20, 'Sovereigns of the Household'], [25, 'The Final Arc (there is no final arc)'], [30, 'Ascended Homeowners'], [40, 'Mythic Tier Married Couple']];
const titleFor = (L) => TITLES.filter(t => t[0] <= L).pop()[1];

const C = {
  bg1: new Color('#2f2768'), bg2: new Color('#14122b'), text: new Color('#f6f2ff'), muted: new Color('#a9a2cf'),
  gold: new Color('#ffcf4a'), coral: new Color('#ff6b5b'), teal: new Color('#3fd0c9'), track: new Color('#0c0a1c'),
};

async function get(path) {
  const r = new Request(`${SUPABASE_URL}/rest/v1/${path}`);
  r.headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  return await r.loadJSON();
}
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function loadData() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today); week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  const [stats, days, tasks, comps, ann] = await Promise.all([
    get('house_stats?select=*'),
    get('completion_days?select=day&limit=400'),
    get('tasks?select=id,recurrence&archived=eq.false'),
    get(`completions?select=task_id,xp,completed_at&completed_at=gte.${encodeURIComponent(week.toISOString())}`),
    get('announcements?select=from_who,emoji,text,created_at&order=created_at.desc&limit=1').catch(() => []),
  ]);
  const totalXp = stats[0]?.total_xp || 0;
  const doneToday = new Set(), doneWeek = new Set();
  let xpToday = 0;
  for (const c of comps) {
    const t = new Date(c.completed_at);
    doneWeek.add(c.task_id);
    if (t >= today) { doneToday.add(c.task_id); xpToday += c.xp; }
  }
  const dailyLeft = tasks.filter(t => t.recurrence === 'daily' && !doneToday.has(t.id)).length;
  const weeklyLeft = tasks.filter(t => t.recurrence === 'weekly' && !doneWeek.has(t.id)).length;
  // streak
  const set = new Set(days.map(d => d.day));
  const d = new Date(); if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0; while (set.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  const latest = Array.isArray(ann) && ann[0] ? ann[0] : null;
  return { totalXp, dailyLeft, weeklyLeft, xpToday, streak, latest };
}

function bar(width, height, pct) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height); ctx.opaque = false; ctx.respectScreenScale = true;
  const r = height / 2;
  const track = new Path(); track.addRoundedRect(new Rect(0, 0, width, height), r, r);
  ctx.addPath(track); ctx.setFillColor(C.track); ctx.fillPath();
  const fw = Math.max(height, width * pct);
  const fill = new Path(); fill.addRoundedRect(new Rect(0, 0, fw, height), r, r);
  ctx.addPath(fill); ctx.setFillColor(C.gold); ctx.fillPath();
  return ctx.getImage();
}

function bg(w) {
  const g = new LinearGradient();
  g.colors = [C.bg1, C.bg2]; g.locations = [0, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
}

async function build() {
  const fam = config.widgetFamily || 'medium';
  const w = new ListWidget();
  bg(w); w.url = APP_URL; w.setPadding(14, 16, 14, 16);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  let d;
  try { d = await loadData(); }
  catch (e) {
    const t = w.addText('House Quest'); t.font = Font.heavySystemFont(16); t.textColor = C.text;
    w.addSpacer(6);
    const m = w.addText("Can't reach the house right now."); m.font = Font.mediumSystemFont(12); m.textColor = C.muted;
    return w;
  }

  const L = levelOf(d.totalXp), lo = xpFor(L), hi = xpFor(L + 1);
  const pct = Math.min(1, (d.totalXp - lo) / (hi - lo));
  const left = d.dailyLeft + d.weeklyLeft;

  const top = w.addStack(); top.centerAlignContent();
  const lv = top.addStack(); lv.backgroundColor = C.gold; lv.cornerRadius = 10; lv.setPadding(3, 8, 3, 8);
  const lvt = lv.addText(`LV ${L}`); lvt.font = Font.blackSystemFont(fam === 'small' ? 16 : 18); lvt.textColor = C.track;
  top.addSpacer(8);
  if (fam !== 'small') {
    const name = top.addText('House Quest'); name.font = Font.heavySystemFont(14); name.textColor = C.text;
  }
  top.addSpacer();
  const st = top.addText(`🔥${d.streak}`); st.font = Font.heavySystemFont(14); st.textColor = C.text;

  w.addSpacer(fam === 'small' ? 8 : 6);
  const title = w.addText(titleFor(L)); title.font = Font.heavySystemFont(fam === 'small' ? 12 : 14);
  title.textColor = C.teal; title.lineLimit = 2; title.minimumScaleFactor = 0.7;
  w.addSpacer(8);

  const barW = fam === 'small' ? 130 : 300;
  const img = w.addImage(bar(barW, 12, pct)); img.imageSize = new Size(barW, 12);
  w.addSpacer(4);
  const xpt = w.addText(`${d.totalXp - lo}/${hi - lo} XP to Lv ${L + 1}`); xpt.font = Font.mediumSystemFont(11); xpt.textColor = C.muted;

  if (fam !== 'small' && d.latest) {
    w.addSpacer(6);
    const who = d.latest.from_who === 'nat' ? 'Nat' : 'Josh';
    const mins = Math.round((Date.now() - new Date(d.latest.created_at).getTime()) / 60000);
    const ago = mins < 1 ? 'now' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
    const an = w.addText(`📣 ${who}: ${d.latest.emoji} ${d.latest.text} · ${ago}`);
    an.font = Font.semiboldSystemFont(11); an.textColor = C.gold; an.lineLimit = 1; an.minimumScaleFactor = 0.8;
  }
  w.addSpacer();
  const row = w.addStack(); row.centerAlignContent();
  const q = row.addText(left === 0 ? 'All quests clear ✨' : `${d.dailyLeft} daily · ${d.weeklyLeft} weekly left`);
  q.font = Font.heavySystemFont(fam === 'small' ? 11 : 13); q.textColor = left === 0 ? C.gold : C.text; q.minimumScaleFactor = 0.7; q.lineLimit = 1;
  if (fam !== 'small') {
    row.addSpacer();
    const x = row.addText(`+${d.xpToday} today`); x.font = Font.heavySystemFont(13); x.textColor = C.coral;
  }
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
