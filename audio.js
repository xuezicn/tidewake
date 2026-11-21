/* 汐境回响 — 纯 WebAudio 程序化音频引擎 v2.0
 * 无外部音频素材：BGM / SFX 全部实时合成。
 * 对外接口：TW.Audio = { unlock,bgm,sfx,setMaster,setBgm,setSfx,pause,resume,state }
 */
(function (TW) {
  'use strict';
  if (TW.Audio && TW.Audio.__v2) return;

  /* ================= 常量 / 工具 ================= */
  const MAX_VOICES = 24;                 // 同时发声上限，避免爆音与掉帧
  const MAX_BGM_VOICES = 14;             // 预留 10 个声部给音效
  const MAX_SFX_VOICES = 10;
  const DEFAULTS = { master: 0.55, bgm: 0.35, sfx: 0.7 };
  const clamp01 = v => {
    v = +v;
    if (!isFinite(v)) return 0;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  };
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const now = () => (ctx ? ctx.currentTime : 0);

  /* ================= 状态 ================= */
  let ctx = null;
  let masterGain = null, bgmBus = null, sfxBus = null, comp = null;
  let bgmVerb = null, sfxVerb = null, bgmDelay = null;
  let noiseBuf = null;
  let ready = false, unlocked = false, paused = false;
  let masterVol = DEFAULTS.master, bgmVol = DEFAULTS.bgm, sfxVol = DEFAULTS.sfx;
  let desiredBgm = 'menu', currentBgm = null;
  let voices = 0;
  let bgmVoices = 0, sfxVoices = 0;
  let schedTimer = null;
  const lastSfx = Object.create(null);
  const layers = [];

  /* ================= 音频图 ================= */
  function makeNoiseBuffer(seconds) {
    const len = Math.max(256, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const fade = Math.min(256, Math.floor(len / 20));
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
    return buf;
  }

  function makeImpulse(seconds, decay) {
    const len = Math.max(256, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function makeDelay() {
    const input = ctx.createDelay(1.5);
    input.delayTime.value = 0.34;
    const fb = ctx.createGain();
    fb.gain.value = 0.26;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1700;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    input.connect(lp);
    lp.connect(wet);
    wet.connect(bgmBus);
    lp.connect(fb);
    fb.connect(input);
    return input;
  }

  function createContext() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVol;

      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 24;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;

      masterGain.connect(comp);
      comp.connect(ctx.destination);

      bgmBus = ctx.createGain();
      bgmBus.gain.value = bgmVol;
      bgmBus.connect(masterGain);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxVol;
      sfxBus.connect(masterGain);

      try {
        noiseBuf = makeNoiseBuffer(3.2);

        bgmVerb = ctx.createConvolver();
        bgmVerb.buffer = makeImpulse(2.2, 2.6);
        const bgmWet = ctx.createGain();
        bgmWet.gain.value = 0.5;
        bgmVerb.connect(bgmWet);
        bgmWet.connect(bgmBus);

        sfxVerb = ctx.createConvolver();
        sfxVerb.buffer = makeImpulse(1.6, 3.2);
        const sfxWet = ctx.createGain();
        sfxWet.gain.value = 0.28;
        sfxVerb.connect(sfxWet);
        sfxWet.connect(sfxBus);

        bgmDelay = makeDelay();
      } catch (e) {
        bgmVerb = sfxVerb = bgmDelay = null;
      }

      ready = true;
      return true;
    } catch (e) {
      ctx = null;
      ready = false;
      return false;
    }
  }

  /* ================= 发声单元 ================= */
  function addVoice(src, isBgm) {
    if (isBgm) {
      if (bgmVoices >= MAX_BGM_VOICES || voices >= MAX_VOICES) return false;
      bgmVoices++;
    } else {
      if (sfxVoices >= MAX_SFX_VOICES || voices >= MAX_VOICES) return false;
      sfxVoices++;
    }
    voices++;
    src.onended = function () {
      voices = Math.max(0, voices - 1);
      if (isBgm) bgmVoices = Math.max(0, bgmVoices - 1);
      else sfxVoices = Math.max(0, sfxVoices - 1);
      try { src.disconnect(); } catch (e) {}
    };
    return true;
  }

  function tone(o) {
    if (!ctx) return null;
    const t = o.time != null ? o.time : ctx.currentTime;
    const dur = Math.max(0.02, o.dur || 0.15);
    const freq = Math.max(20, o.freq || 220);
    const src = ctx.createOscillator();
    const g = ctx.createGain();

    src.type = o.type || 'sine';
    src.frequency.setValueAtTime(freq, t);
    if (o.freqEnd) {
      src.frequency.exponentialRampToValueAtTime(
        Math.max(20, o.freqEnd),
        t + Math.max(0.01, Math.min(dur, o.glide || dur))
      );
    }
    if (o.detune) src.detune.setValueAtTime(o.detune, t);

    const atk = Math.max(0.002, Math.min(dur * 0.55, o.attack != null ? o.attack : 0.006));
    const peak = Math.max(0.0002, o.gain != null ? o.gain : 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(g);
    let tail = g;

    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filterType || 'lowpass';
      f.frequency.setValueAtTime(Math.max(60, o.filter), t);
      if (o.filterEnd) {
        f.frequency.exponentialRampToValueAtTime(Math.max(60, o.filterEnd), t + dur);
      }
      f.Q.value = o.q != null ? o.q : 0.7;
      tail.connect(f);
      tail = f;
    }
    if (o.pan != null && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan));
      tail.connect(p);
      tail = p;
    }

    tail.connect(o.dest || sfxBus);
    if (o.send && bgmDelay) {
      const sg = ctx.createGain();
      sg.gain.value = o.send;
      tail.connect(sg);
      sg.connect(bgmDelay);
    }

    if (!addVoice(src, !!o.bgm || (o.dest && o.dest !== sfxBus))) {
      try { src.disconnect(); } catch (e) {}
      return null;
    }
    try {
      src.start(t);
      src.stop(t + dur + 0.06);
    } catch (e) {
      try { src.disconnect(); } catch (e2) {}
      return null;
    }
    return src;
  }

  function noise(o) {
    if (!ctx || !noiseBuf) return null;
    const t = o.time != null ? o.time : ctx.currentTime;
    const dur = Math.max(0.02, o.dur || 0.2);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.playbackRate.value = o.rate || (0.9 + Math.random() * 0.2);

    const g = ctx.createGain();
    const atk = Math.max(0.002, Math.min(dur * 0.6, o.attack != null ? o.attack : 0.005));
    const peak = Math.max(0.0002, o.gain != null ? o.gain : 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    let node = src;
    if (o.bp) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(Math.max(80, o.bp), t);
      if (o.bpEnd) f.frequency.exponentialRampToValueAtTime(Math.max(80, o.bpEnd), t + dur);
      f.Q.value = o.q != null ? o.q : 0.9;
      node.connect(f);
      node = f;
    }
    if (o.hp) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = Math.max(40, o.hp);
      node.connect(f);
      node = f;
    }
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = Math.max(80, o.lp);
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.dest || sfxBus);

    if (!addVoice(src, !!o.bgm || (o.dest && o.dest !== sfxBus))) {
      try { src.disconnect(); } catch (e) {}
      return null;
    }
    try {
      src.start(t, Math.random() * 2.4);
      src.stop(t + dur + 0.04);
    } catch (e) {
      try { src.disconnect(); } catch (e2) {}
      return null;
    }
    return src;
  }

  function padChord(t, notes, dur, level, dest, cutoff, type) {
    if (!ctx) return;
    const g = ctx.createGain();
    const atk = Math.max(0.08, Math.min(2.0, dur * 0.42));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + atk);
    g.gain.setValueAtTime(level, t + Math.max(atk + 0.01, dur * 0.72));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);

    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    f.Q.value = 0.55;
    f.connect(g);
    g.connect(dest);

    const n = notes.length || 1;
    const per = n >= 5 ? 1 : 2;
    notes.forEach((note, i) => {
      const detunes = per === 1 ? [0] : [-5, 5];
      detunes.forEach(dt => {
        const o = ctx.createOscillator();
        o.type = type || 'sawtooth';
        o.frequency.setValueAtTime(midi(note), t);
        o.detune.setValueAtTime(dt + (i % 2 ? 2 : -2), t);
        const vg = ctx.createGain();
        vg.gain.value = 1 / (n * per);
        o.connect(vg);
        vg.connect(f);
        if (!addVoice(o, true)) return;
        try {
          o.start(t);
          o.stop(t + dur + 0.7);
        } catch (e) {}
      });
    });
  }

  function drone(layer, notes, level, cutoff, type) {
    if (!ctx) return;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = level;
    f.connect(g);
    g.connect(layer.out);

    notes.forEach((note, i) => {
      const o = ctx.createOscillator();
      o.type = type || 'sawtooth';
      o.frequency.value = midi(note);
      o.detune.value = i ? 6 : -6;
      o.connect(f);
      if (!addVoice(o, true)) return;
      try { o.start(); } catch (e) { return; }
      layer.sustain.push(o);
    });
  }

  /* ================= BGM 打击 / 拨弦 ================= */
  function kick(t, gain, dest) {
    tone({ time: t, freq: 148, freqEnd: 42, glide: 0.13, type: 'sine', dur: 0.24, gain: gain, attack: 0.002, dest: dest });
    noise({ time: t, dur: 0.035, gain: gain * 0.16, lp: 950, dest: dest });
  }

  function snare(t, gain, dest) {
    noise({ time: t, dur: 0.15, gain: gain, bp: 1500, q: 0.8, dest: dest });
    tone({ time: t, freq: 190, freqEnd: 118, dur: 0.09, gain: gain * 0.5, type: 'triangle', dest: dest });
  }

  function hat(t, gain, dest, open) {
    noise({
      time: t, dur: open ? 0.16 : 0.035,
      gain: gain, bp: 3100, q: 0.7, lp: 5200, dest: dest
    });
  }

  function pluck(t, note, dur, gain, layer, pan, send) {
    if (!layer) return;
    tone({
      time: t, freq: midi(note), type: 'triangle', dur: dur,
      gain: gain, attack: 0.004, dest: layer.out,
      filter: 2800, filterEnd: 900, q: 0.8,
      pan: pan || 0, send: send == null ? 0.4 : send
    });
  }

  /* ================= BGM 曲目 ================= */
  const MENU_CHORDS = [
    [50, 57, 62, 65, 69],  // Dm9
    [46, 53, 57, 60, 65],  // Bbmaj7
    [43, 50, 58, 62, 65],  // Gm7
    [45, 52, 57, 62, 64]   // Asus4
  ];
  const MENU_ARP = [null, null, null, null, 2, null, null, 4, null, null, 1, null, 3, null, null, 0];

  const BATTLE_CHORDS = [
    [50, 53, 57],
    [46, 50, 53],
    [43, 46, 50],
    [45, 49, 52]
  ];
  const BATTLE_ROOTS = [38, 34, 31, 33];

  const TRIAL_CHORDS = [
    [50, 53, 57, 62],
    [51, 54, 58, 63],
    [50, 53, 57, 62],
    [45, 49, 52, 55]
  ];
  const TRIAL_ROOTS = [38, 39, 38, 33];

  const TRACKS = {
    menu: {
      bpm: 70,
      level: 0.95,
      reverb: 0.55,
      loopBars: 8,
      play: function (L, step, t, stepDur) {
        const bar = Math.floor(step / 16);
        const s = step % 16;
        const ci = Math.floor(bar / 2) % MENU_CHORDS.length;
        const chord = MENU_CHORDS[ci];

        if (bar % 2 === 0 && s === 0) {
          const dur = stepDur * 32 - 0.15;
          padChord(t, chord, dur, 0.15, L.out, 820, 'sawtooth');
          tone({
            time: t, freq: midi(chord[0] - 12), type: 'sine', dur: dur,
            gain: 0.11, attack: 1.5, dest: L.out, filter: 380
          });
        }
        const idx = MENU_ARP[s];
        if (idx != null) {
          const note = chord[idx % chord.length] + 12 + (s === 13 ? 12 : 0);
          pluck(t, note, 1.0, 0.038, L, s % 2 ? -0.3 : 0.3, 0.5);
        }
        if (bar % 4 === 3 && s === 8) {
          tone({
            time: t, freq: midi(chord[3] + 24), type: 'sine', dur: 2.1,
            gain: 0.017, attack: 0.03, dest: L.out, pan: 0.25, send: 0.5
          });
        }
      }
    },

    battle: {
      bpm: 104,
      level: 1,
      reverb: 0.2,
      loopBars: 4,
      play: function (L, step, t, stepDur) {
        const bar = Math.floor(step / 16);
        const s = step % 16;
        const ci = bar % BATTLE_CHORDS.length;
        const chord = BATTLE_CHORDS[ci];
        const root = BATTLE_ROOTS[ci];

        if (s === 0 && bar % 2 === 0) {
          padChord(t, chord, stepDur * 31.4, 0.055, L.out, 620, 'sawtooth');
        }
        if (s % 4 === 0) kick(t, s === 0 ? 0.34 : 0.29, L.out);
        if (s === 4 || s === 12) snare(t, 0.065, L.out);
        if (s % 2 === 1) hat(t, s === 7 || s === 15 ? 0.026 : 0.014, L.out, s === 15);
        if (s % 2 === 0) {
          tone({
            time: t, freq: midi(root + (s === 14 ? 12 : 0)),
            type: 'triangle', dur: 0.19, gain: s % 4 === 0 ? 0.1 : 0.075,
            dest: L.out, filter: 460, q: 0.9
          });
        }
        if (s === 0 || s === 3 || s === 6 || s === 10 || s === 13) {
          const n = chord[(s + bar) % chord.length] + 12 + (s === 13 ? 12 : 0);
          pluck(t, n, 0.55, 0.03, L, (s % 4 === 0) ? -0.4 : 0.4, 0.35);
        }
      }
    },

    trial: {
      bpm: 136,
      level: 1,
      reverb: 0.18,
      loopBars: 4,
      play: function (L, step, t, stepDur) {
        const bar = Math.floor(step / 16);
        const s = step % 16;
        const ci = bar % TRIAL_CHORDS.length;
        const chord = TRIAL_CHORDS[ci];
        const root = TRIAL_ROOTS[ci];

        if (s === 0 && bar % 2 === 0) {
          padChord(t, chord, stepDur * 31.2, 0.05, L.out, 700, 'sawtooth');
          tone({
            time: t, freq: midi(chord[1] + 12), type: 'triangle', dur: 0.5,
            gain: 0.022, attack: 0.01, dest: L.out, filter: 2600, send: 0.3
          });
        }
        if (s % 4 === 0 || (s === 14 && bar % 2 === 1)) kick(t, s % 4 === 0 ? 0.3 : 0.18, L.out);
        if (s === 4 || s === 12) snare(t, 0.06, L.out);
        if (s % 2 === 1) hat(t, 0.015, L.out, s === 15);
        if (s % 2 === 0) {
          tone({
            time: t, freq: midi(root + (s === 6 || s === 14 ? 12 : 0)),
            type: 'square', dur: 0.14, gain: s % 4 === 0 ? 0.075 : 0.055,
            dest: L.out, filter: 430, q: 1.1
          });
        }
        if (s % 2 === 0) {
          const idx = (s / 2 + bar * 2) % chord.length;
          const n = chord[idx] + (s % 8 === 0 ? 24 : 12);
          pluck(t, n, 0.4, 0.026, L, s % 4 === 0 ? -0.45 : 0.45, 0.28);
        }
      }
    },

    boss: {
      bpm: 84,
      level: 1,
      reverb: 0.3,
      loopBars: 4,
      play: function (L, step, t, stepDur) {
        const bar = Math.floor(step / 16);
        const s = step % 16;

        if (s === 0) {
          [26, 38, 41, 45].forEach((n, i) => {
            tone({
              time: t + i * 0.012, freq: midi(n), type: 'sawtooth', dur: 1.9,
              gain: 0.05, attack: 0.08, dest: L.out, filter: 330, q: 0.8
            });
          });
        }
        if (s === 0 || s === 3) kick(t, s === 0 ? 0.36 : 0.2, L.out);
        if (s === 8 || s === 11) kick(t, s === 8 ? 0.3 : 0.17, L.out);
        if (s === 4 || s === 12) {
          tone({
            time: t, freq: 47, freqEnd: 29, glide: 0.5, type: 'sine',
            dur: 0.55, gain: 0.11, attack: 0.01, dest: L.out, filter: 200
          });
        }
        if (bar % 2 === 0 && s === 12) {
          noise({
            time: t, dur: 2.6, gain: 0.028, attack: 0.9,
            bp: 560, bpEnd: 1100, q: 1.4, dest: L.out
          });
        }
        if (bar % 4 === 3 && s === 6) {
          tone({ time: t, freq: midi(58), type: 'triangle', dur: 2.2, gain: 0.018, attack: 0.2, dest: L.out, filter: 700 });
          tone({ time: t, freq: midi(59), type: 'triangle', dur: 2.2, gain: 0.015, attack: 0.3, dest: L.out, filter: 700 });
        }
        if (s === 15 && bar % 2 === 1) {
          tone({
            time: t, freq: 58, freqEnd: 40, glide: 0.22, type: 'sine',
            dur: 0.26, gain: 0.06, dest: L.out
          });
        }
      }
    }
  };

  /* ================= 分层 / 交叉淡化 ================= */
  function startLayer(name) {
    const def = TRACKS[name];
    if (!def || !ctx) return null;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.connect(bgmBus);

    const send = ctx.createGain();
    send.gain.value = def.reverb != null ? def.reverb : 0.25;
    out.connect(send);
    if (bgmVerb) send.connect(bgmVerb);

    const layer = {
      name: name, def: def, out: out, send: send,
      step: 0, next: ctx.currentTime + 0.08,
      dying: false, stopAt: Infinity, sustain: []
    };

    out.gain.linearRampToValueAtTime(def.level || 0.9, ctx.currentTime + 0.8);
    if (name === 'boss') {
      drone(layer, [26, 38], 0.05, 170, 'sawtooth');
    } else if (name === 'menu') {
      drone(layer, [38], 0.016, 320, 'sine');
    }

    layers.push(layer);
    if (layers.length > 4) {
      // 极端快速切歌时，强制回收最老的层
      const old = layers.shift();
      if (old) teardown(old);
    }
    return layer;
  }

  function fadeLayer(L, secs) {
    if (!L || L.dying) return;
    L.dying = true;
    const t = now();
    L.stopAt = t + secs + 0.12;
    try {
      L.out.gain.cancelScheduledValues(t);
      L.out.gain.setValueAtTime(Math.max(0.0001, L.out.gain.value), t);
      L.out.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    } catch (e) {}
    L.sustain.forEach(o => {
      try { o.stop(L.stopAt); } catch (e) {}
    });
  }

  function teardown(L) {
    L.sustain.forEach(o => {
      try { o.stop(); } catch (e) {}
      try { o.disconnect(); } catch (e) {}
    });
    try { L.out.disconnect(); } catch (e) {}
    try { L.send.disconnect(); } catch (e) {}
  }

  function applyBgm(name) {
    if (name === currentBgm && layers.some(L => !L.dying && L.name === name)) return;
    layers.forEach(L => { if (!L.dying) fadeLayer(L, 0.8); });
    currentBgm = name;
    if (name && name !== 'none' && TRACKS[name]) startLayer(name);
  }

  /* ================= 调度器 ================= */
  function scheduler() {
    if (!ctx || paused || ctx.state !== 'running') return;
    const horizon = ctx.currentTime + 0.26;
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      if (L.dying) {
        if (ctx.currentTime >= L.stopAt) {
          teardown(L);
          layers.splice(i, 1);
        }
        continue;
      }
      if (L.next < ctx.currentTime - 0.5) L.next = ctx.currentTime + 0.05;
      const stepDur = 60 / L.def.bpm / 4;
      let guard = 0;
      while (L.next < horizon && guard++ < 64) {
        try { L.def.play(L, L.step, L.next, stepDur); } catch (e) {}
        L.next += stepDur;
        L.step++;
      }
    }
  }

  function startScheduler() {
    if (schedTimer) return;
    schedTimer = setInterval(scheduler, 70);
  }

  /* ================= SFX ================= */
  function arp(t, notes, gap, dur, gain, type, dest, send) {
    notes.forEach((n, i) => {
      tone({
        time: t + i * gap, freq: midi(n), type: type || 'triangle',
        dur: dur, gain: gain, attack: 0.005, dest: dest || sfxBus,
        filter: 3400, send: send || 0
      });
    });
  }

  const SFX = {
    click: function (t, m) {
      tone({ time: t, freq: 700, freqEnd: 620, dur: 0.05, gain: 0.055 * m, type: 'sine' });
      noise({ time: t, dur: 0.02, gain: 0.012 * m, lp: 2600 });
    },
    back: function (t, m) {
      tone({ time: t, freq: 440, freqEnd: 270, dur: 0.14, gain: 0.07 * m, type: 'triangle', filter: 2200 });
      noise({ time: t, dur: 0.05, gain: 0.018 * m, lp: 1800 });
    },
    pull: function (t, m) {
      tone({ time: t, freq: 320, freqEnd: 660, glide: 0.4, dur: 0.45, gain: 0.06 * m, type: 'sine', send: 0.3 });
      noise({ time: t, dur: 0.5, gain: 0.035 * m, attack: 0.12, bp: 750, bpEnd: 2200, q: 0.8 });
      tone({ time: t + 0.18, freq: midi(84), dur: 0.3, gain: 0.024 * m, type: 'sine', send: 0.3 });
    },
    reveal: function (t, m) {
      arp(t, [72, 76, 79], 0.08, 0.42, 0.04 * m, 'triangle', sfxBus, 0.3);
      noise({ time: t, dur: 0.45, gain: 0.025 * m, attack: 0.08, bp: 1800, bpEnd: 3200, q: 0.7 });
    },
    reveal_r: function (t, m) {
      arp(t, [60, 67], 0.09, 0.28, 0.035 * m, 'triangle', sfxBus, 0.2);
    },
    reveal_sr: function (t, m) {
      arp(t, [64, 67, 72, 76], 0.075, 0.4, 0.038 * m, 'triangle', sfxBus, 0.3);
      noise({ time: t, dur: 0.4, gain: 0.02 * m, attack: 0.06, bp: 1600, bpEnd: 3000, q: 0.7 });
    },
    reveal_ssr: function (t, m) {
      arp(t, [64, 67, 72, 76, 79, 84], 0.07, 0.55, 0.04 * m, 'triangle', sfxBus, 0.4);
      tone({ time: t, freq: midi(40), dur: 0.9, gain: 0.1 * m, type: 'sine', filter: 300 });
      noise({ time: t, dur: 0.7, gain: 0.028 * m, attack: 0.1, bp: 1500, bpEnd: 3600, q: 0.6 });
    },
    ult: function (t, m) {
      tone({ time: t, freq: 78, freqEnd: 38, glide: 0.35, dur: 0.85, gain: 0.17 * m, type: 'sine' });
      tone({ time: t, freq: 150, freqEnd: 520, glide: 0.55, dur: 0.65, gain: 0.07 * m, type: 'sawtooth', filter: 1400 });
      noise({ time: t, dur: 0.7, gain: 0.075 * m, lp: 3000 });
    },
    spell: function (t, m) {
      tone({ time: t, freq: 700, freqEnd: 1450, glide: 0.3, dur: 0.42, gain: 0.045 * m, type: 'sine', send: 0.35 });
      noise({ time: t, dur: 0.42, gain: 0.04 * m, attack: 0.03, bp: 1200, bpEnd: 3000, q: 0.8 });
      tone({ time: t + 0.04, freq: 98, dur: 0.35, gain: 0.06 * m, type: 'sine', filter: 260 });
    },
    spell_freeze: function (t, m) {
      tone({ time: t, freq: 760, freqEnd: 1500, glide: 0.35, dur: 0.5, gain: 0.04 * m, type: 'sine', send: 0.4 });
      noise({ time: t, dur: 0.55, gain: 0.04 * m, attack: 0.04, bp: 1600, bpEnd: 3400, q: 0.9 });
      tone({ time: t, freq: 120, freqEnd: 70, dur: 0.35, gain: 0.05 * m, type: 'triangle' });
    },
    spell_meteor: function (t, m) {
      noise({ time: t, dur: 0.75, gain: 0.07 * m, attack: 0.2, bp: 420, bpEnd: 1600, q: 0.8 });
      tone({ time: t + 0.32, freq: 92, freqEnd: 34, glide: 0.25, dur: 0.6, gain: 0.15 * m, type: 'sine' });
      noise({ time: t + 0.3, dur: 0.35, gain: 0.05 * m, lp: 2200 });
    },
    spell_heal: function (t, m) {
      arp(t, [64, 67, 71, 76], 0.09, 0.55, 0.032 * m, 'sine', sfxBus, 0.35);
      tone({ time: t, freq: midi(52), dur: 0.8, gain: 0.05 * m, type: 'sine', filter: 500 });
    },
    combo: function (t, m) {
      tone({ time: t, freq: 740, freqEnd: 990, dur: 0.1, gain: 0.045 * m, type: 'triangle', filter: 3000 });
      noise({ time: t, dur: 0.03, gain: 0.01 * m, lp: 3200 });
    },
    burst: function (t, m) {
      noise({ time: t, dur: 0.9, gain: 0.055 * m, attack: 0.35, bp: 320, bpEnd: 1800, q: 0.8 });
      tone({ time: t, freq: 96, freqEnd: 360, glide: 0.8, dur: 0.85, gain: 0.075 * m, type: 'sawtooth', filter: 1200 });
      arp(t + 0.78, [64, 67, 72, 79], 0.05, 0.5, 0.033 * m, 'triangle', sfxBus, 0.3);
    },
    wave: function (t, m) {
      tone({ time: t, freq: 110, dur: 0.7, gain: 0.085 * m, type: 'sawtooth', filter: 620, attack: 0.05 });
      tone({ time: t + 0.06, freq: 165, dur: 0.6, gain: 0.055 * m, type: 'triangle', filter: 900, attack: 0.05 });
      kick(t, 0.16 * m, sfxBus);
    },
    boss: function (t, m) {
      tone({ time: t, freq: 56, freqEnd: 38, glide: 0.7, dur: 1.5, gain: 0.17 * m, type: 'sine', filter: 220 });
      noise({ time: t, dur: 1.3, gain: 0.075 * m, attack: 0.15, lp: 480 });
      tone({ time: t + 0.1, freq: midi(50), dur: 1.1, gain: 0.026 * m, type: 'triangle', filter: 760 });
      tone({ time: t + 0.1, freq: midi(51), dur: 1.1, gain: 0.022 * m, type: 'triangle', filter: 760 });
    },
    win: function (t, m) {
      arp(t, [60, 64, 67, 72, 76], 0.105, 0.45, 0.05 * m, 'triangle', sfxBus, 0.2);
      tone({ time: t, freq: midi(48), dur: 0.9, gain: 0.06 * m, type: 'sine', filter: 420 });
    },
    lose: function (t, m) {
      arp(t, [57, 53, 50, 45], 0.16, 0.55, 0.055 * m, 'sine', sfxBus, 0.15);
      tone({ time: t, freq: midi(33), dur: 1.2, gain: 0.08 * m, type: 'sine', filter: 300 });
    },
    levelup: function (t, m) {
      arp(t, [64, 67, 72, 76], 0.075, 0.32, 0.045 * m, 'triangle', sfxBus, 0.2);
      tone({ time: t + 0.15, freq: midi(88), dur: 0.35, gain: 0.022 * m, type: 'sine', send: 0.3 });
    },
    error: function (t, m) {
      tone({ time: t, freq: 178, dur: 0.09, gain: 0.06 * m, type: 'square', filter: 620 });
      tone({ time: t + 0.11, freq: 148, dur: 0.12, gain: 0.055 * m, type: 'square', filter: 560 });
    },
    deploy: function (t, m) {
      tone({ time: t, freq: 210, freqEnd: 90, glide: 0.12, dur: 0.22, gain: 0.12 * m, type: 'sine' });
      noise({ time: t, dur: 0.09, gain: 0.03 * m, lp: 1100 });
      tone({ time: t + 0.02, freq: 880, freqEnd: 1200, glide: 0.18, dur: 0.18, gain: 0.016 * m, type: 'sine', send: 0.2 });
    },
    shoot: function (t, m) {
      noise({ time: t, dur: 0.03, gain: 0.014 * m, bp: 1900, q: 1.2 });
      tone({ time: t, freq: 960, freqEnd: 760, dur: 0.032, gain: 0.012 * m, type: 'triangle', filter: 3000 });
    },
    hit: function (t, m) {
      tone({ time: t, freq: 132, freqEnd: 72, dur: 0.06, gain: 0.035 * m, type: 'triangle' });
      noise({ time: t, dur: 0.04, gain: 0.014 * m, lp: 1400 });
    },
    summon: function (t, m) {
      tone({ time: t, freq: 240, freqEnd: 980, glide: 0.45, dur: 0.55, gain: 0.055 * m, type: 'sine', send: 0.35 });
      noise({ time: t, dur: 0.45, gain: 0.022 * m, attack: 0.15, bp: 900, bpEnd: 2400, q: 0.8 });
    }
  };

  const ALIAS = {
    tap: 'click', confirm: 'click', cancel: 'back',
    gacha: 'pull', ultimate: 'ult', awaken: 'burst',
    victory: 'win', defeat: 'lose', level_up: 'levelup',
    err: 'error', combo_hit: 'combo', wave_start: 'wave',
    boss_warn: 'boss', 'reveal-ssr': 'reveal_ssr', 'reveal-sr': 'reveal_sr',
    'reveal-r': 'reveal_r', reveal_ur: 'reveal_ssr'
  };

  const THROTTLE = { click: 0.035, shoot: 0.06, hit: 0.045, combo: 0.05, deploy: 0.05, back: 0.05 };

  /* ================= 对外接口 ================= */
  function unlock() {
    if (!ctx && !createContext()) return false;
    unlocked = true;
    if (ctx.state !== 'running' && !paused) {
      try {
        const p = ctx.resume();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
    if (desiredBgm && desiredBgm !== 'none' && desiredBgm !== currentBgm) {
      applyBgm(desiredBgm);
    }
    startScheduler();
    return true;
  }

  function bgm(name) {
    name = name == null ? 'none' : String(name);
    if (name !== 'none' && !TRACKS[name]) name = 'menu';
    desiredBgm = name;
    if (!ctx || !unlocked) return;
    applyBgm(name);
  }

  function sfx(name, opts) {
    if (!ctx || paused || !unlocked) return false;
    if (ctx.state !== 'running') return false;
    name = name == null ? '' : String(name);
    let key = ALIAS[name] || name;
    if (key.indexOf('reveal_') === 0 && !SFX[key]) key = 'reveal_ssr';
    const fn = SFX[key];
    if (!fn) return false;
    const t = ctx.currentTime;
    const th = THROTTLE[key];
    if (th && t - (lastSfx[key] || -9) < th) return false;
    if (sfxVoices >= MAX_SFX_VOICES || voices >= MAX_VOICES) return false;
    lastSfx[key] = t;
    const mul = opts && isFinite(+opts.volume) ? Math.max(0, Math.min(1.5, +opts.volume)) : 1;
    try {
      fn(t, mul);
      return true;
    } catch (e) {
      return false;
    }
  }

  function setMaster(v) {
    masterVol = clamp01(v);
    if (masterGain) {
      const t = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setTargetAtTime(masterVol, t, 0.03);
    }
  }

  function setBgm(v) {
    bgmVol = clamp01(v);
    if (bgmBus) {
      const t = ctx.currentTime;
      bgmBus.gain.cancelScheduledValues(t);
      bgmBus.gain.setTargetAtTime(bgmVol, t, 0.05);
    }
  }

  function setSfx(v) {
    sfxVol = clamp01(v);
    if (sfxBus) {
      const t = ctx.currentTime;
      sfxBus.gain.cancelScheduledValues(t);
      sfxBus.gain.setTargetAtTime(sfxVol, t, 0.03);
    }
  }

  function pause() {
    paused = true;
    if (ctx && ctx.state === 'running') {
      try {
        const p = ctx.suspend();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
  }

  function resume() {
    if (!ctx) return;
    paused = false;
    layers.forEach(L => {
      if (!L.dying) L.next = Math.max(L.next, ctx.currentTime + 0.1);
    });
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try {
        const p = ctx.resume();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
      // iOS 偶发 resume 被挂起：稍后再试一次
      setTimeout(function () {
        if (!paused && ctx && ctx.state !== 'running') {
          try {
            const q = ctx.resume();
            if (q && q.catch) q.catch(function () {});
          } catch (e) {}
        }
      }, 120);
    }
  }

  function state() {
    return {
      ready: ready,
      unlocked: unlocked,
      paused: paused,
      context: ctx ? ctx.state : 'none',
      sampleRate: ctx ? ctx.sampleRate : 0,
      track: currentBgm,
      desiredTrack: desiredBgm,
      master: masterVol,
      bgmVolume: bgmVol,
      sfxVolume: sfxVol,
      voices: voices,
      bgmVoices: bgmVoices,
      sfxVoices: sfxVoices,
      layers: layers.length,
      maxVoices: MAX_VOICES,
      maxSfxVoices: MAX_SFX_VOICES
    };
  }

  // 页面隐藏时自动暂停；恢复时自动续播（main.js 也会显式调用，幂等）。
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else if (unlocked) resume();
    });
  }

  TW.Audio = {
    __v2: true,
    unlock: unlock,
    bgm: bgm,
    sfx: sfx,
    setMaster: setMaster,
    setBgm: setBgm,
    setSfx: setSfx,
    pause: pause,
    resume: resume,
    state: state,
    tracks: ['menu', 'battle', 'trial', 'boss'],
    defaults: DEFAULTS
  };
})(window.TW = window.TW || {});
