// ===== m19sec: per-run random secret-room loot (locations stay put).
// Nave rooms had fixed caches; crypt rooms used a repeating 0/1/2 rotation. Weapon-cache and
// reliquary *rewards* were already rolled with Math.random. We re-roll generic secret contents
// from a depth-weighted pool, seeded so Daily Descent stays deterministic. Vials, unique
// story pickups (pistol, blade, chalice, soul shard, m13 sigils/candles), boss/elite spoils
// and non-secret drops are left alone. ?rndsecret=0 or ?m19=0 restores the authored types.
(function () {
  if (!window.M19 || !M19.rndsecret) return;
  const S = M19.sec = { on: true, log: [], err: [] };
  const KEEP = { vial: 1, pistol: 1, blade: 1, chalice: 1, shard: 1, m13sigil: 1, m13candle: 1, spoils: 1 };
  const mulberry = (typeof window.mulberry === 'function') ? window.mulberry : function (seed) {
    let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  function fnv(s) { let h = 2166136261; for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function key(tag) {
    const day = (typeof RUN !== 'undefined' && RUN.m12daily) || (window.M12 && M12.D && M12.D.on && M12.D.key) || '';
    const st = ((typeof RUN !== 'undefined' && (RUN.stage | 0)) || 0) + ':' + ((typeof RUN !== 'undefined' && RUN.cfg && RUN.cfg.abyss) || 0);
    const base = day ? ('UNYIELDING:' + day + ':' + tag + st) : ('run:' + ((typeof RUN !== 'undefined' && RUN.seed) || 1) + ':' + tag + st);
    return fnv(base);
  }
  function rng(tag) { return mulberry(key(tag)); }
  function inSecret(p) {
    const secs = (typeof LEVEL !== 'undefined' && LEVEL.secrets) || [];
    for (const s of secs) {
      const b = s.box; if (!b) continue;
      if (p.x >= b[0] && p.y >= b[1] && p.x < b[2] && p.y < b[3]) return s;
    }
    return null;
  }
  function weights(stage) {
    const n = stage | 0;
    if (n <= 3) return [['shards', 3.0], ['mana', 2.0], ['rose', 2.0], ['reliq', 1.4], ['cache', 0.8]];
    if (n <= 7) return [['shards', 2.0], ['mana', 1.0], ['rose', 1.4], ['reliq', 2.4], ['cache', 2.0]];
    return [['shards', 1.4], ['rose', 1.0], ['reliq', 2.4], ['cache', 3.0]];
  }
  function pickType(R, stage) {
    const w = weights(stage); let t = 0; for (const x of w) t += x[1];
    let r = R() * t; for (const x of w) { r -= x[1]; if (r <= 0) return x[0]; }
    return w[w.length - 1][0];
  }
  function shardAmt(R, stage, prev) {
    const n = stage | 0;
    const base = (n <= 3 ? 16 : n <= 7 ? 24 : 32) + Math.floor(R() * (n <= 3 ? 10 : 16));
    return Math.max(10, prev && prev > 0 ? Math.round((prev + base) / 2) : base);
  }

  function reroll() {
    if (!M19.rndsecret || typeof LEVEL === 'undefined' || !LEVEL || !LEVEL.pickups || !LEVEL.secrets || !LEVEL.secrets.length) return;
    if (typeof RUN !== 'undefined' && RUN.hub) return;
    const R = rng('sec');
    const stage = (typeof RUN !== 'undefined' && (RUN.stage | 0)) || 1;
    const before = [];
    let n = 0;
    for (const p of LEVEL.pickups) {
      if (!inSecret(p)) continue;
      if (KEEP[p.type]) continue;
      before.push({ type: p.type, amt: p.amt, x: p.x, y: p.y });
      const t = pickType(R, stage);
      p.type = t;
      if (t === 'shards') p.amt = shardAmt(R, stage, p.amt);
      else delete p.amt;
      n++;
    }
    if (typeof G !== 'undefined' && G && LEVEL.pickups && typeof mkPickup === 'function') {
      G.pickups = LEVEL.pickups.map(p => Object.assign({}, mkPickup(p.type, p.x, p.y), { drop: false, amt: p.amt }));
    }
    S.last = { stage, n, before, after: LEVEL.pickups.filter(inSecret).map(p => ({ type: p.type, amt: p.amt, x: +p.x.toFixed(2), y: +p.y.toFixed(2) })) };
    S.log.push(S.last); if (S.log.length > 20) S.log.shift();
  }

  // seed only secret cache / reliquary *reward* rolls (not elite spoils, Hollow Saint, or ending relics)
  function wrapPick(kind) {
    if (!window.PICK || !PICK[kind] || typeof PICK[kind].f !== 'function') return;
    const _f = PICK[kind].f;
    PICK[kind].f = function (p) {
      if (!M19.rndsecret || !p || !inSecret(p)) return _f.apply(this, arguments);
      const keep = Math.random;
      Math.random = mulberry(fnv(key('secPay') + ':' + kind + ':' + Math.round(p.x * 100) + ':' + Math.round(p.y * 100)));
      try { return _f.apply(this, arguments); } finally { Math.random = keep; }
    };
  }
  wrapPick('cache'); wrapPick('reliq');

  if (typeof newGame === 'function') {
    const _ng = newGame;
    newGame = function () {
      const r = _ng.apply(this, arguments);
      try { reroll(); } catch (e) { M19.err = M19.err || ('sec ' + e); S.err.push(String(e && e.stack || e)); }
      return r;
    };
  }
  S.reroll = reroll; S.inSecret = inSecret;
})();
