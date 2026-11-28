// ===== m21w: opt-in preview pack (default OFF, zero change without flags) =====
// Hit-stop, style rank, input buffer, assist sliders, Daily Descent, mutators, Ascension.
// Flags: ?try_hitstop=1 ?try_style=1 ?try_buffer=1 ?try_assist=1 ?try_daily=1
//        ?try_mutators=1 ?try_ascension=1   plus  ?tryall=1  (all on).
// A lone ?try_*=0 wins over tryall. Master kill: ?m21w=0 | ?m21=0 | ?try=0
// Preview saves use tub_m21w_try: (see m21wpre.js / m20ipub.js). Never touches
// the buddy namespace, base BARON, bosses' HP/patterns, vials, or prices.
// Every hook is a wrap; game.js is not edited in place.
(function () {
  const Q = location.search || '';
  const off = /[?&](m21w|m21|try)=0/.test(Q);
  const tryall = !off && /[?&]tryall=1/.test(Q);
  const fl = n => !off && (tryall || new RegExp('[?&]try_' + n + '=1').test(Q)) && !new RegExp('[?&]try_' + n + '=0').test(Q);
  const F = {
    hitstop: fl('hitstop'), style: fl('style'), buffer: fl('buffer'),
    assist: fl('assist'), daily: fl('daily'), mutators: fl('mutators'),
    ascension: fl('ascension')
  };
  const any = F.hitstop || F.style || F.buffer || F.assist || F.daily || F.mutators || F.ascension;
  const S = (window.OPT && OPT.S) || {};
  const taken0 = () => { const v = (S.m21wtaken | 0); return v ? Math.max(50, Math.min(100, v)) / 100 : 1; };
  const deal0 = () => { const v = (S.m21wdeal | 0); return v ? Math.max(100, Math.min(150, v)) / 100 : 1; };
  const asc0 = () => Math.max(0, Math.min(5, S.m21wasc | 0));
  const mut0 = () => {
    const m = S.m21wmut && typeof S.m21wmut === 'object' ? S.m21wmut : {};
    return { glass: !!m.glass, shroud: !!m.shroud, crowd: !!m.crowd, gloom: !!m.gloom };
  };
  const M = window.M21W = {
    on: any, F, taken: taken0(), deal: deal0(), ascLv: asc0(), mut: mut0(),
    want: '', wantT: 0, pts: 0, idle: 0, rank: 'D', flash: 0, flashL: '', room: 0,
    mutOpen: false, mutSel: 0, lastAlive: 0, n: { buf: 0, hit: 0, style: 0, crowd: 0, daily: 0 },
    err: [], ns: (window.M21WNS && M21WNS.ns) || (window.M20IPUB && M20IPUB.ns) || null
  };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ':' + (e && e.message || e)); };
  const RANKS = [
    { id: 'D', at: 0, col: '#908890' },
    { id: 'C', at: 12, col: '#c0d0e0' },
    { id: 'B', at: 28, col: '#80d0ff' },
    { id: 'A', at: 50, col: '#ffe080' },
    { id: 'S', at: 80, col: '#ffb040' },
    { id: 'SS', at: 120, col: '#ff60c0' }
  ];
  function rankOf(p) { let r = RANKS[0]; for (const x of RANKS) if (p >= x.at) r = x; return r; }
  function styleAdd(p, label) {
    if (!M.on || !F.style || !RUN || !RUN.on || RUN.hub) return;
    M.pts = Math.max(0, M.pts + p); M.idle = 0; M.rank = rankOf(M.pts).id; M.n.style++;
    if (label && p > 0) { M.flash = 0.7; M.flashL = label; }
  }
  function keepFlags(dst, src) {
    if (!src) return dst;
    try { Object.keys(src).forEach(k => { if (k[0] === '_') dst[k] = src[k]; }); } catch (e) { }
    return dst;
  }
  function wrap(name, fn) {
    try {
      const src = (typeof window[name] === 'function') ? window[name] : (typeof eval('typeof ' + name + '==="function"? ' + name + ':null') === 'function' ? eval(name) : null);
      if (typeof src !== 'function') return null;
      const out = fn(src);
      keepFlags(out, src);
      // assign back to the binding the game uses
      try { eval(name + ' = out'); } catch (e) { window[name] = out; }
      return src;
    } catch (e) { fail('wrap-' + name, e); return null; }
  }

  // Use direct assignment for known globals (eval keeps the lexical binding in game.js IIFE-less files)
  function hook(name, wrapper) {
    try {
      const src = typeof window[name] === 'function' ? window[name] : (new Function('return typeof ' + name + '==="function"? ' + name + ':null'))();
      if (typeof src !== 'function') return;
      const out = wrapper(src);
      keepFlags(out, src);
      try { (new Function('f', name + ' = f'))(out); } catch (e) { window[name] = out; }
    } catch (e) { fail('hook-' + name, e); }
  }

  function liveTaken() { return (RUN && RUN.on && RUN.m21wtaken != null) ? RUN.m21wtaken : M.taken; }
  function liveDeal() { return (RUN && RUN.on && RUN.m21wdeal != null) ? RUN.m21wdeal : M.deal; }
  function liveAsc() { return (RUN && RUN.on && RUN.m21wasc != null) ? (RUN.m21wasc | 0) : M.ascLv; }
  function liveMut() { return (RUN && RUN.on && RUN.m21wmut) ? RUN.m21wmut : M.mut; }
  function mutOn() { return M.on && F.mutators && liveMut(); }
  function sealed() { try { const g = typeof LEVEL !== 'undefined' && LEVEL && LEVEL.doors && LEVEL.doors.gate; return !!(g && g.state === 'sealed'); } catch (e) { return false; } }
  function inArena(e) { try { const A = LEVEL && LEVEL.arena; return !!(A && e.x > A.x0 - 1 && e.x < A.x1 + 1 && e.y > A.y0 - 1 && e.y < A.y1 + 1); } catch (e) { return false; } }
  function bossOn() { try { return sealed() || !!(G.boss && G.boss.alive && G.boss.awake && !G.boss.hidden); } catch (e) { return false; } }

  // ---------- Daily Descent restored only under our flag (m20i keeps stripping ?daily=1-less menus) ----------
  function restoreDaily() {
    if (!F.daily || !window.M12 || !M12.MENU) return;
    try { if (window.M20I) M20I.noDaily = false; } catch (e) { }
    if (!M12.MENU.some(m => m.id === 'daily')) {
      M12.MENU.splice(1, 0, { id: 'daily', l: 'DAILY DESCENT' });
      M.n.daily++;
    }
  }

  // ---------- Mutator + preview title chrome ----------
  function restoreMenu() {
    if (!window.M12 || !M12.MENU) return;
    restoreDaily();
    // Mutators stay in Settings (PREVIEWS) so the title list does not clip QUIT.
  }

  if (any) {
    hook('drawTitle', function (_dt) {
      return function (ctx) {
        const r = _dt.apply(this, arguments);
        try {
          text(ctx, 'PREVIEW SAVE', 6, 16, '#ffe080', 'left');
          const keys = Object.keys(F).filter(k => F[k]);
          if (keys.length === 1) text(ctx, keys[0].toUpperCase(), 6, 28, '#c0a060', 'left');
          else if (keys.length) text(ctx, 'ALL ON', 6, 28, '#c0a060', 'left');
          if (M.mutOpen) drawMutPanel(ctx);
        } catch (e) { fail('title', e); }
        return r;
      };
    });
    try {
      if (window.M12 && M12.menuAct) {
        const _act = M12.menuAct;
        M12.menuAct = function (id) {
          if (id === 'trymut' && F.mutators) { M.mutOpen = !M.mutOpen; return; }
          if (id === 'daily' && F.daily && M12.startDaily) { M12.startDaily(); return; }
          return _act.apply(this, arguments);
        };
      }
    } catch (e) { fail('menuAct', e); }
    restoreMenu();
    [0, 50, 200, 800, 2000, 5000].forEach(t => setTimeout(() => { try { restoreMenu(); } catch (e) { } }, t));
  }

  const MUTL = [
    { k: 'glass', l: 'GLASS CANNON', d: 'Take 1.6x  /  deal 1.3x' },
    { k: 'shroud', l: 'SHROUD', d: 'No minimap. Trust your eyes.' },
    { k: 'crowd', l: 'CROWDED', d: 'A few more regulars in each room.' },
    { k: 'gloom', l: 'GLOOM', d: 'The halls run darker.' }
  ];
  function saveMut() {
    if (!window.OPT) return;
    OPT.S.m21wmut = { glass: !!M.mut.glass, shroud: !!M.mut.shroud, crowd: !!M.mut.crowd, gloom: !!M.mut.gloom };
    try { OPT.save(); } catch (e) { }
  }
  function drawMutPanel(ctx) {
    const x = W / 2, y0 = 86;
    ctx.save();
    ctx.fillStyle = 'rgba(8,4,14,0.82)'; ctx.fillRect(x - 150, y0 - 16, 300, 148);
    ctx.strokeStyle = '#8a6a20'; ctx.strokeRect(x - 150.5, y0 - 16.5, 301, 149);
    text(ctx, 'MUTATORS  (preview)', x, y0, '#ffe080', 'center');
    MUTL.forEach((m, i) => {
      const on = !!M.mut[m.k];
      const sel = i === M.mutSel;
      const col = sel ? '#ffffff' : (on ? '#d0c080' : '#9080a0');
      text(ctx, (sel ? '> ' : '  ') + m.l + (on ? '  ON' : '  off'), x, y0 + 22 + i * 22, col, 'center');
    });
    text(ctx, 'UP/DOWN  ENTER toggle  ESC close', x, y0 + 118, '#807090', 'center');
    ctx.restore();
  }

  // ---------- Settings rows (only when the matching flag is on) ----------
  if (any && window.OPT) {
    try {
      const _rows = OPT.rows;
      OPT.rows = function () {
        const L = _rows.apply(this, arguments);
        try {
          if (this.page === 'main') {
            const extra = [];
            extra.push({ t: 'hdr', l: 'PREVIEWS' });
            if (F.assist) {
              extra.push({ t: 'opt', id: 'm21wtaken', l: 'ASSIST TAKEN', v: () => Math.round(M.taken * 100) + '%' });
              extra.push({ t: 'opt', id: 'm21wdeal', l: 'ASSIST DEALT', v: () => Math.round(M.deal * 100) + '%' });
            }
            if (F.ascension) extra.push({ t: 'opt', id: 'm21wasc', l: 'ASCENSION', v: () => (M.ascLv ? ('A' + M.ascLv) : 'OFF') + (RUN && RUN.on && (RUN.m21wasc | 0) !== M.ascLv ? ' (next run)' : '') });
            if (F.mutators) MUTL.forEach(m => extra.push({ t: 'opt', id: 'm21wmut_' + m.k, l: m.l, v: () => M.mut[m.k] ? 'ON' : 'off' }));
            if (extra.length > 1) L.push.apply(L, extra);
          }
        } catch (e) { fail('rows', e); }
        return L;
      };
      keepFlags(OPT.rows, _rows);
      const _in = OPT.input;
      OPT.input = function () {
        try {
          if (this.page === 'main' && !this.cap) {
            const r = this.rows()[this.sel];
            const d = (KP.ArrowLeft || KP.KeyA) ? -1 : (KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK) ? 1 : 0;
            if (d && r && r.id === 'm21wtaken') {
              const cur = Math.round(M.taken * 100);
              const next = Math.max(50, Math.min(100, cur + d * 10));
              M.taken = next / 100; OPT.S.m21wtaken = next; OPT.save();
            } else if (d && r && r.id === 'm21wdeal') {
              const cur = Math.round(M.deal * 100);
              const steps = [100, 110, 125, 150];
              let i = steps.indexOf(cur); if (i < 0) i = 0;
              i = (i + d + steps.length) % steps.length;
              M.deal = steps[i] / 100; OPT.S.m21wdeal = steps[i]; OPT.save();
            } else if (d && r && r.id === 'm21wasc') {
              M.ascLv = (M.ascLv + d + 6) % 6; OPT.S.m21wasc = M.ascLv; OPT.save();
            } else if (d && r && r.id && r.id.indexOf('m21wmut_') === 0) {
              const k = r.id.slice(8); M.mut[k] = !M.mut[k]; saveMut();
            }
          }
        } catch (e) { fail('input', e); }
        return _in.apply(this, arguments);
      };
      keepFlags(OPT.input, _in);
    } catch (e) { fail('opt', e); }
  }

  // ---------- Lock preview choices at run start ----------
  hook('newRun', function (_nr) {
    return function () {
      if (M.on) {
        try {
          RUN.m21wtaken = M.taken; RUN.m21wdeal = M.deal; RUN.m21wasc = M.ascLv;
          RUN.m21wmut = { glass: !!M.mut.glass, shroud: !!M.mut.shroud, crowd: !!M.mut.crowd, gloom: !!M.mut.gloom };
        } catch (e) { fail('newRun', e); }
      }
      return _nr.apply(this, arguments);
    };
  });

  // ---------- Hit-stop + style + assist dealt (damageEnemy wrap) ----------
  hook('damageEnemy', function (_de) {
    return function (e, dmg, o) {
      o = o || {};
      try {
        if (M.on && F.assist) { const k = liveDeal(); if (k !== 1 && typeof dmg === 'number') dmg = dmg * k; }
        if (M.on && F.mutators && liveMut().glass && typeof dmg === 'number') dmg = dmg * 1.3;
      } catch (e2) { fail('deal', e2); }
      const r = _de.call(this, e, dmg, o);
      try {
        if (M.on && F.hitstop && e && !(e.d && e.d.boss) && o.src !== 'burn') {
          const want = (e.hp <= 0) ? 0.11 : (o.heavy ? 0.12 : 0.075);
          G.hitstop = Math.min(0.16, Math.max(G.hitstop || 0, want));
          M.n.hit++;
        }
        if (M.on && F.style && e && o.src !== 'burn') {
          let p = (o.finisher || o.src === 'finisher') ? 8 : o.heavy ? 3 : 1;
          if (e.hp <= 0) p += (o.finisher || o.src === 'finisher') ? 6 : 3;
          styleAdd(p, (o.finisher || o.src === 'finisher') ? 'FINISHER' : (e.hp <= 0 ? 'KILL' : ''));
        }
      } catch (e3) { fail('de-after', e3); }
      return r;
    };
  });

  hook('hurtPlayer', function (_hp) {
    return function (dmg, sx, sy, opt) {
      opt = opt || {};
      try {
        if (M.on && F.assist) { const k = liveTaken(); if (k !== 1 && typeof dmg === 'number') arguments[0] = dmg * k; }
        if (M.on && F.mutators && liveMut().glass && typeof arguments[0] === 'number') arguments[0] *= 1.6;
      } catch (e) { fail('taken', e); }
      const hp0 = (window.P && P.hp) || 0;
      const par0 = (window.P && P.parryFlash) || 0;
      const r = _hp.apply(this, arguments);
      try {
        if (M.on && F.style && window.P) {
          if (P.parryFlash > par0) styleAdd(8, 'PARRY');
          else if (P.hp < hp0) styleAdd(-10);
        }
      } catch (e) { fail('hurt-style', e); }
      return r;
    };
  });

  hook('killEnemy', function (_ke) {
    return function (e, o) {
      const r = _ke.apply(this, arguments);
      try { if (M.on && F.style && o && (o.finisher || o.src === 'finisher')) styleAdd(2, 'FINISHER'); } catch (e2) { fail('kill', e2); }
      return r;
    };
  });

  hook('nextStage', function (_ns) {
    return function () {
      try {
        if (M.on && F.style && M.pts > 0) {
          const r = rankOf(M.pts);
          setTimeout(() => { try { if (G.state === 'play') toast('STYLE  ' + r.id, 'The room is yours.', r.col, 2.2); } catch (e) { } }, 1200);
          M.pts = 0; M.rank = 'D'; M.idle = 0;
        }
      } catch (e) { fail('next', e); }
      return _ns.apply(this, arguments);
    };
  });

  // ---------- Input buffer ----------
  hook('startSword', function (_ss) {
    return function () {
      if (!(M.on && F.buffer)) return _ss.apply(this, arguments);
      try {
        if (P.sw) { P.swQueued = true; M.n.buf++; return; }
        if (P.whip || P.latch || (P.dodgeT > 0)) { M.want = 'sword'; M.wantT = 0.16; M.n.buf++; return; }
      } catch (e) { fail('ss', e); }
      return _ss.apply(this, arguments);
    };
  });
  hook('startWhip', function (_sw) {
    return function () {
      if (!(M.on && F.buffer)) return _sw.apply(this, arguments);
      try {
        if (P.whip || P.sw || P.latch || (P.dodgeT > 0)) { M.want = 'whip'; M.wantT = 0.16; M.n.buf++; return; }
      } catch (e) { fail('sw', e); }
      return _sw.apply(this, arguments);
    };
  });
  hook('firePistol', function (_fp) {
    return function () {
      if (!(M.on && F.buffer)) return _fp.apply(this, arguments);
      try {
        if (P.sw || P.whip || P.latch) { M.want = 'fire'; M.wantT = 0.16; M.n.buf++; return; }
      } catch (e) { fail('fp', e); }
      return _fp.apply(this, arguments);
    };
  });

  function consumeWant() {
    if (!M.want || M.wantT <= 0) { M.want = ''; return; }
    if (P.sw || P.whip || P.latch || (P.dodgeT > 0)) return;
    const w = M.want; M.want = ''; M.wantT = 0;
    try {
      if (w === 'sword' && typeof startSword === 'function') startSword();
      else if (w === 'whip' && typeof startWhip === 'function') startWhip();
      else if (w === 'fire' && typeof firePistol === 'function') firePistol();
    } catch (e) { fail('want', e); }
  }

  hook('update', function (_u) {
    return function (dt) {
      const r = _u.apply(this, arguments);
      try {
        if (M.on && F.buffer) {
          if (M.wantT > 0) { M.wantT -= dt; if (M.wantT <= 0) M.want = ''; }
          consumeWant();
        }
        if (M.on && F.style && RUN && RUN.on && !RUN.hub && G.state === 'play') {
          M.idle += dt;
          if (M.idle > 2.2) { M.pts = Math.max(0, M.pts - 8 * dt); M.rank = rankOf(M.pts).id; }
          if (M.flash > 0) M.flash -= dt;
          // room-clear flourish
          const alive = G.enemies ? G.enemies.filter(e => e.alive && !(e.d && e.d.boss)).length : 0;
          if (M.lastAlive >= 2 && alive === 0 && M.pts > 0) {
            const rk = rankOf(M.pts);
            toast('STYLE  ' + rk.id, '', rk.col, 1.8);
            M.flash = 1.1; M.flashL = rk.id;
          }
          M.lastAlive = alive;
        }
        if (M.mutOpen) tickMutInput();
      } catch (e) { fail('upd', e); }
      return r;
    };
  });

  function tickMutInput() {
    if (!(window.KP)) return;
    if (KP.Escape || KP.KeyQ || KP.PadBack) { M.mutOpen = false; KP.Escape = KP.KeyQ = KP.PadBack = false; return; }
    if (KP.ArrowUp || KP.KeyW) { M.mutSel = (M.mutSel + MUTL.length - 1) % MUTL.length; KP.ArrowUp = KP.KeyW = false; }
    if (KP.ArrowDown || KP.KeyS) { M.mutSel = (M.mutSel + 1) % MUTL.length; KP.ArrowDown = KP.KeyS = false; }
    if (KP.Enter || KP.Space || KP.PadOK) {
      const k = MUTL[M.mutSel].k; M.mut[k] = !M.mut[k]; saveMut();
      KP.Enter = KP.Space = KP.PadOK = false;
    }
  }

  // ---------- Ascension (regular foes only; bosses untouched) ----------
  hook('rogueEnemyDmg', function (_red) {
    return function (dmg, opt) {
      let v = _red.apply(this, arguments);
      try {
        const lv = liveAsc();
        if (!(M.on && F.ascension && lv > 0)) return v;
        opt = opt || {};
        if (opt.env) return v;
        const src = opt.src;
        if (src && src.d && (src.d.boss || src.summoned)) return v;
        if (bossOn()) return v;
        return Math.max(1, Math.round(v * (1 + 0.08 * lv)));
      } catch (e) { fail('asc-dmg', e); return v; }
    };
  });
  hook('rogueStagePost', function (_post) {
    return function () {
      const r = _post.apply(this, arguments);
      try {
        const lv = liveAsc();
        if (M.on && F.ascension && lv > 0 && RUN && RUN.on && !RUN.hub && G.enemies) {
          const k = 1 + 0.10 * lv;
          for (const e of G.enemies) {
            if (!e.alive || !e.d || e.d.boss || e.summoned || inArena(e) || e.m21wasc === lv) continue;
            e.hp = e.maxhp = Math.max(1, Math.round(e.maxhp * k));
            e.m21wasc = lv;
          }
        }
        if (M.on && F.mutators && liveMut().crowd) crowd();
      } catch (e) { fail('asc-hp', e); }
      return r;
    };
  });

  function crowd() {
    if (!G.enemies || !LEVEL || LEVEL.m21wcrowd) return;
    LEVEL.m21wcrowd = 1;
    if (RUN.hub || bossOn()) return;
    const regs = G.enemies.filter(e => e.alive && e.d && !e.d.boss && !e.summoned);
    if (regs.length < 2 || typeof makeEnemy !== 'function') return;
    let made = 0;
    for (const src of regs) {
      if (made >= 2) break;
      for (let t = 0; t < 10 && made < 2; t++) {
        const a = Math.random() * Math.PI * 2, d = 1.3 + Math.random() * 1.8;
        const x = src.x + Math.cos(a) * d, y = src.y + Math.sin(a) * d;
        const z = (typeof floorAt === 'function') ? floorAt(x, y) : 0;
        if (typeof blocked === 'function' && blocked(x, y, z, 0.32)) continue;
        if (window.P && Math.hypot(x - P.x, y - P.y) < 3.2) continue;
        try {
          const e = makeEnemy(src.type, x, y);
          if (!e) continue;
          e.awake = !!src.awake;
          G.enemies.push(e);
          if (typeof G.totalEnemies === 'number') G.totalEnemies++;
          made++;
        } catch (err) { }
      }
    }
    M.n.crowd += made;
  }

  // ---------- Gloom (world buffer only, before viewmodel) + Shroud cover ----------
  hook('postFX', function (_pfx) {
    return function () {
      const r = _pfx.apply(this, arguments);
      try {
        if (M.on && F.mutators && liveMut().gloom && typeof PIX !== 'undefined' && typeof EW !== 'undefined') {
          const N = EW * EH;
          for (let i = 0; i < N; i++) {
            const q = PIX[i];
            PIX[i] = (q & 0xff000000) | ((q & 255) * 0.72 | 0) | ((((q >> 8) & 255) * 0.68 | 0) << 8) | ((((q >> 16) & 255) * 0.78 | 0) << 16);
          }
        }
      } catch (e) { fail('gloom', e); }
      return r;
    };
  });

  hook('drawHubHUD', function (_dh) {
    return function (ctx) {
      const r = _dh.apply(this, arguments);
      try { if (M.on && G.state === 'play') text(ctx, 'PREVIEW', 6, 42, '#c0a050', 'left'); } catch (e) { fail('hubhud', e); }
      return r;
    };
  });
  hook('drawRunHUD', function (_rh) {
    return function (ctx) {
      const r = _rh.apply(this, arguments);
      try {
        if (M.on && F.mutators && liveMut().shroud && G.m20mmBox) {
          const b = G.m20mmBox;
          const x0 = b[0], x1 = b[1], y0 = b[2], y1 = b[3];
          ctx.fillStyle = 'rgba(10,4,18,0.94)';
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
          ctx.strokeStyle = '#4a3060'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
          text(ctx, 'SHROUD', (x0 + x1) / 2, (y0 + y1) / 2 - 3, '#6a5080', 'center');
        }
        if (M.on && G.state === 'play') {
          text(ctx, 'PREVIEW', 6, 40, '#c0a050', 'left');
          if (F.style && RUN && RUN.on && !RUN.hub) {
            const rk = rankOf(M.pts);
            text(ctx, 'STYLE  ' + rk.id, 6, 52, rk.col, 'left');
            if (M.flash > 0 && M.flashL) {
              ctx.save(); ctx.globalAlpha = Math.min(1, M.flash * 1.4);
              text(ctx, M.flashL, W / 2, 56, rk.col, 'center');
              ctx.restore();
            }
          }
          if (F.ascension && RUN && RUN.on && !RUN.hub && liveAsc() > 0)
            text(ctx, 'A' + liveAsc(), 6, F.style ? 64 : 52, '#ff8090', 'left');
        }
      } catch (e) { fail('hud', e); }
      return r;
    };
  });

  M.ready = true;
  M.st = () => ({
    on: M.on, F: Object.assign({}, F), taken: M.taken, deal: M.deal, ascLv: M.ascLv, mut: Object.assign({}, M.mut),
    ns: M.ns, n: Object.assign({}, M.n), err: M.err.slice(), rank: M.rank, pts: +M.pts.toFixed(1),
    dailyMenu: !!(window.M12 && M12.MENU && M12.MENU.some(m => m.id === 'daily')),
    mutMenu: !!(window.M12 && M12.MENU && M12.MENU.some(m => m.id === 'trymut'))
  });
})();
