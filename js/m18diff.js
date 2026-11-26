// ===== m18diff: smoother S8-10 ramp, readable projectiles, damage-direction + hit attribution.
// Boss stats unchanged except telegraph readability. ?diff=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.diff) return;
  const D18 = M18.diffState = { on: true };

  function stageN() { return (typeof RUN !== 'undefined' && RUN.on) ? (RUN.stage | 0) : 0; }
  function inCliff() { const n = stageN(); return n >= 8 && n <= 10 && !(RUN.cfg && RUN.cfg.abyss); }

  // incoming damage scale (projectiles harder to read were the cliff). Melee is gentler.
  function scaleIn(dmg, opt) {
    if (!inCliff()) return dmg;
    const n = stageN();
    const proj = !!(opt && (opt.proj || opt.src == null || opt.env === 'proj'));
    const k = n === 8 ? (proj ? 0.88 : 0.94) : n === 9 ? (proj ? 0.80 : 0.90) : (proj ? 0.74 : 0.88);
    return dmg * k;
  }
  if (typeof rogueEnemyDmg === 'function') {
    const _red = rogueEnemyDmg;
    rogueEnemyDmg = function (dmg, opt) {
      return scaleIn(_red.apply(this, arguments), opt);
    };
  } else if (typeof hurtPlayer === 'function') {
    const _h = hurtPlayer;
    hurtPlayer = function (dmg, srcx, srcy, opt) {
      return _h.call(this, scaleIn(dmg, opt || {}), srcx, srcy, opt);
    };
  }

  // attribute projectile hits (was src:null -> "dark magic") + direction pip
  if (typeof updateProjectiles === 'function') {
    const _up = updateProjectiles;
    updateProjectiles = function (dt) {
      // bright trails
      try {
        if (G.projectiles) for (const p of G.projectiles) {
          if (p.dead) continue;
          p.m18g = (p.m18g || 0) + 1;
          if (p.m18g % 2 === 0 && typeof addP === 'function') {
            const col = p.type === 'bloodwave' ? (typeof RGB === 'function' ? RGB(255, 50, 80) : 0xffff5080) : (typeof RGB === 'function' ? RGB(255, 200, 80) : 0xffffc850);
            addP({ k: 'spark', x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0.2, size: 0.05, col: col, life: 0.28 });
          }
        }
      } catch (e) {}
      return _up.apply(this, arguments);
    };
  }
  if (typeof hurtPlayer === 'function') {
    const _hp = hurtPlayer;
    hurtPlayer = function (dmg, srcx, srcy, opt) {
      opt = opt || {};
      try {
        // if a projectile is mid-hit with no src, tag it
        if (!opt.src && typeof G !== 'undefined' && G.projectiles) {
          let best = null, bd = 0.8;
          for (const p of G.projectiles) {
            if (p.dead) continue;
            const d = Math.hypot((p.x - (srcx || P.x)), (p.y - (srcy || P.y)));
            if (d < bd) { bd = d; best = p; }
          }
          if (best) {
            opt.proj = best.type || 'bolt';
            if (best.owner && best.owner.alive) opt.src = best.owner;
            G.lastHit = (best.owner && best.owner.type) || best.type || 'magic';
            G.lastHitName = (best.owner && best.owner.d && best.owner.d.name) || (best.type === 'fireball' ? 'a firebolt' : best.type === 'bloodwave' ? 'a blood wave' : 'a projectile');
          }
        }
        if (srcx != null && srcy != null && typeof P !== 'undefined') {
          const ang = Math.atan2(srcy - P.y, srcx - P.x);
          const rel = Math.atan2(Math.sin(ang - P.ang), Math.cos(ang - P.ang));
          G.m18dir = { a: rel, t: 0.55, dmg: dmg };
        }
        if (opt.src && opt.src.type) { G.lastHit = opt.src.type; G.lastHitName = (opt.src.d && (opt.src.d.title || opt.src.d.name)) || opt.src.type; }
      } catch (e) { M18.err = M18.err || ('diffHP ' + e); }
      return _hp.call(this, dmg, srcx, srcy, opt);
    };
  }
  if (typeof playerDie === 'function') {
    const _pd = playerDie;
    playerDie = function () {
      try { if (G.lastHitName && RUN) RUN.cause = G.lastHitName; } catch (e) {}
      return _pd.apply(this, arguments);
    };
  }

  // brighter projectile sprites
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        if (G.projectiles) for (const p of G.projectiles) {
          if (p.dead) continue;
          S.push({ tex: 'glow_w', x: p.x, y: p.y, z: p.z - 0.1, w: p.type === 'bloodwave' ? 1.7 : 0.7, h: p.type === 'bloodwave' ? 0.7 : 0.7, add: true, alpha: 0.55, lit: false, tint: p.type === 'bloodwave' ? [255, 40, 70, 1] : [255, 210, 80, 1], dep2: 0.02 });
        }
      } catch (e) {}
      return S;
    };
  }

  // direction indicator (HUD overlay)
  if (typeof M8DRAW !== 'undefined') {
    M8DRAW.push(function (ctx) {
      const d = G.m18dir; if (!d || d.t <= 0) return false;
      d.t -= 1 / 60; const a = Math.max(0, d.t / 0.55);
      const ang = d.a, x = W / 2 + Math.sin(ang) * 70, y = H / 2 - Math.cos(ang) * 42;
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * a;
      ctx.fillStyle = '#ff4060';
      ctx.beginPath();
      const s = 5 + Math.min(8, (d.dmg || 10) / 8);
      const ux = Math.sin(ang), uy = -Math.cos(ang);
      ctx.moveTo(x + ux * s * 2, y + uy * s * 2);
      ctx.lineTo(x - uy * s, y + ux * s);
      ctx.lineTo(x + uy * s, y - ux * s);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    });
  }

  // slightly fewer late-stage trash additions: wrap m9n-style pushes after the fact by culling far asleep trash on S9/S10 at start
  function thin() {
    if (!inCliff() || !G.enemies) return;
    const n = stageN();
    const cap = n === 8 ? 70 : n === 9 ? 64 : 60;
    const foes = G.enemies.filter(e => e.alive && !e.summoned && !(e.d && e.d.boss));
    if (foes.length <= cap) return;
    // hide the farthest asleep extras (not bosses, not already in a room with the player)
    foes.sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y));
    let drop = foes.length - cap;
    for (const e of foes) {
      if (drop <= 0) break;
      if (e.awake || Math.hypot(e.x - P.x, e.y - P.y) < 14) continue;
      e.alive = false; e.hidden = true; e.dead = true; e.deathType = 'gone'; e.m18thinned = 1;
      drop--;
    }
    D18.thinned = (D18.thinned || 0) + 1;
  }
  const armThin = fn => {
    if (typeof fn !== 'function') return fn;
    return function () { const r = fn.apply(this, arguments); try { setTimeout(thin, 80); } catch (e) {} return r; };
  };
  if (typeof nextStage === 'function') nextStage = armThin(nextStage);
  if (typeof leaveHubForRun === 'function') leaveHubForRun = armThin(leaveHubForRun);
})();
