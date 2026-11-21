/* 汐境回响 — 本地账户密码（PBKDF2-SHA256） */
(function (TW) {
  'use strict';

  const ITER = 120000;
  const MIN = 4, MAX = 64;
  const S = { unlockedId: null, busy: false };


  function G() { return TW.Game; }
  function hasCrypto() {
    return !!(window.crypto && window.crypto.subtle && window.TextEncoder);
  }
  function b64(buf) {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function unb64(str) {
    const s = atob(String(str || ''));
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function has(acc) {
    return !!(acc && acc.pw && acc.pw.hash && acc.pw.salt);
  }

  async function derive(pw, saltB64, iter) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt: unb64(saltB64),
      iterations: iter || ITER,
      hash: 'SHA-256'
    }, key, 256);
    return b64(bits);
  }

  async function makeRecord(pw) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltB64 = b64(salt);
    const hash = await derive(pw, saltB64, ITER);
    return { v: 1, algo: 'pbkdf2-sha256', iter: ITER, salt: saltB64, hash: hash };
  }

  async function verify(rec, pw) {
    if (!has({ pw: rec })) return true;
    if (!hasCrypto()) return false;
    const h = await derive(pw, rec.salt, rec.iter || ITER);
    const a = unb64(h), b = unb64(rec.hash);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  function callVerify(rec, pw) {
    const fn = (TW.Auth && typeof TW.Auth.verify === 'function') ? TW.Auth.verify : verify;
    return fn(rec, pw);
  }
  function callMake(pw) {
    const fn = (TW.Auth && typeof TW.Auth.makeRecord === 'function') ? TW.Auth.makeRecord : makeRecord;
    return fn(pw);
  }

  function errEl(id) { return document.getElementById(id); }
  function setErr(text) {
    const e = errEl('pwErr');
    if (!e) return;
    e.textContent = text || '';
    e.classList.toggle('on', !!text);
  }

  /* ================= 锁定界面 ================= */
  function showLock(id, opts) {
    opts = opts || {};
    const acc = G().accountById(id);
    if (!acc) return;
    if (!has(acc)) {
      // 无密码的账户直接切换
      if (id !== G().activeId) {
        const r = G().switchAccount(id, true);
        if (r) S.unlockedId = id;
      }
      return;
    }
    const list = G().accounts().filter(a => a.id !== id);
    const other = list.map(a => `
      <button class="pw-acc" data-pw-acc="${esc(a.id)}">
        <span class="pw-acc-ic">${a.isDev ? '★' : TW.UI.icon('hero')}</span>
        <span class="pw-acc-txt"><b>${esc(a.name)}</b><em>${a.isDev ? '开发者' : (has(a) ? '已加密' : '无密码')}</em></span>
        <span class="pw-acc-go">${has(a) ? '解锁' : '进入'}</span>
      </button>`).join('');

    TW.UI.modal(`<div class="pw-lock">
      <div class="pw-lock-head">
        <div class="pw-lock-icon">${TW.UI.icon('lock')}</div>
        <div>
          <div class="panel-title">ACCOUNT LOCK</div>
          <h2>账户已锁定</h2>
          <div class="sub">${esc(acc.name)} · 输入密码继续</div>
        </div>
      </div>
      <div class="pw-field">
        <label for="pwLockInput">密码</label>
        <input id="pwLockInput" class="pw-input" type="password" maxlength="${MAX}" autocomplete="current-password" placeholder="输入账户密码" />
      </div>
      <div class="pw-err" id="pwErr"></div>
      <div class="modal-actions">
        <button class="btn gold" id="pwUnlock">解锁</button>
        <button class="btn ghost" id="pwOther">使用其他账户</button>
        ${opts.switch ? '<button class="btn ghost" id="pwBack">返回当前账户</button>' : ''}
      </div>
      <p class="pw-note">密码仅保存在本机，用于切换账户时的本地锁；无法找回。导出码不包含密码。</p>
      <div class="pw-switch hidden" id="pwSwitch">
        <div class="panel-title" style="margin-bottom:8px">切换账户</div>
        <div class="pw-acc-list">${other || '<div class="small dim" style="padding:8px 0">没有其他账户</div>'}</div>
      </div>
    </div>`, '', true);

    const input = errEl('pwLockInput');
    const btn = errEl('pwUnlock');
    const otherBtn = errEl('pwOther');
    const sw = errEl('pwSwitch');
    setErr('');

    function fail(text) {
      setErr(text);
      const card = document.querySelector('#overlay .pw-lock');
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
      }
    }

    async function unlock() {
      if (S.busy) return;
      const v = input ? input.value : '';
      if (!v) { fail('请输入密码'); return; }
      if (!hasCrypto()) { fail('当前浏览器不支持密码校验'); return; }
      S.busy = true;
      if (btn) { btn.disabled = true; btn.textContent = '校验中…'; }
      let ok = false;
      try { ok = await callVerify(acc.pw, v); } catch (e) { ok = false; }
      S.busy = false;
      if (!ok) {
        if (btn) { btn.disabled = false; btn.textContent = '解锁'; }
        await new Promise(r => setTimeout(r, 260));
        fail('密码错误，请重试');
        if (input) { input.select(); }
        return;
      }
      S.unlockedId = id;
      if (opts.switch) {
        TW.UI.closeModal();
        const r = G().switchAccount(id, true);
        if (r) {
          S.unlockedId = id;
          TW.toast('已切换到「' + acc.name + '」');
        }
      } else {
        TW.UI.closeModal();
        TW.toast('账户已解锁');
      }
    }

    if (btn) btn.onclick = unlock;
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); unlock(); }
      });
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 60);
    }
    if (otherBtn) otherBtn.onclick = () => {
      if (!other.length) { fail('没有其他账户'); return; }
      sw.classList.toggle('hidden');
      setErr('');
    };
    const backBtn = errEl('pwBack');
    if (backBtn) backBtn.onclick = () => {
      TW.UI.closeModal();
      TW.UI.openAccounts();
    };
    document.querySelectorAll('#pwSwitch [data-pw-acc]').forEach(el => {
      el.onclick = () => {
        const target = el.dataset.pwAcc;
        const a = G().accountById(target);
        if (!a) return;
        if (target === G().activeId && S.unlockedId === target) {
          TW.UI.closeModal();
          TW.UI.openAccounts();
          return;
        }
        if (has(a)) { showLock(target, { switch: true }); return; }
        TW.UI.closeModal();
        const r = G().switchAccount(target, true);
        if (r) {
          S.unlockedId = target;
          TW.toast('已切换到「' + a.name + '」');
        }
      };
    });
  }

  function promptSwitch(id) { showLock(id, { switch: true }); }

  function guardActive() {
    const a = G().activeAccount();
    if (!a) return;
    if (!hasCrypto()) {
      if (has(a)) TW.toast('当前浏览器不支持密码校验，已跳过账户锁', 'warn');
      return;
    }
    if (has(a) && S.unlockedId !== a.id) showLock(a.id, { switch: false });
  }

  /* ================= 设置 / 修改密码 ================= */
  function openSet(id) {
    const acc = G().accountById(id);
    if (!acc) return;
    const exists = has(acc);
    if (!hasCrypto()) {
      TW.toast('当前浏览器不支持本地密码功能', 'warn');
      return;
    }
    TW.UI.modal(`<button class="x" data-act="closeModal">${TW.UI.icon('close')}</button>
      <div class="pw-set">
        <div class="panel-title">ACCOUNT SECURITY</div>
        <h2 style="margin-top:6px">${exists ? '修改密码' : '设置密码'}</h2>
        <div class="sub">${esc(acc.name)} · 密码只保存在本机，不会上传。</div>
        ${exists ? `
        <div class="pw-field">
          <label for="pwCur">当前密码</label>
          <input id="pwCur" class="pw-input" type="password" maxlength="${MAX}" autocomplete="current-password" placeholder="输入当前密码" />
        </div>` : ''}
        <div class="pw-field">
          <label for="pwNew">新密码</label>
          <input id="pwNew" class="pw-input" type="password" maxlength="${MAX}" autocomplete="new-password" placeholder="至少 ${MIN} 位，最多 ${MAX} 位" />
        </div>
        <div class="pw-field">
          <label for="pwNew2">确认新密码</label>
          <input id="pwNew2" class="pw-input" type="password" maxlength="${MAX}" autocomplete="new-password" placeholder="再次输入" />
        </div>
        <div class="pw-err" id="pwErr"></div>
        <div class="pw-strength"><i id="pwBar"></i></div>
        <div class="modal-actions">
          <button class="btn gold" id="pwSave">${exists ? '保存新密码' : '启用密码'}</button>
          ${exists ? `<button class="btn ghost" id="pwClear" style="color:var(--rose-400)">清除密码</button>` : ''}
          <button class="btn ghost" id="pwCancel">取消</button>
        </div>
        <p class="pw-note">忘记密码后无法找回；如需恢复，只能清除浏览器中的本站数据（会删除所有账户）。导出码不包含密码。</p>
      </div>`, '', true);

    const cur = errEl('pwCur'), nw = errEl('pwNew'), nw2 = errEl('pwNew2');
    const save = errEl('pwSave'), clearBtn = errEl('pwClear');
    const cancel = errEl('pwCancel');
    const bar = errEl('pwBar');
    setErr('');
    if (nw) {
      setTimeout(() => { try { (cur || nw).focus(); } catch (e) {} }, 60);
      nw.addEventListener('input', () => {
        const v = nw.value || '';
        let score = 0;
        if (v.length >= MIN) score += 25;
        if (v.length >= 8) score += 20;
        if (v.length >= 12) score += 15;
        if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 15;
        if (/\d/.test(v)) score += 10;
        if (/[^a-zA-Z0-9]/.test(v)) score += 15;
        if (bar) {
          bar.style.width = Math.min(100, score) + '%';
          bar.style.background = score < 45 ? '#ff5c7a' : score < 70 ? '#ffca6b' : '#4fe0a0';
        }
      });
      if (nw2) nw2.addEventListener('keydown', e => { if (e.key === 'Enter') save && save.click(); });
    }
    if (cancel) cancel.onclick = () => { TW.UI.closeModal(); TW.UI.openAccounts(); };

    async function checkCurrent() {
      if (!exists) return true;
      const v = cur ? cur.value : '';
      if (!v) { setErr('请输入当前密码'); return false; }
      let ok = false;
      try { ok = await callVerify(acc.pw, v); } catch (e) { ok = false; }
      if (!ok) { setErr('当前密码不正确'); return false; }
      return true;
    }

    if (save) save.onclick = async () => {
      if (S.busy) return;
      const v = nw ? nw.value : '';
      const v2 = nw2 ? nw2.value : '';
      if (v.trim().length < MIN) { setErr('新密码至少 ' + MIN + ' 位'); return; }
      if (v.length > MAX) { setErr('新密码最多 ' + MAX + ' 位'); return; }
      if (v !== v2) { setErr('两次输入的新密码不一致'); return; }
      S.busy = true;
      const old = save.textContent;
      save.disabled = true; save.textContent = '处理中…';
      const ok = await checkCurrent();
      if (!ok) { S.busy = false; save.disabled = false; save.textContent = old; return; }
      let rec = null;
      try { rec = await callMake(v); } catch (e) { rec = null; }
      S.busy = false;
      save.disabled = false; save.textContent = old;
      if (!rec) { setErr('密码加密失败，请重试'); return; }
      if (!G().setAccountPassword(id, rec)) { setErr('保存失败，请重试'); return; }
      TW.UI.closeModal();
      TW.UI.openAccounts();
      TW.toast(exists ? '密码已更新' : '密码已启用');
    };

    if (clearBtn) clearBtn.onclick = async () => {
      if (S.busy) return;
      S.busy = true;
      const old = clearBtn.textContent;
      clearBtn.disabled = true; clearBtn.textContent = '处理中…';
      const ok = await checkCurrent();
      if (!ok) { S.busy = false; clearBtn.disabled = false; clearBtn.textContent = old; return; }
      S.busy = false;
      clearBtn.disabled = false; clearBtn.textContent = old;
      if (!G().setAccountPassword(id, null)) { setErr('操作失败'); return; }
      TW.UI.closeModal();
      TW.UI.openAccounts();
      TW.toast('已清除该账户密码');
    };
  }

  TW.Auth = {
    supported: hasCrypto,
    has: has,
    verify: verify,
    makeRecord: makeRecord,
    promptSwitch: promptSwitch,
    guardActive: guardActive,
    openSet: openSet,
    debug: () => ({ unlockedId: S.unlockedId, busy: S.busy, crypto: hasCrypto() })
  };
})(window.TW = window.TW || {});
