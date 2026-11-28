// ===== m21h: perfect-parry flourish (white ring overlay, metal ring layer, riposte cue).
// Does not change the parry window, damage, slow, or hitstop.
// Kill: ?m21h=0 / ?m21=0 | ?flourish=0 | ?pring=0 | ?pringfx=0 | ?priposte=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21h') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21H = {
    on: !off, flourish: on('flourish'), pring: on('pring'), pringfx: on('pringfx'), priposte: on('priposte'),
    n: { parry: 0, ring: 0, sfx: 0, cue: 0 }, err: [], ready: 0, fx: null
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, flourish: M.flourish, pring: M.pring, pringfx: M.pringfx, priposte: M.priposte,
    n: Object.assign({}, M.n), err: M.err.slice(), fx: !!(M.fx)
  });
  if (off) { M.ready = 1; return; }

  function startFlourish() {
    if (!M.flourish) return;
    M.n.parry++;
    M.fx = { t: 0, dur: 0.38 };
    if (M.pringfx) {
      try {
        if (typeof SFX !== 'undefined' && SFX && SFX.play) {
          SFX.play('glint', 0.75);
          M.n.sfx++;
        }
      } catch (e) { fail('sfx', e); }
    }
  }
  M.burst = startFlourish;

  function hookHurt() {
    if (typeof hurtPlayer !== 'function' || hurtPlayer._m21h) return;
    const _hp = hurtPlayer;
    hurtPlayer = function () {
      const r = _hp.apply(this, arguments);
      try { if (r === 'parry') startFlourish(); } catch (e) { fail('hurt', e); }
      return r;
    };
    hurtPlayer._m21h = 1;
  }

  function drawRing(ctx) {
    const F = M.fx; if (!F || !M.pring) return;
    const W = 480, H = 270;
    const k = Math.max(0, Math.min(1, F.t / F.dur));
    const cx = W / 2, cy = H / 2 + 8;
    const r = 16 + k * 110;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.lineWidth = Math.max(1, 3.2 - k * 2.2);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = (1 - k) * 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.stroke();
    // brief white flash in the core
    if (k < 0.22) {
      ctx.globalAlpha = (1 - k / 0.22) * 0.18;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, cy, 28 + k * 20, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    M.n.ring++;
  }

  function drawCue(ctx) {
    const F = M.fx; if (!F || !M.priposte) return;
    const k = Math.max(0, Math.min(1, F.t / F.dur));
    if (k > 0.85) return;
    const a = k < 0.12 ? k / 0.12 : (1 - (k - 0.12) / 0.73);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    try {
      // sit just above the HP cluster so we don't fight the stage title or toasts
      ctx.fillStyle = 'rgba(8,0,10,0.62)';
      ctx.fillRect(240 - 72, 206, 144, 22);
      text(ctx, 'RIPOSTE', 240, 210, '#fff6c0', 'center', 2);
    } catch (e) { fail('cue', e); }
    ctx.restore();
    M.n.cue++;
  }

  function hookDraw() {
    if (typeof drawHUD === 'function' && !drawHUD._m21h) {
      const _dh = drawHUD;
      drawHUD = function (ctx) {
        const r = _dh.apply(this, arguments);
        try {
          if (M.fx && ctx) { drawRing(ctx); drawCue(ctx); }
        } catch (e) { fail('draw', e); }
        return r;
      };
      drawHUD._m21h = 1;
    }
    if (typeof frameInner === 'function' && !frameInner._m21h) {
      const _fi = frameInner;
      frameInner = function (now) {
        const r = _fi.apply(this, arguments);
        try {
          if (M.fx) {
            const dt = Math.min(0.05, (typeof rdt === 'number' ? rdt : 1 / 60));
            // use real time so the ring still grows during hitstop
            M.fx.t += 1 / 60;
            if (M.fx.t >= M.fx.dur) M.fx = null;
          }
        } catch (e) { fail('tick', e); }
        return r;
      };
      frameInner._m21h = 1;
    }
  }

  try { hookHurt(); } catch (e) { fail('hh', e); }
  try { hookDraw(); } catch (e) { fail('hd', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookHurt(); hookDraw(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
