/* 汐境回响 — 炫酷鼠标 + 击败/通关特效 */
(function (TW) {
  'use strict';

  let inited = false, enabled = true, visible = true, dpr = 1;
  let canvas = null, ctx = null, root = null, dot = null, ring = null, orbit = null;
  let mx = 0, my = 0, rx = 0, ry = 0;
  let hover = false, down = false, victoryT = 0;
  const particles = [];
  const rings = [];
  let lastMove = 0, lastTrail = 0, lastTs = 0, frames = 0, moved = false;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(on) {
    if (inited) return;
    if (!(window.matchMedia && window.matchMedia('(any-pointer: fine)').matches)) return;
    if (!document.body) return;
    inited = true;

    root = document.createElement('div');
    root.id = 'cursor-root';
    root.innerHTML = '<div id="cursor-orbit"></div><div id="cursor-ring"></div><div id="cursor-dot"></div>';
    document.body.appendChild(root);

    canvas = document.createElement('canvas');
    canvas.id = 'cursor-fx';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    dot = document.getElementById('cursor-dot');
    ring = document.getElementById('cursor-ring');
    orbit = document.getElementById('cursor-orbit');

    mx = rx = window.innerWidth / 2;
    my = ry = window.innerHeight / 2;
    visible = true;
    root.classList.add('on');

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    setEnabled(on !== false);
    requestAnimationFrame(loop);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!inited) return;
    document.body.classList.toggle('custom-cursor', enabled);
    if (!enabled) {
      particles.length = 0;
      rings.length = 0;
      if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0), ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function isEnabled() { return !!(inited && enabled); }

  function onMove(e) {
    if (!inited || !enabled) return;
    mx = e.clientX; my = e.clientY;
    if (!visible) { visible = true; root.classList.add('on'); }
    if (!moved) { moved = true; rx = mx; ry = my; }
    const now = performance.now();
    if (!reduce && now - lastTrail > 14) {
      lastTrail = now;
      const c = Math.random() < 0.28 ? '#ffca6b' : '#7ff3e6';
      particles.push({
        x: mx + (Math.random() - 0.5) * 10, y: my + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 6,
        life: 0.32 + Math.random() * 0.18, max: 0.5,
        size: 0.8 + Math.random() * 1.6, color: c, grav: 0, trail: true
      });
      if (particles.length > 260) particles.splice(0, particles.length - 260);
    }
    lastMove = now;
  }
  function onDown(e) {
    if (!inited || !enabled) return;
    down = true;
    if (root) root.classList.add('down');
    pulse(mx, my);
  }
  function onUp() {
    down = false;
    if (root) root.classList.remove('down');
  }
  function onOver(e) {
    if (!inited) return;
    const t = e.target;
    const hit = t && t.closest && t.closest('button,a,input,textarea,select,label,[data-act],.card,.quick,.tab,.chapter-card,.stage-node,.blessing,.spell,.hcard');
    hover = !!hit;
    if (root) root.classList.toggle('hover', hover);
  }
  function onLeave() {
    visible = false;
    if (root) root.classList.remove('on');
  }
  function onEnter() {
    if (!inited) return;
    visible = true;
    if (root) root.classList.add('on');
  }

  function pulse(x, y, color) {
    if (!enabled) return;
    rings.push({ x: x, y: y, r: 2, max: 46, life: 0.38, maxLife: 0.38, color: color || 'rgba(127,243,230,.85)', width: 1.5 });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 50;
      particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.3, max: 0.3, size: 1 + Math.random() * 1.6,
        color: color || '#7ff3e6', grav: 60, trail: true
      });
    }
  }

  function burstAt(x, y, kind) {
    if (!inited || !enabled) return;
    kind = kind || 'kill';
    const cfg = kind === 'victory'
      ? { n: 76, sp: 260, life: 1.2, colors: ['#ffe0a8', '#ffca6b', '#7ff3e6', '#ffffff'], ring: true, big: true }
      : kind === 'defeat'
        ? { n: 42, sp: 190, life: 0.9, colors: ['#ff5c7a', '#c08cff', '#ff8a9a'], ring: true }
        : kind === 'boss'
          ? { n: 34, sp: 230, life: 1.0, colors: ['#ffca6b', '#ffe0a8', '#ff8a5c'], ring: true, big: true }
          : kind === 'elite'
            ? { n: 18, sp: 160, life: 0.7, colors: ['#c08cff', '#e0c8ff'], ring: true }
            : { n: 8, sp: 100, life: 0.5, colors: ['#7ff3e6', '#ffe0a8'], ring: false };

    if (cfg.ring) {
      rings.push({ x, y, r: 3, max: cfg.big ? 120 : 46, life: cfg.big ? 0.75 : 0.4, maxLife: cfg.big ? 0.75 : 0.4, color: cfg.colors[0], width: cfg.big ? 6 : 2 });
      if (cfg.big) rings.push({ x, y, r: 3, max: 190, life: 0.95, maxLife: 0.95, color: 'rgba(127,243,230,.7)', width: 1.5 });
    }

    if (reduce) return;
    const n = Math.min(cfg.n, 500 - particles.length);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = cfg.sp * (0.25 + Math.random() * 0.85);
      const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      particles.push({
        x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20,
        life: cfg.life * (0.55 + Math.random() * 0.55), max: cfg.life,
        size: 1.2 + Math.random() * (cfg.big ? 3.6 : 2.4),
        color, grav: cfg.big ? 260 : 160, trail: false
      });
    }
    if (kind === 'victory') {
      victoryT = 2.4;
      if (root) root.classList.add('victory');
      setTimeout(() => { if (root) root.classList.remove('victory'); }, 2400);
    }
  }

  function celebrate() {
    if (!inited || !enabled) return;
    burstAt(visible ? mx : window.innerWidth / 2, visible ? my : window.innerHeight / 2, 'victory');
  }
  function defeat() {
    if (!inited || !enabled) return;
    burstAt(visible ? mx : window.innerWidth / 2, visible ? my : window.innerHeight / 2, 'defeat');
  }

  function step(dt) {
    if (!inited) return;
    dt = Math.min(0.05, dt || 0.016);
    frames++;

    rx += (mx - rx) * 0.24;
    ry += (my - ry) * 0.24;
    if (dot) dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
    if (ring) ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%) scale(' + (down ? 0.82 : hover ? 1.22 : 1) + ')';
    if (orbit) orbit.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%) scale(' + (down ? 0.9 : hover ? 1.34 : 1) + ')';

    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += p.grav * dt;
        p.vx *= 0.985; p.vy *= 0.985;
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a * (p.trail ? 0.55 : 0.95);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.size * a), 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life -= dt;
        if (r.life <= 0) { rings.splice(i, 1); continue; }
        const k = 1 - r.life / r.maxLife;
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width * (1 - k * 0.6) + 0.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r + (r.max - r.r) * k, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function loop(ts) {
    if (!inited) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    step(dt);
    requestAnimationFrame(loop);
  }

  TW.Cursor = {
    init: init,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    burstAt: burstAt,
    celebrate: celebrate,
    defeat: defeat,
    pulse: pulse,
    step: step,
    debug: () => ({ inited: inited, enabled: enabled, visible: visible, hover: hover, particles: particles.length, rings: rings.length, frames: frames })
  };
})(window.TW = window.TW || {});
