// ===== m12c: ranged-foe telegraphs + readability on the red (Arena / hell) and holy (Cathedral) stages =====
// - every regular foe that is about to SHOOT shows a growing, pulsing charge glow where the shot will leave, with a soft rising
//   charge cue (distance-scaled), so a projectile is never a surprise. Bosses keep their own tells (designs untouched).
// - regular foes' projectiles in flight get a contrasting halo: cyan on red stages, violet on holy-white stages, warm white
//   elsewhere (READABILITY ON/HIGH makes it bigger).
// - red / holy stages: less screen blood and a soft tone-down of blown-out highlights (HUD overlay only, no art changed).
(function () {
  const M12 = window.M12 || {}; if (!M12.on) return;
  const C = M12.C = { n: 0, cue: 0, last: 0 };
  const tone = () => {
    try {
      const th = typeof curTheme === 'function' ? curTheme() : null; if (!th || !RUN.on || RUN.hub) return '';
      const nm = (th.name || '') + ' ' + ((RUN.cfg && RUN.cfg.theme) || ''); const h = th.haze || [0, 0, 0];
      if (/CATHEDRAL|SANCT|HOLY|cathedral/i.test(nm) || h[0] + h[1] + h[2] > 520) return 'holy';
      if (/ARENA|HELL|INFERNO|BLOOD|arena|hell/i.test(nm) || (h[0] > 130 && h[0] > h[2] * 1.4 && h[0] > h[1] * 1.8)) return 'red';
    } catch (e) { }
    return '';
  };
  M12.tone = tone;
  const isShooter = e => e && e.d && !e.d.boss && !e.summoned && (e.d.ranged || e.d.skulls || (e.d.range || 0) >= 5.5);
  const sealed = () => { const g = typeof LEVEL !== 'undefined' && LEVEL && LEVEL.doors && LEVEL.doors.gate; return !!(g && g.state === 'sealed'); };
  const wuOf = e => (e.d.windup || 0.6) * (e.wuMul || 1);

  // ---------- charge cue (sound) ----------
  function cue(e) {
    const now = performance.now(); if (now - C.last < 140) return; C.last = now;
    const d = Math.hypot(e.x - P.x, e.y - P.y); const v = Math.max(0.12, Math.min(0.55, 1.2 / Math.max(1, d * 0.5)));
    try { if (SFX.buf && SFX.buf.m12_charge) SFX.ev('m12_charge', v, []); else SFX.play('glint', v * 0.5); C.cue++; } catch (er) { }
  }
  // ---------- sprites ----------
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs.apply(this, arguments);
    try {
      if (G.state !== 'play' || !RUN.on || C.off) return S;
      const t = G.time, add = [], tn = tone(), rk = (window.OPT && OPT.S.m12read) | 0;
      for (const e of G.enemies) {
        if (!e.alive || e.hidden || !isShooter(e)) { if (e) e.m12wu = 0; continue; }
        if (e.state === 'windup') {
          if (!e.m12wu) { e.m12wu = 1; if (e.awake && Math.hypot(e.x - P.x, e.y - P.y) < 16) cue(e); }
          const k = Math.max(0, Math.min(1, (e.st || 0) / wuOf(e))), pl = 0.5 + 0.5 * Math.sin(t * (18 + 20 * k));
          const ang = Math.atan2(P.y - e.y, P.x - e.x), ox = e.x + Math.cos(ang) * 0.35, oy = e.y + Math.sin(ang) * 0.35, z = e.z + e.h * (e.d.skulls ? 0.62 : 0.5);
          const col = tn === 'red' ? [120, 255, 235, 1] : tn === 'holy' ? [210, 110, 255, 1] : [255, 210, 120, 1];
          const sz = 0.22 + 0.5 * k;
          add.push({ tex: 'glow_w', x: ox, y: oy, z: z - sz / 2, w: sz, h: sz, add: true, alpha: 0.35 + 0.45 * k + 0.2 * pl, lit: false, tint: col });
          if (k > 0.55) add.push({ tex: 'glow_w', x: ox, y: oy, z: z - sz * 0.9, w: sz * 1.8 * (1 + 0.2 * pl), h: sz * 1.8 * (1 + 0.2 * pl), add: true, alpha: 0.18 + 0.25 * pl, lit: false, tint: col });
          C.n++;
        } else e.m12wu = 0;
      }
      if (!sealed()) for (const p of G.projectiles) {
        const o = p.owner; if (!o || !o.d || o.d.boss || o.summoned || o === P) continue;
        const col = tn === 'red' ? [110, 255, 230, 1] : tn === 'holy' ? [190, 90, 255, 1] : [255, 236, 190, 1];
        const sz = 0.55 * (rk ? 1.25 : 1) * (rk === 2 ? 1.2 : 1);
        add.push({ tex: 'glow_w', x: p.x, y: p.y, z: p.z - sz / 2, w: sz, h: sz, add: true, alpha: tn ? 0.55 : 0.35, lit: false, tint: col });
      }
      if (add.length) {
        const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
        for (const s of add) { s.dep = (s.x - cam.x) * dx + (s.y - cam.y) * dy; if (s.dep < 0.3) continue; let i = 0; while (i < S.length && S[i].dep !== undefined && S[i].dep > s.dep) i++; S.splice(i, 0, s); }
      }
    } catch (e) { M12.err = String(e && e.stack || e); }
    return S;
  };
  // ---------- red / holy stages: less screen blood ----------
  if (typeof screenSplat === 'function') { const _ss = screenSplat; screenSplat = function (n, big) { const tn = tone(); return _ss(tn && typeof n === 'number' ? Math.max(1, Math.round(n * 0.55)) : n, big); }; }
  // ---------- holy stage: soft highlight tone-down overlay (only when the view is genuinely blown out) ----------
  let lum = 0, lumT = 0; const probe = document.createElement('canvas'); probe.width = 16; probe.height = 9; const px = probe.getContext('2d', { willReadFrequently: true });
  M12.lum = () => lum;
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (G.state !== 'play' || G.paused || !RUN.on) return;
      const tn = tone(); if (!tn) return;
      if ((lumT -= 1) <= 0) { lumT = 12; const src = (typeof ctxLow !== 'undefined' && ctxLow.canvas) || ctx.canvas; px.drawImage(src, 0, 0, 16, 9); const d = px.getImageData(0, 0, 16, 9).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; lum = lum * 0.6 + (s / (d.length / 4)) * 0.4; }
      const over = Math.max(0, (lum - (tn === 'holy' ? 150 : 170)) / 80); if (over <= 0) return;
      ctx.save(); ctx.fillStyle = tn === 'holy' ? 'rgb(40,28,64)' : 'rgb(36,10,30)'; ctx.globalAlpha = Math.min(0.32, over * 0.4); ctx.fillRect(0, 0, W, H - 35); ctx.restore(); C.dim = over; return true;
    } catch (e) { M12.err = String(e); }
  });
})();
