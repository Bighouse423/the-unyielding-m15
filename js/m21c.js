// ===== m21c: accessibility — HUD/text scale, hold-to-toggle sprint/shield, head-bob
// reduce, subtitle/dialogue toggle, colour-blind pickup/enemy outlines (off by default).
// Kill: ?m21c=0 / ?m21=0 (all) | ?hudscale=0 | ?holdtog=0 | ?bobred=0 | ?subs=0 | ?cbout=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21c') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21C = {
    on: !off, hudscale: on('hudscale'), holdtog: on('holdtog'), bobred: on('bobred'),
    subs: on('subs'), cbout: on('cbout'),
    n: { hud: 0, sprint: 0, shield: 0, bob: 0, subHid: 0, marks: 0 },
    err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  function S() { return (window.OPT && OPT.S) || {}; }
  const HUDV = [1, 1.22, 1.4];
  const BOBV = [0, 0.4, 1];
  const HUDL = ['DEFAULT', 'LARGE', 'EXTRA'];
  const BOUNCEL = ['OFF', 'LOW', 'FULL'];
  const RUNL = ['DEFAULT', 'HOLD', 'TOGGLE'];
  const SHL = ['HOLD', 'TOGGLE'];
  M.hudK = () => { const v = +S().m21hud; return M.hudscale ? HUDV[v === 1 || v === 2 ? v : 0] : 1; };
  M.bobK = () => { if (!M.bobred) return 1; const v = S().m21bob; return v == null ? 1 : BOBV[Math.max(0, Math.min(2, v | 0))]; };
  M.sprintMode = () => (M.holdtog ? (S().m21sprint | 0) : 0); // 0 default, 1 hold, 2 toggle
  M.shieldToggle = () => !!(M.holdtog && S().m21shield === 1);
  M.subsOn = () => !M.subs || S().m21subs !== false;
  M.outOn = () => !!(M.cbout && S().m21cbout);
  M.st = () => ({
    on: M.on, hudscale: M.hudscale, holdtog: M.holdtog, bobred: M.bobred, subs: M.subs, cbout: M.cbout,
    hudK: M.hudK(), bobK: M.bobK(), sprint: M.sprintMode(), shield: M.shieldToggle(),
    subsOn: M.subsOn(), outOn: M.outOn(), n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  function defOpt(so) {
    if (!so) return;
    if (so.m21hud == null) so.m21hud = 0;
    if (so.m21bob == null) so.m21bob = 2;
    if (so.m21sprint == null) so.m21sprint = 0;
    if (so.m21shield == null) so.m21shield = 0;
    if (so.m21subs == null) so.m21subs = true;
    if (so.m21cbout == null) so.m21cbout = false;
  }

  // ---------- settings rows (ACCESSIBILITY, just above HELP) ----------
  function hookOpt() {
    if (!window.OPT || OPT._m21c) return;
    OPT._m21c = 1;
    defOpt(OPT.S);
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if (this.page && this.page !== 'main') return L;
      if (L.some(r => r && r.id === 'm21hud')) return L;
      const so = OPT.S || {};
      const rows = [
        { t: 'hdr', l: 'ACCESSIBILITY' },
        { t: 'opt', id: 'm21hud', l: 'HUD & TEXT SCALE', v: () => HUDL[so.m21hud | 0] || 'DEFAULT' },
        { t: 'opt', id: 'm21bob', l: 'HEAD BOB', v: () => BOUNCEL[so.m21bob == null ? 2 : so.m21bob] },
        { t: 'opt', id: 'm21sprint', l: 'SPRINT', v: () => RUNL[so.m21sprint | 0] || 'DEFAULT' },
        { t: 'opt', id: 'm21shield', l: 'SHIELD', v: () => SHL[so.m21shield | 0] || 'HOLD' },
        { t: 'opt', id: 'm21subs', l: 'SUBTITLES', v: () => so.m21subs === false ? 'OFF' : 'ON' },
        { t: 'opt', id: 'm21cbout', l: 'FOE / PICKUP MARKS', v: () => so.m21cbout ? 'ON' : 'OFF' },
      ];
      const help = L.findIndex(r => r && r.t === 'hdr' && /HELP/i.test(r.l || ''));
      if (help >= 0) L.splice(help, 0, ...rows);
      else L.push(...rows);
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && (OPT.page === 'main' || !OPT.page)) {
          const L = OPT.rows(), r = L[OPT.sel];
          const ids = { m21hud: 1, m21bob: 1, m21sprint: 1, m21shield: 1, m21subs: 1, m21cbout: 1 };
          if (r && ids[r.id]) {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK;
            let d = left ? -1 : right ? 1 : 0;
            if (!d && MBP[0]) d = 1;
            if (d) {
              stepAcc(r.id, d);
              if (KP) { delete KP.ArrowLeft; delete KP.KeyA; delete KP.ArrowRight; delete KP.KeyD; delete KP.Enter; delete KP.Space; delete KP.PadOK; }
              MBP[0] = false;
            }
          }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
    // keep new keys when the user hits RESET SETTINGS (binds stay; our defOpt re-fills)
    const _save = OPT.save;
    if (typeof _save === 'function') {
      OPT.save = function () { defOpt(OPT.S); return _save.apply(this, arguments); };
    }
  }
  function stepAcc(id, dir) {
    const so = OPT.S;
    const cyc = (v, n) => (v + (dir < 0 ? n - 1 : 1)) % n;
    if (id === 'm21hud') so.m21hud = cyc(so.m21hud | 0, 3);
    else if (id === 'm21bob') so.m21bob = cyc(so.m21bob == null ? 2 : so.m21bob, 3);
    else if (id === 'm21sprint') so.m21sprint = cyc(so.m21sprint | 0, 3);
    else if (id === 'm21shield') so.m21shield = so.m21shield === 1 ? 0 : 1;
    else if (id === 'm21subs') so.m21subs = so.m21subs === false;
    else if (id === 'm21cbout') so.m21cbout = !so.m21cbout;
    if (typeof OPT.save === 'function') OPT.save();
    try { if (SFX && SFX.ctx) SFX.ev('ui_click', 0.5, ['clink']); } catch (e) { }
  }

  // ---------- HUD / text scale (blit top/bottom chrome larger; middle, including the crosshair, stays 1x) ----------
  M.chromeH = function () { const s = M.hudK(); return s > 1 ? Math.round(33 * s) : 33; };
  M.blitHud = function (dst) { dst.drawImage(hud, 0, 0); };
  function hookHud() {
    if (typeof drawHUD !== 'function' || drawHUD._m21c) return;
    const _dh = drawHUD;
    const _text = typeof text === 'function' ? text : null;
    const _bar = typeof bar === 'function' ? bar : null;
    drawHUD = function (ctx, cam, rdt) {
      const s = M.hudscale ? M.hudK() : 1;
      let tRestore, bRestore;
      try {
        if (s > 1 && _text) {
          tRestore = text;
          text = function (c, str, x, y, col, align, sc, shadow) {
            const sc2 = (sc == null || sc === 1) ? (s > 1.3 ? 1.25 : 1.15) : sc;
            return _text(c, str, x, y, col, align, sc2, shadow);
          };
        }
        if (s > 1 && _bar) {
          bRestore = bar;
          bar = function (c, x, y, w, h, frac, c1, c2, back, lag, c3) {
            return _bar(c, x, y, w, Math.max(h, Math.round(h * s)), frac, c1, c2, back, lag, c3);
          };
        }
      } catch (e) { fail('hud-wrap', e); }
      _dh(ctx, cam, rdt);
      try { if (tRestore) text = tRestore; if (bRestore) bar = bRestore; } catch (e) {}
      try { if (M.outOn()) drawOutlines(ctx, cam); } catch (e) { fail('hud', e); }
      if (s > 1) M.n.hud++;
    };
    drawHUD._m21c = 1;
    // push toasts below the scaled top strip
    if (window.M20 && typeof M20.toastY === 'function' && !M20._m21cY) {
      const _ty = M20.toastY.bind(M20);
      M20.toastY = function () { const y = _ty(); const s = M.hudK(); return s > 1 ? Math.max(y, Math.ceil(M.chromeH() + 8)) : y; };
      M20._m21cY = 1;
    }
  }
  // larger glyphs in menus / settings when HUD scale is up
  function hookText() {
    if (typeof text !== 'function' || text._m21c) return;
    const _text = text;
    text = function (ctx, str, x, y, col, align, sc, shadow) {
      let sc2 = sc == null ? 1 : sc;
      try {
        if (M.hudscale) {
          const k = M.hudK();
          if (k > 1 && (window.OPT && OPT.open || G.paused || G.state === 'title' || G.state === 'altar' || G.state === 'pick' || G.state === 'results')) {
            if (sc2 <= 1) sc2 = k > 1.3 ? 1.25 : 1.15;
          }
        }
      } catch (e) { }
      return _text(ctx, str, x, y, col, align, sc2, shadow);
    };
    text._m21c = 1;
  }

  // ---------- head bob ----------
  function hookBob() {
    if (typeof updatePlayer !== 'function' || updatePlayer._m21cBob) return;
    // chained with sprint/shield wrap below; just mark, actual wrap is hookMove
    updatePlayer._m21cBob = 1;
  }

  // ---------- sprint / shield hold-to-toggle + bob scale (one updatePlayer wrap) ----------
  function hookMove() {
    if (typeof updatePlayer !== 'function' || updatePlayer._m21cMove) return;
    const _up = updatePlayer;
    updatePlayer = function (dt) {
      let restL, restR, restL2, restRun;
      try {
        const mode = M.sprintMode();
        const shTog = M.shieldToggle();
        const downS = !!(K.ShiftLeft || K.ShiftRight);
        if (mode === 2) {
          if (downS && !M._sWas) { M.sprintLatch = !M.sprintLatch; M.n.sprint++; }
          M._sWas = downS;
          if (M.sprintLatch) { restL = K.ShiftLeft; K.ShiftLeft = true; }
        } else if (mode === 0 || mode === 1) {
          M.sprintLatch = false;
        }
        if (typeof PAD !== 'undefined' && PAD.connected) {
          restRun = PAD.run;
          if (mode === 1) { // force hold: L3 must stay down
            PAD.run = !!PAD._l3;
          } else if (mode === 2) {
            // pad L3 already toggles PAD.run in pollPad; leave it
          }
        }
        if (shTog) {
          const held = !!( (typeof MB !== 'undefined' && MB[2]) || K.KeyK || (typeof PAD !== 'undefined' && PAD.l2) || K.KeyF || K.KeyC || K.KeyL || (typeof MB !== 'undefined' && MB[1]) );
          if (held && !M._shWas) { M.shieldLatch = !M.shieldLatch; M.n.shield++; }
          M._shWas = held;
          if (P.off !== 'shield') M.shieldLatch = false;
          if (M.shieldLatch && P.off === 'shield') {
            if (typeof PAD !== 'undefined') { restL2 = PAD.l2; PAD.l2 = true; }
          }
        }
      } catch (e) { fail('move-pre', e); }
      const r = _up.apply(this, arguments);
      try {
        if (restL !== undefined) K.ShiftLeft = restL;
        if (restR !== undefined) K.ShiftRight = restR;
        if (restL2 !== undefined && typeof PAD !== 'undefined') PAD.l2 = restL2;
        if (restRun !== undefined && M.sprintMode() === 1 && typeof PAD !== 'undefined') { /* already applied */ }
        const bk = M.bobK();
        if (bk < 1 && P && typeof P.bobAmt === 'number') { P.bobAmt *= bk; M.n.bob++; }
      } catch (e) { fail('move-post', e); }
      return r;
    };
    updatePlayer._m21cMove = 1;
    if (typeof pollPad === 'function' && !pollPad._m21c) {
      const _pp = pollPad;
      pollPad = function (rdt) {
        const r = _pp.apply(this, arguments);
        try {
          if (typeof PAD !== 'undefined' && PAD.connected) {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            const g = pads[PAD.idx] || pads[0];
            const ri = (typeof padBind==='function') ? padBind('run',10) : 10; PAD._l3 = !!(g && g.buttons && g.buttons[ri] && g.buttons[ri].pressed);
            if (M.sprintMode() === 1) PAD.run = !!PAD._l3;
          }
        } catch (e) { fail('pad', e); }
        return r;
      };
      pollPad._m21c = 1;
    }
  }

  // ---------- subtitles / dialogue ----------
  function isDlg(t1, t2) {
    if (t1 && t1[0] === '"') return true;
    if (t2 && t2[0] === '"') return true;
    if (t1 && typeof t1 === 'object' && t1.dlg) return true;
    return false;
  }
  function hookSubs() {
    if (typeof toast !== 'function' || toast._m21c) return;
    const _toast = toast;
    toast = function (t1, t2, col, dur) {
      try {
        if (!M.subsOn() && isDlg(t1, t2)) { M.n.subHid++; return; }
      } catch (e) { fail('toast', e); }
      return _toast.apply(this, arguments);
    };
    toast._m21c = 1;
  }

  // ---------- colour-blind outlines (HUD markers; Wong-safe hues) ----------
  const PCOL = {
    vial: '#D55E00', mana: '#0072B2', rose: '#56B4E9', key: '#F0E442', shards: '#F0E442',
    cache: '#E69F00', reliq: '#CC79A7', spoils: '#CC79A7', m11wrath: '#E69F00',
    m11shrine: '#CC79A7', m10soul: '#0072B2', m13sigil: '#56B4E9', m13candle: '#F0E442'
  };
  function pcol(t) { return PCOL[t] || '#F0E442'; }
  function diamond(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function tri(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); ctx.closePath();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function drawOutlines(ctx, cam) {
    if (typeof project !== 'function' || !cam) return;
    let n = 0;
    const py = H - Math.ceil(40 * M.hudK()) - 4;
    if (G.pickups) for (const p of G.pickups) {
      if (p.taken) continue;
      const d = Math.hypot(p.x - P.x, p.y - P.y); if (d > 14) continue;
      const pr = project(cam, p.x, p.y, (p.z || 0) + 0.35); if (!pr || pr.y > py || pr.y < 8) continue;
      const a = d < 6 ? 1 : Math.max(0, 1 - (d - 6) / 8); if (a <= 0.05) continue;
      ctx.globalAlpha = a;
      diamond(ctx, pr.x, pr.y, 4 + (d < 3 ? 1 : 0), pcol(p.type));
      n++;
    }
    if (G.enemies) for (const e of G.enemies) {
      if (!e.alive || e.hidden) continue;
      const d = Math.hypot(e.x - P.x, e.y - P.y); if (d > 12) continue;
      const pr = project(cam, e.x, e.y, (e.z || 0) + (e.h || 1) + 0.2); if (!pr || pr.y > py || pr.y < 8) continue;
      const a = d < 7 ? 1 : Math.max(0, 1 - (d - 7) / 5); if (a <= 0.05) continue;
      ctx.globalAlpha = a;
      const col = e.d && e.d.boss ? '#FFFFFF' : (e.elite ? '#F0E442' : '#E69F00');
      tri(ctx, pr.x, pr.y, e.d && e.d.boss ? 6 : 4, col);
      n++;
    }
    ctx.globalAlpha = 1;
    if (n) M.n.marks = n;
  }

  function hookAll() {
    try { hookOpt(); } catch (e) { fail('opt-h', e); }
    try { hookText(); } catch (e) { fail('text', e); }
    try { hookHud(); } catch (e) { fail('hud-h', e); }
    try { hookMove(); } catch (e) { fail('move', e); }
    try { hookBob(); } catch (e) { fail('bob', e); }
    try { hookSubs(); } catch (e) { fail('subs', e); }
    M.ready = 1;
  }
  hookAll();
  // OPT may load in the same tick; retry once
  setTimeout(function () { try { hookOpt(); hookHud(); hookMove(); hookText(); hookSubs(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
