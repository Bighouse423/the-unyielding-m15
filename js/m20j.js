// ===== m20j: bug sweep pass (t233u) =====
// wallfix : enemies (and loose pickups) that spawn or end up in a solid cell are slid to the nearest open floor
//           of similar height. Root cause: crypt freeCell gives up after 60 tries and returns the room centre,
//           which can be a pillar / sunken tile (seen on S5 at 20.8,45.2 and similar rooms). Skips burrow/phase/hidden.
// chain3  : hung ceiling chains (and sealed-entrance chains) no longer take the flickering lightmap, and their
//           billboard is pinned to a whole screen pixel with a stable width (engine.js honors s.snap). Fade starts
//           a little earlier so they do not fill the lens. Aim: shimmer <= 3% (was 11.1% in m20i).
// Kill switches: ?m20j=0 (all) | ?wallfix=0 | ?chain3=0
(function () {
  const Q = location.search, off = /[?&](m20j|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20J = { on: !off, wall: fl('wallfix'), chain: fl('chain3'), n: { wall: 0, pick: 0, chain: 0 }, err: [] };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  M.st = () => ({ on: M.on, wall: M.wall, chain: M.chain, n: M.n, err: M.err });
  if (off) return;

  function stuck(x, y) {
    if (typeof MW === 'undefined' || !SOLID) return false;
    const i = (y | 0) * MW + (x | 0); return i < 0 || i >= MW * MH || !!SOLID[i];
  }
  function nearestOpen(x, y) {
    const x0 = x | 0, y0 = y | 0;
    for (let r = 1; r <= 10; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x0 + dx + 0.5, ny = y0 + dy + 0.5;
        const i = typeof cellAt === 'function' ? cellAt(nx, ny) : ((ny | 0) * MW + (nx | 0));
        if (i < 0 || i >= MW * MH || SOLID[i]) continue;
        if (typeof FH !== 'undefined' && FH[i] < -0.5) continue;
        return [nx, ny, i];
      }
    }
    return null;
  }
  function skipEnemy(e) {
    return !e || !e.alive || e.hidden || e.m20inv || e.m20bur || (e.d && e.d.phase);
  }
  function nudgeAll() {
    if (!M.wall || typeof G === 'undefined' || !G.enemies || !SOLID) return;
    for (const e of G.enemies) {
      if (skipEnemy(e) || !stuck(e.x, e.y)) continue;
      const p = nearestOpen(e.x, e.y); if (!p) continue;
      e.x = p[0]; e.y = p[1];
      if (typeof FH !== 'undefined' && e.z !== undefined && FH[p[2]] > -0.5) e.z = FH[p[2]];
      M.n.wall++;
    }
    if (G.pickups) for (const p of G.pickups) {
      if (!p || p.taken || !stuck(p.x, p.y)) continue;
      const q = nearestOpen(p.x, p.y); if (!q) continue;
      p.x = q[0]; p.y = q[1]; M.n.pick++;
    }
  }
  M.nudge = nudgeAll;


  const HUNG = { h_chain: 1, a_chain: 1, m20i_hchain: 1, m20_chains: 1 };
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        if (M.wall) nudgeAll();
        if (M.chain) {
          const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
          const ep = (typeof EP !== 'undefined' && EP > 0) ? EP : 300;
          for (const s of S) {
            if (!HUNG[s.tex]) continue;
            s.lit = false; s.snap = 1; s.rim = 0; s.noHaze = 1;
            const d = s.dep !== undefined ? s.dep : (s.x - cam.x) * dx + (s.y - cam.y) * dy;
            if (s.tex !== 'm20_chains') {
              const k = Math.max(0, Math.min(1, (d - 0.75) / 0.85));
              s.alpha = (s.alpha === undefined ? 1 : s.alpha) * k;
              s.w = Math.max(0.14, 4.0 * Math.max(d, 0.2) / ep);
            }
            M.n.chain++;
          }
        }
      } catch (e) { fail('sprites', e); }
      return S;
    };
  }

  if (typeof frameInner === 'function') {
    const _fi = frameInner; let tick = 0;
    frameInner = function () {
      const r = _fi.apply(this, arguments);
      try { if (M.wall && (++tick % 20) === 0) nudgeAll(); } catch (e) { fail('frame', e); }
      return r;
    };
  }
  M.st = () => ({ on: M.on, wall: M.wall, chain: M.chain, n: M.n, err: M.err });
})();
