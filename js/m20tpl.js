'use strict';
// ===== m20 FLOORS - map templates (Rooftop / Warren / Rampart Ring / Flooded Grid) =====
// Each template fills the map arrays through FL.kit and returns a layout:
// { start:{x,y,ang}, back:[x,y], fwd:[x,y], reward:[x,y], tough:{x0,y0,x1,y1,cx,cy}, bars:[[x,y,fh]], rooms:[{x0..y1,kind}],
//   lights, props, pickups, secrets, cracks, signs, sky, rot, water }
(function () {
  if (!window.M20 || !M20.FL) return;
  const FL = M20.FL;
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (R, a) => a[Math.floor(R() * a.length)];
  const fy = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  // a chain of rooms on a slot grid from the south row to the north row
  function slotPath(R, SX, SY) {
    let cx = ri(R, 0, SX - 1), cy = SY - 1; const path = [[cx, cy]], used = { [cx + ',' + cy]: 1 }; let side = 0;
    while (cy > 0) {
      const o = []; if (side < 2) { if (cx > 0 && !used[(cx - 1) + ',' + cy]) o.push([-1, 0]); if (cx < SX - 1 && !used[(cx + 1) + ',' + cy]) o.push([1, 0]); }
      o.push([0, -1]); const [dx, dy] = pick(R, o); cx += dx; cy += dy; side = dy ? 0 : side + 1; path.push([cx, cy]); used[cx + ',' + cy] = 1;
    }
    return { path, used };
  }
  function secretRoom(K, R, L, host, fh, sky, wt) { // a small hidden room behind a cracked wall next to the host room
    const dirs = fy([[0, -1], [1, 0], [-1, 0], [0, 1]], R);
    for (const [dx, dy] of dirs) {
      const [hx, hy] = K.center(host); let wx, wy;
      if (dx) { wx = dx > 0 ? host.x1 + 1 : host.x0 - 1; wy = hy; } else { wy = dy > 0 ? host.y1 + 1 : host.y0 - 1; wx = hx; }
      const r = dx ? { x0: dx > 0 ? wx + 1 : wx - 3, x1: dx > 0 ? wx + 3 : wx - 1, y0: wy - 1, y1: wy + 1 } : { x0: wx - 1, x1: wx + 1, y0: dy > 0 ? wy + 1 : wy - 3, y1: dy > 0 ? wy + 3 : wy - 1 };
      if (r.x0 < 2 || r.y0 < 2 || r.x1 > MW - 3 || r.y1 > MH - 3) continue;
      let clear = true; for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) { const i = y * MW + x; if (!SOLID[i] && FH[i] > -1) clear = false; }
      if (!clear) continue;
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) K.wall(x, y, sky ? fh + 2.7 : 99, 9);
      K.rect(r, fh, fh + 2.5, 5, false);
      K.wall(wx, wy, sky ? fh + 2.7 : 99, wt || 6);
      const k = L.secrets.length;
      L.cracks.push({ x: wx, y: wy, hp: 3, open: false, ch: fh + 2.5, kind: wt === 12 ? 'false' : 'cracked', room: -10 - k, m20fh: fh, from: sky ? fh + 2.7 : undefined });
      L.secrets.push({ id: 'floor' + k, name: L.snames[k % L.snames.length], box: [r.x0, r.y0, r.x1 + 1, r.y1 + 1], minZ: -9, found: false });
      const cx = (r.x0 + r.x1) / 2 + 0.5, cy = (r.y0 + r.y1) / 2 + 0.5;
      L.pickups.push({ type: k === 0 ? 'reliq' : 'cache', x: cx, y: cy }); L.pickups.push({ type: 'shards', x: r.x0 + 0.5, y: r.y0 + 0.5, amt: 25 });
      L.lights.push({ x: cx, y: cy, r: 3.4, i: 1.0, c: [1.0, 0.78, 0.35] });
      if (wt !== 12) L.signs.push({ x: wx + 0.5, y: wy + 0.5, r: 2.0, text: 'Cold air seeps from a cracked wall.', text2: '', shown: false });
      return r;
    }
    return null;
  }
  function secretAt(K, R, L, r, wx, wy, fh, sky, wt) {
    for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) K.wall(x, y, sky ? fh + 2.7 : 99, 9);
    K.rect(r, fh, fh + 2.5, 5, false); K.wall(wx, wy, sky ? fh + 2.7 : 99, wt || 6);
    const k = L.secrets.length;
    L.cracks.push({ x: wx, y: wy, hp: 3, open: false, ch: fh + 2.5, kind: wt === 12 ? 'false' : 'cracked', room: -10 - k, m20fh: fh, from: sky ? fh + 2.7 : undefined });
    L.secrets.push({ id: 'floor' + k, name: L.snames[k % L.snames.length], box: [r.x0, r.y0, r.x1 + 1, r.y1 + 1], minZ: -9, found: false });
    const cx = (r.x0 + r.x1) / 2 + 0.5, cy = (r.y0 + r.y1) / 2 + 0.5;
    L.pickups.push({ type: k === 0 ? 'reliq' : 'cache', x: cx, y: cy }); L.pickups.push({ type: 'shards', x: r.x0 + 0.5, y: r.y0 + 0.5, amt: 25 });
    L.lights.push({ x: cx, y: cy, r: 3.4, i: 1.0, c: [1.0, 0.78, 0.35] });
    if (wt !== 12) L.signs.push({ x: wx + 0.5, y: wy + 0.5, r: 2.0, text: 'Cold air seeps from a cracked wall.', text2: '', shown: false });
    return r;
  }
  // a 3x3 pocket cut into solid rock, opening (through one cracked cell) onto a walkable cell
  function pocket(K, R, L, wt, avoid) {
    for (let t = 0; t < 400; t++) {
      const x0 = 2 + Math.floor(R() * (MW - 7)), y0 = 2 + Math.floor(R() * (MH - 7)), r = { x0, y0, x1: x0 + 2, y1: y0 + 2 };
      let ok = true; for (let y = y0 - 1; y <= y0 + 3 && ok; y++) for (let x = x0 - 1; x <= x0 + 3; x++) if (!SOLID[y * MW + x]) { ok = false; break; }
      if (!ok) continue;
      const sides = fy([[x0 + 1, y0 - 1, 0, -1], [x0 + 1, y0 + 3, 0, 1], [x0 - 1, y0 + 1, -1, 0], [x0 + 3, y0 + 1, 1, 0]], R);
      for (const [wx, wy, dx, dy] of sides) { const j = (wy + dy) * MW + wx + dx; if (!SOLID[j] && FH[j] > -0.5 && FH[j] < 0.5 && !(avoid && avoid(wx + dx, wy + dy))) return secretAt(K, R, L, r, wx, wy, FH[j], false, wt); }
    }
    return null;
  }
  // a walled vault built into the corner of a big room (for maps with no solid mass to dig into)
  function vaultIn(K, R, L, room, wt, corner) { // corner: 0 NW 1 NE 2 SW 3 SE (default random NW/SE)
    const c = corner !== undefined ? corner : (R() < 0.5 ? 0 : 3), E = c === 1 || c === 3, S = c >= 2;
    const x0 = E ? room.x1 - 3 : room.x0 + 1, y0 = S ? room.y1 - 3 : room.y0 + 1, r = { x0, y0, x1: x0 + 2, y1: y0 + 2 };
    const wx = E ? r.x0 - 1 : r.x1 + 1, wy = r.y0 + 1; return secretAt(K, R, L, r, wx, wy, 0, false, wt);
  }
  FL.secretKit = { pocket, vaultIn, secretAt };
  const base = (snames) => ({ rooms: [], lights: [], props: [], pickups: [], secrets: [], cracks: [], signs: [], bars: [], spawns: [], snames: snames || ['The Hidden Loft', 'The Forgotten Niche', 'The Sealed Cell'] });

  // ---------------- ROOFTOP (40x40): slabs over a void, plank bridges, parapets, chimneys; catwalk = narrow & tall ----------------
  FL.tpl.rooftop = function (R, def, K) {
    const o = def.opts || {}, cat = !!o.catwalk;
    K.alloc(40, 40, true); const L = base(def.snames); L.sky = true; L.rot = [];
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) K.open(x, y, -6, 99, 7, true);
    const SS = 9, OX = 2, OY = 2; const { path } = slotPath(R, 4, 4);
    const levels = cat ? [0, 0.35, 0.7, 1.05, 1.4] : [0, 0.35, 0.7];
    const pr = path.map(([cx, cy], i) => {
      const last = i === path.length - 1, tough = i === path.length - 2;
      const w = tough ? 8 : last ? 5 : ri(R, 5, 7), h = tough ? 8 : last ? 5 : ri(R, 5, 7);
      const x0 = OX + cx * SS + ri(R, 0, SS - 1 - w), y0 = OY + cy * SS + ri(R, 0, SS - 1 - h);
      return { x0, y0, x1: x0 + w - 1, y1: y0 + h - 1, kind: i === 0 ? 'start' : tough ? 'tough' : last ? 'reward' : 'path', fh: i === 0 ? 0 : tough ? 0.35 : pick(R, levels) };
    });
    for (const r of pr) K.rect(r, r.fh, 99, r.kind === 'tough' ? 5 : (r.kind === 'start' ? 4 : 0), true);
    // bridges (stepped planks) between consecutive slabs; the last one (into the reward slab) is barred
    const bw = cat ? 1 : 2;
    const bridge = (a, b, barLast) => {
      const [ax, ay] = K.center(a), [bx, by] = K.center(b); const pts = [];
      const mx = Math.floor((ax + bx) / 2);
      if (a.x1 < b.x0 || b.x1 < a.x0) { for (let x = ax; x !== mx; x += Math.sign(mx - ax) || 1) pts.push([x, ay]); for (let y = ay; y !== by; y += Math.sign(by - ay)) pts.push([mx, y]); for (let x = mx; x !== bx + Math.sign(bx - mx); x += Math.sign(bx - mx) || 1) { pts.push([x, by]); if (x === bx) break; } }
      else { const my = Math.floor((ay + by) / 2); for (let y = ay; y !== my; y += Math.sign(my - ay) || 1) pts.push([ax, y]); for (let x = ax; x !== bx; x += Math.sign(bx - ax)) pts.push([x, my]); for (let y = my; ; y += Math.sign(by - my) || 1) { pts.push([bx, y]); if (y === by) break; } }
      const out = pts.filter(([x, y]) => !(x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1) && !(x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1));
      out.forEach(([x, y], k) => {
        const t = (k + 1) / (out.length + 1), fh = Math.round((a.fh + (b.fh - a.fh) * t) / 0.05) * 0.05;
        const put = (fx, fy) => { if (!K.inb(fx, fy)) return; const ii = fy * MW + fx; if (!SOLID[ii] && FH[ii] > -1) return; K.open(fx, fy, fh, 99, 6, true); };
        put(x, y); if (bw > 1) { put(x + 1, y); put(x, y + 1); }
      });
      if (o.rot && !barLast && out.length > 3 && R() < 0.7) { const m = out[Math.floor(out.length / 2)]; if (bw > 1) L.rot.push({ x: m[0], y: m[1] }); }
      if (barLast && out.length) { const [x, y] = out[0]; const i = y * MW + x; L.bars.push([x, y, FH[i]]); K.wall(x, y, FH[i] + 2.4, 7); if (bw > 1) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const j = (y + dy) * MW + x + dx; if (!SOLID[j] && FT[j] === 6 && Math.abs(FH[j] - FH[i]) < 0.01) { L.bars.push([x + dx, y + dy, FH[j]]); K.wall(x + dx, y + dy, FH[j] + 2.4, 7); } } }
    };
    for (let i = 1; i < pr.length; i++) bridge(pr[i - 1], pr[i], i === pr.length - 1);
    // parapets: a low wall on most slab edges (never across a bridge mouth)
    for (const r of pr) for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
      if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) continue; const i = y * MW + x; if (!K.inb(x, y) || SOLID[i] || FH[i] > -1) continue;
      let nb = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (y + dy) * MW + x + dx; if (!SOLID[j] && FT[j] === 6) nb++; }
      if (nb) continue; if (R() < (r.kind === 'tough' ? 0.92 : 0.7)) K.wall(x, y, r.fh + 1.1, 5);
    }
    // chimneys + gargoyles
    for (const r of pr) if (r.kind === 'path') { const n = ri(R, 1, 2); for (let k = 0; k < n; k++) { const x = ri(R, r.x0 + 1, r.x1 - 1), y = ri(R, r.y0 + 1, r.y1 - 1); K.wall(x, y, r.fh + 2.4, pick(R, [3, 11, 1])); } }
    for (const r of pr) { const [cx, cy] = K.center(r); L.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 6, i: 0.55, c: [0.7, 0.75, 1.0] }); }
    const T = pr.find(r => r.kind === 'tough'), Rw = pr[pr.length - 1], S = pr[0];
    for (const [x, y] of [[T.x0 + 0.5, T.y0 + 0.5], [T.x1 + 0.5, T.y0 + 0.5], [T.x0 + 0.5, T.y1 + 0.5], [T.x1 + 0.5, T.y1 + 0.5]]) { L.props.push({ type: 'brazier', x, y, z: T.fh, green: !!o.green }); L.lights.push({ x, y, r: 5.5, i: 1.0, c: o.green ? [0.3, 1.0, 0.5] : [1.0, 0.45, 0.25], flicker: true }); }
    for (const r of pr) if (r.kind === 'path' && R() < 0.6) { const [x, y] = K.cells(r, R, 1)[0] || []; if (x) L.props.push({ type: 'bones', x, y, z: r.fh }); }
    for (const r of pr) if (r.kind === 'path' && R() < 0.5) { const c = K.cells(r, R, 1)[0]; if (c) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: c[0], y: c[1] }); }
    // secrets: an attic room behind a cracked chimney wall (1-2)
    const hosts = fy(pr.filter(r => r.kind === 'path'), R);
    for (const h of hosts) { if (L.secrets.length >= (o.secrets || 2)) break; secretRoom(K, R, L, h, h.fh, true, L.secrets.length ? 12 : 6); }
    const [sx, sy] = K.center(S), [rx, ry] = K.center(Rw), [tx, ty] = K.center(T);
    L.start = { x: sx + 0.5, y: sy + 0.5, ang: Math.atan2(K.center(pr[1])[1] - sy, K.center(pr[1])[0] - sx) };
    L.back = [S.x0 + 1.0, S.y1 - 0.0]; L.reward = [rx + 0.5, ry + 0.5]; L.fwd = [Rw.x1 - 0.0, Rw.y0 + 1.0];
    L.tough = { x0: T.x0, y0: T.y0, x1: T.x1 + 1, y1: T.y1 + 1, cx: tx + 0.5, cy: ty + 0.5, fh: T.fh };
    L.rewRect = { x0: Rw.x0, y0: Rw.y0, x1: Rw.x1, y1: Rw.y1 };
    L.rooms = pr; L.amb = o.amb || [0.36, 0.38, 0.5];
    return L;
  };

  // ---------------- WARREN (40x40): cellular-automaton tunnels, low ceilings, a cavern for the tough spot ----------------
  FL.tpl.warren = function (R, def, K) {
    const o = def.opts || {}; K.alloc(40, 40, false); const L = base(def.snames); L.sky = false;
    const W = MW, H = MH; let g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ? 1 : (R() < 0.45 ? 1 : 0);
    for (let it = 0; it < 5; it++) { const n2 = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { n2[y * W + x] = 1; continue; } let c = 0, c2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = g[(y + dy) * W + x + dx]; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) c += v; c2 += v; } n2[y * W + x] = (c >= 5 || (it < 3 && c2 <= 2)) ? 1 : 0; } g = n2; }
    // the tough cavern (north) + start cave (south), joined to the rest by tunnels
    const cav = { cx: ri(R, 12, 27), cy: 8, r: 5 }, st = { cx: ri(R, 8, 31), cy: 33 };
    const carve = (x, y) => { if (x >= 2 && y >= 2 && x < W - 2 && y < H - 2) g[y * W + x] = 0; };
    for (let y = -6; y <= 6; y++) for (let x = -7; x <= 7; x++) if (x * x / 49 + y * y / 36 <= 1) carve(cav.cx + x, cav.cy + y);
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) carve(st.cx + x, st.cy + y);
    const tunnel = (ax, ay, bx, by) => { let x = ax, y = ay; for (let k = 0; k < 400 && (x !== bx || y !== by); k++) { if (R() < 0.5 && x !== bx) x += Math.sign(bx - x); else if (y !== by) y += Math.sign(by - y); else x += Math.sign(bx - x); carve(x, y); carve(x + 1, y); carve(x, y + 1); } };
    // a winding main tunnel through 3 waypoints guarantees the route
    const wps = [[st.cx, st.cy], [ri(R, 6, 33), 25], [ri(R, 6, 33), 17], [cav.cx, cav.cy + 5]];
    for (let i = 1; i < wps.length; i++) tunnel(wps[i - 1][0], wps[i - 1][1], wps[i][0], wps[i][1]);
    // the reward chamber: behind the cavern, barred
    const rw = { x0: cav.cx - 2, x1: cav.cx + 2, y0: 2, y1: 0 }; // filled below
    // keep only the region connected to the start
    const reach = new Uint8Array(W * H), q = [st.cy * W + st.cx]; reach[q[0]] = 1;
    while (q.length) { const i = q.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (y + dy) * W + x + dx; if (!g[j] && !reach[j]) { reach[j] = 1; q.push(j); } } }
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (reach[i]) { const ch = 2.2 + ((x * 7 + y * 13) % 7) * 0.1; K.open(x, y, 0, ch, (x * 3 + y * 5) % 9 === 0 ? 2 : (x + y) % 4 === 0 ? 1 : 0, false); } }
    // the cavern: high and clear
    for (let y = -6; y <= 6; y++) for (let x = -7; x <= 7; x++) if (x * x / 49 + y * y / 36 <= 1) { const cx = cav.cx + x, cy = cav.cy + y; if (K.isOpen(cx, cy)) { CH[cy * MW + cx] = 4.2; CT[cy * MW + cx] = 1; FT[cy * MW + cx] = (x + y) % 2 ? 0 : 5; } }
    // reward niche north of the cavern, one gate cell
    const ry0 = Math.max(2, cav.cy - 6 - 4); const rwr = { x0: cav.cx - 2, x1: cav.cx + 2, y0: ry0, y1: ry0 + 2 };
    for (let y = rwr.y0 - 1; y <= rwr.y1 + 1; y++) for (let x = rwr.x0 - 1; x <= rwr.x1 + 1; x++) if (!K.isOpen(x, y)) K.wall(x, y, 99, 9);
    K.rect(rwr, 0, 3.0, 5, false);
    for (let y = rwr.y1 + 1; y <= cav.cy - 4; y++) { if (!K.isOpen(cav.cx, y)) K.open(cav.cx, y, 0, 2.8, 1, false); }
    const gy = rwr.y1 + 1; K.wall(cav.cx, gy, 99, 7); L.bars.push([cav.cx, gy, 0]);
    // puddles
    for (let k = 0; k < 6; k++) { const x = ri(R, 3, W - 4), y = ri(R, 14, H - 6); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = (y + dy) * W + x + dx; if (!SOLID[i] && FH[i] === 0 && Math.hypot(x - st.cx, y - st.cy) > 4) { FT[i] = 3; FH[i] = -0.08; } } }
    // rooms for spawns: bands of distance along the route
    const D = FL.reach(st.cx + 0.5, st.cy + 0.5, []); let maxD = 1; for (let i = 0; i < D.length; i++) if (D[i] > maxD) maxD = D[i];
    const bands = [[0.18, 0.36], [0.36, 0.54], [0.54, 0.72], [0.72, 0.88]];
    const rooms = [{ x0: st.cx - 2, y0: st.cy - 2, x1: st.cx + 2, y1: st.cy + 2, kind: 'start' }];
    for (const [a, b] of bands) {
      const cells = []; for (let i = 0; i < D.length; i++) if (D[i] >= a * maxD && D[i] < b * maxD && !SOLID[i] && FH[i] > -0.5) { const x = i % MW, y = (i / MW) | 0; if (Math.hypot(x - cav.cx, (y - cav.cy) * 1.2) > 7.5) cells.push([x, y]); }
      if (!cells.length) continue; let x0 = 99, y0 = 99, x1 = 0, y1 = 0; for (const [x, y] of cells) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const r = { x0, y0, x1, y1, kind: 'path', ambush: true }; r.free = fy(cells.map(([x, y]) => [x + 0.5, y + 0.5]), R); rooms.push(r);
      const c = r.free[0]; L.lights.push({ x: c[0], y: c[1], r: 5, i: 0.9, c: o.green ? [0.35, 1.0, 0.5] : [1.0, 0.5, 0.25], flicker: true });
      L.props.push({ type: 'candelabra', x: c[0], y: c[1], z: 0 }); r.free.shift();
      if (R() < 0.6) { const p = r.free.pop(); if (p) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: p[0], y: p[1] }); }
      for (let k = 0; k < 3; k++) { const p = r.free[r.free.length - 1 - k]; if (p) L.props.push({ type: 'bones', x: p[0], y: p[1], z: 0 }); }
    }
    rooms.push({ x0: cav.cx - 7, y0: cav.cy - 6, x1: cav.cx + 7, y1: cav.cy + 6, kind: 'tough' }); rooms.push(Object.assign({ kind: 'reward' }, rwr));
    for (const [dx, dy] of [[-5, -3], [5, -3], [-5, 3], [5, 3]]) { const x = cav.cx + dx + 0.5, y = cav.cy + dy + 0.5; if (K.isOpen(x | 0, y | 0)) { L.props.push({ type: 'brazier', x, y, z: 0, green: !!o.green }); L.lights.push({ x, y, r: 6, i: 1.1, c: o.green ? [0.3, 1.0, 0.5] : [1.0, 0.4, 0.2], flicker: true }); } }
    L.lights.push({ x: st.cx + 0.5, y: st.cy + 0.5, r: 5, i: 0.8, c: [0.9, 0.8, 0.6] }); L.lights.push({ x: cav.cx + 0.5, y: rwr.y0 + 1.5, r: 4, i: 1.0, c: [1.0, 0.8, 0.4] });
    // secrets: pockets off the warren walls
    const hosts = rooms.filter(r => r.kind === 'path').map(r => ({ x0: r.free.length ? r.free[0][0] - 0.5 | 0 : r.x0, y0: r.free.length ? r.free[0][1] - 0.5 | 0 : r.y0 })).map(h => ({ x0: h.x0, y0: h.y0, x1: h.x0, y1: h.y0 }));
    for (let k = 0; k < (o.secrets || 2); k++) pocket(K, R, L, k ? 12 : 6, (x, y) => Math.hypot(x - cav.cx, y - cav.cy) < 8 || Math.hypot(x - st.cx, y - st.cy) < 4);
    L.start = { x: st.cx + 0.5, y: st.cy + 0.5, ang: -Math.PI / 2 }; L.back = [st.cx + 0.5, st.cy + 1.8];
    L.tough = { x0: cav.cx - 7, y0: cav.cy - 6, x1: cav.cx + 8, y1: cav.cy + 7, cx: cav.cx + 0.5, cy: cav.cy + 0.5, fh: 0 };
    L.reward = [cav.cx + 0.5, rwr.y0 + 1.5]; L.fwd = [cav.cx + 1.6, rwr.y0 + 0.6];
    L.rewRect = rwr;
    L.rooms = rooms; L.amb = o.amb || [0.34, 0.32, 0.36];
    return L;
  };

  // ---------------- RAMPART RING (44x44): a wall-walk round a pit, corner towers, the keep island in the middle ----------------
  FL.tpl.rampart = function (R, def, K) {
    const o = def.opts || {}; K.alloc(44, 44, true); const L = base(def.snames); L.sky = true;
    const W = MW, H = MH;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) K.open(x, y, -6, 99, 7, true);
    // outer battlements (crenellated) 1..2, walk 3..7
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (d <= 2) K.wall(x, y, d === 1 ? 3.2 : ((x + y) % 3 === 0 ? 2.2 : 1.5), d === 1 ? 0 : 5);
      else if (d <= 7) K.open(x, y, 0, 99, (x + y) % 7 === 0 ? 1 : 0, true);
      else if (d === 8 && R() < 0.85) K.wall(x, y, 1.1, 5);
    }
    // towers on the corners (enclosed, high vaults); the walk passes through them
    const TW = 10, towers = [[3, 3], [W - 3 - TW, 3], [3, H - 3 - TW], [W - 3 - TW, H - 3 - TW]].map(([x0, y0]) => ({ x0, y0, x1: x0 + TW - 1, y1: y0 + TW - 1 }));
    for (const t of towers) {
      for (let y = t.y0; y <= t.y1; y++) for (let x = t.x0; x <= t.x1; x++) { const edge = x === t.x0 || y === t.y0 || x === t.x1 || y === t.y1; if (edge) K.wall(x, y, 99, (x + y) % 4 ? 0 : 3); else K.open(x, y, 0, 5, 1, false); }
      for (let y = t.y0 + 1; y < t.y1; y++) for (let x = t.x0 + 1; x < t.x1; x++) CT[y * MW + x] = 1;
    }
    const door = (x, y) => K.open(x, y, 0, 3.4, 1, false);
    const [SW, , , ] = [towers[2]], NW = towers[0], NE = towers[1], SE = towers[3];
    // SW start tower: door north (to the west walk); NW: doors south + east; NE: doors west + south; SE (reward): door north, barred
    for (const t of [towers[2]]) { door(t.x0 + 4, t.y0); door(t.x0 + 5, t.y0); }
    door(NW.x0 + 4, NW.y1); door(NW.x0 + 5, NW.y1); door(NW.x1, NW.y0 + 4); door(NW.x1, NW.y0 + 5);
    door(NE.x0, NE.y0 + 4); door(NE.x0, NE.y0 + 5); door(NE.x0 + 4, NE.y1); door(NE.x0 + 5, NE.y1);
    door(SE.x0 + 4, SE.y0); door(SE.x0 + 5, SE.y0);
    // the south walk is broken (no shortcut from start to the reward tower)
    for (let y = H - 8; y <= H - 4; y++) for (let x = 20; x <= 23; x++) K.open(x, y, -6, 99, 7, true);
    L.bars.push([SE.x0 + 4, SE.y0, 0], [SE.x0 + 5, SE.y0, 0]); K.wall(SE.x0 + 4, SE.y0, 99, 7); K.wall(SE.x0 + 5, SE.y0, 99, 7);
    // the keep island + a bridge from the east walk
    const isl = { x0: 15, y0: 15, x1: 28, y1: 28 }; K.rect(isl, 0.35, 99, 5, true);
    for (let x = isl.x1 + 1; x <= W - 8; x++) for (const y of [21, 22]) K.open(x, y, x < W - 9 ? 0.35 : 0.17, 99, 6, true);
    for (let x = isl.x0 + 1; x < isl.x1; x += 3) { if (x % 6 === 0) { K.wall(x, isl.y0, 1.45, 5); K.wall(x, isl.y1, 1.45, 5); } }
    for (const [x, y] of [[isl.x0 + 1.5, isl.y0 + 1.5], [isl.x1 - 0.5, isl.y0 + 1.5], [isl.x0 + 1.5, isl.y1 - 0.5], [isl.x1 - 0.5, isl.y1 - 0.5]]) { L.props.push({ type: 'brazier', x, y, z: 0.35, green: false }); L.lights.push({ x, y, r: 6.5, i: 1.15, c: o.lc || [1.0, 0.3, 0.25], flicker: true }); }
    // torches + lights round the walk
    for (let k = 0; k < 12; k++) { const a = k / 12; const x = a < 0.25 ? 5 : a < 0.5 ? 5 + (a - 0.25) * 4 * 34 : a < 0.75 ? 39 : 5; }
    for (const [x, y] of [[5.5, 20.5], [5.5, 28.5], [20.5, 5.5], [28.5, 5.5], [38.5, 16.5], [38.5, 28.5]]) { L.props.push({ type: 'brazier', x, y, z: 0, green: false }); L.lights.push({ x, y, r: 6, i: 0.9, c: [1.0, 0.55, 0.3], flicker: true }); }
    for (const t of towers) { const [cx, cy] = K.center(t); L.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 5.5, i: 0.9, c: [1.0, 0.7, 0.4] }); L.props.push({ type: 'candelabra', x: cx + 0.5, y: cy + 0.5, z: 0 }); }
    // rooms: west walk, NW tower, north walk, NE tower, east walk
    const rooms = [Object.assign({ kind: 'start' }, towers[2]),
      { x0: 3, y0: 14, x1: 7, y1: 29, kind: 'path' }, Object.assign({ kind: 'path' }, { x0: NW.x0 + 1, y0: NW.y0 + 1, x1: NW.x1 - 1, y1: NW.y1 - 1 }),
      { x0: 14, y0: 3, x1: 29, y1: 7, kind: 'path' }, Object.assign({ kind: 'path' }, { x0: NE.x0 + 1, y0: NE.y0 + 1, x1: NE.x1 - 1, y1: NE.y1 - 1 }),
      { x0: 36, y0: 14, x1: 40, y1: 20, kind: 'path' }, Object.assign({ kind: 'tough' }, isl), Object.assign({ kind: 'reward' }, { x0: SE.x0 + 1, y0: SE.y0 + 1, x1: SE.x1 - 1, y1: SE.y1 - 1 })];
    for (const r of rooms) if (r.kind === 'path' && R() < 0.6) { const c = K.cells(r, R, 1)[0]; if (c) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: c[0], y: c[1] }); }
    // a secret off the NW tower and one in the west battlements
    vaultIn(K, R, L, { x0: NE.x0 + 1, y0: NE.y0 + 1, x1: NE.x1 - 1, y1: NE.y1 - 1 }, 6, 1); if (o.secrets > 1) vaultIn(K, R, L, { x0: NW.x0 + 1, y0: NW.y0 + 1, x1: NW.x1 - 1, y1: NW.y1 - 1 }, 12, 0);
    const st = towers[2], [sx, sy] = K.center(st);
    L.start = { x: sx + 0.5, y: sy + 0.5, ang: -Math.PI / 2 }; L.back = [st.x0 + 2.5, st.y1 - 1.5];
    const [tx, ty] = K.center(isl); L.tough = { x0: isl.x0, y0: isl.y0, x1: isl.x1 + 1, y1: isl.y1 + 1, cx: tx + 0.5, cy: ty + 0.5, fh: 0.35 };
    const [rx, ry] = K.center(SE); L.reward = [rx + 0.5, ry + 0.5]; L.fwd = [SE.x1 - 1.5, SE.y1 - 1.5];
    L.rooms = rooms; L.amb = o.amb || [0.4, 0.3, 0.36];
    return L;
  };

  // ---------------- FLOODED GRID (36x36): 3x3 chambers of a vaulted cistern, pillars, slow blood-water ----------------
  FL.tpl.flooded = function (R, def, K) {
    const o = def.opts || {}; K.alloc(36, 36, false); const L = base(def.snames); L.sky = false; L.water = true;
    const C = 12; const ch = (cx, cy) => ({ x0: cx * C + 1, y0: cy * C + 1, x1: cx * C + C - 1, y1: cy * C + C - 1, cx, cy });
    const cells = []; for (let cy = 0; cy < 3; cy++) for (let cx = 0; cx < 3; cx++) cells.push(ch(cx, cy));
    const get = (cx, cy) => cells[cy * 3 + cx];
    for (const c of cells) {
      for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
        const dry = (x - c.x0) % 5 === 1 || (y - c.y0) % 5 === 1; // raised walkways
        K.open(x, y, dry ? 0 : -0.3, 4.4, dry ? 0 : 3, false); CT[y * MW + x] = 1;
        if (!dry && (x % 3 === 0) && (y % 3 === 0)) K.wall(x, y, 99, 3);
      }
    }
    // route: start (0,2) -> ... -> tough (2,0) via a random walk that visits most chambers; extra doors for loops
    const ROUTES = [[[0, 2], [1, 2], [2, 2], [2, 1], [1, 1], [0, 1], [0, 0], [1, 0], [2, 0]], [[0, 2], [0, 1], [0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [2, 1], [2, 0]],
      [[0, 2], [1, 2], [1, 1], [0, 1], [0, 0], [1, 0], [2, 0]], [[0, 2], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1], [2, 0]]];
    const route = pick(R, ROUTES);
    const doorBetween = (a, b) => {
      const A = get(a[0], a[1]), B = get(b[0], b[1]);
      if (a[0] !== b[0]) { const x = Math.max(A.x1, B.x1) === A.x1 && a[0] > b[0] ? A.x0 - 1 : A.x1 + 1; const xx = a[0] < b[0] ? A.x1 + 1 : A.x0 - 1; const y = A.y0 + 1 + 5 * ri(R, 0, 1); K.open(xx, y, 0, 3.2, 1, false); K.open(xx, y + 1, 0, 3.2, 1, false); }
      else { const yy = a[1] < b[1] ? A.y1 + 1 : A.y0 - 1; const x = A.x0 + 1 + 5 * ri(R, 0, 1); K.open(x, yy, 0, 3.2, 1, false); K.open(x + 1, yy, 0, 3.2, 1, false); }
    };
    for (let i = 1; i < route.length; i++) if (route[i - 1].join() !== route[i].join()) doorBetween(route[i - 1], route[i]);
    const T = get(2, 0);
    // the tough chamber: no pillars, a dry dais in the middle
    for (let y = T.y0; y <= T.y1; y++) for (let x = T.x0; x <= T.x1; x++) { const i = y * MW + x; if (SOLID[i] && WT[i] === 3) K.open(x, y, -0.3, 4.4, 3, false); CH[i] = 5.6; }
    for (let y = T.y0 + 3; y <= T.y1 - 3; y++) for (let x = T.x0 + 3; x <= T.x1 - 3; x++) { K.open(x, y, 0.05, 5.6, 5, false); CT[y * MW + x] = 1; }
    // reward alcove: east of the tough chamber? the map edge - so cut it from the tough chamber's north-east corner
    const rw = { x0: T.x1 - 3, y0: T.y0, x1: T.x1, y1: T.y0 + 2 };
    for (let y = rw.y0; y <= rw.y1 + 1; y++) for (let x = rw.x0 - 1; x <= rw.x1; x++) K.wall(x, y, 99, 9);
    K.rect(rw, 0, 3.2, 5, false); const gx = rw.x0 + 1, gy = rw.y1 + 1; K.wall(gx, gy, 99, 7); L.bars.push([gx, gy, 0]);
    if (K.isOpen(gx, gy + 1) === false) K.open(gx, gy + 1, 0, 3.2, 1, false);
    // lights / props
    for (const c of cells) { const [cx, cy] = K.center(c); L.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 7, i: 0.75, c: o.lc || [0.4, 0.7, 1.0] }); for (const [dx, dy] of [[-4, -4], [4, 4]]) { const x = cx + dx + 0.5, y = cy + dy + 0.5; const i = (y | 0) * MW + (x | 0); if (!SOLID[i] && FH[i] >= 0) { L.props.push({ type: 'candelabra', x, y, z: 0 }); L.lights.push({ x, y, r: 4.5, i: 0.9, c: [1.0, 0.6, 0.3], flicker: true }); } } }
    const rooms = cells.map(c => Object.assign({}, c, { kind: c === T ? 'tough' : (c.cx === 0 && c.cy === 2) ? 'start' : 'path' })); rooms.push(Object.assign({ kind: 'reward' }, rw));
    for (const r of rooms) if (r.kind === 'path' && R() < 0.55) { const c = K.cells(r, R, 1).find(([x, y]) => FH[(y | 0) * MW + (x | 0)] >= 0); if (c) L.pickups.push({ type: R() < 0.65 ? 'vial' : 'mana', x: c[0], y: c[1] }); }
    // secrets: walled-off sluice rooms between chambers
    const unused = cells.filter(c => !route.some(r => r[0] === c.cx && r[1] === c.cy));
    for (const c of fy(rooms.filter(r => r.kind === 'path'), R)) { if (L.secrets.length >= (o.secrets || 1)) break; vaultIn(K, R, L, c, L.secrets.length ? 12 : 6); }
    const S = get(0, 2);
    L.start = { x: S.x0 + 1.5, y: S.y1 - 3.5, ang: -Math.PI / 2 }; L.back = [S.x0 + 1.5, S.y1 - 1.5];
    FH[(S.y1 - 4) * MW + S.x0 + 1] = 0; FT[(S.y1 - 4) * MW + S.x0 + 1] = 4;
    for (let y = S.y1 - 4; y <= S.y1; y++) { const i = y * MW + S.x0 + 1; SOLID[i] = 0; FH[i] = 0; FT[i] = 4; }
    const [tx, ty] = K.center(T); L.tough = { x0: T.x0, y0: T.y0 + 3, x1: T.x1 + 1, y1: T.y1 + 1, cx: tx + 0.5, cy: ty + 1.5, fh: 0 };
    L.reward = [rw.x0 + 1.5, rw.y0 + 1.5]; L.fwd = [rw.x1 - 0.6, rw.y0 + 0.6];
    L.rooms = rooms; L.amb = o.amb || [0.34, 0.38, 0.46];
    return L;
  };
})();
