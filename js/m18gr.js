// ===== m18gr: first-60s spawn grace. Enemies near spawn stay asleep, short spawn invuln, no tip/toast over an aware fight.
// ?grace=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.grace) return;
  const G18 = M18.graceState = { on: true, until: 0, invuln: 0, stage: -1 };
  const RADIUS = 8;
  const GRACE = 3.2;
  const INV = 2.2;

  function inGrace() { return G18.until > 0 && (G.t || 0) < G18.until; }
  function nearSpawn(e) {
    if (!e || !e.alive || (e.d && e.d.boss) || e.summoned) return false;
    return Math.hypot(e.x - P.x, e.y - P.y) < RADIUS;
  }
  function awareNear() {
    if (typeof G === 'undefined' || !G.enemies || typeof P === 'undefined') return false;
    for (const e of G.enemies) if (e.alive && e.awake && !e.hidden && !(e.d && e.d.boss) && Math.hypot(e.x - P.x, e.y - P.y) < 10) return true;
    return false;
  }

  function arm(kind) {
    if (!RUN || !RUN.on || RUN.hub) return;
    G18.stage = RUN.stage; G18.kind = kind;
    G18.until = (G.t || 0) + (kind === 's1' ? GRACE + 1.0 : GRACE);
    G18.invuln = (G.t || 0) + (kind === 's1' ? INV + 0.6 : INV * 0.6);
    if (typeof P !== 'undefined') P.iframes = Math.max(P.iframes || 0, kind === 's1' ? INV : INV * 0.5);
    if (G.enemies) for (const e of G.enemies) {
      if (!e.alive || (e.d && e.d.boss) || e.summoned) continue;
      if (Math.hypot(e.x - P.x, e.y - P.y) < RADIUS) {
        e.awake = false;
        e.m18grace = 1;
        const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (d < RADIUS) { const k = (RADIUS + 0.6 - d) / d; e.x += dx * k * 0.55; e.y += dy * k * 0.55; }
      }
    }
  }

  function hookStart(fn) {
    if (typeof fn !== 'function') return fn;
    return function () {
      const r = fn.apply(this, arguments);
      try {
        if (RUN && RUN.on && !RUN.hub) arm(RUN.stage === 1 ? 's1' : 'stage');
      } catch (e) { M18.err = M18.err || ('grace ' + e); }
      return r;
    };
  }
  if (typeof nextStage === 'function') { const _ns = nextStage; nextStage = hookStart(_ns); }
  if (typeof leaveHubForRun === 'function') { const _lh = leaveHubForRun; leaveHubForRun = hookStart(_lh); }
  // some builds start the descent via startRun / beginStage
  ['startStage', 'beginStage', 'enterStage'].forEach(n => { if (typeof window[n] === 'function') window[n] = hookStart(window[n]); });

  if (typeof newGame === 'function') {
    const _ng = newGame;
    newGame = function () {
      const r = _ng.apply(this, arguments);
      try { if (RUN && RUN.on && !RUN.hub) arm(RUN.stage === 1 ? 's1' : 'stage'); } catch (e) { M18.err = M18.err || ('graceNG ' + e); }
      return r;
    };
  }


  const _ue = updateEnemy;
  updateEnemy = function (e, dt) {
    const r = _ue.apply(this, arguments);
    try {
      if (e && e.alive && !(e.d && e.d.boss) && !e.summoned) {
        if (inGrace() && (e.m18grace || nearSpawn(e))) { e.awake = false; e.state = 'idle'; e.cd = Math.max(e.cd || 0, 0.4); }
      }
      if (inGrace() && typeof P !== 'undefined' && (G.t || 0) < G18.invuln) P.iframes = Math.max(P.iframes || 0, 0.2);
    } catch (err) { M18.err = M18.err || ('graceUE ' + err); }
    return r;
  };

  // hold tips while an aware foe is close, or while the stage card is up, or during grace
  function blocked() {
    if (G.state !== 'play' || (window.OPT && OPT.open) || G.paused) return true;
    if (inGrace()) return true;
    if (G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.2) return true;
    if (awareNear()) return true;
    return false;
  }
  function wrapTips() {
    const T = window.TIPS; if (!T) return;
    const _fire = T.fire.bind(T);
    T.fire = function (id) { if (blocked() && id !== 'altar') { T._held = T._held || []; if (T._held.indexOf(id) < 0) T._held.push(id); return; } return _fire(id); };
    const _draw = T.drawable && T.drawable.bind(T);
    T.drawable = function () { if (blocked()) return false; return _draw ? _draw() : !!(T.cur); };
    // flush held tips once the room is quiet
    const _scanFlush = () => {
      if (!T._held || !T._held.length || blocked()) return;
      const q = T._held; T._held = []; q.forEach(id => _fire(id));
    };
    G18.flush = _scanFlush;
  }
  wrapTips();
  const _fi = typeof frameInner === 'function' ? frameInner : null;
  if (_fi) frameInner = function () { try { if (G18.flush) G18.flush(); } catch (e) {} return _fi.apply(this, arguments); };

  M18.graceState.arm = arm;
  M18.graceState.blocked = blocked;
})();
