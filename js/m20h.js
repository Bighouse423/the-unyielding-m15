// ===== m20h: gatefix (t220u: "half gateways on the walls ... make them a full gate or get rid of them, and anything else like it") =====
// Wall decals (WALLDEFS[i].tall) only cover z0..z1 of a wall that is 3-6 m high, so a gravestone slab / a barred gate / a skull column
// ended mid-wall beside plain brick. Now: iron-bar gate (h_kennel) and skull columns are TILED up the whole wall (full gate / full column);
// the gravestone slab (t_tomb), the barred arch (t_grate) and the iron-door strip (t_irondoor) are removed (a floating half-height slab can't be made whole). Real doors, windows, banners,
// statues, slits stay as they were. Kill switch: ?gatefix=0 (or ?m20h=0).
(function () {
  const Q = location.search, on = !/[?&](gatefix|m20h)=0/.test(Q);
  const M = window.M20H = { on, n: { removed: 0, tiled: 0, defs: 0 }, kinds: {}, idx: new WeakMap(), err: [] };
  if (!on) return;
  const TILE = { t_skullcol: 1, t_skulls: 1, h_kennel: 1 }, REMOVE = { t_tomb: 1, t_grate: 1, t_irondoor: 1 };
  let lastW = null;
  function nameOf(t) { const o = (t && t.m21src) || t; for (const k in Engine.tex) if (Engine.tex[k] === o) return k; return null; }
  function proc() {
    if (typeof WALLDEFS === 'undefined' || !WALLDEFS || WALLDEFS === lastW) return; lastW = WALLDEFS;
    for (let wi = 0; wi < WALLDEFS.length; wi++) {
      const w = WALLDEFS[wi];
      try {
        if (!w || !w.tall || !w.tall.t || w.tall.m20h) continue;
        const nm = nameOf(w.tall.t); if (!nm) continue;
        if (TILE[nm]) { M.idx.set(w, nm); w.tall.rep = true; w.tall.m20h = 1; M.n.tiled++; M.kinds[nm] = 'tile'; }
        else if (REMOVE[nm]) { M.idx.set(w, nm); w.tall = null; M.n.removed++; M.kinds[nm] = 'remove'; }
        M.n.defs++;
      } catch (e) { if (M.err.length < 10) M.err.push(String(e && e.message || e)); }
    }
  }
  M.proc = proc;
  if (typeof frameInner === 'function') { const _fi = frameInner; frameInner = function () { try { proc(); } catch (e) { } return _fi.apply(this, arguments); }; }
})();
