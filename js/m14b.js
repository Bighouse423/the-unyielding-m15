'use strict';
// ===== M14b: SET-PIECE ROOMS + TELEGRAPHED HAZARDS =====
// After the crypt generator lays out a stage, one or two of its plain path rooms are rebuilt as a hand-authored set piece that
// fits the stage: a flooded chapter-house with gas vents, a chapel with pews and swaying chandeliers, a bridge over a chasm whose
// rotten planks give way, a fire-ring arena with flame grates, a haunted library maze where tomes fly off the shelves, a hedge maze.
// Every hazard telegraphs (glow + sound + particles) before it hurts. Rooms are validated with a flood fill from every doorway and
// rolled back if anything would cut the path. Seeded from the stage seed, so a stage always rebuilds the same way.
// ?m14=0 (or ?m14rooms=0) turns all of it off.
(function () {
  const Q = location.search;
  const M14B = window.M14B = { on: !/[?&]m14=0/.test(Q) && !/[?&]m14rooms=0/.test(Q) && !!(window.M13 && M13.on), rooms: [], haz: [], props: [], err: null, force: null, log: [] };
  if (!M14B.on) return;
  const SP = {
    crypt: ['flooded', 'library'], ossuary: ['chapel', 'bridge'], courtyard: ['hedge', 'flooded'], belfry: ['bridge', 'chapel'],
    arena: ['ring', 'bridge'], necropolis: ['library', 'flooded'], kennels: ['ring', 'bridge'], cathedral: ['chapel', 'library'],
    throne: ['library', 'ring'], abyss: ['bridge', 'ring', 'library', 'flooded', 'chapel'],
  };
  const NAMES = {
    flooded: [['THE DROWNED CHAPTER-HOUSE', 'Mind the bubbles. The dead still breathe down there.'], ['THE SUNKEN NAVE', 'Something rots under the water.']],
    chapel: [['THE CHAPEL OF THE LAST PEW', 'The chandeliers have not been lit in an age.'], ['THE MOURNERS\' CHAPEL', 'Listen for the chains above.']],
    bridge: [['THE RINGER\'S BRIDGE', 'The planks are older than the bells. Some will not hold.'], ['THE CHASM WALK', 'Do not trust the rotten boards.']],
    ring: [['THE FIRE RING', 'The grates breathe flame. Watch them glow.'], ['THE PIT OF CHAMPIONS', 'The crowd is long dead. The fire is not.']],
    library: [['THE FORBIDDEN STACKS', 'The books here have teeth.'], ['THE WITCH\'S ARCHIVE', 'Something turns the pages.']],
    hedge: [['THE MOONLIT MAZE', 'The hedges were planted for funerals.'], ['THE WIDOW\'S GARDEN', 'Every path leads back to the fountain.']],
  };
  const COL = { flooded: [90, 220, 200], chapel: [255, 200, 120], bridge: [210, 160, 255], ring: [255, 120, 50], library: [150, 255, 170], hedge: [170, 200, 255] };
  const fidx = (t) => { if (!t) return 0; let k = FLOORTEX.indexOf(t); if (k < 0) { FLOORTEX.push(t); k = FLOORTEX.length - 1; } return k; };
  const widx = (t, tall) => { if (!t) return 0; let k = WALLDEFS.findIndex(d => d.base === t && !d.tall && !d.m14 === !tall); if (k < 0) { WALLDEFS.push({ base: t, tall: null }); k = WALLDEFS.length - 1; } return k; };

  function setPieces(theme, seed) {
    M14B.rooms = []; M14B.haz = []; M14B.props = []; M14B.log = [];
    if (!RUN.on || RUN.hub || (RUN.cfg && (RUN.cfg.m13sanct || RUN.cfg.n === 1)) || !LEVEL.rooms) return;
    const key = theme.variant || RUN.cfg.theme; const list = SP[key] || SP.crypt; if (!list) return;
    const R = mulberry(((seed | 0) ^ 0x14b14b) >>> 0); const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const T = Engine.tex; const idx = (x, y) => y * MW + x;
    const rooms = LEVEL.rooms; const halls = new Set(); rooms.forEach(r => { if (r.hallWith !== undefined) { halls.add(r.id); halls.add(r.hallWith); } });
    const cand = rooms.filter(r => r.kind === 'path' && r.style !== 'start' && !halls.has(r.id) && !r.ledge && r.x1 - r.x0 >= 4 && r.y1 - r.y0 >= 4 && r !== rooms[rooms.length - 1]);
    // keep the room next to the elite room's corridor and the boss approach: skip the last path room
    const path = rooms.filter(r => r.kind === 'path'); const lastP = path[path.length - 1];
    const pool = cand.filter(r => r !== lastP).sort((a, b) => a.id - b.id);
    if (!pool.length) return;
    let n = 1 + (pool.length >= 3 && R() < 0.5 ? 1 : 0);
    const types = list.slice(); if (key === 'abyss') types.sort(() => R() - 0.5);
    const picked = [];
    for (let k = 0; k < n && pool.length; k++) {
      const type = M14B.force ? (Array.isArray(M14B.force) ? M14B.force[k % M14B.force.length] : M14B.force) : types[k % types.length];
      let ri0 = Math.floor(R() * pool.length);
      if (type === 'bridge' || type === 'ring') { let ba = 0; pool.forEach((q, j) => { const a = (q.x1 - q.x0 + 1) * (q.y1 - q.y0 + 1); if (a > ba) { ba = a; ri0 = j; } }); }   // the big rooms make the best chasms and arenas
      const r = pool.splice(ri0, 1)[0];
      if (build(r, type, key, R, ri, T, idx)) picked.push(r);
    }
    if (picked.length) { try { buildLightmap(LEVEL.lights, theme.ambient || [0.34, 0.4, 0.36]); } catch (e) { } }
  }

  // ---------- one room ----------
  function build(r, type, key, R, ri, T, idx) {
    const x0 = r.x0, y0 = r.y0, x1 = r.x1, y1 = r.y1, w = x1 - x0 + 1, h = y1 - y0 + 1;
    const cx = Math.floor((x0 + x1) / 2), cy = Math.floor((y0 + y1) / 2);
    // snapshot (room + 1-cell ring)
    const snap = []; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { const i = idx(x, y); snap.push([i, SOLID[i], FH[i], CH[i], FT[i], WT[i], CT[i]]); }
    const restore = () => { for (const s of snap) { const i = s[0]; SOLID[i] = s[1]; FH[i] = s[2]; CH[i] = s[3]; FT[i] = s[4]; WT[i] = s[5]; CT[i] = s[6]; } };
    const inR = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
    const op = (x, y) => !SOLID[idx(x, y)];
    // doorways: room-edge cells with an open neighbour outside the room
    const doors = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (x > x0 && x < x1 && y > y0 && y < y1) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ax = x + dx, ay = y + dy; if (!inR(ax, ay) && op(ax, ay) && FH[idx(ax, ay)] > -0.5) { doors.push([x, y]); break; } } }
    if (!doors.length) return false;
    // clear the old dressing: flat floor, no pillars
    const baseFT = FT[idx(cx, cy)] === 3 ? 0 : FT[idx(cx, cy)];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); SOLID[i] = 0; FH[i] = 0; FT[i] = baseFT; WT[i] = 0; }
    const lights = [], props = [], haz = [];
    const set = (x, y, fh, ft, wt) => { if (!inR(x, y)) return; const i = idx(x, y); SOLID[i] = 0; FH[i] = fh; if (ft !== undefined) FT[i] = ft; if (wt !== undefined) WT[i] = wt; };
    const wall = (x, y, wt) => { if (!inR(x, y)) return; const i = idx(x, y); SOLID[i] = 1; FH[i] = 99; WT[i] = wt; };
    const doorNear = (x, y, d) => doors.some(([dx, dy]) => Math.abs(dx - x) + Math.abs(dy - y) <= d);
    const C = COL[type];
    if (type === 'flooded') {
      const water = fidx(T.f_m14water || T.f_bog), stone = fidx(T.f_crypt2 || T.f_flag), sarc = widx(T.t_sarc), lid = fidx(T.f_lid || T.f_marble);
      for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) if (x !== cx && y !== cy) set(x, y, -0.32, water, widx(T.t_crypt2 || T.t_stone2));
      for (let x = x0; x <= x1; x++) set(x, cy, 0, stone); for (let y = y0; y <= y1; y++) set(cx, y, 0, stone);
      // sarcophagus islands in the water
      const q = [[x0 + 1, y0 + 1], [x1 - 1, y0 + 1], [x0 + 1, y1 - 1], [x1 - 1, y1 - 1]];
      for (const [qx, qy] of q) if (qx !== cx && qy !== cy && R() < 0.75) set(qx, qy, 0.7, lid, sarc);
      // gas vents bubbling up through the water
      const spots = []; for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) if (FH[idx(x, y)] < 0 && !doorNear(x, y, 1)) spots.push([x, y]);
      for (let k = 0; k < Math.min(3, spots.length); k++) { const s = spots.splice(Math.floor(R() * spots.length), 1)[0]; haz.push({ k: 'gas', x: s[0] + 0.5, y: s[1] + 0.5, per: 4.5 + R() * 2, t: R() * 3, ph: 0 }); }
      lights.push({ x: cx + 0.5, y: cy + 0.5, r: Math.max(w, h) * 0.7, i: 0.75, c: [0.35, 0.9, 0.85] });
      props.push({ tex: 'candelabra', x: cx + 0.5, y: y0 + 0.5, z: 0, w: 0.5, h: 0.95, flame: 1 });
      for (let k = 0; k < 3; k++) { const x = ri(x0 + 1, x1 - 1) + 0.5, y = ri(y0 + 1, y1 - 1) + 0.5; if (FH[idx(x | 0, y | 0)] < 0) props.push({ tex: 'bonescatter', x, y, z: -0.3, w: 0.9, h: 0.35, alpha: 0.75 }); }
    } else if (type === 'chapel') {
      const wood = fidx(T.f_wood || T.f_plank), carpet = fidx(T.f_pcarpet || T.f_carpet), alt = fidx(T.f_altar || T.f_marble), woodW = widx(T.f_wood || T.b_beam || T.t_stone2);
      const nb = doors.some(([dx, dy]) => dy === y0) ? (doors.some(([dx, dy]) => dy === y1) ? 0 : 1) : -1;   // put the altar against a wall without a door
      const ay = nb < 0 ? y0 + 1 : nb > 0 ? y1 - 1 : -99;
      for (let y = y0; y <= y1; y++) set(cx, y, 0, carpet);
      for (let y = y0 + 1; y < y1; y++) { if (Math.abs(y - ay) <= 1 || y === cy) continue; if ((y - y0) % 2 === 0) continue; for (let x = x0 + 1; x < x1; x++) { if (Math.abs(x - cx) < 1 || doorNear(x, y, 1)) continue; set(x, y, 0.4, wood, woodW); props.push({ tex: 'p_pew', x: x + 0.5, y: y + 0.5, z: 0.05, w: 1.0, h: 1.0, broken: R() < 0.3 }); } }
      if (ay > 0) { for (let x = cx - 1; x <= cx + 1; x++) set(x, ay, 0.25, alt, widx(T.t_stone2)); props.push({ tex: T.p_angel ? 'p_angel' : 'p_cross', x: cx + 0.5, y: ay + 0.5 + (nb < 0 ? -0.25 : 0.25), z: 0.25, w: 1.1, h: 1.7 }); props.push({ tex: 'candelabra', x: cx - 0.9, y: ay + 0.5, z: 0.25, w: 0.5, h: 0.95, flame: 1 }); props.push({ tex: 'candelabra', x: cx + 1.9, y: ay + 0.5, z: 0.25, w: 0.5, h: 0.95, flame: 1 }); lights.push({ x: cx + 0.5, y: ay + 0.5, r: 3.6, i: 1.0, c: [1.0, 0.72, 0.4] }); }
      // chandeliers that come down when you linger under them
      const ch = [[cx + 0.5, (y0 + cy) / 2 + 0.5], [cx + 0.5, (cy + y1) / 2 + 0.5]];
      for (const [hx, hy] of ch) if (R() < 0.9) haz.push({ k: 'chand', x: hx, y: hy, ph: 0, t: 0, z: r.ch - 0.9 });
      lights.push({ x: cx + 0.5, y: cy + 0.5, r: Math.max(w, h) * 0.75, i: 0.55, c: [1.0, 0.75, 0.5] });
    } else if (type === 'bridge') {
      const pitFT = fidx(key === 'kennels' ? T.f_lava : key === 'ossuary' ? T.f_blood : key === 'abyss' ? (T.f_void || T.f_pitwood) : (T.f_pitwood || T.f_crypt)), plank = fidx(T.f_plank || T.f_wood), sideW = widx(T.b_beam || T.t_stone2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, -1.3, pitFT, sideW);
      const bridge = new Set(); const lay = (x, y) => { set(x, y, 0, plank); bridge.add(idx(x, y)); };
      // a narrow plank walk from every doorway to a small central landing; some walks get a second, rotten lane
      lay(cx, cy);
      const lanes = [];
      const done = [];
      for (const [dx, dy] of doors) {
        lay(dx, dy);
        if (done.some(([ax, ay]) => Math.abs(ax - dx) + Math.abs(ay - dy) === 1)) continue; done.push([dx, dy]);
        if (dy === y0 || dy === y1) { const s = Math.sign(cy - dy) || 1; for (let y = dy; y !== cy; y += s) { lay(dx, y); lanes.push([dx, y, 0]); } for (let x = Math.min(dx, cx); x <= Math.max(dx, cx); x++) { lay(x, cy); lanes.push([x, cy, 1]); } }
        else { const s = Math.sign(cx - dx) || 1; for (let x = dx; x !== cx; x += s) { lay(x, dy); lanes.push([x, dy, 1]); } for (let y = Math.min(dy, cy); y <= Math.max(dy, cy); y++) { lay(cx, y); lanes.push([cx, y, 0]); } }
      }
      for (const [x, y, hor] of lanes) { const ox = hor ? x : x + 1, oy = hor ? y + 1 : y; if (inR(ox, oy) && !bridge.has(idx(ox, oy)) && ox > x0 && ox < x1 && oy > y0 && oy < y1) { lay(ox, oy); if (R() < 0.55) haz.push({ k: 'plank', x: ox + 0.5, y: oy + 0.5, cx: ox, cy: oy, ph: 0, t: 0, pit: pitFT }); } }
      lights.push({ x: cx + 0.5, y: cy + 0.5, r: Math.max(w, h) * 0.8, i: 0.6, c: key === 'kennels' ? [1.0, 0.45, 0.2] : key === 'ossuary' ? [1.0, 0.3, 0.35] : [0.7, 0.5, 1.0] });
      props.push({ tex: 'sconce', x: cx - 0.2, y: cy + 0.5, z: 0, w: 0.4, h: 0.7, fire: 1 }); props.push({ tex: 'sconce', x: cx + 1.2, y: cy + 0.5, z: 0, w: 0.4, h: 0.7, fire: 1 });
      M14B.pitFall = M14B.pitFall || [];
    } else if (type === 'ring') {
      const sand = fidx(key === 'kennels' ? (T.f_basalt || T.f_obsidian) : (T.f_sand || T.f_bloodsand || T.f_flag)), dais = fidx(T.f_mosaic || T.f_marble), grate = fidx(T.f_hgrate || T.f_grate), wallW = WT[idx(x0 - 1, cy)] || widx(T.t_stone2), daisW = widx(T.t_stone2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, 0, sand);
      // round off the corners
      const rx = w / 2, ry = h / 2, mx = (x0 + x1 + 1) / 2, my = (y0 + y1 + 1) / 2;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const d = Math.hypot((x + 0.5 - mx) / rx, (y + 0.5 - my) / ry); if (d > 1.12 && !doorNear(x, y, 1)) wall(x, y, wallW); }
      for (let y = cy; y <= cy + (h >= 7 ? 1 : 0); y++) for (let x = cx; x <= cx + (w >= 7 ? 1 : 0); x++) set(x, y, 0.3, dais, daisW);
      const dcx = cx + (w >= 7 ? 1 : 0.5), dcy = cy + (h >= 7 ? 1 : 0.5);
      props.push({ tex: 'sconce', x: dcx, y: dcy, z: 0.3, w: 0.5, h: 0.85, fire: 2 });
      // flame grates around the ring, firing in a rotating pattern
      const gs = []; for (let a = 0; a < 6; a++) { const an = a / 6 * Math.PI * 2 + 0.3; const gx = Math.floor(mx + Math.cos(an) * (rx - 1.4)), gy = Math.floor(my + Math.sin(an) * (ry - 1.4)); if (inR(gx, gy) && !SOLID[idx(gx, gy)] && FH[idx(gx, gy)] === 0 && !doorNear(gx, gy, 0) && !gs.some(g => g[0] === gx && g[1] === gy)) gs.push([gx, gy]); }
      gs.forEach(([gx, gy], k) => { set(gx, gy, 0, grate); haz.push({ k: 'vent', x: gx + 0.5, y: gy + 0.5, per: 4.2, t: k * 0.7, ph: 0 }); });
      lights.push({ x: dcx, y: dcy, r: Math.max(w, h) * 0.8, i: 0.85, c: [1.0, 0.5, 0.25] });
    } else if (type === 'library' || type === 'hedge') {
      const shelf = type === 'hedge' ? (WALLDEFS.findIndex(d => d.base === T.k_hedge) >= 0 ? WALLDEFS.findIndex(d => d.base === T.k_hedge) : widx(T.k_hedge || T.t_stone2)) : widx(T.t_m14shelf || T.t_organ);
      const floor = fidx(type === 'hedge' ? (T.f_grass || T.f_flag) : (T.f_carpet || T.f_wood)), path2 = fidx(type === 'hedge' ? (T.f_flag || T.f_cobble) : (T.f_wood || T.f_plank));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, 0, floor);
      // stacks: rows of shelving with staggered gaps, a clear ring and cross-aisles
      const vert = w >= h; const gaps = [];
      for (let k = 0, a = (vert ? x0 : y0) + 2; a < (vert ? x1 : y1) - 1; a += 2, k++) {
        const lo = (vert ? y0 : x0) + 1, hi = (vert ? y1 : x1) - 1; const gap = k % 2 ? lo + 1 : hi - 1; const gap2 = vert ? cy : cx;
        for (let b = lo; b <= hi; b++) { if (b === gap || b === gap2) continue; const x = vert ? a : b, y = vert ? b : a; if (doorNear(x, y, 1)) continue; wall(x, y, shelf); }
        gaps.push(gap);
      }
      for (let x = x0; x <= x1; x++) if (!SOLID[idx(x, cy)]) set(x, cy, 0, path2); for (let y = y0; y <= y1; y++) if (!SOLID[idx(cx, y)]) set(cx, y, 0, path2);
      if (type === 'library') {
        props.push({ tex: T.p_m9lectern ? 'p_m9lectern' : 'candelabra', x: cx + 0.5, y: cy + 0.5, z: 0, w: 0.7, h: 1.0 });
        for (let k = 0; k < 2; k++) { const [x, y] = [ri(x0, x1), ri(y0, y1)]; if (!SOLID[idx(x, y)]) props.push({ tex: 'candelabra', x: x + 0.5, y: y + 0.5, z: 0, w: 0.5, h: 0.95, flame: 1 }); }
        // haunted shelves: a few faces that hurl books
        const faces = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (SOLID[idx(x, y)] && WT[idx(x, y)] === shelf) faces.push([x, y]);
        for (let k = 0; k < Math.min(3, faces.length); k++) { const f = faces.splice(Math.floor(R() * faces.length), 1)[0]; haz.push({ k: 'tome', x: f[0] + 0.5, y: f[1] + 0.5, per: 3.6 + R() * 1.5, t: R() * 2, ph: 0 }); }
        lights.push({ x: cx + 0.5, y: cy + 0.5, r: Math.max(w, h) * 0.7, i: 0.7, c: [0.55, 1.0, 0.65] });
        M14B.pages = true;
      } else {
        props.push({ tex: T.p_fountain ? 'p_fountain' : 'font', x: cx + 0.5, y: cy + 0.5, z: 0, w: 1.3, h: 1.1 });
        for (let k = 0; k < 2; k++) { const [x, y] = [ri(x0, x1), ri(y0, y1)]; if (!SOLID[idx(x, y)] && (x !== cx || y !== cy)) props.push({ tex: T.p_angel ? 'p_angel' : 'p_grave', x: x + 0.5, y: y + 0.5, z: 0, w: 0.9, h: 1.5 }); }
        lights.push({ x: cx + 0.5, y: cy + 0.5, r: Math.max(w, h) * 0.8, i: 0.5, c: [0.6, 0.65, 1.0] });
      }
    } else { restore(); return false; }
    // flood-fill from one doorway: every doorway must still be reachable on foot (steps up to 0.36; drops are fine)
    const walk = (i) => !SOLID[i] && FH[i] > -0.5;
    const seen = new Uint8Array(MW * MH); const st = [idx(doors[0][0], doors[0][1])]; seen[st[0]] = 1;
    while (st.length) { const i = st.pop(); const x = i % MW, y = (i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inR(nx, ny)) continue; const j = idx(nx, ny); if (seen[j] || !walk(j)) continue; if (FH[j] - FH[i] > 0.36 || Math.abs(FH[j] - FH[i]) > 0.36 && FH[j] < 0 !== FH[i] < 0 && FH[j] > FH[i]) continue; seen[j] = 1; st.push(j); } }
    // rotten planks count as gone for the check
    const rotten = new Set(haz.filter(z => z.k === 'plank').map(z => idx(z.cx, z.cy)));
    const ok = doors.every(([x, y]) => seen[idx(x, y)]) && (rotten.size === 0 || (() => { const s2 = new Uint8Array(MW * MH); const q = [idx(doors[0][0], doors[0][1])]; s2[q[0]] = 1; while (q.length) { const i = q.pop(); const x = i % MW, y = (i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inR(nx, ny)) continue; const j = idx(nx, ny); if (s2[j] || !walk(j) || rotten.has(j) || FH[j] - FH[i] > 0.36) continue; s2[j] = 1; q.push(j); } } return doors.every(([x, y]) => s2[idx(x, y)]); })());
    if (!ok) { restore(); M14B.log.push(['rollback', type, r.id]); return false; }
    // move spawns / pickups / old props that ended up inside walls, on raised furniture or over the pit
    const good = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (walk(i) && FH[i] > -0.4 && FH[i] < 0.2 && !rotten.has(i) && !haz.some(z => z.k !== 'chand' && Math.abs(z.x - x - 0.5) < 0.6 && Math.abs(z.y - y - 0.5) < 0.6)) good.push([x + 0.5, y + 0.5]); }
    const fix = (o, xk, yk) => { const x = o[xk], y = o[yk]; if (!inR(Math.floor(x), Math.floor(y))) return; const i = idx(Math.floor(x), Math.floor(y)); if (walk(i) && FH[i] > -0.4 && FH[i] < 0.2 && !rotten.has(i)) return; let b = null, bd = 1e9; for (const g of good) { const d = Math.hypot(g[0] - x, g[1] - y) + (good.indexOf(g) % 3) * 0.01; if (d < bd) { bd = d; b = g; } } if (b) { o[xk] = b[0]; o[yk] = b[1]; } };
    for (const s of LEVEL.spawns || []) fix(s, 1, 2);
    for (const p of LEVEL.pickups || []) fix(p, 'x', 'y');
    LEVEL.props = (LEVEL.props || []).filter(p => p.type === 'torch' || !inR(Math.floor(p.x), Math.floor(p.y)) || (walk(idx(Math.floor(p.x), Math.floor(p.y))) && Math.abs(FH[idx(Math.floor(p.x), Math.floor(p.y))]) < 0.05));
    for (const L of lights) LEVEL.lights.push(L);
    let nm = NAMES[type][Math.floor(R() * NAMES[type].length)];
    if (type === 'bridge') nm = key === 'belfry' ? NAMES.bridge[0] : key === 'kennels' ? ['THE CINDER WALK', 'The boards are charred through. Some will not hold.'] : key === 'ossuary' ? ['THE BLOOD-SEA CROSSING', 'Do not trust the rotten boards.'] : NAMES.bridge[1];
    M14B.rooms.push({ id: r.id, type, box: [x0, y0, x1 + 1, y1 + 1], name: nm[0], sub: nm[1], col: C, seen: false, cx: cx + 0.5, cy: cy + 0.5 });
    for (const p of props) M14B.props.push(p); for (const z of haz) { z.room = M14B.rooms.length - 1; M14B.haz.push(z); }
    M14B.log.push(['ok', type, r.id, w, h]);
    return true;
  }
  const _bc = buildCrypt;
  buildCrypt = function (theme, seed) {
    const r = _bc.apply(this, arguments);
    try { setPieces(theme || {}, seed); } catch (e) { M14B.err = String(e && e.stack || e); }
    return r;
  };
  // the hub, the castle nave and other builders: no set pieces
  const _bs = buildStage;
  buildStage = function () { M14B.rooms = []; M14B.haz = []; M14B.props = []; return _bs.apply(this, arguments); };

  // ---------- hazards ----------
  const inBox = (b, x, y, m = 0) => x >= b[0] - m && x < b[2] + m && y >= b[1] - m && y < b[3] + m;
  const ground = () => P.z - floorAt(P.x, P.y) < 0.35;
  const env = (dmg, x, y) => { try { return hurtPlayer(dmg, x, y, { src: 'trap', unblockable: true, nopd: true, env: true }); } catch (e) { return null; } };
  const gasP = (x, y, z, n, big) => { for (let i = 0; i < n; i++) addP({ k: 'ecto', x: x + rand(-0.3, 0.3) * (big ? 2 : 1), y: y + rand(-0.3, 0.3) * (big ? 2 : 1), z: z + rand(0, big ? 1.4 : 0.2), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: rand(0.3, big ? 1.4 : 0.7), size: big ? 0.12 : 0.05, col: RGB(110, 255, 140), life: big ? 1.1 : 0.5 }); };
  // a plank that just fell may be where the game last saw you standing safely: move that point onto solid boards
  function safeFrom(z) {
    const L = P.lastSafe; if (!L) return; const rm = M14B.rooms[z.room];
    let b = null, bd = 1e9;
    for (let y = rm.box[1]; y < rm.box[3]; y++) for (let x = rm.box[0]; x < rm.box[2]; x++) { const c = y * MW + x; if (SOLID[c] || FH[c] < -0.3 || FH[c] > 0.3) continue; if (M14B.haz.some(q => q.k === 'plank' && q.ph !== 3 && q.cx === x && q.cy === y)) continue; const d = Math.hypot(x + 0.5 - z.x, y + 0.5 - z.y); if (d < bd) { bd = d; b = [x + 0.5, y + 0.5]; } }
    if (b && (Math.floor(L.x) === z.cx && Math.floor(L.y) === z.cy || groundUnder(L.x, L.y, 0.3) < -0.5)) { L.x = b[0]; L.y = b[1]; L.z = 0; }
  }
  function tick(dt) {
    if (!M14B.rooms.length) return;
    for (const rm of M14B.rooms) if (!rm.seen && inBox(rm.box, P.x, P.y, -0.5)) { rm.seen = true; try { toast(rm.name, rm.sub, '#' + rm.col.map(v => v.toString(16).padStart(2, '0')).join(''), 2.6); } catch (e) { } }
    for (const z of M14B.haz) {
      const rm = M14B.rooms[z.room]; const near = inBox(rm.box, P.x, P.y, 1.5); const d = Math.hypot(P.x - z.x, P.y - z.y);
      if (z.k === 'gas') {
        if (!near && z.ph === 0) continue; z.t += dt;
        if (z.ph === 0 && z.t > z.per) { z.ph = 1; z.t = 0; SFX.play('ghost', 0.25); }
        else if (z.ph === 1) { if (Math.random() < dt * 30) gasP(z.x, z.y, -0.3, 1); if (z.t > 1.2) { z.ph = 2; z.t = 0; gasP(z.x, z.y, -0.3, 22, true); SFX.play('fire', 0.4); if (d < 1.2 && P.z < floorAt(z.x, z.y) + 1.5) env(8, z.x, z.y); } }
        else if (z.ph === 2 && z.t > 0.6) { z.ph = 0; z.t = 0; }
      } else if (z.k === 'vent') {
        if (!near && z.ph === 0) continue; z.t += dt;
        if (z.ph === 0 && z.t > z.per) { z.ph = 1; z.t = 0; SFX.play('fire', 0.3); }
        else if (z.ph === 1 && z.t > 0.9) { z.ph = 2; z.t = 0; z.hit = false; SFX.play('fire', 0.8); G.shake = Math.max(G.shake, d < 4 ? 1.5 : 0); }
        else if (z.ph === 2) { for (let i = 0; i < 3; i++) addP({ k: 'ember', x: z.x + rand(-0.25, 0.25), y: z.y + rand(-0.25, 0.25), z: rand(0, 1.8), vx: 0, vy: 0, vz: rand(1.5, 3), size: 0.07, col: RGB(255, 140 + rand(0, 80) | 0, 40), life: 0.5 }); if (!z.hit && d < 0.75 && P.z < 1.6) { z.hit = true; env(10, z.x, z.y); } if (z.t > 0.7) { z.ph = 0; z.t = 0; } }
      } else if (z.k === 'chand') {
        if (z.ph === 3) continue;
        if (z.ph === 0 && d < 1.6 && near) { z.ph = 1; z.t = 0; SFX.play('clink', 0.8); SFX.play('stone', 0.3); }
        else if (z.ph === 1) { z.t += dt; if (Math.random() < dt * 25) addP({ k: 'dust', x: z.x + rand(-0.4, 0.4), y: z.y + rand(-0.4, 0.4), z: z.z, vx: 0, vy: 0, vz: -1, size: 0.04, col: RGB(200, 190, 170), life: 1 }); if (z.t > 0.95) { z.ph = 2; z.t = 0; } }
        else if (z.ph === 2) { z.t += dt; if (z.t > 0.28) { z.ph = 3; G.shake += 4; SFX.play('heavy', 0.9); SFX.play('clink', 1); try { sparks(z.x, z.y, floorAt(z.x, z.y) + 0.2, 18); dust(z.x, z.y, floorAt(z.x, z.y), 10); } catch (e) { } if (d < 1.35 && P.z < floorAt(z.x, z.y) + 1.6) env(16, z.x, z.y); for (const e of G.enemies) if (e.alive && !e.d.boss && Math.hypot(e.x - z.x, e.y - z.y) < 1.35) try { damageEnemy(e, 60, { src: 'trap' }); } catch (er) { } } }
      } else if (z.k === 'plank') {
        if (z.ph === 3) { if (near && P.lastSafe && Math.floor(P.lastSafe.x) === z.cx && Math.floor(P.lastSafe.y) === z.cy) safeFrom(z); continue; }
        const on = Math.floor(P.x) === z.cx && Math.floor(P.y) === z.cy && ground();
        if (z.ph === 0 && on) { z.ph = 1; z.t = 0; SFX.play('clink', 0.6); SFX.play('step', 1); }
        else if (z.ph === 1) { z.t += dt; if (Math.random() < dt * 30) addP({ k: 'dust', x: z.x + rand(-0.45, 0.45), y: z.y + rand(-0.45, 0.45), z: 0, vx: 0, vy: 0, vz: -0.6, size: 0.04, col: RGB(150, 110, 80), life: 0.6 }); G.shake = Math.max(G.shake, 0.6); if (z.t > 0.7) { z.ph = 3; const i = z.cy * MW + z.cx; FH[i] = -1.3; FT[i] = z.pit; safeFrom(z); SFX.play('stone', 0.8); SFX.play('heavy', 0.4); try { dust(z.x, z.y, 0, 8); } catch (e) { } } }
      } else if (z.k === 'tome') {
        if (!inBox(rm.box, P.x, P.y, 0) || (z.shots || 0) >= 3) continue; z.t += dt;   // a shelf throws 3 books per stage, only while you are in its room
        if (z.ph === 0 && z.t > z.per && d < 7 && (G.time - (rm.lastTome || -9)) > 2.2 && losTo(z.x + (P.x - z.x) / d * 0.62, z.y + (P.y - z.y) / d * 0.62, P.x, P.y)) { z.ph = 1; z.t = 0; rm.lastTome = G.time; SFX.play('ghost', 0.35); }
        else if (z.ph === 0 && z.t > z.per) z.t = z.per - 0.5;
        else if (z.ph === 1 && z.t > 0.75) {
          z.ph = 0; z.t = 0; z.shots = (z.shots || 0) + 1; const a = Math.atan2(P.y - z.y, P.x - z.x); const sx = z.x + Math.cos(a) * 0.62, sy = z.y + Math.sin(a) * 0.62, sz = 1.3, sp = 6.5, dist = Math.hypot(P.x - sx, P.y - sy);
          G.projectiles.push({ type: 'fireball', x: sx, y: sy, z: sz, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: ((P.z + 1.0) - sz) / Math.max(0.5, dist) * sp, dmg: 5, owner: null, life: 3, m14tome: 1,
            spr: (p) => { if (Math.random() < 0.4) addP({ k: 'ember', x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0.3, size: 0.04, col: RGB(140, 255, 160), life: 0.3 }); return { tex: 'glow_w', x: p.x, y: p.y, z: p.z - 0.2, w: 0.45, h: 0.45, add: true, alpha: 0.9, lit: false, tint: [140, 255, 160, 1] }; } });
          SFX.play('whip', 0.4);
        }
      }
    }
    // the flooded floor: splashes underfoot
    if (P.onGround && Math.hypot(P.vx || 0, P.vy || 0) > 1 && floorAt(P.x, P.y) < -0.2 && floorAt(P.x, P.y) > -0.5 && Math.random() < dt * 8) addP({ k: 'spark', x: P.x + rand(-0.2, 0.2), y: P.y + rand(-0.2, 0.2), z: floorAt(P.x, P.y) + 0.05, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), vz: rand(0.8, 1.6), size: 0.04, col: RGB(150, 230, 230), life: 0.4 });
  }
  const _fi = frameInner;
  frameInner = function (now) { const r = _fi.apply(this, arguments); try { const dt = Math.min(0.05, G.m14blt ? (now - G.m14blt) / 1000 : 0.016); G.m14blt = now; if (G.state === 'play' && RUN.on) tick(dt); } catch (e) { M14B.err = String(e && e.stack || e); } return r; };
  // the chasm message fits the room you fell in
  const _toast = toast;
  toast = function (t1) { if (t1 === 'The blood sea spits you back out.' && M14B.rooms.some(rm => rm.type === 'bridge' && inBox(rm.box, P.x, P.y, 0.5))) { arguments[0] = RUN.cfg && RUN.cfg.theme === 'kennels' ? 'The fire spits you back out.' : 'The dark spits you back out.'; } return _toast.apply(this, arguments); };

  // ---------- drawing ----------
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if ((G.state !== 'play' && G.state !== 'pause') || !M14B.rooms.length) return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      for (const p of M14B.props) {
        if (Math.abs(p.x - P.x) > 16 || Math.abs(p.y - P.y) > 16) continue;
        S.push({ tex: p.tex, x: p.x, y: p.y, z: p.z, w: p.w, h: p.h, alpha: p.alpha, skew: p.broken ? 0.12 : 0, tint: p.broken ? [60, 40, 50, 0.25] : null });
        if (p.flame) { for (const o of [-0.2, 0, 0.2]) { const f = ((t * 10 + o * 9 + p.y) | 0) % 4; S.push({ tex: 'flame' + f, x: p.x + o * 0.3, y: p.y, z: p.z + 0.86, w: 0.07, h: 0.11, lit: false }); } gl(p.x, p.y, p.z + 0.8, 0.9, 0.9, 0.35, [255, 150, 60]); }
        if (p.fire) { for (let i = 0; i < 3; i++) { const f = ((t * 12 + i * 1.7 + p.x) | 0) % 4; S.push({ tex: 'flame' + f, x: p.x + (i - 1) * 0.1, y: p.y, z: p.z + p.h * 0.72, w: 0.26 * p.fire * 0.6, h: 0.45 * p.fire * 0.6, lit: false, glow: 0.3 }); } gl(p.x, p.y, p.z + p.h * 0.5, 1.8, 1.6, 0.4, [255, 90, 50]); }
      }
      for (const z of M14B.haz) {
        if (Math.abs(z.x - P.x) > 16 || Math.abs(z.y - P.y) > 16) continue;
        const fz = floorAt(z.x, z.y);
        if (z.k === 'gas') { if (z.ph === 1) { const k = z.t / 1.2; gl(z.x, z.y, fz + 0.02, 0.6 + 0.9 * k, 0.25, 0.25 + 0.5 * k, [110, 255, 140]); } else if (z.ph === 2) gl(z.x, z.y, fz + 0.3, 2.4, 1.8, 0.5 * (1 - z.t / 0.6), [110, 255, 140]); else gl(z.x, z.y, fz + 0.02, 0.5, 0.15, 0.12, [110, 255, 160]); }
        else if (z.k === 'vent') { if (z.ph === 1) { const k = z.t / 0.9; gl(z.x, z.y, 0.02, 0.8 + 0.5 * k, 0.3, 0.3 + 0.55 * k, [255, 110, 40]); } else if (z.ph === 2) { for (let i = 0; i < 4; i++) { const f = ((t * 14 + i * 1.3) | 0) % 4; S.push({ tex: 'flame' + f, x: z.x + Math.sin(t * 9 + i) * 0.08, y: z.y, z: i * 0.42, w: 0.55, h: 0.75, lit: false, glow: 0.4 }); } gl(z.x, z.y, 0.6, 1.6, 2.4, 0.55, [255, 120, 40]); } else gl(z.x, z.y, 0.02, 0.6, 0.15, 0.15 + 0.05 * Math.sin(t * 4 + z.x), [255, 90, 40]); }
        else if (z.k === 'chand') {
          const drop = z.ph === 2 ? Math.min(1, z.t / 0.28) : z.ph === 3 ? 1 : 0, sway = z.ph === 1 ? Math.sin(t * 22) * 0.06 : Math.sin(t * 1.3 + z.x) * 0.02;
          const zz = z.z - drop * (z.z - fz);
          S.push({ tex: 'candelabra', x: z.x + sway, y: z.y, z: zz - (z.ph === 3 ? 0 : 0.2), w: z.ph === 3 ? 0.9 : 0.75, h: z.ph === 3 ? 0.5 : 0.85, skew: z.ph === 3 ? 0.3 : 0, tint: z.ph === 3 ? [40, 30, 30, 0.35] : null });
          if (z.ph < 3) { for (const o of [-0.25, 0, 0.25]) { const f = ((t * 10 + o * 9) | 0) % 4; S.push({ tex: 'flame' + f, x: z.x + sway + o * 0.35, y: z.y, z: zz + 0.55, w: 0.07, h: 0.11, lit: false }); } gl(z.x + sway, z.y, zz + 0.4, 1.4, 1.2, 0.35, [255, 170, 80]); }
          if (z.ph === 1 || z.ph === 2) { const k = z.ph === 2 ? 1 : z.t / 0.95; gl(z.x, z.y, fz + 0.02, 1.2 + 1.5 * k, 0.35, 0.3 + 0.5 * k, [255, 60, 40]); }
        } else if (z.k === 'plank') { if (z.ph === 1) gl(z.x, z.y, 0.02, 1.0, 0.25, 0.4 + 0.3 * Math.sin(t * 30), [255, 170, 80]); }
        else if (z.k === 'tome') { if (z.ph === 1) { const k = z.t / 0.75; gl(z.x, z.y, 1.3, 0.8 + 0.6 * k, 0.8 + 0.6 * k, 0.3 + 0.5 * k, [140, 255, 160]); } }
      }
      // drifting pages in the library / motes over the water
      for (const rm of M14B.rooms) {
        if (!inBox(rm.box, P.x, P.y, 6)) continue;
        if (rm.type === 'library' && Math.random() < 0.3) addP({ k: 'mote', x: rand(rm.box[0], rm.box[2]), y: rand(rm.box[1], rm.box[3]), z: rand(0.5, 2.5), vx: rand(-0.2, 0.2), vy: rand(-0.2, 0.2), vz: rand(-0.15, 0.05), size: 0.05, col: RGB(230, 220, 190), life: 2.2 });
        if (rm.type === 'flooded' && Math.random() < 0.25) addP({ k: 'ecto', x: rand(rm.box[0], rm.box[2]), y: rand(rm.box[1], rm.box[3]), z: rand(-0.2, 0.6), vx: 0, vy: 0, vz: rand(0.05, 0.2), size: 0.03, col: RGB(120, 230, 220), life: 1.6 });
        if (rm.type === 'bridge' && Math.random() < 0.3) addP({ k: 'ember', x: rand(rm.box[0], rm.box[2]), y: rand(rm.box[1], rm.box[3]), z: rand(-1.25, -0.3), vx: 0, vy: 0, vz: rand(0.4, 1.0), size: 0.04, col: RUN.cfg.theme === 'kennels' ? RGB(255, 140, 50) : RGB(190, 130, 255), life: 1.6 });
      }
    } catch (e) { M14B.err = String(e && e.stack || e); }
    return S;
  };
})();
