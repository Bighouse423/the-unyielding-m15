// ===== m12b: balance pass + difficulty modes =====
// - smoother curve: the stage-6 (Arena) and stage-10 spikes are cut, mostly via regular-foe PROJECTILE damage (that was 60-70% of
//   the HP lost there in the m11 bot runs). Regular stages stay harder than m9 (the m9n/m10a multipliers are untouched).
// - VIGOR: every boss you beat adds max HP (Baron +10), so max HP grows across a run (bots ended m11 runs on 100-125).
// - boss boon screens: three commons -> one becomes rare or better; two commons -> 40% chance one does.
// - burn (Fire Whip / Emberbrand / Hellfang / Pyre) ticks deal 15% less.
// - DIFFICULTY: PILGRIM / BARON (default, the tuned m12 curve) / UNYIELDING. Regular foes only; bosses' HP and patterns are never
//   touched by any mode. The mode is picked in Settings or on the title (left / right on NEW RUN) and locks in when a run starts.
(function () {
  const M12 = window.M12 || {}; if (!M12.on) return;
  const B = M12.B = {
    // per stage 1..10 (index 0 unused) - Baron curve; applied to regular foes only, never once a boss gate seals / a boss is up
    dmgK: [1, 1, 1, 1, 1, 1, 0.80, 0.94, 0.94, 0.88, 0.70],
    projK: [1, 1, 1, 1, 0.95, 0.92, 0.72, 0.82, 0.86, 0.80, 0.66],
    burnK: 0.85,
    MODES: [
      { id: 'pilgrim', l: 'PILGRIM', d: 'Gentler foes, more vigor. For the story.', dmg: 0.70, hp: 0.85, vig: 15, start: 25 },
      { id: 'baron', l: 'BARON', d: 'The intended descent.', dmg: 1.00, hp: 1.00, vig: 10, start: 0 },
      { id: 'unyield', l: 'UNYIELDING', d: 'Foes hit harder and last longer. Little mercy.', dmg: 1.22, hp: 1.15, vig: 5, start: 0 },
    ],
    stat: { proj: 0, projRaw: 0, vig: 0, upg: 0 },
  };
  const S = window.OPT ? OPT.S : {}; if (S.m12diff === undefined) S.m12diff = 1;
  M12.mode = () => B.MODES[(RUN.m12diff !== undefined && RUN.on ? RUN.m12diff : S.m12diff) | 0] || B.MODES[1];
  const sealed = () => { const g = typeof LEVEL !== 'undefined' && LEVEL && LEVEL.doors && LEVEL.doors.gate; return !!(g && g.state === 'sealed'); };
  const bossOn = () => sealed() || !!(G.boss && G.boss.alive && G.boss.awake && !G.boss.hidden);
  const abyss = () => (RUN.cfg && RUN.cfg.abyss) || (typeof abyssDepth === 'function' && abyssDepth());
  const active = () => RUN.on && !RUN.hub && RUN.cfg && !abyss();
  const inArena = e => { const A = LEVEL.arena; return !!(A && e.x > A.x0 - 1 && e.x < A.x1 + 1 && e.y > A.y0 - 1 && e.y < A.y1 + 1); };

  // ---------- which projectile is hitting (src-less hurtPlayer calls come from G.projectiles) ----------
  let curOwner = null;
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    curOwner = null; opt = opt || {};
    if (!opt.src && !opt.env && G.projectiles) {
      let bd = 0.05;
      for (const p of G.projectiles) { const d = Math.hypot(p.x - (p.vx || 0) * 0.1 - sx, p.y - (p.vy || 0) * 0.1 - sy); if (d < bd) { bd = d; curOwner = p.owner || null; } }
    }
    try { return _hp.apply(this, arguments); } finally { curOwner = null; }
  };
  const _red = rogueEnemyDmg;
  rogueEnemyDmg = function (dmg, opt) {
    let v = _red(dmg, opt);
    try {
      if (!active() || opt.env || bossOn()) return v;
      const src = opt.src || curOwner;
      if (src && src.d && (src.d.boss || src.summoned)) return v;
      const n = Math.max(1, Math.min(10, RUN.cfg.n | 0)), m = M12.mode();
      let k = B.dmgK[n] * m.dmg;
      if (!opt.src) { k *= B.projK[n]; B.stat.projRaw += v; }
      const out = Math.max(1, Math.round(v * k)); if (!opt.src) B.stat.proj += out;
      return out;
    } catch (e) { M12.err = String(e); return v; }
  };

  // ---------- regular-foe HP by mode (after m9n's pass; pack-mates included; boss arena untouched) ----------
  const _post = rogueStagePost;
  rogueStagePost = function () {
    const r = _post.apply(this, arguments);
    try {
      const m = M12.mode();
      if (active() && m.hp !== 1) for (const e of G.enemies) if (e.alive && !e.d.boss && !e.summoned && !inArena(e)) { e.hp = e.maxhp = Math.max(1, Math.round(e.maxhp * m.hp)); }
    } catch (e) { M12.err = String(e); }
    return r;
  };

  // ---------- VIGOR: max HP grows with every boss beaten ----------
  const _next = nextStage;
  nextStage = function () {
    let g = 0;
    try { if (RUN.on && !abyss() && (RUN.stage | 0) < 10 && !RUN.won) { g = M12.mode().vig; P.maxhp += g; P.hp += g; B.stat.vig += g; RUN.m12vig = (RUN.m12vig || 0) + g; } } catch (e) { M12.err = String(e); }
    const r = _next.apply(this, arguments);
    if (g) setTimeout(() => { if (G.state === 'play') toast('VIGOR', '+' + g + ' max health  (' + P.maxhp + ')', '#ff8090', 2.6); }, 3600);
    return r;
  };
  const _nr = newRun;
  newRun = function () {
    RUN.m12diff = S.m12diff | 0; RUN.m12vig = 0;
    const r = _nr.apply(this, arguments);
    try { const m = M12.mode(); if (m.start) { P.maxhp += m.start; P.hp = P.maxhp; } } catch (e) { M12.err = String(e); }
    return r;
  };

  // ---------- boss boon screens: fewer all-common rolls ----------
  const _roll = rollChoices;
  rollChoices = function (mini) {
    const out = _roll.apply(this, arguments);
    try {
      if (mini || !out || out.length < 3) return out;
      const com = out.map((u, i) => u && u.r === 'common' ? i : -1).filter(i => i >= 0);
      if (com.length === 3 || (com.length === 2 && Math.random() < 0.4)) {
        const pool = UPG.filter(u => u.r !== 'common' && !out.includes(u) && u.ok() && (typeof isUnlocked !== 'function' || isUnlocked(u.id)) && u.kind === 'RELIC');
        if (pool.length) { out[com[(Math.random() * com.length) | 0]] = pool[(Math.random() * pool.length) | 0]; B.stat.upg++; }
      }
    } catch (e) { M12.err = String(e); }
    return out;
  };

  // ---------- burn trim ----------
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, opt) {
    if (opt && opt.src === 'burn' && typeof dmg === 'number') arguments[1] = dmg * B.burnK;
    return _de.apply(this, arguments);
  };

  // ---------- difficulty in Settings ----------
  if (window.OPT) {
    const _rows = OPT.rows;
    OPT.rows = function () {
      const L = _rows.apply(this, arguments);
      if (this.page === 'main') {
        const row = { t: 'opt', id: 'm12diff', l: 'DIFFICULTY', v: () => B.MODES[S.m12diff | 0].l + (RUN.on && !RUN.hub && (RUN.m12diff | 0) !== (S.m12diff | 0) ? ' (next run)' : '') };
        L.splice(0, 0, { t: 'hdr', l: 'GAME' }, row);
      }
      return L;
    };
    const _in = OPT.input;
    OPT.input = function () {
      try {
        if (this.page === 'main' && !this.cap) {
          const r = this.rows()[this.sel];
          if (r && r.id === 'm12diff') { const d = (KP.ArrowLeft || KP.KeyA) ? -1 : (KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK) ? 1 : 0; if (d) { S.m12diff = ((S.m12diff | 0) + d + 3) % 3; OPT.save(); } }
        }
      } catch (e) { M12.err = String(e); }
      return _in.apply(this, arguments);
    };
  }
  M12.cycleDiff = d => { S.m12diff = ((S.m12diff | 0) + d + 3) % 3; if (window.OPT) OPT.save(); };
})();
