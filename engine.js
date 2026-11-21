/* 汐境回响 — 战斗引擎（Canvas） */
(function (TW) {
  'use strict';

  const W = 1280, H = 720;
  const CELL = 96;
  const GRID = { x: 256, y: 148, cols: 8, rows: 5 };
  const MAX_ENERGY = 30;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ELEM_ADV = { tide: 'ember', ember: 'gale', gale: 'stone', stone: 'tide', void: null };
  const CELL_CENTER = (c, r) => ({
    x: GRID.x + c * CELL + CELL / 2,
    y: GRID.y + r * CELL + CELL / 2
  });

  let B = null; // 当前战斗单例

  function toPx(path) {
    return path.map(p => CELL_CENTER(p[0], p[1]));
  }

  /* ---------- 战斗 ---------- */
  function run(opts) {
    destroy();
    const canvas = document.getElementById('battle');
    const wrap = document.getElementById('battleWrap');
    const hud = document.getElementById('battleHud');
    const cutin = document.getElementById('cutin');
    wrap.classList.remove('hidden');
    cutin.classList.add('hidden');
    cutin.innerHTML = '';

    const stage = opts.stage;
    const team = opts.team || [];
    const q = opts.quality || 'balanced';
    const diffKey = (TW.DATA.DIFFICULTY && TW.DATA.DIFFICULTY[opts.difficulty]) ? opts.difficulty : 'hard';
    const diff = (TW.DATA.DIFFICULTY && TW.DATA.DIFFICULTY[diffKey]) || { key:'hard', enemyHp:1.55, enemyDmg:1.3, enemySpeed:1.04, baseMod:-5, leakMul:1.4, gold:1.25 };
    const bm = { atk: 0, as: 0, hp: 0, energy: 0, ultDmg: 0, gold: 0, crit: 0, heal: 0, range: 0 };
    (opts.blessings || []).forEach(b => {
      if (!b || !b.mods) return;
      Object.keys(bm).forEach(k => { if (typeof b.mods[k] === 'number') bm[k] += b.mods[k]; });
    });
    const syn = opts.bonuses || {};
    const stageMods = stage.modifiers || {};
    wrap.classList.remove('q-ultra', 'q-balanced', 'q-fast');
    wrap.classList.add('q-' + q);

    B = {
      canvas, ctx: canvas.getContext('2d'), wrap, hud, cutin,
      stage, team, quality: q, stageMods,
      paths: stage.paths.map(toPx),
      deployable: (stage.deployable || []).map(p => ({ c: p[0], r: p[1] })),
      pathSet: new Set(),
      time: -3, last: 0, raf: 0,
      speed: opts.speed || 1, auto: !!opts.auto, paused: false,
      energy: 12, energyAcc: 0,
      baseHp: Math.max(5, (stage.baseHp || 20) + (diff.baseMod || 0)),
      baseMax: Math.max(5, (stage.baseHp || 20) + (diff.baseMod || 0)),
      enemies: [], projectiles: [], particles: [], texts: [], rings: [],
      units: [], queue: [], qi: 0, waveIndex: 0, totalWaves: stage.waves.length,
      shake: 0, hitStop: 0, timeScale: 1, ultSlowT: 0, placeSlow: false,
      kills: 0, dmgDealt: 0, dmgTaken: 0, healed: 0, ults: 0,
      selected: -1, hover: null,
      particlesCap: q === 'fast' ? 140 : q === 'ultra' ? 620 : 360,
      over: false, onEnd: opts.onEnd || function(){}, onRestart: opts.onRestart || null, onBlessing: opts.onBlessing || null,
      trial: !!opts.trial,
      mods: {
        atk: bm.atk + (syn.atk || 0), as: bm.as, hp: bm.hp + (syn.hp || 0),
        energy: bm.energy, ultDmg: bm.ultDmg + (stageMods.ultDmg || 0), gold: bm.gold, crit: bm.crit + (syn.crit || 0),
        heal: bm.heal + (syn.heal || 0), range: bm.range
      },
      spells: [
        { id: 'freeze', cd: 30, left: 0 },
        { id: 'meteor', cd: 22, left: 0 },
        { id: 'heal', cd: 35, left: 0 }
      ],
      combo: 0, comboT: 0, burst: 0, burstT: 0, burstReady: false,
      waveCallCd: 0, waveCallReady: false, lastWaveAt: 0, spellsUsed: 0,
      telegraphs: [], zoom: 1, zoomT: 0, bossPhase: 0, goldEarned: 0,
      blessingPause: false, blessingWaves: {},
      bannerTimer: null, paused2: false,
      scale: 1, ox: 0, oy: 0, dpr: 1,
      spawnCounter: 0, bg: null, cardEls: [], flash: 0, bossRef: null,
      stageElement: ['tide','gale','stone','void','ember','tide','void','stone'][stage.chapter - 1] || 'tide',
      difficulty: diffKey, diff: diff
    };

    // 标记路径格
    stage.paths.forEach(p => {
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1];
        const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 4);
        for (let s = 0; s <= steps; s++) {
          const c = a[0] + (b[0] - a[0]) * s / steps;
          const r = a[1] + (b[1] - a[1]) * s / steps;
          B.pathSet.add(Math.round(c) + ',' + Math.round(r));
        }
      }
    });

    B.pathCells = Array.from(B.pathSet).map(k => {
      const p = k.split(',');
      return { c: +p[0], r: +p[1] };
    }).filter(p => p.c >= 0 && p.c < GRID.cols && p.r >= 0 && p.r < GRID.rows);

    // 出怪队列
    stage.waves.forEach((w, wi) => {
      w.enemies.forEach(g => {
        let t = w.at;
        for (let i = 0; i < g.count; i++) {
          B.queue.push({ t, type: g.type, path: B.spawnCounter++ % B.paths.length, wave: wi });
          t += g.interval;
        }
      });
    });
    B.queue.sort((a, b) => a.t - b.t);

    // 单位（复制属性，应用协同/祝福）
    B.units = team.map((t, i) => {
      const st = Object.assign({}, t.stats);
      st.atk *= (1 + B.mods.atk) * (B.stageMods.playerAtk || 1);
      st.hp *= 1 + B.mods.hp;
      st.spd = st.spd / (1 + B.mods.as);
      st.range *= (1 + (B.mods.range || 0)) * (B.stageMods.playerRange || 1);
      return {
      idx: i, def: t.def, stats: st,
      hp: st.hp, maxHp: st.hp,
      deployed: false, cell: null, x: 0, y: 0, onPath: false,
      atkCd: 0, energy: 30, cdUntil: -999,
      atkAnim: 0, hitT: 0, face: 1,
      shield: 0, shieldT: 0, buffs: [],
      dead: false, respawns: 0
    };
    });

    resize();
    buildHud();
    buildRotateHint();
    buildBackground();
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);

    B.last = performance.now();
    B.raf = requestAnimationFrame(loop);
    setTimeout(() => { if (B && !B.over) { showBanner('布阵阶段', '放置英雄，潮水即将到来'); toast('拖动英雄卡到发光格部署 · 能量满后点英雄放大招'); } }, 300);
    if (opts.synergyText) setTimeout(() => { if (B && !B.over) toast(opts.synergyText); }, 1400);
    if (TW.Audio) { try { TW.Audio.bgm(B.trial ? 'trial' : 'battle'); } catch (e) {} }
    return B;
  }

  function destroy() {
    if (!B) return;
    cancelAnimationFrame(B.raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', onKey);
    B.wrap.classList.add('hidden');
    B.wrap.classList.remove('bullet-time');
    if (B.rotateEl && B.rotateEl.parentNode) B.rotateEl.remove();
    B.hud.innerHTML = '';
    B.cutin.classList.add('hidden');
    B = null;
  }

  function buildRotateHint() {
    const el = document.createElement('div');
    el.className = 'rotate-hint hidden';
    el.innerHTML = `<div class="rh-card">
      <div class="rh-icon">⟳</div>
      <b>请横屏游玩</b>
      <span>横屏视野更完整，战斗更爽</span>
      <button class="btn sm ghost">仍然继续</button>
    </div>`;
    B.wrap.appendChild(el);
    B.rotateEl = el;
    el.querySelector('button').onclick = () => {
      B.hintPause = false;
      B.rotDismissed = true;
      el.classList.add('hidden');
    };
    updateRotate();
  }

  function updateRotate() {
    if (!B || !B.rotateEl) return;
    const portrait = window.innerHeight > window.innerWidth;
    if (portrait && !B.rotDismissed) {
      B.rotateEl.classList.remove('hidden');
      B.hintPause = true;
    } else {
      B.rotateEl.classList.add('hidden');
      if (B.hintPause) B.hintPause = false;
    }
  }

  function resize() {
    if (!B) return;
    updateRotate();
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    B.dpr = dpr;
    B.canvas.width = Math.floor(w * dpr);
    B.canvas.height = Math.floor(h * dpr);
    B.canvas.style.width = w + 'px';
    B.canvas.style.height = h + 'px';
    B.scale = Math.min(w / W, h / H);
    B.ox = (w - W * B.scale) / 2;
    B.oy = (h - H * B.scale) / 2;
  }

  /* ---------- 背景缓存 ---------- */
  function buildBackground() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const tint = B.stage.tint || '#0a2730';
    const accent = B.stage.accent || '#3fe0d0';

    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#04121a');
    grd.addColorStop(0.45, tint);
    grd.addColorStop(1, '#03080d');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);

    // 远景光
    const rad = g.createRadialGradient(W * 0.5, H * 0.34, 40, W * 0.5, H * 0.34, 520);
    rad.addColorStop(0, hexA(accent, 0.18));
    rad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rad; g.fillRect(0, 0, W, H);

    // 遗迹剪影
    g.save();
    g.globalAlpha = 0.55;
    for (let layer = 0; layer < 2; layer++) {
      const baseY = 190 + layer * 46;
      const alpha = layer === 0 ? 0.5 : 0.8;
      g.fillStyle = 'rgba(3,10,15,' + alpha + ')';
      for (let i = 0; i < 9; i++) {
        const bw = 70 + ((i * 53 + layer * 31) % 80);
        const bh = 90 + ((i * 71 + layer * 47) % 150);
        const bx = i * 150 - 60 + layer * 30;
        g.fillRect(bx, baseY - bh, bw, bh + 200);
        // 拱门
        g.save();
        g.globalCompositeOperation = 'destination-out';
        g.beginPath();
        g.arc(bx + bw / 2, baseY - bh + 34, bw * 0.26, Math.PI, 0);
        g.rect(bx + bw * 0.24, baseY - bh + 34, bw * 0.52, bh);
        g.fill();
        g.restore();
      }
    }
    g.restore();

    // 晶体点缀
    for (let i = 0; i < 26; i++) {
      const x = (i * 197 + 61) % W, y = 60 + ((i * 83) % 360);
      const s = 2 + (i % 4);
      g.save();
      g.translate(x, y); g.rotate((i % 7) * 0.4);
      g.fillStyle = hexA(accent, 0.25 + (i % 3) * 0.1);
      g.shadowColor = accent; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(0, -s * 2.4); g.lineTo(s, 0); g.lineTo(0, s * 2.4); g.lineTo(-s, 0); g.closePath(); g.fill();
      g.restore();
    }

    // 网格底座
    const gx = GRID.x, gy = GRID.y, gw = GRID.cols * CELL, gh = GRID.rows * CELL;
    g.save();
    g.fillStyle = 'rgba(4,14,20,.45)';
    roundRect(g, gx, gy, gw, gh, 18); g.fill();
    g.strokeStyle = 'rgba(127,243,230,.12)';
    g.lineWidth = 1;
    for (let c = 0; c <= GRID.cols; c++) {
      g.beginPath(); g.moveTo(gx + c * CELL, gy); g.lineTo(gx + c * CELL, gy + gh); g.stroke();
    }
    for (let r = 0; r <= GRID.rows; r++) {
      g.beginPath(); g.moveTo(gx, gy + r * CELL); g.lineTo(gx + gw, gy + r * CELL); g.stroke();
    }
    g.restore();

    // 可部署格标记
    g.save();
    B.deployable.forEach(p => {
      const cx = gx + p.c * CELL + CELL / 2;
      const cy = gy + p.r * CELL + CELL / 2;
      g.strokeStyle = 'rgba(127,243,230,.18)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(cx, cy - 5); g.lineTo(cx + 5, cy); g.lineTo(cx, cy + 5); g.lineTo(cx - 5, cy); g.closePath();
      g.stroke();
    });
    g.restore();

    // 路径
    const pathG = g.createLinearGradient(gx, 0, gx + gw, 0);
    pathG.addColorStop(0, hexA(accent, 0.08));
    pathG.addColorStop(0.5, hexA(accent, 0.20));
    pathG.addColorStop(1, hexA(accent, 0.08));
    g.save();
    g.lineWidth = CELL * 0.8;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = pathG;
    B.paths.forEach(pts => {
      g.beginPath();
      pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      g.stroke();
    });
    g.lineWidth = 2;
    g.strokeStyle = hexA(accent, 0.34);
    B.paths.forEach(pts => {
      g.beginPath();
      pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      g.stroke();
    });
    g.restore();

    // 边缘晶体
    const spots = [[gx - 36, gy + 40], [gx - 28, gy + 300], [gx + gw + 34, gy + 90], [gx + gw + 26, gy + 360], [gx + 90, gy + gh + 34], [gx + 520, gy + gh + 30]];
    spots.forEach((sp, si) => {
      for (let k = 0; k < 2; k++) {
        const cx = sp[0] + k * 16, cy = sp[1] - k * 8;
        const h = 18 + (si % 3) * 8, w = 6 + (si % 2) * 3;
        g.save();
        g.fillStyle = hexA(accent, 0.16 + (si % 3) * 0.05);
        g.strokeStyle = hexA(accent, 0.38);
        g.lineWidth = 1;
        g.shadowColor = accent; g.shadowBlur = 12;
        g.beginPath();
        g.moveTo(cx, cy - h); g.lineTo(cx + w, cy); g.lineTo(cx, cy + 6); g.lineTo(cx - w, cy);
        g.closePath(); g.fill(); g.stroke();
        g.restore();
      }
    });

    // 四角括号
    g.save();
    g.strokeStyle = 'rgba(127,243,230,.28)';
    g.lineWidth = 2;
    const pad = 10, len = 26;
    [[gx - pad, gy - pad, 1, 1], [gx + gw + pad, gy - pad, -1, 1], [gx - pad, gy + gh + pad, 1, -1], [gx + gw + pad, gy + gh + pad, -1, -1]].forEach(c => {
      g.beginPath();
      g.moveTo(c[0] + c[2] * len, c[1]);
      g.lineTo(c[0], c[1]);
      g.lineTo(c[0], c[1] + c[3] * len);
      g.stroke();
    });
    g.restore();

    // 暗角
    const vg = g.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 760);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.58)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    B.bg = c;
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* ---------- HUD ---------- */
  function buildHud() {
    const cards = B.units.map((u, i) => `
      <div class="hcard" data-idx="${i}">
        <div class="hc-art">${TW.Art ? TW.Art.figure(u.def, { mini: true }) : ''}</div>
        <div class="hc-cost">${u.def.cost}</div>
        <div class="hc-ult">✦</div>
        <div class="hc-name">${u.def.name}</div>
      </div>`).join('');

    B.hud.innerHTML = `
      <div class="bh-top">
        <div class="bh-name">${B.stage.name}<small>${B.stage.chapterName || ''} · 推荐战力 ${B.stage.recommendedPower}</small></div>
        <div class="bh-wave">波次 <b id="bhWave">准备</b></div>
        <div class="bh-hp"><span class="hearts" id="bhHearts"></span><span id="bhHpNum">${B.baseHp}</span></div>
        <button class="bh-btn" id="bhSpeed">1×</button>
        <button class="bh-btn wide ${B.auto ? 'on' : ''}" id="bhAuto">自动大招</button>
        <button class="bh-btn" id="bhPause">‖</button>
        <button class="bh-btn" id="bhExit" title="退出战斗">✕</button>
      </div>
      <div class="bh-energy"><span class="orb"></span><span id="bhEnergy">12</span>/30</div>
      <div class="bh-tip hidden" id="bhTip">点击高亮格部署 · 再次点击卡片取消</div>
      <div class="bh-combo hidden" id="bhCombo"><span class="n">0</span><span class="lbl">连击</span><i class="bar"><b></b></i></div>
      <div class="bh-spells" id="bhSpells">
        <button class="spell" data-spell="freeze" title="霜潮（Q）"><span class="ico">❄</span><span class="nm">霜潮</span><span class="cd"></span></button>
        <button class="spell" data-spell="meteor" title="陨潮（W）"><span class="ico">☄</span><span class="nm">陨潮</span><span class="cd"></span></button>
        <button class="spell" data-spell="heal" title="回潮（E）"><span class="ico">✚</span><span class="nm">回潮</span><span class="cd"></span></button>
        <button class="burst-btn" id="bhBurst" title="潮汐觉醒（R）"><span class="fill"></span><span class="txt">觉醒</span></button>
      </div>
      <button class="bh-wavecall hidden" id="bhWaveCall" title="提前召唤下一波（N）"><span class="t">提前召唤</span><span class="d">+8 潮能 · +500 金币</span></button>
      <div class="wave-banner hidden" id="bhBanner"><span class="wave-no">准备</span><span class="wave-sub"></span></div>
      <div class="bh-cards" id="bhCards">${cards}</div>
      <div class="bt-overlay" id="btOverlay">
        <span class="bt-title">潮汐迟滞</span>
        <span class="bt-sub">BULLET TIME</span>
      </div>
      <div class="pause-panel hidden" id="bhPausePanel">
        <div class="pause-card">
          <div class="panel-title">PAUSED</div>
          <h2>潮水暂歇</h2>
          <div class="pause-actions">
            <button class="btn gold" data-p="resume">继续战斗</button>
            <button class="btn ghost" data-p="restart">重新开始</button>
            <button class="btn ghost" data-p="exit">退出战斗</button>
          </div>
        </div>
      </div>
    `;

    const hearts = B.hud.querySelector('#bhHearts');
    hearts.innerHTML = '<i></i>'.repeat(Math.min(B.baseMax, 20));
    B.hearts = Array.from(hearts.children);

    B.hud.querySelector('#bhSpeed').onclick = () => {
      setSpeed(B.speed === 1 ? 2 : B.speed === 2 ? 3 : 1);
    };
    B.hud.querySelector('#bhAuto').onclick = (e) => {
      B.auto = !B.auto;
      e.currentTarget.classList.toggle('on', B.auto);
      toast(B.auto ? '自动大招：开' : '自动大招：关');
    };
    B.hud.querySelector('#bhPause').onclick = togglePause;
    B.hud.querySelector('#bhExit').onclick = quitBattle;
    B.hud.querySelector('#bhWaveCall').onclick = callNextWave;
    B.hud.querySelector('#bhBurst').onclick = activateBurst;
    B.hud.querySelectorAll('.spell').forEach(btn => {
      btn.onclick = () => castSpell(btn.dataset.spell);
    });
    B.hud.querySelectorAll('#bhPausePanel [data-p]').forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.p;
        if (p === 'resume') togglePause(false);
        else if (p === 'restart') restartBattle();
        else if (p === 'exit') quitBattle();
      };
    });

    B.cardEls = Array.from(B.hud.querySelectorAll('.hcard'));
    B.cardEls.forEach(el => {
      const i = +el.dataset.idx;
      el.addEventListener('pointerdown', ev => startDrag(ev, i));
    });

    B.canvas.addEventListener('pointerdown', onCanvasDown);
    B.canvas.addEventListener('pointermove', onCanvasMove);
    B.canvas.addEventListener('pointerleave', () => { if (B) B.hover = null; });
  }

  function toast(t) { if (TW.toast) TW.toast(t); }

  function syncHud() {
    if (!B) return;
    const e = B.hud.querySelector('#bhEnergy');
    if (e) e.textContent = Math.floor(B.energy);
    const hn = B.hud.querySelector('#bhHpNum');
    if (hn) hn.textContent = B.baseHp;
    const wv = B.hud.querySelector('#bhWave');
    if (wv) wv.textContent = B.waveIndex > 0
      ? Math.min(B.totalWaves, B.waveIndex) + '/' + B.totalWaves
      : '准备';
    const tip = B.hud.querySelector('#bhTip');
    if (tip) {
      const anyDeployed = B.units.some(x => x.deployed);
      if (B.selected >= 0) {
        const su = B.units[B.selected];
        tip.textContent = (su && su.def.role === 'guard')
          ? '子弹时间 · 战士可放在道路上 · 点击高亮格部署'
          : '子弹时间 · 点击高亮格部署 · 再次点击卡片取消';
        tip.classList.remove('hidden');
      } else if (!anyDeployed) {
        tip.textContent = '拖动英雄卡到发光格部署';
        tip.classList.remove('hidden');
      } else {
        tip.classList.add('hidden');
      }
    }
    if (B.hearts) {
      const n = B.hearts.length;
      const filled = Math.ceil(B.baseHp / Math.max(1, B.baseMax) * n);
      B.hearts.forEach((h, i) => h.classList.toggle('off', i >= filled));
    }

    const comboEl = B.hud.querySelector('#bhCombo');
    if (comboEl) {
      if (B.combo >= 2) {
        comboEl.classList.remove('hidden');
        comboEl.classList.toggle('hot', B.combo >= 10);
        const n = comboEl.querySelector('.n');
        if (n) {
          if (B.lastComboUI !== B.combo) {
            B.lastComboUI = B.combo;
            n.classList.remove('pop');
            void n.offsetWidth;
            n.classList.add('pop');
          }
          n.textContent = B.combo;
        }
        const bar = comboEl.querySelector('.bar b');
        if (bar) bar.style.width = Math.max(0, Math.min(100, B.comboT / 2.5 * 100)) + '%';
      } else comboEl.classList.add('hidden');
    }
    const burstBtn = B.hud.querySelector('#bhBurst');
    if (burstBtn) {
      burstBtn.classList.toggle('ready', !!B.burstReady);
      burstBtn.classList.toggle('active', B.burstT > 0);
      const fill = burstBtn.querySelector('.fill');
      if (fill) fill.style.width = Math.min(100, B.burst) + '%';
      const txt = burstBtn.querySelector('.txt');
      if (txt) txt.textContent = B.burstT > 0 ? '觉醒中 ' + Math.ceil(B.burstT) : (B.burstReady ? '觉醒' : '觉醒 ' + Math.floor(B.burst) + '%');
    }
    B.spells.forEach(sp => {
      const btn = B.hud.querySelector('.spell[data-spell="' + sp.id + '"]');
      if (!btn) return;
      btn.classList.toggle('ready', sp.left <= 0);
      btn.classList.toggle('cooling', sp.left > 0);
      const cd = btn.querySelector('.cd');
      if (cd) cd.textContent = sp.left > 0 ? Math.ceil(sp.left) : '';
    });
    const wc = B.hud.querySelector('#bhWaveCall');
    if (wc) {
      wc.classList.toggle('hidden', !B.waveCallReady);
      wc.classList.toggle('ready', !!B.waveCallReady);
    }

    B.units.forEach((u, i) => {
      const el = B.cardEls[i]; if (!el) return;
      el.classList.toggle('deployed', u.deployed);
      el.classList.toggle('selected', B.selected === i);
      const cooling = !u.deployed && u.cdUntil > B.time;
      el.classList.toggle('cant', (!u.deployed && B.energy < u.def.cost) || cooling);
      el.classList.toggle('ready', u.deployed && u.energy >= 100);
      const nm = el.querySelector('.hc-name');
      if (nm) {
        nm.textContent = cooling
          ? '复活 ' + Math.ceil(u.cdUntil - B.time) + 's'
          : u.def.name;
      }
    });
  }

  /* ---------- 交互 ---------- */
  function screenToCell(cx, cy) {
    const r = B.canvas.getBoundingClientRect();
    const x = (cx - r.left - B.ox) / B.scale;
    const y = (cy - r.top - B.oy) / B.scale;
    const c = Math.floor((x - GRID.x) / CELL);
    const rr = Math.floor((y - GRID.y) / CELL);
    if (c < 0 || c >= GRID.cols || rr < 0 || rr >= GRID.rows) return null;
    return { c, r: rr };
  }

  function isPathCell(c, r) {
    return B.pathSet.has(c + ',' + r);
  }

  function cellFree(c, r) {
    return !B.units.some(u => u.deployed && u.cell && u.cell.c === c && u.cell.r === r);
  }

  function cellAllowed(u, c, r) {
    if (B.deployable.some(p => p.c === c && p.r === r)) return true;
    return !!u && u.def.role === 'guard' && isPathCell(c, r);
  }

  function onCanvasDown(ev) {
    if (!B || B.over) return;
    const cell = screenToCell(ev.clientX, ev.clientY);
    if (!cell) return;
    // 点击已部署英雄 → 放大招
    const u = B.units.find(x => x.deployed && x.cell && x.cell.c === cell.c && x.cell.r === cell.r);
    if (u) {
      B.selected = -1;
      setPlaceSlow(false);
      if (u.energy >= 100) castUlt(u);
      return;
    }
    if (B.selected >= 0) tryDeploy(B.selected, cell.c, cell.r);
  }

  function onCanvasMove(ev) {
    if (!B) return;
    B.hover = screenToCell(ev.clientX, ev.clientY);
  }

  function startDrag(ev, idx) {
    if (!B || B.over) return;
    if (B.selected === idx) {
      B.selected = -1;
      B.hover = null;
      setPlaceSlow(false);
      syncHud();
      return toast('已取消选择');
    }
    const u = B.units[idx];
    if (u.deployed) {
      if (u.energy >= 100) castUlt(u);
      else toast('该英雄已部署');
      return;
    }
    if (u.cdUntil > B.time) { toast('复活中…'); return; }
    if (B.energy < u.def.cost) { toast('潮能不足'); return; }
    ev.preventDefault();
    B.selected = idx;
    setPlaceSlow(true);
    const sx = ev.clientX, sy = ev.clientY;
    let moved = false;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `<div class="hcard" style="width:76px"><div class="hc-art" style="height:60px">${TW.Art ? TW.Art.figure(u.def, { mini: true }) : ''}</div></div>`;
    document.body.appendChild(ghost);
    const move = e => {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
      ghost.style.left = (e.clientX - 38) + 'px';
      ghost.style.top = (e.clientY - 50) + 'px';
      const cell = screenToCell(e.clientX, e.clientY);
      B.hover = cell;
    };
    move(ev);
    const up = e => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      ghost.remove();
      if (!moved) {
        // 单击选择，再点地面部署
        B.selected = idx;
        toast('已选择 ' + u.def.name + ' · 点击高亮格部署');
        return;
      }
      const cell = screenToCell(e.clientX, e.clientY);
      if (cell) tryDeploy(idx, cell.c, cell.r);
      B.selected = -1;
      setPlaceSlow(false);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  function tryDeploy(idx, c, r) {
    const u = B.units[idx];
    if (!u || u.deployed) return;
    if (u.cdUntil > B.time) return toast('复活中…');
    if (B.energy < u.def.cost) return toast('潮能不足');
    if (!cellAllowed(u, c, r)) {
      if (isPathCell(c, r) && u.def.role !== 'guard') return toast('只有战士能放在道路上');
      return toast('这里不能部署');
    }
    if (!cellFree(c, r)) return toast('这里不能部署');
    B.energy -= u.def.cost;
    u.deployed = true;
    u.cell = { c, r };
    u.onPath = isPathCell(c, r);
    const p = CELL_CENTER(c, r);
    u.x = p.x; u.y = p.y;
    u.hp = u.maxHp; u.energy = 30; u.atkCd = 0.2; u.shield = 0;
    B.selected = -1;
    setPlaceSlow(false);
    burst(p.x, p.y, 18, elementColor(u.def.element), 160, 0.5);
    ring(p.x, p.y, elementColor(u.def.element), 0.5, 46);
    sfx('deploy');
    syncHud();
  }

  function castUlt(u) {
    if (!B || u.energy < 100 || u._casting) return;
    u.energy = 0; u._casting = true; B.ults++;
    B.ultSlowT = 0.55;
    showCutin(u);
    setTimeout(() => {
      if (!B) return;
      applyUlt(u);
      u._casting = false;
    }, 420);
    sfx('ult');
  }

  function showCutin(u) {
    const el = B.cutin;
    el.innerHTML = `
      <div class="ci-shrink"></div>
      <div class="ci-band"></div>
      <div class="ci-lines"></div>
      <div class="ci-fig">${TW.Art ? TW.Art.figure(u.def, { big: true }) : ''}</div>
      <div class="ci-txt">
        <div class="k">${'潮能解放'.split('').join(' ')}</div>
        <h2>${u.def.skill.name}</h2>
        <p>${u.def.name} · ${u.def.title}</p>
      </div>
      <div class="ci-flash"></div>`;
    el.classList.remove('hidden');
    setTimeout(() => { if (B) el.classList.add('hidden'); }, 1150);
  }

  function applyUlt(u) {
    if (!B) return;
    const s = u.def.skill;
    const atk = u.stats.atk * (1 + buffOf(u, 'atk')) * (1 + (B.mods.ultDmg || 0));
    const targets = B.enemies.filter(e => e.alive);
    const color = elementColor(u.def.element);

    const hb = u.def.passive.key === 'healBoost' ? 1 + u.def.passive.value : 1;
    if (s.kind === 'healGuard') {
      const injuredGuards = B.units.filter(x => x.deployed && x.hp > 0 && x.def.role === 'guard' && x.hp < x.maxHp * 0.98)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      const t = injuredGuards[0] || B.units.filter(x => x.deployed && x.hp > 0)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (t) {
        const boost = (u.def.passive.key === 'medic' && t.def.role === 'guard' ? 1 + (u.def.passive.value || 0) : 1);
        const mult = t.def.role === 'guard' ? s.mult : (s.fallback || s.mult * 0.6);
        healUnit(t, atk * mult * boost + (t.def.role === 'guard' ? t.maxHp * 0.08 * boost : 0), true);
        if (s.shield) {
          t.shield = Math.max(t.shield, t.maxHp * s.shield);
          t.shieldT = Math.max(t.shieldT, s.shieldDur || 5);
        }
        ring(t.x, t.y, '#4fe0a0', 0.8, 64);
        beam(u.x, u.y, t.x, t.y, '#4fe0a0');
      }
      return;
    }
    if (s.kind === 'healAll') {
      B.units.filter(x => x.deployed).forEach(x => healUnit(x, atk * s.mult * hb, true));
      burst(u.x, u.y, 30, '#7ff3e6', 200, 0.8);
      return;
    }
    if (s.kind === 'healOne') {
      const pool = B.units.filter(x => x.deployed);
      const lowGuard = u.def.doctor ? pool.filter(x => x.def.role === 'guard' && x.hp < x.maxHp * 0.98)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : null;
      const low = lowGuard || pool.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (low) {
        let boost = hb;
        if (low.def.role === 'guard') {
          if (u.def.passive.key === 'medic') boost *= 1 + u.def.passive.value;
          else if (u.def.doctor) boost *= 1.15;
        }
        healUnit(low, atk * s.mult * boost, true);
      }
      return;
    }
    if (s.kind === 'buff') {
      B.units.filter(x => x.deployed).forEach(x => {
        x.buffs.push({ id: 'ult', stat: u.def.id === 'fengling' ? 'as' : 'atk', value: s.value || 0, t: s.dur || 6 });
      });
      if (s.slow) B.enemies.forEach(e => { if (e.alive) e.slowT = Math.max(e.slowT, s.dur || 3); });
      burst(u.x, u.y, 26, color, 180, 0.7);
      ring(u.x, u.y, color, 0.8, 60);
      return;
    }
    if (s.kind === 'shield') {
      u.shield = u.maxHp * (s.value || 0.2);
      u.shieldT = s.taunt || s.dur || 5;
      u.tauntT = s.taunt || 0;
      if (s.taunt) {
        B.enemies.forEach(e => { if (e.alive && dist(e, u) < CELL * 2.2) e.taunt = u; });
      }
      if (s.thorns) u.thorns = s.thorns;
      burst(u.x, u.y, 22, color, 160, 0.7);
      return;
    }

    // 伤害类
    if (!targets.length) return;
    if (s.kind === 'single') {
      const t = targets.sort((a, b) => b.hp - a.hp)[0];
      const hits = s.hits || 1;
      for (let i = 0; i < hits; i++) {
        setTimeout(() => { if (B && t.alive) damageEnemy(t, atk * s.mult, { color, ignoreDef: s.ignoreDef, crit: false, element: u.def.element }); }, i * 90);
      }
      beam(u.x, u.y, t.x, t.y, color);
    } else if (s.kind === 'multi') {
      targets.sort((a, b) => dist(a, u) - dist(b, u)).slice(0, s.targets || 3).forEach(t => {
        damageEnemy(t, atk * s.mult, { color, ignoreDef: s.ignoreDef, element: u.def.element });
        beam(u.x, u.y, t.x, t.y, color);
      });
    } else {
      // aoe / pierce
      const center = densest(targets);
      const rad = (s.radius || 1.6) * CELL;
      B.enemies.forEach(e => {
        if (!e.alive) return;
        if (dist(e, center) <= rad) damageEnemy(e, atk * s.mult, { color, ignoreDef: s.ignoreDef, burn: s.burn, element: u.def.element });
      });
      ring(center.x, center.y, color, 0.75, rad);
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        burst(center.x + Math.cos(a) * rad * 0.5, center.y + Math.sin(a) * rad * 0.4, 3, color, 200, 0.6);
      }
      addShake(7);
    }
  }

  function densest(list) {
    let best = list[0], bestN = -1;
    list.forEach(a => {
      let n = 0;
      list.forEach(b => { if (dist(a, b) < CELL * 1.8) n++; });
      if (n > bestN) { bestN = n; best = a; }
    });
    return best;
  }


  /* ---------- v2.0 主动技能 ---------- */
  const SPELL_META = {
    freeze: { name: '霜潮' },
    meteor: { name: '陨潮' },
    heal: { name: '回潮' }
  };

  function avgAtk() {
    const arr = B.units.filter(u => u.deployed);
    if (!arr.length) return 100;
    return arr.reduce((a, u) => a + u.stats.atk, 0) / arr.length;
  }

  function showBanner(main, sub, ms) {
    if (!B) return;
    const el = B.hud.querySelector('#bhBanner');
    if (!el) return;
    const a = el.querySelector('.wave-no');
    const b = el.querySelector('.wave-sub');
    if (a) a.textContent = main;
    if (b) b.textContent = sub || '';
    el.classList.toggle('boss', /首领|BOSS|Boss/.test(String(main) + String(sub)));
    el.classList.remove('hidden', 'show');
    void el.offsetWidth;
    el.classList.add('show');
    if (B.bannerTimer) clearTimeout(B.bannerTimer);
    B.bannerTimer = setTimeout(() => { el.classList.remove('show'); el.classList.remove('boss'); }, ms || 2500);
  }

  function castSpell(id) {
    if (!B || B.over) return;
    const sp = B.spells.find(x => x.id === id);
    if (!sp || sp.left > 0) return;
    sp.left = sp.cd;
    B.spellsUsed++;
    sfx('spell_' + id);

    if (id === 'freeze') {
      B.enemies.forEach(e => { if (e.alive) { e.slowT = Math.max(e.slowT, 3.5); e.frozenT = 3.5; } });
      B.flash = 0.35;
      B.zoom = 1.03;
      B.zoomT = 0.45;
      ring(W / 2, H / 2, '#9ff7ff', 1.2, 760);
      for (let i = 0; i < 40; i++) {
        burst(rand(120, W - 120), rand(180, 560), 1, '#bff9ff', 90, 1.2);
      }
      showBanner('霜潮', '全场冻结 3.5 秒');
      addShake(4);
    } else if (id === 'meteor') {
      const target = B.enemies.length ? densest(B.enemies) : { x: W / 2, y: 360 };
      B.telegraphs.push({ kind: 'meteor', x: target.x, y: target.y, r: CELL * 2.3, t: 0.8, max: 0.8 });
      showBanner('陨潮', '潮心坠落，注意落点');
    } else if (id === 'heal') {
      const hb = 1;
      B.units.filter(u => u.deployed).forEach(u => {
        healUnit(u, u.maxHp * 0.35 * hb, true);
        u.shield = Math.max(u.shield, u.maxHp * 0.12);
        u.shieldT = Math.max(u.shieldT, 6);
      });
      B.units.filter(u => u.deployed).forEach(u => ring(u.x, u.y, '#7ff3e6', 0.7, 54));
      B.flash = 0.2;
      showBanner('回潮', '全队回复 35% 生命');
    }
    syncHud();
  }

  function activateBurst() {
    if (!B || !B.burstReady || B.over) return;
    B.burstReady = false;
    B.burst = 0;
    B.burstT = 8;
    B.units.filter(u => u.deployed).forEach(u => {
      u.buffs.push({ stat: 'atk', value: 0.3, t: 8 });
      u.buffs.push({ stat: 'as', value: 0.3, t: 8 });
      u.energy = Math.min(100, u.energy + 50);
    });
    B.flash = 0.55;
    B.zoom = 1.06;
    B.zoomT = 0.6;
    addShake(10);
    ring(W / 2, 330, '#ffe0a8', 1.1, 520);
    showBanner('潮汐觉醒', '全队攻击 / 攻速 +30% · 8 秒');
    sfx('burst');
    syncHud();
  }

  function callNextWave() {
    if (!B || !B.waveCallReady || B.over) return;
    B.waveCallCd = 8;
    B.lastWaveAt = B.time;
    B.waveCallReady = false;
    let n = 0;
    for (let i = B.qi; i < B.queue.length; i++) {
      if (B.queue[i].t > B.time) { B.queue[i].t = Math.max(B.time + 0.2, B.queue[i].t - 8); n++; }
    }
    B.energy = Math.min(MAX_ENERGY, B.energy + 8);
    B.goldEarned += 500;
    B.flash = 0.18;
    ring(W / 2, 360, '#ffca6b', 0.7, 420);
    showBanner('潮汐加速', n ? '下一波提前到来 · +8 潮能 · +500 金币' : '潮水已在路上');
    sfx('wave');
    syncHud();
  }

  function setPlaceSlow(on) {
    if (!B) return;
    B.placeSlow = !!on;
    if (B.wrap) B.wrap.classList.toggle('bullet-time', !!on);
    const ov = B.hud ? B.hud.querySelector('#btOverlay') : null;
    if (ov) ov.classList.toggle('on', !!on);
    if (on) B.zoom = Math.max(B.zoom, 1.02);
  }

  function setSpeed(n) {
    if (!B) return;
    B.speed = n === 3 ? 3 : n === 2 ? 2 : 1;
    const btn = B.hud.querySelector('#bhSpeed');
    if (btn) btn.textContent = B.speed + '×';
  }

  function togglePause(force) {
    if (!B || B.over) return;
    B.paused = force === undefined ? !B.paused : !!force;
    const panel = B.hud.querySelector('#bhPausePanel');
    if (panel) panel.classList.toggle('hidden', !B.paused);
    const btn = B.hud.querySelector('#bhPause');
    if (btn) { btn.textContent = B.paused ? '▶' : '‖'; btn.classList.toggle('on', B.paused); }
    if (TW.Audio) { try { B.paused ? TW.Audio.pause() : TW.Audio.resume(); } catch (e) {} }
    if (!B.paused) B.last = performance.now();
  }

  function restartBattle() {
    if (!B) return;
    const stage = B.stage;
    const cb = B.onRestart;
    destroy();
    if (cb) cb(stage);
    else if (TW.UI && TW.UI.openStage) TW.UI.openStage(stage.id);
  }

  function updateTelegraphs(dt) {
    B.telegraphs.forEach(tg => {
      tg.t -= dt;
      if (tg.t <= 0 && !tg.done) {
        tg.done = true;
        if (tg.kind === 'meteor') {
          const dmg = avgAtk() * 5;
          B.enemies.forEach(e => {
            if (e.alive && dist(e, tg) <= tg.r) damageEnemy(e, dmg, { color: '#ffca6b', burn: 4, element: 'ember' });
          });
          B.flash = 0.45;
          B.zoom = 1.05;
          B.zoomT = 0.5;
          addShake(12);
          ring(tg.x, tg.y, '#ffca6b', 0.9, tg.r * 1.1);
          ring(tg.x, tg.y, '#ff5c7a', 0.7, tg.r * 0.7);
          for (let i = 0; i < 34; i++) {
            const a = Math.random() * Math.PI * 2;
            burst(tg.x + Math.cos(a) * tg.r * 0.6, tg.y + Math.sin(a) * tg.r * 0.5, 2, '#ffca6b', 260, 0.8);
          }
          sfx('ult');
        } else if (tg.kind === 'slam') {
          B.units.filter(u => u.deployed).forEach(u => {
            if (dist(u, tg) <= tg.r) {
              const raw = u.maxHp * tg.dmg * (1 + (((B.diff && B.diff.enemyDmg) || 1) - 1) * 0.4);
              const dmg = heroDamage(u, raw, 800);
              u.hp -= dmg;
              u.hitT = 0.24;
              B.dmgTaken += dmg;
              addText(u.x, u.y - 52, dmg > 0.5 ? '-' + Math.round(dmg) : '护盾', dmg > 0.5 ? '#ff5c7a' : '#7ff3e6', dmg > 0.5);
              if (u.hp <= 0) heroDie(u);
            }
          });
          B.flash = 0.4;
          addShake(11);
          ring(tg.x, tg.y, '#ff5c7a', 0.7, tg.r);
          burst(tg.x, tg.y, 26, '#ff8a6a', 260, 0.8);
          sfx('boss');
        }
      }
    });
    B.telegraphs = B.telegraphs.filter(tg => !tg.done || tg.t > -0.35);
  }

  /* ---------- 循环 ---------- */
  function loop(ts) {
    if (!B) return;
    const raw = Math.min((ts - B.last) / 1000, 0.05);
    B.last = ts;
    if (B.ultSlowT > 0) B.ultSlowT = Math.max(0, B.ultSlowT - raw);
    B.timeScale = (B.ultSlowT > 0 ? 0.45 : 1) * (B.placeSlow ? 0.3 : 1);
    const effectiveSpeed = (B.placeSlow || B.ultSlowT > 0) ? 1 : B.speed;
    if (!B.paused && !B.over && !B.hintPause && !B.blessingPause) {
      if (B.hitStop > 0) B.hitStop -= raw;
      else update(raw * effectiveSpeed * B.timeScale);
    }
    render();
    if (!B.over) B.raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    B.time += dt;
    B.energyAcc += dt;
    while (B.energyAcc >= 0.9) { B.energyAcc -= 0.9; B.energy = Math.min(MAX_ENERGY, B.energy + 1); }

    if (B.shake > 0) B.shake = Math.max(0, B.shake - dt * 40);
    if (B.flash > 0) B.flash = Math.max(0, B.flash - dt * 4);
    if (B.zoom > 1) B.zoom = Math.max(1, B.zoom + (1 - B.zoom) * Math.min(1, dt * 5));
    B.spells.forEach(sp => { if (sp.left > 0) sp.left = Math.max(0, sp.left - dt); });
    if (B.comboT > 0) { B.comboT -= dt; if (B.comboT <= 0) B.combo = 0; }
    if (B.burstT > 0) B.burstT = Math.max(0, B.burstT - dt);
    if (B.burst >= 100) B.burstReady = true;
    B.waveCallCd = Math.max(0, B.waveCallCd - dt);
    B.waveCallReady = B.qi < B.queue.length && B.waveCallCd <= 0 && (B.time - B.lastWaveAt) > 5;
    updateTelegraphs(dt);

    // 出怪
    while (B.qi < B.queue.length && B.queue[B.qi].t <= B.time) {
      spawn(B.queue[B.qi]); B.qi++;
    }

    B.units.forEach(u => {
      if (!u.deployed) {
        if (u.cdUntil && u.cdUntil <= B.time) u.cdUntil = 0;
        return;
      }
      u.buffs = u.buffs.filter(b => (b.t -= dt) > 0);
      if (u.shieldT > 0) u.shieldT -= dt; else if (u.shield) u.shield = 0;
      if (u.skillCd > 0) u.skillCd -= dt;
      updateHero(u, dt);
    });

    B.enemies.forEach(e => { if (e.alive) updateEnemy(e, dt); });
    B.enemies = B.enemies.filter(e => e.alive);

    updateProjectiles(dt);
    updateParticles(dt);
    updateTexts(dt);
    B.rings.forEach(r => { r.t += dt; r.life -= dt; });
    B.rings = B.rings.filter(r => r.life > 0);


    if (B.baseHp <= 0 && !B.over) endBattle(false);
    if (B.qi >= B.queue.length && B.enemies.length === 0 && !B.over && B.time > 1) endBattle(true);
    syncHudThrottled();
  }

  let hudAcc = 0;
  function syncHudThrottled() {
    hudAcc += 1;
    if (hudAcc % 5 === 0) syncHud();
  }

  function buffOf(u, stat) {
    return u.buffs.filter(b => b.stat === stat).reduce((a, b) => a + b.value, 0);
  }

  function updateHero(u, dt) {
    if (u.hp <= 0) return;
    if (u.atkAnim > 0) u.atkAnim = Math.max(0, u.atkAnim - dt);
    if (u.hitT > 0) u.hitT = Math.max(0, u.hitT - dt);
    const as = u.stats.spd / (1 + buffOf(u, 'as') + (u.def.passive.key === 'asPct' ? u.def.passive.value : 0));
    u.atkCd -= dt;
    // 能量
    let rate = (9 + (B.mods.energy || 0)) * (B.stageMods.energy || 1);
    if (u.def.passive.key === 'energy') rate += u.def.passive.value;
    if (u.def.passive.key === 'cdr') rate *= 1 + u.def.passive.value;
    u.energy = Math.min(100, u.energy + dt * rate);

    if (u.energy >= 100 && B.auto) castUlt(u);

    // 随军医师：持续照看生命最低的战士（不受攻击冷却影响）
    if (u.def.passive.key === 'medic') {
      u.medicT = (u.medicT == null ? 1.2 : u.medicT) - dt;
      if (u.medicT <= 0) {
        u.medicT = u.def.passive.interval || 4;
        const gt = B.units.filter(x => x.deployed && x.def.role === 'guard' && x.hp > 0 && x.hp < x.maxHp * 0.98)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (gt) {
          const mb = 1 + (u.def.passive.value || 0);
          healUnit(gt, u.stats.atk * (u.def.passive.aura || 0.8) * mb + gt.maxHp * 0.015 * mb, false);
          beam(u.x, u.y - 20, gt.x, gt.y - 20, '#4fe0a0');
        }
      }
    }

    if (u.atkCd > 0) return;

    if (u.def.role === 'healer') {
      const isDoctor = !!(u.def.doctor || u.def.passive.key === 'medic');
      const hurtAll = B.units.filter(x => x.deployed && x.hp < x.maxHp * 0.92);
      let hurt = null;
      if (isDoctor) {
        hurt = hurtAll.filter(x => x.def.role === 'guard')
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
          || hurtAll.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      } else {
        hurt = hurtAll.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      }
      if (hurt) {
        let boost = 1;
        if (u.def.passive.key === 'healBoost') boost *= 1 + u.def.passive.value;
        if (hurt.def.role === 'guard') {
          if (u.def.passive.key === 'medic') boost *= 1 + u.def.passive.value;
          else if (u.def.doctor) boost *= 1.15;
        }
        healUnit(hurt, u.stats.atk * 0.85 * boost + (hurt.def.role === 'guard' ? hurt.maxHp * 0.02 * boost : 0), false);
        if (isDoctor && hurt.def.role === 'guard') {
          beam(u.x, u.y - 20, hurt.x, hurt.y - 20, '#4fe0a0');
        }
        u.energy = Math.min(100, u.energy + 7);
        u.atkCd = as;
        return;
      }
    }

    const target = findTarget(u);
    if (!target) return;
    u.atkCd = as;
    u.atkAnim = 0.22;
    u.face = target.x >= u.x ? 1 : -1;
    u.energy = Math.min(100, u.energy + 6);
    fire(u, target);
    // 守护被动
    if (u.def.passive.key === 'tank') {
      B.enemies.forEach(e => {
        if (e.alive && dist(e, u) < CELL * 1.4 && e !== target) {
          e.hp -= u.stats.atk * 0.6; e.hitT = 0.12;
        }
      });
    }
  }

  function findTarget(u) {
    const range = u.stats.range * CELL;
    const canAir = u.def.role !== 'guard';
    let best = null, bd = 1e9;
    B.enemies.forEach(e => {
      if (!e.alive) return;
      if (e.flying && !canAir) return;
      const d = dist(e, u);
      if (d <= range + e.r && d < bd) { bd = d; best = e; }
    });
    return best;
  }

  function fire(u, t) {
    const color = elementColor(u.def.element);
    const crit = Math.random() < (0.05 + (u.def.passive.key === 'crit' ? u.def.passive.value : 0) + (B.mods.crit || 0));
    const dmg = u.stats.atk * (1 + buffOf(u, 'atk')) * (crit ? 1.5 : 1);
    B.projectiles.push({
      x: u.x, y: u.y - 16, target: t, speed: 780,
      dmg, crit, color, from: u, element: u.def.element,
      trail: []
    });
    sfx('shoot');
  }

  function updateProjectiles(dt) {
    B.projectiles.forEach(p => {
      if (!p.target || !p.target.alive) {
        // 目标死亡则打向最近敌人
        let best = null, bd = 1e9;
        B.enemies.forEach(e => { if (e.alive) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } } });
        p.target = best;
      }
      if (!p.target) { p.dead = true; return; }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = p.speed * dt;
      if (d <= step + p.target.r) {
        damageEnemy(p.target, p.dmg, { crit: p.crit, color: p.color, element: p.element });
        p.dead = true;
        burst(p.x, p.y, 6, p.color, 140, 0.35);
      } else {
        p.x += dx / d * step; p.y += dy / d * step;
        p.trail.push({ x: p.x, y: p.y, t: 0.16 });
      }
      if (p.trail.length) {
        p.trail.forEach(q => q.t -= dt);
        p.trail = p.trail.filter(q => q.t > 0);
      }
    });
    B.projectiles = B.projectiles.filter(p => !p.dead);
  }

  function damageEnemy(e, raw, opt) {
    if (!e.alive) return;
    opt = opt || {};
    const ignore = opt.ignoreDef || 0;
    const red = (e.defVal * (1 - ignore)) / (e.defVal * (1 - ignore) + 400);
    let dmg = raw * (1 - red);
    if (opt.element) {
      if (ELEM_ADV[opt.element] === e.element) dmg *= 1.25;
      else if (ELEM_ADV[e.element] === opt.element) dmg *= 0.8;
    }
    if (e.armor) dmg *= 1 - e.armor;
    if (opt.burn) { e.burnT = Math.max(e.burnT, opt.burn); e.burnDps = Math.max(e.burnDps, raw * 0.12 * ((B.stageMods && B.stageMods.burn) || 1)); }
    if (e.taunt) { /* 仇恨不影响伤害 */ }
    dmg *= rand(0.95, 1.05);
    // 护盾
    if (e.shield > 0) {
      const s = Math.min(e.shield, dmg);
      e.shield -= s; dmg -= s;
    }
    e.hp -= dmg;
    e.hitT = 0.12;
    B.dmgDealt += dmg;
    addText(e.x + rand(-8, 8), e.y - e.r - 8, Math.round(dmg), opt.crit ? '#ffca6b' : '#eaf7f7', opt.crit);
    if (opt.crit) { addShake(2); }
    if (e.hp <= 0) killEnemy(e);
    if (B) B.hitStop = Math.max(B.hitStop, opt.crit ? 0.045 : 0.02);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    B.kills++;
    cursorBurstAt(e.x, e.y, e.type === 'boss' ? 'boss' : e.type === 'elite' ? 'elite' : 'kill');
    B.combo += 1;
    B.comboT = 2.5;
    B.comboMax = Math.max(B.comboMax || 0, B.combo);
    B.burst = Math.min(100, B.burst + (e.type === 'boss' ? 25 : e.type === 'elite' ? 10 : 3));
    if (B.burst >= 100) B.burstReady = true;
    if (B.combo % 10 === 0) {
      B.energy = Math.min(MAX_ENERGY, B.energy + 2);
      showBanner('连击 x' + B.combo, '潮能 +2 · 觉醒值上涨');
      sfx('combo');
    }
    B.energy = Math.min(MAX_ENERGY, B.energy + (e.type === 'elite' ? 3 : e.type === 'boss' ? 8 : 0.4));
    if (e.type === 'boss') {
      burst(e.x, e.y, 80, '#ffe0a8', 380, 0.9);
      shardBurst(e.x, e.y, 26, '#ffca6b', 300, 1.1);
      ring(e.x, e.y, '#ffe0a8', 0.9, 190);
      ring(e.x, e.y, '#ff5c7a', 0.7, 130);
      addShake(14);
      B.flash = 0.6;
      setTimeout(() => { if (B && TW.Audio) { try { TW.Audio.bgm(B.trial ? 'trial' : 'battle'); } catch (err) {} } }, 2600);
    } else if (e.type === 'elite') {
      burst(e.x, e.y, 34, '#c08cff', 240, 0.8);
      shardBurst(e.x, e.y, 10, '#c08cff', 220, 0.8);
      ring(e.x, e.y, '#c08cff', 0.6, e.r * 4);
      addShake(5);
    } else if (e.type === 'flyer') {
      burst(e.x, e.y, 22, '#b58cff', 120, 0.9);
      ring(e.x, e.y, '#b58cff', 0.5, e.r * 3);
    } else if (e.type === 'summon') {
      burst(e.x, e.y, 26, '#c08cff', 200, 0.8);
      ring(e.x, e.y, '#c08cff', 0.6, e.r * 3.5);
    } else if (e.type === 'brute' || e.type === 'shield') {
      burst(e.x, e.y, 20, e.color, 200, 0.7);
      shardBurst(e.x, e.y, 7, shade(e.color, 0.2), 200, 0.8);
      ring(e.x, e.y, e.color, 0.5, e.r * 3);
    } else {
      burst(e.x, e.y, 16, e.color, 190, 0.7);
      ring(e.x, e.y, e.color, 0.45, e.r * 3);
    }
    if (B.mods.gold) B.goldBonus = (B.goldBonus || 0) + Math.round(10 * B.mods.gold);
    if (e.split && !e.isSplit) {
      spawnAdd(e, 'grunt', e.x - 18, e.y, 0.45, true);
      spawnAdd(e, 'grunt', e.x + 18, e.y, 0.45, true);
      ring(e.x, e.y, '#c08cff', 0.5, e.r * 3.2);
    }
    // 被动：击杀收益
    B.units.forEach(u => {
      if (!u.deployed) return;
      if (u.def.passive.key === 'gold') B.goldBonus = (B.goldBonus || 0) + u.def.passive.value;
      if (u.def.passive.key === 'killHaste') u.buffs.push({ stat: 'as', value: u.def.passive.value, t: 4, id: 'kill' });
    });
  }

  function healUnit(u, amount, big) {
    if (!u.deployed || u.hp <= 0) return;
    amount *= 1 + (B.mods.heal || 0);
    const real = Math.min(amount, u.maxHp - u.hp);
    u.hp += real;
    B.healed += real;
    if (real >= 1) {
      addText(u.x, u.y - 40, '+' + Math.round(real), '#4fe0a0', false);
      burst(u.x, u.y, big ? 20 : 6, '#4fe0a0', 120, 0.5);
    }
  }

  function heroDamage(u, raw, k) {
    const def = (u.stats && u.stats.def) || 0;
    let dmg = raw * (1 - def / (def + (k || 700)));
    if (u.def.passive && u.def.passive.key === 'tank') dmg *= 1 - (u.def.passive.value || 0);
    const sh = u.shield || 0;
    if (sh > 0) {
      const use = Math.min(sh, dmg);
      u.shield = sh - use;
      dmg -= use;
    }
    return Math.max(0, dmg);
  }

  function spawn(q) {
    B.waveIndex = Math.max(B.waveIndex, (q.wave || 0) + 1);
    if (q.wave !== B.lastSpawnWave) {
      B.lastSpawnWave = q.wave;
      B.lastWaveAt = B.time;
      showBanner('WAVE ' + (q.wave + 1) + ' / ' + B.totalWaves, q.type === 'boss' ? '首领来袭' : (B.trial ? '深渊回廊' : '潮水逼近'));
      if (B.trial && B.onBlessing && (B.waveIndex === 10 || B.waveIndex === 20) && !B.blessingWaves[B.waveIndex]) {
        B.blessingWaves[B.waveIndex] = true;
        B.blessingPause = true;
        B.selected = -1;
        setPlaceSlow(false);
        B.onBlessing(B.waveIndex);
      }
    }
    const def = TW.DATA.ENEMIES[q.type];
    if (!def) return;
    const pts = B.paths[q.path];
    const gi = (B.stage.global || 1) + (B.trial ? Math.floor((q.wave || 0) / 3) : 0);
    const mods = B.stageMods || {};
    const diff = B.diff || { enemyHp:1, enemyDmg:1, enemySpeed:1, leakMul:1 };
    const typeMul = q.type === 'boss' ? 1.4 : q.type === 'elite' ? 1.2 : 1;
    const gk = gi - 1;
    const mult = (1 + 0.16 * gk) * (mods.enemyHp || 1) * diff.enemyHp * typeMul;
    const atkMult = 1 + 0.09 * (gi - 1);
    const e = {
      type: q.type, name: def.name,
      x: pts[0].x, y: pts[0].y, seg: 0,
      hp: def.hp * mult, maxHp: def.hp * mult,
      speed: def.spd * (mods.enemySpeed || 1) * diff.enemySpeed, r: def.r, color: def.color,
      dmg: def.dmg * (1 + 0.05 * (gi - 1)) * (mods.enemyDmg || 1) * diff.enemyDmg,
      leak: def.dmg > 5 ? 10 : Math.max(1, Math.ceil(def.dmg * (diff.leakMul || 1))),
      defVal: 6 + gi * 1.6,
      armor: def.armor || 0, regen: def.regen || 0, healAura: def.healAura || 0,
      split: !!def.split, charge: def.charge || 0, chargeT: 0, speedBoost: 1,
      healTick: 0, castCd: 7, phase2: false, phase3: false,
      element: B.stageElement,
      shield: def.shield ? def.hp * mult * def.shield : 0,
      shieldCd: 6, alive: true, slowT: 0, hitT: 0,
      burnT: 0, burnDps: 0, atkCd: 0, summonCd: def.summon || 0,
      flying: !!def.flying, shape: def.shape,
      path: pts, taunt: null, boss: q.type === 'boss', dir: 1, seed: Math.random() * 10
    };
    if (e.boss) {
      B.bossRef = e;
      B.flash = 0.25;
      addShake(5);
      ring(e.x, e.y, '#ffca6b', 0.9, 70);
      if (TW.Audio) { try { TW.Audio.bgm('boss'); } catch (err) {} }
    }
    B.enemies.push(e);
    burst(e.x, e.y, 8, e.color, 100, 0.4);
    ring(e.x, e.y, hexA(e.color, 0.6), 0.4, e.r * 1.8);
  }

  function spawnAdd(e, type, x, y, hpMul, isSplit) {
    const def = TW.DATA.ENEMIES[type];
    if (!def) return null;
    const gi = (B.stage.global || 1) + (B.trial ? Math.floor((B.waveIndex || 1) / 3) : 0);
    const mods = B.stageMods || {};
    const diff = B.diff || { enemyHp:1, enemyDmg:1, enemySpeed:1, leakMul:1 };
    const gk = gi - 1;
    const mult = (1 + 0.16 * gk) * (mods.enemyHp || 1) * diff.enemyHp;
    const add = {
      type: type, name: def.name, x: x, y: y, seg: e.seg || 0,
      hp: def.hp * mult * hpMul, maxHp: def.hp * mult * hpMul,
      speed: def.spd * (mods.enemySpeed || 1) * diff.enemySpeed, r: def.r, color: def.color,
      dmg: def.dmg * diff.enemyDmg, leak: def.dmg > 5 ? 10 : Math.max(1, Math.ceil(def.dmg * (diff.leakMul || 1))), defVal: 6 + gi * 1.6,
      element: e.element, shield: 0, shieldCd: 99, alive: true,
      slowT: 0, hitT: 0, burnT: 0, burnDps: 0, atkCd: 0, summonCd: 0,
      flying: !!def.flying, shape: def.shape, path: e.path, taunt: null,
      boss: false, dir: e.dir || 1, seed: Math.random() * 10,
      armor: def.armor || 0, regen: def.regen || 0, healAura: 0,
      split: false, isSplit: !!isSplit, charge: 0, speedBoost: 1
    };
    B.enemies.push(add);
    burst(x, y, 5, add.color, 90, 0.35);
    return add;
  }

  function updateEnemy(e, dt) {
    if (e.hitT > 0) e.hitT -= dt;
    if (e.slowT > 0) e.slowT -= dt;
    if (e.frozenT > 0) e.frozenT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.hp -= e.burnDps * dt;
      if (Math.random() < dt * 8) burst(e.x, e.y, 1, '#ff8a5c', 60, 0.3);
      if (e.hp <= 0) { killEnemy(e); return; }
    }
    if (e.shieldCd > 0) e.shieldCd -= dt;
    else if (e.type === 'shield') { e.shield = e.maxHp * 0.3; e.shieldCd = 6; }

    if (e.summonCd > 0) e.summonCd -= dt;
    else if (e.type === 'summon') {
      e.summonCd = 8;
      spawnAdd(e, 'grunt', e.x, e.y, 0.8, false);
    }

    // 远程攻击英雄
    if (e.type === 'ranged' || e.type === 'boss') {
      e.atkCd -= dt;
      const hero = B.units.filter(u => u.deployed).sort((a, b) => dist(a, e) - dist(b, e))[0];
      if (hero && dist(hero, e) < CELL * 2.6 && e.atkCd <= 0) {
        e.atkCd = 2.2;
        const rRaw = 30 * (1 + 0.1 * (B.stage.global || 1)) + hero.maxHp * 0.02 * ((B.diff && B.diff.enemyDmg) || 1);
        const rDmg = heroDamage(hero, rRaw, 700);
        B.dmgTaken += rDmg;
        hero.hp -= rDmg;
        hero.hitT = 0.14;
        addText(hero.x, hero.y - 46, rDmg > 0.5 ? '-' + Math.round(rDmg) : '护盾', rDmg > 0.5 ? '#ff5c7a' : '#7ff3e6', false);
        burst(hero.x, hero.y, 5, '#ff5c7a', 90, 0.3);
        if (hero.hp <= 0) heroDie(hero);
      }
    }

    if (e.regen) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.regen * dt);
    if (e.healAura) {
      e.healTick = (e.healTick || 0) - dt;
      if (e.healTick <= 0) {
        e.healTick = 0.5;
        B.enemies.forEach(o => {
          if (o !== e && o.alive && dist(o, e) < CELL * 2) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * e.healAura * 0.5);
        });
      }
    }
    let chargeBoost = 1;
    if (e.charge) {
      e.chargeT = (e.chargeT || e.charge) - dt;
      if (e.chargeT <= 0) { e.chargeT = e.charge; e.chargeDur = 1; }
      if (e.chargeDur > 0) {
        e.chargeDur -= dt;
        chargeBoost = 1.8;
        if (Math.random() < dt * 10) burst(e.x, e.y, 1, e.color, 60, 0.3);
      }
    }
    if (e.boss) {
      e.castCd = (e.castCd == null ? 7 : e.castCd) - dt;
      if (e.castCd <= 0) {
        const hs = B.units.filter(u => u.deployed);
        if (hs.length) {
          const tgt = densest(hs);
          B.telegraphs.push({ kind: 'slam', x: tgt.x, y: tgt.y, r: CELL * 1.7, t: 1.3, max: 1.3, dmg: 0.3 });
          sfx('boss');
        }
        e.castCd = 9;
      }
      if (!e.phase2 && e.hp < e.maxHp * 0.5) {
        e.phase2 = true;
        e.speedBoost = 1.3;
        B.bossPhase = 2;
        B.flash = 0.4;
        addShake(8);
        showBanner('首领 · 二阶段', '潮心碎裂，召唤增援');
        for (let i = 0; i < 4; i++) spawnAdd(e, 'grunt', e.x + rand(-40, 40), e.y + rand(-30, 30), 0.8, true);
        ring(e.x, e.y, '#ffca6b', 0.8, 150);
        sfx('boss');
      }
      if (!e.phase3 && e.hp < e.maxHp * 0.25) {
        e.phase3 = true;
        e.speedBoost = 1.55;
        B.bossPhase = 3;
        B.flash = 0.5;
        addShake(10);
        showBanner('首领 · 狂暴', '攻击与速度大幅提升');
        ring(e.x, e.y, '#ff5c7a', 0.9, 170);
      }
    }
    // 战士在道路上拦截敌人
    let blocker = null;
    if (!e.flying && !e.boss) {
      let bd = 1e9;
      B.units.forEach(u => {
        if (!u.deployed || !u.onPath || u.hp <= 0) return;
        const d = dist(u, e);
        if (d < CELL * 0.62 && d < bd) { bd = d; blocker = u; }
      });
    }
    if (blocker) {
      e.blockedBy = blocker;
      e.blockAtkCd = (e.blockAtkCd || 0) - dt;
      if (e.blockAtkCd <= 0) {
        e.blockAtkCd = 1.15;
        const gi = (B.stage.global || 1) + (B.trial ? Math.floor((B.waveIndex || 1) / 3) : 0);
        const raw = e.dmg * 9 * (1 + 0.08 * (gi - 1)) + blocker.maxHp * 0.02 * ((B.diff && B.diff.enemyDmg) || 1);
        const dmg = heroDamage(blocker, raw, 700);
        blocker.hp -= dmg;
        blocker.hitT = 0.16;
        B.dmgTaken += dmg;
        addText(blocker.x, blocker.y - 48, dmg > 0.5 ? '-' + Math.round(dmg) : '护盾', dmg > 0.5 ? '#ff5c7a' : '#7ff3e6', false);
        burst(blocker.x + rand(-12, 12), blocker.y - 10, 6, '#ff8a6a', 110, 0.35);
        if (blocker.hp <= 0) heroDie(blocker);
      }
      return;
    }
    e.blockedBy = null;

    const speed = e.speed * (e.slowT > 0 ? 0.7 : 1) * (e.speedBoost || 1) * chargeBoost;
    const target = e.path[e.seg + 1];
    if (!target) {
      // 漏怪
      e.alive = false;
      B.baseHp = Math.max(0, B.baseHp - e.leak);
      B.flash = 0.25; addShake(3);
      burst(e.x, e.y, 12, '#ff5c7a', 140, 0.5);
      if (B.baseHp <= 0) endBattle(false);
      return;
    }
    const dx = target.x - e.x, dy = target.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = speed * dt;
    if (d <= step) {
      e.x = target.x; e.y = target.y; e.seg++;
    } else {
      if (Math.abs(dx) > 0.5) e.dir = dx > 0 ? 1 : -1;
      e.x += dx / d * step; e.y += dy / d * step;
    }
  }

  function heroDie(u) {
    if (!u.deployed) return;
    u.hp = 0; u.deployed = false; u.cell = null; u.onPath = false;
    u.cdUntil = B.time + 8;
    burst(u.x, u.y, 20, hexA(elementColor(u.def.element), 0.8), 180, 0.7);
    addShake(4);
    toast(u.def.name + ' 倒下了，8 秒后回归');
    syncHud();
  }

  /* ---------- 特效 ---------- */
  function shardBurst(x, y, n, color, speed, life) {
    if (!B) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(speed * 0.3, speed);
      B.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        life: rand(life * 0.7, life), max: life,
        size: rand(2, 5), color, grav: 260,
        tri: true, rot: Math.random() * Math.PI, vr: rand(-9, 9)
      });
    }
  }

  function burst(x, y, n, color, speed, life) {
    if (!B) return;
    const cap = B.particlesCap;
    n = Math.min(n, Math.max(0, cap - B.particles.length));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(speed * 0.2, speed);
      B.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20,
        life: rand(life * 0.6, life), max: life, size: rand(1.5, 4.5),
        color, grav: 120
      });
    }
  }

  function ring(x, y, color, life, r) {
    if (!B) return;
    B.rings.push({ x, y, color, life, max: life, r });
  }

  function beam(x1, y1, x2, y2, color) {
    if (!B) return;
    B.rings.push({ beam: true, x1, y1, x2, y2, color, life: 0.22, max: 0.22, r: 0 });
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      burst(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 1, color, 80, 0.3);
    }
  }

  function addText(x, y, txt, color, crit) {
    if (!B) return;
    B.texts.push({ x, y, txt, color, crit: !!crit, life: crit ? 1.0 : 0.75, max: crit ? 1.0 : 0.75, vy: -52 });
  }

  function addShake(n) { if (B) B.shake = Math.min(16, B.shake + n); }

  function updateParticles(dt) {
    B.particles.forEach(p => {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.vx *= 0.985; p.vy *= 0.985;
      if (p.tri) p.rot += (p.vr || 0) * dt;
    });
    B.particles = B.particles.filter(p => p.life > 0);
  }

  function updateTexts(dt) {
    B.texts.forEach(t => { t.life -= dt; t.y += t.vy * dt; t.vy *= 0.94; });
    B.texts = B.texts.filter(t => t.life > 0);
  }

  /* ---------- 渲染 ---------- */
  function render() {
    if (!B) return;
    const g = B.ctx, dpr = B.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#02060a';
    g.fillRect(0, 0, B.canvas.width, B.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.translate(B.ox, B.oy);
    g.scale(B.scale, B.scale);
    g.save();
    if (B.shake > 0.2) g.translate(rand(-B.shake, B.shake), rand(-B.shake, B.shake));
    if (B.zoom > 1.001) {
      g.translate(W / 2, H / 2);
      g.scale(B.zoom, B.zoom);
      g.translate(-W / 2, -H / 2);
    }

    if (B.bg) g.drawImage(B.bg, 0, 0);

    // 雾
    const t = B.time;
    for (let i = 0; i < 3; i++) {
      const x = ((t * (8 + i * 4) + i * 420) % (W + 600)) - 300;
      const grd = g.createRadialGradient(x, 250 + i * 90, 20, x, 250 + i * 90, 260);
      grd.addColorStop(0, 'rgba(127,243,230,.045)');
      grd.addColorStop(1, 'rgba(127,243,230,0)');
      g.fillStyle = grd;
      g.fillRect(x - 300, 100, 600, 400);
    }

    // 天气
    const weather = B.stage.weather;
    if (weather) {
      g.save();
      if (weather === 'rain') {
        g.strokeStyle = 'rgba(140,210,255,.18)';
        g.lineWidth = 1;
        for (let i = 0; i < 52; i++) {
          const x = (i * 137 + t * 420) % (W + 120) - 60;
          const y = (i * 83 + t * 900) % (H + 80) - 40;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 20); g.stroke();
        }
      } else if (weather === 'ember') {
        for (let i = 0; i < 26; i++) {
          const x = (i * 173 + Math.sin(t * 0.7 + i) * 30) % W;
          const y = H - ((i * 67 + t * 70) % (H + 100));
          g.globalAlpha = 0.25 + (i % 4) * 0.12;
          g.fillStyle = i % 3 ? '#ff9a6a' : '#ffca6b';
          g.beginPath(); g.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2); g.fill();
        }
      } else if (weather === 'void') {
        for (let i = 0; i < 14; i++) {
          const a = t * 0.35 + i * 1.7;
          const x = W / 2 + Math.cos(a) * (260 + i * 18);
          const y = 360 + Math.sin(a * 0.8) * (120 + i * 5);
          g.globalAlpha = 0.12 + (i % 4) * 0.05;
          g.fillStyle = '#c08cff';
          g.beginPath(); g.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); g.fill();
        }
      } else if (weather === 'tide') {
        for (let i = 0; i < 22; i++) {
          const x = (i * 149 + 60) % W;
          const y = H - ((i * 71 + t * 45) % (H + 80));
          g.globalAlpha = 0.18;
          g.strokeStyle = '#7ff3e6';
          g.beginPath(); g.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); g.stroke();
        }
      } else if (weather === 'fog') {
        g.globalAlpha = 0.05;
        g.fillStyle = '#bfe8ef';
        for (let i = 0; i < 3; i++) {
          const x = ((t * 14 + i * 480) % (W + 400)) - 200;
          g.beginPath(); g.ellipse(x, 260 + i * 100, 260, 70, 0, 0, Math.PI * 2); g.fill();
        }
      }
      g.restore();
    }

    // 预警圈
    B.telegraphs.forEach(tg => {
      const k = Math.max(0, 1 - tg.t / tg.max);
      g.save();
      g.translate(tg.x, tg.y);
      g.globalAlpha = 0.55 + Math.sin(t * 9) * 0.2;
      g.strokeStyle = tg.kind === 'slam' ? '#ff5c7a' : '#ffca6b';
      g.lineWidth = 2;
      g.setLineDash([9, 9]);
      g.beginPath(); g.arc(0, 0, tg.r, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 0.12;
      g.fillStyle = tg.kind === 'slam' ? '#ff5c7a' : '#ffca6b';
      g.beginPath(); g.arc(0, 0, tg.r * k, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.75;
      g.fillStyle = tg.kind === 'slam' ? '#ff8a9a' : '#ffe0a8';
      g.font = '700 16px "PingFang SC",sans-serif';
      g.textAlign = 'center';
      g.fillText('!', 0, -tg.r - 8);
      g.restore();
    });

    // 可部署格高亮
    if (B.selected >= 0) {
      const u = B.units[B.selected];
      const cells = B.deployable.slice();
      if (u && u.def.role === 'guard') {
        B.pathCells.forEach(p => {
          if (!cells.some(q => q.c === p.c && q.r === p.r)) cells.push(p);
        });
      }
      g.save();
      cells.forEach(p => {
        const free = cellFree(p.c, p.r);
        const path = isPathCell(p.c, p.r);
        const x = GRID.x + p.c * CELL, y = GRID.y + p.r * CELL;
        g.fillStyle = free
          ? (path ? 'rgba(255,202,107,.10)' : 'rgba(63,224,208,.10)')
          : 'rgba(255,92,122,.05)';
        roundRect(g, x + 4, y + 4, CELL - 8, CELL - 8, 10); g.fill();
        g.strokeStyle = free
          ? (path ? 'rgba(255,202,107,.48)' : 'rgba(63,224,208,.35)')
          : 'rgba(255,92,122,.15)';
        g.lineWidth = path ? 1.6 : 1; g.stroke();
      });
      if (B.hover && cellAllowed(u, B.hover.c, B.hover.r) && cellFree(B.hover.c, B.hover.r)) {
        const cx = GRID.x + B.hover.c * CELL + CELL / 2;
        const cy = GRID.y + B.hover.r * CELL + CELL / 2;
        g.beginPath(); g.arc(cx, cy, (u ? u.stats.range : 3) * CELL, 0, Math.PI * 2);
        g.fillStyle = 'rgba(63,224,208,.07)'; g.fill();
        g.strokeStyle = 'rgba(63,224,208,.5)'; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]);
      }
      g.restore();
    }

    // 路径光点
    g.save();
    for (let i = 0; i < 5; i++) {
      const pts = B.paths[i % B.paths.length];
      const tt = ((t * 0.11 + i * 0.23) % 1);
      const p = pointAt(pts, tt);
      g.fillStyle = hexA(B.stage.accent || '#3fe0d0', 0.5);
      g.shadowColor = B.stage.accent || '#3fe0d0'; g.shadowBlur = 10;
      g.beginPath(); g.arc(p.x, p.y, 2.5, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    // 环境浮尘
    g.save();
    for (let i = 0; i < 16; i++) {
      const px = (i * 197 + t * (6 + i % 4)) % W;
      const py = 90 + ((i * 83 + Math.sin(t * 0.6 + i) * 18) % 540);
      g.globalAlpha = 0.18 + 0.12 * Math.sin(t * 1.4 + i);
      g.fillStyle = i % 5 === 0 ? '#f2c987' : '#7ff3e6';
      g.beginPath(); g.arc(px, py, 1.1 + (i % 3) * 0.5, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    // 单位（按 y 排序）
    const all = [];
    B.enemies.forEach(e => all.push({ y: e.y, draw: () => drawEnemy(e) }));
    B.units.forEach(u => { if (u.deployed) all.push({ y: u.y, draw: () => drawHero(u) }); });
    all.sort((a, b) => a.y - b.y);
    all.forEach(o => o.draw());

    // 投射物
    B.projectiles.forEach(p => {
      g.save();
      p.trail.forEach((q, i) => {
        g.globalAlpha = (q.t / 0.16) * 0.5;
        g.fillStyle = p.color;
        g.beginPath(); g.arc(q.x, q.y, 2 + i * 0.2, 0, Math.PI * 2); g.fill();
      });
      g.globalAlpha = 1;
      g.shadowColor = p.color; g.shadowBlur = 14;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(p.x, p.y, p.crit ? 5 : 3.4, 0, Math.PI * 2); g.fill();
      g.restore();
    });

    // 粒子（叠加混合，避免逐粒子 shadowBlur 的性能开销）
    g.save();
    g.globalCompositeOperation = 'lighter';
    B.particles.forEach(p => {
      const a = Math.max(0, p.life / p.max);
      g.fillStyle = p.color;
      g.globalAlpha = a * 0.22;
      g.beginPath(); g.arc(p.x, p.y, p.size * a * 2.6, 0, Math.PI * 2); g.fill();
      g.globalAlpha = a;
      if (p.tri) {
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot);
        g.beginPath(); g.moveTo(0, -p.size * a); g.lineTo(p.size * a * 0.8, p.size * a * 0.6); g.lineTo(-p.size * a * 0.8, p.size * a * 0.6); g.closePath(); g.fill();
        g.restore();
      } else {
        g.beginPath(); g.arc(p.x, p.y, Math.max(0.4, p.size * a), 0, Math.PI * 2); g.fill();
      }
    });
    g.restore();

    // 环
    B.rings.forEach(r => {
      const k = 1 - r.life / r.max;
      g.globalAlpha = Math.max(0, r.life / r.max);
      if (r.beam) {
        g.strokeStyle = r.color; g.lineWidth = 6 * (r.life / r.max) + 1;
        g.shadowColor = r.color; g.shadowBlur = 18;
        g.beginPath(); g.moveTo(r.x1, r.y1); g.lineTo(r.x2, r.y2); g.stroke();
      } else {
        g.strokeStyle = r.color; g.lineWidth = 3 * (r.life / r.max) + 0.5;
        g.shadowColor = r.color; g.shadowBlur = 16;
        g.beginPath(); g.arc(r.x, r.y, r.r * (0.3 + k * 0.9), 0, Math.PI * 2); g.stroke();
      }
    });
    g.globalAlpha = 1; g.shadowBlur = 0;

    // 伤害数字
    B.texts.forEach(tx => {
      const a = Math.min(1, tx.life / tx.max * 2.2);
      g.globalAlpha = a;
      const size = tx.crit ? 32 : 22;
      g.font = '800 ' + size + 'px "SF Mono",ui-monospace,monospace';
      g.textAlign = 'center';
      g.lineWidth = 3.5; g.strokeStyle = 'rgba(2,8,12,.88)';
      g.strokeText(tx.txt, tx.x, tx.y);
      g.fillStyle = tx.color;
      g.fillText(tx.txt, tx.x, tx.y);
      if (tx.crit) {
        g.font = '700 12px "PingFang SC",sans-serif';
        g.fillStyle = '#ffca6b';
        g.fillText('暴击', tx.x, tx.y - 30);
      }
    });
    g.globalAlpha = 1;

    // Boss 血条
    if (B.bossRef && B.bossRef.alive) {
      const b = B.bossRef;
      const w = 360, x = W / 2 - w / 2, y = 92;
      g.fillStyle = 'rgba(3,10,14,.8)';
      roundRect(g, x, y, w, 10, 5); g.fill();
      g.fillStyle = '#ffca6b';
      g.shadowColor = '#ffca6b'; g.shadowBlur = 12;
      roundRect(g, x + 1, y + 1, (w - 2) * Math.max(0, b.hp / b.maxHp), 8, 4); g.fill();
      g.shadowBlur = 0;
      g.font = '600 12px "PingFang SC",sans-serif';
      g.textAlign = 'center'; g.fillStyle = '#ffe0a8';
      g.fillText('潮心守卫 · ' + Math.ceil(b.hp / b.maxHp * 100) + '%', W / 2, y - 6);
    }

    // 闪白
    if (B.flash > 0) {
      g.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, B.flash * 0.5) + ')';
      g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  function pointAt(pts, t) {
    let total = 0;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segs.push(d); total += d;
    }
    let want = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (want <= segs[i]) {
        const k = want / segs[i];
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
      }
      want -= segs[i];
    }
    return pts[pts.length - 1];
  }

  function elementColor(el) { return (TW.DATA.ELEMENTS[el] || TW.DATA.ELEMENTS.tide).color; }

  function drawHero(u) {
    const g = B.ctx;
    const d = u.def, a = d.art || {};
    const elDef = TW.DATA.ELEMENTS[d.element] || TW.DATA.ELEMENTS.tide;
    const col = elDef.color, deep = elDef.deep;
    const acc = a.accent || col;
    const form = a.form || 'robe';
    const hair = a.hair || 'short';
    const weapon = a.weapon || 'staff';
    const big = form === 'guard';
    const cape = a.cape !== undefined ? a.cape : (d.rarity === 'SSR' || big);
    const halo = a.halo !== undefined ? a.halo : (d.role === 'healer' || d.role === 'support');
    const dir = u.face || 1;
    const t = B.time + u.idx * 0.7;
    const bob = Math.sin(t * 2.1) * 1.4;
    const k = u.atkAnim > 0 ? Math.sin((1 - u.atkAnim / 0.22) * Math.PI) : 0;
    const sway = Math.sin(t * 1.3) * 2;
    const robe = form === 'robe' || form === 'mage' || d.role === 'healer' || d.role === 'support';

    // 地面光环
    g.save();
    g.translate(u.x, u.y);
    g.globalAlpha = 0.45 + Math.sin(t * 2.2) * 0.1;
    g.strokeStyle = hexA(col, 0.55);
    g.lineWidth = 1.4;
    g.shadowColor = col; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(0, 3, 25, 8, 0, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 0.18;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(0, 3, 20, 6, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    // 选中标记
    if (B.selected === u.idx) {
      g.save();
      g.translate(u.x, u.y);
      g.strokeStyle = 'rgba(255,224,168,.85)';
      g.lineWidth = 1.6;
      g.setLineDash([5, 5]);
      g.lineDashOffset = -B.time * 20;
      g.beginPath(); g.arc(0, 4, 32, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#ffe0a8';
      g.beginPath(); g.moveTo(0, -86); g.lineTo(5, -78); g.lineTo(-5, -78); g.closePath(); g.fill();
      g.restore();
    }

    g.save();
    g.translate(u.x, u.y + 2);
    g.scale(dir, 1);
    g.translate(0, bob);
    g.scale(1.28, 1.28);

    // 影子
    g.globalAlpha = 0.32;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;

    // 披风
    if (cape) {
      g.beginPath();
      g.moveTo(-13, -50);
      g.quadraticCurveTo(-25 + sway, -22, -23 + sway, 2);
      g.lineTo(-7, -1); g.lineTo(0, 4); g.lineTo(7, -1); g.lineTo(23 + sway, 2);
      g.quadraticCurveTo(25 + sway, -22, 13, -50);
      g.closePath();
      g.fillStyle = hexA(deep, 0.9);
      g.strokeStyle = hexA(acc, 0.45);
      g.lineWidth = 1.2;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.22);
      g.beginPath(); g.moveTo(-10, -44); g.quadraticCurveTo(-15, -16, -14, -2); g.stroke();
      g.beginPath(); g.moveTo(10, -44); g.quadraticCurveTo(15, -16, 14, -2); g.stroke();
    }

    // 背部挂件
    if (weapon === 'bow') {
      g.save();
      g.translate(-10, -44); g.rotate(0.45);
      g.fillStyle = '#0e2530'; g.strokeStyle = hexA(acc, 0.6); g.lineWidth = 1;
      roundRect(g, -4, -6, 8, 22, 3); g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.8);
      g.beginPath(); g.moveTo(-1, -10); g.lineTo(-1, -18); g.moveTo(2, -9); g.lineTo(2, -17); g.stroke();
      g.restore();
    } else if (weapon === 'blade') {
      g.save();
      g.translate(-12, -34); g.rotate(-0.5);
      g.strokeStyle = hexA(acc, 0.45); g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 6); g.lineTo(2, -34); g.stroke();
      g.fillStyle = hexA(acc, 0.25);
      g.beginPath(); g.moveTo(2, -34); g.lineTo(5, -30); g.lineTo(4, -2); g.closePath(); g.fill();
      g.restore();
    } else if (weapon === 'orb' || weapon === 'staff' || weapon === 'book') {
      g.save();
      g.fillStyle = hexA(acc, 0.55);
      for (let i = 0; i < 3; i++) {
        const a2 = t * 0.9 + i * 2.1;
        const rx = -16 + Math.cos(a2) * 7;
        const ry = -52 + Math.sin(a2) * 10;
        g.save(); g.translate(rx, ry); g.rotate(a2);
        g.fillRect(-1.6, -1.6, 3.2, 3.2);
        g.restore();
      }
      g.restore();
    }

    // 后手
    g.strokeStyle = '#0a1922';
    g.lineWidth = 5.5;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(-13, -46); g.lineTo(-17 - k * 2, -28); g.stroke();

    // 腿 / 袍
    if (robe) {
      g.fillStyle = '#07131a';
      g.fillRect(-7, -8, 5, 9); g.fillRect(2, -8, 5, 9);
      g.beginPath();
      g.moveTo(-11, -34); g.lineTo(-18, -1);
      g.quadraticCurveTo(0, 4, 18, -1);
      g.lineTo(11, -34); g.closePath();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.42);
      g.lineWidth = 1;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.55);
      g.beginPath(); g.moveTo(-15, 0); g.quadraticCurveTo(0, 5, 15, 0); g.stroke();
    } else {
      g.fillStyle = '#08151c';
      roundRect(g, -9, -25, 7, 24, 3); g.fill();
      roundRect(g, 2, -25, 7, 24, 3); g.fill();
      g.strokeStyle = hexA(acc, 0.45);
      g.lineWidth = 1;
      roundRect(g, -9, -25, 7, 24, 3); g.stroke();
      roundRect(g, 2, -25, 7, 24, 3); g.stroke();
      g.fillStyle = hexA(acc, 0.7);
      roundRect(g, -10, -5, 10, 5, 2); g.fill();
      roundRect(g, 0, -5, 10, 5, 2); g.fill();
      g.strokeStyle = hexA(acc, 0.55);
      g.beginPath(); g.moveTo(-8, -16); g.lineTo(-3, -16); g.moveTo(3, -16); g.lineTo(8, -16); g.stroke();
    }

    // 躯干
    if (big) {
      g.beginPath();
      g.moveTo(-13, -52); g.lineTo(13, -52); g.lineTo(17, -28); g.lineTo(0, -20); g.lineTo(-17, -28);
      g.closePath();
      g.fillStyle = '#122c38';
      g.strokeStyle = hexA(acc, 0.6);
      g.lineWidth = 1.4;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.3);
      g.beginPath(); g.moveTo(0, -50); g.lineTo(0, -24); g.stroke();
      g.beginPath(); g.moveTo(-12, -40); g.lineTo(12, -40); g.stroke();
    } else if (robe) {
      g.beginPath();
      g.moveTo(-10, -52); g.lineTo(10, -52); g.lineTo(13, -30); g.lineTo(-13, -30);
      g.closePath();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.5);
      g.lineWidth = 1.2;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.35);
      g.beginPath(); g.moveTo(-11, -42); g.lineTo(11, -36); g.stroke();
      g.fillStyle = hexA(acc, 0.65);
      g.fillRect(-12, -32, 24, 2);
    } else {
      g.beginPath();
      g.moveTo(-10, -51); g.lineTo(10, -51); g.lineTo(13, -26); g.lineTo(-13, -26);
      g.closePath();
      g.fillStyle = '#0f2631';
      g.strokeStyle = hexA(acc, 0.45);
      g.lineWidth = 1.2;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.5);
      g.beginPath(); g.moveTo(-12, -29); g.lineTo(12, -29); g.stroke();
      g.fillStyle = hexA(acc, 0.8);
      g.fillRect(-2, -40, 4, 4);
    }

    // 围巾
    if (a.scarf) {
      g.fillStyle = hexA(a.scarf, 0.85);
      g.fillRect(-9, -53, 18, 3.5);
      g.beginPath();
      g.moveTo(6, -51);
      g.quadraticCurveTo(17, -42, 12, -27);
      g.lineTo(7, -29);
      g.quadraticCurveTo(11, -41, 3, -49);
      g.closePath();
      g.fill();
    }

    // 胸口元素纹章
    g.save();
    g.translate(0, -38);
    g.rotate(Math.PI / 4);
    g.fillStyle = hexA(acc, 0.75);
    g.fillRect(-3.2, -3.2, 6.4, 6.4);
    g.restore();

    // 头 / 颈
    g.fillStyle = '#0a1922';
    g.fillRect(-3, -56, 6, 7);

    if (hair === 'long') {
      g.strokeStyle = hexA(acc, 0.45);
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(-9, -66); g.quadraticCurveTo(-14, -48, -11, -30); g.stroke();
      g.beginPath(); g.moveTo(9, -66); g.quadraticCurveTo(14, -48, 11, -30); g.stroke();
    } else if (hair === 'ponytail') {
      g.strokeStyle = hexA(acc, 0.5);
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(7, -66); g.quadraticCurveTo(18, -58, 15, -38); g.stroke();
    }

    // 头
    g.beginPath(); g.arc(0, -63, 9, 0, Math.PI * 2);
    g.fillStyle = '#0b1d27';
    g.strokeStyle = hexA(acc, 0.7);
    g.lineWidth = 1.2;
    g.fill(); g.stroke();

    if (hair === 'hood') {
      g.beginPath();
      g.moveTo(-11, -62); g.quadraticCurveTo(-11, -75, 0, -77);
      g.quadraticCurveTo(11, -75, 11, -62);
      g.lineTo(8, -55); g.lineTo(-8, -55); g.closePath();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.6);
      g.lineWidth = 1.2;
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(4,12,18,.92)';
      g.beginPath(); g.ellipse(0, -62, 7, 8, 0, 0, Math.PI * 2); g.fill();
    } else if (hair === 'helm') {
      g.beginPath();
      g.moveTo(-9, -64); g.quadraticCurveTo(-9, -74, 0, -76);
      g.quadraticCurveTo(9, -74, 9, -64); g.lineTo(7, -56); g.lineTo(-7, -56); g.closePath();
      g.fillStyle = '#16323e';
      g.strokeStyle = hexA(acc, 0.75);
      g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.5);
      g.beginPath(); g.moveTo(0, -76); g.lineTo(0, -56); g.stroke();
      if (big) {
        g.fillStyle = hexA(acc, 0.8);
        g.beginPath(); g.moveTo(0, -76); g.lineTo(-3, -84); g.lineTo(3, -84); g.closePath(); g.fill();
      }
    } else if (hair === 'short') {
      g.beginPath();
      g.moveTo(-9, -64); g.quadraticCurveTo(-9, -73, 0, -74);
      g.quadraticCurveTo(9, -73, 9, -64);
      g.quadraticCurveTo(4, -69, 0, -68); g.quadraticCurveTo(-4, -69, -9, -64);
      g.closePath();
      g.fillStyle = hexA(acc, 0.5);
      g.fill();
    }

    // 眼
    g.fillStyle = acc;
    g.shadowColor = acc; g.shadowBlur = 6;
    g.fillRect(-4.5, -64, 2.6, 1.6);
    g.fillRect(1.9, -64, 2.6, 1.6);
    g.shadowBlur = 0;

    // 肩甲
    g.fillStyle = big ? '#16323e' : '#0e2530';
    g.strokeStyle = hexA(acc, 0.55);
    g.lineWidth = 1.1;
    g.beginPath(); g.arc(-12, -50, big ? 7 : 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(12, -50, big ? 7 : 5.5, 0, Math.PI * 2); g.fill(); g.stroke();

    // 前手 + 武器
    g.save();
    g.translate(k * 2, 0);
    g.strokeStyle = '#102630';
    g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(12, -46); g.lineTo(15 + k * 2, -30); g.stroke();

    drawWeapon(g, weapon, k, acc, deep, u, t);

    g.restore();

    // 角色签名配件
    const sig = a.sig;
    if (sig === 'horns') {
      g.strokeStyle = hexA(acc, 0.85); g.lineWidth = 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-7, -70); g.quadraticCurveTo(-12, -78, -9, -84); g.stroke();
      g.beginPath(); g.moveTo(7, -70); g.quadraticCurveTo(12, -78, 9, -84); g.stroke();
    } else if (sig === 'crown') {
      g.fillStyle = '#ffd98f'; g.strokeStyle = 'rgba(90,60,10,.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-8, -72); g.lineTo(-5, -80); g.lineTo(-1, -72); g.lineTo(3, -81); g.lineTo(7, -72); g.closePath();
      g.fill(); g.stroke();
    } else if (sig === 'goggles') {
      g.fillStyle = 'rgba(8,20,28,.9)';
      g.fillRect(-10, -66, 20, 4.2);
      g.strokeStyle = hexA(acc, 0.8); g.lineWidth = 1.2;
      g.beginPath(); g.arc(-4, -63.8, 2.6, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(4, -63.8, 2.6, 0, Math.PI * 2); g.stroke();
    } else if (sig === 'bandana') {
      g.fillStyle = hexA(acc, 0.75);
      g.fillRect(-10, -67, 20, 3);
      g.beginPath(); g.moveTo(9, -66); g.quadraticCurveTo(15, -60, 12, -50); g.lineTo(8, -53); g.quadraticCurveTo(10, -59, 6, -64); g.closePath(); g.fill();
    } else if (sig === 'satchel') {
      g.strokeStyle = hexA(acc, 0.45); g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-11, -50); g.lineTo(9, -28); g.stroke();
      g.fillStyle = '#14303b'; g.strokeStyle = hexA(acc, 0.7);
      roundRect(g, -14, -30, 9, 10, 2); g.fill(); g.stroke();
    } else if (sig === 'star') {
      g.save();
      g.translate(19, -58 + Math.sin(t * 2) * 2);
      g.rotate(t * 0.8);
      g.fillStyle = hexA(acc, 0.9);
      g.beginPath(); g.moveTo(0, -5); g.lineTo(1.4, -1.4); g.lineTo(5, 0); g.lineTo(1.4, 1.4); g.lineTo(0, 5); g.lineTo(-1.4, 1.4); g.lineTo(-5, 0); g.lineTo(-1.4, -1.4); g.closePath(); g.fill();
      g.restore();
    } else if (sig === 'bell') {
      g.fillStyle = '#ffd98f'; g.strokeStyle = 'rgba(90,60,10,.6)'; g.lineWidth = 1;
      g.beginPath(); g.arc(8, -30, 3, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#a97a34';
      g.beginPath(); g.arc(8, -27.5, 1, 0, Math.PI * 2); g.fill();
    } else if (sig === 'mech') {
      g.fillStyle = '#1c3a46'; g.strokeStyle = hexA(acc, 0.8); g.lineWidth = 1.2;
      roundRect(g, -20, -48, 8, 20, 3); g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.45);
      g.beginPath(); g.moveTo(-19, -42); g.lineTo(-13, -42); g.moveTo(-19, -36); g.lineTo(-13, -36); g.stroke();
    }

    // 光环
    if (halo) {
      g.save();
      g.globalAlpha = 0.55 + Math.sin(t * 2) * 0.15;
      g.strokeStyle = hexA(acc, 0.8);
      g.lineWidth = 1.3;
      g.shadowColor = acc; g.shadowBlur = 10;
      g.beginPath(); g.ellipse(0, -80, 10, 3, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }

    // 受击闪白
    if (u.hitT > 0) {
      g.globalAlpha = Math.min(0.45, u.hitT * 4);
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(0, -40, 18, 30, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }

    g.restore();

    // 血条
    if (u.hp < u.maxHp) {
      const w = 44;
      g.fillStyle = 'rgba(2,8,12,.85)';
      g.fillRect(u.x - w / 2, u.y + 12, w, 4);
      g.fillStyle = u.hp / u.maxHp > 0.35 ? '#4fe0a0' : '#ff5c7a';
      g.fillRect(u.x - w / 2, u.y + 12, w * (u.hp / u.maxHp), 4);
    }

    // 护盾
    if (u.shield > 0) {
      g.strokeStyle = 'rgba(242,201,135,.8)';
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(u.x, u.y - 34, 32, 0, Math.PI * 2); g.stroke();
    }

    // 大招就绪
    if (u.energy >= 100) {
      g.save();
      g.globalAlpha = 0.8 + Math.sin(t * 3) * 0.2;
      g.strokeStyle = '#ffe0a8';
      g.lineWidth = 1.5;
      g.shadowColor = '#ffca6b'; g.shadowBlur = 10;
      g.beginPath(); g.ellipse(u.x, u.y + 4, 27, 9, 0, 0, Math.PI * 2); g.stroke();
      g.font = '700 13px "PingFang SC",sans-serif';
      g.textAlign = 'center';
      g.fillStyle = '#ffe0a8';
      g.fillText('✦', u.x, u.y - 100);
      g.restore();
    }
  }

  function drawWeapon(g, weapon, k, acc, deep, u, t) {
    g.save();
    g.translate(14, -31);
    g.lineCap = 'round';
    g.lineJoin = 'round';

    if (weapon === 'shield') {
      g.save();
      g.translate(-24, 6);
      g.beginPath();
      g.moveTo(0, -18); g.lineTo(13, -12); g.lineTo(11, 10); g.lineTo(0, 20); g.lineTo(-11, 10); g.lineTo(-13, -12);
      g.closePath();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.85);
      g.lineWidth = 1.6;
      g.fill(); g.stroke();
      g.fillStyle = hexA(acc, 0.55);
      g.save(); g.translate(0, 0); g.rotate(Math.PI / 4); g.fillRect(-3, -3, 6, 6); g.restore();
      g.restore();
    } else if (weapon === 'blade') {
      g.save();
      g.rotate(-0.55 + k * 1.25);
      g.fillStyle = '#b9d9e2';
      g.strokeStyle = hexA(acc, 0.9);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-1.6, 0); g.lineTo(-1.2, -34); g.lineTo(0, -40); g.lineTo(1.2, -34); g.lineTo(1.6, 0);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = acc;
      g.fillRect(-4, -2, 8, 3);
      g.restore();
      if (k > 0.3) {
        g.strokeStyle = hexA(acc, 0.75 * k);
        g.lineWidth = 2;
        g.beginPath(); g.arc(0, 0, 30, -1.2, 0.4); g.stroke();
      }
    } else if (weapon === 'bow') {
      g.save();
      g.translate(4, -6);
      g.strokeStyle = hexA(acc, 0.9);
      g.lineWidth = 2;
      g.beginPath(); g.arc(4, 0, 22, -1.2, 1.2); g.stroke();
      g.strokeStyle = 'rgba(220,245,245,.6)';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(11, -20); g.lineTo(11 - k * 6, 0); g.lineTo(11, 20); g.stroke();
      if (k > 0.15) {
        g.strokeStyle = '#eaf7f7';
        g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(10 - k * 6, 0); g.lineTo(34, 0); g.stroke();
        g.fillStyle = acc;
        g.beginPath(); g.moveTo(34, 0); g.lineTo(29, -2.5); g.lineTo(29, 2.5); g.closePath(); g.fill();
      }
      g.restore();
    } else if (weapon === 'staff') {
      g.save();
      g.rotate(k * 0.25);
      g.strokeStyle = hexA(acc, 0.9);
      g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(0, 2); g.lineTo(4, -44); g.stroke();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.95);
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(4, -48, 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = hexA(acc, 0.9);
      g.shadowColor = acc; g.shadowBlur = 10 + k * 14;
      g.beginPath(); g.arc(4, -48, 2.4 + k * 1.6, 0, Math.PI * 2); g.fill();
      g.restore();
    } else if (weapon === 'orb') {
      g.save();
      const oy = -18 + Math.sin(t * 2.4) * 2;
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.95);
      g.lineWidth = 1.6;
      g.shadowColor = acc; g.shadowBlur = 12 + k * 10;
      g.beginPath(); g.arc(12, oy, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = hexA(acc, 0.75);
      g.beginPath(); g.arc(12, oy, 2.4, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.5;
      g.beginPath(); g.ellipse(12, oy, 13, 4, -0.5, 0, Math.PI * 2); g.stroke();
      g.restore();
    } else if (weapon === 'gun') {
      g.save();
      g.translate(-k * 3, 0);
      g.fillStyle = '#1b303a';
      g.strokeStyle = hexA(acc, 0.7);
      g.lineWidth = 1.2;
      roundRect(g, -4, -4, 30, 7, 2); g.fill(); g.stroke();
      g.fillStyle = '#0c1b23';
      roundRect(g, 20, -2.5, 14, 4, 1.5); g.fill();
      g.fillStyle = hexA(acc, 0.7);
      g.fillRect(-2, 1, 6, 8);
      if (k > 0.3) {
        g.fillStyle = '#ffe0a8';
        g.shadowColor = acc; g.shadowBlur = 16;
        g.beginPath(); g.arc(36, 0, 4 * k, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    } else if (weapon === 'hammer') {
      g.save();
      g.rotate(-0.2 + k * 0.9);
      g.strokeStyle = hexA(acc, 0.85);
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 4); g.lineTo(6, -34); g.stroke();
      g.fillStyle = '#1c3540';
      g.strokeStyle = hexA(acc, 0.8);
      g.lineWidth = 1.4;
      roundRect(g, -2, -48, 18, 15, 3); g.fill(); g.stroke();
      g.restore();
    } else if (weapon === 'pick') {
      g.save();
      g.rotate(-0.25 + k * 1.0);
      g.strokeStyle = hexA(acc, 0.85);
      g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(0, 4); g.lineTo(6, -38); g.stroke();
      g.beginPath(); g.arc(6, -38, 12, -2.4, -0.7); g.stroke();
      g.restore();
    } else if (weapon === 'book') {
      g.save();
      g.translate(k * 2, -12 + Math.sin(t * 2) * 1.5);
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.9);
      g.lineWidth = 1.3;
      roundRect(g, -2, -12, 18, 22, 2); g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.45);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(3, -6); g.lineTo(11, -6); g.moveTo(3, 0); g.lineTo(11, 0); g.stroke();
      g.restore();
    } else if (weapon === 'lantern') {
      g.save();
      g.translate(0, -6);
      g.strokeStyle = hexA(acc, 0.8);
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 10); g.stroke();
      g.fillStyle = deep;
      g.strokeStyle = hexA(acc, 0.9);
      roundRect(g, -7, 10, 14, 18, 3); g.fill(); g.stroke();
      g.fillStyle = hexA(acc, 0.85);
      g.shadowColor = acc; g.shadowBlur = 14;
      g.beginPath(); g.arc(0, 19, 3.4, 0, Math.PI * 2); g.fill();
      g.restore();
    } else if (weapon === 'harpoon') {
      g.save();
      g.rotate(-0.15 + k * 0.5);
      g.strokeStyle = hexA(acc, 0.85);
      g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(0, 6); g.lineTo(4, -42); g.stroke();
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(4, -42); g.lineTo(-2, -50); g.moveTo(4, -42); g.lineTo(10, -50); g.stroke();
      g.restore();
    } else if (weapon === 'fist') {
      g.save();
      g.translate(k * 12, -6);
      g.fillStyle = '#1a3440';
      g.strokeStyle = hexA(acc, 0.85);
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(6, 0, 6.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = hexA(acc, 0.5);
      g.beginPath(); g.moveTo(1, -3); g.lineTo(11, -3); g.moveTo(1, 2); g.lineTo(11, 2); g.stroke();
      g.restore();
    }

    g.restore();
  }

  /* ---------- 怪物模型 ---------- */
  const ENEMY_SPRITES = {};

  function shade(hex, f) {
    const h = (hex || '#6f8f96').replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    let r = (n >> 16) & 255, g2 = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g2 += (255 - g2) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g2 *= 1 + f; b *= 1 + f; }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g2) + ',' + Math.round(b) + ')';
  }

  function mix(hex, hex2, t) {
    function parse(h) {
      h = (h || '#000').replace('#', '');
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const a = parse(hex), b = parse(hex2);
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  function glowEye(g, x, y, r, color) {
    g.save();
    g.fillStyle = color;
    g.shadowColor = color;
    g.shadowBlur = 12;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function getEnemySprite(type) {
    if (ENEMY_SPRITES[type]) return ENEMY_SPRITES[type];
    const def = TW.DATA.ENEMIES[type];
    if (!def) return null;
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.translate(S / 2, S / 2);
    paintEnemy(g, type, def);
    ENEMY_SPRITES[type] = cv;
    return cv;
  }

  function paintEnemy(g, type, def) {
    const col = mix(def.color, '#16323d', 0.12);
    const light = shade(col, 0.45);
    const dark = shade(col, -0.4);
    const deep = shade(col, -0.6);
    const seam = '#8ff5e8';
    g.lineJoin = 'round';
    g.lineCap = 'round';

    function grad(rx, ry) {
      const gr = g.createRadialGradient(-rx * 0.35, -ry * 0.4, 2, 0, 0, Math.max(rx, ry) * 1.1);
      gr.addColorStop(0, light);
      gr.addColorStop(0.5, col);
      gr.addColorStop(0.85, shade(col, -0.25));
      gr.addColorStop(1, shade(col, -0.5));
      return gr;
    }
    function shell(rx, ry, y) {
      g.beginPath(); g.ellipse(0, y || 0, rx, ry, 0, 0, Math.PI * 2);
      g.fillStyle = grad(rx, ry);
      g.strokeStyle = shade(col, 0.28);
      g.lineWidth = 2.2;
      g.shadowColor = col; g.shadowBlur = 9;
      g.fill();
      g.shadowBlur = 0;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.22)';
      g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(-rx * 0.16, (y || 0) - ry * 0.28, rx * 0.62, ry * 0.42, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
    }
    function seamLine(x1, y1, x2, y2, w) {
      g.strokeStyle = seam;
      g.globalAlpha = 0.5;
      g.lineWidth = w || 1.2;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.globalAlpha = 1;
    }
    function texture(rx, ry, n) {
      let seed = 987654321;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const rr = Math.sqrt(rnd());
        const x = Math.cos(a) * rr * rx * 0.85;
        const y = Math.sin(a) * rr * ry * 0.85;
        g.fillStyle = rnd() < 0.55 ? 'rgba(0,0,0,.24)' : 'rgba(255,255,255,.10)';
        g.beginPath(); g.arc(x, y, 0.8 + rnd() * 1.4, 0, Math.PI * 2); g.fill();
      }
    }
    function barnacles(list) {
      g.fillStyle = shade(col, 0.18);
      g.strokeStyle = deep;
      g.lineWidth = 1;
      list.forEach(p => {
        g.beginPath(); g.arc(p[0], p[1], p[2], 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = shade(col, 0.4);
        g.beginPath(); g.arc(p[0] - p[2] * 0.25, p[1] - p[2] * 0.25, p[2] * 0.35, 0, Math.PI * 2); g.fill();
        g.fillStyle = shade(col, 0.18);
      });
    }

    if (type === 'grunt') {
      // 潮骸：甲壳蟹形
      g.save();
      shell(27, 20, -1);
      // 背棘
      g.fillStyle = deep;
      [[-16, -14, 6], [-3, -20, 7], [11, -15, 5]].forEach(s => {
        g.beginPath(); g.moveTo(s[0] - s[2], s[1]); g.lineTo(s[0], s[1] - s[2] * 1.7); g.lineTo(s[0] + s[2], s[1]); g.closePath(); g.fill();
      });
      texture(24, 18, 18);
      // 甲片
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0, -4, 20, 0.2, 2.6); g.stroke();
      g.beginPath(); g.arc(0, 0, 14, 0.3, 2.5); g.stroke();
      // 面部
      g.fillStyle = '#04121a';
      g.beginPath(); g.ellipse(0, 9, 14, 10, 0, 0, Math.PI * 2); g.fill();
      glowEye(g, -6, 6, 2.7, '#ff5c7a');
      glowEye(g, 6, 6, 2.7, '#ff5c7a');
      // 口器
      g.strokeStyle = light; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-6, 15); g.lineTo(-2, 19); g.moveTo(6, 15); g.lineTo(2, 19); g.stroke();
      // 侧钳
      g.strokeStyle = dark; g.lineWidth = 4;
      g.beginPath(); g.arc(-26, 10, 7, -1.2, 1.1); g.stroke();
      g.beginPath(); g.arc(26, 10, 7, 2.0, 4.3); g.stroke();
      // 藤壶与发光缝
      barnacles([[-18, -8, 2.6], [16, 2, 2.2], [-9, -12, 1.6]]);
      seamLine(-14, 12, -20, 18, 1.4);
      seamLine(12, 13, 18, 19, 1.2);
      g.restore();
    } else if (type === 'runner') {
      // 疾行者：流线鱼形
      g.save();
      g.rotate(-0.06);
      // 尾鳍
      g.fillStyle = dark;
      g.beginPath(); g.moveTo(-30, 0); g.lineTo(-43, -11); g.lineTo(-38, 0); g.lineTo(-43, 11); g.closePath(); g.fill();
      // 身体
      g.beginPath();
      g.moveTo(33, -4);
      g.quadraticCurveTo(24, -20, 6, -16);
      g.quadraticCurveTo(-14, -13, -31, -3);
      g.quadraticCurveTo(-22, 10, -2, 12);
      g.quadraticCurveTo(18, 13, 33, -4);
      g.closePath();
      g.fillStyle = grad(32, 14);
      g.strokeStyle = deep; g.lineWidth = 2;
      g.fill(); g.stroke();
      // 背鳍
      g.fillStyle = shade(col, 0.18);
      g.beginPath(); g.moveTo(-18, -9); g.lineTo(-8, -24); g.lineTo(2, -14); g.lineTo(12, -25); g.lineTo(18, -12); g.closePath(); g.fill();
      g.strokeStyle = light; g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const x = -12 + i * 8;
        g.beginPath(); g.moveTo(x, -12); g.lineTo(x + 3, -18); g.stroke();
      }
      // 头部
      g.fillStyle = shade(col, 0.1);
      g.beginPath(); g.arc(24, -4, 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = deep; g.lineWidth = 1.4; g.stroke();
      // 鳃
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.beginPath(); g.moveTo(8, -7); g.lineTo(4, 7); g.moveTo(12, -6); g.lineTo(8, 8); g.stroke();
      glowEye(g, 26, -5, 2.8, '#ff5c7a');
      // 发光侧线
      seamLine(-20, 4, 22, 2, 1.2);
      g.restore();
    } else if (type === 'brute') {
      // 重甲：装甲蟹
      g.save();
      shell(33, 25, -2);
      g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, -4, 24, 0.15, 2.7); g.stroke();
      g.beginPath(); g.arc(0, 0, 17, 0.2, 2.6); g.stroke();
      texture(30, 22, 26);
      // 铆钉
      g.fillStyle = shade(col, 0.3);
      [[-22, -8], [22, -8], [-14, 6], [14, 6]].forEach(p => {
        g.beginPath(); g.arc(p[0], p[1], 2, 0, Math.PI * 2); g.fill();
      });
      // 头盔
      g.beginPath(); g.ellipse(0, -18, 15, 11, 0, 0, Math.PI * 2);
      g.fillStyle = deep; g.strokeStyle = light; g.lineWidth = 1.6; g.fill(); g.stroke();
      glowEye(g, -5, -18, 2.2, '#ffca6b');
      glowEye(g, 0, -20, 2.2, '#ffca6b');
      glowEye(g, 5, -18, 2.2, '#ffca6b');
      // 巨钳
      g.strokeStyle = shade(col, -0.12); g.lineWidth = 8;
      g.beginPath(); g.arc(-29, 12, 10, -1.3, 1.0); g.stroke();
      g.beginPath(); g.arc(29, 12, 10, 2.1, 4.4); g.stroke();
      g.fillStyle = light;
      g.beginPath(); g.arc(-35, 20, 3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(35, 20, 3, 0, Math.PI * 2); g.fill();
      // 裂纹
      seamLine(-12, 4, -4, 12, 1.5);
      seamLine(16, 9, 22, 15, 1.2);
      g.restore();
    } else if (type === 'ranged') {
      // 远射：孢子炮台
      g.save();
      // 底座藤蔓
      g.strokeStyle = deep; g.lineWidth = 5;
      g.beginPath(); g.moveTo(-12, 30); g.quadraticCurveTo(-8, 12, 0, 2); g.stroke();
      g.beginPath(); g.moveTo(12, 30); g.quadraticCurveTo(8, 12, 0, 2); g.stroke();
      // 炮管
      g.fillStyle = grad(14, 22);
      g.strokeStyle = deep; g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, -10, 15, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      // 炮管
      g.fillStyle = deep; g.strokeStyle = light; g.lineWidth = 1.4;
      roundRect(g, 8, -24, 18, 11, 3); g.fill(); g.stroke();
      g.fillStyle = '#04121a';
      g.beginPath(); g.arc(26, -18.5, 4.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff5c7a';
      g.shadowColor = '#ff5c7a'; g.shadowBlur = 16;
      g.beginPath(); g.arc(26, -18.5, 2.2, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      // 侧鳍
      g.fillStyle = shade(col, 0.12);
      g.beginPath(); g.moveTo(-14, -4); g.lineTo(-24, -14); g.lineTo(-12, 2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-14, 4); g.lineTo(-24, 12); g.lineTo(-10, 10); g.closePath(); g.fill();
      // 侧眼
      glowEye(g, -8, -8, 2.2, '#ff8a9a');
      glowEye(g, -7, 2, 2.2, '#ff8a9a');
      // 背棘
      g.fillStyle = deep;
      [[-9, -22, 5], [0, -30, 6], [9, -22, 5]].forEach(sp => {
        g.beginPath(); g.moveTo(sp[0] - sp[2], sp[1] + sp[2]); g.lineTo(sp[0], sp[1] - sp[2]); g.lineTo(sp[0] + sp[2], sp[1] + sp[2]); g.closePath(); g.fill();
      });
      // 口器
      g.fillStyle = '#031017';
      g.beginPath(); g.ellipse(0, 6, 8, 4, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#c9a0ac'; g.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3, 3); g.lineTo(i * 3 + 1, 8); g.stroke(); }
      // 节纹
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0, -10, 11, 0.3, 2.8); g.stroke();
      seamLine(-6, 4, -10, 12, 1.2);
      g.restore();
    } else if (type === 'shield') {
      // 护盾兵：重装步兵
      g.save();
      // 躯干
      g.beginPath();
      g.moveTo(-17, -20); g.lineTo(17, -20); g.lineTo(13, 12); g.lineTo(-13, 12);
      g.closePath();
      g.fillStyle = grad(18, 20);
      g.strokeStyle = deep; g.lineWidth = 2.2;
      g.fill(); g.stroke();
      // 甲片
      g.strokeStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.moveTo(-14, -8); g.lineTo(14, -8); g.moveTo(-13, 0); g.lineTo(13, 0); g.stroke();
      // 头盔
      g.beginPath(); g.arc(0, -25, 11, Math.PI, 0); g.lineTo(9, -16); g.lineTo(-9, -16); g.closePath();
      g.fillStyle = deep; g.strokeStyle = light; g.lineWidth = 1.5; g.fill(); g.stroke();
      glowEye(g, -4, -21, 2.1, '#ff5c7a');
      glowEye(g, 4, -21, 2.1, '#ff5c7a');
      // 大盾
      g.save();
      g.translate(19, 2); g.rotate(0.08);
      g.beginPath(); g.moveTo(0, -22); g.lineTo(13, -14); g.lineTo(11, 14); g.lineTo(0, 24); g.lineTo(-11, 14); g.lineTo(-13, -14); g.closePath();
      g.fillStyle = deep; g.strokeStyle = shade(col, 0.35); g.lineWidth = 2;
      g.fill(); g.stroke();
      g.strokeStyle = shade(col, 0.35);
      g.beginPath(); g.moveTo(0, -16); g.lineTo(0, 16); g.moveTo(-7, -4); g.lineTo(7, -4); g.stroke();
      g.restore();
      seamLine(-8, 8, -4, 12, 1.4);
      g.restore();
    } else if (type === 'flyer') {
      // 飞行：鳐形
      g.save();
      g.beginPath();
      g.moveTo(0, -19); g.lineTo(19, -2); g.lineTo(9, 14); g.lineTo(0, 18); g.lineTo(-9, 14); g.lineTo(-19, -2);
      g.closePath();
      g.fillStyle = grad(19, 19);
      g.strokeStyle = deep; g.lineWidth = 2;
      g.fill(); g.stroke();
      // 尾
      g.strokeStyle = dark; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(0, 17); g.quadraticCurveTo(6, 30, 2, 38); g.stroke();
      // 核心
      g.fillStyle = seam; g.shadowColor = seam; g.shadowBlur = 16;
      g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      glowEye(g, -5, -4, 2, '#ff5c7a');
      glowEye(g, 5, -4, 2, '#ff5c7a');
      // 体纹
      g.strokeStyle = shade(col, 0.4); g.lineWidth = 1;
      g.beginPath(); g.moveTo(-12, -1); g.lineTo(-4, 6); g.moveTo(12, -1); g.lineTo(4, 6); g.stroke();
      g.restore();
    } else if (type === 'summon') {
      // 召唤者：脑眼
      g.save();
      // 触须（静态部分）
      g.strokeStyle = dark; g.lineWidth = 4.5;
      [[-8, 12, -20, 26], [8, 12, 20, 26], [-14, 4, -28, 14], [14, 4, 28, 14]].forEach(p => {
        g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo((p[0] + p[2]) / 2, p[1] + 10, p[2], p[3]); g.stroke();
      });
      // 主体
      g.beginPath(); g.arc(0, -2, 20, 0, Math.PI * 2);
      g.fillStyle = grad(20, 20);
      g.strokeStyle = deep; g.lineWidth = 2.2;
      g.fill(); g.stroke();
      // 脑褶
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(0, -2, 14, 0.2, 2.9); g.stroke();
      g.beginPath(); g.arc(0, -2, 8, 0.4, 2.7); g.stroke();
      // 主眼
      g.fillStyle = '#04121a';
      g.beginPath(); g.arc(0, -6, 8, 0, Math.PI * 2); g.fill();
      glowEye(g, 0, -6, 4.2, '#ff5c7a');
      glowEye(g, -13, -10, 1.8, '#ff8a9a');
      glowEye(g, 13, -10, 1.8, '#ff8a9a');
      // 符文环
      g.strokeStyle = seam; g.globalAlpha = 0.35; g.lineWidth = 1;
      g.beginPath(); g.arc(0, -2, 26, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
      g.restore();
    } else if (type === 'elite') {
      // 精英：角冠兽骑
      g.save();
      shell(31, 24, 0);
      texture(28, 22, 20);
      // 肩甲尖刺
      g.fillStyle = deep;
      [[-30, -6, 10], [30, -6, 10], [-24, 8, 8], [24, 8, 8]].forEach(s => {
        g.beginPath(); g.moveTo(s[0], s[1] - s[2] / 2); g.lineTo(s[0] + (s[0] < 0 ? -s[2] : s[2]), s[1]); g.lineTo(s[0], s[1] + s[2] / 2); g.closePath(); g.fill();
      });
      // 头骨
      g.beginPath(); g.ellipse(0, -20, 15, 12, 0, 0, Math.PI * 2);
      g.fillStyle = deep; g.strokeStyle = '#c08cff'; g.lineWidth = 1.8; g.fill(); g.stroke();
      // 角
      g.strokeStyle = '#e0c8ff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-9, -28); g.quadraticCurveTo(-20, -38, -14, -44); g.stroke();
      g.beginPath(); g.moveTo(9, -28); g.quadraticCurveTo(20, -38, 14, -44); g.stroke();
      // 四眼
      glowEye(g, -6, -21, 2.1, '#c08cff');
      glowEye(g, 6, -21, 2.1, '#c08cff');
      glowEye(g, -4, -14, 1.6, '#ff5c7a');
      glowEye(g, 4, -14, 1.6, '#ff5c7a');
      // 刃臂
      g.fillStyle = '#b9d9e2';
      g.strokeStyle = '#c08cff'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-34, 2); g.lineTo(-46, -10); g.lineTo(-30, -4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(34, 2); g.lineTo(46, -10); g.lineTo(30, -4); g.closePath(); g.fill(); g.stroke();
      // 符文
      g.strokeStyle = '#c08cff'; g.globalAlpha = 0.5;
      g.beginPath(); g.arc(0, 2, 18, 0.2, 1.6); g.stroke();
      g.globalAlpha = 1;
      g.restore();
    } else if (type === 'boss') {
      // 首领：潮心骨冠
      g.save();
      // 肩部甲壳
      g.beginPath(); g.ellipse(0, 8, 44, 30, 0, 0, Math.PI * 2);
      g.fillStyle = grad(44, 30);
      g.strokeStyle = deep; g.lineWidth = 3;
      g.fill(); g.stroke();
      texture(40, 28, 30);
      // 肋骨
      g.strokeStyle = shade(col, 0.25); g.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(0, -6 + i * 10);
        g.quadraticCurveTo(-26 + i * 2, 2 + i * 9, -14, 22 + i * 2);
        g.moveTo(0, -6 + i * 10);
        g.quadraticCurveTo(26 - i * 2, 2 + i * 9, 14, 22 + i * 2);
        g.stroke();
      }
      // 核心
      g.fillStyle = '#ffca6b';
      g.shadowColor = '#ffca6b'; g.shadowBlur = 26;
      g.beginPath(); g.arc(0, 10, 8, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      // 头骨
      g.beginPath(); g.ellipse(0, -24, 22, 17, 0, 0, Math.PI * 2);
      g.fillStyle = deep; g.strokeStyle = '#ffe0a8'; g.lineWidth = 2;
      g.fill(); g.stroke();
      // 下颚
      g.fillStyle = '#04121a';
      g.beginPath(); g.moveTo(-12, -12); g.lineTo(0, -4); g.lineTo(12, -12); g.closePath(); g.fill();
      // 王冠角
      g.fillStyle = '#ffe0a8';
      g.beginPath();
      g.moveTo(-20, -36); g.lineTo(-26, -54); g.lineTo(-12, -43); g.lineTo(-4, -58); g.lineTo(4, -43); g.lineTo(18, -54); g.lineTo(20, -36); g.closePath();
      g.fill();
      // 四眼
      glowEye(g, -8, -26, 3, '#ff5c7a');
      glowEye(g, 8, -26, 3, '#ff5c7a');
      glowEye(g, -6, -18, 2, '#ffca6b');
      glowEye(g, 6, -18, 2, '#ffca6b');
      // 肩刺
      g.fillStyle = shade(col, 0.2);
      [[-40, 0], [40, 0]].forEach(p => {
        g.beginPath(); g.moveTo(p[0], -8); g.lineTo(p[0] + (p[0] < 0 ? -14 : 14), 4); g.lineTo(p[0], 14); g.closePath(); g.fill();
      });
      // 符文
      g.strokeStyle = '#ffe0a8'; g.globalAlpha = 0.35; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0, 6, 38, 0.2, 1.5); g.stroke();
      g.globalAlpha = 1;
      g.restore();
    }
  }

  function enemyLegs(e, R, t) {
    const type = e.type;
    if (type === 'flyer' || type === 'summon' || type === 'boss' || type === 'ranged') return;
    const col = e.color;
    const n = type === 'runner' ? 2 : 4;
    const dir = e.dir || 1;
    const g = B.ctx;
    g.save();
    g.translate(e.x, e.y);
    g.scale(dir, 1);
    g.strokeStyle = shade(col, -0.6);
    g.lineWidth = Math.max(1.6, R * 0.14);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const row = Math.floor(i / 2);
      const ph = t * 7 + i * 1.9;
      const hipX = side * R * (0.5 + row * 0.12);
      const hipY = R * (0.2 + row * 0.22);
      const kneeX = side * R * (0.85 + Math.sin(ph) * 0.14);
      const kneeY = R * (0.72 + row * 0.1);
      const footX = side * R * (1.02 + Math.sin(ph + 0.5) * 0.2);
      const footY = R * (1.08 + row * 0.12) + Math.cos(ph) * R * 0.06;
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.quadraticCurveTo(kneeX, kneeY, footX, footY);
      g.stroke();
      g.fillStyle = shade(col, -0.35);
      g.beginPath(); g.arc(footX, footY, R * 0.1, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function enemyWings(e, R, t) {
    if (e.type !== 'flyer') return;
    const g = B.ctx;
    const flap = Math.sin(t * 8 + (e.seed || 0)) * 0.45;
    g.save();
    g.translate(e.x, e.y);
    for (let side = -1; side <= 1; side += 2) {
      g.save();
      g.scale(side, 1);
      g.beginPath();
      g.moveTo(0, -4);
      g.quadraticCurveTo(R * 1.4, -R * 0.9 + flap * R, R * 2.0, -R * 0.2 + flap * R * 0.5);
      g.quadraticCurveTo(R * 1.2, R * 0.35, R * 0.3, R * 0.4);
      g.closePath();
      g.fillStyle = hexA(e.color, 0.16);
      g.strokeStyle = hexA(e.color, 0.5);
      g.lineWidth = 1.2;
      g.fill(); g.stroke();
      g.strokeStyle = hexA(e.color, 0.28);
      g.beginPath(); g.moveTo(R * 0.2, -R * 0.1); g.lineTo(R * 1.5, -R * 0.35 + flap * R * 0.6); g.stroke();
      g.restore();
    }
    g.restore();
  }

  function enemyTentacles(e, R, t) {
    if (e.type !== 'summon' && e.type !== 'boss') return;
    const g = B.ctx;
    const n = e.type === 'boss' ? 6 : 4;
    g.save();
    g.translate(e.x, e.y);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const k = Math.floor(i / 2) + 1;
      const sway = Math.sin(t * 2 + i * 1.3) * R * 0.35;
      g.strokeStyle = hexA(e.color, 0.55);
      g.lineWidth = Math.max(1.6, R * (e.type === 'boss' ? 0.12 : 0.09));
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(side * R * 0.15 * k, R * 0.4);
      g.quadraticCurveTo(side * R * 0.9 * k + sway, R * 0.9, side * R * 0.7 * k - sway, R * 1.25);
      g.stroke();
    }
    g.restore();
  }

  function enemyAura(e, R, t) {
    if (e.type !== 'elite' && e.type !== 'boss') return;
    const g = B.ctx;
    const col = e.type === 'boss' ? '#ffca6b' : '#c08cff';
    g.save();
    g.translate(e.x, e.y);
    g.globalAlpha = 0.35 + Math.sin(t * 2) * 0.1;
    g.strokeStyle = col;
    g.lineWidth = 1.4;
    g.setLineDash([6, 8]);
    g.lineDashOffset = -t * 24;
    g.beginPath(); g.ellipse(0, R * 0.9, R * 1.5, R * 0.45, 0, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  function drawEnemy(e) {
    const g = B.ctx;
    const def = TW.DATA.ENEMIES[e.type] || {};
    const R = e.r * 1.95;
    const t = B.time + (e.seed || 0);
    const fly = e.type === 'flyer';
    const bob = fly ? Math.sin(t * 3.4) * 3.5 : Math.sin(t * 5 + (e.seed || 0)) * 1.2;
    const dir = e.dir || 1;

    // 影子
    g.save();
    g.globalAlpha = 0.4;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(e.x, e.y + R * 0.95, R * 0.95, R * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    enemyAura(e, R, t);
    enemyLegs(e, R, t);
    enemyWings(e, R, t);
    enemyTentacles(e, R, t);

    const spr = getEnemySprite(e.type);
    g.save();
    g.translate(e.x, e.y + bob);
    g.scale(dir, 1);
    if (spr) {
      const size = R * 6.4 * (0.94 + (e.seed % 1) * 0.12);
      g.drawImage(spr, -size / 2, -size / 2, size, size);
    }

    // 受击闪白
    if (e.hitT > 0) {
      g.globalAlpha = Math.min(0.5, e.hitT * 4);
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(0, 0, R * 0.85, R * 0.8, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }

    // 冻结
    if (e.frozenT > 0) {
      g.strokeStyle = 'rgba(159,247,255,.7)';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(0, 0, R * 1.05, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(159,247,255,.12)';
      g.beginPath(); g.arc(0, 0, R * 1.05, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        g.beginPath();
        g.moveTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9);
        g.lineTo(Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25);
        g.stroke();
      }
    }

    // 护盾兵护罩
    if (e.type === 'shield') {
      g.strokeStyle = 'rgba(110,190,255,' + (0.35 + Math.sin(t * 3) * 0.12) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, -R * 0.2, R * 1.15, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(78,168,255,.07)';
      g.beginPath(); g.arc(0, -R * 0.2, R * 1.15, 0, Math.PI * 2); g.fill();
    }

    // Boss 狂暴光
    if (e.type === 'boss' && e.hp < e.maxHp * 0.5) {
      g.strokeStyle = 'rgba(255,92,122,' + (0.4 + Math.sin(t * 6) * 0.2) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, R * 1.3, 0, Math.PI * 2); g.stroke();
    }

    g.restore();

    // 元素环
    g.save();
    g.globalAlpha = 0.5;
    g.strokeStyle = hexA(elementColor(e.element), 0.5);
    g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(e.x, e.y + R * 0.95, R * 0.95, R * 0.28, 0, 0, Math.PI * 2); g.stroke();
    g.restore();

    // 血条
    if (e.hp < e.maxHp) {
      const w = e.type === 'boss' ? 0 : R * 2.1;
      if (w) {
        g.fillStyle = 'rgba(2,8,12,.82)';
        g.fillRect(e.x - w / 2, e.y - R - 15, w, 4);
        g.fillStyle = e.hp / e.maxHp > 0.35 ? '#4fe0a0' : '#ff5c7a';
        g.fillRect(e.x - w / 2, e.y - R - 15, w * (e.hp / e.maxHp), 4);
        g.fillStyle = 'rgba(255,255,255,.14)';
        g.fillRect(e.x - w / 2, e.y - R - 15, w * 0.5, 1);
      }
    }
  }

  /* ---------- 结束 ---------- */

  function applyBlessing(b) {
    if (!B || !b) return;
    const m = b.mods || {};
    B.units.forEach(u => {
      if (m.atk) u.stats.atk *= 1 + m.atk;
      if (m.hp) {
        u.maxHp *= 1 + m.hp;
        u.hp = Math.min(u.maxHp, u.hp * (1 + m.hp));
      }
      if (m.as) u.stats.spd = u.stats.spd / (1 + m.as);
      if (m.range) u.stats.range *= 1 + m.range;
    });
    ['energy', 'ultDmg', 'gold', 'crit', 'heal'].forEach(k => {
      if (typeof m[k] === 'number') B.mods[k] = (B.mods[k] || 0) + m[k];
    });
    B.blessingPause = false;
    B.flash = 0.25;
    showBanner('祝福生效', b.name + ' · ' + b.desc);
    B.units.filter(u => u.deployed).forEach(u => {
      burst(u.x, u.y, 12, '#ffe0a8', 150, 0.6);
      ring(u.x, u.y, '#ffca6b', 0.55, 50);
    });
    sfx('levelup');
    syncHud();
  }

  function quitBattle() {
    if (!B || B.over) return;
    const info = {
      aborted: true, win: false, stars: 0, time: B.time,
      baseHp: B.baseHp, baseMax: B.baseMax, kills: B.kills,
      damageDealt: Math.round(B.dmgDealt), damageTaken: Math.round(B.dmgTaken),
      healed: Math.round(B.healed), ults: B.ults
    };
    const cb = B.onEnd;
    destroy();
    if (TW.Audio) { try { TW.Audio.resume(); TW.Audio.bgm('menu'); } catch (e) {} }
    cb(info);
  }

  function endBattle(win) {
    if (!B || B.over) return;
    B.over = true;
    setPlaceSlow(false);
    if (TW.Cursor) { try { win ? TW.Cursor.celebrate() : TW.Cursor.defeat(); } catch (e) {} }
    const time = Math.max(0, B.time);
    let stars = 0;
    if (win) {
      stars = 1;
      if (B.baseHp >= B.baseMax) stars++;
      if (time <= (B.stage.timeLimit || 150)) stars++;
    }
    const result = {
      win, stars, time,
      baseHp: B.baseHp, baseMax: B.baseMax,
      kills: B.kills,
      damageDealt: Math.round(B.dmgDealt),
      damageTaken: Math.round(B.dmgTaken),
      healed: Math.round(B.healed),
      ults: B.ults,
      goldBonus: B.goldBonus || 0,
      goldEarned: B.goldEarned || 0,
      comboMax: B.comboMax || 0,
      spellsUsed: B.spellsUsed || 0,
      wavesCleared: B.trial ? (win ? B.totalWaves : Math.max(0, B.waveIndex - 1)) : 0,
      trial: !!B.trial,
      stage: B.stage,
      difficulty: B.difficulty,
      diffName: (B.diff && B.diff.name) || '困难',
      diffGold: (B.diff && B.diff.gold) || 1
    };
    addShake(win ? 8 : 6);
    B.flash = win ? 0.7 : 0.4;
    syncHud();
    if (TW.Audio) { try { TW.Audio.bgm('menu'); } catch (e) {} }
    setTimeout(() => {
      if (!B) return;
      const cb = B.onEnd;
      destroy();
      cb(result);
    }, 900);
  }

  function onKey(e) {
    if (!B) return;
    if (B.blessingPause) return;
    if (e.code === 'Space' || e.key === 'Escape') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (B.paused) return;
    if (e.key === '1') setSpeed(1);
    else if (e.key === '2') setSpeed(2);
    else if (e.key === '3') setSpeed(3);
    else if (e.key === 'q' || e.key === 'Q') castSpell('freeze');
    else if (e.key === 'w' || e.key === 'W') castSpell('meteor');
    else if (e.key === 'e' || e.key === 'E') castSpell('heal');
    else if (e.key === 'r' || e.key === 'R') activateBurst();
    else if (e.key === 'n' || e.key === 'N') callNextWave();
  }

  function sfx(name) { if (TW.Audio) { try { TW.Audio.sfx(name); return; } catch (e) {} } if (TW.Sfx) TW.Sfx.play(name); }

  function cursorBurstAt(x, y, kind) {
    if (!TW.Cursor || !B || !B.canvas) return;
    const r = B.canvas.getBoundingClientRect();
    TW.Cursor.burstAt(r.left + B.ox + x * B.scale, r.top + B.oy + y * B.scale, kind);
  }

  TW.Battle = {
    run, destroy,
    active: () => !!B,
    // 调试/自动化用：手动推进一帧（不依赖 rAF）
    tick: (dt) => { if (!B || B.over) return; update(dt); render(); syncHud(); },
    debugDeploy: (i, c, r) => { if (B) tryDeploy(i, c, r); },
    debugEnergy: (n) => { if (B) B.energy = n; },
    debugSetHp: (i, hp) => { if (B && B.units[i]) B.units[i].hp = Math.max(0, Math.min(B.units[i].maxHp, hp)); },
    debugUlt: (i) => { if (B && B.units[i]) { B.units[i].energy = 100; castUlt(B.units[i]); } },
    debugFast: (dt, n, cb) => {
      if (!B) return;
      const step = dt || 0.05;
      for (let i = 0; i < (n || 1) && !B.over; i++) {
        update(step);
        if (cb) cb(i);
      }
      render();
      syncHud();
    },
    debugState: () => B ? { baseHp: B.baseHp, baseMax: B.baseMax, kills: B.kills, over: B.over, difficulty: B.difficulty, energy: B.energy, deployed: B.units.filter(u => u.deployed).length, time: B.time, selected: B.selected, combo: B.combo, burst: B.burst, burstReady: B.burstReady, waveCall: B.waveCallReady, spells: B.spells.map(sp => ({ id: sp.id, left: sp.left })), wavesCleared: B.waveIndex, telegraphs: B.telegraphs.length, bossPhase: B.bossPhase, placeSlow: B.placeSlow, timeScale: B.timeScale, blocked: B.enemies.filter(e => e.blockedBy && e.blockedBy.hp > 0).length, onPath: B.units.filter(u => u.onPath).length } : null,
    debugUnits: () => B ? B.units.filter(u => u.deployed).map(u => ({ name: u.def.name, x: Math.round(u.x), y: Math.round(u.y), atk: Math.round(u.stats.atk), range: +(u.stats.range * CELL).toFixed(0), hp: Math.round(u.hp), shield: Math.round(u.shield || 0) })) : [],
    debugEnemies: () => B ? B.enemies.map(e => ({ name: e.name, hp: Math.round(e.hp), maxHp: Math.round(e.maxHp), dmg: +(+e.dmg).toFixed(2), speed: +(+e.speed).toFixed(1), leak: e.leak })) : [],
    debugSpell: (id) => castSpell(id),
    debugBurst: () => { if (B) { B.burst = 100; B.burstReady = true; activateBurst(); } },
    debugWaveCall: () => callNextWave(),
    debugEnd: (win) => { if (B && !B.over) endBattle(win !== false); },
    applyBlessing: (b) => applyBlessing(b),
    debugSpawn: (type, c, r) => {
      if (!B) return;
      spawn({ type: type, path: 0, wave: 0 });
      const e = B.enemies[B.enemies.length - 1];
      const p = CELL_CENTER(c, r);
      e.x = p.x; e.y = p.y; e.speed = 0;
    }
  };
})(window.TW);
