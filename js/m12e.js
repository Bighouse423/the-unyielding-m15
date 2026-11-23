// ===== m12e: optional training corridor + branching crypt layouts =====
// 1) TRAINING: an optional, skippable, remembered lesson in the Ruined Nave against a sparring skeleton - BLOCK, PARRY, ROLL,
//    FINISHER. Offered once on the first NEW RUN (then remembered in settings storage), and always available from the title
//    menu (TRAINING). Not a run: no stats, feats, shards or saves are touched.
// 2) LAYOUTS: generated stages (2-10, Abyss) get 1-2 extra side passages between neighbouring rooms that the main chain does
//    not link, so a stage is a small loop network instead of a single line (seeded: the same seed gives the same layout).
(function () {
  const M12 = window.M12 || {}; if (!M12.on) return;
  const S = window.OPT ? OPT.S : {};
  // ---------------- 2) branching layouts ----------------
  const E = M12.E = { loops: 0 };
  if (typeof buildCrypt === 'function') {
    const _bc = buildCrypt;
    buildCrypt = function (theme, seed) {
      const r = _bc.apply(this, arguments);
      try { E.loops = addLoops((seed | 0) ^ 0x5eed); } catch (e) { M12.err = String(e && e.stack || e); }
      return r;
    };
  }
  function addLoops(seed) {
    const R = mulberry(seed >>> 0); const rooms = LEVEL.rooms || []; if (!rooms.length) return 0;
    const path = rooms.filter(r => r.kind === 'path'); const sec = rooms.filter(r => r.kind === 'secret');
    const cen = r => [Math.floor((r.x0 + r.x1) / 2), Math.floor((r.y0 + r.y1) / 2)];
    const idx = (x, y) => y * MW + x;
    const cands = [];
    for (let i = 0; i < path.length; i++) for (let j = i + 2; j < path.length; j++) {
      const a = path[i], b = path[j]; if (Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) !== 1) continue; cands.push([a, b]);
    }
    cands.sort(() => R() - 0.5);
    const want = 1 + (R() < 0.5 ? 1 : 0); let made = 0;
    const nearSecret = (x, y) => sec.some(s => x >= s.x0 - 2 && x <= s.x1 + 2 && y >= s.y0 - 2 && y <= s.y1 + 2);
    for (const [a, b] of cands) {
      if (made >= want) break;
      const [ax, ay] = cen(a), [bx, by] = cen(b); const cells = [];
      if (a.cx === b.cx) { const x = ax + (R() < 0.5 ? -1 : 1) * Math.min(2, Math.floor((a.x1 - a.x0) / 3)); for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) { cells.push([x, y]); cells.push([x + 1, y]); } }
      else { const y = ay + (R() < 0.5 ? -1 : 1) * Math.min(2, Math.floor((a.y1 - a.y0) / 3)); for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) { cells.push([x, y]); cells.push([x, y + 1]); } }
      if (cells.some(([x, y]) => x < 2 || y < 12 || x >= MW - 2 || y >= MH - 2 || nearSecret(x, y))) continue;
      const opened = [];
      for (const [x, y] of cells) { const i = idx(x, y); if (SOLID[i] && WT[i] !== 7) { SOLID[i] = 0; FH[i] = 0; CH[i] = 2.7; FT[i] = 1; CT[i] = 0; WT[i] = 0; opened.push(i); } }
      if (opened.length) made++;
    }
    return made;
  }

  // ---------------- 1) training ----------------
  if (S.m12tut === undefined) S.m12tut = 0;
  const T = M12.T = { on: false, step: 0, t: 0, dummy: null, done: false, prompt: false };
  const STEPS = [
    { n: 'BLOCK', kb: 'Hold F / MMB to raise your shield and take his blow on it.', pad: 'Swap to the shield (Triangle), hold L2 and take his blow.' },
    { n: 'PARRY', kb: 'Tap F / MMB just before his blade lands.', pad: 'With the shield up, tap L2 just before his blade lands.' },
    { n: 'ROLL', kb: 'Press Q / E / V as he swings, and roll through it.', pad: 'Press Circle as he swings, and roll through it.' },
    { n: 'FINISHER', kb: 'Parry him once more - then strike (LMB / J) while he reels.', pad: 'Parry him once more (L2) - then strike (R2) while he reels.' },
  ];
  M12.STEPS = STEPS;
  function spawnDummy() {
    const st = LEVEL.start; const a = st.ang || -Math.PI / 2;
    let x = st.x + Math.cos(a) * 3, y = st.y + Math.sin(a) * 3;
    if (isSolid(cellAt(x, y))) { x = st.x; y = st.y - 3; }
    const e = makeEnemy('skeleton', x, y); e.m12dummy = true; e.hp = e.maxhp = 99999; e.d.dmg = 6; e.d.windup = Math.max(0.85, e.d.windup || 0.6); e.d.recover = Math.max(1.0, e.d.recover || 0.6); e.d.speed *= 0.8; e.awake = true; e.noShards = true; e.plateName = 'SPARRING SKELETON'; e.plateCol = '#c8b8e0';
    G.enemies.push(e); return e;
  }
  M12.startTraining = function () {
    SFX.init && SFX.init();
    RUN.on = false; RUN.hub = false; applyThemeDefault(); newGame();
    G.enemies = []; G.pickups = (G.pickups || []).filter(p => false);
    const st = LEVEL.start; P.x = st.x; P.y = st.y; P.ang = st.ang || -Math.PI / 2; P.hp = P.maxhp = 100; P.mana = P.maxmana;
    T.on = true; T.step = 0; T.t = 0; T.cnt = 0; T.done = false; T.dummy = spawnDummy(); T.okT = 0;
    G.state = 'play'; G.fade = 1;
  };
  function endTraining(done) {
    T.on = false; S.m12tut = 1; if (window.OPT) OPT.save();
    newGame(); G.state = 'title'; G.fade = 1; applyThemeDefault();
    if (window.M12 && M12.TM) { M12.TM.msg = done ? 'TRAINING COMPLETE - THE DESCENT AWAITS' : 'TRAINING SKIPPED'; M12.TM.msgT = 2.6; }
  }
  M12.endTraining = endTraining;
  const advance = () => { T.step++; T.cnt = 0; T.okT = 1.2; try { SFX.ev ? SFX.ev('secret', 0.6, ['secret']) : SFX.play('secret', 0.6); } catch (e) { } if (T.step >= STEPS.length) { T.done = true; T.endT = 2.2; } };
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    const r = _hp.apply(this, arguments);
    if (T.on && !T.done) {
      if (T.step === 0 && r === 'block') advance();
      else if (T.step === 1 && r === 'parry') advance();
      else if (T.step === 2 && r === 'dodged') advance();
      if (P.hp < 40) P.hp = 40;
    }
    return r;
  };
  const _sf = startFinisher;
  startFinisher = function (e) { const r = _sf.apply(this, arguments); if (T.on && !T.done && T.step === 3 && e && e.m12dummy) { advance(); } return r; };
  // the title "NEW RUN" offers it once
  const _onPlay = M12.onPlay;
  M12.onPlay = function () {
    if (_onPlay && _onPlay()) return true;
    if (!S.m12tut && !T.prompt) { T.prompt = true; return true; }
    return false;
  };
  if (M12.MENU && !M12.MENU.some(m => m.id === 'tut')) M12.MENU.splice(1, 0, { id: 'tut', l: 'TRAINING' });
  const _act = M12.menuAct;
  M12.menuAct = function (id) { if (id === 'tut') { M12.startTraining(); return; } if (_act) _act(id); };
  const _fi = frameInner;
  frameInner = function (now) {
    try {
      if (T.prompt && G.state === 'title') {
        if (KP.Enter || KP.Space || KP.PadOK || KP.KeyY) { T.prompt = false; M12.startTraining(); }
        else if (KP.Escape || KP.PadBack || KP.KeyN || KP.Backspace) { T.prompt = false; S.m12tut = 1; if (window.OPT) OPT.save(); if (typeof enterHub === 'function') enterHub(); else newRun(); }
        for (const k of ['Enter', 'Space', 'PadOK', 'KeyY', 'Escape', 'PadBack', 'KeyN', 'Backspace', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'PadStart']) delete KP[k]; MBP[0] = false;
      } else if (T.on) {
        if (G.state !== 'play' && G.state !== 'pause' && !G.paused) { if (G.state !== 'title') endTraining(false); else T.on = false; }
        else {
          T.t += 1 / 60; if (T.okT > 0) T.okT -= 1 / 60; if (window.TIPS) { TIPS.cur = null; TIPS.q = []; }
          if (KP.Backspace || KP.PadSelect || KP.PadTip) { delete KP.Backspace; delete KP.PadSelect; delete KP.PadTip; endTraining(false); }
          else if (T.done && (T.endT -= 1 / 60) <= 0) endTraining(true);
          else if (T.dummy) {
            const e = T.dummy;
            if (!e.alive && !T.done) { T.done = true; T.endT = 2.2; }
            if (e.alive && T.step === 2 && e.state === 'stagger') { e.state = 'chase'; e.stagger = 0; }   // the roll lesson needs swings
            if (e.alive) { e.awake = true; if (Math.hypot(e.x - P.x, e.y - P.y) > 6) { e.x = P.x + Math.cos(P.ang) * 2.5; e.y = P.y + Math.sin(P.ang) * 2.5; } }
          }
        }
      }
    } catch (e) { M12.err = String(e && e.stack || e); }
    return _fi.apply(this, arguments);
  };
  // the dummy never drops anything / counts
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (T.prompt && G.state === 'title') {
        ctx.save(); ctx.fillStyle = 'rgba(10,2,18,0.92)'; ctx.fillRect(120, 140, 340, 76); ctx.fillStyle = '#f0c040'; ctx.fillRect(120, 140, 340, 1); ctx.fillRect(120, 215, 340, 1); ctx.restore();
        text(ctx, 'FIRST DESCENT?', 290, 148, '#ffe080', 'center');
        text(ctx, 'A short training: block, parry, roll, finisher.', 290, 164, '#d8c8f0', 'center');
        text(ctx, G.inputMode === 'pad' ? 'CROSS  train        CIRCLE  skip' : 'ENTER  train        ESC  skip', 290, 182, '#c0a0ff', 'center');
        text(ctx, 'Always in the title menu: TRAINING', 290, 200, '#8070a8', 'center');
        return true;
      }
      if (!T.on || G.state !== 'play') return;
      const s = STEPS[Math.min(T.step, STEPS.length - 1)], pad = G.inputMode === 'pad';
      ctx.save(); ctx.fillStyle = 'rgba(10,2,18,0.78)'; ctx.fillRect(50, 26, 380, 40); ctx.fillStyle = 'rgba(240,192,64,0.7)'; ctx.fillRect(50, 26, 380, 1); ctx.restore();
      if (T.done) { text(ctx, 'TRAINING COMPLETE', 240, 34, '#a0ffb0', 'center'); text(ctx, 'The Chapel awaits, Baron.', 240, 48, '#d8c8f0', 'center'); return true; }
      text(ctx, 'TRAINING  ' + (T.step + 1) + '/' + STEPS.length + ' - ' + s.n + (T.okT > 0 ? '   GOOD!' : ''), 240, 31, T.okT > 0 ? '#a0ffb0' : '#ffe080', 'center');
      text(ctx, pad ? s.pad : s.kb, 240, 44, '#e8dcff', 'center');
      text(ctx, pad ? 'SELECT  skip training' : 'BACKSPACE  skip training', 240, 56, '#8070a8', 'center');
      return true;
    } catch (e) { M12.err = String(e); }
  });
})();
