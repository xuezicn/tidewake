/* 汐境回响 — 界面层 */
(function (TW) {
  'use strict';
  const D = TW.DATA;
  const $ = s => document.querySelector(s);
  const app = () => document.getElementById('app');
  const overlay = () => document.getElementById('overlay');

  /* ================= 程序化立绘 ================= */
  let uid = 0;
  function figure(def, opt) {
    opt = opt || {};
    const u = 'f' + (++uid);
    const elx = D.ELEMENTS[def.element] || D.ELEMENTS.tide;
    const c = elx.color, deep = elx.deep;
    const acc = (def.art && def.art.accent) || c;
    const form = (def.art && def.art.form) || 'robe';
    const hair = (def.art && def.art.hair) || 'short';
    const weapon = (def.art && def.art.weapon) || 'staff';
    const guard = form === 'guard' || def.role === 'guard';
    const sw = guard ? 1.14 : 1;
    const mini = !!opt.mini;
    const big = !!opt.big;
    const shards = mini ? 4 : (big ? 12 : 7);

    let shardSvg = '';
    for (let i = 0; i < shards; i++) {
      const a = (i / shards) * Math.PI * 2 + 0.35;
      const rr = 118 + (i % 3) * 20;
      const x = 150 + Math.cos(a) * rr * 0.86;
      const y = 180 + Math.sin(a) * rr * 1.05;
      const s = 4 + (i % 3) * 2.5;
      shardSvg += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(i * 41) % 360})" opacity="${0.4 + (i % 3) * 0.16}">
        <path d="M0 ${-s * 2} L${s} 0 L0 ${s * 2} L${-s} 0 Z" fill="${acc}" opacity=".9"/>
      </g>`;
    }

    let rays = '';
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.28;
      rays += `<path d="M150 190 L${150 + Math.cos(a) * 260} ${190 + Math.sin(a) * 260}" stroke="${c}" stroke-width="1" opacity=".06"/>`;
    }

    let weaponSvg = '';
    if (weapon === 'staff') {
      weaponSvg = `<g>
        <path d="M234 340 L221 152" stroke="${acc}" stroke-width="3.4" opacity=".92"/>
        <circle cx="218" cy="134" r="17" fill="${deep}" stroke="${acc}" stroke-width="2.6"/>
        <circle cx="218" cy="134" r="31" fill="none" stroke="${acc}" stroke-width="1" opacity=".35"/>
        <circle cx="218" cy="134" r="5.5" fill="${acc}"/>
        <path d="M218 96 v16 M218 156 v16 M180 134 h16 M240 134 h16" stroke="${acc}" stroke-width="1.4" opacity=".5"/>
      </g>`;
    } else if (weapon === 'blade') {
      weaponSvg = `<g>
        <path d="M204 334 L216 344 L254 108 L243 96 Z" fill="url(#blade${u})" stroke="${acc}" stroke-width="2"/>
        <path d="M247 104 L214 332" stroke="#ffffff" stroke-width="1" opacity=".16"/>
        <rect x="198" y="326" width="26" height="7" rx="3" fill="${acc}" opacity=".85"/>
      </g>`;
    } else if (weapon === 'bow') {
      weaponSvg = `<g fill="none" stroke="${acc}" stroke-width="3" opacity=".92">
        <path d="M202 112 Q272 206 202 302"/>
        <path d="M202 112 L202 302" stroke-width="1" opacity=".55"/>
        <path d="M202 208 L258 208" stroke-width="2.2"/>
        <path d="M252 204 l8 4 -8 4" stroke-width="2.2"/>
      </g>`;
    } else if (weapon === 'shield') {
      weaponSvg = `<g>
        <path d="M64 208 Q98 190 134 208 L127 298 Q98 326 71 298 Z" fill="${deep}" stroke="${acc}" stroke-width="2.6"/>
        <path d="M99 220 L99 292 M80 246 L118 246" stroke="${acc}" stroke-width="2" opacity=".5"/>
        <path d="M99 232 L112 246 L99 260 L86 246 Z" fill="${acc}" opacity=".55"/>
      </g>`;
    } else if (weapon === 'orb') {
      weaponSvg = `<g>
        <circle cx="220" cy="146" r="17" fill="${deep}" stroke="${acc}" stroke-width="2.4"/>
        <circle cx="220" cy="146" r="30" fill="none" stroke="${acc}" stroke-width="1" opacity=".4"/>
        <ellipse cx="220" cy="146" rx="42" ry="14" fill="none" stroke="${acc}" stroke-width="1.2" opacity=".55" transform="rotate(-26 220 146)"/>
        <circle cx="220" cy="146" r="6" fill="${acc}" opacity=".9"/>
      </g>`;
    } else if (weapon === 'gun') {
      weaponSvg = `<g fill="${deep}" stroke="${acc}" stroke-width="2" opacity=".95">
        <rect x="198" y="220" width="66" height="15" rx="4"/>
        <rect x="248" y="224" width="34" height="7" rx="2"/>
        <rect x="206" y="233" width="14" height="24" rx="4"/>
        <rect x="226" y="233" width="8" height="14" rx="3"/>
      </g>`;
    } else if (weapon === 'hammer') {
      weaponSvg = `<g stroke="${acc}" stroke-width="3" opacity=".92">
        <path d="M198 342 L220 196"/>
        <rect x="198" y="166" width="48" height="32" rx="5" fill="${deep}"/>
        <path d="M206 174 h32" stroke-width="2" opacity=".6"/>
      </g>`;
    } else if (weapon === 'pick') {
      weaponSvg = `<g stroke="${acc}" stroke-width="3" fill="none" opacity=".92">
        <path d="M196 344 L218 188"/>
        <path d="M182 186 Q218 148 254 186"/>
      </g>`;
    } else if (weapon === 'book') {
      weaponSvg = `<g fill="${deep}" stroke="${acc}" stroke-width="2" opacity=".95">
        <rect x="200" y="204" width="42" height="52" rx="4"/>
        <path d="M210 220 h22 M210 232 h22 M210 244 h16" stroke="${acc}" stroke-width="1.6"/>
      </g>`;
    } else if (weapon === 'lantern') {
      weaponSvg = `<g>
        <path d="M216 196 v18" stroke="${acc}" stroke-width="2"/>
        <rect x="200" y="214" width="32" height="40" rx="6" fill="${deep}" stroke="${acc}" stroke-width="2.2"/>
        <circle cx="216" cy="234" r="8" fill="${acc}" opacity=".85"/>
        <circle cx="216" cy="234" r="18" fill="${acc}" opacity=".12"/>
      </g>`;
    } else if (weapon === 'harpoon') {
      weaponSvg = `<g stroke="${acc}" stroke-width="3" fill="none" opacity=".92">
        <path d="M206 344 L218 162"/>
        <path d="M206 162 L218 140 L230 162"/>
        <path d="M210 168 l-6 10 M226 168 l6 10" stroke-width="2"/>
      </g>`;
    } else if (weapon === 'fist') {
      weaponSvg = `<g>
        <circle cx="220" cy="250" r="17" fill="${deep}" stroke="${acc}" stroke-width="2.4"/>
        <path d="M210 244 h20 M210 251 h20 M210 258 h20" stroke="${acc}" stroke-width="1.4" opacity=".6"/>
      </g>`;
    }

    let hairSvg = '';
    if (hair === 'long') {
      hairSvg = `<path d="M123 138 Q104 206 113 286 L133 279 Q120 206 135 152 Z" fill="url(#hair${u})"/>
                 <path d="M177 138 Q196 206 187 286 L167 279 Q180 206 165 152 Z" fill="url(#hair${u})"/>`;
    } else if (hair === 'ponytail') {
      hairSvg = `<path d="M176 128 Q224 150 218 228 Q202 204 190 194 Q202 160 168 148 Z" fill="url(#hair${u})"/>`;
    }

    const hood = hair === 'hood' || form === 'robe' || form === 'mage';
    const helm = hair === 'helm';

    let headSvg = '';
    if (hood) {
      headSvg = `
        <path d="M114 150 Q114 92 150 84 Q186 92 186 150 Q186 176 168 186 L132 186 Q114 176 114 150 Z" fill="${deep}" stroke="${acc}" stroke-width="2"/>
        <path d="M120 146 Q122 100 150 92" stroke="${acc}" stroke-width="1.2" opacity=".45" fill="none"/>
        <path d="M130 140 Q150 132 170 140 L166 172 Q150 182 134 172 Z" fill="#060f16"/>
        <path d="M138 152 l9 2.5" stroke="${acc}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M162 152 l-9 2.5" stroke="${acc}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M146 165 v6 M154 165 v6" stroke="${acc}" stroke-width="1" opacity=".3"/>`;
    } else if (helm) {
      headSvg = `
        <path d="M118 150 Q118 94 150 86 Q182 94 182 150 L175 176 L125 176 Z" fill="${deep}" stroke="${acc}" stroke-width="2.4"/>
        <path d="M150 92 L150 170" stroke="${acc}" stroke-width="1.6" opacity=".55"/>
        <path d="M129 146 L171 146" stroke="${acc}" stroke-width="2.4" opacity=".8"/>
        <path d="M132 158 l8 2 M168 158 l-8 2" stroke="${acc}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M126 184 L174 184" stroke="${acc}" stroke-width="1.4" opacity=".35"/>`;
    } else {
      headSvg = `
        <path d="M126 148 Q126 104 150 100 Q174 104 174 148 Q174 174 150 180 Q126 174 126 148 Z" fill="#0a1a24" stroke="${acc}" stroke-width="1.8"/>
        <path d="M124 140 Q126 102 150 98 Q174 102 176 140 Q162 128 150 130 Q138 128 124 140 Z" fill="url(#hair${u})"/>
        <path d="M136 150 l8 2 M164 150 l-8 2" stroke="${acc}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M145 166 h10" stroke="${acc}" stroke-width="1" opacity=".3"/>`;
    }

    const cloak = `M${150 - 54 * sw} 400 L${150 - 46 * sw} 252 Q${150 - 40 * sw} 214 ${150 - 17 * sw} 202 L${150 + 17 * sw} 202 Q${150 + 40 * sw} 214 ${150 + 46 * sw} 252 L${150 + 54 * sw} 400 Z`;
    const chest = `M${150 - 28 * sw} 214 Q150 201 ${150 + 28 * sw} 214 L${150 + 33 * sw} 296 L150 328 L${150 - 33 * sw} 296 Z`;

    return `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="bg${u}" cx="50%" cy="36%" r="64%">
          <stop offset="0" stop-color="${acc}" stop-opacity=".34"/>
          <stop offset=".5" stop-color="${c}" stop-opacity=".08"/>
          <stop offset="1" stop-color="${c}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="body${u}" x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stop-color="#1d4354"/>
          <stop offset=".42" stop-color="${deep}"/>
          <stop offset="1" stop-color="#040b11"/>
        </linearGradient>
        <linearGradient id="chest${u}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${deep}"/>
          <stop offset=".55" stop-color="#0a1c26"/>
          <stop offset="1" stop-color="#061017"/>
        </linearGradient>
        <linearGradient id="hair${u}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${acc}" stop-opacity=".6"/>
          <stop offset="1" stop-color="#08141b" stop-opacity=".35"/>
        </linearGradient>
        <linearGradient id="beam${u}" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${acc}" stop-opacity=".16"/>
          <stop offset="1" stop-color="${acc}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="blade${u}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="${deep}"/>
          <stop offset=".5" stop-color="#2a4d5e"/>
          <stop offset="1" stop-color="${acc}"/>
        </linearGradient>
        <pattern id="scan${u}" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.2" fill="${c}" opacity=".14"/>
        </pattern>
        <clipPath id="clip${u}"><path d="${cloak}"/></clipPath>
      </defs>

      <rect width="300" height="400" fill="url(#bg${u})"/>
      <path d="M150 396 L120 60 L180 60 Z" fill="url(#beam${u})"/>
      ${rays}
      <ellipse cx="150" cy="190" rx="116" ry="148" fill="none" stroke="${c}" stroke-width="1" opacity=".18"/>
      <ellipse cx="150" cy="190" rx="94" ry="120" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="3 10" opacity=".14"/>
      ${shardSvg}

      ${weaponSvg}

      <path d="${cloak}" fill="url(#body${u})" stroke="${acc}" stroke-width="1.8"/>
      <path d="${cloak}" fill="url(#scan${u})" opacity=".45"/>
      <path d="M${150 - 50 * sw} 392 L${150 - 44 * sw} 258" stroke="${acc}" stroke-width="1.6" opacity=".55"/>
      <path d="M${150 + 50 * sw} 392 L${150 + 44 * sw} 258" stroke="${acc}" stroke-width="1.6" opacity=".35"/>

      <path d="${chest}" fill="url(#chest${u})" stroke="${acc}" stroke-width="1.6" opacity=".98"/>
      <path d="M${150 - 24 * sw} 224 L${150 + 24 * sw} 224 L${150 + 27 * sw} 288 L150 314 L${150 - 27 * sw} 288 Z" fill="none" stroke="${acc}" stroke-width="1" opacity=".28"/>
      <path d="M150 216 L150 318" stroke="${acc}" stroke-width="1" opacity=".18"/>

      ${hairSvg}

      <path d="M${150 - 30 * sw} 206 L${150 - 58 * sw} 218 L${150 - 64 * sw} 248 L${150 - 43 * sw} 258 L${150 - 25 * sw} 232 Z" fill="${deep}" stroke="${acc}" stroke-width="1.8"/>
      <path d="M${150 + 30 * sw} 206 L${150 + 58 * sw} 218 L${150 + 64 * sw} 248 L${150 + 43 * sw} 258 L${150 + 25 * sw} 232 Z" fill="${deep}" stroke="${acc}" stroke-width="1.8"/>
      <path d="M${150 - 52 * sw} 224 L${150 - 44 * sw} 238" stroke="${acc}" stroke-width="1.2" opacity=".6"/>
      <path d="M${150 + 52 * sw} 224 L${150 + 44 * sw} 238" stroke="${acc}" stroke-width="1.2" opacity=".6"/>

      <path d="M${150 - 46 * sw} 256 L${150 - 55 * sw} 338 L${150 - 39 * sw} 344 L${150 - 28 * sw} 264 Z" fill="${deep}" stroke="${acc}" stroke-width="1.2" opacity=".85"/>
      <path d="M${150 + 46 * sw} 256 L${150 + 55 * sw} 338 L${150 + 39 * sw} 344 L${150 + 28 * sw} 264 Z" fill="${deep}" stroke="${acc}" stroke-width="1.2" opacity=".85"/>

      <rect x="141" y="176" width="18" height="24" fill="#08141c" stroke="${acc}" stroke-width="1" opacity=".8"/>
      ${headSvg}

      <g transform="translate(150,258)">
        <path d="M0 -14 L12 0 L0 14 L-12 0 Z" fill="${deep}" stroke="${acc}" stroke-width="1.7"/>
        <path d="M0 -6 L5.5 0 L0 6 L-5.5 0 Z" fill="${acc}" opacity=".9"/>
        <path d="M-22 0 H-14 M14 0 H22" stroke="${acc}" stroke-width="1.2" opacity=".45"/>
      </g>

      <path d="M${150 - 34 * sw} 344 Q150 366 ${150 + 34 * sw} 344" fill="none" stroke="${acc}" stroke-width="1.4" opacity=".4"/>
      <ellipse cx="150" cy="378" rx="88" ry="16" fill="none" stroke="${acc}" stroke-width="1.4" opacity=".26"/>
      <ellipse cx="150" cy="378" rx="56" ry="9" fill="${acc}" opacity=".08"/>

      <g clip-path="url(#clip${u})" opacity=".5">
        <path d="M${150 - 30 * sw} 300 Q150 292 ${150 + 30 * sw} 300" fill="none" stroke="${acc}" stroke-width="1"/>
        <path d="M${150 - 34 * sw} 318 Q150 310 ${150 + 34 * sw} 318" fill="none" stroke="${acc}" stroke-width="1"/>
      </g>
    </svg>`;
  }

  /* ================= 图标 ================= */
  const ICONS = {
    campaign: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    hero: '<path d="M12 3l7 3v6c0 4.2-3 7.1-7 9-4-1.9-7-4.8-7-9V6z"/><circle cx="12" cy="10" r="2.6"/><path d="M8.5 16c.8-2 2-3 3.5-3s2.7 1 3.5 3"/>',
    gacha: '<path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>',
    dungeon: '<path d="M5 20V9l7-5 7 5v11"/><path d="M9 20v-6a3 3 0 016 0v6"/>',
    more: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
    gem: '<path d="M12 3l7 5-7 13L5 8z"/><path d="M5 8h14M12 3v18" opacity=".4"/>',
    gold: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.2" opacity=".5"/>',
    book: '<path d="M5 5h6a3 3 0 013 3v11a3 3 0 00-3-3H5z"/><path d="M19 5h-2a3 3 0 00-3 3v11a3 3 0 013-3h2z" opacity=".6"/>',
    crystal: '<path d="M12 3l5 6-5 12-5-12z"/><path d="M7 9h10" opacity=".5"/>',
    stone: '<path d="M5 9l4-4h6l4 4-2 10H7z"/><path d="M9 9h6" opacity=".5"/>',
    star: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.5l6.4-.6z"/>',
    mail: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 8l9 6 9-6"/>',
    quest: '<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    shop: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 018 0v2"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function icon(name, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  /* ================= 工具 ================= */
  const fmt = n => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kfmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : Math.round(n);
  const el = (id) => document.getElementById(id);
  const heroDef = id => D.HERO_MAP[id];
  const owned = id => !!TW.Game.save.heroes[id];
  const heroState = id => TW.Game.save.heroes[id];
  const ELEM = key => D.ELEMENTS[key] || D.ELEMENTS.tide;

  function toast(text, kind) { TW.toast(text, kind); }

  function cardHTML(def, opt) {
    opt = opt || {};
    const st = heroState(def.id);
    const elx = ELEM(def.element);
    const r = def.rarity;
    const lv = st ? st.lv : 1;
    const stars = st ? st.star : 0;
    return `<div class="card rarity-${r}" data-act="hero" data-id="${def.id}" ${opt.delay ? `style="animation-delay:${opt.delay}ms"` : ''}>
      <div class="card-in">
        <div class="art" style="background:radial-gradient(120% 90% at 50% 8%, ${ELEM(def.element).color}33, #07141c 72%)">${figure(def, { mini: true })}<div class="shade"></div></div>
        <div class="badge" style="color:${D.RARITY[r].color}">${r}</div>
        <div class="el" style="color:${elx.color}">${elx.icon}</div>
        <div class="stars">${'★'.repeat(stars)}</div>
        ${st && st.dup ? `<div style="position:absolute;right:8px;top:34px;z-index:3;font-size:9px;color:#7ff3e6;background:rgba(4,12,18,.72);padding:1px 5px;border-radius:6px">共鸣 ${st.dup}</div>` : ''}
        <div class="meta">
          <div class="nm">${def.name}${opt.isNew ? ' <span style="color:#ffca6b;font-size:10px">NEW</span>' : (opt.isDup ? ' <span style="color:#7ff3e6;font-size:10px">共鸣 +1</span>' : '')}</div>
          <div class="ttl">${def.doctor ? '<span class="doc-tag">医</span>' : ''}${def.title}</div>
        </div>
        ${opt.showLv && st ? `<div class="lv">Lv.${lv}</div>` : ''}
      </div>
    </div>`;
  }

  function resBar() {
    const s = TW.Game.save;
    const dev = TW.Game.isDev();
    const num = n => dev ? '∞' : fmt(n);
    const name = TW.Game.accountName() || s.name || '守望者';
    return `<div class="res">
      <div class="res-chip gem">${icon('gem', 'ricon')}<span>${num(s.gem)}</span></div>
      <div class="res-chip">${icon('gold', 'ricon')}<span>${num(s.gold)}</span></div>
      <div class="res-chip res-crystal">${icon('crystal', 'ricon')}<span>${num(s.crystal)}</span></div>
      <button class="res-chip res-settings" data-act="settings" title="设置">${icon('settings', 'ricon')}</button>
      <button class="res-chip res-account" data-act="accounts" title="账户：${esc(name)}">
        <span class="acc-avatar">${esc(String(name).slice(0, 1) || '守')}</span>
        <span class="acc-name">${esc(name)}</span>
        ${dev ? '<span class="dev-badge">DEV</span>' : ''}
      </button>
    </div>`;
  }

  function topbar() {
    return `<header class="topbar">
      <div class="brand"><b>汐境回响</b><span>TIDEWAKE</span></div>
      ${resBar()}
    </header>`;
  }

  const TABS = [
    { id: 'home', label: '主线', icon: 'campaign' },
    { id: 'heroes', label: '英雄', icon: 'hero' },
    { id: 'gacha', label: '召唤', icon: 'gacha' },
    { id: 'dungeons', label: '副本', icon: 'dungeon' },
    { id: 'more', label: '更多', icon: 'more' }
  ];
  function tabbar(active) {
    const s = TW.Game.save;
    const unread = (s.mail || []).filter(m => !m.claimed).length;
    return `<nav class="tabbar">${TABS.map(t => `
      <button class="tab ${t.id === active ? 'on' : ''}" data-act="tab" data-to="${t.id}">
        ${icon(t.icon)}<span>${t.label}</span>
        ${t.id === 'more' && (unread > 0 || claimableQuests() > 0) ? '<i class="dot"></i>' : ''}
      </button>`).join('')}</nav>`;
  }

  /* ================= 路由 ================= */
  let state = { chapter: 1, heroFilter: 'all', pickSlot: 0, heroLimit: 24, pickerLimit: 24, pickerSlot: 0, trialDraft: null, trialPick: null, trialReroll: false, battleChoices: null };

  function go(route) {
    if (location.hash === '#/' + route) render();
    else location.hash = '#/' + route;
  }

  function parse() {
    const h = (location.hash || '#/home').replace(/^#\/?/, '');
    const p = h.split('/').filter(Boolean);
    return { name: p[0] || 'home', arg: p[1] || null };
  }

  /* ================= 首页 ================= */
  function nextStage() {
    const s = TW.Game.save;
    for (const st of D.STAGES) {
      if (!s.prog[st.id] || !s.prog[st.id].clears) return st;
    }
    return D.STAGES[D.STAGES.length - 1];
  }

  function claimableQuests() {
    const s = TW.Game.save;
    return D.QUESTS.filter(q => !s.quests[q.id]?.claimed && (s.quests[q.id]?.n || 0) >= q.target).length;
  }

  function screenHome() {
    const s = TW.Game.save;
    const ns = nextStage();
    const ch = D.CHAPTERS[ns.chapter - 1];
    const featured = heroDef('miya');
    const ownedSSR = Object.keys(s.heroes).map(heroDef).filter(h => h && h.rarity === 'SSR');
    const showHero = ownedSSR.sort((a, b) => TW.Game.power(b.id) - TW.Game.power(a.id))[0] || featured;
    const power = TW.Game.teamPower();
    const signinReady = TW.Game.signinReady();
    return `<div class="screen home">
      ${topbar()}
      <div class="home-main">
        <section class="hero-copy">
          <div class="eyebrow">CHAPTER ${String(ch.n).padStart(2, '0')} · ${ch.name}</div>
          <h1>${ch.name}</h1>
          <p class="sub">${ch.sub}</p>
          <div class="home-actions">
            <button class="btn gold" data-act="continue">继续主线 <span class="kicker">${ns.id}</span></button>
            <button class="btn ghost" data-act="tab" data-to="gacha">召唤</button>
          </div>
          <div class="hero-figure">${figure(showHero, { big: true })}</div>
        </section>
        <aside class="home-side">
          <div class="panel power-card">
            <div class="power-orb">${power >= 10000 ? (power / 1000).toFixed(1) + 'k' : power}</div>
            <div class="grow">
              <div class="lbl">队伍战力</div>
              <div class="val">${fmt(power)}</div>
              <div class="small dim">推荐 ${fmt(ns.recommendedPower)} · ${power >= ns.recommendedPower ? '状态良好' : '可以试试'}</div>
            </div>
            <button class="btn sm ghost" data-act="tab" data-to="heroes">编队</button>
          </div>
          <div class="quick-grid">
            <button class="quick" data-act="tab" data-to="more">
              <span class="qi">${icon('quest')}</span><b>每日任务</b><span>${claimableQuests() ? claimableQuests() + ' 项可领取' : '推进战线'}</span>
            </button>
            <button class="quick" data-act="signin">
              <span class="qi">${icon('star')}</span><b>签到</b><span>${signinReady ? '今日可领取' : '明日再来'}</span>
            </button>
            <button class="quick" data-act="tab" data-to="dungeons">
              <span class="qi">${icon('dungeon')}</span><b>资源副本</b><span>金币 / 经验 / 潮晶</span>
            </button>
            <button class="quick" data-act="tab" data-to="more">
              <span class="qi">${icon('shop')}</span><b>商店</b><span>用星砂换成长</span>
            </button>
            <button class="quick" data-act="trial" style="grid-column:1/-1">
              <span class="qi">${icon('star')}</span><b>深渊试炼</b><span>30 波 · 三选一祝福 · 最高 ${s.trialBest || 0} 波</span>
            </button>
          </div>
          <div class="news"><span class="tag">NOTICE</span><span class="small muted">原创企划 · 所有角色与剧情均为本作原创。v2.19 开放 8 章 96 关 · 103 位英雄。</span></div>
        </aside>
      </div>
      ${tabbar('home')}
    </div>`;
  }

  function openTeamPicker(slot) {
    if (!TW.Game.isSlotUnlocked(slot)) {
      return toast('第 ' + (slot + 1) + ' 位：通关第 ' + TW.Game.slotUnlockChapter(slot) + ' 章解锁', 'warn');
    }
    const s = TW.Game.save;
    state.pickerSlot = slot;
    const ids = Object.keys(s.heroes).sort((a, b) => TW.Game.power(b) - TW.Game.power(a));
    const shown = ids.slice(0, state.pickerLimit);
    const grid = shown.map(id => {
      const inTeam = s.formation.indexOf(id);
      return `<div style="position:relative" data-act="assign" data-id="${id}" data-slot="${slot}">
        <div style="pointer-events:none">${cardHTML(heroDef(id), { showLv: true })}</div>
        ${inTeam >= 0 ? `<div style="position:absolute;left:6px;bottom:6px;font-size:9px;padding:1px 6px;border-radius:6px;background:rgba(63,224,208,.16);color:#3fe0d0">位 ${inTeam + 1}</div>` : ''}
      </div>`;
    }).join('');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>选择英雄 · 第 ${slot + 1} 位</h2>
      <div class="sub">点击卡片上阵；已在队伍中的英雄会移动位置。已显示 ${shown.length} / ${ids.length}</div>
      <div class="hero-grid small" style="margin-top:14px">${grid}</div>
      ${ids.length > state.pickerLimit ? `<div style="text-align:center;margin-top:12px"><button class="btn ghost" data-act="morepicker" data-slot="${slot}">加载更多（剩余 ${ids.length - state.pickerLimit}）</button></div>` : ''}
      <div class="modal-actions">
        <button class="btn ghost" data-act="unassign" data-slot="${slot}">移除此位</button>
        <button class="btn ghost" data-act="closeModal">取消</button>
      </div>`, 'wide');
  }

  /* ================= 主线 ================= */
  function chapterCleared(n) {
    const s = TW.Game.save;
    return !!(s.prog[n + '-12'] && s.prog[n + '-12'].clears);
  }
  function chapterStars(n) {
    const s = TW.Game.save;
    let stars = 0, cleared = 0;
    for (let i = 1; i <= 12; i++) {
      const p = s.prog[n + '-' + i];
      if (p) { stars += p.stars; if (p.clears) cleared++; }
    }
    return { stars, cleared };
  }

  function screenCampaign() {
    const cards = D.CHAPTERS.map((ch, i) => {
      const unlocked = i === 0 || chapterCleared(i);
      const st = chapterStars(ch.n);
      return `<button class="chapter-card ${unlocked ? '' : 'locked'}" ${unlocked ? `data-act="chapter" data-n="${ch.n}"` : 'disabled'} style="--ch-tint:${ELEM(['tide','gale','stone','void','ember','tide','void','stone'][i]).color}33">
        <div class="chno">CHAPTER ${String(ch.n).padStart(2, '0')}</div>
        <h3>${ch.name}</h3>
        <div class="chsub">${ch.sub}</div>
        <div class="chfoot">
          ${unlocked ? `<span>已通关 ${st.cleared}/12</span><span class="stars">${'★'.repeat(Math.min(3, Math.round(st.stars / 12)))}</span>` : `<span>${icon('lock')} 通关上一章解锁</span>`}
        </div>
      </button>`;
    }).join('');
    return `<div class="screen">
      ${topbar()}
      <div style="margin-top:22px" class="spread">
        <div><div class="panel-title">CAMPAIGN</div><h2 class="section-title" style="margin-top:6px">主线战役</h2></div>
        <div class="small dim">8 章 · 96 关</div>
      </div>
      <div class="chapter-grid">${cards}</div>
      ${tabbar('home')}
    </div>`;
  }

  function screenChapter(n) {
    const ch = D.CHAPTERS[n - 1];
    if (!ch) return screenCampaign();
    const s = TW.Game.save;
    const nodes = [];
    for (let i = 1; i <= 12; i++) {
      const st = D.STAGE_MAP[n + '-' + i];
      const p = s.prog[st.id];
      const prev = i === 1 ? true : !!(s.prog[n + '-' + (i - 1)] && s.prog[n + '-' + (i - 1)].clears);
      const locked = !prev;
      nodes.push(`<button class="stage-node ${st.boss ? 'boss' : ''} ${p && p.clears ? 'cleared' : ''} ${locked ? 'locked' : ''}"
        ${locked ? 'disabled' : `data-act="stage" data-id="${st.id}"`}>
        <div class="sn">${n}-${i}</div>
        <div class="st">${p ? '★'.repeat(p.stars) + '☆'.repeat(3 - p.stars) : (st.boss ? 'BOSS' : '')}</div>
        <div class="sp">${kfmt(st.recommendedPower)}</div>
      </button>`);
    }
    return `<div class="screen">
      ${topbar()}
      <div class="row" style="margin-top:16px;gap:12px">
        <button class="bh-btn" data-act="back">${icon('back')}</button>
        <div>
          <div class="panel-title">CHAPTER ${String(n).padStart(2, '0')}</div>
          <h2 class="section-title" style="margin-top:4px">${ch.name}</h2>
        </div>
        <div class="grow"></div>
        <div class="small dim">${ch.sub}</div>
      </div>
      <div class="stage-grid">${nodes.join('')}</div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-title">章节档案</div>
        <p class="lore" style="margin-top:10px">${ch.story.join(' ')}</p>
        <div class="tagrow" style="margin-top:12px">
          <span class="tag">BOSS 首通 · SR ${(D.STAGE_MAP[n + '-12'].firstClear.find(r => r.kind === 'hero') || {}).id ? D.HERO_MAP[D.STAGE_MAP[n + '-12'].firstClear.find(r => r.kind === 'hero').id].name : '英雄'}</span>
          <span class="tag">章节星数 ${chapterStars(n).stars} / 36</span>
          <span class="tag">推荐战力 ${kfmt(D.STAGE_MAP[n + '-12'].recommendedPower)}</span>
        </div>
      </div>
      ${tabbar('home')}
    </div>`;
  }

  /* ================= 关卡弹窗 ================= */
  function repeatOf(st) {
    if (!st) return [];
    return Array.isArray(st.repeat) ? st.repeat : [st.repeat];
  }

  function rewardList(list) {
    return list.map(r => {
      if (r.kind === 'hero') {
        const h = D.HERO_MAP[r.id];
        return `<span class="tag" style="color:${D.RARITY[h.rarity].color}">英雄 · ${h.name}</span>`;
      }
      const map = { gem: ['星砂', 'gem'], gold: ['金币', 'gold'], book: ['经验书', 'book'], crystal: ['潮晶', 'crystal'], stone: ['强化石', 'stone'], star: ['星辉', 'star'] };
      const it = map[r.kind] || [r.kind, 'gold'];
      return `<span class="tag">${it[0]} +${r.amount}</span>`;
    }).join('');
  }

  function diffKey() {
    const k = TW.Game.save.settings.difficulty;
    return (D.DIFFICULTY && D.DIFFICULTY[k]) ? k : 'hard';
  }
  function diffButtons(act, stageId) {
    const cur = diffKey();
    return (D.DIFF_ORDER || ['easy','normal','hard','nightmare']).map(k => {
      const d = D.DIFFICULTY[k];
      if (!d) return '';
      return `<button class="btn sm ${k === cur ? 'gold' : 'ghost'}" data-act="${act}" data-d="${k}"${stageId ? ` data-id="${esc(stageId)}"` : ''}>${d.short}</button>`;
    }).join('');
  }

  function openStage(stageId, dungeon) {
    const st = D.STAGE_MAP[stageId] || dungeon;
    const s = TW.Game.save;
    const p = s.prog[stageId];
    const first = !p || !p.clears;
    const rewards = dungeon ? dungeon.rewards : (first ? st.firstClear : repeatOf(st));
    const tp = TW.Game.teamPower();
    const stars = p ? p.stars : 0;
    const wi = (D.WEATHER_INFO && D.WEATHER_INFO[st.weather]) || null;
    const modTags = [];
    if (st.modifiers) {
      if (st.modifiers.enemyHp) modTags.push('敌人生命 +' + Math.round((st.modifiers.enemyHp - 1) * 100) + '%');
      if (st.modifiers.enemySpeed) modTags.push('敌人移速 +' + Math.round((st.modifiers.enemySpeed - 1) * 100) + '%');
      if (st.modifiers.playerAtk) modTags.push('我方攻击 ' + Math.round((st.modifiers.playerAtk - 1) * 100) + '%');
    }
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <div class="panel-title">${String(st.id).indexOf('daily') === 0 || String(st.id).indexOf('dungeon') === 0 ? 'CHALLENGE' : 'STAGE ' + st.id}</div>
      <h2>${st.name}</h2>
      <div class="sub">${st.chapterName || ''} · 推荐战力 ${fmt(st.recommendedPower)}</div>
      <div class="row" style="margin-top:16px;gap:8px;flex-wrap:wrap">${rewardList(rewards)}</div>
      <div class="stat-row"><span>你的队伍战力</span><b style="color:${tp >= st.recommendedPower ? 'var(--ok)' : 'var(--gold-300)'}">${fmt(tp)}</b></div>
      ${wi ? `<div class="stat-row"><span>天气</span><span class="small dim">${wi.name} · ${wi.desc}</span></div>` : ''}
      ${modTags.length ? `<div class="stat-row"><span>战场修正</span><span class="small dim">${modTags.join(' · ')}</span></div>` : ''}
      <div class="stat-row"><span>战斗难度</span><span class="row" style="gap:4px;flex-wrap:wrap;justify-content:flex-end">${diffButtons('difficulty', stageId)}</span></div>
      <div class="small dim" style="margin-top:-2px">${(D.DIFFICULTY[diffKey()] || {}).desc || ''}</div>
      <div class="stat-row"><span>三星条件</span><span class="small dim">通关 / 基地不掉血 / ${st.timeLimit >= 9999 ? '不限时' : st.timeLimit + ' 秒内'}</span></div>
      ${stars ? `<div class="stat-row"><span>最佳记录</span><b>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</b></div>` : ''}
      <div class="modal-actions">
        <button class="btn gold" data-act="battle" data-id="${stageId}">${first ? '首通挑战' : '再次挑战'}</button>
        ${stars >= 3 ? `<button class="btn ghost" data-act="sweep" data-id="${stageId}">扫荡</button>` : ''}
        <button class="btn ghost" data-act="closeModal">返回</button>
      </div>`);
  }

  /* ================= 编队 ================= */
  function teamIds() {
    const s = TW.Game.save;
    return (s.formation || []).map(id => id && s.heroes[id] ? id : null);
  }

  function screenHeroes() {
    const s = TW.Game.save;
    const ids = Object.keys(s.heroes);
    const f = state.heroFilter;
    let list = ids.map(heroDef).filter(Boolean);
    if (f === 'doctor') list = list.filter(h => h.doctor);
    else if (f === 'SSR' || f === 'SR' || f === 'R' || f === 'N') list = list.filter(h => h.rarity === f);
    else if (['tide', 'ember', 'gale', 'stone', 'void'].includes(f)) list = list.filter(h => h.element === f);
    list.sort((a, b) => D.RARITY[b.rarity].order - D.RARITY[a.rarity].order || TW.Game.power(b.id) - TW.Game.power(a.id));

    const filters = [['all', '全部'], ['doctor', '医生'], ['SSR', 'SSR'], ['SR', 'SR'], ['R', 'R'], ['N', 'N'], ['tide', '潮'], ['ember', '焰'], ['gale', '岚'], ['stone', '岩'], ['void', '虚']]
      .map(([k, label]) => `<button class="btn sm ${f === k ? 'cyan' : 'ghost'}" data-act="filter" data-k="${k}">${label}</button>`).join('');

    return `<div class="screen">
      ${topbar()}
      <div class="spread" style="margin-top:20px">
        <div><div class="panel-title">ROSTER</div><h2 class="section-title" style="margin-top:6px">英雄</h2></div>
        <div class="small dim">${ids.length} / ${D.HEROES.length}</div>
      </div>
      <div class="team-layout" style="margin-top:14px">
        <div>
          <div class="panel">
            <div class="spread"><div class="panel-title">当前编队</div><div class="small dim">战力 <b style="color:var(--gold-300)">${fmt(TW.Game.teamPower())}</b></div></div>
            <div class="slots" style="margin-top:12px">${teamSlotsHTML()}</div>
            <div class="row" style="margin-top:12px">
              <button class="btn sm ghost" data-act="autoteam">自动编队</button>
              <button class="btn sm ghost" data-act="clearteam">清空</button>
              <div class="grow"></div>
              <span class="small dim">点击槽位后选择英雄 · 每通关 1 章解锁 1 位</span>
            </div>
          </div>
          <div class="row" style="margin-top:14px;flex-wrap:wrap;gap:8px">${filters}</div>
          <div class="small dim" style="margin-top:10px">已显示 ${Math.min(state.heroLimit, list.length)} / ${list.length}</div>
      <div class="hero-grid">${list.length ? list.slice(0, state.heroLimit).map(h => cardHTML(h, { showLv: true })).join('') : '<div class="dim" style="padding:20px">还没有英雄，去召唤吧。</div>'}</div>
      ${list.length > state.heroLimit ? `<div style="text-align:center;margin-top:14px"><button class="btn ghost" data-act="moreheroes">加载更多（剩余 ${list.length - state.heroLimit}）</button></div>` : ''}
        </div>
        <aside class="team-summary">
          <div class="panel">
            <div class="panel-title">编队分析</div>
            <div class="stat-row"><span>队伍战力</span><b>${fmt(TW.Game.teamPower())}</b></div>
            <div class="stat-row"><span>上阵人数</span><b>${teamIds().slice(0, TW.Game.unlockedSlots()).filter(Boolean).length} / ${TW.Game.unlockedSlots()}</b></div>
            <div class="stat-row"><span>编队上限</span><b>${TW.Game.unlockedSlots()} / 10</b></div>
            <div class="stat-row"><span>元素覆盖</span><b>${new Set(teamIds().slice(0, TW.Game.unlockedSlots()).filter(Boolean).map(id => heroDef(id).element)).size} 种</b></div>
            <div class="stat-row"><span>推荐</span><span class="small dim">1 战士 · 1 医生 · 其余输出</span></div>
          </div>
          <div class="panel">
            <div class="panel-title">协同</div>
            <div class="synergy-row" style="margin-top:10px">${(() => {
              const syn = teamBonuses();
              const all = ['element2', 'element3', 'guardHealer', 'rangerMage', 'healerSupport'];
              return all.map(id => {
                const info = (D.SYNERGY_INFO && D.SYNERGY_INFO[id]) || { name: id, desc: '' };
                const on = syn.active.indexOf(id) >= 0;
                return `<span class="synergy-tag ${on ? 'on' : ''}" title="${info.desc}">${info.name}${on ? ' ✓' : ''}</span>`;
              }).join('');
            })()}</div>
            <p class="small muted" style="margin-top:10px">同元素 2/3 人、战士+医生、猎手+术士、医生+引路人会触发额外加成。实际数值在进入战斗时生效。</p>
          </div>
        </aside>
      </div>
      ${tabbar('heroes')}
    </div>`;
  }

  function teamSlotsHTML() {
    const ids = teamIds();
    const unlocked = TW.Game.unlockedSlots();
    return ids.map((id, i) => {
      if (i >= unlocked) {
        const ch = TW.Game.slotUnlockChapter(i);
        return `<button class="slot locked" data-act="lockedSlot" data-i="${i}" title="通关第 ${ch} 章解锁">
          <span class="lock">${icon('lock')}</span>
          <span>第 ${i + 1} 位</span>
          <span class="small">通关 ${ch}-12</span>
        </button>`;
      }
      if (id) return `<button class="slot filled" data-act="slot" data-i="${i}" title="点击更换">${cardHTML(heroDef(id), {})}</button>`;
      return `<button class="slot" data-act="slot" data-i="${i}"><span class="plus">+</span><span>空位 ${i + 1}</span></button>`;
    }).join('');
  }

  /* ================= 英雄详情 ================= */
  function screenHero(id) {
    const def = heroDef(id);
    if (!def) return screenHeroes();
    const st = heroState(id);
    if (!st) return screenHeroes();
    const stats = TW.Game.heroStats(id);
    const elx = ELEM(def.element);
    const cap = D.LEVEL_CAP[st.asc];
    const lvCost = TW.Game.levelCost(id);
    const eqNames = ['武器', '护甲', '饰品', '核心'];
    return `<div class="screen">
      ${topbar()}
      <div class="row" style="margin-top:14px">
        <button class="bh-btn" data-act="back">${icon('back')}</button>
        <span class="small dim">英雄详情</span>
      </div>
      <div class="detail">
        <div class="detail-art">
          ${figure(def, { big: true })}
          <div class="frame"></div>
        </div>
        <div class="detail-body">
          <div class="detail-head">
            <div class="row"><h2>${def.name}</h2><span class="tag rar" style="background:linear-gradient(180deg,${elx.color},${elx.color}88);color:#04141a">${def.rarity}</span></div>
            <div class="title">${def.title} · ${elx.name} · ${{ guard: '战士', ranger: '输出', mage: '术师', healer: '医生', support: '辅助' }[def.role]}</div>
            <div class="tagrow">
              <span class="tag">Lv.${st.lv} / ${cap}</span>
              <span class="tag">${'★'.repeat(st.star)}${'☆'.repeat(5 - st.star)}</span>
              <span class="tag" style="color:var(--cyan-300)">同名共鸣 ${st.dup || 0}</span>
              <span class="tag">战力 ${fmt(stats.power)}</span>
              <span class="tag">部署 ${def.cost} 潮能</span>
            </div>
          </div>

          <div class="panel" style="padding:14px">
            ${['atk:攻击', 'hp:生命', 'def:防御', 'spd:攻速', 'range:射程'].map(s => {
              const [k, label] = s.split(':');
              const v = stats[k];
              return `<div class="stat-row"><span>${label}</span><b>${k === 'spd' ? v.toFixed(2) + 's' : k === 'range' ? v.toFixed(1) + ' 格' : fmt(v)}</b></div>`;
            }).join('')}
          </div>

          <div class="skill-box">
            <h4>${def.skill.name} <span class="small dim">· 主动</span></h4>
            <p>${def.skill.desc}</p>
          </div>
          <div class="skill-box">
            <h4 style="color:var(--gold-300)">${def.passive.name} <span class="small dim">· 被动</span></h4>
            <p>${def.passive.desc}</p>
          </div>

          <div class="quote">“${def.quote}”</div>
          <div class="lore">${def.lore}</div>

          <div class="panel" style="padding:14px">
            <div class="panel-title">养成</div>
            <div class="up-row" style="margin-top:10px">
              <button class="btn sm ghost" data-act="levelup" data-id="${id}" data-mode="1" ${st.lv >= cap ? 'disabled' : ''}>
                升级 ×1 <span class="kicker">${fmt(lvCost.gold)} 金币 / ${lvCost.book} 书</span>
              </button>
              <button class="btn sm gold" data-act="levelup" data-id="${id}" data-mode="max" ${st.lv >= cap ? 'disabled' : ''}>
                升到上限 <span class="kicker">${st.lv >= cap ? '已满' : '自动消耗'}</span>
              </button>
            </div>
            <div class="up-row" style="margin-top:10px">
              <button class="btn sm ghost" data-act="ascend" data-id="${id}" ${st.asc >= 5 ? 'disabled' : ''}>
                突破 ${st.asc}→${st.asc + 1} <span class="kicker">${st.asc >= 5 ? '已满' : TW.Game.ascendCost(st.asc).crystal + ' 潮晶'}</span>
              </button>
              <button class="btn sm ghost" data-act="skillup" data-id="${id}" ${st.skill >= 5 ? 'disabled' : ''}>
                技能 ${st.skill}→${st.skill + 1} <span class="kicker">${st.skill >= 5 ? '已满' : TW.Game.skillCost(st.skill).crystal + ' 潮晶'}</span>
              </button>
              <button class="btn sm ghost" data-act="starup" data-id="${id}" ${st.star >= 5 || (st.dup || 0) < 1 ? 'disabled' : ''}>
                升阶 ${st.star}→${st.star + 1} <span class="kicker">${st.star >= 5 ? '已满' : (st.dup || 0) > 0 ? '消耗 1 同名共鸣' : '抽到重复解锁'}</span>
              </button>
            </div>
            <div class="eq-grid" style="margin-top:12px">
              ${eqNames.map((nm, i) => `<div class="eq"><div class="en">${nm}</div><div class="el">+${st.eq[i]}</div><button data-act="equip" data-id="${id}" data-slot="${i}" ${st.eq[i] >= 20 ? 'disabled' : ''}>${st.eq[i] >= 20 ? '已满' : '强化'}</button></div>`).join('')}
            </div>
            <p class="small dim" style="margin-top:10px">抽到重复英雄会转化为该英雄的「同名共鸣」；每个共鸣可升 1 阶，最高 5 阶。</p>
          </div>
        </div>
      </div>
      ${tabbar('heroes')}
    </div>`;
  }

  /* ================= 抽卡 ================= */
  const GACHA = { featured: 'miya', pool: 'up' };

  function screenGacha() {
    const s = TW.Game.save;
    const f = heroDef(GACHA.featured);
    const pity = s.gacha.pity;
    const pct = Math.min(100, pity / D.RATES.hardPity * 100);
    return `<div class="screen">
      ${topbar()}
      <div class="gacha-hero" style="margin-top:16px">
        <div class="g-rings"><i></i><i></i><i></i></div>
        <div class="g-fig">${figure(f, { big: true })}</div>
        <div class="g-copy">
          <div class="eyebrow">LIMITED · 潮律</div>
          <h2>弥娅 · 潮律共鸣</h2>
          <p>本期 UP：SSR「弥娅」概率提升。SSR 出货时 50% 为 UP；歪了下次必中。</p>
          <div class="pity">
            <div class="spread small"><span class="dim">距离保底</span><span class="mono">${pity} / ${D.RATES.hardPity}</span></div>
            <div class="bar"><i style="width:${pct}%"></i></div>
          </div>
          <div class="small" style="color:var(--gold-300);margin-top:8px">首次十连必出 SSR · 每日免费 1 抽</div>
          <div class="small dim" style="margin-top:3px">重复英雄 → 同名共鸣，用于升阶</div>
        </div>
      </div>

      <div class="row" style="margin-top:14px;flex-wrap:wrap;gap:8px">
        <button class="btn sm ${GACHA.pool === 'up' ? 'cyan' : 'ghost'}" data-act="pool" data-p="up">UP 池 · 弥娅</button>
        <button class="btn sm ${GACHA.pool === 'std' ? 'cyan' : 'ghost'}" data-act="pool" data-p="std">标准池</button>
        <div class="grow"></div>
        <button class="btn sm ghost" data-act="rates">概率公示</button>
        <span class="small dim">免费单抽：${TW.Game.freePullReady() ? '可用' : '今日已用'}</span>
      </div>

      <div class="pull-row">
        <button class="btn gold pull-btn" data-act="pull" data-n="1" data-pool="${GACHA.pool}" ${s.gem < 120 ? 'disabled' : ''}>
          <span>召唤 ×1</span><span class="price">120 星砂</span>
        </button>
        <button class="btn gold pull-btn" data-act="pull" data-n="10" data-pool="${GACHA.pool}" ${s.gem < 1000 ? 'disabled' : ''}>
          <span>召唤 ×10 <small>至少 1 个 SR</small></span><span class="price">1,000 星砂</span>
        </button>
        <button class="btn ghost pull-btn" data-act="freepull" data-pool="${GACHA.pool}" ${TW.Game.freePullReady() ? '' : 'disabled'}>
          <span>每日免费单抽</span><span class="price">0 星砂 · ${TW.Game.freePullReady() ? '可领取' : '明天再来'}</span>
        </button>
      </div>

      <div class="panel" style="margin-top:18px">
        <div class="panel-title">概率</div>
        <div class="stat-row"><span>SSR</span><b>2.2% 基础 · 3.0% 综合</b></div>
        <div class="stat-row"><span>SR</span><b>12.0%</b></div>
        <div class="stat-row"><span>R</span><b>35.0%</b></div>
        <div class="stat-row"><span>N</span><b>50.0%</b></div>
        <div class="stat-row"><span>保底</span><span class="small dim">46 抽后概率递增，60 抽必出 SSR</span></div>
      </div>
      ${tabbar('gacha')}
    </div>`;
  }

  let gachaBusy = false;

  function startPull(n, pool) {
    if (gachaBusy) return;
    const s = TW.Game.save;
    const cost = n === 1 ? 120 : 1000;
    if (s.gem < cost) return toast('星砂不足', 'warn');
    gachaBusy = true;
    const pack = TW.Game.pull(n, pool);
    if (!pack) { gachaBusy = false; return; }
    playGacha(pack, n, pool);
  }

  function startFreePull(pool) {
    if (gachaBusy) return;
    if (!TW.Game.freePullReady()) return toast('今日免费已用', 'warn');
    gachaBusy = true;
    const pack = TW.Game.pull(1, pool, true);
    playGacha(pack, 1, pool);
  }

  function gachaSfx(name) {
    if (!TW.Audio) return;
    try { TW.Audio.sfx(name); } catch (e) {}
  }
  function clearGachaSfx() {
    (state.gachaSfx || []).forEach(clearTimeout);
    state.gachaSfx = [];
  }

  function goldIntroHTML(ssr) {
    const dust = Array.from({ length: 34 }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * 40;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      return `<span style="--x:${x.toFixed(1)}vmin;--y:${y.toFixed(1)}vmin;--d:${(0.7 + Math.random() * 0.6).toFixed(2)}s;animation-delay:${(Math.random() * 0.55).toFixed(2)}s"></span>`;
    }).join('');
    const rays = Array.from({ length: 14 }, (_, i) =>
      `<i style="--a:${(i * 360 / 14).toFixed(1)}deg;--d:${(i % 4) * 0.07}s"></i>`).join('');
    const el = (D.ELEMENTS[ssr.element] || { name: '' }).name;
    return `<div class="gx-gold">
      <div class="gx-gold-dust">${dust}</div>
      <div class="gx-gold-core">
        <i class="gx-gold-ring a"></i><i class="gx-gold-ring b"></i><i class="gx-gold-ring c"></i>
        <i class="gx-gold-orb"></i>
      </div>
      <div class="gx-gold-rays">${rays}</div>
      <div class="gx-gold-pillar"></div>
      <div class="gx-gold-figure">${figure(ssr, { big: true })}</div>
      <div class="gx-gold-shock"></div>
      <div class="gx-gold-title">
        <span>GOLDEN TIDE · SSR</span>
        <b>金潮共鸣</b>
        <em>${esc(el)} · ${esc(ssr.name)} · ${esc(ssr.title || '')}</em>
      </div>
      <div class="gx-gold-flash"></div>
    </div>`;
  }

  function playGacha(pack, n, pool) {
    const fx = document.getElementById('gachaFx');
    fx.classList.remove('hidden');
    const hasSSR = pack.heroes.some(h => h.rarity === 'SSR');
    const ssr = pack.heroes.find(h => h.rarity === 'SSR' && h.id === GACHA.featured) || pack.heroes.find(h => h.rarity === 'SSR');
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    fx.classList.toggle('gx-ssr', hasSSR);
    if (hasSSR) fx.classList.add('gx-got-ssr'); else fx.classList.remove('gx-got-ssr');
    clearGachaSfx();
    gachaSfx('pull');

    const shards = Array.from({ length: 26 }, () =>
      `<span class="gx-shard" style="left:${5 + Math.random() * 90}%;animation-duration:${1.1 + Math.random() * 1.4}s;animation-delay:${Math.random() * 1.2}s;height:${14 + Math.random() * 22}px"></span>`).join('');

    fx.innerHTML = hasSSR
      ? `${goldIntroHTML(ssr)}<button class="gx-skip" data-act="skipGacha">跳过</button>`
      : `<div class="gx-ring r1"></div><div class="gx-ring r2"></div><div class="gx-ring r3"></div>
        ${shards}
        <div class="gx-flash" id="gxFlash"></div>
        <div class="gx-center">
          <div class="hint">TIDE RESPONDS</div>
          <div class="big">潮汐回应</div>
        </div>
        <button class="gx-skip" data-act="skipGacha">跳过</button>`;

    if (hasSSR && !reduce) {
      state.gachaSfx = [
        setTimeout(() => { if (gachaBusy) gachaSfx('reveal_sr'); }, 520),
        setTimeout(() => { if (gachaBusy) gachaSfx('reveal_ssr'); }, 1150),
        setTimeout(() => { if (gachaBusy) gachaSfx('burst'); }, 1420)
      ];
    }

    const reveal = () => {
      if (!gachaBusy) return;
      gachaBusy = false;
      clearGachaSfx();
      if (state.gachaTimer) { clearTimeout(state.gachaTimer); state.gachaTimer = null; }
      renderResults(pack, n, pool, hasSSR);
    };
    const delay = hasSSR ? (reduce ? 900 : 3200) : 1550;
    const timer = setTimeout(reveal, delay);
    state.gachaTimer = timer;
    state.gachaReveal = reveal;
  }

  function renderResults(pack, n, pool, hasSSR) {
    const fx = document.getElementById('gachaFx');
    state.gachaReveal = null;
    clearGachaSfx();
    if (state.gachaTimer) { clearTimeout(state.gachaTimer); state.gachaTimer = null; }
    const dupCount = (pack.isDup || []).filter(Boolean).length;
    const cards = pack.heroes.map((h, i) => cardHTML(h, { isNew: pack.isNew[i], isDup: pack.isDup && pack.isDup[i], delay: i * 70 })).join('');
    const againCost = n === 1 ? 120 : 1000;
    const rain = hasSSR ? `<div class="gx-gold-rain">${Array.from({ length: 24 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 1.6}s;animation-duration:${1.4 + Math.random() * 1.5}s"></i>`).join('')}</div>` : '';
    fx.innerHTML = `<div class="gx-results">
      ${rain}
      <h2>召唤结果</h2>
      ${dupCount ? `<div class="small" style="text-align:center;color:var(--cyan-300);margin-bottom:8px">同名共鸣 +${dupCount} · 前往英雄详情升阶</div>` : ''}
      <div class="gx-grid">${cards}</div>
      <div class="gx-again">
        <button class="btn gold" data-act="again" data-n="${n}" data-pool="${pool}" ${TW.Game.save.gem < againCost ? 'disabled' : ''}>再来一次 · ${fmt(againCost)}</button>
        <button class="btn ghost" data-act="closeGacha">返回</button>
      </div>
    </div>`;
  }

  function closeGacha() {
    clearGachaSfx();
    const fx = document.getElementById('gachaFx');
    fx.classList.add('hidden');
    fx.classList.remove('gx-ssr', 'gx-got-ssr');
    gachaBusy = false;
    state.gachaReveal = null;
    render();
  }

  /* ================= 副本 / 更多 ================= */
  function dungeonStage(d, idx) {
    const ch = Math.min(8, Math.max(1, TW.Game.maxChapter()));
    const base = D.STAGE_MAP[ch + '-6'];
    const stage = JSON.parse(JSON.stringify(base));
    stage.id = 'dungeon-' + d.id;
    stage.name = d.name + ' · 第 ' + (idx + 1) + ' 层';
    stage.chapterName = '资源副本';
    stage.recommendedPower = Math.round(base.recommendedPower * 0.8);
    stage.timeLimit = 150;
    stage.rewards = d.id === 'gold' ? [{ kind: 'gold', amount: 150000 + ch * 60000 }]
      : d.id === 'exp' ? [{ kind: 'book', amount: 20 + ch * 8 }]
      : d.id === 'crys' ? [{ kind: 'crystal', amount: 25 + ch * 12 }]
      : [{ kind: 'stone', amount: 20 + ch * 10 }];
    stage.dungeon = d;
    return stage;
  }


  /* ================= 深渊试炼 ================= */
  const TRIAL_ICON = { sword:'⚔', shield:'⛨', wind:'≋', bolt:'ϟ', coin:'◎', target:'◉', drop:'◈', eye:'◉', wave:'≈', star:'✦' };
  const TIER_CN = { common:'普通', rare:'稀有', epic:'史诗' };

  function pickBlessingChoices(n) {
    const pool = D.TRIAL_BLESSINGS || [];
    const out = [];
    const used = {};
    let guard = 0;
    while (out.length < n && guard++ < 80) {
      const r = Math.random();
      const tier = r < 0.6 ? 'common' : r < 0.9 ? 'rare' : 'epic';
      const tierPool = pool.filter(b => b.tier === tier && !used[b.id]);
      const anyPool = pool.filter(b => !used[b.id]);
      const src = tierPool.length ? tierPool : anyPool;
      if (!src.length) break;
      const pick = src[Math.floor(Math.random() * src.length)];
      used[pick.id] = true;
      out.push(pick);
    }
    return out;
  }

  function rollTrialDraft() {
    state.trialDraft = pickBlessingChoices(3);
    state.trialPick = null;
    return state.trialDraft;
  }

  function buildTrialStage() {
    const T = D.TRIAL || { waves: 30, baseStage: '5-4' };
    const base = JSON.parse(JSON.stringify(D.STAGE_MAP[T.baseStage] || D.STAGE_MAP['5-4']));
    const N = T.waves || 30;
    const waves = [];
    for (let w = 0; w < N; w++) {
      const list = [];
      const baseCount = 3 + Math.floor(w / 4);
      list.push({ type: 'grunt', count: baseCount, interval: Math.max(0.32, 0.78 - w * 0.012) });
      if (w >= 2) list.push({ type: 'runner', count: 1 + Math.floor(w / 8), interval: 0.7 });
      if (w >= 5) list.push({ type: 'ranged', count: 1 + Math.floor(w / 10), interval: 1.1 });
      if (w >= 8) list.push({ type: 'shield', count: 1, interval: 1.2 });
      if (w >= 12) list.push({ type: 'flyer', count: 1, interval: 1.1 });
      if (w >= 16) list.push({ type: 'summon', count: 1, interval: 1.4 });
      if (w >= 6 && w % 4 === 0) list.push({ type: 'brute', count: 1 + Math.floor(w / 14), interval: 1.2 });
      if (w > 0 && w % 10 === 0) list.push({ type: 'boss', count: 1 });
      else if (w > 0 && w % 5 === 0) list.push({ type: 'elite', count: 1 });
      waves.push({ at: 2 + w * 7, enemies: list });
    }
    base.id = 'trial';
    base.trial = true;
    base.name = '深渊试炼';
    base.chapterName = '无尽回廊';
    base.global = 18;
    base.baseHp = 60;
    base.timeLimit = 9999;
    base.recommendedPower = 20000;
    base.weather = 'void';
    base.firstClear = [];
    base.repeat = [];
    base.waves = waves;
    return base;
  }

  function screenTrial() {
    if (!state.trialDraft) rollTrialDraft();
    const s = TW.Game.save;
    const list = state.trialDraft || [];
    const picked = list.find(b => b.id === state.trialPick);
    const lead = (teamIds().filter(Boolean).map(heroDef).filter(Boolean)[0]) || heroDef('miya');
    const best = s.trialBest || 0;
    const runs = s.trialRuns || 0;
    const leadSvg = figure(lead, { big: true }).replace('<svg ', '<svg style="height:100%;width:auto;display:block" ');
    const cards = list.map(b => `
      <button class="blessing tier-${b.tier} ${b.id === state.trialPick ? 'sel' : ''}" data-act="trialPick" data-id="${b.id}">
        <span class="b-icon">${TRIAL_ICON[b.icon] || '✦'}</span>
        <b>${b.name}</b>
        <span>${b.desc}</span>
        <em>${TIER_CN[b.tier] || b.tier}</em>
      </button>`).join('');

    return `<div class="screen">
      ${topbar()}
      <div class="row" style="margin-top:14px">
        <button class="bh-btn" data-act="back">${icon('back')}</button>
        <div><div class="panel-title">ABYSS TRIAL</div><h2 class="section-title" style="margin-top:4px">深渊试炼</h2></div>
        <div class="grow"></div>
        <div class="small dim">最高 ${best} 波 · 已挑战 ${runs} 次</div>
      </div>

      <div class="trial-hero" style="position:relative;margin-top:14px;min-height:280px;max-height:340px;overflow:hidden;border-radius:22px;padding:26px;display:flex;align-items:flex-start;justify-content:center;flex-direction:column;background:linear-gradient(120deg,rgba(9,30,40,.9),rgba(22,14,40,.86));box-shadow:inset 0 0 0 1px rgba(127,243,230,.16)">
        <div class="th-copy" style="position:relative;z-index:2;max-width:62%;margin:0;flex:1">
          <div class="eyebrow">ROGUELIKE · 30 WAVES</div>
          <h2>潮水没有尽头</h2>
          <p>先选 1 条潮汐祝福，10 / 20 波再各选 1 条。每 3 波敌人都会更强，10 / 20 / 30 波有首领镇守。走得越远，奖励越高。</p>
          <div class="trial-record"><span class="panel-title">BEST</span><b>${best} <i>波</i></b></div>
          <div class="trial-actions" style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
            <button class="btn gold sm" data-act="trialStart" ${picked ? '' : 'disabled'}>${picked ? '开始 · ' + picked.name : '先选一条祝福'}</button>
            <button class="btn ghost sm" data-act="trialReroll" ${state.trialReroll ? 'disabled' : ''}>换一批</button>
          </div>
        </div>
        <div class="th-fig" style="position:absolute;right:0;top:-10%;height:120%;opacity:.9;pointer-events:none">${leadSvg}</div>
      </div>

      <div class="spread" style="margin-top:20px">
        <div><div class="panel-title">BLESSING</div><h2 class="section-title" style="margin-top:4px">三选一</h2></div>
        <button class="btn sm ghost" data-act="trialReroll" ${state.trialReroll ? 'disabled' : ''}>${state.trialReroll ? '已重抽' : '重抽一次'}</button>
      </div>
      <div class="trial-blessings" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px">${cards}</div>

      <div class="modal-actions" style="margin-top:18px">
        <button class="btn gold" data-act="trialStart" ${picked ? '' : 'disabled'} style="flex:2">进入深渊${picked ? ' · ' + picked.name : ''}</button>
        <button class="btn ghost" data-act="back">返回副本</button>
      </div>

      <div class="panel" style="margin-top:16px">
        <div class="panel-title">规则</div>
        <div class="stat-row"><span>波次</span><b>30</b></div>
        <div class="stat-row"><span>祝福</span><span class="small dim">${picked ? picked.name + ' · ' + picked.desc : '选择 1 条后开始'}</span></div>
        <div class="stat-row"><span>中途祝福</span><span class="small dim">第 10 / 20 波各再选 1 条</span></div>
        <div class="stat-row"><span>奖励</span><span class="small dim">每波 60 星砂 / 25,000 金币 / 2 经验书；通刷额外 3,000 星砂 + 100 万金币</span></div>
        <div class="stat-row"><span>失败</span><span class="small dim">按已通过波次结算，不扣次数</span></div>
      </div>
      ${tabbar('dungeons')}
    </div>`;
  }


  function openBlessingChoice(wave) {
    const choices = pickBlessingChoices(3);
    if (!choices.length) { if (TW.Battle) TW.Battle.applyBlessing({ name: '潮汐', desc: '', mods: {} }); return; }
    state.battleChoices = choices;
    const cards = choices.map(b => `
      <button class="blessing tier-${b.tier}" data-act="blessingPick" data-id="${b.id}">
        <span class="b-icon">${TRIAL_ICON[b.icon] || '✦'}</span>
        <b>${b.name}</b>
        <span>${b.desc}</span>
        <em>${TIER_CN[b.tier] || b.tier}</em>
      </button>`).join('');
    modal(`
      <div style="text-align:center;padding:4px 0 6px">
        <div class="panel-title" style="justify-content:center">WAVE ${wave} · TIDE BLESSING</div>
        <h2 style="font-size:28px;margin-top:6px">潮汐祝福</h2>
        <div class="small dim" style="margin-top:4px">选择一条祝福，继续深入深渊。</div>
      </div>
      <div class="trial-blessings" style="margin-top:18px">${cards}</div>`, 'wide', true);
  }

  function startTrialBattle(blessing) {
    if (!teamIds().filter(Boolean).length) return toast('先在编队里放至少 1 个英雄', 'warn');
    const stage = buildTrialStage();
    startBattle(stage, {
      trial: true,
      blessings: blessing ? [blessing] : [],
      onBlessing: wave => openBlessingChoice(wave),
      onEnd: res => handleTrialEnd(stage, blessing, res)
    });
  }

  function handleTrialEnd(stage, blessing, res) {
    if (res.aborted) { render(); return; }
    const s = TW.Game.save;
    const T = (D.TRIAL && D.TRIAL.rewards) || { gemPerWave: 60, goldPerWave: 25000, bookPerWave: 2, clearGem: 3000, clearGold: 1000000 };
    const waves = Math.max(0, res.wavesCleared || 0);
    const win = !!res.win;
    let gold = waves * T.goldPerWave + (win ? T.clearGold : 0) + (res.goldEarned || 0);
    if (blessing && blessing.mods && blessing.mods.gold) gold = Math.round(gold * (1 + blessing.mods.gold));
    const rewards = [
      { kind: 'gem', amount: waves * T.gemPerWave + (win ? T.clearGem : 0) },
      { kind: 'gold', amount: gold },
      { kind: 'book', amount: waves * T.bookPerWave }
    ].filter(r => r.amount > 0);
    s.trialBest = Math.max(s.trialBest || 0, waves);
    s.trialRuns = (s.trialRuns || 0) + 1;
    s.trialClears = (s.trialClears || 0) + (win ? 1 : 0);
    TW.Game.grant(rewards);
    TW.Game.saveNow();

    const rank = win ? 'S' : waves >= 25 ? 'A' : waves >= 15 ? 'B' : waves >= 8 ? 'C' : 'D';
    const rankColor = rank === 'S' ? '#ffca6b' : rank === 'A' ? '#c08cff' : rank === 'B' ? '#3fe0d0' : '#8fa3ad';
    modal(`
      <div style="text-align:center;padding:4px 0 6px">
        <div class="panel-title" style="justify-content:center">${win ? 'TRIAL CLEARED' : 'TRIAL ENDED'}</div>
        <div style="font-size:64px;line-height:1;font-weight:900;color:${rankColor};text-shadow:0 0 30px ${rankColor}66;margin-top:4px">${rank}</div>
        <h2 style="font-size:32px;margin-top:6px;color:${win ? 'var(--gold-300)' : 'var(--cyan-300)'}">${win ? '深渊贯通' : '潮水漫过脚踝'}</h2>
        <div class="trial-result-waves"><b>${waves}</b><span>/ 30 波</span></div>
        <div class="small dim" style="margin-top:4px">最高记录 ${s.trialBest} 波 · 本次祝福：${blessing ? blessing.name : '无'}</div>
      </div>
      <div class="panel" style="margin-top:14px">
        <div class="stat-row"><span>击杀</span><b>${res.kills}</b></div>
        <div class="stat-row"><span>最高连击</span><b>${res.comboMax || 0}</b></div>
        <div class="stat-row"><span>潮汐法术</span><b>${res.spellsUsed || 0} 次</b></div>
        <div class="stat-row"><span>造成伤害</span><b>${fmt(res.damageDealt)}</b></div>
        <div class="stat-row"><span>用时</span><b>${Math.round(res.time)} 秒</b></div>
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap;justify-content:center">${rewardList(rewards)}</div>
      <div class="modal-actions">
        <button class="btn gold" data-act="trialRetry" data-id="${blessing ? blessing.id : ''}">再来一次</button>
        <button class="btn ghost" data-act="trialBack">返回试炼</button>
      </div>`, 'wide', true);
    setTimeout(() => { if (el('overlay') && !el('overlay').classList.contains('hidden')) render(); }, 30);
  }


  function dailyMod() {
    const list = D.DAILY_MODIFIERS || [];
    if (!list.length) return null;
    const d = new Date();
    const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return list[day % list.length];
  }

  function buildDailyStage(mod) {
    if (!mod) return null;
    const base = JSON.parse(JSON.stringify(D.STAGE_MAP['6-6']));
    const waves = [];
    for (let w = 0; w < 10; w++) {
      const list = [];
      list.push({ type: 'grunt', count: 3 + Math.floor(w / 3), interval: Math.max(0.3, 0.7 - w * 0.02) });
      if (w >= 2) list.push({ type: 'runner', count: 1 + Math.floor(w / 5), interval: 0.7 });
      if (w >= 4) list.push({ type: 'ranged', count: 1 + Math.floor(w / 6), interval: 1.1 });
      if (w >= 6) list.push({ type: 'shield', count: 1, interval: 1.2 });
      if (w >= 8) list.push({ type: 'flyer', count: 1, interval: 1.1 });
      if (w >= 10) list.push({ type: 'summon', count: 1, interval: 1.4 });
      if (w === 5) list.push({ type: 'elite', count: 1 });
      if (w === 9) list.push({ type: 'boss', count: 1 });
      if (mod.mods && mod.mods.extraEnemy) list[0].count += mod.mods.extraEnemy;
      waves.push({ at: 2 + w * 8, enemies: list });
    }
    base.id = 'daily';
    base.trial = false;
    base.daily = true;
    base.name = '每日悬赏 · ' + mod.name;
    base.chapterName = '每日悬赏';
    base.global = 16;
    base.baseHp = 60;
    base.timeLimit = 9999;
    base.recommendedPower = 16000;
    base.waves = waves;
    base.firstClear = [];
    base.repeat = [];
    base.weather = mod.id === 'dm_fog' ? 'fog' : mod.id === 'dm_ember' ? 'ember' : mod.id === 'dm_void' ? 'void' : 'tide';
    base.modifiers = {
      enemyHp: (mod.mods && mod.mods.enemyHp) || 1,
      enemySpeed: (mod.mods && mod.mods.enemySpeed) || 1,
      enemyDmg: (mod.mods && mod.mods.enemyDmg) || 1,
      playerRange: (mod.mods && mod.mods.playerRange) || 1,
      ultDmg: ((mod.mods && mod.mods.ultDmg) || 1) - 1,
      energy: (mod.mods && mod.mods.energy) || 1,
      burn: (mod.mods && mod.mods.burn) || 1
    };
    base.rewards = [
      { kind: 'gem', amount: 800 }, { kind: 'gold', amount: 800000 },
      { kind: 'book', amount: 40 }, { kind: 'crystal', amount: 40 }, { kind: 'stone', amount: 20 }
    ];
    base.rewardMult = (mod.mods && mod.mods.gold) || 1;
    base.dungeon = { id: 'daily', name: '每日悬赏', daily: 1, rewards: base.rewards };
    return base;
  }

  function screenDungeons() {
    const s = TW.Game.save;
    const cards = D.DUNGEONS.map(d => {
      const used = (s.daily.dungeons && s.daily.dungeons[d.id]) || 0;
      const left = d.daily - used;
      return `<div class="dungeon-card">
        <div class="row"><span style="color:var(--cyan-300)">${icon(d.icon)}</span><h3>${d.name}</h3></div>
        <p>${d.desc}</p>
        <div class="foot">
          <span class="left">今日 ${left}/${d.daily}</span>
          <button class="btn sm ${left > 0 ? 'ghost' : ''}" data-act="dungeon" data-id="${d.id}" ${left > 0 ? '' : 'disabled'}>${left > 0 ? '挑战' : '已完成'}</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="screen">
      ${topbar()}
      <div class="spread" style="margin-top:20px">
        <div><div class="panel-title">DUNGEONS</div><h2 class="section-title" style="margin-top:6px">资源副本</h2></div>
        <div class="small dim">每日重置 · 失败不扣次数</div>
      </div>
      ${(() => {
        const mod = dailyMod();
        const done = !!(s.daily && s.daily.challengeDone);
        return mod ? `<div class="panel daily-entry" style="margin-top:14px">
          <div class="spread">
            <div>
              <div class="panel-title">DAILY BOUNTY</div>
              <h3 style="font-size:22px;margin-top:6px">每日悬赏 · ${mod.name}</h3>
              <p class="small muted" style="margin-top:5px;max-width:56ch">${mod.desc} 10 波，通关奖励 800 星砂 + 80 万金币 + 材料。</p>
            </div>
            <button class="btn ${done ? 'ghost' : 'gold'}" data-act="daily" ${done ? 'disabled' : ''}>${done ? '今日已完成' : '挑战'}</button>
          </div>
        </div>` : '';
      })()}
      <div class="panel trial-entry" style="margin-top:14px">
        <div class="spread">
          <div>
            <div class="panel-title">ABYSS TRIAL</div>
            <h3 style="font-size:24px;margin-top:6px">深渊试炼</h3>
            <p class="small muted" style="margin-top:6px;max-width:52ch">30 波 Roguelite 挑战。每次从 3 条潮汐祝福中选 1 条，走得越远奖励越高。最高 ${s.trialBest || 0} 波。</p>
          </div>
          <button class="btn gold" data-act="trial">进入试炼</button>
        </div>
      </div>
      <div class="dungeon-grid">${cards}</div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-title">无尽塔</div>
        <div class="spread" style="margin-top:10px">
          <span class="small muted">逐层挑战，每 5 层获得星砂。当前最高：第 ${s.tower || 1} 层</span>
          <button class="btn sm gold" data-act="tower">继续挑战</button>
        </div>
      </div>
      ${tabbar('dungeons')}
    </div>`;
  }

  function screenMore() {
    const s = TW.Game.save;
    const signin = TW.Game.signinReady();
    const items = [
      { act: 'signin', icon: 'star', name: '签到', desc: signin ? '今日奖励可领取' : '今日已领取', badge: signin },
      { act: 'quests', icon: 'quest', name: '每日任务', desc: claimableQuests() ? claimableQuests() + ' 项可领取' : '完成战斗与召唤推进', badge: claimableQuests() > 0 },
      { act: 'shop', icon: 'shop', name: '商店', desc: '用星砂与金币兑换材料' },
      { act: 'mail', icon: 'mail', name: '邮件', desc: (s.mail || []).filter(m => !m.claimed).length + ' 封未读' },
      { act: 'accounts', icon: 'hero', name: '账户与存档', desc: '切换账户 / 每账户独立导入导出' },
      { act: 'help', icon: 'quest', name: '操作说明', desc: '完整键位与触屏手势' },
      { act: 'settings', icon: 'settings', name: '设置', desc: '画质、音量、存档' }
    ];
    return `<div class="screen">
      ${topbar()}
      <div class="spread" style="margin-top:20px">
        <div><div class="panel-title">MORE</div><h2 class="section-title" style="margin-top:6px">更多</h2></div>
      </div>
      <div class="list">${items.map(it => `<button class="li" data-act="${it.act}">
        <span class="ic">${icon(it.icon)}</span>
        <span class="txt"><b>${it.name} ${it.badge ? '<span style="color:var(--rose-400);font-size:9px">●</span>' : ''}</b><span>${it.desc}</span></span>
        ${icon('arrow')}
      </button>`).join('')}</div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-title">关于</div>
        <p class="small muted" style="margin-top:8px">《汐境回响》原创企划。所有角色、剧情、UI 与音效均为本作原创，不含任何第三方游戏素材。</p>
        <p class="small dim" style="margin-top:6px">v2.19 · 8 章 96 关 · 103 位英雄 · 9 类怪物</p>
      </div>
      ${tabbar('more')}
    </div>`;
  }

  function openShop() {
    const items = D.SHOP.map(it => {
      const cost = Object.entries(it.cost).map(([k, v]) => `${fmt(v)} ${({ gem: '星砂', gold: '金币' })[k] || k}`).join(' + ');
      return `<div class="shop-item">
        <b>${it.name}</b>
        <div class="cost">${cost}</div>
        <button class="btn sm ghost wide" data-act="buy" data-id="${it.id}">兑换</button>
      </div>`;
    }).join('');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>商店</h2><div class="sub">没有内购，所有货币都来自游戏内产出。</div>
      <div class="shop-grid">${items}</div>`, 'wide');
  }

  function openQuests() {
    const s = TW.Game.save;
    const list = D.QUESTS.map(q => {
      const st = s.quests[q.id] || { n: 0, claimed: false };
      const done = st.n >= q.target;
      return `<div class="li">
        <span class="ic">${icon('quest')}</span>
        <span class="txt"><b>${q.name}</b><span>${q.desc} · ${Math.min(st.n, q.target)}/${q.target}</span>
          <div class="bar"><i style="width:${Math.min(100, st.n / q.target * 100)}%"></i></div>
        </span>
        <button class="btn sm ${done && !st.claimed ? 'gold' : 'ghost'}" data-act="claimQuest" data-id="${q.id}" ${done && !st.claimed ? '' : 'disabled'}>
          ${st.claimed ? '已领' : (done ? '领取' : '进行中')}
        </button>
      </div>`;
    }).join('');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>每日任务</h2><div class="sub">每天 04:00 重置 · 已领取 ${Object.values(s.quests).filter(q => q.claimed).length}/${D.QUESTS.length}</div>
      <div class="list">${list}</div>`, 'wide');
  }

  function openSignin() {
    const s = TW.Game.save;
    const day = TW.Game.signinDay();
    const grid = D.SIGNIN.map((r, i) => `<div class="day ${i < day ? 'claimed' : ''} ${i === day ? 'today' : ''}">
      <b>DAY ${i + 1}</b>
      <div class="rw">${r.gem} 星砂</div>
      <div class="rw">${r.gold / 1000}k 金币</div>
    </div>`).join('');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>签到</h2><div class="sub">7 日循环 · 断签不重置已领取</div>
      <div class="signin-grid">${grid}</div>
      <div class="modal-actions"><button class="btn gold" data-act="claimSignin" ${TW.Game.signinReady() ? '' : 'disabled'}>${TW.Game.signinReady() ? '领取今日奖励' : '今日已领取'}</button></div>`);
  }

  function openMail() {
    const s = TW.Game.save;
    const list = (s.mail || []).map(m => `<div class="li">
      <span class="ic">${icon('mail')}</span>
      <span class="txt"><b>${m.title}</b><span>${m.body}</span></span>
      <button class="btn sm ${m.claimed ? '' : 'gold'}" data-act="claimMail" data-id="${m.id}" ${m.claimed ? 'disabled' : ''}>${m.claimed ? '已领' : '领取'}</button>
    </div>`).join('');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>邮件</h2><div class="sub">附件领取后消失</div>
      <div class="list">${list || '<div class="dim">没有邮件</div>'}</div>`, 'wide');
  }

  function openRates() {
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>概率公示</h2>
      <div class="sub">单抽 120 星砂 · 十连 1000 星砂（至少 1 个 SR）</div>
      <div class="stat-row"><span>SSR</span><b>2.2% 基础 · 3.0% 综合</b></div>
      <div class="stat-row"><span>SR</span><b>12.0%</b></div>
      <div class="stat-row"><span>R</span><b>35.0%</b></div>
      <div class="stat-row"><span>N</span><b>50.0%</b></div>
      <div class="stat-row"><span>软保底</span><span class="small dim">第 46 抽起每抽 +7%</span></div>
      <div class="stat-row"><span>硬保底</span><span class="small dim">第 60 抽必出 SSR</span></div>
      <div class="stat-row"><span>UP</span><span class="small dim">SSR 的 50% 为 UP；歪后下次必中</span></div>`);
  }



  /* ================= 账户与存档 ================= */
  function openAccounts() {
    const list = TW.Game.accounts();
    const activeId = TW.Game.activeId;
    const rows = list.map(a => {
      const active = a.id === activeId;
      const when = a.lastPlayed ? new Date(a.lastPlayed).toLocaleDateString() : '—';
      return `<div class="li account-row">
        <span class="ic" style="${a.isDev ? 'color:var(--gold-300)' : ''}">${a.isDev ? '★' : icon('hero')}</span>
        <span class="txt">
          <b>${esc(a.name)}
            ${a.isDev ? '<span class="dev-badge" style="margin-left:6px">DEV</span>' : ''}
            ${active ? '<span class="tag" style="margin-left:6px;font-size:9px">当前</span>' : ''}
            ${a.pw ? `<span class="pw-badge" title="已设置账户密码">${icon('lock')}</span>` : ''}
          </b>
          <span>${a.isDev ? '无限资源 · 全英雄 / 全关卡' : '最后游玩 ' + when}${a.pw ? ' · 密码保护' : ''}</span>
        </span>
        <span class="account-actions">
          ${active ? '' : `<button class="btn sm ghost" data-act="accountSwitch" data-id="${esc(a.id)}">切换</button>`}
          <button class="btn sm ghost" data-act="accountExport" data-id="${esc(a.id)}">导出</button>
          <button class="btn sm ghost" data-act="accountPassword" data-id="${esc(a.id)}">${a.pw ? '改密码' : '设密码'}</button>
          ${a.isDev
            ? `<button class="btn sm ghost" data-act="accountResetDev">重置</button>`
            : `<button class="btn sm ghost" data-act="accountRename" data-id="${esc(a.id)}">改名</button>
               <button class="btn sm ghost" data-act="accountDelete" data-id="${esc(a.id)}" style="color:var(--rose-400)">删除</button>`}
        </span>
      </div>`;
    }).join('');

    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>账户与存档</h2>
      <div class="sub">每个账户拥有独立进度；用户名不可重复；每个账户的密码互相独立，可在创建时设置，也可之后修改。切换账户不会互相覆盖；导出码可在其他设备导入。</div>
      <div class="list" style="margin-top:14px">${rows}</div>
      <div class="panel" style="margin-top:14px">
        <div class="panel-title">新建账户</div>
        <div class="row" style="margin-top:10px">
          <input id="newAccName" maxlength="16" placeholder="输入账户名（最多 16 字）" style="flex:1;min-width:0;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
          <button class="btn gold sm" data-act="accountCreate">创建并切换</button>
        </div>
        <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
          <input id="newAccPw" type="password" maxlength="64" autocomplete="new-password" placeholder="账户密码（可选，至少 4 位）" style="flex:1;min-width:160px;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
          <input id="newAccPw2" type="password" maxlength="64" autocomplete="new-password" placeholder="确认密码" style="flex:1;min-width:160px;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
        </div>
        <div class="field-err" id="newAccErr"></div>
        <div class="small dim" style="margin-top:2px">用户名不可重复，英文大小写视为相同。每个账户密码独立，留空则暂不设密码。</div>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="accountImport">导入存档为新账户</button>
        <button class="btn ghost" data-act="closeModal">关闭</button>
      </div>`, 'wide');
  }

  function openAccountRename(id) {
    const a = TW.Game.accounts().find(x => x.id === id);
    if (!a || a.isDev) return toast('开发者账户不可改名', 'warn');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>重命名账户</h2>
      <div class="sub">当前：${esc(a.name)}</div>
      <input id="accRenameName" maxlength="16" value="${esc(a.name)}" style="width:100%;margin-top:12px;padding:11px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
      <div class="field-err" id="accNameErr"></div>
      <div class="modal-actions">
        <button class="btn gold" data-act="accountRenameDo" data-id="${esc(id)}">保存</button>
        <button class="btn ghost" data-act="closeModal">取消</button>
      </div>`);
  }

  function openAccountExport(id) {
    const a = TW.Game.accounts().find(x => x.id === id);
    if (!a) return;
    const code = TW.Game.exportAccount(id);
    if (!code) return toast('导出失败', 'err');
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>导出账户 · ${esc(a.name)}</h2>
      <div class="sub">复制下面整段文字保存。其他设备用「导入存档为新账户」恢复。导出码不包含账户密码。</div>
      <textarea id="accCode" readonly style="width:100%;height:150px;margin-top:12px;border-radius:12px;background:rgba(3,10,15,.8);color:var(--text-mid);border:1px solid var(--line-soft);padding:12px;font-family:var(--font-num);font-size:11px">${code}</textarea>
      <div class="modal-actions">
        <button class="btn gold" data-act="copyAccount">复制</button>
        <button class="btn ghost" data-act="closeModal">关闭</button>
      </div>`);
  }

  function openAccountImport() {
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>导入存档</h2>
      <div class="sub">粘贴账户导出码。可选择创建新账户，或覆盖当前账户。</div>
      <input id="accImportName" maxlength="16" placeholder="新账户名（可选，留空沿用导出名）" style="width:100%;margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
      <textarea id="accCodeImport" placeholder="粘贴存档码" style="width:100%;height:130px;margin-top:10px;border-radius:12px;background:rgba(3,10,15,.8);color:var(--text-mid);border:1px solid var(--line-soft);padding:12px;font-family:var(--font-num);font-size:11px"></textarea>
      <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
        <input id="accImportPw" type="password" maxlength="64" autocomplete="new-password" placeholder="新账户密码（可选，至少 4 位）" style="flex:1;min-width:160px;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
        <input id="accImportPw2" type="password" maxlength="64" autocomplete="new-password" placeholder="确认密码" style="flex:1;min-width:160px;padding:10px 12px;border-radius:10px;background:rgba(3,10,15,.8);color:var(--text-hi);border:1px solid var(--line-soft)">
      </div>
      <div class="field-err" id="accImportErr"></div>
      <div class="small dim" style="margin-top:2px">密码仅用于「导入为新账户」；留空则新账户暂不设密码。覆盖当前账户不会修改密码。</div>
      <div class="modal-actions">
        <button class="btn gold" data-act="accountImportNew">导入为新账户</button>
        <button class="btn ghost" data-act="accountImportOverwrite" style="color:var(--rose-400)">覆盖当前账户</button>
        <button class="btn ghost" data-act="closeModal">取消</button>
      </div>
      <p class="small dim" style="margin-top:10px">覆盖后当前账户原进度不可恢复，建议先导出备份。</p>`);
  }

  function openAccountDelete(id) {
    const a = TW.Game.accounts().find(x => x.id === id);
    if (!a) return;
    modal(`<h2>删除账户</h2>
      <div class="sub">「${esc(a.name)}」的独立存档会被永久删除，无法恢复。</div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="closeModal">取消</button>
        <button class="btn gold" data-act="accountDeleteDo" data-id="${esc(id)}" style="background:linear-gradient(180deg,#ff8a9c,#b03048);color:#fff">确认删除</button>
      </div>`);
  }

  function openAccountResetDev() {
    modal(`<h2>重置开发者账户</h2>
      <div class="sub">恢复无限资源、全英雄满配、全关卡三星。其他账户不受影响。</div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="closeModal">取消</button>
        <button class="btn gold" data-act="accountResetDevDo">重置</button>
      </div>`);
  }

  function accountChanged() {
    state.trialDraft = null;
    state.trialPick = null;
    state.battleChoices = null;
    state.heroFilter = 'all';
    state.heroLimit = 24;
    state.pickerLimit = 24;
    gachaBusy = false;
    const fx = document.getElementById('gachaFx');
    if (fx) fx.classList.add('hidden');
    closeModal();
    go('home');
    render();
  }

  function openHelp() {
    const k = (t) => `<span class="tag" style="font-family:var(--font-num);font-weight:700;color:var(--gold-300)">${t}</span>`;
    const row = (key, name) => `<div class="stat-row"><span>${key}</span><b>${name}</b></div>`;
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>操作与键位</h2>
      <div class="sub">鼠标 / 触屏 / 键盘都支持。战斗内快捷键需要先进入战斗。</div>

      <div class="panel" style="margin-top:14px">
        <div class="panel-title">战斗 · 键盘</div>
        ${row(k('空格') + ' / ' + k('Esc'), '暂停 / 继续')}
        ${row(k('1') + ' ' + k('2') + ' ' + k('3'), '1× / 2× / 3× 速度')}
        ${row(k('Q'), '霜潮 · 全场冻结 3.5 秒')}
        ${row(k('W'), '陨潮 · 范围轰炸 + 灼烧')}
        ${row(k('E'), '回潮 · 全队回复 + 护盾')}
        ${row(k('R'), '潮汐觉醒 · 攻击/攻速 +30%')}
        ${row('重复英雄', '转化为同名共鸣，用于英雄升阶')}
        ${row(k('N'), '提前召唤下一波 · +潮能 +金币')}
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="panel-title">战斗 · 鼠标 / 触屏</div>
        ${row('拖拽', '英雄卡拖到发光格部署；选中卡时进入子弹时间，怪物减速')}
        ${row('点卡 → 点格', '两段式部署；期间怪物减速，再点同一张卡取消')}
        ${row('点已部署英雄', '能量满时放大招')}
        ${row('底部卡牌', '显示费用、冷却、复活、能量')}
        ${row('右下法术栏', '三个主动法术 + 觉醒按钮')}
        ${row('右上按钮', '倍速 / 自动大招 / 暂停 / 退出')}
        ${row('提前召唤', '波次开始 5 秒后出现，冷却 8 秒')}
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="panel-title">界面 · 通用</div>
        ${row('编队', '10 个上阵位；初始 5 个，每通关 1 章解锁 1 个')}
        ${row('战士', '可部署在道路上拦截敌人；基础生命/防御更高，护盾会吸收伤害；医生优先治疗战士')}
        ${row('医生', '所有治疗定位英雄，共 16 位；英雄页可用「医生」筛选')}
        ${row('手机放置', '按住英雄卡拖到发光格；手指上方显示小卡，目标格会高亮')}
        ${row('底部导航', '主线 / 英雄 / 召唤 / 副本 / 更多')}
        ${row('返回按钮', '回到上一层；浏览器返回也可')}
        ${row('弹窗', '右上 × 或点遮罩关闭；祝福与结算需点按钮')}
        ${row('战斗难度', '休闲 / 标准 / 困难 / 噩梦；在设置或关卡准备界面切换，金币奖励随难度提高')}
        ${row('用户名', '不可重复；新建 / 改名 / 导入时校验，英文大小写视为相同')}
        ${row('账户密码', '创建账户时即可设置；每个账户密码独立，启动/切换时分别锁定；导出码不含密码')}
        ${row('设置', '主音量 / 音乐 / 音效 / 画质 / 炫酷鼠标 / 存档')}
        ${row('炫酷鼠标', '桌面端进入游戏即启用；击败敌人、通关、失败都有专属特效')}
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="panel-title">账户 · 存档</div>
        ${row('右上角账户', '切换 / 新建 / 改名 / 删除 / 导出 / 导入')}
        ${row('每个账户', '独立进度，互不覆盖')}
        ${row('导入存档', '可新建账户，或覆盖当前账户')}
        ${row('开发者账户', '内置：无限资源、全英雄满配、全关卡三星')}
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="panel-title">移动端</div>
        ${row('竖屏', '菜单正常使用；战斗会提示横屏')}
        ${row('仍然继续', '竖屏也能打，但视野较窄')}
        ${row('触屏', '拖拽或点选部署；点英雄放大招')}
        ${row('安全区', '适配刘海与底部手势条')}
      </div>`, 'wide');
  }

  function openSettings() {
    const st = TW.Game.save.settings;
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>设置</h2>
      <div class="stat-row"><span>当前账户</span><button class="btn sm ghost" data-act="accounts">${esc(TW.Game.accountName())}${TW.Game.isDev() ? ' · DEV' : ''}</button></div>
      <div class="stat-row"><span>主音量</span><input type="range" min="0" max="100" value="${Math.round(st.vol * 100)}" data-set="vol"></div>
      <div class="stat-row"><span>音乐</span><input type="range" min="0" max="100" value="${Math.round((st.bgm != null ? st.bgm : 0.35) * 100)}" data-set="bgm"></div>
      <div class="stat-row"><span>音效</span><input type="range" min="0" max="100" value="${Math.round((st.sfx != null ? st.sfx : 0.7) * 100)}" data-set="sfx"></div>
      <div class="stat-row"><span>画质</span><div class="row">
        ${['ultra', 'balanced', 'fast'].map(q => `<button class="btn sm ${st.quality === q ? 'cyan' : 'ghost'}" data-act="quality" data-q="${q}">${q === 'ultra' ? '极致' : q === 'balanced' ? '均衡' : '流畅'}</button>`).join('')}
      </div></div>
      <div class="stat-row"><span>战斗难度</span><span class="row" style="gap:4px;flex-wrap:wrap;justify-content:flex-end">${diffButtons('diffSetting')}</span></div>
      <div class="small dim" style="margin-top:-2px">${(D.DIFFICULTY[diffKey()] || {}).desc || ''}</div>
      <div class="stat-row"><span>自动大招</span><button class="btn sm ${st.auto ? 'cyan' : 'ghost'}" data-act="toggleAuto">${st.auto ? '开' : '关'}</button></div>
      <div class="stat-row"><span>伤害数字</span><button class="btn sm ${st.dmgNum ? 'cyan' : 'ghost'}" data-act="toggleDmg">${st.dmgNum ? '开' : '关'}</button></div>
      <div class="stat-row"><span>炫酷鼠标</span><button class="btn sm ${st.cursorFx !== false ? 'cyan' : 'ghost'}" data-act="toggleCursor">${st.cursorFx !== false ? '开' : '关'}</button></div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="exportSave">导出当前账户</button>
        <button class="btn ghost" data-act="importSave">导入到当前账户</button>
        <button class="btn ghost" data-act="resetSave" style="color:var(--rose-400)">重置</button>
      </div>
      <p class="small dim" style="margin-top:12px">每个账户独立存档。更多账户与整档迁移请到「账户与存档」。</p>`);
  }

  function openSaveIO(mode) {
    const code = mode === 'export' ? TW.Game.exportSave() : '';
    const acc = esc(TW.Game.accountName());
    modal(`<button class="x" data-act="closeModal">${icon('close')}</button>
      <h2>${mode === 'export' ? '导出当前账户' : '导入到当前账户'}</h2>
      <div class="sub">当前账户：${acc}。${mode === 'export' ? '复制下面整段文字保存。' : '粘贴存档码后点击导入，会覆盖当前账户进度。'}</div>
      <textarea id="saveIO" style="width:100%;height:140px;margin-top:12px;border-radius:12px;background:rgba(3,10,15,.8);color:var(--text-mid);border:1px solid var(--line-soft);padding:12px;font-family:var(--font-num);font-size:11px" ${mode === 'export' ? 'readonly' : ''}>${code}</textarea>
      <div class="modal-actions">
        ${mode === 'export'
          ? `<button class="btn gold" data-act="copySave">复制</button>`
          : `<button class="btn gold" data-act="doImport">导入</button>`}
        <button class="btn ghost" data-act="closeModal">关闭</button>
      </div>`);
  }

  /* ================= 战斗流程 ================= */
  function battleTeam() {
    const ids = teamIds().slice(0, TW.Game.unlockedSlots()).filter(Boolean);
    if (!ids.length) return [];
    return ids.map(id => ({ def: heroDef(id), stats: TW.Game.heroStats(id) }));
  }

  function teamBonuses() {
    const ids = teamIds().slice(0, TW.Game.unlockedSlots()).filter(Boolean);
    const hs = ids.map(heroDef).filter(Boolean);
    const b = { atk: 0, hp: 0, crit: 0, heal: 0 };
    const active = [];
    const counts = {};
    hs.forEach(h => { counts[h.element] = (counts[h.element] || 0) + 1; });
    let max = 0;
    Object.keys(counts).forEach(k => { if (counts[k] > max) max = counts[k]; });
    const S = D.SYNERGIES || {};
    if (max >= 3 && S.element3) { b.atk += S.element3.atk || 0; active.push('element3'); }
    else if (max >= 2 && S.element2) { b.atk += S.element2.atk || 0; active.push('element2'); }
    const roles = new Set(hs.map(h => h.role));
    if (roles.has('guard') && roles.has('healer') && S.guardHealer) { b.hp += S.guardHealer.hp || 0; active.push('guardHealer'); }
    if (roles.has('ranger') && roles.has('mage') && S.rangerMage) { b.crit += S.rangerMage.crit || 0; active.push('rangerMage'); }
    if (roles.has('healer') && roles.has('support') && S.healerSupport) { b.heal += S.healerSupport.heal || 0; active.push('healerSupport'); }
    return {
      mods: b, active,
      list: active.map(id => (D.SYNERGY_INFO && D.SYNERGY_INFO[id]) || { name: id, desc: '' })
    };
  }

  function startBattle(stage, extra) {
    extra = extra || {};
    const team = battleTeam();
    if (!team.length) {
      toast('先在编队里放至少 1 个英雄', 'warn');
      return;
    }
    if (TW.Battle.active()) return;
    const st = TW.Game.save.settings;
    const syn = teamBonuses();
    const onEnd = extra.onEnd || (result => handleBattleEnd(stage, result));
    TW.Battle.run(Object.assign({
      stage, team,
      auto: st.auto,
      speed: 1,
      quality: st.quality,
      difficulty: st.difficulty || 'hard',
      bonuses: syn.mods,
      synergyText: syn.list.length ? ('协同生效：' + syn.list.map(x => x.name).join(' · ')) : ''
    }, extra, {
      onEnd: onEnd,
      onRestart: s => startBattle(s, extra)
    }));
  }

  function handleBattleEnd(stage, res) {
    if (res.aborted) {
      render();
      toast('已退出战斗');
      return;
    }
    const s = TW.Game.save;
    let rewards = [];
    if (res.win) {
      if (stage.dungeon) {
        const d = stage.dungeon;
        s.daily.dungeons = s.daily.dungeons || {};
        s.daily.dungeons[d.id] = (s.daily.dungeons[d.id] || 0) + 1;
        rewards = stage.rewards || d.rewards || [];
        if (stage.rewardMult && stage.rewardMult !== 1) {
          rewards = rewards.map(r => r.kind === 'hero' ? r : Object.assign({}, r, { amount: Math.round(r.amount * stage.rewardMult) }));
        }
        if (d.id === 'tower') s.tower = (s.tower || 1) + 1;
        if (d.id === 'daily') { s.daily.challengeDone = true; s.daily.challengeDate = s.daily.date; }
        TW.Game.quest('win', 1);
      } else {
        const prev = s.prog[stage.id];
        const first = !prev || !prev.clears;
        const slotsBefore = TW.Game.unlockedSlots();
        rewards = first ? stage.firstClear.slice() : repeatOf(stage);
        s.prog[stage.id] = {
          stars: Math.max(prev ? prev.stars : 0, res.stars),
          clears: (prev ? prev.clears : 0) + 1,
          bestTime: Math.min(prev && prev.bestTime ? prev.bestTime : 1e9, Math.round(res.time * 1000))
        };
        const slotsAfter = TW.Game.unlockedSlots();
        if (slotsAfter > slotsBefore) res.unlockedSlots = slotsAfter;
        TW.Game.quest('clear', 1);
        TW.Game.quest('win', 1);
      }
      TW.Game.quest('ult', res.ults || 0);
      if (res.goldBonus) rewards.push({ kind: 'gold', amount: res.goldBonus });
      if (res.goldEarned) rewards.push({ kind: 'gold', amount: res.goldEarned });
      const dInfo = (D.DIFFICULTY && D.DIFFICULTY[res.difficulty]) || null;
      if (dInfo && dInfo.gold > 1) {
        rewards = rewards.map(r => r.kind === 'gold' ? Object.assign({}, r, { amount: Math.round(r.amount * dInfo.gold) }) : r);
        res.diffGoldBonus = Math.round((dInfo.gold - 1) * 100);
      }
      if (Math.random() < 0.3) {
        res.doubled = true;
        rewards = rewards.map(r => r.kind === 'hero' ? r : Object.assign({}, r, { amount: Math.round(r.amount * 2) }));
      }
      TW.Game.grant(rewards);
      TW.Game.saveNow();
    }
    const starTxt = '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars);
    modal(`
      <div style="text-align:center;padding:4px 0 6px">
        <div class="panel-title" style="justify-content:center">${res.win ? 'VICTORY' : 'DEFEAT'}</div>
        <h2 style="font-size:34px;margin-top:6px;color:${res.win ? 'var(--gold-300)' : 'var(--rose-400)'}">${res.win ? '战斗胜利' : '潮水退去'}</h2>
        <div style="font-size:30px;letter-spacing:8px;color:var(--gold-300);margin-top:6px">${starTxt}</div>
        <div class="small dim" style="margin-top:6px">${res.win ? '用时 ' + res.time.toFixed(1) + ' 秒 · 基地 ' + res.baseHp + '/' + res.baseMax : '失败不扣次数，直接再来。'}${res.diffName ? ' · ' + res.diffName : ''}</div>
        ${res.win && res.diffGoldBonus ? `<div style="margin-top:6px;color:var(--gold-300);font-size:11px;letter-spacing:.1em">难度加成 · 金币 +${res.diffGoldBonus}%</div>` : ''}
        ${res.unlockedSlots ? `<div style="margin-top:10px;color:var(--gold-300);font-size:13px;letter-spacing:.1em">编队上限提升至 ${res.unlockedSlots} 人！</div>` : ''}
      </div>
      <div class="panel" style="margin-top:14px">
        <div class="stat-row"><span>造成伤害</span><b>${fmt(res.damageDealt)}</b></div>
        <div class="stat-row"><span>承受伤害</span><b>${fmt(res.damageTaken)}</b></div>
        <div class="stat-row"><span>治疗量</span><b>${fmt(res.healed)}</b></div>
        <div class="stat-row"><span>释放大招</span><b>${res.ults} 次</b></div>
        <div class="stat-row"><span>击杀</span><b>${res.kills}</b></div>
        <div class="stat-row"><span>最高连击</span><b>${res.comboMax || 0}</b></div>
        <div class="stat-row"><span>潮汐法术</span><b>${res.spellsUsed || 0} 次</b></div>
      </div>
      ${res.doubled ? `<div style="margin-top:12px;text-align:center;color:var(--gold-300);font-size:13px;letter-spacing:.12em;text-shadow:var(--glow-gold)">✦ 潮汐馈赠 · 本次奖励 ×2 ✦</div>` : ''}
      ${res.win ? `<div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap;justify-content:center">${rewardList(rewards)}</div>` : ''}
      <div class="modal-actions">
        ${res.win
          ? (stage.dungeon
              ? `<button class="btn gold" data-act="closeModal">收下</button>`
              : `<button class="btn ghost" data-act="battle" data-id="${stage.id}">再来一次</button>
                 <button class="btn gold" data-act="closeModal">收下</button>`)
          : `<button class="btn gold" data-act="battle" data-id="${stage.id}">再来一次</button>
             <button class="btn ghost" data-act="closeModal">返回</button>`}
      </div>`, 'wide', true);
    if (res.win) {
      setTimeout(() => { if (el('overlay') && !el('overlay').classList.contains('hidden')) render(); }, 30);
    }
  }

  /* ================= 弹窗 / toast ================= */
  function modal(html, size, keep) {
    const o = overlay();
    o.innerHTML = `<div class="modal ${size === 'wide' ? 'wide' : ''}">${html}</div>`;
    o.classList.remove('hidden');
    if (!keep) o.onclick = e => { if (e.target === o) closeModal(); };
    else o.onclick = null;
  }
  function closeModal() {
    const o = overlay();
    o.classList.add('hidden');
    o.innerHTML = '';
  }

  /* ================= 动作 ================= */
  const actions = {
    tab(el) { go(el.dataset.to); },
    nav(el) { go(el.dataset.to); },
    back() {
      const { name } = parse();
      if (name === 'hero') go('heroes');
      else if (name === 'chapter') go('campaign');
      else go('home');
    },
    chapter(el) { go('chapter/' + el.dataset.n); },
    stage(el) { openStage(el.dataset.id); },
    battle(el) {
      const st = D.STAGE_MAP[el.dataset.id] || state.pendingDungeon;
      if (!st) return toast('关卡数据缺失', 'err');
      closeModal();
      startBattle(st);
    },
    sweep(el) {
      const st = D.STAGE_MAP[el.dataset.id];
      if (!st) return;
      TW.Game.grant(repeatOf(st));
      TW.Game.quest('clear', 1);
      const s = TW.Game.save;
      s.prog[st.id] = s.prog[st.id] || { stars: 3, clears: 0, bestTime: 0 };
      s.prog[st.id].clears++;
      TW.Game.saveNow();
      toast('扫荡完成：' + rewardText(repeatOf(st)));
      closeModal();
      render();
    },
    hero(el) {
      const id = el.dataset.id;
      if (!owned(id)) return;
      if (!document.getElementById('gachaFx').classList.contains('hidden')) {
        closeGacha();
        gachaBusy = false;
      }
      go('hero/' + id);
    },
    filter(el) { state.heroFilter = el.dataset.k; state.heroLimit = 24; render(); },
    moreheroes() { state.heroLimit += 24; render(); },
    morepicker(el) { state.pickerLimit += 24; openTeamPicker(+el.dataset.slot); },
    daily() {
      const mod = dailyMod();
      if (!mod) return toast('今日没有悬赏', 'warn');
      const s = TW.Game.save;
      if (s.daily && s.daily.challengeDone) return toast('今日悬赏已完成', 'warn');
      const stage = buildDailyStage(mod);
      state.pendingDungeon = stage;
      openStage(stage.id, stage);
    },
    trial() {
      state.trialReroll = false;
      state.trialPick = null;
      state.trialDraft = null;
      rollTrialDraft();
      go('trial');
    },
    trialPick(el) { state.trialPick = el.dataset.id; render(); },
    trialReroll() {
      if (state.trialReroll) return;
      state.trialReroll = true;
      rollTrialDraft();
      render();
    },
    blessingPick(el) {
      const b = (state.battleChoices || []).find(x => x.id === el.dataset.id);
      if (!b) return;
      state.battleChoices = null;
      closeModal();
      if (TW.Battle && TW.Battle.active()) TW.Battle.applyBlessing(b);
      toast('祝福生效：' + b.name);
    },
    trialStart() {
      const b = (state.trialDraft || []).find(x => x.id === state.trialPick);
      if (!b) return toast('先选择 1 条祝福', 'warn');
      startTrialBattle(b);
    },
    trialRetry(el) {
      const b = (D.TRIAL_BLESSINGS || []).find(x => x.id === el.dataset.id);
      closeModal();
      if (b) startTrialBattle(b);
      else go('trial');
    },
    trialBack() { closeModal(); state.trialPick = null; state.trialDraft = null; go('trial'); },
    slot(el) {
      const i = +el.dataset.i;
      if (!TW.Game.isSlotUnlocked(i)) return toast('第 ' + (i + 1) + ' 位：通关第 ' + TW.Game.slotUnlockChapter(i) + ' 章解锁', 'warn');
      openTeamPicker(i);
    },
    lockedSlot(el) {
      const i = +el.dataset.i;
      toast('第 ' + (i + 1) + ' 位：通关第 ' + TW.Game.slotUnlockChapter(i) + ' 章解锁', 'warn');
    },
    assign(el) {
      const s = TW.Game.save;
      const slot = +el.dataset.slot;
      if (!TW.Game.isSlotUnlocked(slot)) return toast('该位置尚未解锁', 'warn');
      const id = el.dataset.id;
      const prev = s.formation.indexOf(id);
      if (prev >= 0 && prev !== slot) s.formation[prev] = s.formation[slot];
      s.formation[slot] = id;
      TW.Game.saveNow();
      closeModal();
      render();
      toast('已上阵 ' + heroDef(id).name);
    },
    unassign(el) {
      const s = TW.Game.save;
      s.formation[+el.dataset.slot] = null;
      TW.Game.saveNow();
      closeModal();
      render();
    },
    autoteam() {
      const s = TW.Game.save;
      const unlocked = TW.Game.unlockedSlots();
      const ids = Object.keys(s.heroes).sort((a, b) => TW.Game.power(b) - TW.Game.power(a)).slice(0, unlocked);
      while (ids.length < unlocked) ids.push(null);
      while (ids.length < 10) ids.push(null);
      s.formation = ids;
      TW.Game.saveNow();
      render();
      toast('已按战力自动编队 · 上阵 ' + Math.min(unlocked, Object.keys(s.heroes).length) + ' 人');
    },
    clearteam() {
      TW.Game.save.formation = [null, null, null, null, null, null, null, null, null, null];
      TW.Game.saveNow();
      render();
    },
    levelup(el) { TW.Game.levelUp(el.dataset.id, el.dataset.mode); render(); },
    ascend(el) { TW.Game.ascend(el.dataset.id); render(); },
    skillup(el) { TW.Game.skillUp(el.dataset.id); render(); },
    starup(el) { TW.Game.starUp(el.dataset.id); render(); },
    equip(el) { TW.Game.upEquip(el.dataset.id, +el.dataset.slot); render(); },
    pull(el) { startPull(+el.dataset.n, el.dataset.pool); },
    freepull(el) { startFreePull(el.dataset.pool); },
    pool(el) { GACHA.pool = el.dataset.p; render(); },
    rates() { openRates(); },
    skipGacha() {
      clearTimeout(state.gachaTimer);
      clearGachaSfx();
      if (state.gachaReveal) state.gachaReveal();
    },
    again(el) {
      document.getElementById('gachaFx').classList.add('hidden');
      gachaBusy = false;
      startPull(+el.dataset.n, el.dataset.pool);
    },
    closeGacha() { closeGacha(); },
    continue() {
      const ns = nextStage();
      openStage(ns.id);
    },
    dungeon(el) {
      const d = D.DUNGEONS.find(x => x.id === el.dataset.id);
      if (!d) return;
      const s = TW.Game.save;
      const used = (s.daily.dungeons && s.daily.dungeons[d.id]) || 0;
      if (used >= d.daily) return toast('今日次数已用完', 'warn');
      const stage = dungeonStage(d, used);
      state.pendingDungeon = stage;
      openStage(stage.id, stage);
    },
    tower() {
      const s = TW.Game.save;
      const lvl = s.tower || 1;
      const base = D.STAGE_MAP['8-10'];
      const stage = JSON.parse(JSON.stringify(base));
      stage.id = 'tower-' + lvl;
      stage.name = '无尽塔 · 第 ' + lvl + ' 层';
      stage.chapterName = '无尽塔';
      stage.global = Math.min(96, 1 + Math.floor(lvl * 0.9));
      stage.recommendedPower = Math.round(800 + lvl * 350);
      stage.timeLimit = 180;
      stage.firstClear = [{ kind: 'gem', amount: 80 + Math.floor(lvl / 5) * 80 }];
      stage.repeat = { kind: 'gold', amount: 3000 + lvl * 500 };
      stage.rewards = lvl % 5 === 0
        ? [{ kind: 'gem', amount: 200 }, { kind: 'gold', amount: 50000 }]
        : [{ kind: 'gold', amount: 20000 + lvl * 3000 }];
      stage.dungeon = { id: 'tower', name: '无尽塔', daily: 99, rewards: stage.rewards };
      state.pendingDungeon = stage;
      openStage(stage.id, stage);
    },
    signin() { openSignin(); },
    claimSignin() {
      const r = TW.Game.claimSignin();
      if (r) { toast('签到成功：' + rewardText(r)); render(); }
      openSignin();
    },
    quests() { openQuests(); },
    claimQuest(el) {
      const q = D.QUESTS.find(x => x.id === el.dataset.id);
      if (!q) return;
      const r = TW.Game.claimQuest(q.id);
      if (r) { toast('领取：' + rewardText(r)); render(); openQuests(); }
    },
    shop() { openShop(); },
    buy(el) {
      const it = D.SHOP.find(x => x.id === el.dataset.id);
      if (!it) return;
      if (TW.Game.buyShop(it)) { toast('兑换成功'); render(); openShop(); }
      else toast('货币不足', 'warn');
    },
    mail() { openMail(); },
    claimMail(el) {
      if (TW.Game.claimMail(el.dataset.id)) { toast('已领取附件'); render(); openMail(); }
    },
    settings() { openSettings(); },
    accounts() { openAccounts(); },
    accountSwitch(el) {
      const r = TW.Game.switchAccount(el.dataset.id);
      if (r === 'locked') return;
      if (r) {
        if (TW.Game.isDev()) toast('开发者账户：无限资源已启用', 'warn');
        else toast('已切换账户');
      }
    },
    async accountCreate() {
      const input = document.getElementById('newAccName');
      const pwEl = document.getElementById('newAccPw');
      const pw2El = document.getElementById('newAccPw2');
      const err = document.getElementById('newAccErr');
      const btn = document.querySelector('[data-act="accountCreate"]');
      if (err) err.textContent = '';
      const raw = input ? input.value : '';
      if (!String(raw || '').trim()) {
        if (err) err.textContent = '请输入用户名';
        if (input) input.focus();
        return;
      }
      const name = TW.Game.normalizeAccountName(raw);
      if (TW.Game.accountNameTaken(name)) {
        if (err) err.textContent = '该用户名已被使用';
        toast('用户名已被使用，请换一个', 'err');
        if (input) { input.focus(); input.select(); }
        return;
      }
      const pw = pwEl ? pwEl.value : '';
      const pw2 = pw2El ? pw2El.value : '';
      if (pw || pw2) {
        if (!pw) {
          if (err) err.textContent = '请先输入密码';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw.trim().length < 4) {
          if (err) err.textContent = '密码至少 4 位';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw.length > 64) {
          if (err) err.textContent = '密码最多 64 位';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw !== pw2) {
          if (err) err.textContent = '两次输入的密码不一致';
          if (pw2El) pw2El.focus();
          return;
        }
      }
      let rec = null;
      if (pw) {
        if (!TW.Auth || !TW.Auth.supported || !TW.Auth.supported()) {
          if (err) err.textContent = '当前浏览器不支持密码加密，可留空创建无密码账户';
          return;
        }
        const label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = '加密中…'; }
        try { rec = await TW.Auth.makeRecord(pw); } catch (e) { rec = null; }
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (!rec) {
          if (err) err.textContent = '密码加密失败，请重试';
          return;
        }
      }
      const id = TW.Game.createAccount(name);
      if (!id) {
        if (err) err.textContent = '该用户名已被使用';
        toast('创建失败：用户名重复', 'err');
        return;
      }
      if (rec) TW.Game.setAccountPassword(id, rec);
      toast(rec ? '账户已创建，密码已启用' : '账户已创建');
      openAccounts();
    },
    accountRename(el) { openAccountRename(el.dataset.id); },
    accountRenameDo(el) {
      const input = document.getElementById('accRenameName');
      const err = document.getElementById('accNameErr');
      if (err) err.textContent = '';
      const raw = input ? input.value : '';
      if (!String(raw || '').trim()) {
        if (err) err.textContent = '请输入用户名';
        if (input) input.focus();
        return;
      }
      const name = TW.Game.normalizeAccountName(raw);
      if (TW.Game.accountNameTaken(name, el.dataset.id)) {
        if (err) err.textContent = '该用户名已被使用';
        toast('该用户名已被使用', 'err');
        if (input) { input.focus(); input.select(); }
        return;
      }
      if (TW.Game.renameAccount(el.dataset.id, name)) {
        toast('账户已重命名');
        openAccounts();
        render();
      } else {
        if (err) err.textContent = '该用户名已被使用';
        toast('重命名失败', 'err');
      }
    },
    accountExport(el) { openAccountExport(el.dataset.id); },
    accountPassword(el) {
      if (TW.Auth) TW.Auth.openSet(el.dataset.id);
    },
    copyAccount() {
      const ta = document.getElementById('accCode'); if (!ta) return;
      ta.select(); document.execCommand('copy'); toast('已复制');
    },
    accountImport() { openAccountImport(); },
    async accountImportNew() {
      const ta = document.getElementById('accCodeImport'); if (!ta) return;
      const ni = document.getElementById('accImportName');
      const pwEl = document.getElementById('accImportPw');
      const pw2El = document.getElementById('accImportPw2');
      const err = document.getElementById('accImportErr');
      const btn = document.querySelector('[data-act="accountImportNew"]');
      if (err) err.textContent = '';
      if (!String(ta.value || '').trim()) {
        if (err) err.textContent = '请先粘贴存档码';
        ta.focus();
        return;
      }
      const raw = ni ? ni.value : '';
      if (raw && !String(raw).trim()) {
        if (err) err.textContent = '用户名不能全是空格';
        return;
      }
      const pw = pwEl ? pwEl.value : '';
      const pw2 = pw2El ? pw2El.value : '';
      if (pw || pw2) {
        if (!pw) {
          if (err) err.textContent = '请先输入密码';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw.trim().length < 4) {
          if (err) err.textContent = '密码至少 4 位';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw.length > 64) {
          if (err) err.textContent = '密码最多 64 位';
          if (pwEl) pwEl.focus();
          return;
        }
        if (pw !== pw2) {
          if (err) err.textContent = '两次输入的密码不一致';
          if (pw2El) pw2El.focus();
          return;
        }
      }
      let rec = null;
      if (pw) {
        if (!TW.Auth || !TW.Auth.supported || !TW.Auth.supported()) {
          if (err) err.textContent = '当前浏览器不支持密码加密，可留空导入无密码账户';
          return;
        }
        const label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = '加密中…'; }
        try { rec = await TW.Auth.makeRecord(pw); } catch (e) { rec = null; }
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (!rec) {
          if (err) err.textContent = '密码加密失败，请重试';
          return;
        }
      }
      const r = TW.Game.importAccount(ta.value, raw);
      if (r && r.error === 'duplicate') {
        if (err) err.textContent = '该用户名已被使用，请在上方填写新账户名';
        toast('用户名重复：请填写新的账户名', 'err');
        if (ni) { ni.focus(); ni.select(); }
        return;
      }
      if (r && r.id) {
        if (rec) TW.Game.setAccountPassword(r.id, rec);
        toast(rec ? '已导入账户，密码已启用：' + r.name : '已导入账户：' + r.name);
      } else {
        if (err) err.textContent = '存档码无效';
        toast('存档码无效', 'err');
      }
    },
    accountImportOverwrite() {
      const ta = document.getElementById('accCodeImport'); if (!ta) return;
      if (TW.Game.importSave(ta.value)) { toast('已覆盖当前账户'); closeModal(); render(); }
      else toast('存档码无效', 'err');
    },
    accountDelete(el) { openAccountDelete(el.dataset.id); },
    accountDeleteDo(el) {
      if (TW.Game.deleteAccount(el.dataset.id)) {
        toast('账户已删除');
        openAccounts();
        if (TW.Auth) setTimeout(() => TW.Auth.guardActive(), 30);
      } else toast('无法删除该账户', 'err');
    },
    accountResetDev() { openAccountResetDev(); },
    accountResetDevDo() {
      if (TW.Game.resetDev()) { toast('开发者账户已重置'); closeModal(); render(); }
    },
    help() { openHelp(); },
    quality(el) { TW.Game.save.settings.quality = el.dataset.q; TW.Game.saveNow(); openSettings(); render(); },
    difficulty(el) {
      const k = el.dataset.d;
      if (!D.DIFFICULTY[k]) return;
      TW.Game.save.settings.difficulty = k;
      TW.Game.saveNow();
      const sid = el.dataset.id;
      const stage = D.STAGE_MAP[sid] || state.pendingDungeon;
      if (stage) openStage(stage.id, D.STAGE_MAP[stage.id] ? undefined : stage);
      else closeModal();
      toast('战斗难度：' + D.DIFFICULTY[k].name);
    },
    diffSetting(el) {
      const k = el.dataset.d;
      if (!D.DIFFICULTY[k]) return;
      TW.Game.save.settings.difficulty = k;
      TW.Game.saveNow();
      openSettings();
      toast('战斗难度：' + D.DIFFICULTY[k].name);
    },
    toggleAuto() { const st = TW.Game.save.settings; st.auto = !st.auto; TW.Game.saveNow(); openSettings(); },
    toggleDmg() { const st = TW.Game.save.settings; st.dmgNum = !st.dmgNum; TW.Game.saveNow(); openSettings(); },
    toggleCursor() {
      const st = TW.Game.save.settings;
      st.cursorFx = !(st.cursorFx !== false);
      TW.Game.saveNow();
      if (TW.Cursor) TW.Cursor.setEnabled(st.cursorFx);
      openSettings();
    },
    exportSave() { openSaveIO('export'); },
    importSave() { openSaveIO('import'); },
    copySave() {
      const ta = el('saveIO'); if (!ta) return;
      ta.select(); document.execCommand('copy');
      toast('已复制');
    },
    doImport() {
      const ta = el('saveIO'); if (!ta) return;
      if (TW.Game.importSave(ta.value)) { toast('导入成功'); closeModal(); render(); }
      else toast('存档无效', 'err');
    },
    resetSave() {
      modal(`<h2>重置进度</h2><div class="sub">所有英雄、关卡进度与货币都会清空，且无法恢复。</div>
        <div class="modal-actions"><button class="btn ghost" data-act="closeModal">取消</button>
        <button class="btn gold" data-act="doReset" style="background:linear-gradient(180deg,#ff8a9c,#b03048);color:#fff">确认重置</button></div>`);
    },
    doReset() { TW.Game.reset(); closeModal(); go('home'); render(); },
    closeModal() { closeModal(); }
  };

  function rewardText(list) {
    const map = { gem: '星砂', gold: '金币', book: '经验书', crystal: '潮晶', stone: '强化石', star: '星辉' };
    return list.map(r => (map[r.kind] || r.kind) + ' +' + fmt(r.amount)).join('、');
  }

  /* ================= 渲染入口 ================= */
  function render() {
    if (TW.Battle.active()) return;
    if (TW.Game && TW.Game.checkDaily) TW.Game.checkDaily();
    const { name, arg } = parse();
    let html = '';
    if (name === 'home') html = screenHome();
    else if (name === 'campaign' || name === 'chapter') html = name === 'campaign' ? screenCampaign() : screenChapter(+arg);
    else if (name === 'heroes') html = screenHeroes();
    else if (name === 'hero') html = screenHero(arg);
    else if (name === 'gacha') html = screenGacha();
    else if (name === 'dungeons') html = screenDungeons();
    else if (name === 'trial') html = screenTrial();
    else if (name === 'more') html = screenMore();
    else html = screenHome();
    app().innerHTML = html;
    app().scrollTop = 0;
    window.scrollTo(0, 0);
    syncBg();
  }

  function syncBg() {
    // 背景恒定，仅调整战斗时的可见性
    const bw = document.getElementById('battleWrap');
    if (bw && !TW.Battle.active()) bw.classList.add('hidden');
  }

  /* ================= 初始化 ================= */
  function init() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const fn = actions[t.dataset.act];
      if (!fn) return;
      e.preventDefault();
      try { fn(t); } catch (err) { console.error(err); toast('出了一点问题', 'err'); }
    });
    document.addEventListener('input', e => {
      const id = e.target && e.target.id;
      if (id === 'newAccName' || id === 'newAccPw' || id === 'newAccPw2' || id === 'accRenameName' || id === 'accImportName' || id === 'accImportPw' || id === 'accImportPw2') {
        const errId = (id === 'newAccName' || id === 'newAccPw' || id === 'newAccPw2') ? 'newAccErr'
          : (id === 'accRenameName' ? 'accNameErr' : 'accImportErr');
        const er = document.getElementById(errId);
        if (er) er.textContent = '';
      }
      const t = e.target.closest('[data-set]');
      if (!t) return;
      if (t.dataset.set === 'vol') {
        TW.Game.save.settings.vol = +t.value / 100;
        if (TW.Audio) TW.Audio.setMaster(+t.value / 100);
        if (TW.Sfx && TW.Sfx.setVol) TW.Sfx.setVol(+t.value / 100);
        TW.Game.saveNow();
      } else if (t.dataset.set === 'bgm') {
        TW.Game.save.settings.bgm = +t.value / 100;
        if (TW.Audio) TW.Audio.setBgm(+t.value / 100);
        TW.Game.saveNow();
      } else if (t.dataset.set === 'sfx') {
        TW.Game.save.settings.sfx = +t.value / 100;
        if (TW.Audio) TW.Audio.setSfx(+t.value / 100);
        TW.Game.saveNow();
      }
    });
    window.addEventListener('hashchange', render);
    document.addEventListener('visibilitychange', () => {
      if (TW.Sfx && document.hidden && TW.Sfx.pause) TW.Sfx.pause();
    });
    if (!location.hash) location.replace('#/home');
    render();
    if (TW.Auth) setTimeout(() => TW.Auth.guardActive(), 30);
  }

  TW.Art = { figure };
  TW.Icons = icon;
  TW.UI = { init, render, go, toast, modal, closeModal, startBattle, openStage, cardHTML, figure, icon, accountChanged, openAccounts };
})(window.TW);
