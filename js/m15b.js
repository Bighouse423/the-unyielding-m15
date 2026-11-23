'use strict';
// ===== m15b: NEW SET PIECES =====
// THE PENDULUM NAVE (stage 1): great rune-etched blades swing across the castle aisle between the pillars. Their arc glows on the
//   flagstones and brightens as each blade comes down; time your run between them.
// THE FLAYING GALLERY (stage 8, Abyss): the same blades in a kennel gallery, three in a row, out of step with each other.
// THE HALL OF JUDGING SAINTS (stage 10, Abyss): weeping saint statues line the walls. One at a time their eyes kindle and their lane
//   lights up across the floor; a heartbeat later it burns. Step out of the lit lane.
// These are overlays: they never move a wall, so the path can not be cut (no rebuild, no flood-fill needed). Seeded from the stage seed.
// ?m15=0 (or ?m15rooms=0) -> m14 exactly.
(function () {
  const Q = location.search;
  const M15 = window.M15 = window.M15 || {};
  const ON = !/[?&]m15=0/.test(Q) && !/[?&]m15rooms=0/.test(Q) && !!(window.M14B && M14B.on);
  M15.roomsOn = ON; M15.rooms = []; M15.haz = []; M15.props = []; M15.errB = null; M15.log = [];
  if (!ON) return;
  const NAMES = {
    nave: ['THE PENDULUM NAVE', 'Watch the floor. The blades come down where it glows.'],
    pend: ['THE FLAYING GALLERY', 'Count the swings. They are not in step.'],
    saints: ['THE HALL OF JUDGING SAINTS', 'When a saint\'s eyes kindle, leave its lane.'],
  };
  const COL = { nave: [255, 150, 70], pend: [255, 150, 70], saints: [255, 225, 140] };
  const PLAN = { 8: 'pend', 10: 'saints' };
  const idx = (x, y) => y * MW + x;
  const open = (x, y) => { if (x < 0 || y < 0 || x >= MW || y >= MH) return false; const i = idx(x, y); return !SOLID[i] && Math.abs(FH[i]) < 0.05; };
  function reset() { M15.rooms = []; M15.haz = []; M15.props = []; M15.log = []; }
  function addRoom(type, box, extra) { const nm = NAMES[type]; M15.rooms.push(Object.assign({ type, box, name: nm[0], sub: nm[1], col: COL[type], seen: false }, extra || {})); return M15.rooms.length - 1; }
  // a pendulum: pivot over (cx, cy), swings along 'ax' ('x' or 'y') with amplitude amp; top = pivot height
  function pend(room, cx, cy, ax, amp, top, ph, per) { M15.haz.push({ k: 'pend', room, cx, cy, ax, amp, top, ph, per, L: Math.max(1.6, top - 0.75), cd: 0, wh: 0 }); }
  // ---------- stage 1: the nave aisle ----------
  function nave(R) {
    // the aisle: the longest north-south run of open floor in the middle third of the map, then rows flanked by the pillars
    let best = null;
    for (let x = Math.floor(MW * 0.3); x < Math.floor(MW * 0.7); x++) { let run = 0, y1 = 0; for (let y = 0; y < MH; y++) { if (open(x, y)) { run++; if (!best || run > best.n) best = { x, n: run, y1: y }; } else run = 0; } }
    if (!best || best.n < 12) return;
    const ax = best.x, ys = best.y1 - best.n + 1, ye = best.y1;
    // centre of the aisle at this column: widen while the neighbours are open on most rows
    let lo = ax, hi = ax; const rowOpen = (x) => { let k = 0; for (let y = ys; y <= ye; y++) if (open(x, y)) k++; return k / (ye - ys + 1); };
    while (rowOpen(lo - 1) > 0.95) lo--; while (rowOpen(hi + 1) > 0.95) hi++;
    const cx = (lo + hi + 1) / 2, amp = Math.max(1.0, Math.min(2.2, (hi - lo + 1) / 2 + 0.9));
    // swing lines: rows where the whole swing is open floor, away from the start and the far end, at least 4 rows apart
    const s0 = LEVEL.start, start = Array.isArray(s0) ? { x: s0[0], y: s0[1] } : (s0 && s0.x !== undefined ? s0 : { x: P.x, y: P.y });
    const rows = [];
    for (let y = ye - 4; y >= ys + 4; y--) {
      let ok = true; for (let x = Math.floor(cx - amp - 0.4); x <= Math.floor(cx + amp + 0.4); x++) if (!open(x, y)) { ok = false; break; }
      if (!ok || Math.hypot(cx - start.x, y + 0.5 - start.y) < 6) continue;
      if (rows.length && rows[rows.length - 1] - y < 4) continue;
      rows.push(y); if (rows.length >= 3) break;
    }
    if (rows.length < 2) { M15.log.push(['nave-skip', rows.length]); return; }
    const y0 = Math.min(...rows) - 1, y1 = Math.max(...rows) + 2;
    const room = addRoom('nave', [Math.floor(cx - amp - 1), y0, Math.ceil(cx + amp + 1), y1]);
    rows.forEach((y, i) => { const top = Math.min(CH[idx(Math.floor(cx), y)] || 3.8, 4.4) - 0.1; pend(room, cx, y + 0.5, 'x', amp, top, i * 2.1 + R() * 0.4, 2.6 + i * 0.15); });
    M15.log.push(['nave', rows.join(','), cx, amp]);
  }
  // ---------- crypt stages: pick a plain room that m14b did not take ----------
  function pickRoom(R) {
    const rooms = LEVEL.rooms || []; const taken = new Set((M14B.rooms || []).map(r => r.id));
    const path = rooms.filter(r => r.kind === 'path'); const lastP = path[path.length - 1];
    const er = LEVEL.eliteRoom && LEVEL.eliteRoom.box;
    const ok = rooms.filter(r => r.kind === 'path' && r.style !== 'start' && r !== lastP && !taken.has(r.id) && !r.ledge && r.x1 - r.x0 >= 4 && r.y1 - r.y0 >= 4
      && !(er && r.x0 < er[2] && r.x1 >= er[0] && r.y0 < er[3] && r.y1 >= er[1]));
    ok.sort((a, b) => (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) - (a.x1 - a.x0 + 1) * (a.y1 - a.y0 + 1) || a.id - b.id);   // the big rooms show a set piece best
    if (ok.length > 1 && R() < 0.5) { const t = ok[0]; ok[0] = ok[1]; ok[1] = t; }
    return ok.slice(0, 6);
  }
  function pendRoom(r, R) {
    const w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1;
    // try both orientations: blades stand in a row along one axis and swing across it; every swing line must be clear floor
    const plan = (along) => {
      const span = along === 'x' ? h : w, amp = Math.max(1.0, Math.min(2.4, span / 2 - 0.4));
      const mid = along === 'x' ? (r.y0 + r.y1 + 1) / 2 : (r.x0 + r.x1 + 1) / 2;
      const a0 = along === 'x' ? r.x0 : r.y0, a1 = along === 'x' ? r.x1 : r.y1, got = [];
      for (let a = a0 + 1; a <= a1 - 1; a++) {
        if (got.length && a - got[got.length - 1] < 2) continue;
        let ok = true; for (let q = Math.floor(mid - amp - 0.3); q <= Math.floor(mid + amp + 0.3); q++) { const x = along === 'x' ? a : q, y = along === 'x' ? q : a; if (!open(x, y)) { ok = false; break; } }
        if (ok) got.push(a);
      }
      return { along, amp, mid, got: got.slice(0, 3) };
    };
    const A = plan('x'), B = plan('y'); const pl = (B.got.length > A.got.length || (B.got.length === A.got.length && h > w)) ? B : A;
    if (pl.got.length < 2) return false;
    const room = addRoom('pend', [r.x0, r.y0, r.x1 + 1, r.y1 + 1]);
    pl.got.forEach((a, n) => {
      const cx = pl.along === 'x' ? a + 0.5 : pl.mid, cy = pl.along === 'x' ? pl.mid : a + 0.5;
      const top = Math.min(CH[idx(Math.floor(cx), Math.floor(cy))] || r.ch || 4, 4.6) - 0.1;
      pend(room, cx, cy, pl.along === 'x' ? 'y' : 'x', pl.amp, top, n * 1.9 + R() * 0.5, 2.5 + (n % 2) * 0.35);
    });
    LEVEL.lights.push({ x: (r.x0 + r.x1 + 1) / 2, y: (r.y0 + r.y1 + 1) / 2, r: Math.max(w, h) * 0.75, i: 0.7, c: [1.0, 0.55, 0.3] });
    return true;
  }
  function saintsRoom(r, R, flip) {
    const w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1, lanesX = flip ? w < h : w >= h;   // lanes run along the long axis; statues stand at both ends
    const room = addRoom('saints', [r.x0, r.y0, r.x1 + 1, r.y1 + 1]); let n = 0;
    const b0 = lanesX ? r.y0 : r.x0, b1 = lanesX ? r.y1 : r.x1;
    let lastB = -9;
    for (let b = b0; b <= b1; b++) {
      if (b - lastB < 2) continue;
      const west = (n % 2) === 0;
      let sx = lanesX ? (west ? r.x0 : r.x1) : b, sy = lanesX ? b : (west ? r.y0 : r.y1);
      if (!open(sx, sy)) { sx += lanesX ? (west ? 1 : -1) : 0; sy += lanesX ? 0 : (west ? 1 : -1); }
      if (!open(sx, sy)) continue;
      // keep doorways clear: no statue on a cell with open floor outside the room next to it
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => { const x = sx + ox, y = sy + oy; return (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) && open(x, y); })) continue;
      // is the lane open floor end to end (no wall in the middle)? statues need a clear line
      let len = 0; for (let a = 1; a < (lanesX ? w : h); a++) { const x = sx + (lanesX ? (west ? a : -a) : 0), y = sy + (lanesX ? 0 : (west ? a : -a)); if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1 || !open(x, y)) break; len++; }
      if (len < 3) continue; lastB = b;
      const dx = lanesX ? (west ? 1 : -1) : 0, dy = lanesX ? 0 : (west ? 1 : -1);
      const px = sx + 0.5 - dx * 0.15, py = sy + 0.5 - dy * 0.15;
      M15.props.push({ tex: 'p_m15saint', x: px, y: py, z: 0, w: 0.78, h: 1.75 });
      M15.haz.push({ k: 'saint', room, x: px, y: py, dx, dy, len, ph: 0, t: 0, eye: 1.48 });
      n++;
    }
    if (n < 2) { M15.props.length = 0; M15.haz = M15.haz.filter(z => z.room !== room); M15.rooms.pop(); return false; }
    LEVEL.lights.push({ x: (r.x0 + r.x1 + 1) / 2, y: (r.y0 + r.y1 + 1) / 2, r: Math.max(w, h) * 0.75, i: 0.6, c: [1.0, 0.85, 0.55] });
    return true;
  }
  const _bc = buildCrypt;
  buildCrypt = function (theme, seed) {
    const r = _bc.apply(this, arguments);
    try {
      reset();
      if (!RUN.on || RUN.hub || (RUN.cfg && (RUN.cfg.m13sanct || RUN.cfg.n === 1))) return r;
      const R = mulberry(((seed | 0) ^ 0x15b15b) >>> 0);
      let type = RUN.cfg.abyss ? (R() < 0.5 ? (R() < 0.5 ? 'pend' : 'saints') : null) : PLAN[RUN.stage];
      if (M15.forceRoom) type = M15.forceRoom;
      if (!type || type === 'nave') return r;
      const cands = pickRoom(R); if (!cands.length) { M15.log.push(['no-room', type]); return r; }
      let ok = false;
      for (const room of cands) { ok = type === 'pend' ? pendRoom(room, R) : (saintsRoom(room, R) || saintsRoom(room, R, true)); M15.log.push([ok ? 'ok' : 'fail', type, room.id]); if (ok) break; }
      if (ok) try { buildLightmap(LEVEL.lights, (theme && theme.ambient) || [0.34, 0.4, 0.36]); } catch (e) { }
    } catch (e) { M15.errB = String(e && e.stack || e); }
    return r;
  };
  const _bs = buildStage;
  buildStage = function () { reset(); return _bs.apply(this, arguments); };
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    const r = _rsp.apply(this, arguments);
    try {
      if (RUN.on && !RUN.hub && RUN.stage === 1 && !RUN.cfg.abyss && RUN.cfg.theme === 'nave' && !M15.rooms.length) nave(mulberry(((RUN.seed | 0) ^ 0x15b001) >>> 0));
    } catch (e) { M15.errB = String(e && e.stack || e); }
    return r;
  };
  // ---------- hazards ----------
  const inBox = (b, x, y, m = 0) => x >= b[0] - m && x < b[2] + m && y >= b[1] - m && y < b[3] + m;
  const env = (dmg, x, y) => { try { return hurtPlayer(dmg, x, y, { src: 'trap', unblockable: true, nopd: true, env: true }); } catch (e) { return null; } };
  function bladeAt(z, t) {   // the blade's centre and how low it is (1 = bottom of the swing)
    const s = Math.sin((t + z.ph) / z.per * TAU), off = z.amp * s, low = 1 - Math.abs(s);
    const zz = z.top - z.L * Math.cos(Math.asin(clamp(off / z.L, -0.95, 0.95)));
    return { x: z.ax === 'x' ? z.cx + off : z.cx, y: z.ax === 'y' ? z.cy + off : z.cy, z: zz, low, v: Math.cos((t + z.ph) / z.per * TAU) };
  }
  M15.bladeAt = bladeAt;
  function tick(dt) {
    if (!M15.rooms.length) return;
    const t = G.time;
    for (const rm of M15.rooms) if (!rm.seen && inBox(rm.box, P.x, P.y, -0.3)) { rm.seen = true; try { toast(rm.name, rm.sub, '#' + rm.col.map(v => v.toString(16).padStart(2, '0')).join(''), 2.6); } catch (e) { } }
    for (const z of M15.haz) {
      const rm = M15.rooms[z.room]; if (!inBox(rm.box, P.x, P.y, 4)) continue;
      if (z.k === 'pend') {
        const b = bladeAt(z, t); z.cd -= dt;
        // whoosh as it sweeps through the bottom near you
        if (b.low > 0.9 && t - z.wh > z.per * 0.4 && Math.hypot(P.x - b.x, P.y - b.y) < 5) { z.wh = t; SFX.play('swing', 0.35 + 0.3 * (1 - Math.hypot(P.x - b.x, P.y - b.y) / 5)); }
        const across = z.ax === 'x' ? Math.abs(P.y - z.cy) : Math.abs(P.x - z.cx), along = z.ax === 'x' ? Math.abs(P.x - b.x) : Math.abs(P.y - b.y);
        if (z.cd <= 0 && across < 0.42 && along < 0.5 && b.z < P.z + 1.4 && b.z > P.z - 0.3) {
          z.cd = 0.9; const r = env(9, b.x, b.y);
          if (r === 'hit') { const k = 7 * Math.sign(b.v || 1); if (z.ax === 'x') P.vx += k; else P.vy += k; try { sparks(P.x, P.y, P.z + 1, 10, RGB(255, 60, 40)); } catch (e) { } SFX.play('heavy', 0.6); }
        }
        // enemies caught in the swing get cut too
        if (b.low > 0.6) for (const e of G.enemies) if (e.alive && !e.d.boss && !e.m13mini && Math.abs((z.ax === 'x' ? e.y - z.cy : e.x - z.cx)) < 0.45 && Math.abs((z.ax === 'x' ? e.x - b.x : e.y - b.y)) < 0.5 && (!e.m15pc || t - e.m15pc > 0.9)) { e.m15pc = t; try { damageEnemy(e, 25, { src: 'trap' }); } catch (er) { } }
      } else if (z.k === 'saint') {
        if (!inBox(rm.box, P.x, P.y, 0)) { if (z.ph === 0) continue; }
        z.t += dt;
        if (z.ph === 0) {   // one saint at a time per room, in turn
          if (rm.busy || t - (rm.last || -9) < 1.6) continue;
          const all = M15.haz.filter(q => q.room === z.room && q.k === 'saint'); rm.turn = (rm.turn || 0); if (all[rm.turn % all.length] !== z) continue;
          rm.turn++; rm.busy = true; z.ph = 1; z.t = 0; SFX.play('ghost', 0.5); SFX.play('heal', 0.25);
        } else if (z.ph === 1 && z.t > 1.15) { z.ph = 2; z.t = 0; z.hit = false; SFX.play('fire', 0.9); G.shake = Math.max(G.shake, 1.5); }
        else if (z.ph === 2) {
          const ox = P.x - z.x, oy = P.y - z.y, along = ox * z.dx + oy * z.dy, across = Math.abs(ox * z.dy - oy * z.dx);
          if (!z.hit && along > 0.2 && along < z.len + 0.2 && across < 0.55 && P.z - floorAt(P.x, P.y) < 1.3) { z.hit = true; env(12, P.x, P.y); }
          if (Math.random() < 0.6) { const a = rand(0.4, z.len); addP({ k: 'ember', x: z.x + z.dx * a + rand(-0.2, 0.2), y: z.y + z.dy * a + rand(-0.2, 0.2), z: rand(0.2, 1.4), vx: 0, vy: 0, vz: rand(1, 2.5), size: 0.06, col: RGB(255, 230, 150), life: 0.5 }); }
          if (z.t > 0.45) { z.ph = 0; z.t = 0; rm.busy = false; rm.last = t; }
        }
      }
    }
  }
  const _fi = frameInner;
  frameInner = function (now) { const r = _fi.apply(this, arguments); try { if (G.state === 'play' && RUN.on) tick(Math.min(0.05, G.m15blt ? (now - G.m15blt) / 1000 : 0.016)); G.m15blt = now; } catch (er) { M15.errB = String(er && er.stack || er); } return r; };
  // ---------- drawing ----------
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if ((G.state !== 'play' && G.state !== 'pause') || !M15.rooms.length) return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      for (const p of M15.props) { if (Math.abs(p.x - P.x) > 16 || Math.abs(p.y - P.y) > 16) continue; S.push({ tex: p.tex, x: p.x, y: p.y, z: p.z, w: p.w, h: p.h }); }
      for (const z of M15.haz) {
        if (Math.abs((z.cx || z.x) - P.x) > 16 || Math.abs((z.cy || z.y) - P.y) > 16) continue;
        if (z.k === 'pend') {
          const b = bladeAt(z, t), fz = floorAt(z.cx, z.cy);
          // the rod: a line of iron links from the pivot to the blade
          const px = z.cx, py = z.cy, pz = z.top;
          for (let i = 1; i <= 7; i++) { const f = i / 8; S.push({ tex: 'glow_w', x: px + (b.x - px) * f, y: py + (b.y - py) * f, z: pz + (b.z + 0.55 - pz) * f - 0.04, w: 0.07, h: 0.12, add: false, alpha: 1, lit: true, tint: [52, 44, 46, 1] }); }
          S.push({ tex: 'p_m15blade', x: b.x, y: b.y, z: b.z - 0.25, w: 1.05, h: 1.1 });
          // the arc on the floor: always faintly there, bright where and when the blade is coming down
          for (let i = -4; i <= 4; i++) { const o = i / 4 * z.amp; gl(z.ax === 'x' ? z.cx + o : z.cx, z.ax === 'y' ? z.cy + o : z.cy, fz + 0.02, 0.5, 0.2, 0.1 + 0.35 * b.low * (1 - Math.abs(i) / 5), [255, 130, 60]); }
          gl(b.x, b.y, fz + 0.03, 0.85, 0.26, 0.25 + 0.45 * b.low, b.low > 0.75 ? [255, 70, 40] : [255, 150, 70]);
        } else if (z.k === 'saint') {
          const fz = floorAt(z.x, z.y);
          if (z.ph === 1) {
            const k = clamp(z.t / 1.15, 0, 1);
            gl(z.x - 0.08, z.y, z.eye, 0.18 + 0.2 * k, 0.12 + 0.12 * k, 0.5 + 0.5 * k, [255, 230, 140]);
            gl(z.x + 0.08, z.y, z.eye, 0.18 + 0.2 * k, 0.12 + 0.12 * k, 0.5 + 0.5 * k, [255, 230, 140]);
            for (let a = 0.7; a < z.len; a += 0.7) gl(z.x + z.dx * a, z.y + z.dy * a, fz + 0.02, 0.75, 0.24, 0.12 + 0.5 * k * (0.7 + 0.3 * Math.sin(t * 20 + a)), [255, 225, 140]);
          } else if (z.ph === 2) {
            const k = 1 - z.t / 0.45;
            for (let a = 0.4; a < z.len; a += 0.45) gl(z.x + z.dx * a, z.y + z.dy * a, fz + 1.0, 0.75, 1.9, 0.55 * k, [255, 240, 190]);
            gl(z.x, z.y, z.eye, 0.6, 0.4, 0.9 * k, [255, 255, 220]);
          } else gl(z.x, z.y, z.eye, 0.16, 0.1, 0.18, [255, 200, 120]);
        }
      }
    } catch (e) { M15.errB = String(e && e.stack || e); }
    return S;
  };
})();
