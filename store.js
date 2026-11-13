// Data layer. Uses Supabase when config.js is filled in, otherwise a
// local demo store (data stays on this one phone).

const SEED_TASKS = [
  ['Walk Ocean', 20, 'daily', '🐺', 'pets'],
  ['Feed the party (Elliott, Ocean, Hiccup)', 10, 'daily', '🥣', 'pets'],
  ["Scoop Elliott's litter", 10, 'daily', '🐈', 'pets'],
  ['Fresh hay & water for Hiccup', 10, 'daily', '🐇', 'pets'],
  ['Clear the Dish Pit', 20, 'daily', '🍽️', 'home'],
  ['Training session (gym)', 35, 'daily', '🏋️', 'gains'],
  ['Hit the protein goal', 10, 'daily', '🥩', 'gains'],
  ['Defeat Laundry Mountain', 35, 'weekly', '🧺', 'home'],
  ['Vacuum the Husky Fur Storm', 35, 'weekly', '🌪️', 'home'],
  ["Deep clean Hiccup's hutch", 35, 'weekly', '🧹', 'pets'],
  ['Brush Ocean (the undercoat boss)', 35, 'weekly', '🪮', 'pets'],
  ['Trash & recycling night', 20, 'weekly', '🗑️', 'home'],
  ['Grocery supply run', 35, 'weekly', '🛒', 'home'],
  ['Meal prep for the week', 60, 'weekly', '🍱', 'gains'],
  ['Visit across the street', 20, 'weekly', '🏡', 'family'],
];

const RECENT_DAYS = 45;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2) + Date.now());

// ---------------- Local demo store ----------------
class LocalStore {
  constructor() {
    this.mode = 'demo';
    this.key = 'hq_demo_v1';
    this.listeners = [];
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) {}
    if (!d) {
      d = {
        tasks: SEED_TASKS.map((t, i) => ({ id: uuid(), title: t[0], xp: t[1], recurrence: t[2], icon: t[3], category: t[4], archived: false, sort: (i + 1) * 10 })),
        completions: [],
        settings: { house: { name: 'House of Josh & Nat' } },
      };
    }
    this.d = d;
  }
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) {} this.listeners.forEach(f => f()); }
  onChange(f) { this.listeners.push(f); }
  async load() {
    const since = Date.now() - RECENT_DAYS * 864e5;
    const all = this.d.completions;
    return {
      tasks: this.d.tasks.filter(t => !t.archived).sort((a, b) => a.sort - b.sort),
      completions: all.filter(c => new Date(c.completed_at).getTime() >= since).sort((a, b) => b.completed_at.localeCompare(a.completed_at)),
      totalXp: all.reduce((s, c) => s + c.xp, 0),
      totalQuests: all.length,
      days: [...new Set(all.map(c => dayKey(c.completed_at)))].sort().reverse(),
      settings: { ...this.d.settings },
    };
  }
  async addCompletion(c, task) {
    this.d.completions.push({ id: uuid(), completed_at: new Date().toISOString(), ...c });
    if (task && task.recurrence === 'once') { const t = this.d.tasks.find(x => x.id === task.id); if (t) t.archived = true; }
    this.save();
  }
  async deleteCompletion(c) {
    this.d.completions = this.d.completions.filter(x => x.id !== c.id);
    const t = this.d.tasks.find(x => x.id === c.task_id);
    if (t && t.recurrence === 'once') t.archived = false;
    this.save();
  }
  async addTask(t) { this.d.tasks.push({ id: uuid(), archived: false, sort: 1000, ...t }); this.save(); }
  async updateTask(id, patch) { const t = this.d.tasks.find(x => x.id === id); if (t) Object.assign(t, patch); this.save(); }
  async deleteTask(id) { this.d.tasks = this.d.tasks.filter(x => x.id !== id); this.save(); }
  async setSetting(key, value) { this.d.settings[key] = value; this.save(); }
}

// ---------------- Supabase store ----------------
class SupaStore {
  constructor(sb) {
    this.mode = 'live';
    this.sb = sb;
    this.listeners = [];
    let timer = null;
    const ping = () => { clearTimeout(timer); timer = setTimeout(() => this.listeners.forEach(f => f()), 250); };
    sb.channel('house')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, ping)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, ping)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, ping)
      .subscribe();
    this._ping = ping;
  }
  onChange(f) { this.listeners.push(f); }
  async load() {
    const since = new Date(Date.now() - RECENT_DAYS * 864e5).toISOString();
    const [t, c, s, d, st] = await Promise.all([
      this.sb.from('tasks').select('*').eq('archived', false).order('sort').order('created_at'),
      this.sb.from('completions').select('*').gte('completed_at', since).order('completed_at', { ascending: false }).limit(1000),
      this.sb.from('house_stats').select('*').single(),
      this.sb.from('completion_days').select('day').limit(1000),
      this.sb.from('settings').select('*'),
    ]);
    for (const r of [t, c, s, d, st]) if (r.error) throw r.error;
    const settings = {};
    st.data.forEach(r => { settings[r.key] = r.value; });
    return {
      tasks: t.data,
      completions: c.data,
      totalXp: s.data.total_xp,
      totalQuests: s.data.total_quests,
      days: d.data.map(r => r.day),
      settings,
    };
  }
  async _do(p) { const r = await p; if (r.error) throw r.error; this._ping(); return r; }
  async addCompletion(c, task) {
    await this._do(this.sb.from('completions').insert(c));
    if (task && task.recurrence === 'once') await this._do(this.sb.from('tasks').update({ archived: true }).eq('id', task.id));
  }
  async deleteCompletion(c) {
    await this._do(this.sb.from('completions').delete().eq('id', c.id));
    if (c.task_id) await this._do(this.sb.from('tasks').update({ archived: false }).eq('id', c.task_id).eq('recurrence', 'once'));
  }
  async addTask(t) { await this._do(this.sb.from('tasks').insert({ sort: 1000, ...t })); }
  async updateTask(id, patch) { await this._do(this.sb.from('tasks').update(patch).eq('id', id)); }
  async deleteTask(id) { await this._do(this.sb.from('tasks').delete().eq('id', id)); }
  async setSetting(key, value) { await this._do(this.sb.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })); }
}

export async function createStore() {
  const cfg = window.HQ_CONFIG || {};
  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      return new SupaStore(createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY));
    } catch (e) {
      console.error('Supabase failed to load, falling back to demo', e);
    }
  }
  return new LocalStore();
}

export { dayKey };
