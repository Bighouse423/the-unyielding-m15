// ===== m21i: enemy windup telegraphs (floor danger discs + ranged aim dots).
// Overlay sprites only. No timing, damage, or hand/pixel changes.
// Bosses already have their own tells; this covers regular foes.
// Kill: ?m21i=0 / ?m21=0 | ?tell=0 | ?tellfloor=0 | ?tellaim=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21i') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21I = {
    on: !off, tell: on('tell'), tellfloor: on('tellfloor'), tellaim: on('tellaim'),
    n: { floor: 0, aim: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, tell: M.tell, tellfloor: M.tellfloor, tellaim: M.tellaim,
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  function kOf(e) {
    const d = e.d || {};
    const wu = d.windup || 0.5;
    if (e.state === 'windup') return Math.max(0, Math.min(1, (e.st || 0) / wu));
    if (e.state === 'strike') return Math.max(0, 1 - (e.st || 0) / Math.max(0.08, (d.strike || 0.2) * 0.5));
    return 0;
  }

  function addTells(S) {
    if (!M.tell || !S || typeof G === 'undefined' || !G.enemies) return;
    const t = G.t || 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e || !e.alive || e.hidden || e.dead) continue;
      const d = e.d || {};
      if (d.boss) continue;
      const k = kOf(e);
      if (k <= 0) continue;
      const pulse = 0.55 + 0.45 * Math.sin(t * 30);
      const fz = (typeof floorAt === 'function' ? floorAt(e.x, e.y) : 0) - 0.12;
      if (d.ranged && M.tellaim) {
        const ang = Math.atan2(P.y - e.y, P.x - e.x);
        const reach = Math.min(Math.hypot(P.x - e.x, P.y - e.y), 7);
        const n = 4;
        for (let j = 1; j <= n; j++) {
          const u = (j / (n + 0.4)) * (0.4 + 0.6 * k);
          const x = e.x + Math.cos(ang) * reach * u;
          const y = e.y + Math.sin(ang) * reach * u;
          const z = (typeof floorAt === 'function' ? floorAt(x, y) : 0) - 0.1;
          S.push({
            tex: 'glow_w', x, y, z, w: 0.55 + 0.15 * k, h: 0.24,
            add: true, alpha: (0.35 + 0.4 * k) * pulse, lit: false,
            tint: [255, 150, 40, 1], ent: 1, tell: 1
          });
        }
        M.n.aim++;
      } else if (M.tellfloor) {
        const rad = Math.min(d.range || 1.4, 2.15) * (0.5 + 0.5 * k);
        S.push({
          tex: 'glow_w', x: e.x, y: e.y, z: fz,
          w: rad * 2.15, h: Math.max(0.36, rad * 0.55),
          add: true, alpha: (0.28 + 0.4 * k) * pulse, lit: false,
          tint: [255, 36, 48, 1], ent: 1, tell: 1
        });
        // a slightly tighter inner pulse so the disc reads as a ring, not a blob
        S.push({
          tex: 'glow_w', x: e.x, y: e.y, z: fz + 0.02,
          w: rad * 1.2, h: Math.max(0.24, rad * 0.28),
          add: true, alpha: (0.16 + 0.25 * k) * pulse, lit: false,
          tint: [255, 200, 80, 1], ent: 1, tell: 1
        });
        M.n.floor++;
      }
    }
  }

  function hook() {
    if (typeof collectSprites !== 'function' || collectSprites._m21i) return;
    const _cs = collectSprites;
    collectSprites = function () {
      const S = _cs.apply(this, arguments);
      try { addTells(S); } catch (e) { fail('tell', e); }
      return S;
    };
    collectSprites._m21i = 1;
  }
  try { hook(); } catch (e) { fail('h', e); }
  M.ready = 1;
  setTimeout(function () { try { hook(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
