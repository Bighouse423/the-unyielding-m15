// m12f: (1) story panels redrawn at sprite-art quality (assets/m12/story/*.jpg) over the m10c procedural ones,
// (2) DAILY DESCENT - one seeded run per calendar day, Baron difficulty, same stages/foes/drops for everyone,
// (3) RUN HISTORY - the last 20 runs (local), (4) the last synth SFX routed to ElevenLabs one-shots (audio/sfx/m12_*).
// ?m12=0 never loads this file.
(function () {
  if (!window.M12 || !M12.on) return;
  const F = M12.F = { imgs: {}, hist: false, histTop: 0 };
  // ---------- 1) story panels ----------
  const KEYS = ['castle', 'm10_reliq', 'eyes', 'm10_banner', 'm10_pyre', 'kael', 'm10_stair', 'crown', 'm10_lichfall', 'dawn', 'm10_candles', 'm10_shadow', 'kael_end'];
  for (const k of KEYS) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = 'assets/m12/story/' + k + '.jpg'; F.imgs[k] = im; }
  const _sd = M9.sceneDraw;
  M9.sceneDraw = function (ctx) {
    _sd.apply(this, arguments);
    try {
      const UI = M9.ui, pn = UI.scene && UI.scene[UI.p]; if (!pn) return;
      const key = pn.art === 'kael' && UI.sid === 'ending' ? 'kael_end' : pn.art, im = F.imgs[key];
      if (!im || !im.ok) return;
      const t = UI.t || 0, X = 20, Y = 14, PW = W - 40, PH = 186;
      // slow push-in + drift (Ken Burns), alternating direction per panel
      const z = 1 + Math.min(1, t / 14) * 0.07, dir = (UI.p & 1) ? 1 : -1;
      const sw = im.width / z, sh = im.height / z, sx = (im.width - sw) * (0.5 + dir * 0.5 * Math.min(1, t / 14)), sy = (im.height - sh) * 0.5;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, sx, sy, sw, sh, X, Y, PW, PH);
      // candle flicker + vignette
      const fl = 0.06 + 0.04 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
      ctx.fillStyle = `rgba(0,0,0,${fl.toFixed(3)})`; ctx.fillRect(X, Y, PW, PH);
      const g = ctx.createRadialGradient(W / 2, Y + PH / 2, PH * 0.45, W / 2, Y + PH / 2, PW * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g; ctx.fillRect(X, Y, PW, PH);
      ctx.restore();
      ctx.fillStyle = '#e0b850'; ctx.fillRect(X, Y - 1, PW, 1); ctx.fillRect(X, 200, PW, 1);
      const k = Math.min(1, t * 2); ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(X, Y, PW, PH);
    } catch (e) { M12.err = String(e); }
  };

  // ---------- 4) ElevenLabs one-shots for the last synth names ----------
  if (typeof SFX !== 'undefined' && SFX.play) {
    const _pl = SFX.play;
    SFX.play = function (name, vol) {
      try {
        const m = 'm12_' + name;
        if (typeof name === 'string' && this.buf && this.buf[m] && !this.buf[name]) {
          if (this.hushT && this.ctx && this.hushT[name] > this.ctx.currentTime) return;
          arguments[0] = m; return _pl.apply(this, arguments);
        }
      } catch (e) { }
      return _pl.apply(this, arguments);
    };
  }

  // ---------- 3) run history ----------
  const HK = 'tu_m12_hist';
  const loadH = () => { try { return JSON.parse(localStorage.getItem(HK) || '[]') || []; } catch (e) { return []; } };
  const saveH = h => { try { localStorage.setItem(HK, JSON.stringify(h.slice(0, 20))); } catch (e) { } };
  M12.history = loadH;
  function record(won) {
    if (!RUN.on || RUN.hub || RUN.m12rec || (M12.T && M12.T.on)) return;
    RUN.m12rec = true;
    const md = M12.mode ? M12.mode() : { l: 'BARON' };
    const e = { d: Date.now(), st: RUN.stage | 0, won: !!won, ab: RUN.cfg && RUN.cfg.abyss ? RUN.cfg.abyss | 0 : 0, k: (RUN.kills | 0) + (G.kills | 0), tm: ((RUN.time || 0) + (G.time || 0)) | 0, md: md.l, dy: RUN.m12daily || '', w: (window.P && P.weapon) || '' };
    const h = loadH(); h.unshift(e); saveH(h); F.last = e;
  }
  if (typeof startResults === 'function') { const _sr = startResults; startResults = function () { try { record(!!RUN.won); } catch (e) { } return _sr.apply(this, arguments); }; }
  if (typeof startWin === 'function') { const _sw = startWin; startWin = function () { try { record(true); } catch (e) { } return _sw.apply(this, arguments); }; }
  const _nr = newRun;
  newRun = function () { const r = _nr.apply(this, arguments); RUN.m12rec = false; return r; };

  // ---------- 2) daily descent ----------
  const D = M12.D = { on: false, key: '', seed: 0, orig: null };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function endDaily() { if (D.orig) Math.random = D.orig; D.orig = null; D.on = false; }
  M12.startDaily = function () {
    endDaily();
    D.key = dayKey(); D.seed = fnv('UNYIELDING:' + D.key); D.on = true; D.rc = 0;
    const r = mulberry(D.seed); D.orig = Math.random; Math.random = r;
    const S = window.OPT ? OPT.S : {}, keep = S.m12diff; S.m12diff = 1;     // everyone plays the same day on BARON
    try { newRun(); } finally { S.m12diff = keep; }
    RUN.m12daily = D.key; RUN.m12diff = 1;
    const k0 = D.key; setTimeout(() => { try { if (RUN.m12daily === k0 && G.state === 'play') toast('DAILY DESCENT', k0 + '  -  same descent for everyone today', '#ffe080'); } catch (e) { } }, 4200);
  };
  // every stage (layout, foes, champions) and every boon offer is reseeded from the day key, so combat RNG drift between
  // players never changes what the next floor or the next choice is
  const _ns = nextStage;
  nextStage = function () {
    if (D.on && D.orig) Math.random = mulberry(fnv('UNYIELDING:' + D.key + ':st' + ((RUN.stage | 0) + 1) + ':' + (RUN.cfg && RUN.cfg.abyss | 0)));
    return _ns.apply(this, arguments);
  };
  if (typeof rollChoices === 'function') {
    const _rc = rollChoices;
    rollChoices = function () {
      if (!(D.on && D.orig)) return _rc.apply(this, arguments);
      const keep = Math.random; D.rc = (D.rc || 0) + 1; Math.random = mulberry(fnv('UNYIELDING:' + D.key + ':rc' + (RUN.stage | 0) + ':' + D.rc));
      try { return _rc.apply(this, arguments); } finally { Math.random = keep; }
    };
  }
  // leaving the run (title / new run from results / chapel) ends the seeded stream
  const _fi = frameInner;
  frameInner = function (now) {
    try {
      if (D.on && (G.state === 'title' || (RUN.hub && !RUN.m12daily) || !RUN.m12daily)) endDaily();
      if (D.on && RUN.hub) { endDaily(); RUN.m12daily = ''; }
      if (F.hist && G.state === 'title') {
        const h = loadH(), n = Math.max(0, h.length - 8);
        if (KP.ArrowUp || KP.KeyW) F.histTop = Math.max(0, F.histTop - 1);
        if (KP.ArrowDown || KP.KeyS) F.histTop = Math.min(n, F.histTop + 1);
        if (KP.Escape || KP.Enter || KP.Space || KP.PadBack || KP.PadOK || KP.Backspace || MBP[0]) F.hist = false;
        for (const k of ['Enter', 'Space', 'PadOK', 'PadStart', 'Escape', 'PadBack', 'PadY', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Backspace', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']) delete KP[k]; MBP[0] = false;
        if (M12.TM) M12.TM.hide = F.hist;
      } else if (M12.TM && M12.TM.hide && !F.hist && !(M12.G && M12.G.slots)) M12.TM.hide = false;
    } catch (e) { M12.err = String(e); }
    return _fi.apply(this, arguments);
  };
  // resultsInput "again" from a daily run starts a normal run (the seeded stream is gone); results show the tag
  const fmt = s => { s = s | 0; return ((s / 60) | 0) + ':' + pad(s % 60); };
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (G.state === 'results' && RUN.m12daily) { text(ctx, 'DAILY DESCENT  ' + RUN.m12daily, W / 2, 258, '#ffe080', 'center'); return true; }
    if (!(F.hist && G.state === 'title')) return false;
    const h = loadH();
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(8,2,14,0.95)'; ctx.fillRect(40, 18, 400, 234); ctx.fillStyle = '#e0b850'; ctx.fillRect(40, 18, 400, 1); ctx.fillRect(40, 251, 400, 1);
    text(ctx, 'RUN HISTORY', W / 2, 26, '#ffe080', 'center');
    if (!h.length) { text(ctx, 'No runs yet. The descent remembers.', W / 2, 110, '#c0b0d0', 'center'); }
    else {
      const today = dayKey(), dly = h.filter(e => e.dy === today);
      const best = dly.length ? dly.reduce((a, b) => (b.won ? 99 : b.st) > (a.won ? 99 : a.st) ? b : a) : null;
      text(ctx, 'TODAY\'S DAILY: ' + (best ? (best.won ? 'VICTORY' : 'STAGE ' + best.st) + '  (' + dly.length + ' tr' + (dly.length > 1 ? 'ies' : 'y') + ')' : 'not attempted'), W / 2, 40, '#c0a0ff', 'center');
      text(ctx, 'WHEN', 48, 56, '#806090'); text(ctx, 'RESULT', 150, 56, '#806090'); text(ctx, 'MODE', 250, 56, '#806090'); text(ctx, 'KILLS', 330, 56, '#806090'); text(ctx, 'TIME', 386, 56, '#806090');
      let y = 70;
      for (const e of h.slice(F.histTop, F.histTop + 8)) {
        const d = new Date(e.d), when = pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        const res = e.won ? (e.ab ? 'ABYSS ' + e.ab : 'VICTORY') : (e.ab ? 'ABYSS ' + e.ab : 'STAGE ' + e.st);
        text(ctx, when, 48, y, '#d0c0e0'); text(ctx, res, 150, y, e.won ? '#a0ffb0' : '#ffb0a0'); text(ctx, (e.md || '') + (e.dy ? ' D' : ''), 250, y, e.dy ? '#ffe080' : '#c0a0ff');
        text(ctx, String(e.k), 330, y, '#d0c0e0'); text(ctx, fmt(e.tm), 386, y, '#d0c0e0'); y += 20;
      }
    }
    text(ctx, (h.length > 8 ? 'UP/DOWN scroll   ' : '') + 'ESC / ENTER back', W / 2, 238, '#a090b0', 'center');
    return true;
  });
  if (M12.MENU) {
    if (!M12.MENU.some(m => m.id === 'daily')) M12.MENU.splice(1, 0, { id: 'daily', l: 'DAILY DESCENT' });
    const qi = M12.MENU.findIndex(m => m.id === 'ctrl');
    if (!M12.MENU.some(m => m.id === 'hist')) M12.MENU.splice(qi >= 0 ? qi : M12.MENU.length - 1, 0, { id: 'hist', l: 'RUN HISTORY' });
    if (M12.TM) { M12.TM.rh = 10; M12.TM.y0 = 160; }
  }
  const _act = M12.menuAct;
  M12.menuAct = function (id) {
    if (id === 'daily') { M12.startDaily(); return; }
    if (id === 'hist') { F.hist = true; F.histTop = 0; if (M12.TM) M12.TM.hide = true; return; }
    if (_act) _act(id);
  };
  M12.vf = 'm12f';
})();
