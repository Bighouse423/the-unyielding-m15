// ===== m13c: BUILD-CHANGING RELICS =====
// Eight rare+ relics that change how a weapon behaves while you hold them (base weapons are untouched without them;
// the tier-I crossbow's numbers never change), four synergy pairs (shown with the M8 sets), Armory + Codex entries.
(function () {
  if (!window.M13 || !M13.on) return;
  const C = M13.C = { axes: [], fires: [] };
  const has = id => !!(P.mods && P.mods[id]);
  const syn = id => !!(window.SETS && SETS.on(id));
  const XB = () => P.wpn && P.wpn.ranged === 'crossbow';
  const swordMul = () => (P.mods && P.mods.sword) || 1;
  const near = (x, y, r, not) => { const out = []; for (const q of G.enemies) { if (!q.alive || q.hidden || (not && not.includes(q))) continue; const d = Math.hypot(q.x - x, q.y - y); if (d < r && losTo(x, y, q.x, q.y)) out.push([d, q]); } return out.sort((a, b) => a[0] - b[0]).map(a => a[1]); };
  const R = [
    { id: 'm13storm', r: 'rare', name: 'STORMCHAIN', icon: 'ic_m13storm', desc: 'Whip lashes ARC LIGHTNING to 2 more foes (12 dmg + whip bonus).', fl: 'A chain forged in a thunderstorm. It never quite stops humming.' },
    { id: 'm13split', r: 'epic', name: 'SPLITTING QUIVER', icon: 'ic_m13split', desc: 'Crossbow bolts SPLIT on the first foe: 2 shards seek the nearest foes (45% dmg).', fl: 'Every bolt in it was fletched twice. Nobody remembers why.', ok: () => XB() },
    { id: 'm13aegis', r: 'epic', name: 'MIRROR AEGIS', icon: 'ic_m13aegis', desc: 'BLOCKING a projectile hurls it back at the one who threw it.', fl: 'Polished so bright the dead cannot bear to look at it.' },
    { id: 'm13return', r: 'epic', name: 'RETURNING EDGE', icon: 'ic_m13return', desc: 'Battle Axe: heavy strikes hurl a SPINNING AXE that flies out and comes back (30 dmg each way).', fl: 'Throw it hard enough and it remembers whose hand it belongs in.', ok: () => P.wpn && P.wpn.sword === 'axe' },
    { id: 'm13blink', r: 'rare', name: 'BLINKSTEP SIGIL', icon: 'ic_m13blink', desc: 'Strike right after a roll: DASH-SLASH forward through foes (30 dmg to each).', fl: 'Etched on a stalker\'s skull. It lets you be somewhere else, fast.' },
    { id: 'm13cinder', r: 'epic', name: 'CINDER BRAND', icon: 'ic_m13cinder', desc: 'Emberbrand: every swing leaves a TRAIL OF FIRE on the floor that burns foes (20/s).', fl: 'A coal from the pyre, set in the pommel. It still wants to burn.', ok: () => P.wpn && P.wpn.sword === 'fire' },
    { id: 'm13rico', r: 'rare', name: 'RICOCHET SEAL', icon: 'ic_m13rico', desc: 'Sidearm shots RICOCHET twice to nearby foes (60%, then 40% dmg).', fl: 'Stamped on every shot. They bounce off bone like hail off a roof.', ok: () => !XB() },
    { id: 'm13wake', r: 'legendary', name: 'HEART OF THE WAKE', icon: 'ic_m13wake', desc: 'FINISHERS burst a BLOOD NOVA: 40 dmg to every foe nearby; heal 3 HP for each.', fl: 'It beats once for every life you end. Lately it never stops.' },
  ];
  C.R = R;
  for (const r of R) {
    if (UPG.some(u => u.id === r.id)) continue;
    UPG.push({ id: r.id, kind: 'RELIC', r: r.r, name: r.name, icon: r.icon, desc: r.desc, ok: () => !has(r.id) && (!r.ok || r.ok()),
      take() { P.mods[r.id] = 1; try { const s = SAVE.m9; s.m11arm = s.m11arm || {}; s.m11arm[r.id] = 1; M9.write(); } catch (e) { } M13.feat('m13_relic'); } });
  }
  // synergy pairs (two pieces = on), listed with the sets
  const SYN = [
    { id: 'm13tempest', n: 'TEMPEST', c: '#c890ff', ids: ['m13storm', 'm13rico'], sh: ['STORMCHAIN', 'RICOCHET SEAL'], d: 'Arcs and ricochets jump ONE MORE foe and STUN.' },
    { id: 'm13mirror', n: 'MIRROR VOLLEY', c: '#a0e8ff', ids: ['m13aegis', 'm13split'], sh: ['MIRROR AEGIS', 'SPLITTING QUIVER'], d: 'Reflected projectiles SPLIT into 3.' },
    { id: 'm13ashen', n: 'ASHEN STEP', c: '#ff9a40', ids: ['m13cinder', 'm13blink'], sh: ['CINDER BRAND', 'BLINKSTEP'], d: 'Dash-slashes leave a TRAIL OF FIRE.' },
    { id: 'm13harvest', n: 'RED HARVEST', c: '#ff4060', ids: ['m13wake', 'm13return'], sh: ['HEART OF THE WAKE', 'RETURNING EDGE'], d: 'The returning axe makes foes BLEED; the Wake nova reaches 50% farther.' },
  ];
  C.SYN = SYN;
  if (window.SETS) for (const s of SYN) if (!SETS.DEF.some(q => q.id === s.id)) SETS.DEF.push(s);
  // the sets page now holds 9 entries: two columns of compact cards (M8 sets left, m13 pairs right)
  if (window.SETS && SETS.drawPage) SETS.drawPage = function (ctx, L) {
    const cw = 204, cols = [30, W - 30 - cw]; const left = SETS.DEF.filter(s => !/^m13/.test(s.id)), right = SETS.DEF.filter(s => /^m13/.test(s.id));
    [left, right].forEach((list, ci) => {
      let y = L.PY + 34; const x = cols[ci];
      if (ci === 1) { text(ctx, 'RELIC PAIRS', x + cw / 2, y - 2, '#c890ff', 'center'); y += 10; }
      for (const s of list) {
        const tot = s.ids.length, n = SETS.have(s), on = n >= 2;
        text(ctx, s.n, x, y, on ? s.c : '#c8b8e0');
        text(ctx, on ? n + '/' + tot + ' ON' : n + '/' + tot, x + cw, y, on ? '#80ff90' : '#9080a8', 'right');
        const pcs = s.ids.map((id, i) => ((RUN.on && RUN.picks && RUN.picks.includes(id)) ? '+' : '-') + s.sh[i]).join('  ');
        fitBlock(ctx, pcs, x + 4, y + 10, cw - 4, 8, '#8a7aa0', 'left');
        fitBlock(ctx, (on ? '' : (tot === 2 ? 'BOTH: ' : '2 OF 3: ')) + s.d, x + 4, y + 19, cw - 4, 15, on ? '#ece0f4' : '#a898c0', 'left', 1, 8);
        y += 34;
      }
    });
  };
  // synergy feat
  M9.on('tick', () => { if (RUN.on && RUN.setsOn && RUN.setsOn.some(id => /^m13/.test(id))) M13.feat('m13_synergy'); });
  // Codex pages + Armory rows
  M13.addLore(['m13_relics', 'RELICS OF THE BLACK COURT', 'Eight relics the Court\'s champions carried. They do not make a weapon stronger. They make it something else: chains that call lightning, bolts that split, a shield that answers back. Some of them like each other.']);
  M9.on('tick', () => { if (RUN.on && RUN.picks && RUN.picks.some(id => /^m13/.test(id))) M13.lore('m13_relics'); });
  const _ar = M9.armoryRows;
  if (_ar) M9.armoryRows = function () { return _ar.apply(this, arguments).concat(R.map(r => ({ w: { id: r.id, name: r.name, icon: r.icon, r: r.r, desc: r.desc, fl: r.fl } }))); };

  // ---------- effects ----------
  let splitT = -1, ricoT = -1;
  const shard = (from, to, dmg, col, src, extra) => { addBolt(from.x, from.y, from.z + from.h * 0.6, to.x, to.y, to.z + to.h * 0.6, col, 1.2); damageEnemy(to, dmg, Object.assign({ dx: to.x - from.x, dy: to.y - from.y, dz: 0.1, kb: 1.2, src, col }, extra || {})); sparks(to.x, to.y, to.z + to.h * 0.6, 8, RGB(255, 240, 200)); };
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const alive0 = e.alive, r = _de.apply(this, arguments);
    try {
      if (!alive0 || !RUN.on || o.dot) return r;
      // STORMCHAIN: whip arcs
      if (o.src === 'whip' && has('m13storm')) stormArc(e, syn('m13tempest') ? 3 : 2, 12 * ((P.mods && P.mods.whip) || 1), syn('m13tempest'));
      // SPLITTING QUIVER: crossbow bolt splits once per shot
      if (o.src === 'pistol' && !o.rico && XB() && has('m13split') && G.time !== splitT) {
        splitT = G.time; const tg = near(e.x, e.y, 6, [e]).slice(0, 2);
        for (const t of tg) shard(e, t, dmg * 0.45, '#ffe8a0', 'm13split');
        if (tg.length) SFX.play('glint', 0.5);
      }
      // RICOCHET SEAL: sidearm shots bounce twice
      if (o.src === 'pistol' && !o.rico && !XB() && has('m13rico') && G.time !== ricoT) {
        ricoT = G.time; let from = e; const hit = [e]; const n = syn('m13tempest') ? 3 : 2, mul = [0.6, 0.4, 0.3];
        for (let k = 0; k < n; k++) { const t = near(from.x, from.y, 5, hit)[0]; if (!t) break; hit.push(t); shard(from, t, dmg * mul[k], '#c0e0ff', 'm13rico', { rico: true }); if (syn('m13tempest') && t.alive && !t.d.boss) { t.stun = 0.5; } from = t; }
        if (hit.length > 1) SFX.play('clink', 0.6);
      }
      // HEART OF THE WAKE: finisher nova
      if (o.finisher && has('m13wake')) wakeNova(e);
    } catch (er) { M13.err = String(er && er.stack || er); }
    return r;
  };
  GAME.dbg.damageEnemy = damageEnemy;
  function wakeNova(src) {
    const R0 = syn('m13harvest') ? 5.25 : 3.5; let n = 0;
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; addP({ k: 'blood', x: src.x, y: src.y, z: src.z + 0.6, vx: Math.cos(a) * R0 * 2, vy: Math.sin(a) * R0 * 2, vz: 1.2, size: 0.07, col: MAT.flesh[1], life: 0.5, mat: 'flesh' }); }
    for (const q of G.enemies) { if (q === src || !q.alive || q.hidden) continue; if (Math.hypot(q.x - src.x, q.y - src.y) < R0) { damageEnemy(q, 40 * swordMul(), { dot: true, src: 'm13wake', col: '#ff3050' }); n++; } }
    if (n) { P.hp = Math.min(P.maxhp, P.hp + 3 * n); dmgNum(P.x + Math.cos(P.ang), P.y + Math.sin(P.ang), P.z + 1.5, '+' + 3 * n + ' HP', '#ff8090'); }
    G.flashR = Math.max(G.flashR || 0, 0.15); SFX.play('gib', 0.6); try { SFX.ev('m13_wake', 0.8); } catch (e) { }
  }
  C.wakeNova = wakeNova;
  // sword swing hooks: RETURNING EDGE, BLINKSTEP, CINDER BRAND
  const _sh = swordHit;
  swordHit = function (step) {
    let dashed = false;
    try {
      if (RUN.on && has('m13blink') && P.dodgeAge < 0.4 && !G.finisher && G.time - (C.blinkT || -9) > 0.6) { C.blinkT = G.time; dashed = dashSlash(); }
    } catch (er) { M13.err = String(er && er.stack || er); }
    const r = _sh.apply(this, arguments);
    try {
      if (!RUN.on || G.finisher) return r;
      if (step === 2 && has('m13return') && P.wpn.sword === 'axe') throwAxe();
      if (has('m13cinder') && P.wpn.sword === 'fire') { const fw = { x: Math.cos(P.ang), y: Math.sin(P.ang) }, rt = { x: -fw.y, y: fw.x }; for (let i = -1; i <= 1; i++) addFire(P.x + fw.x * 1.3 + rt.x * i * 0.55, P.y + fw.y * 1.3 + rt.y * i * 0.55, 2.0); }
    } catch (er) { M13.err = String(er && er.stack || er); }
    return r;
  };
  function dashSlash() {
    const fw = { x: Math.cos(P.ang), y: Math.sin(P.ang) }; let d = 0; const hit = [];
    while (d < 2.6) { const nx = P.x + fw.x * 0.2, ny = P.y + fw.y * 0.2; if (blocked(nx, ny, P.z, PR, 0.32)) break; P.x = nx; P.y = ny; d += 0.2;
      for (const q of G.enemies) if (q.alive && !q.hidden && !hit.includes(q) && Math.hypot(q.x - P.x, q.y - P.y) < q.r + 0.7) hit.push(q);
      if (syn('m13ashen') && has('m13cinder')) addFire(P.x, P.y, 2.2);
      addP({ k: 'ecto', x: P.x, y: P.y, z: P.z + 0.9, vx: 0, vy: 0, vz: 0.2, size: 0.09, col: RGB(170, 110, 255), life: 0.4 });
    }
    for (const q of hit) damageEnemy(q, 30 * swordMul(), { dx: fw.x, dy: fw.y, dz: 0.2, kb: 2, src: 'm13dash', col: '#d0a0ff' });
    if (d > 0.3) { P.iframes = Math.max(P.iframes, 0.2); G.zoom = Math.max(G.zoom || 0, 0.06); SFX.play('swingH', 0.9); try { SFX.ev('m13_dash', 0.8); } catch (e) { } dmgNum(P.x + fw.x, P.y + fw.y, P.z + 1.4, 'DASH', '#d0a0ff'); }
    return d > 0.3;
  }
  C.dashSlash = dashSlash;
  function throwAxe() {
    const fw = { x: Math.cos(P.ang), y: Math.sin(P.ang) };
    C.axes.push({ x: P.x + fw.x * 0.6, y: P.y + fw.y * 0.6, z: P.z + 1.0, vx: fw.x * 9, vy: fw.y * 9, t: 0, back: false, hit: new Set(), dist: 0 });
    SFX.play('swingH', 0.8); try { SFX.ev('m13_axe', 0.8); } catch (e) { }
  }
  C.throwAxe = throwAxe;
  function addFire(x, y, dur) { const c = cellAt(x, y); if (c < 0 || SOLID[c]) return; if (C.fires.length > 40) C.fires.shift(); C.fires.push({ x, y, z: floorAt(x, y), t: 0, dur, tick: 0 }); }
  C.addFire = addFire;
  function tick(dt) {
    if (!RUN.on || G.state !== 'play') { if (G.state !== 'pause' && G.state !== 'play') { C.axes.length = 0; C.fires.length = 0; } return; }
    for (const a of C.axes) {
      a.t += dt;
      if (!a.back) { const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt, c = cellAt(nx, ny); a.dist += 9 * dt; if (a.dist > 6.5 || c < 0 || SOLID[c] || FH[c] > a.z) { a.back = true; a.hit = new Set(); } else { a.x = nx; a.y = ny; } }
      else { const dx = P.x - a.x, dy = P.y - a.y, d = Math.hypot(dx, dy) || 1; if (d < 0.6) { a.dead = true; continue; } const sp = Math.min(11, 4 + a.t * 6); a.x += dx / d * sp * dt; a.y += dy / d * sp * dt; a.z += (P.z + 1.0 - a.z) * Math.min(1, dt * 4); }
      if (a.t > 4) a.dead = true;
      for (const q of G.enemies) {
        if (!q.alive || q.hidden || a.hit.has(q)) continue;
        if (Math.hypot(q.x - a.x, q.y - a.y) < q.r + 0.45 && a.z > q.z - 0.2 && a.z < q.z + q.h + 0.2) {
          a.hit.add(q); damageEnemy(q, 30 * swordMul(), { dx: a.vx / 9, dy: a.vy / 9, dz: 0.1, kb: 1.5, src: 'm13axe', col: '#ffc070' });
          if (syn('m13harvest') && q.alive && typeof addBleed === 'function') addBleed(q, 3);
        }
      }
      if (Math.random() < dt * 30) addP({ k: 'spark', x: a.x, y: a.y, z: a.z, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), vz: rand(0, 1), size: 0.03, col: RGB(255, 200, 120), life: 0.25 });
    }
    C.axes = C.axes.filter(a => !a.dead);
    C.ftick = (C.ftick || 0) + dt;
    if (C.ftick >= 0.25 && C.fires.length) { // one burn tick per foe however many flames it stands in (20 dmg/s)
      C.ftick = 0;
      for (const q of G.enemies) if (q.alive && !q.hidden && !q.d.fly && C.fires.some(f => Math.hypot(q.x - f.x, q.y - f.y) < 0.75)) damageEnemy(q, 5, { dot: true, src: 'm13fire', col: '#ff9a30' });
    }
    for (const f of C.fires) {
      f.t += dt;
      if (Math.random() < dt * 8) addP({ k: 'ember', x: f.x + rand(-0.2, 0.2), y: f.y + rand(-0.2, 0.2), z: f.z + 0.1, vx: 0, vy: 0, vz: rand(0.8, 1.8), size: 0.04, col: RGB(255, 150, 40), life: 0.5 });
    }
    C.fires = C.fires.filter(f => f.t < f.dur);
    // MIRROR AEGIS: tag enemy projectiles so a block can throw them back
    if (has('m13aegis')) for (const p of G.projectiles) {
      if (p.m13w || p.reflected || p.type !== 'fireball') continue; p.m13w = true; const prev = p.onHit;
      p.onHit = function (res) { if (prev) prev.call(this, res); if (res === 'block' && has('m13aegis')) reflect(p); };
    }
  }
  function reflect(p) {
    const o = p.owner, a0 = o && o.alive ? Math.atan2(o.y - p.y, o.x - p.x) : P.ang, n = syn('m13mirror') ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i - (n - 1) / 2) * 0.22, q = Object.assign({}, p, { reflected: true, dead: false, life: 3, m13w: true, onHit: null });
      q.vx = Math.cos(a) * 9; q.vy = Math.sin(a) * 9; q.vz = o && o.alive ? ((o.z + o.h / 2) - p.z) / Math.max(0.5, Math.hypot(o.x - p.x, o.y - p.y)) * 9 : 0;
      G.projectiles.push(q);
    }
    dmgNum(P.x + Math.cos(P.ang), P.y + Math.sin(P.ang), P.z + 1.4, 'MIRRORED', '#a0e8ff'); SFX.play('parry', 0.5); try { SFX.ev('m13_mirror', 0.8); } catch (e) { }
  }
  C.reflect = reflect;
  const _fi = frameInner;
  frameInner = function (now) { try { tick(Math.min(0.05, (G.m13lt ? (now - G.m13lt) / 1000 : 0.016))); G.m13lt = now; } catch (e) { M13.err = String(e && e.stack || e); } return _fi.apply(this, arguments); };
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      const t = G.time;
      for (const a of C.axes) { S.push({ tex: 'ic_m13return', x: a.x, y: a.y, z: a.z - 0.4, w: 0.8, h: 0.8, flip: ((t * 14) | 0) % 2 === 0, lit: false, glow: 0.4 }); S.push({ tex: 'glow_w', x: a.x, y: a.y, z: a.z - 0.3, w: 0.8, h: 0.8, add: true, alpha: 0.35, lit: false, tint: [255, 190, 110, 1] }); }
      for (const f of C.fires) { const k = 1 - f.t / f.dur, fr = ((t * 12 + f.x * 3) | 0) % 4; S.push({ tex: 'flame' + fr, x: f.x, y: f.y, z: f.z, w: 0.35 * (0.6 + 0.4 * k), h: 0.6 * (0.6 + 0.4 * k), lit: false, glow: 0.4, rim: 0 }); S.push({ tex: 'glow_w', x: f.x, y: f.y, z: f.z - 0.1, w: 0.9, h: 0.3, add: true, alpha: 0.35 * k, lit: false, tint: [255, 120, 30, 1] }); }
    } catch (er) { }
    return S;
  };
})();
