// ===== m21r: seed box. Type a run seed on the title, then the chapel gate (or newRun) uses it.
// Default path is still a random seed. Does not bring Daily Descent back.
// Kill: ?m21r=0 / ?m21=0 | ?seedbox=0
// URL: ?runseed=123456789 arms a seed for the next new run.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21r') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21R = {
    on: !off, seedbox: on('seedbox'),
    pending: null, last: null, buf: '', open: false,
    n: { arm: 0, run: 0, open: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  function clampSeed(v) {
    const n = (v >>> 0);
    if (!n) return 1;
    return n % 1000000000; // 1..999999999, same range as newRun
  }
  M.parse = function (s) {
    if (s == null) return null;
    const t = String(s).replace(/\s+/g, '');
    if (!t) return null;
    if (!/^\d{1,9}$/.test(t)) return null;
    return clampSeed(parseInt(t, 10));
  };
  M.arm = function (v) {
    if (!M.seedbox) return null;
    if (v == null || v === '') { M.pending = null; return null; }
    const n = typeof v === 'number' ? clampSeed(v) : M.parse(v);
    M.pending = n;
    if (n != null) M.n.arm++;
    return n;
  };
  M.fmt = function (v) { return (v == null) ? 'RANDOM' : String(clampSeed(v)); };
  M.st = () => ({
    on: M.on, seedbox: M.seedbox, pending: M.pending, last: M.last, open: M.open, buf: M.buf,
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  const qs = Q.get('runseed');
  if (qs != null && qs !== '') { const n = M.parse(qs); if (n != null) M.pending = n; }

  function hookMenu() {
    if (!window.M12 || !M12.MENU || M12.MENU._m21r) return;
    if (!M12.MENU.some(m => m && m.id === 'seed')) {
      const i = M12.MENU.findIndex(m => m && m.id === 'play');
      const row = { id: 'seed', l: 'ENTER SEED' };
      if (i >= 0) M12.MENU.splice(i + 1, 0, row); else M12.MENU.splice(Math.max(0, M12.MENU.length - 1), 0, row);
    }
    const _act = M12.menuAct;
    M12.menuAct = function (id) {
      if (id === 'seed' && M.seedbox) { M.openBox(); return; }
      return _act ? _act.apply(this, arguments) : undefined;
    };
    M12.MENU._m21r = 1;
  }
  function relabel() {
    if (!window.M12 || !M12.MENU) return;
    const row = M12.MENU.find(m => m && m.id === 'seed');
    if (row) row.l = M.pending != null ? ('SEED  ' + M.fmt(M.pending)) : 'ENTER SEED';
  }
  M.openBox = function () {
    if (!M.seedbox) return;
    M.open = true; M.buf = M.pending != null ? String(M.pending) : '';
    M.n.open++;
  };
  M.closeBox = function (apply) {
    if (apply) {
      const n = M.parse(M.buf);
      M.pending = n;
      if (n != null) M.n.arm++;
    }
    M.open = false;
    relabel();
  };

  function hookRun() {
    if (typeof newRun !== 'function' || newRun._m21r) return;
    const _nr = newRun;
    newRun = function () {
      const want = (M.seedbox && M.pending != null) ? clampSeed(M.pending) : null;
      const _ng = newGame;
      if (want != null && typeof newGame === 'function') {
        newGame = function () {
          try { RUN.seed = want; } catch (e) { fail('seed', e); }
          return _ng.apply(this, arguments);
        };
      }
      try {
        const r = _nr.apply(this, arguments);
        if (want != null) { M.last = want; M.pending = null; M.n.run++; relabel(); }
        return r;
      } finally { newGame = _ng; }
    };
    newRun._m21r = 1;
  }

  function hookTitle() {
    if (typeof drawTitle !== 'function' || drawTitle._m21r) return;
    const _dt = drawTitle;
    drawTitle = function (ctx) {
      relabel();
      const r = _dt.apply(this, arguments);
      if (!M.seedbox || !M.open || !ctx) return r;
      try {
        const W_ = (typeof hud !== 'undefined' && hud.width) ? hud.width : 480;
        const H_ = (typeof hud !== 'undefined' && hud.height) ? hud.height : 270;
        const bw = 248, bh = 100, bx = ((W_ - bw) / 2) | 0, by = 80;
        ctx.save();
        ctx.fillStyle = 'rgba(8,0,16,0.72)'; ctx.fillRect(0, 0, W_, H_);
        if (typeof goldFrame === 'function') goldFrame(ctx, bx, by, bw, bh, '#c060ff');
        else { ctx.strokeStyle = '#c060ff'; ctx.strokeRect(bx, by, bw, bh); }
        if (typeof text === 'function') {
          text(ctx, 'RUN SEED', W_ / 2, by + 8, '#ffe080', 'center', 2);
          const shown = (M.buf || '') + ((G.t % 0.8 < 0.4) ? '_' : ' ');
          text(ctx, shown.trim() ? shown : 'RANDOM', W_ / 2, by + 38, '#ffffff', 'center');
          const pad = G.inputMode === 'pad';
          text(ctx, 'TYPE A NUMBER', W_ / 2, by + 62, '#c8b8e0', 'center');
          text(ctx, pad ? 'CROSS SET   CIRCLE BACK' : 'ENTER SET   ESC BACK', W_ / 2, by + 76, '#c8b8e0', 'center');
        }
        ctx.restore();
      } catch (e) { fail('draw', e); }
      return r;
    };
    drawTitle._m21r = 1;
  }

  function hookInput() {
    if (typeof frameInner !== 'function' || frameInner._m21r) return;
    const _fi = frameInner;
    frameInner = function () {
      try {
        if (M.open && M.seedbox && G && G.state === 'title') {
          for (let d = 0; d <= 9; d++) {
            if (KP['Digit' + d] || KP['Numpad' + d]) {
              if ((M.buf || '').length < 9) M.buf = (M.buf || '') + String(d);
              delete KP['Digit' + d]; delete KP['Numpad' + d];
            }
          }
          if (KP.Backspace) { M.buf = (M.buf || '').slice(0, -1); delete KP.Backspace; }
          if (KP.Enter || KP.Space || KP.PadOK) { M.closeBox(true); delete KP.Enter; delete KP.Space; delete KP.PadOK; delete KP.PadStart; }
          else if (KP.Escape || KP.PadBack) { M.closeBox(false); delete KP.Escape; delete KP.PadBack; delete KP.Backspace; }
          // swallow leftover menu keys while the box is open
          for (const k of ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'PadStart']) delete KP[k];
          MBP[0] = false;
        }
      } catch (e) { fail('in', e); }
      return _fi.apply(this, arguments);
    };
    frameInner._m21r = 1;
  }

  function hookResults() {
    if (typeof M8DRAW === 'undefined' || M.m8) return;
    M8DRAW.push(function (ctx) {
      try {
        if (!M.seedbox || !G || G.state !== 'results' || !RUN) return false;
        const pw = 98, rx = ((typeof hud !== 'undefined' && hud.width) ? hud.width : 480) - 6 - pw, py = 46;
        const s = String((RUN.seed >>> 0) % 1000000000);
        ctx.fillStyle = 'rgba(16,0,28,0.9)'; ctx.fillRect(rx + 4, py + 132, pw - 8, 12);
        if (typeof text === 'function') text(ctx, s, rx + pw / 2, py + 136, '#c8b8e0', 'center');
        return true;
      } catch (e) { return false; }
    });
    M.m8 = 1;
  }

  function hookHub() {
    if (!M.seedbox || typeof M8DRAW === 'undefined' || M.hubm8) return;
    M8DRAW.push(function (ctx) {
      try {
        if (M.pending == null || !G || G.state !== 'play' || !RUN || !RUN.hub) return false;
        const W_ = (typeof hud !== 'undefined' && hud.width) ? hud.width : 480;
        if (typeof text === 'function') text(ctx, 'SEED  ' + M.fmt(M.pending), W_ / 2, 18, '#c8b8e0', 'center');
        return true;
      } catch (e) { return false; }
    });
    M.hubm8 = 1;
  }

  function hookAll() {
    try { hookMenu(); relabel(); } catch (e) { fail('menu', e); }
    try { hookRun(); } catch (e) { fail('run', e); }
    try { hookTitle(); } catch (e) { fail('title', e); }
    try { hookInput(); } catch (e) { fail('input', e); }
    try { hookResults(); } catch (e) { fail('res', e); }
    try { hookHub(); } catch (e) { fail('hub', e); }
    M.ready = 1;
  }
  hookAll();
  setTimeout(hookAll, 0);
  setTimeout(hookAll, 900);
})();
