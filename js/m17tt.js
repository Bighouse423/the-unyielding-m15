// ===== m17tt: a cooler, more premium title / cover screen =====
// Layered gothic atmosphere over the existing chapel render and Baron Kael portrait: parallax arches,
// drifting fog and embers, lightning, a forged-metal / bloodied sheen on the logo with a glow pulse
// locked to the title theme's 133.33 bpm, and a tighter menu frame. Menu hit-boxes, labels and
// pad/keyboard navigation are unchanged so controller tests still pass. Title music is untouched.
// Effects are overlays only. ?title=0 restores the m16 title.
(function () {
  if (typeof drawTitle !== 'function' || /[?&]title=0/.test(location.search)) return;
  const T = window.M17TT = { on: true, err: null, bpm: 133.33 };
  const BEAT = 60 / T.bpm;
  const _dt = drawTitle;
  const TAU = Math.PI * 2;

  // particles
  const embers = [];
  for (let i = 0; i < 52; i++) embers.push({ x: Math.random() * 480, y: Math.random() * 270, v: 8 + Math.random() * 22, drift: (Math.random() - 0.5) * 6, s: Math.random() < 0.25 ? 2 : 1, a: 0.25 + Math.random() * 0.55, hue: Math.random() });
  const fog = [];
  for (let i = 0; i < 5; i++) fog.push({ x: Math.random() * 480, y: 80 + Math.random() * 160, w: 140 + Math.random() * 160, sp: 3 + Math.random() * 7, a: 0.04 + Math.random() * 0.05, ph: Math.random() * TAU });

  let bolt = 0, boltX = 340, boltPath = [], nextBolt = 4 + Math.random() * 6, lastT = 0, sheen = 0;
  T.flash = () => { bolt = 1; boltX = 300; boltPath = mkBolt(310, 0, 300, 90); nextBolt = 8; };

  function beatAmt(t) {
    // 0..1, sharp peak on each quarter-note of the title theme
    try {
      const fm = SFX.fm, v = fm && fm.name === 'trk:unyielding' && fm.v && fm.v[fm.v.length - 1];
      if (v && SFX.ctx) t = SFX.ctx.currentTime - v.t0 + (v.off || 0);
    } catch (e) { }
    const ph = ((t / BEAT) % 1 + 1) % 1;
    return Math.pow(Math.max(0, Math.cos(ph * TAU)), 4);
  }

  function mkBolt(x0, y0, x1, y1) {
    const pts = [[x0, y0]];
    let x = x0, y = y0, n = 7 + (Math.random() * 4 | 0);
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      x = x0 + (x1 - x0) * k + (Math.random() - 0.5) * 18;
      y = y0 + (y1 - y0) * k + (Math.random() - 0.5) * 8;
      pts.push([Math.round(x), Math.round(y)]);
      if (Math.random() < 0.35 && i > 1 && i < n) {
        const bx = x + (Math.random() - 0.5) * 40, by = y + 8 + Math.random() * 24;
        pts.push([Math.round(bx), Math.round(by)], [Math.round(x), Math.round(y)]);
      }
    }
    pts.push([x1, y1]);
    return pts;
  }

  function drawBolt(ctx, pts, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(230,220,255,${(0.95 * a).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    ctx.strokeStyle = `rgba(180,200,255,${(0.45 * a).toFixed(3)})`; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }

  function arch(ctx, x, y, w, h, a, flip) {
    ctx.save(); ctx.fillStyle = `rgba(4,0,8,${a})`;
    ctx.beginPath();
    const s = flip ? -1 : 1;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + 20);
    ctx.quadraticCurveTo(x, y, x + s * w * 0.55, y);
    ctx.lineTo(x + s * w, y);
    ctx.lineTo(x + s * w, y + h);
    ctx.closePath(); ctx.fill();
    // inner highlight edge
    ctx.strokeStyle = `rgba(120,70,40,${(a * 0.45).toFixed(3)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + s * 3, y + h); ctx.lineTo(x + s * 3, y + 22); ctx.quadraticCurveTo(x + s * 3, y + 4, x + s * w * 0.55, y + 3); ctx.stroke();
    ctx.restore();
  }

  function paintLogo(ctx, pulse) {
    const ti = Engine.imgs && Engine.imgs.txt_title; if (!ti || !ti.width) return;
    const tx = Math.round(W / 2 - ti.width / 2 + 50), ty = 14;
    // gold glow behind the mark, punched on the beat
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ga = 0.18 + 0.55 * pulse;
    ctx.globalAlpha = ga;
    ctx.drawImage(ti, tx - 1, ty, ti.width, ti.height);
    ctx.drawImage(ti, tx + 1, ty, ti.width, ti.height);
    ctx.drawImage(ti, tx, ty - 1, ti.width, ti.height);
    ctx.globalAlpha = ga * 0.55;
    ctx.drawImage(ti, tx, ty + 1, ti.width, ti.height);
    ctx.restore();
    // bloodied underside: a red wash through the lower third of the glyph
    if (!T._blood || T._blood.src !== ti) {
      const c = document.createElement('canvas'); c.width = ti.width; c.height = ti.height;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(ti, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      const g = x.createLinearGradient(0, ti.height * 0.45, 0, ti.height);
      g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(0.45, 'rgba(140,8,12,0.18)'); g.addColorStop(1, 'rgba(80,0,0,0.55)');
      x.fillStyle = g; x.fillRect(0, 0, ti.width, ti.height);
      T._blood = c; T._blood.src = ti;
    }
    ctx.drawImage(T._blood, tx, ty);
    // forged-metal sheen: a traveling highlight band clipped to the title
    sheen = (sheen + 0.0045) % 1.4;
    if (!T._sheen || T._sheen.src !== ti) {
      const c = document.createElement('canvas'); c.width = ti.width; c.height = ti.height;
      T._sheen = c; T._sheen.src = ti; T._sx = c.getContext('2d'); T._sx.imageSmoothingEnabled = false;
    }
    const sx = T._sx; sx.clearRect(0, 0, ti.width, ti.height);
    sx.drawImage(ti, 0, 0);
    sx.globalCompositeOperation = 'source-atop';
    const bx = (sheen - 0.2) * ti.width;
    const sg = sx.createLinearGradient(bx, 0, bx + 48, 8);
    sg.addColorStop(0, 'rgba(255,240,200,0)'); sg.addColorStop(0.45, 'rgba(255,230,160,0.7)'); sg.addColorStop(0.55, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    sx.fillStyle = sg; sx.fillRect(0, 0, ti.width, ti.height);
    sx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.65; ctx.drawImage(T._sheen, tx, ty); ctx.restore();
  }

  function paintMenu(ctx, pulse) {
    const M = window.M12 && M12.TM; if (!M || M.hide || M.ctrl) return;
    const MENU = M12.MENU; if (!MENU) return;
    const cx = 290, y0 = M.y0, rh = M.rh, n = MENU.length;
    const x = cx - 74, y = y0 - 8, w = 148, h = n * rh + 14;
    // glass panel
    ctx.save();
    ctx.fillStyle = 'rgba(6,1,12,0.78)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = `rgba(200,150,50,${(0.45 + 0.25 * pulse).toFixed(3)})`; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = 'rgba(80,40,20,0.7)'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    // corner ticks
    ctx.fillStyle = '#f0c040';
    const tick = (px, py, dx, dy) => { ctx.fillRect(px, py, 8 * dx, 1); ctx.fillRect(px, py, 1, 8 * dy); };
    tick(x + 2, y + 2, 1, 1); tick(x + w - 3, y + 2, -1, 1); tick(x + 2, y + h - 3, 1, -1); tick(x + w - 3, y + h - 3, -1, -1);
    ctx.restore();
    MENU.forEach((m, i) => {
      const yy = y0 + i * rh, on = i === M.sel;
      if (on) {
        const a = 0.38 + 0.22 * pulse;
        ctx.fillStyle = `rgba(160,80,255,${a.toFixed(3)})`; ctx.fillRect(cx - 68, yy - 2, 136, 11);
        ctx.fillStyle = `rgba(240,192,64,${(0.7 + 0.3 * pulse).toFixed(3)})`; ctx.fillRect(cx - 68, yy - 2, 2, 11); ctx.fillRect(cx + 66, yy - 2, 2, 11);
      }
      const lab = m.id === 'play' && M12.mode ? 'NEW RUN - ' + M12.mode().l : m.l;
      text(ctx, (on ? '> ' : '') + lab + (on ? ' <' : ''), cx, yy, on ? '#ffe080' : '#d8c8f0', 'center');
    });
    const footY = y0 + n * rh + 6;
    if (M.sel === 0 && M12.mode && !(M.msgT > 0)) text(ctx, '< > ' + M12.mode().d, cx, footY, '#c0a0ff', 'center');
    else if (M.msgT > 0) text(ctx, M.msg, cx, footY, '#ff9a80', 'center');
    else text(ctx, G.inputMode === 'pad' ? (window.M15PAD && M15PAD.xb() ? 'D-PAD choose   A select' : 'D-PAD choose   CROSS select') : 'UP/DOWN choose   ENTER select', cx, footY, '#8070a8', 'center');
  }

  drawTitle = function (ctx) {
    const r = _dt.apply(this, arguments);
    try {
      if (window.OPT && OPT.open) return r;
      const now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      const t = (typeof G !== 'undefined' ? G.t : now / 1000);
      const pulse = beatAmt(t);
      ctx.imageSmoothingEnabled = false;

      // cinematic letterbox — skip the top-right so the pad hint stays readable
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W - 200, 4); ctx.fillRect(0, H - 5, W, 5);

      // thin parallax cathedral edges (kept off Baron Kael, who stands in x~8-150)
      const p1 = Math.sin(t * 0.15) * 3, p2 = Math.sin(t * 0.22 + 1) * 5;
      arch(ctx, -10 + p1, 0, 28, H, 0.4, false);
      arch(ctx, W + 8 + p2, 0, 42, H, 0.5, true);
      // a high crossing vault shadow
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.quadraticCurveTo(W / 2, 36 + Math.sin(t * 0.2) * 3, W - 40, 0); ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.restore();

      // drifting fog
      for (const f of fog) {
        f.x += f.sp * dt; if (f.x - f.w > W) f.x = -f.w;
        const g = ctx.createRadialGradient(f.x, f.y + Math.sin(t + f.ph) * 6, 4, f.x, f.y, f.w * 0.5);
        g.addColorStop(0, `rgba(210,190,230,${(f.a * (1.2 + 0.4 * pulse)).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(f.x - f.w / 2, f.y - f.w / 2, f.w, f.w);
      }

      // embers / ash
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        e.y -= e.v * dt; e.x += e.drift * dt + Math.sin(t * 2 + e.y * 0.05) * 4 * dt;
        if (e.y < -4) { e.y = H + 4; e.x = Math.random() * W; }
        if (e.x < -4) e.x = W + 2; if (e.x > W + 4) e.x = -2;
        const col = e.hue < 0.15 ? '255,230,160' : e.hue < 0.7 ? '255,140,50' : '180,40,20';
        ctx.fillStyle = `rgba(${col},${e.a.toFixed(3)})`;
        ctx.fillRect(Math.round(e.x), Math.round(e.y), e.s, e.s);
      }
      ctx.restore();

      // lightning
      nextBolt -= dt;
      if (nextBolt <= 0) { bolt = 1; boltX = 260 + Math.random() * 160; boltPath = mkBolt(boltX, 0, boltX + (Math.random() - 0.5) * 80, 70 + Math.random() * 50); nextBolt = 7 + Math.random() * 11; }
      if (bolt > 0) {
        const k = bolt > 0.82 ? 1 : bolt > 0.7 ? 0.15 : bolt > 0.5 ? 0.85 : bolt * 0.7;
        ctx.fillStyle = `rgba(210,200,255,${(0.16 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
        if (boltPath.length) drawBolt(ctx, boltPath, k);
        bolt -= dt * 2.4;
      }

      // logo treatment on top of the already-drawn title mark
      paintLogo(ctx, pulse);

      // vignette, heavier at the sides
      const vg = ctx.createRadialGradient(W * 0.52, H * 0.48, 70, W * 0.52, H * 0.48, 300);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0.12)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // restyle the menu in-place (same coordinates as m12a)
      paintMenu(ctx, pulse);
    } catch (e) { T.err = String(e && e.stack || e); }
    return r;
  };
})();
