// ===== m21o: stage-1 onboarding clarity. Contextual prompts reuse existing sign / TIPS text.
// Kill: ?m21o=0 / ?m21=0 | ?onboard=0 | ?s1tip=0 | ?s1sign=0
// Does not invent a new tutorial voice, and does not change difficulty, bosses, vials, or prices.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21o') === '0' || Q.get('m21') === '0' || Q.get('onboard') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21O = {
    on: !off, onboard: !off, s1tip: on('s1tip'), s1sign: on('s1sign'),
    n: { tip: 0, sign: 0, hold: 0, rel: 0 }, err: [], ready: 0, pay: {}, arm: 0, fired: {}
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, onboard: M.onboard, s1tip: M.s1tip, s1sign: M.s1sign,
    n: Object.assign({}, M.n), err: M.err.slice(),
    cur: (window.TIPS && TIPS.cur && TIPS.cur.id) || null, arm: +M.arm.toFixed(2)
  });
  if (off) { M.ready = 1; return; }

  function isS1() {
    return !!(RUN && RUN.on && !RUN.hub && RUN.stage === 1 && LEVEL && LEVEL.kind === 'castle');
  }
  function signBy(re) {
    return (LEVEL && LEVEL.signs || []).find(s => re.test(s.text || '') || re.test(s.text2 || ''));
  }
  function copyOf(s) {
    const pad = G && G.inputMode === 'pad' && s.padText;
    return { t: pad ? s.padText : s.text, body: pad ? (s.padText2 || s.text2 || '') : (s.text2 || '') };
  }
  function screenBusy() {
    if (!G || G.state !== 'play' || G.paused || (window.OPT && OPT.open)) return true;
    if (G.fade && G.fade > 0.2) return true;
    if (G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.05) return true;
    return false;
  }
  function graceUp() {
    const g = window.M18 && M18.graceState;
    return !!(g && g.until > 0 && (G.t || 0) < g.until);
  }
  function tipsOn() { return !!(window.TIPS && window.OPT && OPT.S && OPT.S.tips); }

  // Hold a sign so the opening STAGE card / story toast is not buried by the same line.
  function hold(s) {
    if (!s || s.shown || s._m21oHold) return;
    s._m21oHold = 1; s.shown = true; M.n.hold++;
  }
  function releaseHeld() {
    if (!LEVEL || !LEVEL.signs) return;
    for (const s of LEVEL.signs) {
      if (!s._m21oHold) continue;
      s._m21oHold = 0;
      // If a tip already used this copy this visit, leave shown so we do not toast on top.
      if (s._m21oTipped) { M.n.rel++; continue; }
      s.shown = false;
      M.n.rel++;
    }
  }

  function maybeFire(id, s) {
    if (!M.s1tip || !s || !tipsOn()) return false;
    if (M.fired[id] || s._m21oTipped) return false;
    if (TIPS.seen[id] || TIPS.q.includes(id) || (TIPS.cur && TIPS.cur.id === id)) return false;
    M.pay[id] = copyOf(s);
    // Bypass m18gr's blocked() hold (aware-near / grace). We already waited out
    // the stage card and spawn grace; these are the existing nave-sign lines.
    if (TIPS.q.indexOf(id) < 0) TIPS.q.push(id);
    M.fired[id] = 1;
    s._m21oTipped = 1;
    s.shown = true; s._m21oHold = 0;
    M.n.tip++;
    return true;
  }

  function bumpAndHold() {
    if (!M.s1sign || !isS1()) return;
    const sword = signBy(/LMB SWORD|R2 SWORD/);
    const roll = signBy(/ROLL/);
    const blood = signBy(/sea of blood/);
    // Spawn is (17.5, 37.2); the sword sign sits at (17.5, 35.5) r=1.6, 0.1 short of the spawn tile.
    if (sword && sword.r < 2.6) { sword.r = 2.6; M.n.sign++; }
    if (roll && roll.r < 2.2) { roll.r = 2.2; M.n.sign++; }
    if (blood && blood.r < 2.0) { blood.r = 2.0; M.n.sign++; }
    // Hold aisle signs until the stage card + story toast have cleared.
    if (sword && !sword._m21oTipped) hold(sword);
    if (roll && !roll._m21oTipped) hold(roll);
  }

  function tick(dt) {
    try {
      if (!isS1()) { M.arm = 0; M.fired = {}; return; }
      bumpAndHold();
      if (G && G.state === 'play' && !G.paused && !(window.OPT && OPT.open)) {
        const step = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : 0.016;
        M.arm += step;
      }
      if (screenBusy() || graceUp() || M.arm < 4.3) return;
      releaseHeld();
      const sword = signBy(/LMB SWORD|R2 SWORD/);
      const roll = signBy(/ROLL/);
      const blood = signBy(/sea of blood/);
      const crack = signBy(/cracked wall/);
      const censer = signBy(/censer hangs/);
      const saint = signBy(/saint's halo/);
      const nearStart = P && Math.hypot(P.x - 17.5, P.y - 37.2) < 5.0;
      const walked = P && Math.hypot(P.x - 17.5, P.y - 37.2) > 2.2;
      if (nearStart && sword) maybeFire('s1combat', sword);
      const combatUp = !!(window.TIPS && TIPS.cur && TIPS.cur.id === 's1combat');
      const combatDone = !!(window.TIPS && TIPS.seen.s1combat && !combatUp);
      if ((walked || combatDone) && !combatUp && roll) maybeFire('s1move', roll);
      const near = (s, r) => s && P && Math.hypot(P.x - s.x, P.y - s.y) < r;
      if (near(blood, 3.2)) maybeFire('s1blood', blood);
      if (near(crack, 3.4)) maybeFire('s1crack', crack);
      if (near(censer, 3.2)) maybeFire('s1censer', censer);
      if (near(saint, 3.2)) maybeFire('s1saint', saint);
      promote();
    } catch (e) { fail('tick', e); }
  }

  function hookDraw() {
    if (!window.TIPS || !TIPS.draw || TIPS.draw._m21o) return;
    if (TIPS.drawable && !TIPS.drawable._m21o) {
      const _dr = TIPS.drawable.bind(TIPS);
      TIPS.drawable = function () {
        if (TIPS.cur && M.pay[TIPS.cur.id] && !screenBusy() && !graceUp()) return true;
        return _dr();
      };
      TIPS.drawable._m21o = 1;
    }
    const _d = TIPS.draw;
    TIPS.draw = function (ctx) {
      const c = TIPS.cur, d = c && M.pay[c.id];
      if (d && typeof text === 'function') {
        const a = Math.min(1, TIPS.t * 5) * (c.out ? 1 - c.out : 1);
        if (a <= 0) return;
        const bw = 300, bh = 46, x = Math.round(240 - bw / 2), y = Math.round(270 - 94 + (1 - Math.min(1, TIPS.t * 5)) * 8);
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(14,2,24,0.86)'; ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = '#c060ff'; ctx.fillRect(x, y, bw, 1); ctx.fillRect(x, y + bh - 1, bw, 1);
        ctx.fillStyle = '#f0c040'; ctx.fillRect(x, y, 2, bh);
        text(ctx, 'TIP', x + 7, y + 4, '#ffe080');
        if (G && G.inputMode === 'pad' && typeof promptRow === 'function') promptRow(ctx, ['{CREATE}', ' ok'], x + bw - 5, y + 3, '#a898c0', 'right');
        else text(ctx, 'X ok', x + bw - 5, y + 4, '#a898c0', 'right');
        // Keep the sign's two lines as two lines so TAB SWAP doesn't wrap into the parry sentence.
        if (typeof fitBlock === 'function') {
          fitBlock(ctx, d.t, x + 7, y + 15, bw - 12, 12, '#ece0f4', 'left');
          if (d.body) fitBlock(ctx, d.body, x + 7, y + 27, bw - 12, 12, '#ece0f4', 'left');
        } else {
          text(ctx, d.t, x + 7, y + 16, '#ece0f4');
          if (d.body) text(ctx, d.body, x + 7, y + 27, '#ece0f4');
        }
        ctx.fillStyle = 'rgba(192,96,255,0.5)'; ctx.fillRect(x + 2, y + bh - 2, Math.round((bw - 4) * Math.max(0, 1 - TIPS.t / 10)), 1);
        ctx.restore();
        return;
      }
      return _d.apply(this, arguments);
    };
    TIPS.draw._m21o = 1;
  }

  function nearBoss() {
    const b = G && G.boss;
    return !!(b && b.alive && b.awake && P && Math.hypot(P.x - b.x, P.y - b.y) < 10);
  }
  function promote() {
    if (!M.s1tip || !tipsOn() || screenBusy() || graceUp()) return;
    // Reclaim onboarding tips that m18gr / m20fix stashed in TIPS._held while a
    // nearby foe was "busy". The sword/roll lines are meant for that moment.
    if (TIPS._held && TIPS._held.length) {
      const keep = [], ours = [];
      for (const id of TIPS._held) (M.pay[id] ? ours : keep).push(id);
      TIPS._held = keep;
      for (const id of ours) if (TIPS.q.indexOf(id) < 0) TIPS.q.unshift(id);
    }
    if (TIPS.cur && M.pay[TIPS.cur.id]) return;
    if (TIPS.cur && !M.pay[TIPS.cur.id]) return;
    const i = (TIPS.q || []).findIndex(id => M.pay[id]);
    if (i < 0) return;
    const id = TIPS.q.splice(i, 1)[0];
    TIPS.cur = { id }; TIPS.t = 0; TIPS.seen[id] = 1;
  }
  function hookDrawers() {
    if (!window.M8DRAW || hookDrawers.on) return;
    M8DRAW.push(function () { try { promote(); } catch (e) { fail('promo', e); } return false; });
    hookDrawers.on = 1;
  }

  function hookUpdate() {
    if (typeof update !== 'function' || update._m21o) return;
    const _u = update;
    update = function (dt) {
      try { hookDraw(); hookDrawers(); bumpAndHold(); } catch (e) { fail('pre', e); }
      const r = _u.apply(this, arguments);
      try { tick(dt); } catch (e) { fail('up', e); }
      return r;
    };
    update._m21o = 1;
  }

  try { hookUpdate(); hookDraw(); hookDrawers(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookUpdate(); hookDraw(); hookDrawers(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
