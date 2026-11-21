/* 汐境回响 — 存档、经济、音频、启动 */
(function (TW) {
  'use strict';
  const D = TW.DATA;
  const SAVE_KEY = 'tidewake.save.v1';
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  /* ================= toast ================= */
  TW.toast = function (text, kind) {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = text;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, 1900);
    setTimeout(() => t.remove(), 2250);
  };

  /* ================= 默认存档 ================= */
  function freshHero(id) {
    return { lv: 1, asc: 0, star: 0, dup: 0, skill: 1, eq: [0, 0, 0, 0] };
  }

  function newSave() {
    const s = {
      v: 1,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      name: '守望者',
      gem: 10000, gold: 1000000, book: 120, crystal: 120, stone: 120, star: 0,
      heroes: {}, roster: [],
      formation: [null, null, null, null, null, null, null, null, null, null],
      prog: {},
      gacha: { pity: 0, upG: false, total: 0 },
      quests: {},
      daily: { date: today(), dungeons: {}, freePull: false },
      signin: { day: 0, last: '' },
      mail: [{
        id: 'welcome', title: '欢迎来到碎港',
        body: '潮水把你送到了这里。收下这些，然后活下去。',
        rewards: [{ kind: 'gem', amount: 3000 }, { kind: 'gold', amount: 300000 }, { kind: 'book', amount: 30 }],
        claimed: false, at: Date.now()
      }],
      flags: { first10: false, tutorial: 0 },
      settings: { vol: 0.55, bgm: 0.35, sfx: 0.7, quality: 'balanced', auto: false, dmgNum: true, cursorFx: true, difficulty: 'normal' },
      tower: 1
    };
    ['xizu', 'huochong', 'chaoyi'].forEach(id => {
      s.heroes[id] = freshHero(id);
      s.roster.push(id);
    });
    s.formation = ['xizu', 'huochong', 'chaoyi', null, null, null, null, null, null, null];
    return s;
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const base = newSave();
    const s = Object.assign({}, base, raw);
    ['gem', 'gold', 'book', 'crystal', 'stone', 'star'].forEach(k => {
      if (typeof s[k] !== 'number' || !isFinite(s[k])) s[k] = base[k];
    });
    s.heroes = s.heroes && typeof s.heroes === 'object' ? s.heroes : {};
    Object.keys(s.heroes).forEach(id => {
      const h = s.heroes[id];
      if (h && typeof h === 'object' && typeof h.dup !== 'number') h.dup = 0;
    });
    s.roster = Array.isArray(s.roster) ? s.roster : Object.keys(s.heroes);
    s.formation = Array.isArray(s.formation) ? s.formation.slice(0, 10) : [];
    while (s.formation.length < 10) s.formation.push(null);
    s.prog = s.prog && typeof s.prog === 'object' ? s.prog : {};
    s.gacha = Object.assign({}, base.gacha, s.gacha || {});
    s.quests = s.quests && typeof s.quests === 'object' ? s.quests : {};
    s.daily = Object.assign({ date: '', dungeons: {}, freePull: false }, s.daily || {});
    s.signin = Object.assign({ day: 0, last: '' }, s.signin || {});
    s.mail = Array.isArray(s.mail) ? s.mail : [];
    s.flags = Object.assign({}, base.flags, s.flags || {});
    s.settings = Object.assign({}, base.settings, s.settings || {});
    ['vol', 'bgm', 'sfx'].forEach(k => {
      const raw = s.settings[k];
      const v = raw == null || raw === '' ? NaN : +raw;
      s.settings[k] = isFinite(v) ? Math.max(0, Math.min(1, v)) : base.settings[k];
    });
    s.tower = Math.max(1, +s.tower || 1);
    return s;
  }

  /* ================= 账户与多存档 ================= */
  const ACC_KEY = 'tidewake.accounts.v1';
  const SAVE_PREFIX = 'tidewake.save.v2.';
  const MEM = {};
  const saveKeyFor = id => SAVE_PREFIX + id;

  function readStore(key) {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch (e) { TW.noStorage = true; }
    return Object.prototype.hasOwnProperty.call(MEM, key) ? MEM[key] : null;
  }
  function writeStore(key, value) {
    MEM[key] = value;
    try { localStorage.setItem(key, value); } catch (e) { TW.noStorage = true; }
  }
  function removeStore(key) {
    delete MEM[key];
    try { localStorage.removeItem(key); } catch (e) { TW.noStorage = true; }
  }
  function readJSON(key) {
    const raw = readStore(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function cleanName(name) {
    const n = String(name == null ? '' : name).replace(/[<>&"']/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    return n || '新账户';
  }
  function nameKey(name) {
    return cleanName(name).normalize('NFKC').toLowerCase();
  }
  function encodeCode(obj) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch (e) { return ''; }
  }
  function decodeCode(code) {
    try { return JSON.parse(decodeURIComponent(escape(atob(String(code || '').trim())))); } catch (e) { return null; }
  }

  function seedDev() {
    const s = newSave();
    s.name = '开发者';
    s.gem = 999999999; s.gold = 999999999; s.book = 999999999;
    s.crystal = 999999999; s.stone = 999999999; s.star = 0;
    s.heroes = {}; s.roster = [];
    (D.HEROES || []).forEach(h => {
      s.heroes[h.id] = { lv: 80, asc: 5, star: 5, dup: 99, skill: 5, eq: [20, 20, 20, 20] };
      s.roster.push(h.id);
    });
    s.formation = ['panyue', 'lange', 'jinyu', 'lanqie', 'xuyuan', 'miya', 'chisha', 'fengling', 'baiou', 'xingxi'];
    s.prog = {};
    (D.STAGES || []).forEach(st => { s.prog[st.id] = { stars: 3, clears: 1, bestTime: 0 }; });
    s.mail = [];
    s.quests = {};
    s.flags = {
      first10: true, tutorial: 9, autoOff: true,
      starConverted: true, v13gift: true, v20gift: true
    };
    s.settings.auto = false;
    s.trialBest = 30; s.trialRuns = 1; s.trialClears = 1;
    s.tower = 50;
    s.createdAt = Date.now();
    s.lastSeenAt = Date.now();
    return s;
  }

  function loadAccounts() {
    let data = readJSON(ACC_KEY);
    if (!data || !Array.isArray(data.list) || !data.list.length) {
      const legacyRaw = readStore(SAVE_KEY);
      let legacy = null;
      if (legacyRaw) {
        try { legacy = migrate(JSON.parse(legacyRaw)); } catch (e) { legacy = null; }
      }
      const base = legacy || newSave();
      let name = cleanName(base.name || '守望者');
      if (nameKey(name) === nameKey('开发者')) name = '守望者';
      base.name = name;
      const id = 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const now = Date.now();
      data = {
        version: 1,
        pwSeeded: true,
        pwSplit: true,
        active: id,
        list: [
          { id: id, name: name, isDev: false, createdAt: now, lastPlayed: now },
          { id: 'dev', name: '开发者', isDev: true, createdAt: now, lastPlayed: now }
        ]
      };
      writeStore(saveKeyFor(id), JSON.stringify(base));
      writeStore(saveKeyFor('dev'), JSON.stringify(seedDev()));
      writeStore(ACC_KEY, JSON.stringify(data));
      TW.devReady = true;
      return data;
    }

    data.list = data.list.filter(a => a && a.id).map(a => ({
      id: String(a.id),
      name: cleanName(a.name),
      isDev: !!a.isDev,
      createdAt: +a.createdAt || Date.now(),
      lastPlayed: +a.lastPlayed || 0,
      pw: (a.pw && a.pw.hash && a.pw.salt) ? {
        v: 1, algo: 'pbkdf2-sha256',
        iter: Math.max(10000, +a.pw.iter || 120000),
        salt: String(a.pw.salt),
        hash: String(a.pw.hash)
      } : undefined
    }));
    const devAcc = data.list.find(a => a.id === 'dev');
    if (devAcc) { devAcc.isDev = true; devAcc.name = '开发者'; }
    if (!data.list.some(a => a.id === 'dev')) {
      data.list.push({ id: 'dev', name: '开发者', isDev: true, createdAt: Date.now(), lastPlayed: 0 });
      TW.devReady = true;
    }
    if (!readStore(saveKeyFor('dev'))) {
      writeStore(saveKeyFor('dev'), JSON.stringify(seedDev()));
    }
    if (!data.list.some(a => a.id === data.active)) data.active = data.list[0].id;
    // 用户名不可重复：旧数据如有重名，自动改成「名字·2」
    const usedNames = new Set();
    const devA = data.list.find(a => a.isDev);
    if (devA) usedNames.add(nameKey(devA.name));
    data.list.forEach(a => {
      if (a.isDev) { usedNames.add(nameKey(a.name)); return; }
      const base = a.name;
      let fixed = base, i = 2;
      while (usedNames.has(nameKey(fixed))) {
        const suffix = '·' + i;
        fixed = base.slice(0, Math.max(1, 16 - suffix.length)) + suffix;
        i++;
      }
      a.name = fixed;
      usedNames.add(nameKey(fixed));
    });

    data.version = 1;
    writeStore(ACC_KEY, JSON.stringify(data));
    return data;
  }

  function readAccountSave(id) {
    const raw = readJSON(saveKeyFor(id));
    if (raw) {
      const s = migrate(raw);
      if (s) return s;
    }
    return newSave();
  }

  /* ================= 游戏核心 ================= */
  const Game = {
    save: null,

    init() {
      this._accounts = loadAccounts();
      this.activeId = this._accounts.active;
      this.save = readAccountSave(this.activeId);
      this.activateSave(this.save, true);
      this.noStorage = !!TW.noStorage;
      try {
        localStorage.setItem('tidewake.probe', '1');
        localStorage.removeItem('tidewake.probe');
      } catch (e) { this.noStorage = true; }
    },

    activateSave(s, showGiftToast) {
      this.save = s;
      this.save.name = this.accountName() || this.save.name;
      let got13 = false, got20 = false;
      if (!this.save.flags.autoOff) { this.save.settings.auto = false; this.save.flags.autoOff = true; }
      if (!this.save.flags.starConverted) {
        if (this.save.star > 0) {
          this.save.gem += this.save.star * 100;
          this.save.star = 0;
        }
        this.save.flags.starConverted = true;
      }
      if (!this.save.flags.v13gift) {
        this.save.flags.v13gift = true;
        got13 = true;
        this.save.mail.unshift({
          id: 'v13gift', title: 'v1.3 资源补给',
          body: '百余位英雄已抵达汐境。收下这份补给，去把每一关都推平。',
          rewards: [
            { kind: 'gem', amount: 10000 }, { kind: 'gold', amount: 1000000 },
            { kind: 'book', amount: 200 }, { kind: 'crystal', amount: 200 },
            { kind: 'stone', amount: 200 }, { kind: 'gem', amount: 500 }
          ],
          claimed: false, at: Date.now()
        });
      }
      let gotMedic = false;
      if (!this.save.flags.medicGift) {
        this.save.flags.medicGift = true;
        if (!this.save.heroes.baizhi) {
          this.save.heroes.baizhi = freshHero('baizhi');
          gotMedic = true;
        }
        if (!this.save.roster.includes('baizhi')) this.save.roster.push('baizhi');
        if (gotMedic) {
          const empty = (this.save.formation || []).findIndex((x, i) => i < this.unlockedSlots() && !x);
          if (empty >= 0) this.save.formation[empty] = 'baizhi';
        }
      }
      if (!this.save.flags.v20gift) {
        this.save.flags.v20gift = true;
        got20 = true;
        this.save.mail.unshift({
          id: 'v20gift', title: 'v2.0 深渊补给',
          body: '主动法术、潮汐觉醒、深渊试炼已经开放。带上这份补给，去试试 30 波。',
          rewards: [
            { kind: 'gem', amount: 3000 }, { kind: 'gold', amount: 500000 },
            { kind: 'book', amount: 60 }, { kind: 'crystal', amount: 60 }, { kind: 'stone', amount: 60 }
          ],
          claimed: false, at: Date.now()
        });
      }
      if (this.isDev() && !this.save.flags.formation10) {
        const ids = Object.keys(this.save.heroes).sort((a, b) => this.power(b) - this.power(a));
        const used = new Set((this.save.formation || []).filter(Boolean));
        for (let i = 0; i < 10; i++) {
          if (!this.save.formation[i]) {
            const id = ids.find(x => !used.has(x));
            if (id) { this.save.formation[i] = id; used.add(id); }
          }
        }
        this.save.flags.formation10 = true;
      }
      this.checkDaily();
      this.saveNow();
      this.gifted = !!(showGiftToast && got13);
      this.gifted2 = !!(showGiftToast && got20);
      this.medicGifted = !!(showGiftToast && gotMedic);
      if (TW.Audio) {
        try {
          TW.Audio.setMaster(this.save.settings.vol);
          TW.Audio.setBgm(this.save.settings.bgm);
          TW.Audio.setSfx(this.save.settings.sfx);
        } catch (e) {}
      }
      if (TW.Cursor) TW.Cursor.setEnabled(this.save.settings.cursorFx !== false);
    },

    saveNow() {
      if (!this.save || !this.activeId) return;
      this.save.lastSeenAt = Date.now();
      const acc = this.activeAccount();
      if (acc) this.save.name = acc.name;
      writeStore(saveKeyFor(this.activeId), JSON.stringify(this.save));
      if (this._accounts) {
        if (acc) acc.lastPlayed = Date.now();
        writeStore(ACC_KEY, JSON.stringify(this._accounts));
      }
    },

    accounts() { return this._accounts ? this._accounts.list.slice() : []; },
    accountById(id) {
      if (!this._accounts) return null;
      return this._accounts.list.find(a => a.id === id) || null;
    },
    setAccountPassword(id, rec) {
      const acc = this.accountById(id);
      if (!acc) return false;
      if (rec) {
        acc.pw = {
          v: 1, algo: 'pbkdf2-sha256',
          iter: Math.max(10000, +rec.iter || 120000),
          salt: String(rec.salt || ''),
          hash: String(rec.hash || '')
        };
        if (!acc.pw.salt || !acc.pw.hash) return false;
      } else {
        delete acc.pw;
      }
      writeStore(ACC_KEY, JSON.stringify(this._accounts));
      return true;
    },
    normalizeAccountName(name) { return cleanName(name); },
    accountNameTaken(name, exceptId) {
      const key = nameKey(name);
      return this.accounts().some(a => a.id !== exceptId && nameKey(a.name) === key);
    },
    activeAccount() {
      if (!this._accounts) return null;
      return this._accounts.list.find(a => a.id === this.activeId) || null;
    },
    accountName() {
      const a = this.activeAccount();
      return a ? a.name : '守望者';
    },
    isDev() {
      const a = this.activeAccount();
      return !!(a && a.isDev);
    },

    switchAccount(id, authorized) {
      if (!this._accounts) return false;
      if (id === this.activeId) return true;
      const acc = this.accountById(id);
      if (!acc) return false;
      if (acc.pw && !authorized) {
        if (TW.Auth) { TW.Auth.promptSwitch(id); return 'locked'; }
        return false;
      }
      this.saveNow();
      this.activeId = id;
      this._accounts.active = id;
      if (acc) acc.lastPlayed = Date.now();
      this.save = readAccountSave(id);
      this.activateSave(this.save, false);
      writeStore(ACC_KEY, JSON.stringify(this._accounts));
      if (TW.UI && TW.UI.accountChanged) TW.UI.accountChanged();
      return true;
    },

    createAccount(name, save) {
      if (!this._accounts) return null;
      const n = cleanName(name);
      if (this.accountNameTaken(n)) return null;
      const id = 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const s = save ? migrate(save) : newSave();
      if (!s) return null;
      s.name = n;
      s.createdAt = Date.now();
      s.lastSeenAt = Date.now();
      this._accounts.list.push({
        id: id, name: n, isDev: false,
        createdAt: Date.now(), lastPlayed: Date.now()
      });
      writeStore(saveKeyFor(id), JSON.stringify(s));
      writeStore(ACC_KEY, JSON.stringify(this._accounts));
      this.switchAccount(id);
      return id;
    },

    renameAccount(id, name) {
      if (!this._accounts) return false;
      const acc = this._accounts.list.find(a => a.id === id);
      if (!acc || acc.isDev) return false;
      const n = cleanName(name);
      if (this.accountNameTaken(n, id)) return false;
      acc.name = n;
      if (id === this.activeId) {
        this.save.name = n;
        writeStore(saveKeyFor(id), JSON.stringify(this.save));
      }
      writeStore(ACC_KEY, JSON.stringify(this._accounts));
      return true;
    },

    deleteAccount(id) {
      if (!this._accounts) return false;
      const acc = this._accounts.list.find(a => a.id === id);
      if (!acc || acc.isDev || this._accounts.list.length <= 1) return false;
      const wasActive = id === this.activeId;
      removeStore(saveKeyFor(id));
      this._accounts.list = this._accounts.list.filter(a => a.id !== id);
      if (wasActive) {
        const next = this._accounts.list[0];
        this.activeId = next.id;
        this._accounts.active = next.id;
        this.save = readAccountSave(next.id);
        this.activateSave(this.save, false);
      }
      writeStore(ACC_KEY, JSON.stringify(this._accounts));
      if (TW.UI) {
        if (wasActive && TW.UI.accountChanged) TW.UI.accountChanged();
        else TW.UI.render();
      }
      return true;
    },

    resetDev() {
      if (!this._accounts) return false;
      writeStore(saveKeyFor('dev'), JSON.stringify(seedDev()));
      if (this.activeId === 'dev') {
        this.save = readAccountSave('dev');
        this.activateSave(this.save, false);
        if (TW.UI && TW.UI.accountChanged) TW.UI.accountChanged();
      } else if (TW.UI) {
        TW.UI.render();
      }
      return true;
    },

    checkDaily() {
      const s = this.save;
      if (!s.daily || s.daily.date !== today()) {
        s.daily = { date: today(), dungeons: {}, freePull: false };
        s.quests = {};
      }
    },

    /* ---- 属性 ---- */
    heroStats(id) {
      const d = D.HERO_MAP[id];
      if (!d) return null;
      const st = this.save.heroes[id] || freshHero(id);
      const lv = st.lv || 1, asc = st.asc || 0, star = st.star || 0, skill = st.skill || 1;
      const eq = (st.eq || [0, 0, 0, 0]).reduce((a, b) => a + b, 0);
      const eqm = 1 + 0.005 * eq;
      const am = 1 + 0.085 * (lv - 1);
      const hm = 1 + 0.095 * (lv - 1);
      const dm = 1 + 0.070 * (lv - 1);
      const ascM = 1 + 0.12 * asc;
      const starM = 1 + 0.06 * star;
      const atk = d.atk * am * ascM * starM * eqm;
      let hp = d.hp * hm * ascM * starM * eqm;
      if (d.passive && d.passive.key === 'hpPct') hp *= 1 + (d.passive.value || 0);
      const def = d.def * dm * ascM * starM * eqm;
      const power = atk * 2.2 + hp * 0.18 + def * 1.6 + d.spd * 8 + skill * 40 + star * 120 + eq * 6;
      return { atk, hp, def, spd: d.spd, range: d.range, power: Math.round(power), lv };
    },

    power(id) { const s = this.heroStats(id); return s ? s.power : 0; },

    clearedChapters() {
      let n = 0;
      for (let ch = 1; ch <= 8; ch++) {
        const p = this.save.prog[ch + '-12'];
        if (p && p.clears) n++;
        else break;
      }
      return n;
    },

    unlockedSlots() {
      return Math.min(10, 5 + Math.min(5, this.clearedChapters()));
    },

    slotUnlockChapter(slotIndex) {
      return slotIndex - 4;
    },

    isSlotUnlocked(slotIndex) {
      return slotIndex >= 0 && slotIndex < this.unlockedSlots();
    },

    teamPower() {
      const unlocked = this.unlockedSlots();
      const ids = (this.save.formation || []).slice(0, unlocked).filter(id => id && this.save.heroes[id]);
      if (!ids.length) return 0;
      return Math.round(ids.reduce((a, id) => a + this.power(id), 0));
    },

    maxChapter() {
      let ch = 1;
      for (const st of D.STAGES) {
        const p = this.save.prog[st.id];
        if (p && p.clears) ch = Math.max(ch, st.chapter);
      }
      return ch;
    },

    /* ---- 经济 ---- */
    can(cost) {
      if (this.isDev()) return true;
      return Object.keys(cost).every(k => (this.save[k] || 0) >= cost[k]);
    },
    spend(cost) {
      if (this.isDev()) return true;
      if (!this.can(cost)) return false;
      Object.keys(cost).forEach(k => { this.save[k] -= cost[k]; });
      if (cost.gold) this.quest('gold', cost.gold);
      return true;
    },
    grant(list) {
      const out = [];
      (list || []).forEach(r => {
        if (!r) return;
        if (r.kind === 'hero') {
          const g = this.gainHero(r.id);
          out.push(D.HERO_MAP[r.id].name + (g.isNew ? '（NEW）' : '（星辉）'));
          return;
        }
        const key = r.kind === 'book' ? 'book' : r.kind;
        if (typeof this.save[key] === 'number') {
          this.save[key] += r.amount;
          out.push(({ gem: '星砂', gold: '金币', book: '经验书', crystal: '潮晶', stone: '强化石', star: '星辉' })[r.kind] + ' +' + r.amount);
        }
      });
      return out;
    },

    /* ---- 英雄获取 ---- */
    gainHero(id) {
      const d = D.HERO_MAP[id];
      if (!d) return { isNew: false };
      if (this.save.heroes[id]) {
        const st = this.save.heroes[id];
        st.dup = (st.dup || 0) + 1;
        return { isNew: false, dup: 1 };
      }
      this.save.heroes[id] = freshHero(id);
      if (!this.save.roster.includes(id)) this.save.roster.push(id);
      const unlocked = this.unlockedSlots();
      for (let i = 0; i < unlocked; i++) {
        if (!this.save.formation[i]) { this.save.formation[i] = id; break; }
      }
      return { isNew: true };
    },

    /* ---- 抽卡 ---- */
    rollRarity(pity) {
      let ssr = D.RATES.SSR;
      if (pity >= 47) ssr = Math.min(1, D.RATES.SSR + (pity - 46) * D.RATES.softStep);
      const r = Math.random();
      if (r < ssr) return 'SSR';
      if (r < ssr + 0.12) return 'SR';
      if (r < ssr + 0.47) return 'R';
      return 'N';
    },
    pickRarity(rar) {
      const pool = D.HEROES.filter(h => h.rarity === rar);
      return pool[Math.floor(Math.random() * pool.length)];
    },
    rollOne(pool) {
      const s = this.save;
      s.gacha.pity++;
      const rar = this.rollRarity(s.gacha.pity);
      if (rar === 'SSR') {
        s.gacha.pity = 0;
        if (pool === 'up') {
          const featured = D.HERO_MAP.miya;
          if (s.gacha.upG || Math.random() < 0.5) {
            s.gacha.upG = false;
            return featured;
          }
          s.gacha.upG = true;
        }
        return this.pickRarity('SSR');
      }
      return this.pickRarity(rar);
    },
    pull(n, pool, free) {
      const s = this.save;
      const cost = n === 1 ? 120 : 1000;
      if (!free && !this.isDev() && s.gem < cost) return null;
      if (!free && !this.isDev()) s.gem -= cost;
      else if (free) s.daily.freePull = true;

      const heroes = [];
      for (let i = 0; i < n; i++) heroes.push(this.rollOne(pool));

      // 新手首次十连必出 SSR
      if (n >= 10 && !s.flags.first10) {
        s.flags.first10 = true;
        if (!heroes.some(h => h.rarity === 'SSR')) {
          heroes[0] = pool === 'up' ? D.HERO_MAP.miya : this.pickRarity('SSR');
        }
      }
      // 十连至少 1 个 SR
      if (n >= 10 && !heroes.some(h => h.rarity === 'SR' || h.rarity === 'SSR')) {
        heroes[heroes.length - 1] = this.pickRarity('SR');
      }

      const gained = heroes.map(h => this.gainHero(h.id));
      const isNew = gained.map(g => g.isNew);
      const isDup = gained.map(g => !g.isNew);
      s.gacha.total += n;
      if (!free) this.quest('pull', 1);
      this.saveNow();
      return { heroes, isNew, isDup };
    },
    freePullReady() {
      if (!this.save.daily) return true;
      if (this.save.daily.date !== today()) return true;
      return !this.save.daily.freePull;
    },

    /* ---- 养成 ---- */
    levelCost(id) {
      const st = this.save.heroes[id];
      const lv = st ? st.lv : 1;
      return { gold: Math.round(25 + 0.5 * lv * lv), book: Math.max(1, Math.ceil(30 * lv / 500)) };
    },
    levelUp(id, mode) {
      const st = this.save.heroes[id];
      if (!st) return;
      const cap = D.LEVEL_CAP[st.asc];
      let count = 0;
      const max = mode === 'max' ? 200 : 1;
      while (st.lv < cap && count < max) {
        const c = this.levelCost(id);
        if (!this.isDev() && (this.save.gold < c.gold || this.save.book < c.book)) break;
        if (!this.isDev()) { this.save.gold -= c.gold; this.save.book -= c.book; }
        st.lv++; count++;
        this.quest('level', 1);
        this.quest('gold', c.gold);
      }
      if (count) {
        this.saveNow();
        TW.Sfx.play('levelup');
        TW.toast('升级成功 · Lv.' + st.lv + (count > 1 ? '（+' + count + '）' : ''));
      } else if (st.lv >= cap) TW.toast('已达当前突破上限', 'warn');
      else TW.toast('金币或经验书不足', 'warn');
    },
    ascendCost(asc) { return { crystal: 20 + 20 * asc, gold: 10000 * (asc + 1) }; },
    ascend(id) {
      const st = this.save.heroes[id];
      if (!st || st.asc >= 5) return;
      if (st.lv < D.LEVEL_CAP[st.asc]) return TW.toast('先升到当前等级上限', 'warn');
      const c = this.ascendCost(st.asc);
      if (!this.spend(c)) return TW.toast('潮晶或金币不足', 'warn');
      st.asc++;
      this.saveNow();
      TW.toast('突破成功 · 等级上限 ' + D.LEVEL_CAP[st.asc]);
    },
    skillCost(skill) { return { crystal: 5 * skill, gold: 5000 * skill }; },
    skillUp(id) {
      const st = this.save.heroes[id];
      if (!st || st.skill >= 5) return;
      const c = this.skillCost(st.skill);
      if (!this.spend(c)) return TW.toast('潮晶或金币不足', 'warn');
      st.skill++;
      this.saveNow();
      TW.toast('技能提升至 ' + st.skill + ' 级');
    },
    starUp(id) {
      const st = this.save.heroes[id];
      if (!st || st.star >= 5) return;
      if (!this.isDev()) {
        if ((st.dup || 0) < 1) return TW.toast('需要 1 个同名英雄：抽到重复英雄即可升阶', 'warn');
        st.dup--;
      }
      st.star++;
      this.saveNow();
      TW.toast('共鸣升阶至 ' + st.star + ' 阶');
    },
    upEquip(id, slot) {
      const st = this.save.heroes[id];
      if (!st) return;
      const lv = st.eq[slot] || 0;
      if (lv >= 20) return;
      const c = { stone: 2 + lv, gold: 300 + 150 * lv };
      if (!this.spend(c)) return TW.toast('强化石或金币不足', 'warn');
      st.eq[slot] = lv + 1;
      this.saveNow();
      TW.toast('强化成功 · +' + (lv + 1));
    },

    /* ---- 任务 ---- */
    quest(key, n) {
      const s = this.save;
      const defs = { clear: 'q_clear3', pull: 'q_pull1', level: 'q_level3', win: 'q_win1', ult: 'q_ult3', gold: 'q_gold' };
      const id = defs[key];
      if (!id) return;
      if (!s.quests[id]) s.quests[id] = { n: 0, claimed: false };
      s.quests[id].n += n;
    },
    claimQuest(id) {
      const q = D.QUESTS.find(x => x.id === id);
      const st = this.save.quests[id];
      if (!q || !st || st.claimed || st.n < q.target) return null;
      st.claimed = true;
      const rewards = [{ kind: 'gem', amount: q.gem }, { kind: 'gold', amount: q.gold }];
      this.grant(rewards);
      this.saveNow();
      return rewards;
    },

    /* ---- 签到 ---- */
    signinReady() { return this.save.signin.last !== today(); },
    signinDay() { return this.save.signin.day % 7; },
    claimSignin() {
      if (!this.signinReady()) return null;
      const day = this.signinDay();
      const r = D.SIGNIN[day];
      const rewards = [
        { kind: 'gem', amount: r.gem }, { kind: 'gold', amount: r.gold },
        { kind: 'book', amount: r.book || 0 }, { kind: 'crystal', amount: r.crystal || 0 },
        { kind: 'stone', amount: r.stone || 0 }
      ].filter(x => x.amount > 0);
      this.grant(rewards);
      this.save.signin.day = (day + 1) % 7;
      this.save.signin.last = today();
      this.saveNow();
      return rewards;
    },

    /* ---- 商店 / 邮件 ---- */
    buyShop(item) {
      if (!this.can(item.cost)) return false;
      this.spend(item.cost);
      this.grant([item.gain]);
      this.saveNow();
      return true;
    },
    claimMail(id) {
      const m = (this.save.mail || []).find(x => x.id === id);
      if (!m || m.claimed) return false;
      m.claimed = true;
      this.grant(m.rewards);
      this.saveNow();
      return true;
    },

    /* ---- 存档 IO ---- */
    parseAccountCode(code) {
      const raw = decodeCode(code);
      if (!raw || typeof raw !== 'object') return null;
      if (raw.app === 'tidewake' && raw.save) {
        return {
          save: raw.save,
          name: cleanName(raw.account && raw.account.name ? raw.account.name : '导入账户'),
          isDev: !!(raw.account && raw.account.isDev)
        };
      }
      if (raw.heroes) {
        return {
          save: raw,
          name: cleanName(raw.name || '导入账户'),
          isDev: false
        };
      }
      return null;
    },

    exportAccount(id) {
      const acc = this._accounts ? this._accounts.list.find(a => a.id === id) : null;
      if (!acc) return '';
      const s = id === this.activeId ? this.save : readAccountSave(id);
      return encodeCode({
        app: 'tidewake',
        kind: 'account',
        version: 1,
        account: { name: acc.name, isDev: !!acc.isDev },
        save: s,
        exportedAt: Date.now()
      });
    },

    exportSave() {
      return this.exportAccount(this.activeId);
    },

    importAccount(code, nameOverride) {
      const p = this.parseAccountCode(code);
      if (!p) return null;
      const s = migrate(p.save);
      if (!s) return null;
      const want = (nameOverride && String(nameOverride).trim()) ? nameOverride : p.name;
      if (this.accountNameTaken(want)) return { error: 'duplicate' };
      const id = this.createAccount(want, s);
      return id ? { id: id, name: this.accountName() } : { error: 'duplicate' };
    },

    importSave(code) {
      const p = this.parseAccountCode(code);
      if (!p) return false;
      const s = migrate(p.save);
      if (!s) return false;
      s.name = this.accountName();
      this.save = s;
      this.activateSave(s, false);
      return true;
    },

    reset() {
      if (this.isDev()) {
        this.save = seedDev();
        this.activateSave(this.save, false);
      } else {
        const name = this.accountName();
        this.save = newSave();
        this.save.name = name;
        this.activateSave(this.save, true);
      }
    }
  };

  TW.Game = Game;

  /* ================= 音效（兼容旧接口，实际转发到 TW.Audio） ================= */
  const Sfx = {
    play(name, opts) {
      const A = TW.Audio;
      if (A && A.sfx) return A.sfx(name, opts);
      return false;
    },
    unlock() { if (TW.Audio) TW.Audio.unlock(); },
    setVol(v) { if (TW.Audio) TW.Audio.setMaster(v); },
    pause() { if (TW.Audio) TW.Audio.pause(); },
    resume() { if (TW.Audio) TW.Audio.resume(); },
    get enabled() { return !!(TW.Audio && TW.Audio.state && TW.Audio.state().ready); }
  };
  TW.Sfx = Sfx;

  /* ================= 音频设置接线 ================= */
  function bindAudio() {
    const A = TW.Audio;
    if (!A) return;
    const st = Game.save.settings;
    A.setMaster(st.vol);
    A.setBgm(st.bgm);
    A.setSfx(st.sfx);
    A.bgm('menu'); // 首次手势后 unlock() 真正开始播放

    if (A.__settingsBound) return;
    A.__settingsBound = true;
    const wrap = (key, fn) => function (v) {
      const r = fn.apply(this, arguments);
      const s = Game.save;
      const val = +v;
      if (s && s.settings && isFinite(val)) {
        const next = Math.max(0, Math.min(1, val));
        if (Math.abs((+s.settings[key] || 0) - next) > 0.0001) {
          s.settings[key] = next;
          Game.saveNow();
        }
      }
      return r;
    };
    A.setMaster = wrap('vol', A.setMaster);
    A.setBgm = wrap('bgm', A.setBgm);
    A.setSfx = wrap('sfx', A.setSfx);
  }

  /* 非战斗路由统一进入菜单 BGM；战斗 BGM 由 engine 调用 TW.Audio.bgm('battle'/'boss'/'trial') */
  function syncBgm() {
    if (!TW.Audio) return;
    if (TW.Battle && TW.Battle.active && TW.Battle.active()) return;
    TW.Audio.bgm('menu');
  }

  /* ================= 背景遗迹 ================= */
  function buildRuins() {
    const box = document.getElementById('ruins');
    if (!box) return;
    let shapes = '';
    for (let i = 0; i < 14; i++) {
      const w = 80 + (i * 37 % 90);
      const h = 120 + (i * 61 % 220);
      const x = i * 118 - 40;
      const y = 560 - h;
      shapes += `<path d="M${x} 600 L${x} ${y + 30} L${x + w * 0.2} ${y} L${x + w * 0.8} ${y} L${x + w} ${y + 30} L${x + w} 600 Z" fill="#071821" opacity="${0.65 + (i % 3) * 0.1}"/>`;
      shapes += `<path d="M${x + w * 0.32} 600 L${x + w * 0.32} ${y + 80} Q${x + w / 2} ${y + 52} ${x + w * 0.68} ${y + 80} L${x + w * 0.68} 600 Z" fill="#0a2029" opacity=".9"/>`;
      for (let k = 0; k < 3; k++) {
        shapes += `<circle cx="${x + w * 0.2 + k * w * 0.25}" cy="${y + 30 + k * 22}" r="1.6" fill="#3fe0d0" opacity="${0.25 + k * 0.1}"/>`;
      }
    }
    box.innerHTML = `<svg viewBox="0 0 1600 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ruinFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient></defs>
      <g>${shapes}</g>
      <rect width="1600" height="600" fill="url(#ruinFade)" opacity=".08"/>
    </svg>`;
  }

  /* ================= 背景粒子 ================= */
  function startFx() {
    const c = document.getElementById('fx');
    if (!c) return;
    const g = c.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    const parts = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      c.style.width = w + 'px'; c.style.height = h + 'px';
      if (parts.length === 0) {
        for (let i = 0; i < 46; i++) {
          parts.push({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 1.8 + 0.4,
            vy: -(Math.random() * 8 + 2) / 60,
            vx: (Math.random() - 0.5) * 0.15,
            a: Math.random() * 0.5 + 0.1,
            gold: Math.random() < 0.18
          });
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);
    let last = performance.now();
    function frame(ts) {
      const dt = Math.min(40, ts - last) / 16.6;
      last = ts;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      parts.forEach(p => {
        p.y += p.vy * dt; p.x += p.vx * dt;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        g.globalAlpha = p.a * (0.6 + Math.sin(ts / 900 + p.x) * 0.4);
        g.fillStyle = p.gold ? '#f2c987' : '#7ff3e6';
        g.shadowColor = g.fillStyle; g.shadowBlur = 8;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
      });
      g.globalAlpha = 1; g.shadowBlur = 0;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ================= 启动 ================= */
  function boot() {
    Game.init();
    bindAudio();
    buildRuins();
    startFx();
    TW.UI.init();
    if (TW.Cursor) TW.Cursor.init(Game.save.settings.cursorFx !== false);
    syncBgm();
    if (Game.noStorage) setTimeout(() => TW.toast('当前环境无法保存进度，建议用本地服务器打开', 'warn'), 900);
    if (Game.gifted) setTimeout(() => TW.toast('v1.3 资源补给已发送到邮件', 'warn'), 1300);
    if (Game.gifted2) setTimeout(() => TW.toast('v2.0 深渊补给已发送到邮件', 'warn'), 1700);
    if (Game.medicGifted) setTimeout(() => TW.toast('新英雄「白芷」已加入，可在编队中上阵：优先治疗战士', 'warn'), 2600);
    if (TW.devReady) setTimeout(() => TW.toast('开发者账户已就绪：右上角账户切换', 'warn'), 2200);

    // 首次手势后创建/恢复 AudioContext（iOS / Safari 兼容）；后续点击也可以从系统中断中恢复
    document.addEventListener('pointerdown', () => Sfx.unlock());
    document.addEventListener('pointerdown', e => {
      const t = e.target.closest('button');
      if (t) Sfx.play('click');
    });

    // 设置里的音乐 / 音效滑杆（若 UI 提供 data-set="bgm"/"sfx"）
    document.addEventListener('input', e => {
      const t = e.target.closest('[data-set]');
      if (!t) return;
      const kind = t.dataset.set;
      if (kind !== 'bgm' && kind !== 'sfx') return;
      const v = +t.value / 100;
      if (!TW.Audio) return;
      if (kind === 'bgm') TW.Audio.setBgm(v);
      else TW.Audio.setSfx(v);
    });

    window.addEventListener('hashchange', syncBgm);
    window.addEventListener('beforeunload', () => Game.saveNow());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Game.saveNow();
        if (TW.Audio) TW.Audio.pause();
      } else if (TW.Audio) {
        TW.Audio.resume();
      }
    });
    console.log('%c汐境回响 TIDEWAKE v2.17','color:#3fe0d0;font-weight:bold');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.TW);
