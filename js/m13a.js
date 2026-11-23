// ===== m13a: SECRETS =====
// 1) THE HIDDEN RELIQUARY: one extra false-wall vault on every generated stage (2-10), carved into solid rock beside a path
//    room; same tell as the M4 false walls (discoloured bricks, hairline crack, a draft of dust). Rich loot.
// 2) THE ASHEN SIGILS: on stages 3, 6 and 9 the Hidden Reliquary also holds an Ashen Sigil. Carry all three into the Lich's
//    Throne and, when he falls, the throne opens on THE BLACK CHAPEL: the secret boss, THE BLACK BARON (Kael's own past).
//    Beating him plays the alternate ending THE BLACK BANNER (3 new panels) before the victory screen.
// 3) RARE EVENTS (rolled once per run, 6-12% each): THE GILDED DEAD, THE LOST PILGRIM, THE BLOOD ECLIPSE.
// Codex (LORE + STORY), Feats, achievement names and the SECRETS HUD all pick these up. ?m13=0 switches all of m13 off.
(function () {
  const M13 = window.M13 = { on: !/[?&]m13=0/.test(location.search), err: null, v: 'm13' };
  if (!M13.on) return;
  const S9 = () => SAVE.m9;
  const sv = () => { const s = S9(); s.m13 = s.m13 || { ev: {}, kills: {}, seen: {} }; return s.m13; };
  M13.sv = sv;
  // ---------- feats / lore / achievement names ----------
  const FEATS = [
    ['m13_hidden', 'BEHIND THE BRICKS', 'Find a Hidden Reliquary.'],
    ['m13_sigils', 'THE THREE SEALS', 'Carry all three Ashen Sigils in one descent.'],
    ['m13_baron', 'THE BLACK BANNER', 'Defeat the Black Baron.'],
    ['m13_gilded', 'FOOL\'S GOLD', 'Catch the Gilded Dead before it escapes.'],
    ['m13_pilgrim', 'LIGHT FOR THE LOST', 'Find the Lost Pilgrim\'s candle.'],
    ['m13_eclipse', 'RED SKY AT NIGHT', 'Clear a stage under the Blood Eclipse.'],
    ['m13_butcher', 'CLOSED FOR BUSINESS', 'Fell the Charnel Butcher.'],
    ['m13_abbess', 'LAST RITES', 'Fell Sister Malediction.'],
    ['m13_relic', 'NEW TRICKS', 'Claim a build-changing relic.'],
    ['m13_synergy', 'PERFECT PAIR', 'Activate a relic synergy.'],
  ];
  M13.FEATS = FEATS;
  if (window.ACH) for (const [id, n, d] of FEATS) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d });
  if (window.M12 && M12.STEAM) for (const [id] of FEATS) M12.STEAM.map[id] = 'TU_' + id.toUpperCase();
  const feat = id => { try { if (window.ACH) ACH.unlock(id); } catch (e) { } };
  M13.feat = feat;
  const LORE = [
    ['m13_reliq', 'THE HIDDEN RELIQUARIES', 'The monks walled up their treasures when the Lich came, and then walled up the masons. Listen for the draft. Look for the bricks that do not match.'],
    ['m13_sigil', 'THE ASHEN SIGILS', 'Three seals were cut from the Black Court\'s banner and hidden in the dark. Carry all three to the throne, and the throne will show you what it hides.'],
    ['m13_baron', 'THE BLACK BARON', 'Before the pyre, before the banner burned, there was a knight who served the Lich gladly. Kael left him in the chapel under the throne. He has been waiting.'],
    ['m13_gilded', 'THE GILDED DEAD', 'A tithe-collector so greedy that death gilded him. He still runs from anyone who looks like they might ask for change.'],
    ['m13_pilgrim', 'THE LOST PILGRIM', 'She came to light a candle for her son and never found the way out. She left the candle burning, just in case someone else got lost.'],
    ['m13_eclipse', 'THE BLOOD ECLIPSE', 'Some nights the moon bleeds into the crypts. The dead grow strong on it. So does the blood they spill.'],
  ];
  if (window.M9 && M9.LORE) for (const l of LORE) if (!M9.LORE.some(q => q[0] === l[0])) M9.LORE.push(l);
  M13.lore = id => { try { if (!S9().lore[id]) M9.giveLore(id); } catch (e) { } };
  M13.addLore = l => { if (window.M9 && M9.LORE && !M9.LORE.some(q => q[0] === l[0])) M9.LORE.push(l); };

  // ---------- pickups ----------
  PICK.m13sigil = { tex: 'ic_m13sigil', h: 0.5, gc: [190, 90, 255], f(p) {
    RUN.m13sig = (RUN.m13sig || 0) + 1; const n = RUN.m13sig;
    G.bigText = { t1: 'ASHEN SIGIL', t2: n + ' / 3', t: 0, dur: 2.8 };
    toast(n < 3 ? 'The sigil is warm. It wants the others.' : 'The three seals burn together.', n < 3 ? 'Three were hidden. Find them all.' : 'Carry them to the Lich\'s Throne.', '#c890ff', 4.5);
    SFX.play('secret', 0.8); try { SFX.ev('m13_sigil', 0.9, ['ghost']); } catch (e) { }
    M13.lore('m13_sigil'); if (n >= 3) feat('m13_sigils'); return true; } };
  PICK.m13gskull = { tex: 'ic_m13gskull', h: 0.45, gc: [255, 210, 60], f(p) {
    if (typeof shardGain === 'function') shardGain(75, null); grantRandomRelic(true);
    toast('THE GILDED DEAD', 'Its golden skull is worth a fortune.', '#ffd848', 3.5); feat('m13_gilded'); M13.lore('m13_gilded'); return true; } };
  PICK.m13candle = { tex: 'ic_m13candle', h: 0.5, gc: [140, 200, 255], f(p) {
    P.maxhp += 20; P.hp = P.maxhp; P.mana = P.maxmana;
    G.bigText = { t1: 'THE PILGRIM\'S CANDLE', t2: '+20 MAX HEALTH', t: 0, dur: 2.8 };
    toast('"Thank you, sir knight. Find your way out."', 'A voice, and then only the candle.', '#a0d8ff', 4); SFX.play('secret', 0.7);
    feat('m13_pilgrim'); M13.lore('m13_pilgrim'); return true; } };

  // ---------- 1) the Hidden Reliquary ----------
  const SIGIL_ST = { 3: 1, 6: 1, 9: 1 };
  M13.SIGIL_ST = SIGIL_ST;
  function hiddenVault(theme, seed) {
    if (!RUN.on || RUN.hub) return null;
    const R = mulberry((seed ^ 0x13a13) >>> 0), rooms = (LEVEL.rooms || []).filter(r => r.kind === 'path' && r.style !== 'start');
    const idx = (x, y) => y * MW + x, solidAt = (x, y) => x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1 || SOLID[idx(x, y)];
    const cands = [];
    for (const r of rooms) {
      // each side of the room: the wall cell just outside, a 3x3 vault 2 cells further out
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const span = dx ? [r.y0 + 1, r.y1 - 1] : [r.x0 + 1, r.x1 - 1];
        for (let s = span[0]; s <= span[1]; s++) {
          const wx = dx > 0 ? r.x1 + 1 : dx < 0 ? r.x0 - 1 : s, wy = dy > 0 ? r.y1 + 1 : dy < 0 ? r.y0 - 1 : s;
          if (!SOLID[idx(wx, wy)] || SOLID[idx(wx - dx, wy - dy)]) continue;
          const cx = wx + dx * 2, cy = wy + dy * 2; let ok = cy - 2 >= 13 && cx - 3 >= 1 && cx + 3 < MW - 1 && cy + 3 < MH - 1;
          for (let y = cy - 2; ok && y <= cy + 2; y++) for (let x = cx - 2; ok && x <= cx + 2; x++) { if (x === wx && y === wy) continue; if (!solidAt(x, y)) ok = false; }
          if (ok && (LEVEL.cracks || []).some(c => Math.abs(c.x - cx) < 4 && Math.abs(c.y - cy) < 4)) ok = false;
          if (ok) cands.push({ wx, wy, cx, cy, dx, dy, r });
        }
      }
    }
    if (!cands.length) return null;
    const c = cands[(R() * cands.length) | 0];
    for (let y = c.cy - 1; y <= c.cy + 1; y++) for (let x = c.cx - 1; x <= c.cx + 1; x++) { const i = idx(x, y); SOLID[i] = 0; FH[i] = 0; CH[i] = 2.7; FT[i] = 1; CT[i] = 0; }
    const wi = idx(c.wx, c.wy); SOLID[wi] = 1; FH[wi] = 99; WT[wi] = 12;
    const cr = { x: c.wx, y: c.wy, hp: 2, open: false, ch: 2.7, kind: 'false', room: -13, m13: true };
    LEVEL.cracks = LEVEL.cracks || []; LEVEL.cracks.push(cr);
    LEVEL.secrets.push({ id: 'm13hidden', name: 'THE HIDDEN RELIQUARY', box: [c.cx - 1, c.cy - 1, c.cx + 2, c.cy + 2], minZ: -9, found: false, m13: true });
    const px = c.cx + 0.5, py = c.cy + 0.5, n = RUN.stage | 0;
    LEVEL.pickups.push({ type: 'cache', x: px, y: py });
    LEVEL.pickups.push({ type: 'shards', x: c.cx - 0.5, y: c.cy - 0.5, amt: 25 + 5 * n });
    LEVEL.pickups.push({ type: R() < 0.5 ? 'rose' : 'reliq', x: c.cx + 1.5, y: c.cy + 1.5 });
    if (SIGIL_ST[n] && !(RUN.cfg && RUN.cfg.abyss)) LEVEL.pickups.push({ type: 'm13sigil', x: c.cx + 1.5, y: c.cy - 0.5 });
    try { LEVEL.lights.push({ x: px, y: py, r: 3.4, i: 1.0, c: [0.85, 0.55, 1.0] }); buildLightmap(LEVEL.lights, theme.ambient || [0.34, 0.4, 0.36]); } catch (e) { }
    return c;
  }
  const _bc = buildCrypt;
  buildCrypt = function (theme, seed) {
    const r = _bc.apply(this, arguments);
    try { M13.vault = hiddenVault(theme, seed | 0); } catch (e) { M13.err = String(e && e.stack || e); }
    return r;
  };
  // finding it
  const _tick = () => {
    for (const s of LEVEL.secrets || []) if (s.m13 && s.found && !s.m13told) { s.m13told = true; feat('m13_hidden'); M13.lore('m13_reliq'); }
  };

  // ---------- 2) the secret boss + alternate ending ----------
  THEMES.m13sanct = Object.assign({}, THEMES.abyss, {
    name: 'THE BLACK CHAPEL', sub: 'Under the throne, a banner that never burned', boss: 'blackbaron',
    haze: [40, 10, 60], ambient: [0.42, 0.34, 0.58], torch: 'green',
    pool: [['royalguard', 2.0], ['voidshade', 1.4], ['penitent', 1.0], ['skeleton', 1.0]],
  });
  EDEF.blackbaron = Object.assign({}, EDEF.uknight, { spr: 's_m13blackbaron', hp: 2300, dmg: 25, title: 'THE BLACK BARON' });
  UNDEAD.add('blackbaron');
  BOSSREG.blackbaron = Object.assign({}, BOSSREG.uknight, {
    gate: 'A knight in black kneels before a banner. He has your face.',
    intro(b) {
      BOSSREG.uknight.intro(b);
      toast('The black knight rises.', '"You burned the banner, Kael. I am what you left behind."', '#c890ff', 3.6);
      M13.lore('m13_baron');
    },
    update(e, dt) {
      updateUKnight(e, dt);
      if (e.phase2 && !e.m13echo && e.alive) { e.m13echo = true; for (let k = 0; k < 2; k++) { const a = k * Math.PI + 0.7, x = e.x + Math.cos(a) * 2.5, y = e.y + Math.sin(a) * 2.5; if (!isSolid(cellAt(x, y))) { const s = makeEnemy('voidshade', x, y); s.summoned = true; s.awake = true; s.riseT = 0; s.hp = s.maxhp = Math.round(s.maxhp * RUN.cfg.hp); G.enemies.push(s); } } toast('"The Court remembers you."', '', '#c890ff', 2.5); }
    },
  });
  if (typeof BOSSDEATH !== 'undefined' && BOSSDEATH.uknight) BOSSDEATH.blackbaron = BOSSDEATH.uknight;
  if (typeof BOSSSPR !== 'undefined') BOSSSPR.blackbaron = function (S, t) {
    const b = G.boss; if (!b || b.type !== 'blackbaron' || !b.alive || b.hidden) return;
    S.push({ tex: 'glow_w', x: b.x, y: b.y, z: b.z + 2.55, w: 0.8, h: 0.45, add: true, alpha: 0.5 + 0.15 * Math.sin(t * 6), lit: false, tint: [200, 90, 255, 1] });
    S.push({ tex: 'glow_w', x: b.x, y: b.y, z: b.z + b.h * 0.45, w: 2.2, h: 3.0, add: true, alpha: (b.phase2 ? 0.2 : 0.1) + 0.05 * Math.sin(t * 5), lit: false, tint: [150, 60, 255, 1] });
  };
  if (M9.LINES) M9.LINES.blackbaron = ['"Kneel to the Court, Kael. You did once. It was easy."', '"Then go... and be... what I... could not..."'];
  const _sc = stageCfg;
  stageCfg = function (n) {
    if (RUN.m13sanct === 1 && n === 11) {
      const c = _sc(10); c.n = 11; c.theme = 'm13sanct'; c.boss = 'blackbaron'; c.abyss = 0; c.endless = 0; c.m13sanct = true;
      c.bossHp = c.bossHp * 1.08; return c;
    }
    return _sc(n);
  };
  GAME.rogue.stageCfg = stageCfg;
  const _si = stageIntro;
  stageIntro = function () {
    if (RUN.cfg && RUN.cfg.m13sanct) {
      G.bigText = { t1: 'THE BLACK CHAPEL', t2: 'A banner that never burned', dur: 3.4, t: 0 };
      toast('The sigils lead down.', 'Something kneels at the far end of the chapel.', '#c890ff', 4.5); return;
    }
    const r = _si.apply(this, arguments);
    if (RUN.stage === 10 && (RUN.m13sig || 0) >= 3) setTimeout(() => { if (G.state === 'play' && RUN.stage === 10) toast('THE THREE SEALS BURN', 'Something waits beneath the throne.', '#c890ff', 4); }, 4200);
    return r;
  };
  const _sp = startPick;
  startPick = function (mini) {
    try {
      if (!mini && RUN.on && G.state === 'play' && !RUN.won) {
        if (RUN.stage === 10 && (RUN.m13sig || 0) >= 3 && !RUN.m13sanct) {
          RUN.m13sanct = 1; G.bigText = { t1: 'THE SIGILS BURN', t2: 'The throne cracks open', t: 0, dur: 2.6 };
          SFX.play('toll'); SFX.play('ghost'); G.shake += 6;
          setTimeout(() => { if (G.state === 'play' && RUN.stage === 10) nextStage(); }, 2600);
          return;
        }
        if (RUN.m13sanct === 1 && RUN.stage === 11) { RUN.m13sanct = 2; RUN.m13alt = true; RUN.stage = 10; feat('m13_baron'); sv().baron = (sv().baron || 0) + 1; S9().m13alt = 1; M9.write(); }
      }
    } catch (e) { M13.err = String(e && e.stack || e); }
    return _sp.apply(this, arguments);
  };
  GAME.rogue.startPick = startPick;
  M9.SCENES.m13alt = [
    { art: 'm13_alt1', lines: ['Under the throne, the Black Baron waits: the knight Kael was', 'before the pyre. "You cannot burn what you are."'] },
    { art: 'm13_alt2', lines: ['Kael can. He does it twice now: once for the banner,', 'and once for the man who carried it.'] },
    { art: 'm13_alt3', lines: ['At dawn a new banner flies over the castle: no crown, no skull.', 'Only a sun. THE UNYIELDING has nothing left to kneel to.'] },
  ];
  if (window.M12 && M12.F && M12.F.imgs) for (const k of ['m13_alt1', 'm13_alt2', 'm13_alt3']) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = 'assets/m13/story/' + k + '.jpg'; M12.F.imgs[k] = im; }
  const _sw = startWin;
  startWin = function () {
    const alt = RUN.m13alt; const r = _sw.apply(this, arguments);
    if (alt) { RUN.m13alt = false; setTimeout(() => { try { if (M9.ui.kind === 'scene') M9.closeUI(); M9.openScene('m13alt'); } catch (e) { } }, 60); }
    return r;
  };
  const _sr = M9.storyRows;
  M9.storyRows = function () { const a = _sr ? _sr.apply(this, arguments) : []; return a.concat([{ s: 'm13alt', n: 'THE BLACK BANNER', ok: !!S9().m13alt }]); };

  // ---------- 3) rare events ----------
  const EVENTS = [['gilded', 0.10], ['pilgrim', 0.08], ['eclipse', 0.07]];
  M13.EVENTS = EVENTS;
  const _nr = newRun;
  newRun = function () {
    const r = _nr.apply(this, arguments);
    RUN.m13sig = 0; RUN.m13sanct = 0; RUN.m13alt = false; RUN.m13ev = {};
    try {
      const f = (window.M13 && M13.forceEv) || null;
      for (const [id, p] of EVENTS) if (f ? f === id : Math.random() < p) RUN.m13ev[id] = f ? 2 : 2 + ((Math.random() * 8) | 0);
    } catch (e) { }
    return r;
  };
  const evNow = id => RUN.on && !RUN.hub && RUN.m13ev && RUN.m13ev[id] === RUN.stage && !(RUN.cfg && (RUN.cfg.abyss || RUN.cfg.m13sanct));
  M13.evNow = evNow;
  const farCell = (minD) => {
    const rooms = (LEVEL.rooms || []).filter(r => r.kind === 'path' && r.style !== 'start'); let best = null, bd = 0;
    for (const r of rooms) { const x = (r.x0 + r.x1) / 2 + 0.5, y = (r.y0 + r.y1) / 2 + 0.5, d = Math.hypot(x - LEVEL.start.x, y - LEVEL.start.y); if (d > bd && d >= minD && y > 13 && !isSolid(cellAt(x, y))) { bd = d; best = [x, y]; } }
    return best;
  };
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    const r = _rsp.apply(this, arguments);
    try {
      if (evNow('eclipse')) {
        RUN.m13eclipse = RUN.stage;
        for (const e of G.enemies) if (!e.d.boss) { e.hp = e.maxhp = Math.round(e.maxhp * 1.2); e.d.speed *= 1.1; e.m13ecl = true; }
        setTimeout(() => { if (G.state === 'play') toast('THE BLOOD ECLIPSE', 'The dead grow strong tonight. So will your spoils.', '#ff5060', 4.5); }, 4600);
        M13.lore('m13_eclipse');
      }
      if (evNow('pilgrim')) {
        const c = farCell(10); if (c) { LEVEL.pickups.push({ type: 'm13candle', x: c[0], y: c[1] }); setTimeout(() => { if (G.state === 'play') toast('A candle burns somewhere on this floor.', 'You hear someone weeping, far away.', '#a0d8ff', 4.5); }, 4600); }
      }
      if (evNow('gilded')) {
        const c = farCell(8); if (c) { const e = makeEnemy('skeleton', c[0], c[1]); e.m13gild = true; e.hp = e.maxhp = Math.round(e.maxhp * RUN.cfg.hp * 1.4); e.noElite = true; e.d.speed *= 1.6; e.d.dmg = 0; e.m13gT = 0; G.enemies.push(e); G.totalEnemies++; M13.gild = e;
          setTimeout(() => { if (G.state === 'play') toast('THE GILDED DEAD', 'Something golden is running loose. Catch it!', '#ffd848', 4.5); }, 4600); }
      }
    } catch (e) { M13.err = String(e && e.stack || e); }
    return r;
  };
  // the gilded one runs away, never attacks, and slips into the walls after 40 s of being seen
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.m13gild && e.alive && !e.dead) {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
      if (e.awake || d < 9) { e.awake = true; e.m13gT += dt; if (Math.random() < dt * 6) addP({ k: 'ember', x: e.x + rand(-0.2, 0.2), y: e.y + rand(-0.2, 0.2), z: e.z + rand(0.2, 1.6), vx: 0, vy: 0, vz: 0.6, size: 0.04, col: RGB(255, 210, 80), life: 0.6 }); }
      if (e.m13gT > 40) { e.alive = false; e.dead = true; e.deathType = 'gone'; e.hidden = true; G.totalEnemies--; toast('The Gilded Dead slips away into the walls.', 'Too slow.', '#c0a060', 3); return; }
      e.t += dt; e.flash = Math.max(0, e.flash - dt * 10); e.hurtT -= dt;
      if (e.stagger > 0) { e.stagger -= dt; e.state = 'stagger'; return; }
      if (e.freezeT > 0) { e.freezeT -= dt; return; }
      if (e.awake && d < 12) { const sp = e.d.speed * (e.hurtT > 0 ? 0.6 : 1); moveEntity(e, dx / d * sp * dt, dy / d * sp * dt, e.r * 0.8, 0.33, false); e.walk += sp * dt * 5.5; e.state = 'chase'; }
      if (Math.abs(e.kbx) + Math.abs(e.kby) > 0.01) { moveEntity(e, e.kbx * dt, e.kby * dt, e.r * 0.8, 0.33, false); e.kbx *= Math.pow(0.004, dt); e.kby *= Math.pow(0.004, dt); }
      return;
    }
    return _ue.apply(this, arguments);
  };
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const r = _ke.apply(this, arguments);
    try {
      if (e.m13gild) { const p = mkPickup('m13gskull', e.x, e.y); G.pickups.push(p); sparks(e.x, e.y, e.z + 1, 30, RGB(255, 210, 80)); }
      if (e.m13ecl && typeof shardGain === 'function' && Math.random() < 0.5) shardGain(2, e);
    } catch (er) { }
    return r;
  };
  const _ev = enemyVisual;
  enemyVisual = function (e) {
    const v = _ev.apply(this, arguments);
    if (v && e.m13gild && !e.dead) { v.tint = [255, 200, 60, 0.6]; v.glow = Math.max(v.glow || 0, 0.5); }
    return v;
  };
  GAME.dbg.enemyVisual = enemyVisual;
  // eclipse stage cleared -> feat + bonus
  const _ns = nextStage;
  nextStage = function () {
    try { if (RUN.m13eclipse && RUN.m13eclipse === RUN.stage) { RUN.m13eclipse = 0; feat('m13_eclipse'); if (typeof shardGain === 'function') shardGain(60, null); toast('THE ECLIPSE PASSES', '+60 shards for the red night.', '#ff8090', 3.5); } } catch (e) { }
    return _ns.apply(this, arguments);
  };
  // eclipse sky: redden the haze for that stage only
  const _at = applyTheme;
  applyTheme = function () {
    const r = _at.apply(this, arguments);
    try { if (evNow('eclipse')) { HAZE[0] = 150; HAZE[1] = 20; HAZE[2] = 30; } } catch (e) { }
    return r;
  };
  // eclipse: a blood-red vignette over the whole stage
  let vig = null;
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (!RUN.on || G.state !== 'play' || RUN.m13eclipse !== RUN.stage) return false;
    if (!vig) { vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62); vig.addColorStop(0, 'rgba(120,0,16,0.0)'); vig.addColorStop(1, 'rgba(150,0,20,0.42)'); }
    ctx.save(); ctx.fillStyle = 'rgba(110,0,14,0.10)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    const pulse = 0.75 + 0.25 * Math.sin(G.time * 1.3); ctx.globalAlpha = pulse; ctx.fillStyle = '#c01828'; ctx.beginPath(); ctx.arc(W - 92, 16, 6, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#300008'; ctx.beginPath(); ctx.arc(W - 90, 15, 5, 0, TAU); ctx.fill(); ctx.restore(); return true;
  });
  // HUD: sigils carried
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (!RUN.on || RUN.hub || G.state !== 'play' || !(RUN.m13sig > 0)) return false;
    const x = W - 46, y = 236; drawIcon(ctx, 'ic_m13sigil', x, y, 10, 10); text(ctx, RUN.m13sig + '/3', x + 8, y - 3, '#d0a0ff', 'left'); return true;
  });
  const _fi = frameInner;
  frameInner = function () { try { if (RUN.on && G.state === 'play') _tick(); } catch (e) { M13.err = String(e); } return _fi.apply(this, arguments); };
})();
