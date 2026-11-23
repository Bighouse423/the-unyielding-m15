'use strict';
// ===== M12a: quick wins =====
// boss titles + de-cluttered boss intros, boon card labels/wrapping, flintlock Armory icon, toast de-dupe, no build tags in the
// HUD, near-camera sprite fade + size cap (props/pickups), READABILITY setting, projectile damage attribution (death causes),
// results chart label stagger, a proper title menu. ?m12=0 switches ALL of m12 off (every m12 module returns early).
(function () {
  const M12 = window.M12 = window.M12 || {};
  M12.v = 'm12'; M12.on = !/[?&]m12=0/.test(location.search); M12.err = null;
  if (!M12.on) return;
  const guard = (f) => function () { try { return f.apply(this, arguments); } catch (e) { M12.err = String(e && e.stack || e); } };
  M12.guard = guard;

  // ---------- 1) Vampire Knight title (the speaker label read "vknight") ----------
  if (typeof EDEF !== 'undefined' && EDEF.vknight && !EDEF.vknight.title) EDEF.vknight.title = 'THE VAMPIRE KNIGHT';

  // ---------- 2) boss intro de-clutter: the quote waits for the big title, no duplicate speaker name ----------
  if (typeof M9 !== 'undefined' && M9.say) {
    const _say = M9.say;
    M9.say = function (who, line, col, dur) {
      const b = G.boss; const isBoss = b && (who === b.d.title || who === b.type);
      if (isBoss) who = '';
      const go = () => _say(who, line, col, dur);
      const busy = () => G.bigText || M12.introQ.length || (G.toasts || []).some(q => q.t1 && q.t1[0] === '"' && q.t < q.dur - 0.4);
      if (isBoss && busy()) { let n = 0; const w = () => { if (busy() && n++ < 60) setTimeout(w, 150); else go(); }; w(); }
      else go();
    };
  }

  // ---------- 3) text hooks: boon card labels, build tags, chart labels ----------
  const BT = typeof BUILD !== 'undefined' ? BUILD.toUpperCase() : '';
  const slotOf = id => /whip/.test(id) ? 'whip' : (id === 'crossbow' || /^xbow/.test(id)) ? 'ranged' : 'sword';
  const kindOf = id => /whip/.test(id) ? 'WHIP' : (id === 'crossbow' || /^xbow/.test(id)) ? 'CROSSBOW' : id === 'battleaxe' ? 'AXE' : 'SWORD';
  M12.card = null; let chartN = 0;
  const _text = text;
  text = function (ctx, str, x, y, col, align, sc, sh) {
    if (typeof str === 'string') {
      if (BT && (str === BT || str === 'BUILD ' + BT)) return;
      if (G.state === 'pick' && M12.card && M12.card.kind === 'WEAPON') {
        if (str === 'SWORD' || str === 'WHIP' || str === 'RANGED WEAPON') str = kindOf(M12.card.id);
        else if (/^replaces (sword|whip|ranged)$/.test(str)) str = 'replaces ' + slotOf(M12.card.id);
      }
      if (str === 'KILLS PER STAGE') chartN = 0;
      if (M12.titleHide && M12.titleHide(str, x, y)) return;
    }
    return _text.apply(this, [ctx, str, x, y, col, align, sc, sh].slice(0, arguments.length));
  };
  if (typeof fitBlock === 'function') {
    const _fb = fitBlock;
    fitBlock = function (ctx, str, x, y, maxW, maxH, col, align, sc, lh) {
      if (G.state === 'results' && maxH === 9 && typeof str === 'string' && /^\d+:\d\d$/.test(str)) { const i = chartN++; if (i % 2) y += 9; maxW = Math.max(maxW, 30); }
      return _fb.apply(this, arguments.length > 6 ? [ctx, str, x, y, maxW, maxH, col, align, sc, lh].slice(0, arguments.length) : [ctx, str, x, y, maxW, maxH]);
    };
  }
  if (typeof promptRow === 'function') { const _pr = promptRow; promptRow = function (ctx, parts, x, y) { if (M12.titleHide && M12.titleHide(parts, x, y)) return; return _pr.apply(this, arguments); }; }
  // descriptions: the footer already says "replaces ranged", so the long sentence that got cut ("Replaces..") goes
  if (typeof UPG !== 'undefined') for (const u of UPG) if (u.kind === 'WEAPON' && typeof u.desc === 'string') u.desc = u.desc.replace(/\s*Replaces your ranged weapon\.?$/, '');

  // ---------- 4) icons: flintlock Consecrated Sidearm (m9n art) + current pick card ----------
  function flintIcon() {
    const src = Engine.imgs.vm_pistol_m9n; if (!src || !src.width) return null;
    const c0 = document.createElement('canvas'); c0.width = src.width; c0.height = src.height; const x0 = c0.getContext('2d'); x0.drawImage(src, 0, 0);
    const d = x0.getImageData(0, 0, c0.width, c0.height).data; let a = 1e9, b = 1e9, cR = -1, dB = -1;
    const lim = Math.round(src.height * 0.72);   // the gun only (the fist is drawn from the old sprite at the bottom)
    for (let y = 0; y < lim; y++) for (let x = 0; x < c0.width; x++) if (d[(y * c0.width + x) * 4 + 3] > 20) { a = Math.min(a, x); b = Math.min(b, y); cR = Math.max(cR, x); dB = Math.max(dB, y); }
    if (cR < 0) return null; const w = cR - a + 1, h = dB - b + 1;
    const c = document.createElement('canvas'); c.width = h; c.height = w; const x = c.getContext('2d');   // rotated: barrel points left
    x.translate(0, w); x.rotate(-Math.PI / 2); x.drawImage(c0, a, b, w, h, 0, 0, w, h);
    return c;
  }
  let FI = null, fiTry = 0;
  M12.flint = () => { if (!FI && fiTry++ < 3) FI = flintIcon(); return FI; };
  if (typeof M9 !== 'undefined' && M9.armoryDraw) { const _ad = M9.armoryDraw; M9.armoryDraw = function () { const f = M12.flint(), o = Engine.imgs.p_pistol; if (f) Engine.imgs.p_pistol = f; try { return _ad.apply(this, arguments); } finally { Engine.imgs.p_pistol = o; } }; }
  const _di = drawIcon;
  drawIcon = function (ctx, name, cx, cy, maxW, maxH) {
    if (G.state === 'pick' && RUN.choices) { const u = RUN.choices.find(q => q.icon === name); if (u) M12.card = u; }
    if (name === 'p_pistol') { if (!FI && fiTry++ < 3) FI = flintIcon(); if (FI) { Engine.imgs.ic_m12pistol = FI; name = 'ic_m12pistol'; } }
    return _di.call(this, ctx, name, cx, cy, maxW, maxH);
  };

  // ---------- 5) toasts: identical toasts refresh instead of stacking; the Feat popup hides behind the pause menu ----------
  const _toast = toast;
  M12.introQ = []; M12.sealT = -1; M12.tq = []; let tqT = 0;
  const sealed = () => { try { return G.state === 'play' && G.boss && G.boss.alive && LEVEL.doors && LEVEL.doors.gate && LEVEL.doors.gate.state === 'sealed'; } catch (e) { return false; } };
  M12.introTick = function () {
    if (G.state !== 'play') { if (G.state !== 'pick' && G.state !== 'pause') M12.tq.length = 0; }
    else if (M12.tq.length && (tqT -= 1 / 60) <= 0 && G.toasts.filter(q => q.t < q.dur - 0.35).length < 2) { tqT = 0.45; const q = M12.tq.shift(); _toast(q[0], q[1], q[2], q[3]); }
    if (!sealed()) { M12.sealT = -1; if (M12.introQ.length && G.state !== 'play') M12.introQ.length = 0; return; }
    if (M12.sealT < 0) { M12.sealT = G.time; G.toasts = G.toasts.filter(q => q.t1 && q.t1[0] === '"'); }
    if (M12.introQ.length && !G.bigText && G.time - M12.sealT > 2.6) { const q = M12.introQ.shift(); _toast(q[0], q[1], q[2], q[3]); }
  };
  toast = function (t1, t2 = '', col, dur) {
    if (t1 === 'BEFORE YOU ENTER' && sealed()) return;
    if (sealed() && (M12.sealT < 0 || G.time - M12.sealT < 3.2 || G.bigText) && !(G.toasts.length === 0 && !G.bigText && M12.sealT >= 0)) { M12.introQ.push([t1, t2, col, dur]); return; }
    const o = G.toasts && G.toasts.find(q => q.t1 === t1 && (q.t2 || '') === (t2 || ''));
    if (o) { o.t = Math.min(o.t, 0.2); if (dur) o.dur = Math.max(o.dur, dur); return; }
    if (M12.tq.some(q => q[0] === t1 && (q[1] || '') === (t2 || ''))) return;
    if (G.state === 'play' && G.toasts.filter(q => q.t < q.dur - 0.35).length >= 2) { M12.tq.push([t1, t2, col, dur]); if (M12.tq.length > 5) M12.tq.shift(); return; }
    return _toast.apply(this, arguments);
  };
  if (window.M8DRAW) {
    for (let i = 0; i < M8DRAW.length; i++) {
      const f = M8DRAW[i], s = String(f);
      if (s.includes('FEAT UNLOCKED')) M8DRAW[i] = function (ctx, rdt) { if (G.paused) { if (window.ACH && ACH.cur) ACH.t = Math.max(0, ACH.t - (rdt || 0)); return false; } return f.apply(this, arguments); };
    }
  }

  // ---------- 6) near-camera sprites: props / pickups / decor fade out and stop growing (foes already clamp at 1.05) ----------
  const NEAR = 1.25; M12.ENTCAP = 1.35; M12.capN = 0;
  const _ds = drawSprites;
  drawSprites = function (cam, S) {
    if (G.state === 'play' && S && S.length) {
      const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang); let out = null;
      for (let i = 0; i < S.length; i++) {
        const s = S[i]; if (!s) continue;
        const rx = s.x - cam.x, ry = s.y - cam.y, d = rx * dx + ry * dy;
        if (s.ent) { const de = Math.max(1.05, d), r = s.h / de; if (d > 0.15 && r > M12.ENTCAP) { if (!out) out = S.slice(); const k = M12.ENTCAP / r; out[i] = Object.assign({}, s, { w: s.w * k, h: s.h * k }); M12.capN++; } continue; }
        if (d > 0.15 && d < NEAR) {
          if (!out) out = S.slice();
          const k = NEAR / d, a0 = s.alpha === undefined ? 1 : s.alpha;
          out[i] = Object.assign({}, s, { x: cam.x + rx * k, y: cam.y + ry * k, alpha: a0 * Math.max(0, Math.min(1, (d - 0.25) / 0.7)) });
        }
      }
      if (out) return _ds.call(this, cam, out);
    }
    return _ds.apply(this, arguments);
  };

  // ---------- 7) READABILITY setting (OFF / ON / HIGH): tones down flashes, bursts, screen blood and bloom ----------
  if (window.OPT) {
    const S = OPT.S; if (S.m12read === undefined) S.m12read = 0;
    M12.readK = () => [1, 0.55, 0.3][S.m12read | 0];
    const _rows = OPT.rows;
    OPT.rows = function () {
      const L = _rows.apply(this, arguments);
      if (this.page === 'main') { const i = L.findIndex(r => r.id === 'flash'); const row = { t: 'opt', id: 'm12read', l: 'READABILITY', v: () => ['OFF', 'ON', 'HIGH'][S.m12read | 0] }; if (i >= 0) L.splice(i + 1, 0, row); else L.push(row); }
      return L;
    };
    const _in = OPT.input;
    OPT.input = function (rdt) {
      try {
        if (this.page === 'main' && !this.cap) {
          const L = this.rows(); const r = L[this.sel];
          if (r && r.id === 'm12read') { const d = (KP.ArrowLeft || KP.KeyA) ? -1 : (KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK) ? 1 : 0; if (d) { S.m12read = ((S.m12read | 0) + d + 3) % 3; OPT.save(); } }
        }
      } catch (e) { M12.err = String(e); }
      return _in.apply(this, arguments);
    };
    const _fk = OPT.flashK; OPT.flashK = () => _fk() * M12.readK();
    if (typeof screenSplat === 'function') { const _ss = screenSplat; screenSplat = function (n, big) { const k = M12.readK(); return _ss(k < 1 ? Math.round(n * k) : n, big); }; }
  }

  // ---------- 8) projectile damage attribution (death cause names the shooter, not "dark magic") ----------
  M12.byType = {};
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    const hp0 = P.hp; const r = _hp.apply(this, arguments); opt = opt || {};
    if (!opt.src && !opt.env && (r === 'hit' || r === 'block') && G.projectiles) {
      let best = null, bd = 0.05;
      for (const p of G.projectiles) { const d = Math.hypot(p.x - (p.vx || 0) * 0.1 - sx, p.y - (p.vy || 0) * 0.1 - sy); if (d < bd) { bd = d; best = p; } }
      if (best && best.owner && best.owner.type) { G.lastHit = best.owner.type; M12.projSrc = best.owner; }
    }
    if (P.hp < hp0) { const k = (opt.src && opt.src.type) || (opt.env ? 'env' : G.lastHit || 'magic'); M12.byType[k] = (M12.byType[k] || 0) + (hp0 - Math.max(0, P.hp)); }
    return r;
  };

  // ---------- 9) title menu ----------
  const MENU = [
    { id: 'play', l: 'NEW RUN' }, { id: 'sets', l: 'SETTINGS' }, { id: 'codex', l: 'CODEX' }, { id: 'ctrl', l: 'CONTROLS' }, { id: 'cred', l: 'CREDITS' }, { id: 'quit', l: 'QUIT' },
  ];
  M12.MENU = MENU; const TM = M12.TM = { sel: 0, ctrl: false, msg: '', msgT: 0, y0: 150, rh: 12 };
  M12.titleHide = (s, x, y) => {
    if (G.state !== 'title') return false;
    if (typeof s === 'string' && (s === 'S  SETTINGS' || s === 'C  CODEX')) return true;
    if (TM.ctrl) return M12.inTitle && y >= 145 && y < 158;
    if (TM.hide) return M12.inTitle && y >= 120;
    if (Array.isArray(s) && (s.join('').includes('SETTINGS') || s.join('').includes('CODEX'))) return true;
    if (!M12.inTitle) return false;
    if (y >= 145 && x >= 280 && x <= 300) return true;           // the old controls wall + "press enter"
    if (typeof s === 'string' && (s === 'S  SETTINGS' || s === 'C  CODEX')) return true;
    if (Array.isArray(s) && (s.join('').includes('SETTINGS') || s.join('').includes('CODEX'))) return true;
    return false;
  };
  const _dt = drawTitle;
  drawTitle = function (ctx) {
    M12.inTitle = true; try { _dt.apply(this, arguments); } finally { M12.inTitle = false; }
    if (TM.hide) return;
    if (TM.ctrl) { _text(ctx, 'CONTROLS  -  ESC / ENTER back', 290, 150, '#ffe080', 'center'); return; }
    const cx = 290; let y = TM.y0;
    ctx.save(); ctx.fillStyle = 'rgba(12,2,20,0.6)'; ctx.fillRect(cx - 70, y - 6, 140, MENU.length * TM.rh + 10); ctx.fillStyle = 'rgba(240,192,64,0.55)'; ctx.fillRect(cx - 70, y - 6, 140, 1); ctx.fillRect(cx - 70, y + MENU.length * TM.rh + 3, 140, 1); ctx.restore();
    MENU.forEach((m, i) => {
      const on = i === TM.sel;
      if (on) { ctx.fillStyle = 'rgba(160,80,255,0.45)'; ctx.fillRect(cx - 66, y - 2, 132, 11); }
      const lab = m.id === 'play' && M12.mode ? 'NEW RUN - ' + M12.mode().l : m.l;
      _text(ctx, (on ? '> ' : '') + lab + (on ? ' <' : ''), cx, y, on ? '#ffe080' : '#d8c8f0', 'center');
      y += TM.rh;
    });
    if (TM.sel === 0 && M12.mode && !(TM.msgT > 0)) { _text(ctx, '< > ' + M12.mode().d, cx, y + 6, '#c0a0ff', 'center'); return; }
    if (TM.msgT > 0) { TM.msgT -= 1 / 60; _text(ctx, TM.msg, cx, y + 6, '#ff9a80', 'center'); }
    else _text(ctx, G.inputMode === 'pad' ? 'D-PAD choose   CROSS select' : 'UP/DOWN choose   ENTER select', cx, y + 6, '#8070a8', 'center');
  };
  function activate(id) {
    SFX.init && SFX.init(); try { SFX.ev ? SFX.ev('ui_click', 0.5, ['clink']) : SFX.play('clink', 0.3); } catch (e) { }
    if (id === 'play') { if (M12.onPlay && M12.onPlay()) return; if (typeof enterHub === 'function') enterHub(); else newRun(); }
    else if (id === 'sets') OPT.show('title');
    else if (id === 'codex') M9.openCodex('RECORD', 'title');
    else if (id === 'cred') M9.openCodex('CREDITS', 'title');
    else if (id === 'ctrl') TM.ctrl = true;
    else if (id === 'quit') { if (window.M12DESKTOP && M12DESKTOP.quit) M12DESKTOP.quit(); else { try { window.close(); } catch (e) { } TM.msg = 'CLOSE THIS TAB TO QUIT'; TM.msgT = 2.5; } }
    else if (M12.menuAct) M12.menuAct(id);
  }
  M12.activate = activate;
  // raw S on the title opened Settings (m8) - in the menu it is "down"
  addEventListener('keydown', e => { if (G.state === 'title' && !(window.OPT && OPT.open) && !TM.ctrl && e.code === 'KeyS') { e.stopImmediatePropagation(); KP.ArrowDown = true; } }, true);
  const _fi = frameInner;
  frameInner = function (now) {
    try { M12.introTick(); } catch (e) { M12.err = e; }
    if (G.state === 'title' && !(window.OPT && OPT.open)) {
      try {
        if (TM.ctrl) { if (KP.Escape || KP.Enter || KP.Space || KP.PadBack || KP.PadOK || MBP[0]) { TM.ctrl = false; } for (const k of ['Enter', 'Space', 'PadOK', 'PadStart', 'Escape', 'PadBack', 'PadY']) delete KP[k]; MBP[0] = false; }
        else {
          const n = MENU.length;
          if (KP.ArrowUp || KP.KeyW) { TM.sel = (TM.sel + n - 1) % n; try { SFX.play('swing', 0.2); } catch (e) { } }
          if (KP.ArrowDown || KP.KeyS) { TM.sel = (TM.sel + 1) % n; try { SFX.play('swing', 0.2); } catch (e) { } }
          const mx = OPT.mx, my = OPT.my; let hov = -1;
          if (mx >= 220 && mx <= 360 && my >= TM.y0 - 2 && my < TM.y0 - 2 + n * TM.rh) { hov = Math.floor((my - TM.y0 + 2) / TM.rh); if (hov !== TM.hov) TM.sel = hov; }
          TM.hov = hov;
          const go = KP.Enter || KP.Space || KP.PadOK || KP.PadStart || (MBP[0] && hov >= 0);
          const id = MENU[TM.sel].id;
          if (KP.PadY) { delete KP.PadY; OPT.show('title'); }
          if (id === 'play' && M12.cycleDiff && (KP.ArrowLeft || KP.ArrowRight || KP.KeyA || KP.KeyD)) { M12.cycleDiff((KP.ArrowLeft || KP.KeyA) ? -1 : 1); try { SFX.play('clink', 0.3); } catch (e) { } for (const k of ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']) delete KP[k]; }
          for (const k of ['Enter', 'Space', 'PadOK', 'PadStart', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS']) delete KP[k]; MBP[0] = false;
          if (go) activate(id);
        }
      } catch (e) { M12.err = String(e); }
    }
    return _fi.apply(this, arguments);
  };
})();
