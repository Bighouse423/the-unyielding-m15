'use strict';
// ===== m20b: THE OTHER FOURTEEN FLOORS (stages 2, 3, 5, 6, 7, 8, 10), two new templates (Tall Hall, Open Court),
// fourteen new floor bosses, six new floor foes, four new floor weapons (found -> buyable), 14 lore pages, six freed souls,
// the OATH SHRINE (an optional curse at every floor for a doubled coffer) and THE BARON'S CRYPT (the capstone: find all
// 20 floor pages and a stair opens behind the Chapel altar). New code lives here so it merges cleanly with the art pass.
// Kill switches: ?m20b=0 (the whole file: m20 plays exactly as before)  ?oath=0 (no shrines)  ?bcrypt=0 (no crypt)
//                ?floorfoes2=0 (the six new foes leave the floor pools)  debug: ?bcryptall=1 (crypt open without the pages)
(function () {
  if (!window.M20 || !M20.FL || !M20.floors) return;
  const q = location.search || '', z = k => new RegExp('[?&]' + k + '=0(?:&|$)').test(q), one = k => new RegExp('[?&]' + k + '=1(?:&|$)').test(q);
  if (z('m20b')) { M20.m20b = false; return; }
  const FL = M20.FL, ER = (k, e) => M20.fail('m20b ' + k, e);
  M20.m20b = true; M20.v = 'm20b';
  M20.oathOn = !!M20.oath; M20.bcrypt = !z('bcrypt'); M20.floorfoes2 = !!M20.floorfoes && !z('floorfoes2'); M20.bcryptall = one('bcryptall');
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (R, a) => a[Math.floor(R() * a.length)];
  const base = (snames) => ({ rooms: [], lights: [], props: [], pickups: [], secrets: [], cracks: [], signs: [], bars: [], spawns: [], snames: snames || ['The Hidden Niche', 'The Forgotten Cell', 'The Sealed Room'] });
  // ---------- palettes (same 13 wall / 8 floor slots as m20floor.js) ----------
  FL.pal.grave = { w: ['k_wall', 'k_wall2', 'k_ivy', 'k_pillar', ['k_wall2', 't_tomb', 0.05, 2.3], 't_stone', 'k_crack', 't_gate', 't_sarc', 'k_hedge', ['k_wall', 't_statue', 0, 2.9], 't_stone2', 'k_false'], f: ['f_grass', 'f_soil', 'f_path', 'f_bog', 'f_cobble', 'f_marble', 'f_plank', 'f_void'], c: ['c_necro', 'c_wood'] };
  FL.pal.oss = { w: ['t_crypt', 't_skulls', 't_skullcol', 't_cpillar', ['t_crypt', 't_tomb', 0.05, 2.3], 't_stone2', 't_cryptcrack', 't_gate', 't_sarc', 't_skulls', ['t_crypt', 't_skullcol', 0, 2.6], 't_stone2', 't_cryptfalse'], f: ['f_oss', 'f_oss2', 'f_lid', 'f_blood', 'f_redmarble', 'f_marble', 'f_plank', 'f_void'], c: ['c_oss', 'c_vault'] };
  FL.pal.forge = { w: ['t_stone', 't_stone2', 't_grate', 't_pillar', ['t_stone', 't_irondoor', 0.05, 2.6], 't_stone2', 't_cracked', 't_gate', 't_sarc', 't_grate', ['t_stone', 't_statue', 0, 2.9], 't_stone2', 't_stonefalse'], f: ['f_basalt', 'f_hgrate', 'f_grate', 'f_lava', 'f_ember', 'f_obsidian', 'f_plank', 'f_void'], c: ['c_forge', 'c_iron'] };
  FL.pal.clock = { w: ['t_stone', 't_stone2', 't_grate', 't_pillar', ['t_stone2', 't_organ', 0.2, 2.8], 't_stone2', 't_cracked', 't_gate', 't_sarc', 't_m14shelf', ['t_stone', 't_statue', 0, 2.9], 't_stone2', 't_stonefalse'], f: ['f_wood', 'f_hgrate', 'f_tile', 'f_m14water', 'f_grate', 'f_marble', 'f_plank', 'f_void'], c: ['c_beam', 'c_iron'] };
  FL.pal.arena = { w: ['k_wall', 'k_wall2', 't_banner', 'k_pillar', ['k_wall2', 't_banner', 0.4, 2.7], 't_stone', 'k_crack', 't_gate', 't_sarc', 't_stone2', ['k_wall', 't_statue', 0, 2.9], 't_stone2', 'k_false'], f: ['f_bloodsand', 'f_sand', 'f_tile', 'f_blood', 'f_flag', 'f_redmarble', 'f_plank', 'f_void'], c: ['c_arcade', 'c_wood'] };
  FL.pal.pens = { w: ['t_stone', 't_crypt2', 't_grate', 't_cpillar', ['t_stone', 't_irondoor', 0.05, 2.6], 't_stone2', 't_cracked', 't_gate', 't_sarc', 't_grate', ['t_stone', 't_statue', 0, 2.9], 't_stone2', 't_stonefalse'], f: ['f_sand', 'f_bloodsand', 'f_hgrate', 'f_blood', 'f_flag', 'f_tile', 'f_plank', 'f_void'], c: ['c_iron', 'c_vault'] };
  FL.pal.bog = { w: ['t_crypt', 't_crypt2', 't_skulls', 't_cpillar', ['t_crypt', 't_tomb', 0.05, 2.3], 't_stone2', 't_cryptcrack', 't_gate', 't_sarc', 'k_ivy', ['t_crypt', 't_skullcol', 0, 2.6], 't_stone2', 't_cryptfalse'], f: ['f_soil', 'f_crypt2', 'f_lid', 'f_bog', 'f_rubble', 'f_marble', 'f_plank', 'f_void'], c: ['c_necro', 'c_vault'] };
  FL.pal.night = { w: ['t_stone', 't_stone2', 't_banner', 't_pillar', ['t_stone', 't_window2', 0.5, 2.7], 't_stone', 't_cracked', 't_gate', 't_sarc', 't_stone2', ['t_stone', 't_statue', 0, 2.9], 't_stone2', 't_stonefalse'], f: ['f_obsidian', 'f_pcarpet', 'f_nave', 'f_voidpool', 'f_marble', 'f_soulglass', 'f_plank', 'f_void'], c: ['c_throne', 'c_void'] };
  FL.pal.phyl = { w: ['t_crypt', 't_crypt2', 't_skullcol', 't_cpillar', ['t_crypt', 't_m14shelf', 0.1, 2.6], 't_stone2', 't_cryptcrack', 't_gate', 't_sarc', 't_skulls', ['t_crypt', 't_statue', 0, 2.6], 't_stone2', 't_cryptfalse'], f: ['f_crypt', 'f_crypt2', 'f_soulglass', 'f_voidpool', 'f_obsidian', 'f_marble', 'f_plank', 'f_void'], c: ['c_crypt', 'c_vault'] };
  FL.pal.roofoss = Object.assign({}, FL.pal.roof, { f: ['f_oss', 'f_redmarble', 'f_tile', 'f_blood', 'f_rubble', 'f_marble', 'f_plank', 'f_void'], c: ['c_oss', 'c_wood'] });
  FL.pal.roofbell = Object.assign({}, FL.pal.roof, { f: ['f_wood', 'f_flag', 'f_tile', 'f_blood', 'f_rubble', 'f_marble', 'f_plank', 'f_void'] });
  FL.pal.roofsmoke = Object.assign({}, FL.pal.roof, { w: ['t_stone', 't_stone2', 't_grate', 'k_pillar', ['t_stone2', 't_irondoor', 0.05, 2.6], 't_stone', 't_cracked', 't_gate', 't_sarc', 't_stone2', ['t_stone', 't_statue', 0, 2.9], 't_stone2', 't_stonefalse'], f: ['f_basalt', 'f_hgrate', 'f_grate', 'f_lava', 'f_ember', 'f_obsidian', 'f_plank', 'f_void'] });
  FL.pal.cliff = Object.assign({}, FL.pal.grave, { f: ['f_cobble', 'f_soil', 'f_path', 'f_bog', 'f_rubble', 'f_marble', 'f_plank', 'f_void'] });
  FL.pal.spire = Object.assign({}, FL.pal.night, { c: ['c_void', 'c_throne'] });

  // ---------------- TALL HALL (30x48): one long nave of four bays climbing (or, inverted, falling) north; CH 6-8,
  // raised side galleries up a ramp, pillar rows, optional liquid channels (blood / lava / water) along the walls ----------------
  FL.tpl.tallhall = function (R, def, K) {
    const o = def.opts || {}; K.alloc(30, 48, false); const L = base(def.snames); L.sky = false;
    const inv = !!o.inverted, liq = o.liquid || null, X0 = 9, X1 = 20;
    const bays = [{ y0: 38, y1: 45, kind: 'start' }, { y0: 29, y1: 36, kind: 'path' }, { y0: 20, y1: 27, kind: 'path' }, { y0: 6, y1: 18, kind: 'tough' }];
    bays.forEach((b, i) => { b.x0 = X0; b.x1 = X1; b.fh = +((inv ? 3 - i : i) * 0.35).toFixed(2); b.i = i; });
    for (const b of bays) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const aisle = x === 14 || x === 15; K.open(x, y, b.fh, b.fh + (b.kind === 'tough' ? 8 : 6.5), aisle ? 2 : ((x + y) % 5 === 0 ? 1 : 0), false);
      if (b.kind === 'tough') { CT[y * MW + x] = 1; if (Math.hypot(x - 14.5, (y - 12) * 1.1) < 3.2) FT[y * MW + x] = 5; }
    }
    // doors between bays (3 wide, a half step)
    for (let i = 0; i < 3; i++) { const a = bays[i], b = bays[i + 1], wy = a.y0 - 1; const dx = ri(R, X0 + 1, X1 - 3), fh = +((a.fh + b.fh) / 2).toFixed(3); for (let x = dx; x < dx + 3; x++) for (let y = b.y1 + 1; y <= wy; y++) K.open(x, y, fh, fh + 4, 4, false); }
    // pillars
    for (const b of bays) if (b.kind !== 'start') for (let y = b.y0 + 1; y < b.y1; y += 3) for (const x of [X0 + 2, X1 - 2]) { if (b.kind === 'tough' && y > b.y0 + 2 && y < b.y1 - 2) continue; K.wall(x, y, 99, 3); }
    // liquid channels on the edges of the path bays
    if (liq) for (const b of bays) if (b.kind === 'path' || b.kind === 'tough') for (let y = b.y0; y <= b.y1; y++) for (const x of [X0, X1]) { const i = y * MW + x; if (SOLID[i]) continue; FH[i] = b.fh - 0.25; FT[i] = 3; }
    L.liquid = liq;
    // galleries: a raised side room up a ramp on one side of each non-tough bay
    const gal = [];
    for (const b of bays) {
      if (b.kind === 'tough') continue; const east = R() < 0.5, gx0 = east ? X1 + 2 : 3, gx1 = east ? 26 : X0 - 2;
      const g = { x0: gx0, x1: gx1, y0: b.y0 + 1, y1: b.y1 - 1, kind: 'path', fh: b.fh + 0.5 };
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) K.open(x, y, g.fh, g.fh + 4.2, (x + y) % 3 ? 0 : 1, false);
      const ry = ri(R, g.y0 + 1, g.y1 - 2), rx = east ? X1 + 1 : X0 - 1;
      for (let y = ry; y <= ry + 1; y++) K.open(rx, y, b.fh + 0.25, b.fh + 4.2, 4, false);
      if (liq) for (let y = ry; y <= ry + 1; y++) { const i = y * MW + (east ? X1 : X0); FH[i] = b.fh; FT[i] = 4; }
      gal.push(g);
      if (b.kind === 'start') continue;
      const [cx, cy] = K.center(g); L.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 5, i: 0.9, c: o.lc || [1.0, 0.6, 0.3], flicker: true }); L.props.push({ type: 'candelabra', x: cx + 0.5, y: cy + 0.5, z: g.fh });
    }
    // reward chapel north of the tough bay (cut off by FL.build's rewRect gates)
    const rw = { x0: 12, x1: 17, y0: 2, y1: 4 }; const T = bays[3];
    K.rect(rw, T.fh, T.fh + 3.2, 5, false); for (let x = 14; x <= 15; x++) K.open(x, 5, T.fh, T.fh + 3.2, 4, false);
    // lights, braziers, bones, pickups
    for (const b of bays) { const ly = (b.y0 + b.y1) / 2 + 0.5; for (const x of [X0 + 0.7, X1 + 0.3]) L.lights.push({ x, y: ly, r: 6.5, i: 0.85, c: o.lc || [1.0, 0.55, 0.28], flicker: true }); }
    for (const [x, y] of [[X0 + 1.5, T.y0 + 1.5], [X1 - 0.5, T.y0 + 1.5], [X0 + 1.5, T.y1 - 0.5], [X1 - 0.5, T.y1 - 0.5]]) { L.props.push({ type: 'brazier', x, y, z: T.fh, green: !!o.green }); L.lights.push({ x, y, r: 6, i: 1.1, c: o.green ? [0.3, 1.0, 0.5] : (o.bc || [1.0, 0.45, 0.2]), flicker: true }); }
    L.lights.push({ x: 15, y: 3.5, r: 4, i: 1.0, c: [1.0, 0.8, 0.4] });
    const rooms = bays.map(b => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, kind: b.kind, fh: b.fh })).concat(gal);
    for (const r of rooms) if (r.kind === 'path') { const c = K.cells(r, R, 1); if (c[0] && R() < 0.6) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: c[0][0], y: c[0][1] }); for (let k = 1; k < 3; k++) if (c[k]) L.props.push({ type: 'bones', x: c[k][0], y: c[k][1], z: r.fh }); }
    rooms.push(Object.assign({ kind: 'reward' }, rw));
    // secrets: pockets dug into the solid flanks
    for (let k = 0; k < (o.secrets || 2); k++) FL.secretKit.pocket(K, R, L, k ? 12 : 6, (x, y) => y < 20 || y > 44);
    const S = bays[0];
    L.start = { x: 14.5, y: 42.5, ang: -Math.PI / 2 }; L.back = [X0 + 1.5, S.y1 - 0.5];
    L.tough = { x0: X0, y0: T.y0, x1: X1 + 1, y1: T.y1 + 1, cx: 15, cy: 12.5, fh: T.fh };
    L.reward = [15, 3.5]; L.fwd = [rw.x1 - 0.4, rw.y0 + 0.6]; L.rewRect = rw;
    L.rooms = rooms; L.amb = o.amb || [0.34, 0.3, 0.32];
    return L;
  };

  // ---------------- OPEN COURT (40x40, open sky): a walled yard of graves and hedges with mausoleum vaults; the tough
  // court at the north end, the reward in a barred mausoleum behind it. o.arena = sand pit with stepped stands ----------------
  FL.tpl.opencourt = function (R, def, K) {
    const o = def.opts || {}; K.alloc(40, 40, true); const L = base(def.snames); L.sky = true; const ar = !!o.arena;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) K.wall(x, y, 3.2, (x + y) % 7 ? 0 : 1);
    for (let y = 2; y <= 37; y++) for (let x = 2; x <= 37; x++) K.open(x, y, 0, 99, ar ? ((x * 3 + y) % 7 === 0 ? 1 : 0) : ((x * 5 + y * 3) % 6 === 0 ? 1 : 0), true);
    for (let y = 2; y <= 37; y++) for (const x of [19, 20]) FT[y * MW + x] = ar ? 2 : 2; // the central path
    // hedge lines (low, wt 9) with gaps: split the yard into south / middle / north
    const hedge = (y, gaps) => { for (let x = 2; x <= 37; x++) { if (gaps.some(g => x >= g && x < g + 3)) continue; K.wall(x, y, ar ? 1.6 : 1.3, ar ? 5 : 9); } };
    hedge(29, [ri(R, 3, 12), 18, ri(R, 25, 34)]); hedge(14, [ri(R, 4, 12), ri(R, 25, 33)]);
    // middle yard: headstones (wt 8) on a loose grid, open graves (shallow pits), 1-2 mausoleum blocks
    const mid = { x0: 2, y0: 15, x1: 37, y1: 28 };
    for (let y = mid.y0 + 1; y < mid.y1; y += 3) for (let x = 4; x <= 35; x += 3) { if (x >= 17 && x <= 22) continue; const r = R(); if (r < 0.42) K.wall(x, y, ar ? 1.0 : 0.95, ar ? 10 : 8); else if (r < 0.52 && !ar) { const i = y * MW + x; FH[i] = -0.3; FT[i] = 1; } }
    for (let k = 0, made = 0; k < 6 && made < 2; k++) { const x0 = pick(R, [4, 9, 26, 31]), y0 = ri(R, 17, 23); let ok = true; for (let y = y0 - 1; y <= y0 + 3; y++) for (let x = x0 - 1; x <= x0 + 3; x++) if (SOLID[y * MW + x]) ok = false; if (!ok) continue; for (let y = y0; y <= y0 + 2; y++) for (let x = x0; x <= x0 + 2; x++) K.wall(x, y, 2.7, x === x0 + 1 && y === y0 + 1 ? 10 : 4); made++; }
    // arena stands: stepped tiers along the east and west walls of the middle and south yards
    if (ar) for (let y = 15; y <= 37; y++) { if (y === 29) continue; for (let t = 0; t < 3; t++) for (const x of [2 + t, 37 - t]) { const i = y * MW + x; if (SOLID[i]) continue; FH[i] = 1.05 - t * 0.35; FT[i] = 4; } }
    // the tough court (north) ringed with low walls, and the barred mausoleum behind it
    const T = { x0: 6, y0: 4, x1: 33, y1: 12 };
    for (let y = T.y0; y <= T.y1; y++) for (let x = T.x0; x <= T.x1; x++) { const i = y * MW + x; FT[i] = Math.hypot(x - 19.5, (y - 8) * 1.4) < 4 ? 5 : FT[i]; }
    for (const [x, y] of [[9, 6], [30, 6], [9, 10], [30, 10]]) K.wall(x, y, 2.4, 3);
    const rw = { x0: 17, x1: 22, y0: 2, y1: 2 };
    for (let x = 16; x <= 23; x++) { K.wall(x, 1, 3.4, 4); K.wall(x, 3, 3.4, 1); } K.wall(16, 2, 3.4, 4); K.wall(23, 2, 3.4, 4);
    K.rect(rw, 0, 2.8, 5, false); K.open(19, 3, 0, 99, 4, true); K.open(20, 3, 0, 99, 4, true);
    // vault secrets: little roofed mausoleums in the corners of the south and middle yards
    const vault = (x0, y0, side) => {
      const r = { x0, y0, x1: x0 + 2, y1: y0 + 2 }; let ok = true; for (let y = y0 - 1; y <= y0 + 3; y++) for (let x = x0 - 1; x <= x0 + 3; x++) if (x >= 2 && y >= 2 && x <= MW - 3 && y <= MH - 3 && SOLID[y * MW + x] && FH[y * MW + x] > 2) ok = false;
      if (!ok) return; const wx = side > 0 ? x0 + 3 : x0 - 1, wy = y0 + 1; if (!K.isOpen(wx + side, wy)) return;
      FL.secretKit.secretAt(K, R, L, r, wx, wy, 0, true, L.secrets.length ? 12 : 6);
    };
    const vs = [[2, 31, 1], [35, 31, -1], [2, 16, 1], [35, 16, -1]]; for (let i = vs.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = vs[i]; vs[i] = vs[j]; vs[j] = t; }
    for (const [x, y, s] of vs) { if (L.secrets.length >= (o.secrets || 2)) break; vault(x, y, s); }
    // lights + props
    const moon = o.lc || [0.5, 0.9, 0.6];
    for (const [x, y] of [[8, 33], [31, 33], [8, 20], [31, 20], [19.5, 24], [8, 26], [31, 26]]) { L.lights.push({ x: x + 0.5, y: y + 0.5, r: 6, i: 0.8, c: moon, flicker: true }); if (!SOLID[(y | 0) * MW + (x | 0)]) L.props.push({ type: 'candelabra', x: x + 0.5, y: y + 0.5, z: FH[(y | 0) * MW + (x | 0)] }); }
    for (const [x, y] of [[7.5, 4.5], [32.5, 4.5], [7.5, 12.5], [32.5, 12.5]]) { L.props.push({ type: 'brazier', x, y, z: 0, green: !!o.green }); L.lights.push({ x, y, r: 6.5, i: 1.1, c: o.green ? [0.3, 1.0, 0.5] : (o.bc || [1.0, 0.45, 0.2]), flicker: true }); }
    L.lights.push({ x: 19.5, y: 2.5, r: 4, i: 1.0, c: [1.0, 0.8, 0.4] });
    const rooms = [{ x0: 12, y0: 30, x1: 27, y1: 37, kind: 'start' }, { x0: 2, y0: 30, x1: 11, y1: 37, kind: 'path', ambush: true }, { x0: 28, y0: 30, x1: 37, y1: 37, kind: 'path', ambush: true },
      { x0: 2, y0: 15, x1: 18, y1: 28, kind: 'path' }, { x0: 21, y0: 15, x1: 37, y1: 28, kind: 'path' }, Object.assign({ kind: 'tough' }, T), Object.assign({ kind: 'reward' }, rw)];
    for (const r of rooms) if (r.kind === 'path') { const c = K.cells(r, R, 1).filter(([x, y]) => FH[(y | 0) * MW + (x | 0)] >= 0); if (c[0] && R() < 0.6) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: c[0][0], y: c[0][1] }); for (let k = 1; k < 3; k++) if (c[k]) L.props.push({ type: 'bones', x: c[k][0], y: c[k][1], z: 0 }); }
    L.start = { x: 19.5, y: 34.5, ang: -Math.PI / 2 }; L.back = [19.5, 36.6];
    L.tough = { x0: T.x0, y0: T.y0, x1: T.x1 + 1, y1: T.y1 + 1, cx: 20, cy: 8.5, fh: 0 };
    L.reward = [20, 2.5]; L.fwd = [rw.x1 - 0.4, 2.5]; L.rewRect = rw;
    L.rooms = rooms; L.amb = o.amb || [0.36, 0.42, 0.4];
    return L;
  };

  // ---------------- THE BARON'S CRYPT (15x22): an entry stair, a candle-lit vault, the first Baron's tomb ----------------
  FL.tpl.bcrypt = function (R, def, K) {
    K.alloc(15, 22, false); const L = base(['The Baron\'s Crypt']);
    for (let y = 15; y <= 20; y++) for (let x = 6; x <= 8; x++) K.open(x, y, 0, 3.0, y > 18 ? 4 : 2, false);
    const V = { x0: 2, y0: 2, x1: 12, y1: 14 };
    for (let y = V.y0; y <= V.y1; y++) for (let x = V.x0; x <= V.x1; x++) { K.open(x, y, 0, 6.5, (x === 7 || (x + y) % 4 === 0) ? 2 : 5, false); CT[y * MW + x] = 1; }
    for (const y of [4, 7, 10, 13]) { K.wall(3, y, 99, 10); K.wall(11, y, 99, 10); }
    for (let x = 6; x <= 8; x++) K.wall(x, 4, 1.0, 8); // the tomb
    K.wall(7, 2, 99, 4);
    for (const [x, y] of [[4.5, 3.5], [10.5, 3.5], [4.5, 12.5], [10.5, 12.5]]) { L.props.push({ type: 'brazier', x, y, z: 0, green: false }); L.lights.push({ x, y, r: 4.6, i: 0.75, c: [1.0, 0.7, 0.35], flicker: true }); }
    for (const [x, y] of [[5.5, 6.5], [9.5, 6.5], [5.5, 9.5], [9.5, 9.5]]) { L.props.push({ type: 'candelabra', x, y, z: 0 }); }
    L.lights.push({ x: 7.5, y: 6.0, r: 3.6, i: 0.8, c: [1.0, 0.85, 0.55] }); L.lights.push({ x: 7.5, y: 18.5, r: 4, i: 0.6, c: [0.8, 0.7, 1.0] });
    L.start = { x: 7.5, y: 18.5, ang: -Math.PI / 2 }; L.back = [7.5, 20.2]; L.fwd = L.back; L.reward = [7.5, 5.6];
    L.tough = { x0: V.x0, y0: V.y0, x1: V.x1 + 1, y1: V.y1 + 1, cx: 7.5, cy: 8.5, fh: 0 };
    L.shafts = [{ x: 7.5, y: 4.6, w: 1.6, z0: 0, z1: 6, c: [255, 220, 140], i: 0.12, slant: 0, ph: 1 }];
    L.rooms = [{ x0: 6, y0: 15, x1: 8, y1: 20, kind: 'start' }, Object.assign({ kind: 'tough' }, V)]; L.amb = [0.3, 0.26, 0.24];
    return L;
  };

  // ---------- six new floor foes ----------
  const FOES2 = ['m20gravedigger', 'm20wisp', 'm20ghoul', 'm20thrall', 'm20slag', 'm20leech'];
  if (M20.floorfoes2) {
    const gm = (EDEF.ghost && EDEF.ghost.mat) || 'flesh';
    EDEF.m20gravedigger = { spr: 's_m20gravedigger', h: 1.45, hp: 58, speed: 1.4, range: 1.5, windup: 0.7, strike: 0.2, recover: 0.8, dmg: 13, mat: 'flesh', kbRes: 0.8, name: 'a Gravedigger' };
    EDEF.m20wisp = { spr: 's_m20wisp', h: 0.95, hp: 18, speed: 2.0, range: 1.0, windup: 0.45, strike: 0.2, recover: 1.0, dmg: 4, mat: gm, kbRes: 1.6, fly: 1.35, name: "a Will-o'-Wisp" };
    EDEF.m20ghoul = { spr: 's_m20ghoul', h: 0.95, hp: 40, speed: 3.3, range: 1.2, windup: 0.36, strike: 0.2, recover: 0.55, dmg: 9, mat: 'flesh', kbRes: 1.2, name: 'a Ghoul' };
    EDEF.m20thrall = { spr: 's_m20thrall', h: 1.62, hp: 120, speed: 0.95, range: 1.7, windup: 1.0, strike: 0.25, recover: 1.0, dmg: 20, mat: 'bone', kbRes: 0.3, armor: 0.6, name: 'a Forge Thrall' };
    EDEF.m20slag = { spr: 's_m20slag', h: 0.8, hp: 50, speed: 1.3, range: 1.15, windup: 0.6, strike: 0.2, recover: 0.8, dmg: 10, mat: 'bone', kbRes: 0.7, name: 'a Slag Crawler' };
    EDEF.m20leech = { spr: 's_m20leech', h: 0.55, hp: 22, speed: 2.2, range: 0.95, windup: 0.3, strike: 0.2, recover: 0.6, dmg: 4, mat: 'flesh', kbRes: 1.5, name: 'a Leech Swarm' };
    if (typeof UNDEAD !== 'undefined' && UNDEAD.add) ['m20gravedigger', 'm20ghoul', 'm20thrall'].forEach(t => UNDEAD.add(t));
  }
  // ---------- fourteen new floor bosses (the m20fboss move vocabulary) ----------
  const NB = {
    m20gravewarden: { spr: 's_m20gravewarden', h: 2.85, hp: 620, speed: 1.35, range: 2.8, windup: 0.8, strike: 0.25, recover: 0.9, dmg: 15, mat: 'flesh', kbRes: 0.06, col: '#a0f080', c: [150, 235, 110],
      name: 'the Gravewarden', title: 'THE GRAVEWARDEN', sub: 'He dug every grave in this yard. He kept one open for you.', p2: 'Every grave opens at once.', death: '"...fill it... in..."',
      moves: p2 => [['swing', 2.8], ['traps', 9, { n: p2 ? 5 : 3 }], ['lane', 9, { fan: p2 ? 3 : 1, n: 6, col: [170, 140, 90], dmg: 13 }], ['summon', 30, { t: 'm20gravedigger', n: p2 ? 2 : 1, cap: 2 }], p2 && ['ring', 3.2, { r: 3.2 }]] },
    m20broodkeeper: { spr: 's_m20broodkeeper', h: 2.8, hp: 640, speed: 1.6, range: 2.6, windup: 0.72, strike: 0.25, recover: 0.8, dmg: 14, mat: 'flesh', kbRes: 0.06, col: '#e0d8f0', c: [220, 210, 240],
      name: 'the Broodkeeper', title: 'THE BROODKEEPER', sub: 'The Brood Mother\'s eldest. She counts the eggs. She counts you.', p2: 'The egg sacs split open.', death: '"...my... children..."',
      moves: p2 => [['swing', 2.6], ['volley', 10, { n: p2 ? 5 : 3, sp: 8, dmg: 10, tint: [230, 230, 240] }], ['summon', 30, { t: 'spiderling', n: p2 ? 3 : 2, cap: 4 }], p2 && ['charge', 9]] },
    m20osssaint: { spr: 's_m20osssaint', h: 2.9, hp: 660, speed: 1.35, range: 2.8, windup: 0.78, strike: 0.25, recover: 0.85, dmg: 15, mat: 'bone', kbRes: 0.05, col: '#ff7060', c: [255, 90, 80],
      name: 'the Ossuary Saint', title: 'THE OSSUARY SAINT', sub: 'Ten thousand bones and one will. He is the will.', p2: 'Blood falls from the domes.', death: '"...ten thousand... and one..."',
      moves: p2 => [['swing', 2.8, { fire: true }], ['rain', 12, { n: p2 ? 6 : 4, dmg: 13, col: [255, 70, 60] }], ['summon', 30, { t: 'skeleton', n: 2, cap: 3 }], p2 && ['ring', 3.4, { r: 3.4 }]] },
    m20assembler: { spr: 's_m20assembler', h: 3.0, hp: 700, speed: 1.15, range: 3.0, windup: 0.9, strike: 0.25, recover: 0.95, dmg: 18, mat: 'bone', kbRes: 0.03, col: '#ffb080', c: [255, 150, 100],
      name: 'the Assembler', title: 'THE ASSEMBLER', sub: 'The pits built a Colossus once. This is what they made from the leftovers.', p2: 'It pulls more bones into itself.', death: '"...un... made..."',
      moves: p2 => [['swing', 3.0, { wide: true }], ['ring', 3.6, { r: 3.6 }], ['lane', 10, { fan: 2, n: 7, col: [240, 220, 190], dmg: 15 }], ['charge', 10], p2 && ['summon', 30, { t: 'skeleton', n: 2, cap: 3 }]] },
    m20matriarch: { spr: 's_m20matriarch', h: 2.9, hp: 740, speed: 1.7, range: 2.7, windup: 0.7, strike: 0.25, recover: 0.8, dmg: 16, mat: 'bone', kbRes: 0.05, col: '#90d0ff', c: [140, 210, 255],
      name: 'the Stormwing', title: 'THE STORMWING', sub: 'The Matriarch\'s firstborn. It nests where the great bell hangs.', p2: 'Lightning finds the bell.', death: '"...the bell... rings... for me..."',
      moves: p2 => [['volley', 11, { n: p2 ? 5 : 3, sp: 9, dmg: 11, tint: [160, 200, 255] }], ['rain', 14, { n: p2 ? 5 : 3, dmg: 15, col: [170, 210, 255], seq: true }], ['charge', 10], ['swing', 2.7], p2 && ['summon', 30, { t: EDEF.gargoyle ? 'gargoyle' : 'bat', n: 1, cap: 2 }]] },
    m20horologist: { spr: 's_m20horologist', h: 2.85, hp: 760, speed: 1.4, range: 2.8, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 16, mat: 'bone', kbRes: 0.05, col: '#ffd080', c: [255, 210, 120], kite: true,
      name: 'the Horologist', title: 'THE HOROLOGIST', sub: 'He wound the Baron\'s clocks. He is still keeping time.', p2: 'The gears run backward.', death: '"...time... is... up..."',
      moves: p2 => [['lane', 10, { cross: true, n: 6, col: [255, 210, 120], dmg: 14 }], ['volley', 11, { n: p2 ? 5 : 3, sp: 9, dmg: 11, tint: [255, 220, 150] }], ['traps', 9, { n: p2 ? 4 : 3 }], ['ring', 3.0, { r: 3.0, delay: true }], ['swing', 2.8]] },
    m20champion: { spr: 's_m20champion', h: 2.95, hp: 780, speed: 1.6, range: 2.9, windup: 0.7, strike: 0.25, recover: 0.8, dmg: 17, mat: 'flesh', kbRes: 0.05, col: '#ffd060', c: [255, 200, 90],
      name: 'the Undying Champion', title: 'THE UNDYING CHAMPION', sub: 'A thousand wins in this arena. The crowd still wants one more.', p2: '"The crowd! Hear them!"', death: '"...thumbs... down..."',
      moves: p2 => [['swing', 2.9, { combo: true }], ['charge', 10], ['lane', 9, { fan: p2 ? 3 : 1, n: 7, col: [255, 200, 90], dmg: 15 }], ['ring', 3.2, { r: 3.2 }]] },
    m20lanista: { spr: 's_m20lanista', h: 2.9, hp: 800, speed: 1.45, range: 2.9, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 17, mat: 'flesh', kbRes: 0.05, col: '#e0b080', c: [225, 175, 120],
      name: 'the Lanista', title: 'THE LANISTA', sub: 'He bought and sold the dead fighters. You are his last purchase.', p2: 'He opens the pens.', death: '"...sold... out..."',
      moves: p2 => [['swing', 2.9], ['volley', 11, { n: 3, sp: 8, dmg: 12, tint: [220, 190, 150] }], ['traps', 9, { n: p2 ? 5 : 3 }], ['charge', 10], ['summon', 30, { t: EDEF.hellhound ? 'hellhound' : 'fzombie', n: 1, cap: p2 ? 2 : 1 }]] },
    m20debtreaper: { spr: 's_m20debtreaper', h: 3.0, hp: 820, speed: 1.5, range: 3.1, windup: 0.72, strike: 0.25, recover: 0.8, dmg: 18, mat: 'flesh', kbRes: 0.04, col: '#90ff90', c: [130, 255, 140],
      name: 'the Debt Reaper', title: 'THE DEBT REAPER', sub: 'Morwen keeps the ledger. He collects.', p2: '"Your account is overdue."', death: '"...paid... in full..."',
      moves: p2 => [['swing', 3.1, { wide: true }], ['lane', 10, { fan: 3, n: 7, col: [130, 255, 140], dmg: 15 }], ['rain', 12, { n: p2 ? 6 : 4, dmg: 14, col: [130, 255, 140] }], p2 && ['summon', 30, { t: EDEF.acolyte ? 'acolyte' : 'skeleton', n: 2, cap: 2 }]] },
    m20boghag: { spr: 's_m20boghag', h: 2.85, hp: 840, speed: 1.25, range: 2.7, windup: 0.78, strike: 0.25, recover: 0.85, dmg: 17, mat: 'flesh', kbRes: 0.05, col: '#80f0d0', c: [110, 230, 200], kite: true,
      name: 'the Bog Hag', title: 'THE BOG HAG', sub: 'She drowned herself to stay young. It worked, in its way.', p2: 'The bog boils.', death: '"...sink... with me..."',
      moves: p2 => [['submerge', 30], ['volley', 11, { n: p2 ? 5 : 3, sp: 8, dmg: 12, tint: [120, 240, 200] }], ['rain', 12, { n: 4, dmg: 14, col: [110, 230, 200] }], ['summon', 30, { t: EDEF.m20leech ? 'm20leech' : 'zombie', n: 2, cap: 3 }], p2 && ['ring', 3.0, { r: 3.0 }]] },
    m20ashherald: { spr: 's_m20ashherald', h: 2.95, hp: 860, speed: 1.55, range: 2.9, windup: 0.72, strike: 0.25, recover: 0.8, dmg: 18, mat: 'flesh', kbRes: 0.04, col: '#ff9050', c: [255, 140, 60],
      name: 'the Ash Herald', title: 'THE ASH HERALD', sub: 'He rings the forge bell from the chimney tops. The ash is his message.', p2: 'Embers rain on the stacks.', death: '"...cold... at last..."',
      moves: p2 => [['swing', 2.9, { fire: true }], ['rain', 14, { n: p2 ? 7 : 5, dmg: 14, col: [255, 140, 60], seq: true }], ['volley', 11, { n: 3, sp: 9, dmg: 12, tint: [255, 150, 70] }], ['charge', 10]] },
    m20forgefather: { spr: 's_m20forgefather', h: 3.05, hp: 880, speed: 1.2, range: 3.0, windup: 0.85, strike: 0.25, recover: 0.9, dmg: 21, mat: 'flesh', kbRes: 0.03, col: '#ff8040', c: [255, 120, 50],
      name: 'the Forgefather', title: 'THE FORGEFATHER', sub: 'He forged the chains that held Cerberax. He can forge one more.', p2: 'The crucibles pour.', death: '"...the fire... goes... out..."',
      moves: p2 => [['swing', 3.0, { fire: true, wide: true }], ['ring', 3.8, { r: 3.8 }], ['lane', 10, { fan: p2 ? 3 : 2, n: 7, col: [255, 130, 40], dmg: 16 }], p2 && ['summon', 30, { t: EDEF.m20thrall ? 'm20thrall' : 'skeleton', n: 1, cap: 1 }]] },
    m20captain: { spr: 's_m20captain', h: 3.0, hp: 940, speed: 1.5, range: 3.3, windup: 0.72, strike: 0.25, recover: 0.8, dmg: 20, mat: 'flesh', kbRes: 0.04, col: '#b0a0ff', c: [165, 150, 255],
      name: 'the Captain of Night', title: 'THE CAPTAIN OF NIGHT', sub: 'Captain of the Lich\'s honor guard. He has not slept in three hundred years.', p2: '"Guard! To the spire!"', death: '"...relieved... of duty..."',
      moves: p2 => [['swing', 3.3, { combo: true }], ['lane', 9, { cross: true, n: 6, col: [165, 150, 255], dmg: 16 }], ['charge', 10], p2 && ['ring', 3.6, { r: 3.6 }], p2 && ['summon', 30, { t: EDEF.royalguard ? 'royalguard' : 'skeleton', n: 1, cap: 2 }]] },
    m20soulwright: { spr: 's_m20soulwright', h: 2.95, hp: 950, speed: 1.35, range: 2.8, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 19, mat: 'flesh', kbRes: 0.04, col: '#a0ff80', c: [140, 255, 120], kite: true,
      name: 'the Soulwright', title: 'THE SOULWRIGHT', sub: 'He split the Lich\'s soul into the jars. He kept a little for himself.', p2: 'The vats crack open.', death: '"...the jar... is... empty..."',
      moves: p2 => [['volley', 11, { n: p2 ? 6 : 4, sp: 9, dmg: 12, tint: [150, 255, 120] }], ['lane', 10, { fan: 2, n: 7, col: [140, 255, 120], dmg: 15 }], ['ring', 3.2, { r: 3.2, delay: true }], ['summon', 30, { t: EDEF.m20wight ? 'm20wight' : 'ghost', n: 1, cap: 2 }], p2 && ['rain', 12, { n: 5, dmg: 15, col: [140, 255, 120] }], ['swing', 2.8]] },
  };
  if (FL.addBoss) for (const t in NB) FL.addBoss(t, NB[t]);
  const FEATS2 = [['m20_gravewarden', 'SEXTON\'S REST', 'Fell the Gravewarden in the Graveyard Above.'], ['m20_broodkeeper', 'EGG COUNT ZERO', 'Fell the Broodkeeper in the Brood Warrens.'], ['m20_osssaint', 'ONE WILL LESS', 'Fell the Ossuary Saint on the Charnel Domes.'],
    ['m20_assembler', 'DISASSEMBLY', 'Fell the Assembler in the Marrow Pits.'], ['m20_matriarch', 'STORM CHASER', 'Fell the Stormwing on the Bell Tower Top.'], ['m20_horologist', 'OUT OF TIME', 'Fell the Horologist in the Clockworks.'],
    ['m20_champion', 'THE LAST BOUT', 'Fell the Undying Champion in the Stands.'], ['m20_lanista', 'NOT FOR SALE', 'Fell the Lanista in the Undercroft Pens.'], ['m20_debtreaper', 'DEBT FORGIVEN', 'Fell the Debt Reaper on the Cliff Mausoleums.'],
    ['m20_boghag', 'DRAINED THE BOG', 'Fell the Bog Hag in the Bog Ossuary.'], ['m20_ashherald', 'ASHES TO ASHES', 'Fell the Ash Herald on the Smokestacks.'], ['m20_forgefather', 'QUENCHED', 'Fell the Forgefather in the Deep Forge.'],
    ['m20_captain', 'DISMISSED', 'Fell the Captain of Night on the Spire of Night.'], ['m20_soulwright', 'EMPTY JARS', 'Fell the Soulwright in the Phylactery Foundry.'],
    ['m20_oath', 'OATHSWORN', 'Keep an Oath Shrine\'s curse and clear its floor.'], ['m20_bcrypt', 'BLOOD OF THE CANDLE', 'Find all 20 floor pages and enter the Baron\'s Crypt.']];
  try { if (window.ACH) for (const [id, n, d] of FEATS2) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d }); if (window.M12 && M12.STEAM) for (const [id] of FEATS2) M12.STEAM.map[id] = 'TU_' + id.toUpperCase(); } catch (e) { }
  // the Lore Book's boss ledger (m20npc defines M20.BOSSES; the m20fboss six were pushed before it existed, so add them too)
  const LEDGER = [['m20roofer', 'THE SLATE KING', 1, 'Fifty years on the roof. He threw the whole ridge at me. I threw him off it.'], ['m20abbot', 'THE FIRST ABBOT', 1, 'He picked the first Kael. He was sure I was the wrong one. He was wrong.'],
    ['m20huntmaster', 'THE HUNTMASTER', 4, 'He set traps for wolves. I am not a wolf.'], ['m20cistern', 'THE CISTERN MOTHER', 4, 'She only wanted the dark water to stay still. It is still now.'],
    ['m20spire', 'THE SPIRE WARDEN', 9, 'He fought the storm every night. I let him rest in it.'], ['m20oathbound', 'THE OATHBOUND KNIGHT', 9, 'He knelt for the Baron. When I came, he stood. The oath was mine to end.'],
    ['m20gravewarden', 'THE GRAVEWARDEN', 2, 'He kept a grave open for me. I left him in it.'], ['m20broodkeeper', 'THE BROODKEEPER', 2, 'She counted her eggs every night. I counted to zero.'],
    ['m20osssaint', 'THE OSSUARY SAINT', 3, 'Ten thousand bones and one will. The will broke first.'], ['m20assembler', 'THE ASSEMBLER', 3, 'The leftovers of a giant. Now they are leftovers again.'],
    ['m20matriarch', 'THE STORMWING', 5, 'It nested in the bell. The bell is quiet, and so is it.'], ['m20horologist', 'THE HOROLOGIST', 5, 'He kept the Baron\'s time. I told him the hour.'],
    ['m20champion', 'THE UNDYING CHAMPION', 6, 'A thousand wins. The crowd finally got their upset.'], ['m20lanista', 'THE LANISTA', 6, 'He tried to buy me. I was not for sale.'],
    ['m20debtreaper', 'THE DEBT REAPER', 7, 'He came to collect. Ozmeth would have laughed.'], ['m20boghag', 'THE BOG HAG', 7, 'She drowned to stay young. The bog keeps her now.'],
    ['m20ashherald', 'THE ASH HERALD', 8, 'He rang the forge bell with his last breath. Nobody came.'], ['m20forgefather', 'THE FORGEFATHER', 8, 'He forged one more chain. It was not enough.'],
    ['m20captain', 'THE CAPTAIN OF NIGHT', 10, 'Three hundred years on watch. I relieved him.'], ['m20soulwright', 'THE SOULWRIGHT', 10, 'He kept a little of the Lich for himself. I took it back.']];
  const addLedger = () => { try { if (!M20.BOSSES) return false; for (const r of LEDGER) if (EDEF[r[0]] && !M20.BOSSES.some(b => b[0] === r[0])) M20.BOSSES.push(r); return true; } catch (e) { ER('ledger', e); return false; } };
  if (!addLedger()) window.addEventListener('load', addLedger);

  // ---------- the fourteen floors ----------
  const P2 = M20.floorfoes2;
  const pools = {
    s2u: [['zombie', 2.4], ['skeleton', 1.4], ['m20gravedigger', P2 ? 2.2 : 0], ['m20wisp', P2 ? 1.4 : 0], ['m20murder', 0.8]],
    s2d: [['spiderling', 2.6], ['zombie', 1.4], ['m20ghoul', P2 ? 2.2 : 0], ['m20wight', 1.2], ['fzombie', 1]],
    s3u: [['bat', 2], ['skeleton', 1.8], ['m20murder', 1.4], ['m20wisp', P2 ? 1.6 : 0], ['m20arbalest', 1]],
    s3d: [['skeleton', 2.4], ['azombie', 1.6], ['m20ghoul', P2 ? 2 : 0], ['zombie', 1.2]],
    s5u: [['bat', 1.8], ['gargoyle', 1.2], ['m20arbalest', 1.8], ['m20murder', 1.2], ['skeleton', 1]],
    s5d: [['imp', 1.6], ['skeleton', 1.4], ['m20thrall', P2 ? 1.4 : 0], ['m20slag', P2 ? 1.8 : 0], ['zombie', 1]],
    s6u: [['skeleton', 2], ['gladiator', 1.4], ['m20murder', 1.2], ['m20arbalest', 1.2], ['m20wisp', P2 ? 1 : 0]],
    s6d: [['gladiator', 1.4], ['hellhound', 1.1], ['m20thrall', P2 ? 1.4 : 0], ['m20slag', P2 ? 1.6 : 0], ['skeleton', 1.4]],
    s7u: [['acolyte', 1.6], ['skeleton', 1.4], ['m20gravedigger', P2 ? 1.8 : 0], ['m20wisp', P2 ? 1.8 : 0], ['m20arbalest', 1]],
    s7d: [['zombie', 1.6], ['m20drowned', 2.2], ['m20leech', P2 ? 2.4 : 0], ['azombie', 1]],
    s8u: [['bat', 1.6], ['hellhound', 1.4], ['m20arbalest', 2], ['m20murder', 1], ['imp', 1]],
    s8d: [['hellhound', 1.4], ['imp', 1.2], ['m20thrall', P2 ? 1.8 : 0], ['m20slag', P2 ? 2 : 0], ['skeleton', 1]],
    s10u: [['royalguard', 1.2], ['skeleton', 1.6], ['m20arbalest', 2], ['m20murder', 1.4], ['voidshade', 0.8]],
    s10d: [['m20wight', 1.6], ['m20ghoul', P2 ? 2 : 0], ['acolyte', 1.4], ['azombie', 1.4], ['ghost', 1]],
  };
  const pool = id => pools[id].filter(p => p[1] > 0 && typeof EDEF !== 'undefined' && EDEF[p[0]]);
  const REG = [
    ['s2u', { stage: 2, which: 'up', name: 'THE GRAVEYARD ABOVE', sub: 'Above the Weeping Catacombs', tpl: 'opencourt', pal: 'grave', n: 17, opts: { amb: [0.34, 0.42, 0.38], lc: [0.5, 0.95, 0.6], green: true },
      boss: 'm20gravewarden', toughName: 'Gravewarden', lore: 'sexton', bp: 'spade', snames: ['The Sexton\'s Shed', 'The Paupers\' Vault', 'The Little Mausoleum'] }],
    ['s2d', { stage: 2, which: 'down', name: 'THE BROOD WARRENS', sub: 'Beneath the Weeping Catacombs', tpl: 'warren', pal: 'crypt', n: 18, opts: { amb: [0.3, 0.3, 0.34] },
      boss: 'm20broodkeeper', toughName: 'Broodkeeper', lore: 'brood', soul: 's2d', snames: ['The Egg Cellar', 'The Webbed Niche'] }],
    ['s3u', { stage: 3, which: 'up', name: 'THE CHARNEL DOMES', sub: 'Above the Blood Ossuary', tpl: 'rooftop', pal: 'roofoss', n: 17, opts: { catwalk: true, amb: [0.5, 0.3, 0.3] },
      boss: 'm20osssaint', toughName: 'Ossuary Saint', lore: 'tenthousand', snames: ['The Bone Loft', 'The Reliquary Dome'] }],
    ['s3d', { stage: 3, which: 'down', name: 'THE MARROW PITS', sub: 'Beneath the Blood Ossuary', tpl: 'tallhall', pal: 'oss', n: 18, opts: { inverted: true, liquid: 'blood', amb: [0.4, 0.28, 0.28], lc: [1.0, 0.4, 0.3] },
      boss: 'm20assembler', toughName: 'Assembler', lore: 'assembly', soul: 's3d', snames: ['The Marrow Store', 'The Rib Vault'] }],
    ['s5u', { stage: 5, which: 'up', name: 'THE BELL TOWER TOP', sub: 'Above the Gargoyle Belfry', tpl: 'rooftop', pal: 'roofbell', n: 18, opts: { amb: [0.36, 0.42, 0.6] },
      boss: 'm20matriarch', toughName: 'Stormwing', lore: 'silentbell', bp: 'maul', snames: ['The Ringer\'s Loft', 'The Nest'] }],
    ['s5d', { stage: 5, which: 'down', name: 'THE CLOCKWORKS', sub: 'Beneath the Gargoyle Belfry', tpl: 'tallhall', pal: 'clock', n: 18, opts: { amb: [0.38, 0.34, 0.28], lc: [1.0, 0.75, 0.4], bc: [1.0, 0.7, 0.3] },
      boss: 'm20horologist', toughName: 'Horologist', lore: 'hours', soul: 's5d', snames: ['The Spring Room', 'The Stopped Clock'] }],
    ['s6u', { stage: 6, which: 'up', name: 'THE STANDS', sub: 'Above the Blood Arena: the Emperor\'s Box', tpl: 'opencourt', pal: 'arena', n: 18, opts: { arena: true, amb: [0.48, 0.32, 0.3], lc: [1.0, 0.55, 0.35] },
      boss: 'm20champion', toughName: 'Undying Champion', lore: 'bread', soul: 's6u', snames: ['The Emperor\'s Box', 'The Bookmaker\'s Booth'] }],
    ['s6d', { stage: 6, which: 'down', name: 'THE UNDERCROFT PENS', sub: 'Beneath the Blood Arena', tpl: 'tallhall', pal: 'pens', n: 18, opts: { amb: [0.36, 0.3, 0.28], lc: [1.0, 0.55, 0.3] },
      boss: 'm20lanista', toughName: 'Lanista', lore: 'pens', bp: 'nettrident', snames: ['The Lift Cage', 'The Beast Pen'] }],
    ['s7u', { stage: 7, which: 'up', name: 'THE CLIFF MAUSOLEUMS', sub: 'Above the Witch\'s Necropolis', tpl: 'rampart', pal: 'cliff', n: 18, opts: { amb: [0.34, 0.44, 0.36], lc: [0.4, 1.0, 0.5] },
      boss: 'm20debtreaper', toughName: 'Debt Reaper', lore: 'ledger', soul: 's7u', snames: ['The Debtors\' Tomb', 'The Comet Watch'] }],
    ['s7d', { stage: 7, which: 'down', name: 'THE BOG OSSUARY', sub: 'Beneath the Witch\'s Necropolis', tpl: 'flooded', pal: 'bog', n: 18, opts: { amb: [0.3, 0.38, 0.32], lc: [0.35, 1.0, 0.7] },
      boss: 'm20boghag', toughName: 'Bog Hag', lore: 'hag', snames: ['The Root Vault'] }],
    ['s8u', { stage: 8, which: 'up', name: 'THE SMOKESTACKS', sub: 'Above the Hellforge Kennels', tpl: 'rooftop', pal: 'roofsmoke', n: 18, opts: { catwalk: true, amb: [0.5, 0.32, 0.26] },
      boss: 'm20ashherald', toughName: 'Ash Herald', lore: 'hellforge', snames: ['The Flue', 'The Stoker\'s Perch'] }],
    ['s8d', { stage: 8, which: 'down', name: 'THE DEEP FORGE', sub: 'Beneath the Hellforge Kennels', tpl: 'tallhall', pal: 'forge', n: 18, opts: { liquid: 'lava', amb: [0.44, 0.3, 0.24], lc: [1.0, 0.45, 0.2] },
      boss: 'm20forgefather', toughName: 'Forgefather', lore: 'chains', bp: 'forgehammer', snames: ['The Pattern Room', 'The Cold Crucible'] }],
    ['s10u', { stage: 10, which: 'up', name: 'THE SPIRE OF NIGHT', sub: 'Above the Lich\'s Throne', tpl: 'rampart', pal: 'spire', n: 19, opts: { amb: [0.36, 0.34, 0.52], lc: [0.6, 0.5, 1.0] },
      boss: 'm20captain', toughName: 'Captain of Night', lore: 'sunrise', soul: 's10u', snames: ['The Guard Room', 'The Aurora Stair'] }],
    ['s10d', { stage: 10, which: 'down', name: 'THE PHYLACTERY FOUNDRY', sub: 'Beneath the Lich\'s Throne', tpl: 'warren', pal: 'phyl', n: 19, opts: { green: true, amb: [0.3, 0.38, 0.32], secrets: 2 },
      boss: 'm20soulwright', toughName: 'Soulwright', lore: 'phyl', snames: ['The Jar Room', 'The Press'] }],
  ];
  for (const [id, d] of REG) { d.pool = undefined; Object.defineProperty(d, 'pool', { get() { return pool(id); }, enumerable: true, configurable: true }); FL.register(id, d); }
  M20.NEWFLOORS = REG.map(r => r[0]);
  // the floor tough spot for the new floors: m20fdat's FL.build wrapper sets toughDone for every floor, and its FL.enter
  // wrapper spawns def.boss through FL.spawnBoss, so nothing else is needed here.

  // ---------- foe behaviours (all wrapped, all inert when the foe types do not exist) ----------
  const isFree = (x, y) => { const c = cellAt(x, y); return c >= 0 && !isSolid(c) && Math.abs(floorAt(x, y) - P.z) < 0.8; };
  const mark = o => { try { if (window.M14 && M14.marks && M14.marks.length < 40) M14.marks.push(Object.assign({ t: 0, delay: 1, r: 1, dmg: 12, col: [255, 200, 90], k: 'pillar' }, o)); } catch (e) { } };
  const shock = (x, y, r, dmg, c, src) => { try { if (window.M13 && M13.B && M13.B.ring) return M13.B.ring(x, y, r, dmg, RGB(c[0], c[1], c[2]), src); } catch (e) { ER('shock', e); } return 'none'; };
  const nodmg = (n, col) => { P.hp = Math.max(1, P.hp - n); P.hurtT = Math.max(P.hurtT || 0, 0.15); try { dmgNum(P.x + Math.cos(P.ang) * 0.8, P.y + Math.sin(P.ang) * 0.8, P.z + 1.4, '-' + n, col); } catch (e) { } };
  const TRAIL = M20.slagTrail = []; const RINGS = M20.wRings = [];
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.m20netT > 0) { e.m20netT -= dt; dt *= e.m20boss ? 0.7 : 0.45; }
    if (e.m20boss || !e.alive || e.dead || !FOES2.includes(e.type)) return _ue.call(this, e, dt);
    try {
      const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy);
      if (e.type === 'm20gravedigger' && e.awake) {
        if (e.m20bur) { // travels underground as a dirt mound, erupts under you
          const B = e.m20bur; B.t += dt; if (d > 0.9) moveEntity(e, dx / d * 3.6 * dt, dy / d * 3.6 * dt, e.r * 0.8, 0.33, false);
          if (Math.random() < dt * 14) dust(e.x, e.y, floorAt(e.x, e.y), 1);
          if (B.t > 1.8 || d < 1.0) { e.m20bur = null; e.m20inv = false; e.state = 'chase'; e.cd = 0.7; shock(e.x, e.y, 1.35, 11, [170, 130, 80], e); SFX.play('stone', 0.8); dust(e.x, e.y, floorAt(e.x, e.y), 14); }
          return;
        }
        e.m20bc = (e.m20bc === undefined ? rand(2, 4) : e.m20bc) - dt;
        if (e.m20bc <= 0 && d > 3.2 && d < 12 && (e.state === 'chase' || e.state === 'idle')) { e.m20bc = rand(5, 8); e.m20bur = { t: 0 }; e.m20inv = true; SFX.play('stone', 0.6); dust(e.x, e.y, floorAt(e.x, e.y), 10); return; }
      }
      if (e.type === 'm20wisp' && e.awake && d < 2.2 && P.mana > 0) { P.mana = Math.max(0, P.mana - 7 * dt); e.m20dr = (e.m20dr || 0) + dt; if (e.m20dr > 0.8) { e.m20dr = 0; try { dmgNum(P.x + Math.cos(P.ang) * 0.8, P.y + Math.sin(P.ang) * 0.8, P.z + 1.2, '-MANA', '#80d0ff'); } catch (er) { } } }
      if (e.type === 'm20ghoul') { if (!e.m20sp) e.m20sp = e.d.speed; e.d.speed = e.m20sp * (P.hp < P.maxhp * 0.5 ? 1.25 : 1); }
      if (e.type === 'm20slag' && e.awake) { e.m20tr = (e.m20tr || 0) - dt; if (e.m20tr <= 0) { e.m20tr = 0.45; if (TRAIL.length < 48) TRAIL.push({ x: e.x, y: e.y, z: floorAt(e.x, e.y), t: 0 }); } }
      const was = e.state; const r = _ue.call(this, e, dt);
      if (e.type === 'm20thrall' && was === 'windup' && e.state === 'strike') { shock(e.x, e.y, 2.3, 12, [255, 140, 60], e); SFX.play('heavy', 0.7); G.shake += 2; }
      return r;
    } catch (er) { ER('foe ai', er); return _ue.call(this, e, dt); }
  };
  const _rv = rogueVisual;
  rogueVisual = function (e, v) {
    v = _rv(e, v); if (!v || e.dead) return v;
    if (e.m20bur) v.alpha = 0;
    if (e.m20netT > 0) v.tint = [200, 180, 120, 0.25];
    return v;
  };
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const was = e && e.alive, r = _ke.apply(this, arguments);
    try {
      if (was && e.type === 'm20wisp' && !(o && /ranged|pistol|bolt|cross/.test(o.src || ''))) mark({ x: e.x, y: e.y, delay: 0.35, r: 1.5, dmg: 15, col: [150, 230, 255], src: e });
      if (was && e.type === 'm20slag') mark({ x: e.x, y: e.y, delay: 0.5, r: 1.7, dmg: 14, col: [255, 140, 50], src: e });
      if (was) { e.m20bur = null; e.m20inv = false; }
    } catch (er) { ER('foe death', er); }
    return r;
  };
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    try { if (OATH.cur && OATH.cur.sworn && !OATH.cur.broken && OATH.cur.k === 'blood' && opt && opt.src && typeof opt.src === 'object') dmg = Math.round(dmg * 1.4); } catch (e) { }
    const r = _hp.call(this, dmg, sx, sy, opt);
    try { if (r === 'hit' && opt && opt.src && opt.src.type === 'm20leech') { const f = !P.m20lc; P.m20lc = Math.min(3, (P.m20lc | 0) + 1); P.m20lt = 0; P.m20la = 0; if (f) toast('LEECHES!', 'Roll or burn to shake them off.', '#c0d080', 1.8); } } catch (e) { }
    return r;
  };

  // ---------- four new floor weapons (overlay-only effects, views untouched) ----------
  const ITEMS = M20.FITEMS;
  const NEWW = {
    spade: { id: 'm20spade', kind: 'WEAPON', slot: 'sword', view: 'axe', cost: 300, r: 'rare', name: "GRAVEDIGGER'S SPADE", icon: 'ic_m20spade', desc: 'A grave spade swung like an axe. Every hit splashes 40% to foes beside the target, and heavy strikes knock foes flat.', where: 'THE GRAVEYARD ABOVE (Stage 2, upper floor)' },
    maul: { id: 'm20maul', kind: 'WEAPON', slot: 'sword', view: 'great', cost: 400, r: 'epic', name: 'BELL-CLAPPER MAUL', icon: 'ic_m20maul', desc: 'The great bell\'s clapper on a haft. Heavy strikes toll the bell: a shockwave hits every other foe within 2.6 m for 14.', where: 'THE BELL TOWER TOP (Stage 5, upper floor)' },
    nettrident: { id: 'm20nettrident', kind: 'WEAPON', slot: 'whip', view: 'chain', cost: 500, r: 'epic', name: 'RETIARIUS NET-TRIDENT', icon: 'ic_m20nettrident', desc: 'A gladiator\'s weighted net on a chain. Lashes snare foes: they move and attack at 45% speed for 1.5 s (bosses 70%).', where: 'THE UNDERCROFT PENS (Stage 6, lower floor)' },
    forgehammer: { id: 'm20forgehammer', kind: 'WEAPON', slot: 'sword', view: 'fire', cost: 600, r: 'legendary', name: "FORGEFATHER'S HAMMER", icon: 'ic_m20forgehammer', desc: 'A fire blade forged as a hammer. Heavy strikes slam the ground: 16 to every foe around the blow, armor broken, the target set alight.', where: 'THE DEEP FORGE (Stage 8, lower floor)' },
  };
  const SWMODS = ['m20trident', 'm20halberd', 'm20spade', 'm20maul', 'm20forge'];
  const MODK = { spade: 'm20spade', maul: 'm20maul', forgehammer: 'm20forge', nettrident: 'm20net' };
  M20.takeExt = M20.takeExt || {};
  if (ITEMS) for (const key in NEWW) {
    const I = NEWW[key]; ITEMS[key] = I;
    M20.takeExt[key] = function () { if (I.slot === 'sword') { P.wpn.sword = I.view; for (const m of SWMODS) P.mods[m] = 0; } else { P.wpn.whip = I.view; P.mods.m20censer = 0; } P.mods[MODK[key]] = 1; };
    if (!UPG.some(u => u.id === I.id)) UPG.push({ id: I.id, kind: I.kind, r: I.r, name: I.name, icon: I.icon, desc: I.desc, ok: () => false, take() { if (M20.takeItem) M20.takeItem(key); } });
    PICK['m20bp_' + key] = { tex: I.icon, h: 0.5, gc: [255, 220, 120], f(p) {
      if (M20.takeItem) M20.takeItem(key); const s = FL.sv(); const first = !s.bp[key]; s.bp[key] = (s.bp[key] | 0) + 1;
      G.bigText = { t1: I.name, t2: first ? 'Registered at the Altar: buy it to start runs with it.' : I.desc.split('.')[0] + '.', t: 0, dur: 3.2 }; SFX.play('secret', 0.9); try { writeSave(); } catch (e) { } return true; } };
  }
  const wOn = k => P.mods && P.mods[MODK[k]] && (NEWW[k].slot === 'sword' ? P.wpn.sword === NEWW[k].view : P.wpn.whip === NEWW[k].view);
  const _oh = rogueOnHit;
  rogueOnHit = function (e, o, dmg) {
    const r = _oh.apply(this, arguments);
    try {
      if (!o || o.m20x || !P.mods || !e) return r;
      if (e.type === 'm20thrall' && o.src === 'sword' && P.wpn.sword === 'frost' && e.d.armor) { e.d.armor = 0; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'QUENCHED', '#a0e0ff'); SFX.play('fire', 0.4); }
      if (o.src === 'sword' && wOn('spade')) {
        let n = 0; for (const q of G.enemies) { if (n >= 3 || q === e || !q.alive || q.hidden || q.m20inv) continue; if (Math.hypot(q.x - e.x, q.y - e.y) > 1.5) continue; n++; damageEnemy(q, dmg * 0.4, { src: 'sword', m20x: 1, kb: 0.6, col: '#d0b080' }); }
        if (o.heavy && e.alive && !e.d.boss && !e.m20boss && !e.m13mini && e.type !== 'azombie' && !(e.downT > 0)) { e.downT = 1.0; e.downMax = 1.0; e.state = 'down'; e.st = 0; e.atk = null; e.vz = 2.2; e.z += 0.02; dust(e.x, e.y, e.z, 6); }
      }
      if (o.src === 'sword' && o.heavy && wOn('maul')) {
        for (const q of G.enemies) { if (q === e || !q.alive || q.hidden || q.m20inv) continue; if (Math.hypot(q.x - e.x, q.y - e.y) < 2.6) damageEnemy(q, 14, { src: 'magic', m20x: 1, kb: 1.2, col: '#c0e0ff' }); }
        if (RINGS.length < 6) RINGS.push({ x: e.x, y: e.y, z: floorAt(e.x, e.y), t: 0, r: 2.6, c: [190, 220, 255] }); SFX.play('toll', 0.45); G.shake += 2;
      }
      if (o.src === 'sword' && o.heavy && wOn('forgehammer')) {
        const fx = e.x, fy = e.y; for (const q of G.enemies) { if (q === e || !q.alive || q.hidden || q.m20inv) continue; if (Math.hypot(q.x - fx, q.y - fy) < 2.0) damageEnemy(q, 16, { src: 'magic', m20x: 1, kb: 0.8, col: '#ffa050' }); }
        if (e.alive && !e.d.boss && !e.m20boss && e.d.armor) { e.d.armor = 0; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'ARMOR BROKEN', '#ffa050'); }
        e.burnT = Math.max(e.burnT || 0, 3); e.burnTick = e.burnTick || 0;
        if (RINGS.length < 6) RINGS.push({ x: fx, y: fy, z: floorAt(fx, fy), t: 0, r: 2.0, c: [255, 140, 50] }); SFX.play('heavy', 0.6); G.shake += 3;
      }
      if (o.src === 'whip' && wOn('nettrident') && e.alive) { if (!(e.m20netT > 0)) dmgNum(e.x, e.y, e.z + e.h + 0.3, 'NETTED', '#e0c890'); e.m20netT = 1.5; }
    } catch (er) { ER('weapon hit', er); }
    return r;
  };
  // the Altar: the four new floor weapons are buyable once found (m20fboss's altar wrappers handle any it.m20 row)
  if (M20.floorbuy && typeof ALTAR !== 'undefined') {
    const rows = Object.keys(NEWW).map(k => ({ tab: 2, id: 'ld_m20' + k, m20: k, slot: NEWW[k].slot, need: NEWW[k].id, cost: NEWW[k].cost, name: 'START: ' + NEWW[k].name, icon: NEWW[k].icon }));
    const li = ALTAR.items.findIndex(i => i.id === 'm20seal'); // keep the floor rows together, ahead of the seal / lantern
    for (const r of rows) if (!ALTAR.items.some(i => i.id === r.id)) { if (li >= 0) ALTAR.items.splice(ALTAR.items.findIndex(i => i.id === 'm20seal'), 0, r); else ALTAR.items.push(r); }
  }

  // ---------- 14 lore pages, six freed souls, the coffer ----------
  const PAGES = M20.FLOORPAGES || (M20.FLOORPAGES = []);
  const NP = [
    { id: 'f2u', title: "THE SEXTON'S LEDGER", fl: 's2u', hint: 'In the graveyard above Stage 2.', text: 'Dug: four hundred and twelve. Filled: four hundred and eleven. The Warden says the last one is for a Kael, and that a Kael never stays in it. He says the Order paid for it in advance. He says it is the only grave in the yard that is never late.' },
    { id: 'f2d', title: 'THE BROOD', fl: 's2d', hint: 'In the warrens under Stage 2.', text: 'The Order kept the spiders. Nobody remembers why. A brother wrote that the webs held the catacombs together after the quake, and that the Brood Mother was a nun once, who promised to keep the dead from falling. She keeps them. She just does not let them go.' },
    { id: 'f3u', title: 'TEN THOUSAND, ONE WILL', fl: 's3u', hint: 'On the domes above Stage 3.', text: 'Ten thousand of the dead built the domes out of themselves, so the plague would have nowhere left to lie. The Saint asked only for their bones. The bones agreed. When the Lich came the bones agreed with him too. Bones are agreeable. That is the trouble with them.' },
    { id: 'f3d', title: 'THE ASSEMBLY', fl: 's3d', hint: 'In the pits under Stage 3.', text: 'Every Kael who fell in the Ossuary was carried down here. The Order kept a bone of each in the pits, labelled. Nine of the labels say Kael. The tenth is blank and the ink is still wet. The Assembler likes a complete set.' },
    { id: 'f5u', title: 'THE SILENT BELL II', fl: 's5u', hint: 'On the bell tower above Stage 5.', text: 'The great bell rang for every Kael who came home. The Matriarch sat on it so it would not ring for the Lich. Her firstborn still nests there. When lightning strikes the bell, it rings once, by itself, and it rings for you.' },
    { id: 'f5d', title: "THE BARON'S CLOCKS", fl: 's5d', hint: 'In the clockworks under Stage 5.', text: 'The Horologist kept one clock for each Baron of Kael. When a Baron died, he stopped the clock. Then he wound it again, because the candle brought them back. Thirty-one clocks. Thirty stopped. One still ticking, very loudly, in the room you are standing in.' },
    { id: 'f6u', title: 'BREAD AND BLOOD II', fl: 's6u', hint: 'In the stands above Stage 6.', text: 'The Emperor\'s Box kept a wager book. The odds on a Kael were always long, and a Kael always won. The bookmaker went broke four times. The fifth time he stopped taking bets and started taking notes. The notes say: they do not win. They just do not stay down.' },
    { id: 'f6d', title: 'THE PENS', fl: 's6d', hint: 'In the pens under Stage 6.', text: 'Bought: a hound, a bear, a man who would not kneel. The Lanista kept a price for everything. He wrote one price in red: the Order offered him a fortune for a Kael in chains. He took it. The chains are still here. So is the fortune. So is the Kael, in a manner of speaking.' },
    { id: 'f7u', title: "MORWEN'S LEDGER II", fl: 's7u', hint: 'On the cliff above Stage 7.', text: 'Morwen wrote down every name that owed her. Every Kael is in the ledger, each one marked PAID IN FULL. She never understood it. She charged them everything and they paid it, and came back the next morning with nothing, asking to pay again.' },
    { id: 'f7d', title: 'THE BOG HAG', fl: 's7d', hint: 'In the bog under Stage 7.', text: 'She was Morwen\'s sister, the pretty one. She went into the bog to stay pretty forever, and the bog kept its side of the bargain. She tells the wisps a story about a boy who could not die. She says the candle is a curse, and that she should know.' },
    { id: 'f8u', title: 'THE HELLFORGE II', fl: 's8u', hint: 'On the smokestacks above Stage 8.', text: 'The Herald rang the forge bell every time the Order sent a sword up. The swords all went to one family. The family kept breaking them. The forge kept making more. The ash from the stacks fell on the city for three hundred years, and every flake of it was a Kael\'s spare blade.' },
    { id: 'f8d', title: 'THE CHAIN-MAKER', fl: 's8d', hint: 'In the deep forge under Stage 8.', text: 'The Forgefather made two chains. One held Cerberax. The other was for a Kael who wanted to stop: the Order asked for a chain that would hold one of the line to the candle, so he could not walk away from it. The Forgefather made it. It was the only chain he ever regretted.' },
    { id: 'f10u', title: 'THE LAST SUNRISE', fl: 's10u', hint: 'On the spire above Stage 10.', text: 'From the top of the spire you can see the whole city and the place where the sun used to come up. Osric stood here when he took the sky. The Captain stood behind him and did not stop him. He has been standing here ever since, waiting for a Kael to come up the stair and tell him he was wrong.' },
    { id: 'f10d', title: 'THE PHYLACTERY', fl: 's10d', hint: 'In the foundry under Stage 10.', text: 'The Soulwright split Osric\'s soul into the jars. He learned the trick from the Order, who had done the same to a candle long before. One flame, one bloodline. If you are reading this, the last page is under the Chapel, and the stair is open. Go down. He is waiting.' },
  ];
  for (const p of NP) if (!PAGES.some(x => x.id === p.id)) PAGES.push(p);
  for (const [id] of REG) {
    const def = FL.defs[id]; const pg = PAGES.find(q => q.fl === id); const prev = def.onClear;
    def.onClear = function (L, F, drop) {
      if (prev) try { prev.apply(this, arguments); } catch (e) { }
      if (pg) { const p = drop('m20page', -0.8, 0.6); p.page = pg.id; }
      if (def.bp && ITEMS && ITEMS[def.bp]) drop('m20bp_' + def.bp, 0, -0.9);
      if (def.soul) { const p = drop('m20soul', 0.8, -0.6); p.soul = def.soul; }
    };
  }

  // ---------- THE OATH SHRINE: an optional curse at the start of every floor; keep it and the coffer doubles ----------
  const OATHS = {
    blood: { n: 'OATH OF BLOOD', d: 'Foes hit 40% harder.', c: '#ff7060', t: [255, 90, 70] },
    thirst: { n: 'OATH OF THIRST', d: 'No vials on this floor.', c: '#80c0ff', t: [120, 180, 255] },
    hour: { n: 'OATH OF THE HOUR', d: 'Fell the guardian within 150 s.', c: '#ffd060', t: [255, 210, 90] },
  };
  const OATH = M20.OATH = { cur: null, hold: 0, dur: 150 };
  function placeShrine(L) {
    const sx = L.start.x, sy = L.start.y, z0 = floorAt(sx, sy);
    for (const r of [2.2, 2.8, 3.4]) for (let k = 0; k < 16; k++) {
      const a = (L.start.ang || 0) + Math.PI / 2 + k / 16 * Math.PI * 2, x = (Math.floor(sx + Math.cos(a) * r)) + 0.5, y = (Math.floor(sy + Math.sin(a) * r)) + 0.5;
      const c = cellAt(x, y); if (c < 0 || SOLID[c] || Math.abs(FH[c] - z0) > 0.05 || FT[c] === 3) continue;
      if (Math.hypot(x - L.back[0], y - L.back[1]) < 2.3 || Math.hypot(x - L.fwd[0], y - L.fwd[1]) < 2.3) continue;
      let ok = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = cellAt(x + dx, y + dy); if (j < 0 || SOLID[j]) { ok = false; break; } } if (!ok) continue;
      return [x, y];
    }
    return null;
  }
  // the crypt + shrine hooks on entering a floor (outermost FL.enter wrapper)
  const _en = FL.enter;
  FL.enter = function (id) {
    const ok = _en.apply(this, arguments); OATH.cur = null; OATH.hold = 0;
    if (!ok) return ok;
    try {
      if (id === 'bcrypt') { for (const e of G.enemies) e.alive = false; G.enemies = []; G.totalEnemies = 0; FL.boss = null; if (LEVEL.m20) LEVEL.m20.toughDone = () => false; CRYPT.read = 0; CRYPT.pt = 0; G.bigText = { t1: "THE BARON'S CRYPT", t2: 'Beneath the Chapel', t: 0, dur: 3.4 }; return ok; }
      if (M20.oathOn && LEVEL.m20) {
        const p = placeShrine(LEVEL.m20); if (p) {
          const ks = Object.keys(OATHS), k = ks[Math.floor(M20.rng(M20.fnv((RUN.floors ? RUN.floors.key : '') + ':oath:' + id))() * ks.length)];
          OATH.cur = { id, x: p[0], y: p[1], z: floorAt(p[0], p[1]), k, sworn: false, broken: false, t: 0, kept: false };
        }
      }
    } catch (e) { ER('oath place', e); }
    return ok;
  };
  const _lv = FL.leave;
  FL.leave = function () { const was = FL.cur; const r = _lv.apply(this, arguments); try { if (r) { OATH.cur = null; P.m20lc = 0; TRAIL.length = 0; RINGS.length = 0; if (was === 'bcrypt') G.bigText = { t1: 'THE CHAPEL', t2: SAVE.shards + ' RELIQUARY SHARDS', t: 0, dur: 2.4 }; } } catch (e) { } return r; };
  const _cl = FL.clear;
  FL.clear = function () {
    const was = FL.cleared, id = FL.cur; const r = _cl.apply(this, arguments);
    try {
      const O = OATH.cur;
      if (!was && FL.cleared && O && O.id === id && O.sworn && !O.broken) {
        O.kept = true; const L = LEVEL.m20, [rx, ry] = L.reward;
        const drop = (type, dx, dy, amt) => { const p = mkPickup(type, rx + dx, ry + dy); p.z = floorAt(rx + dx, ry + dy) + 1; p.amt = amt; G.pickups.push(p); return p; };
        drop('shards', -0.7, -0.5, FL.defs[id].shards || (70 + Math.floor(Math.random() * 21))); drop('reliq', 0.7, 0.4);
        const s = FL.sv(); s.oaths = (s.oaths | 0) + 1; if (window.ACH) ACH.unlock('m20_oath');
        toast('THE OATH IS KEPT', 'The coffer doubles: more shards and a second relic.', OATHS[O.k].c, 3.4); SFX.play('toll', 0.6);
      }
    } catch (e) { ER('oath coffer', e); }
    return r;
  };
  function swear(O) {
    O.sworn = true; O.t = 0; const D = OATHS[O.k];
    G.bigText = { t1: D.n + ' SWORN', t2: D.d + ' Keep it: the coffer doubles.', t: 0, dur: 3.2 }; SFX.play('toll', 0.7); G.flashR = 0.2; G.shake += 2;
    for (let i = 0; i < 20; i++) addP({ k: 'ember', x: O.x + rand(-0.3, 0.3), y: O.y + rand(-0.3, 0.3), z: O.z + rand(0.6, 1.4), vx: rand(-1, 1), vy: rand(-1, 1), vz: rand(1, 3), size: 0.06, col: RGB(D.t[0], D.t[1], D.t[2]), life: 0.8 });
  }

  // ---------- THE BARON'S CRYPT: all 20 floor pages open a stair behind the Chapel altar ----------
  const CRYPT = M20.CRYPT = { ent: null, hold: 0, read: 0, pt: 0, done: false };
  FL.defs.bcrypt = { id: 'bcrypt', stage: 0, which: 'down', name: "THE BARON'S CRYPT", sub: 'Beneath the Chapel', tpl: 'bcrypt', pal: 'crypt', n: 0, opts: {}, toughName: 'Baron', pool: [], amb: [0.3, 0.26, 0.24] };
  const pageSv = () => { try { const S = M20.npcSv ? M20.npcSv() : (SAVE.m20 = SAVE.m20 || {}); return (S && S.pg) || {}; } catch (e) { return {}; } };
  CRYPT.pages = () => { const pg = pageSv(); return PAGES.filter(p => pg[p.id]).length; };
  CRYPT.open = () => M20.bcrypt && (M20.bcryptall || (PAGES.length >= 20 && CRYPT.pages() >= PAGES.length));
  const m20sv = () => { if (!SAVE.m20 || typeof SAVE.m20 !== 'object') SAVE.m20 = {}; return SAVE.m20; };
  const REV = [
    ['HERE LIES AUBERON KAEL', 'First Baron. Warden of the Dawn. He swore the Candle.'],
    ['THE TOMB IS EMPTY', 'Scratched inside the lid: "If you are reading this, the candle chose wrong again. Good. It always chooses the one who will not kneel."'],
    ['EVERY KAEL HAS STOOD HERE', 'Thirty of them. Every one was told they were chosen. None of them were. They were only the ones who kept getting back up.'],
    ['KAEL', '"Then I was never chosen. I chose. Every time." Above, in the Chapel, the candle burns gold.'],
  ];
  if (typeof enterHub === 'function') {
    const _eh = enterHub;
    enterHub = function () {
      const r = _eh.apply(this, arguments);
      try {
        CRYPT.ent = null; CRYPT.hold = 0;
        if (CRYPT.open()) {
          for (const [dx, dy] of [[0, -3], [3, -1], [-3, -1], [3.2, 0], [-3.2, 0], [0, 3.2], [2.5, 2.5], [-2.5, 2.5]]) {
            const x = Math.floor(10.5 + dx) + 0.5, y = Math.floor(4.5 + dy) + 0.5, c = cellAt(x, y); if (c < 0 || SOLID[c] || Math.abs(FH[c]) > 0.05) continue;
            if (Math.hypot(x - 10.5, y - 4.5) < 2.6) continue;
            CRYPT.ent = { x, y, z: floorAt(x, y) }; break;
          }
          const s = m20sv(); if (CRYPT.ent && !s.bcseen) { s.bcseen = Date.now(); const stair = () => { try { G.bigText = { t1: 'A STAIR OPENS', t2: 'Behind the altar, the floor gives way to old steps.', t: 0, dur: 3.4 }; SFX.play('secret', 0.9); } catch (e) { } };
            if (window.M20G && M20G.stairfix) { const t0 = performance.now(); const w = () => { try { const clear = G.state === 'play' && !G.paused && !G.bigText && !(G.toasts && G.toasts.length && !(G.toasts[0].t > (G.toasts[0].dur || 3) - 0.35)) && !(window.M15 && M15.card && M15.card()) && !(window.TIPS && TIPS.cur) && !(window.M11 && M11.BAN && M11.BAN.cur); if (clear || performance.now() - t0 > 20000) { stair(); M20G.n.stair = Math.round(performance.now() - t0); return; } } catch (e) { } setTimeout(w, 250); }; setTimeout(w, 2700); }   // m20g: wait for a clear screen (the Depth toast) before the banner
            else setTimeout(stair, 2700); try { writeSave(); } catch (e) { } }
        }
      } catch (e) { ER('crypt place', e); }
      return r;
    };
  }
  // ---------- per-frame ----------
  let lavaT = 0, trT = 0;
  if (window.M9 && M9.on) M9.on('tick', dt => {
    try {
      if (G.state !== 'play' || G.paused) return;
      const grounded = P.onGround !== false && P.z - floorAt(P.x, P.y) < 0.3, mv = Math.hypot(P.vx || 0, P.vy || 0);
      // the crypt stair in the Chapel
      if (RUN.hub && !FL.cur && CRYPT.ent) { const d = Math.hypot(P.x - CRYPT.ent.x, P.y - CRYPT.ent.y); if (d < 0.95 && grounded) { CRYPT.hold = mv < 1.2 ? CRYPT.hold + dt : Math.max(0, CRYPT.hold - dt * 2); if (CRYPT.hold >= 0.8) { CRYPT.hold = 0; FL.enter('bcrypt'); } } else CRYPT.hold = Math.max(0, CRYPT.hold - dt * 3); }
      if (!FL.cur) { if (P.m20lc) P.m20lc = 0; return; }
      const L = LEVEL.m20; if (!L) return;
      // reading the tomb
      if (FL.cur === 'bcrypt') {
        const d = Math.hypot(P.x - L.reward[0], P.y - L.reward[1]);
        if (d < 1.4) { CRYPT.pt += dt; if (CRYPT.pt > 5.5) { CRYPT.pt = 0; CRYPT.read++; SFX.play('glint', 0.5); if (CRYPT.read >= REV.length) { const s = m20sv(); const first = !s.bcrypt; s.bcrypt = s.bcrypt || Date.now(); s.goldtrim = 1; if (window.ACH) ACH.unlock('m20_bcrypt'); if (first) { G.bigText = { t1: 'BLOOD OF THE CANDLE', t2: 'The title screen wears gold now.', t: 0, dur: 3.6 }; SFX.play('toll', 0.8); } CRYPT.read = 0; try { writeSave(); } catch (e) { } } } }
        else CRYPT.pt = Math.max(0, CRYPT.pt - dt * 0.5);
        return;
      }
      // the shrine
      const O = OATH.cur;
      if (O && O.id === FL.cur) {
        if (!O.sworn) { const d = Math.hypot(P.x - O.x, P.y - O.y); if (d < 0.9 && grounded && !FL.cleared) { OATH.hold = mv < 1.2 ? OATH.hold + dt : Math.max(0, OATH.hold - dt * 2); if (OATH.hold >= 0.8) { OATH.hold = 0; swear(O); } } else OATH.hold = Math.max(0, OATH.hold - dt * 3); }
        else if (!O.broken && !FL.cleared) {
          O.t += dt;
          if (O.k === 'thirst') for (let i = G.pickups.length - 1; i >= 0; i--) { const p = G.pickups[i]; if (p.type === 'vial' && !p.taken) G.pickups.splice(i, 1); }
          if (O.k === 'hour' && O.t > OATH.dur) { O.broken = true; toast('THE OATH BREAKS', 'Too slow. The coffer stays as it is.', '#c08070', 3); SFX.play('block', 0.6); }
        }
      }
      // leeches: damage over time until you roll or burn
      if (P.m20lc > 0) { P.m20lt += dt; P.m20la += dt; if ((P.dodgeT > 0) || (P.burn > 0) || P.m20lt > 8) { const shook = P.m20lt <= 8; P.m20lc = 0; if (shook) toast('SHOOK THEM OFF', '', '#d0ffb0', 0.9); } else if (P.m20la >= 1) { P.m20la = 0; nodmg(2 * P.m20lc, '#c0d080'); } }
      // slag trails, weapon rings
      trT -= dt; for (let i = TRAIL.length - 1; i >= 0; i--) { const t = TRAIL[i]; t.t += dt; if (t.t > 3) { TRAIL.splice(i, 1); continue; } if (trT <= 0 && grounded && Math.hypot(P.x - t.x, P.y - t.y) < 0.55 && Math.abs(P.z - t.z) < 0.3) { trT = 0.5; nodmg(3, '#ff9040'); } }
      for (let i = RINGS.length - 1; i >= 0; i--) { RINGS[i].t += dt; if (RINGS[i].t > 0.45) RINGS.splice(i, 1); }
      // lava and blood channels
      if (L.liquid && grounded) { const c = cellAt(P.x, P.y); if (c >= 0 && FT[c] === 3) { lavaT -= dt; if (lavaT <= 0) { lavaT = L.liquid === 'lava' ? 0.5 : 0.75; nodmg(L.liquid === 'lava' ? 4 : 2, L.liquid === 'lava' ? '#ff8030' : '#ff5050'); } } else lavaT = 0; }
    } catch (e) { ER('tick', e); }
  });
  // ---------- art + sprites ----------
  function art() {
    if (!FL.mkTex) return;
    FL.mkTex('m20_oath', 24, 40, (x, w, h) => {
      x.fillStyle = '#2a2430'; x.fillRect(5, 30, 14, 10); x.fillStyle = '#4a4258'; x.fillRect(5, 30, 14, 2); x.fillStyle = '#3a3346'; x.fillRect(8, 16, 8, 14); x.fillStyle = '#5a5070'; x.fillRect(8, 16, 2, 14);
      x.fillStyle = '#6a5a3a'; x.fillRect(3, 12, 18, 4); x.fillStyle = '#a08850'; x.fillRect(3, 12, 18, 1); x.fillStyle = '#c03040'; x.fillRect(11, 20, 2, 6); x.fillRect(9, 22, 6, 2);
    });
  }
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if (G.state !== 'play') return S;
      if (!Engine.tex.m20_oath) art();
      const t = G.time || 0, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      if (RUN.hub && !FL.cur && CRYPT.ent && Engine.tex.m20_hole) { const E = CRYPT.ent; S.push({ tex: 'm20_hole', x: E.x, y: E.y, z: E.z - 0.02, w: 1.5, h: 0.55, lit: true }); gl(E.x, E.y, E.z + 0.12, 1.4, 0.55, 0.3 + 0.1 * Math.sin(t * 3), [255, 210, 120]); gl(E.x, E.y, E.z + 0.2, 0.55, 2.2, 0.22 + 0.08 * Math.sin(t * 2), [255, 200, 110]); }
      if (!FL.cur) return S;
      const O = OATH.cur;
      if (O && O.id === FL.cur && Engine.tex.m20_oath) { const D = OATHS[O.k], c = O.broken ? [120, 110, 120] : O.sworn ? D.t : [180, 120, 255]; S.push({ tex: 'm20_oath', x: O.x, y: O.y, z: O.z, w: 0.62, h: 1.05, lit: true }); gl(O.x, O.y, O.z + 1.05, 0.55 + 0.06 * Math.sin(t * 9), 0.75 + 0.1 * Math.sin(t * 7), O.broken ? 0.2 : 0.75, c); gl(O.x, O.y, O.z + 0.9, 1.6, 1.4, O.broken ? 0.06 : 0.22, c); }
      for (const tr of TRAIL) { const k = 1 - tr.t / 3; gl(tr.x, tr.y, tr.z + 0.03, 0.75, 0.2, 0.55 * k, [255, 120, 40]); }
      for (const r of RINGS) { const k = r.t / 0.45; gl(r.x, r.y, r.z + 0.05, 0.6 + r.r * 2 * k, 0.35, 0.7 * (1 - k), r.c); }
      let n = 0;
      for (const e of G.enemies) {
        if (!e.alive || n > 10) continue;
        if (e.m20bur) { n++; gl(e.x, e.y, floorAt(e.x, e.y) + 0.02, 0.9, 0.28, 0.45, [150, 110, 70]); }
        else if (e.type === 'm20wisp') { n++; gl(e.x, e.y, e.z + e.h * 0.55, 1.2, 1.2, 0.4 + 0.08 * Math.sin(t * 8 + e.x), [140, 220, 255]); }
        else if (e.type === 'm20slag') { n++; gl(e.x, e.y, e.z + 0.3, 1.0, 0.6, 0.3, [255, 130, 40]); }
        else if (e.m20netT > 0) { n++; gl(e.x, e.y, e.z + e.h * 0.5, 0.9, e.h * 0.8, 0.22, [230, 200, 140]); }
      }
    } catch (e) { ER('sprites', e); }
    return S;
  };
  // ---------- HUD ----------
  const panel = (ctx, t1, t2, col, hold) => {
    const y = H - 78; ctx.save(); ctx.fillStyle = 'rgba(6,1,12,0.92)'; ctx.fillRect(W / 2 - 168, y - 6, 336, 36); ctx.strokeStyle = 'rgba(200,160,70,0.7)'; ctx.strokeRect(W / 2 - 167.5, y - 5.5, 335, 35); ctx.restore();
    text(ctx, t1, W / 2, y, col, 'center', 1); text(ctx, t2, W / 2, y + 13, '#f2eadc', 'center', 0.8);
    if (hold > 0.02) { const k = Math.min(1, hold / 0.8); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, 9, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); ctx.restore(); }
  };
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (G.state !== 'play' || G.paused) return false;
      if (RUN.hub && !FL.cur && CRYPT.ent) { const d = Math.hypot(P.x - CRYPT.ent.x, P.y - CRYPT.ent.y); if (d < 2.6) { panel(ctx, "\u25BC THE BARON'S CRYPT", 'Stand on the stair to descend', '#ffd060', CRYPT.hold); return true; } return false; }
      if (!FL.cur || !LEVEL.m20) return false;
      const L = LEVEL.m20;
      if (FL.cur === 'bcrypt') {
        text(ctx, "\u25BC THE BARON'S CRYPT", W - 6, 70, '#ffd060', 'right', 0.8);
        const d = Math.hypot(P.x - L.reward[0], P.y - L.reward[1]);
        if (d < 1.4) { const [a, b] = REV[Math.min(CRYPT.read, REV.length - 1)]; const bw = Math.min(300, W - 40), bx = W / 2 - bw / 2, by = H - 96; ctx.save(); ctx.fillStyle = 'rgba(20,10,4,0.84)'; ctx.fillRect(bx, by, bw, 62); ctx.strokeStyle = '#c0a050'; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 61); ctx.fillStyle = '#ffd060'; ctx.fillRect(bx, by + 60, bw * Math.min(1, CRYPT.pt / 5.5), 2); ctx.restore(); text(ctx, a, W / 2, by + 6, '#ffd060', 'center', 0.9); if (typeof fitBlock === 'function') fitBlock(ctx, b, bx + 10, by + 20, bw - 20, 38, '#f0e0c8', 'center', 0.75); else text(ctx, b.slice(0, 60), W / 2, by + 22, '#f0e0c8', 'center', 0.7); return true; }
        const db = Math.hypot(P.x - L.back[0], P.y - L.back[1]); if (db < 2.6) { panel(ctx, 'BACK TO THE CHAPEL', 'Stand here to climb back up', '#d0c8ff', FL.hold); return true; }
        if (Math.hypot(P.x - L.reward[0], P.y - L.reward[1]) < 4) { text(ctx, 'Stand before the tomb to read it', W / 2, H - 60, '#c0a878', 'center', 0.75); return true; }
        return true;
      }
      let drew = false; const O = OATH.cur;
      if (O && O.id === FL.cur) {
        const D = OATHS[O.k];
        if (!O.sworn && !FL.cleared) { const d = Math.hypot(P.x - O.x, P.y - O.y); if (d < 2.6) { panel(ctx, 'OATH SHRINE: ' + D.n, D.d + '  Stand here to swear: coffer x2', D.c, OATH.hold); drew = true; } }
        else if (O.sworn) { const lab = O.broken ? D.n + ' (BROKEN)' : O.kept ? D.n + ' KEPT' : O.k === 'hour' ? D.n + '  ' + Math.max(0, Math.ceil(OATH.dur - O.t)) + 's' : D.n; text(ctx, lab, W - 6, 80, O.broken ? '#907080' : D.c, 'right', 0.75); drew = true; }
      }
      if (P.m20lc > 0) { text(ctx, 'LEECHES x' + P.m20lc + '  (roll!)', W / 2, H / 2 + 26, '#c0d080', 'center', 0.8); drew = true; }
      return drew;
    } catch (e) { ER('hud', e); return false; }
  });
  // the capstone cosmetic: a gold-trimmed title screen
  if (typeof drawTitle === 'function') {
    const _dt = drawTitle;
    drawTitle = function (ctx) {
      _dt.apply(this, arguments);
      try { if (window.SAVE && SAVE.m20 && SAVE.m20.goldtrim) { ctx.save(); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.strokeRect(3.5, 3.5, W - 7, H - 7); ctx.strokeStyle = '#ffd060'; ctx.strokeRect(5.5, 5.5, W - 11, H - 11); ctx.fillStyle = '#ffd060'; for (const [x, y] of [[3, 3], [W - 8, 3], [3, H - 8], [W - 8, H - 8]]) ctx.fillRect(x, y, 5, 5); ctx.restore(); text(ctx, 'BLOOD OF THE CANDLE', 10, 9, '#ffd060', 'left', 0.8); } } catch (e) { }
    };
  }
  M20.m20bDbg = () => ({ floors: M20.NEWFLOORS.filter(id => FL.defs[id]), bosses: Object.keys(NB).filter(t => EDEF[t]), foes: FOES2.filter(t => EDEF[t]), weapons: Object.keys(NEWW).filter(k => ITEMS && ITEMS[k]), pages: PAGES.length, read: CRYPT.pages(), cryptOpen: !!CRYPT.open(), oath: OATH.cur && Object.assign({}, OATH.cur), ent: CRYPT.ent });
})();
