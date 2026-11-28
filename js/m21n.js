// ===== m21n: boss last-hit kill cam. Visuals + existing death timescale only.
// Kill: ?m21n=0 / ?m21=0 | ?killcam=0 | ?kclook=0 | ?kcbox=0
// Hooks killEnemy after the fact. Does not change boss HP, damage, attack timings, G.slow, or the 2.4s burst.
// During the existing boss-death crumple, letterbox + a title card, and the view looks at the boss for the duration
// of the frame only (P.ang / P.pitch are restored, so aim is not stolen).
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21n') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21N = {
    on: !off, killcam: on('killcam'), kclook: on('kclook'), kcbox: on('kcbox'),
    n: { cam: 0, look: 0, box: 0 }, err: [], ready: 0, cam: null
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, killcam: M.killcam, kclook: M.kclook, kcbox: M.kcbox,
    n: Object.assign({}, M.n), err: M.err.slice(),
    cam: M.cam ? { title: M.cam.title, t: +M.cam.t.toFixed(2), dur: M.cam.dur } : null
  });
  if (off) { M.ready = 1; return; }

  function titleOf(e) {
    try {
      if (e && e.d && e.d.title) return String(e.d.title).toUpperCase();
      if (e && e.d && e.d.name) return String(e.d.name).toUpperCase();
      if (e && e.type) return String(e.type).toUpperCase();
    } catch (e2) { }
    return 'THE BOSS';
  }

  M.start = function (e) {
    if (!M.killcam || !e) return;
    M.cam = { e: e, t: 0, dur: 2.45, title: titleOf(e) };
    M.n.cam++;
  };
  M.clear = function () { M.cam = null; };

  function hookKill() {
    if (typeof killEnemy !== 'function' || killEnemy._m21n) return;
    const _ke = killEnemy;
    killEnemy = function (e, o) {
      const r = _ke.apply(this, arguments);
      try { if (M.killcam && e && e.d && e.d.boss) M.start(e); } catch (err) { fail('ke', err); }
      return r;
    };
    killEnemy._m21n = 1;
  }

  function hookUpdate() {
    if (typeof update !== 'function' || update._m21n) return;
    const _u = update;
    update = function (dt) {
      const r = _u.apply(this, arguments);
      try {
        if (M.cam) {
          const step = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : 0.016;
          // tick on real time (not the 0.3 slow clock) so the card lasts the crumple window
          M.cam.t += step;
          if (M.cam.t >= M.cam.dur) M.cam = null;
        }
      } catch (e) { fail('up', e); }
      return r;
    };
    update._m21n = 1;
  }

  function hookRender() {
    if (typeof render !== 'function' || render._m21n) return;
    const _r = render;
    render = function (rdt) {
      let saved = null;
      try {
        if (M.cam && M.kclook && typeof P !== 'undefined' && M.cam.e) {
          const e = M.cam.e;
          saved = { ang: P.ang, pitch: P.pitch };
          P.ang = Math.atan2(e.y - P.y, e.x - P.x);
          P.pitch = 0.06;
          M.n.look++;
        }
      } catch (e) { fail('look', e); }
      const r = _r.apply(this, arguments);
      if (saved) { try { P.ang = saved.ang; P.pitch = saved.pitch; } catch (e2) { } }
      try {
        if (M.cam && M.kcbox && G && G.state === 'play') {
          const s = document.getElementById('screen');
          const sx = s && s.getContext && s.getContext('2d');
          const sc = (typeof SCALE === 'number' && SCALE) || 1;
          if (sx && typeof text === 'function') {
            sx.save();
            sx.setTransform(sc, 0, 0, sc, 0, 0);
            // Floor the fade so frame 0 (and the look harness) actually shows the card.
            // Ease in over 0.12s from 0.88, ease out over the last 0.25s.
            const fadeIn = 0.88 + 0.12 * Math.min(1, M.cam.t / 0.12);
            const fadeOut = Math.min(1, (M.cam.dur - M.cam.t) / 0.25);
            const fade = Math.max(0, Math.min(fadeIn, fadeOut));
            sx.globalAlpha = 0.94 * fade;
            sx.fillStyle = '#000';
            sx.fillRect(0, 0, 480, 26);
            sx.fillRect(0, 228, 480, 42);
            sx.globalAlpha = fade;
            text(sx, M.cam.title, 240, 10, '#ffe080', 'center');
            text(sx, 'IS SLAIN', 240, 246, '#f0e0d0', 'center');
            sx.restore();
            M.n.box++;
          }
        }
      } catch (e) { fail('box', e); }
      return r;
    };
    render._m21n = 1;
  }

  try { hookKill(); hookUpdate(); hookRender(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookKill(); hookUpdate(); hookRender(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
