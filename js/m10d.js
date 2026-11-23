// ===== M10d: extra content - Wandering Souls =====
// From stage 2, some stages hide a lost soul in a far room (40%, rolled from the run seed: no Math.random, so every
// gameplay roll is unchanged). Find it and it gives you shards for the altar and a last word. Core play is untouched.
(function () {
  if (typeof M9 === 'undefined' || typeof PICK === 'undefined') return;
  const LINES = [
    '"Tell the Lich I said no. He never listened to me either."', '"I was a bellringer. Ring it for me when he falls."',
    '"My shadow left first. I hope it is somewhere warm."', '"They told us the candle would last. It did. We did not."',
    '"I sold Morwen my name. Buy it back for me, Baron."', '"Don\'t look down the stair. Just keep walking."',
    '"I kept praying. Something answered. It was not kind."', '"You are the one who would not stay dead. Good. Keep it up."',
    '"The dog was sweet once. Everything was sweet once."',
  ];
  // sprite: a pale violet-green wisp with two dark eyes
  const c = document.createElement('canvas'); c.width = 14; c.height = 20; const x = c.getContext('2d');
  const R = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R('#6a40b0', 3, 4, 8, 10); R('#9a70e0', 2, 6, 10, 6); R('#c8a8ff', 4, 5, 6, 7); R('#f0e8ff', 5, 6, 4, 4);
  R('#20103a', 5, 8, 1, 2); R('#20103a', 8, 8, 1, 2); R('#8ae0b0', 4, 14, 6, 2); R('#6ac090', 5, 16, 4, 2); R('#4a9070', 6, 18, 2, 2); R('#e8fff0', 6, 1, 2, 2);
  Engine.imgs.p_m10soul = c; const dd = x.getImageData(0, 0, 14, 20); Engine.tex.p_m10soul = { w: 14, h: 20, d: new Uint32Array(dd.data.buffer) };
  PICK.m10soul = { tex: 'p_m10soul', h: 0.5, gc: [190, 150, 255], f(p) {
    let n = 15 + 5 * (RUN.stage | 0); if (typeof shardGain === 'function') n = shardGain(n, null) || n;
    RUN.m10souls = (RUN.m10souls || 0) + 1; SFX.play('ghost', 0.5); SFX.play('glint', 0.8);
    toast('A WANDERING SOUL  +' + n + ' SHARDS', LINES[p.line % LINES.length], '#d8c0ff', 4.5);
    if (window.M10R) for (let i = 0; i < 3; i++) M10R.SOUL.push({ x: p.x, y: p.y, z: p.z + 0.4, t: -i * 0.15, life: 1.8, ph: i * 2, col: [200, 160, 255], sz: 0.08 });
    return true;
  } };
  M9.on('stage', () => {
    if (!RUN.on || RUN.hub || !(RUN.stage >= 2 && RUN.stage <= 10) || !LEVEL || !G.pickups) return;
    let sd = ((RUN.seed || 1) ^ Math.imul(RUN.stage, 0x9e3779b1) ^ 0x51ed27) >>> 0; sd = Math.imul(sd ^ (sd >>> 16), 0x45d9f3b); sd = Math.imul(sd ^ (sd >>> 16), 0x45d9f3b); sd = (sd ^ (sd >>> 16)) >>> 0; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
    if (rnd() >= 0.4) return;
    const ok = (x, y) => { const i = y * MW + x; return x > 0 && y > 0 && x < MW - 1 && !SOLID[i] && FH[i] === 0 && (typeof FT === 'undefined' || FT[i] !== 6); };
    const lp = M9.lorePk, cand = [];
    for (const r of (LEVEL.rooms || [])) { if (r.kind === 'secret' || r.style === 'start') continue; for (let y = r.y0 + 1; y < r.y1; y++) for (let x = r.x0 + 1; x < r.x1; x++) if (ok(x, y) && Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y) > 10 && (!lp || Math.hypot(x + 0.5 - lp.x, y + 0.5 - lp.y) > 6) && (!G.boss || Math.hypot(x - G.boss.x, y - G.boss.y) > 9)) cand.push([x, y]); }
    if (!cand.length) return;
    const k = cand[(rnd() * cand.length) | 0];
    G.pickups.push({ type: 'm10soul', x: k[0] + 0.5, y: k[1] + 0.5, z: floorAt(k[0] + 0.5, k[1] + 0.5) + 0.25, t: rnd() * 6, taken: false, vz: 0, drop: false, line: (rnd() * 1000) | 0 });
  });
  M10.v = 'm10d';
})();
