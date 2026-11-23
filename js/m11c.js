// ===== M11c: VARIETY - new elite affixes, the Reliquary Thief, Blood Pact shrines, Wrath Orbs =====
// Same core loop. Regular stages only; bosses, their fights and the health vials are untouched.
//  - WARDED elites: a spectral ward soaks the first hits (3, +1 from stage 6) - break it, then cut them down.
//  - BLAZING elites: immune to fire; when one dies it bursts into a telegraphed fire nova (0.7 s ring) - step out.
//  - RELIQUARY THIEF (stage 2+, ~1 in 3 stages): a gilded imp with a stolen purse. Wakes when he sees you and runs;
//    kill him within 15 s for a shard jackpot, or he vanishes with it.
//  - BLOOD PACT shrine (stage 3+, ~1 in 3 stages): optional. Touch it and regular foes hit 25% harder until the stage
//    ends, but every shard they drop is doubled. Never affects the boss.
//  - WRATH ORB: elites drop one 1 time in 3 - 12 s of +30% damage.
// Placement rolls use the run seed (own PRNG), so stage layouts are unchanged.
(function () {
  const M11 = window.M11; if (!M11 || !M11.on || typeof ELITES === 'undefined' || typeof PICK === 'undefined') return;
  const st = M11.stat; st.thief = 0; st.thiefLost = 0; st.pacts = 0; st.wraths = 0; st.wards = 0; if (/[?&]m11var=0/.test(location.search)) return;
  const C = M11.C = { thief: null, pact: 0, wrath: 0, nova: [] };
  // ---------- new affixes ----------
  ELITES.warded = { n: 'WARDED', c: '#80e8ff', tint: [110, 220, 255] };
  ELITES.blazing = { n: 'BLAZING', c: '#ff9a40', tint: [255, 140, 40] };
  Object.defineProperty(ELITES, 'thief', { value: { n: 'THIEF', c: '#ffd860', tint: [255, 210, 90] }, enumerable: false });
  const _me = makeElite;
  makeElite = function (e, mods) {
    const r = _me.apply(this, arguments);
    if (mods && mods.includes('warded')) { e.ward = e.wardMax = 3 + ((RUN.stage | 0) >= 6 ? 1 : 0); }
    if (mods && mods.includes('blazing')) { e.blaze = true; }
    return r;
  };
  const _di = rogueDmgIn;
  rogueDmgIn = function (e, dmg, o) {
    if (e.blaze && o && (o.src === 'burn') && o.dot) return 0;
    dmg = _di.apply(this, arguments);
    if (e.ward > 0 && o && !o.dot && dmg > 0) {
      e.ward--; st.wards++;
      const fz = e.z + e.h * 0.55;
      for (let i = 0; i < 12; i++) { const a = M11.fr() * 6.283; addP({ k: 'spark', x: e.x, y: e.y, z: fz, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: M11.fa(-1, 2), size: 0.035, col: RGB(150, 235, 255), life: 0.35 }); }
      M11.fx({ k: 'ring', x: e.x, y: e.y, z: e.z + e.h * 0.4, life: 0.3, sz: 0.9, col: [140, 230, 255] });
      M11.light(e.x, e.y, 2, [0.5, 0.9, 1.0], 0.5, 0.2);
      if (e.ward === 0) { dmgNum(e.x, e.y, e.z + e.h + 0.45, 'WARD BROKEN', '#a0f0ff'); SFX.play('clink'); SFX.play('block', 0.8); M11.sfx && M11.sfx('m11_ward', 0.9); G.shake += 2; M11.fx({ k: 'star', x: e.x, y: e.y, z: fz, life: 0.22, sz: 1.8, col: [160, 240, 255], n: 8 }); }
      else { dmgNum(e.x, e.y, e.z + e.h + 0.45, 'WARD', '#80e8ff'); SFX.play('block', 0.55); M11.sfx && M11.sfx('m11_ward', 0.35); }
      dmg *= 0.15;
    }
    if (P.m11wrath > 0 && o && !o.dot) dmg *= 1.3;
    return dmg;
  };
  // fire nova from a dead Blazing elite (telegraph ring, then the burst)
  const _ok = rogueOnKill;
  rogueOnKill = function (e) {
    const r = _ok.apply(this, arguments);
    try {
      if (e.blaze && !e.d.boss) C.nova.push({ x: e.x, y: e.y, t: 0, R: 1.9, dmg: Math.round(9 * (RUN.cfg ? RUN.cfg.dmg : 1)) });
      if (e.elite && !e.d.boss && !e.m11thief && M11.fr() < 0.34) { G.pickups.push(Object.assign(mkPickupQ('m11wrath', e.x - 0.25, e.y), {})); }
      if (e.m11thief) thiefDown(e);
      if (C.pact && !e.d.boss) M11.fx({ k: 'star', x: e.x, y: e.y, z: e.z + e.h * 0.6, life: 0.2, sz: 1.0, col: [255, 40, 60], n: 4 });
    } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11c kill', err); } }
    return r;
  };
  // a pickup without touching Math.random (mkPickup rolls its bob phase with it)
  function mkPickupQ(type, x, y) { return { type, x, y, z: floorAt(x, y), t: M11.fr() * 6, taken: false, vz: 2.5, drop: true }; }
  // ---------- sprites (procedural pixel art) ----------
  function spr(name, w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const R = (col, a, b, ww, hh) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); }; draw(R, x);
    Engine.imgs[name] = c; const dd = x.getImageData(0, 0, w, h); Engine.tex[name] = { w, h, d: new Uint32Array(dd.data.buffer) };
  }
  spr('p_m11wrath', 12, 12, R => { R('#5a0010', 3, 1, 6, 10); R('#5a0010', 1, 3, 10, 6); R('#b0102a', 3, 2, 6, 8); R('#b0102a', 2, 3, 8, 6); R('#ff3050', 4, 3, 4, 6); R('#ff3050', 3, 4, 6, 4); R('#ff9aa0', 4, 4, 2, 2); R('#fff0f0', 4, 4, 1, 1); R('#ffd060', 5, 0, 2, 1); });
  spr('p_m11shrine', 18, 24, R => {
    R('#1a0a1e', 2, 18, 14, 6); R('#2e1634', 3, 17, 12, 2); R('#3a2040', 4, 9, 10, 9); R('#24122a', 4, 9, 1, 9); R('#4e2c56', 13, 9, 1, 9);
    R('#5a3462', 3, 8, 12, 2); R('#6e4478', 3, 8, 12, 1); R('#2a0010', 6, 11, 6, 4); R('#c0102a', 7, 12, 4, 2);
    R('#ffd060', 7, 4, 4, 1); R('#c89a30', 8, 5, 2, 3); R('#ffd060', 6, 3, 1, 2); R('#ffd060', 11, 3, 1, 2); R('#900018', 7, 2, 4, 2); R('#ff3050', 8, 2, 2, 1);
    R('#7a5484', 5, 19, 8, 1); R('#ff4060', 8, 14, 2, 1);
  });
  PICK.m11wrath = { tex: 'p_m11wrath', h: 0.3, gc: [255, 40, 70], f() { P.m11wrath = 12; st.wraths++; toast('WRATH ORB', '+30% damage for 12 s', '#ff5070', 1.6); SFX.play('glint', 0.8); M11.sfx && M11.sfx('m11_wrath', 0.85); SFX.play('roar', 0.25); G.flashR = Math.max(G.flashR, 0.18); return true; } };
  PICK.m11shrine = { tex: 'p_m11shrine', h: 0.62, gc: [255, 30, 60], f(p) {
    if (C.pact) return false; C.pact = RUN.stage | 0; st.pacts++; RUN.m11pacts = (RUN.m11pacts || 0) + 1;
    toast('BLOOD PACT SEALED', 'Foes strike 25% harder - their shards are doubled', '#ff4060', 3.6);
    SFX.play('toll', 0.7); SFX.play('heavy', 0.6); M11.sfx && M11.sfx('m11_pact', 0.9); G.flashR = 0.35; G.shake += 4;
    M11.fx({ k: 'ring', x: p.x, y: p.y, z: p.z, life: 0.7, sz: 3.2, col: [255, 40, 60] }); M11.light(p.x, p.y, 4, [1, 0.15, 0.25], 1.0, 0.8);
    return true;
  } };
  // pact effects: incoming hits from regular foes x1.25, their shards x2 (bosses never)
  const _hp0 = hurtPlayer0;
  hurtPlayer0 = function (dmg, sx, sy, opt) {
    if (C.pact && opt && opt.src && opt.src.d && !opt.src.d.boss && !(G.boss && G.boss.alive && LEVEL.doors && LEVEL.doors.gate && LEVEL.doors.gate.state === 'sealed')) dmg = Math.round(dmg * 1.25);
    return _hp0.call(this, dmg, sx, sy, opt);
  };
  if (typeof shardGain === 'function') { const _sg = shardGain; shardGain = function (n, e) { if (C.pact && e && e.d && !e.d.boss) n *= 2; return _sg.call(this, n, e); }; }
  // ---------- the Reliquary Thief ----------
  function seeded(salt) { let sd = ((RUN.seed || 1) ^ Math.imul((RUN.stage | 0) + salt, 0x9e3779b1) ^ 0x2c1b3c6d) >>> 0; sd = Math.imul(sd ^ (sd >>> 16), 0x45d9f3b); sd = Math.imul(sd ^ (sd >>> 16), 0x45d9f3b); sd = (sd ^ (sd >>> 16)) >>> 0; return () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function spots(rnd, minD, maxD) {
    const ok = (x, y) => { const i = y * MW + x; return x > 0 && y > 0 && x < MW - 1 && y < MH - 1 && !SOLID[i] && FH[i] === 0 && (typeof FT === 'undefined' || FT[i] !== 6); };
    const A = LEVEL.arena, inA = (x, y) => A && x > A.x0 - 2 && x < A.x1 + 2 && y > A.y0 - 2 && y < A.y1 + 2;
    const out = [];
    for (const r of (LEVEL.rooms || [])) { if (r.kind === 'secret' || r.style === 'start') continue; for (let y = r.y0 + 1; y < r.y1; y++) for (let x = r.x0 + 1; x < r.x1; x++) { const d = Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y); if (ok(x, y) && d > minD && d < maxD && !inA(x, y) && (!G.boss || Math.hypot(x - G.boss.x, y - G.boss.y) > 9)) out.push([x, y]); } }
    return out;
  }
  function spawnThief() {
    const rnd = seeded(101); if (rnd() >= 0.36) return;
    const cand = spots(rnd, 12, 60); if (!cand.length) return;
    const k = cand[(rnd() * cand.length) | 0];
    const R0 = Math.random; let s2 = (RUN.seed ^ 0x1234567) >>> 0; Math.random = () => ((s2 = (s2 * 1664525 + 1013904223) >>> 0) / 4294967296);   // keep the run's RNG stream untouched
    let e; try { e = makeEnemy('imp', k[0] + 0.5, k[1] + 0.5); } finally { Math.random = R0; }
    e.m11thief = true; e.elite = ['thief']; e.plateName = 'RELIQUARY THIEF'; e.plateCol = '#ffd860'; e.hp = e.maxhp = Math.round(e.maxhp * 0.9); e.noShards = true;
    e.tint = [255, 210, 90, 0.18]; e.awake = false; e.summoned = false; e.m11t = -1;
    G.enemies.push(e); G.totalEnemies = (G.totalEnemies || 0) + 1; C.thief = e;
  }
  function thiefDown(e) {
    const n0 = 20 + 8 * (RUN.stage | 0); let n = n0; if (typeof shardGain === 'function') n = shardGain(n0, null) || n0;
    st.thief++; RUN.m11thief = (RUN.m11thief || 0) + 1; C.thief = null;
    toast('THIEF SLAIN  +' + n + ' SHARDS', 'The stolen purse is yours', '#ffd860', 2.6); SFX.play('glint', 1); SFX.later && SFX.later('pickup_shards', 0.12, 0.9);
    for (let i = 0; i < 30; i++) addP({ k: 'spark', x: e.x, y: e.y, z: e.z + 0.4, vx: M11.fa(-3, 3), vy: M11.fa(-3, 3), vz: M11.fa(1, 5), size: 0.04, col: i % 2 ? RGB(255, 220, 90) : RGB(255, 250, 200), life: 0.8 });
    M11.light(e.x, e.y, 3.5, [1, 0.85, 0.3], 1, 0.6); M11.fx({ k: 'ring', x: e.x, y: e.y, z: floorAt(e.x, e.y), life: 0.6, sz: 2.2, col: [255, 216, 96] });
  }
  function thiefTick(e, dt) {
    if (!e.alive) return;
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
    if (e.m11t < 0) { e.awake = false; e.atk = null; if (d < 9 && losTo(P.x, P.y, e.x, e.y)) { e.m11t = 0; toast('A RELIQUARY THIEF!', 'Catch him before he vanishes', '#ffd860', 2.2); SFX.play('screech', 0.5); M11.sfx && M11.sfx('m11_thief', 0.8); } return; }
    e.m11t += dt; e.awake = false; e.atk = null; e.state = 'idle'; e.cd = 9;
    if (e.m11t > 15) { // escape
      for (let i = 0; i < 24; i++) addP({ k: 'smoke', x: e.x + M11.fa(-0.3, 0.3), y: e.y + M11.fa(-0.3, 0.3), z: e.z + M11.fa(0, 0.6), vx: 0, vy: 0, vz: 0.4, size: 0.1, col: RGB(120, 100, 130), life: 0.8 });
      e.alive = false; e.dead = true; e.hidden = true; e.deathType = 'gone'; G.totalEnemies = Math.max(0, (G.totalEnemies || 1) - 1); C.thief = null; st.thiefLost++;
      toast('THE THIEF ESCAPED', 'His purse went with him', '#c0a060', 2); SFX.play('ghost', 0.5); M11.sfx && M11.sfx('m11_thief', 0.55); return;
    }
    // flee: away from you, sliding along walls, with a jink; slower than your sprint so he can be caught
    const sp = 3.0 * (e.chillT > 0 ? 0.6 : 1) * (e.iceT > 0 ? 0 : 1);
    let a = Math.atan2(dy, dx) + Math.sin(e.m11t * 2.3 + e.x) * 0.6;
    for (let tries = 0; tries < 6; tries++) {
      const nx = e.x + Math.cos(a) * sp * dt, ny = e.y + Math.sin(a) * sp * dt;
      if (!isSolid(cellAt(nx, ny)) && !isSolid(cellAt(nx + Math.cos(a) * 0.4, ny + Math.sin(a) * 0.4))) { e.x = nx; e.y = ny; break; }
      a += (tries % 2 ? -1 : 1) * (0.7 + tries * 0.35);
    }
    e.flip = Math.cos(a) < 0; e.walk = (e.walk || 0) + dt * 8;
    if (M11.fr() < dt * 10) addP({ k: 'spark', x: e.x, y: e.y, z: e.z + 0.2, vx: 0, vy: 0, vz: -0.6, size: 0.03, col: RGB(255, 215, 90), life: 0.6 });
  }
  // ---------- stage start: thief + shrine ----------
  M9.on('stage', () => {
    C.pact = 0; C.thief = null; C.nova.length = 0; P.m11wrath = 0;
    if (!RUN.on || RUN.hub || !LEVEL || !G.pickups || (RUN.stage | 0) > 10) return;
    try {
      if ((RUN.stage | 0) >= 2) spawnThief();
      if ((RUN.stage | 0) >= 3) {
        const rnd = seeded(202); if (rnd() < 0.34) { const cand = spots(rnd, 7, 30); if (cand.length) { const k = cand[(rnd() * cand.length) | 0]; G.pickups.push({ type: 'm11shrine', x: k[0] + 0.5, y: k[1] + 0.5, z: floorAt(k[0] + 0.5, k[1] + 0.5), t: 0, taken: false, vz: 0, drop: false }); } }
      }
    } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11c stage', err); } }
  });
  // ---------- per-frame (sim time: respects hit-stop and slow-mo) ----------
  const _up = update;
  update = function (dt) {
    const r = _up.apply(this, arguments);
    try {
      if (G.state !== 'play') return r;
      if (P.m11wrath > 0) { P.m11wrath -= dt; if (M11.fr() < dt * 12) addP({ k: 'ember', x: P.x + M11.fa(-0.4, 0.4), y: P.y + M11.fa(-0.4, 0.4), z: P.z + M11.fa(0.2, 1.0), vx: 0, vy: 0, vz: 1, size: 0.03, col: RGB(255, 50, 70), life: 0.5 }); }
      if (C.thief) thiefTick(C.thief, dt);
      for (let i = C.nova.length - 1; i >= 0; i--) {
        const n = C.nova[i]; if (n.t === 0) { M11.fx({ k: 'ring', x: n.x, y: n.y, z: floorAt(n.x, n.y), life: 0.7, sz: n.R, col: [255, 120, 30] }); SFX.play('fire', 0.6); }
        n.t += dt;
        if (n.t >= 0.7) {
          C.nova.splice(i, 1); M10 && M10.burst && M10.burst(n.x, n.y, floorAt(n.x, n.y), 'fire', n.R);
          for (let k = 0; k < 30; k++) addP({ k: 'ember', x: n.x, y: n.y, z: floorAt(n.x, n.y) + 0.3, vx: M11.fa(-4, 4), vy: M11.fa(-4, 4), vz: M11.fa(0.5, 3), size: M11.fa(0.04, 0.08), col: [RGB(255, 240, 140), RGB(255, 140, 30), RGB(255, 60, 20)][k % 3], life: M11.fa(0.3, 0.7) });
          SFX.play('fire', 1); M11.sfx && M11.sfx('m11_nova', 1); G.shake += 3;
          if (Math.hypot(P.x - n.x, P.y - n.y) < n.R && P.hp > 0) hurtPlayer(n.dmg, n.x, n.y, { unblockable: false, nopd: false });
        }
      }
    } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11c update', err); } }
    return r;
  };
  // telegraph: blazing auras + ward bubble + thief glint + shrine glow (sprites, world layer)
  const _rs = rogueSprites;
  rogueSprites = function (S, t) {
    _rs.apply(this, arguments);
    for (const e of G.enemies) {
      if (!e.alive || e.hidden) continue;
      if (e.ward > 0) S.push({ tex: 'glow_w', x: e.x, y: e.y, z: e.z + e.h * 0.15, w: e.w * 1.25, h: e.h * 1.15, add: true, alpha: 0.12 + 0.06 * e.ward + 0.05 * Math.sin(t * 6), lit: false, tint: [120, 230, 255, 1] });
      if (e.blaze) S.push({ tex: 'flame' + (((t * 12) | 0) % 4), x: e.x, y: e.y, z: e.z + e.h * 0.9, w: 0.25, h: 0.35, lit: false, glow: 0.3, rim: 0 });
      if (e.m11thief) S.push({ tex: 'glow_w', x: e.x, y: e.y, z: e.z - 0.05, w: 0.9, h: 0.9, add: true, alpha: 0.35 + 0.15 * Math.sin(t * 8), lit: false, tint: [255, 210, 80, 1] });
    }
    for (const n of C.nova) S.push({ tex: 'glow_w', x: n.x, y: n.y, z: floorAt(n.x, n.y), w: n.R * 2 * (0.4 + n.t), h: 0.5, add: true, alpha: 0.5 * Math.min(1, n.t / 0.7), lit: false, tint: [255, 100, 20, 1] });
  };
  // HUD: pact + wrath status chips under the stage label
  const _rh = drawRunHUD;
  drawRunHUD = function (ctx) {
    const r = _rh.apply(this, arguments);
    try {
      if (!RUN.on || G.state !== 'play') return r;
      let y = 96; const X = W - 80;
      if (C.pact) { ctx.fillStyle = 'rgba(40,0,10,0.75)'; ctx.fillRect(X, y, 76, 11); ctx.fillStyle = '#ff3050'; ctx.fillRect(X, y, 2, 11); text(ctx, 'BLOOD PACT', X + 4, y + 2, '#ff6070'); y += 13; }
      if (P.m11wrath > 0) { ctx.fillStyle = 'rgba(40,0,10,0.75)'; ctx.fillRect(X, y, 76, 11); ctx.fillStyle = '#ff5070'; ctx.fillRect(X, y + 9, Math.max(0, 76 * P.m11wrath / 12), 2); text(ctx, 'WRATH', X + 4, y + 1, (G.t * 6 | 0) % 2 ? '#ffffff' : '#ff8090'); }
    } catch (err) { }
    return r;
  };
})();
