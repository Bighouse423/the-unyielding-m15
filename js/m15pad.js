// m15b: controller support for every menu / screen.  ?pad=0 -> this file does nothing (identical to m15).
// Why the menus ignored the pad in m15: pad.js turns button presses into KP flags inside the core frame, and the core
// frame clears KP at its end. The title menu, training prompt, save slots and run history are handled by wrappers that
// read KP *before* the core frame runs, so they never saw a pad press (and A fell through to "start a run").
// Fix: while any menu / overlay is up, the pad is read at the very start of the frame (once - the core read is skipped
// that frame), so every menu layer sees the same flags a key press would give. During live gameplay the pad is read
// exactly where it always was, so gameplay input is untouched.
(function () {
  if (/[?&]pad=0/.test(location.search) || typeof pollPad !== 'function' || typeof PAD === 'undefined') return;
  const X = window.M15PAD = { on: true, err: null, early: 0, lastSel: -1 };
  const real = pollPad;
  let skip = false, lt = 0, prev8 = false, prev4 = false, prev5 = false;
  const optOpen = () => !!(window.OPT && OPT.open);
  const menuCtx = () => G.state !== 'play' || G.paused || optOpen();
  // modal overlays drawn on top of live play (story scenes, the codex) count as menus for the pad too
  function poll(rdt) {
    if (G.state === 'play' && !G.paused && optOpen()) {
      const was = G.paused, c0 = PAD.connected; G.paused = true;
      try { real(rdt); } finally { if (!(c0 && !PAD.connected)) G.paused = was; }
    } else real(rdt);
  }
  pollPad = function (rdt) { if (skip) { skip = false; return; } poll(rdt); };
  function raw() { try { const l = navigator.getGamepads ? navigator.getGamepads() : []; const g = PAD.idx >= 0 ? l[PAD.idx] : null; return g && g.connected ? g : null; } catch (e) { return null; } }
  const bdown = (g, i) => { const b = g && g.buttons && g.buttons[i]; return !!b && (typeof b === 'object' ? (b.pressed || b.value > 0.5) : b > 0.5); };
  // extra menu buttons: SELECT / BACK = the TAB key (more / next tab); R1 = next tab, L1 = previous tab
  function extras() {
    const g = raw(); const s8 = bdown(g, 8), s4 = bdown(g, 4), s5 = bdown(g, 5);
    if (PAD.connected && g) {
      if (s8 && !prev8) { KP.PadSelect = true; KP.Tab = true; if (G.state === 'results') KP.PadY = true; G.inputMode = 'pad'; }
      if (s5 && !prev5) { KP.Tab = true; G.inputMode = 'pad'; }
      if (s4 && !prev4 && (G.state === 'altar' || (optOpen() && window.M9 && M9.ui && M9.ui.kind === 'codex'))) { KP.ArrowLeft = true; G.inputMode = 'pad'; }
    }
    prev8 = s8; prev4 = s4; prev5 = s5;
    // keyboard rebinding with a pad: A starts the capture as before, the hint says what to do
    if (optOpen() && OPT.page === 'keys' && OPT.cap && G.inputMode === 'pad' && !(OPT.msgT > 0.2)) { OPT.msg = 'PRESS A KEYBOARD KEY   ' + (isPS() ? 'CIRCLE' : 'B') + ' CANCELS'; OPT.msgT = 0.5; }
  }
  const _fi = frameInner;
  frameInner = function (now) {
    const rdt = Math.min(0.05, lt ? Math.max(0, now - lt) / 1000 : 0.016) * (window.GAME_TS || 1); lt = now;
    try { if (menuCtx()) { poll(rdt); skip = true; X.early++; extras(); } else { prev8 = bdown(raw(), 8); prev4 = bdown(raw(), 4); prev5 = bdown(raw(), 5); } }
    catch (e) { X.err = String(e && e.stack || e); skip = false; }
    try { return _fi.apply(this, arguments); } finally { skip = false; }
  };

  // ---------- glyphs: PlayStation shapes for a DualSense / DualShock, A B X Y letters for every other pad ----------
  const XB = { cross: ['A', '#58c858'], circle: ['B', '#ff5a5a'], square: ['X', '#5aa0ff'], triangle: ['Y', '#ffd040'] };
  const isPS = () => /dualsense|dualshock|054c|ps5|ps4|playstation/i.test(PAD.id || '');
  const isXbox = () => PAD.connected && !isPS();
  const _pg = psGlyph;
  psGlyph = function (ctx, name, x, y) {
    if (isXbox() && XB[name]) {
      x = Math.round(x); y = Math.round(y); const [l, c] = XB[name];
      ctx.fillStyle = '#140820'; ctx.beginPath(); ctx.arc(x + 4.5, y + 4.5, 5.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + 4.5, y + 4.5, 5, 0, TAU); ctx.stroke();
      text(ctx, l, x + 1, y + 1, c, 'left', 1, null); return 11;
    }
    if (isXbox() && (name === 'OPTIONS' || name === 'CREATE')) return _pg.call(this, ctx, name === 'OPTIONS' ? 'START' : 'BACK', x, y);
    return _pg.apply(this, arguments);
  };
  const _pr = promptRow;   // keep widths right when a word glyph is renamed (OPTIONS -> START)
  promptRow = function (ctx, parts, x, y, col, align) {
    if (isXbox()) parts = parts.map(p => p === '{OPTIONS}' ? '{START}' : p === '{CREATE}' ? '{BACK}' : p);
    return _pr.call(this, ctx, parts, x, y, col, align);
  };
  // plain-text prompts that name PlayStation buttons read as Xbox buttons on other pads (display only)
  const WORDS = [[/\bCROSS\b/g, 'A'], [/\bCIRCLE\b/g, 'B'], [/\bTRIANGLE\b/g, 'Y'], [/\bSQUARE\b/g, 'X'], [/\bOPTIONS\b/g, 'START'], [/\bCREATE\b/g, 'BACK']];
  if (typeof text === 'function') {
    const _tx = text;
    text = function (ctx, s) {
      if (typeof s === 'string' && G.inputMode === 'pad' && isXbox() && /CROSS|CIRCLE|TRIANGLE|SQUARE|OPTIONS|CREATE/.test(s)) { let t = s; for (const [r, v] of WORDS) t = t.replace(r, v); arguments[1] = t; }
      return _tx.apply(this, arguments);
    };
  }
  // button names for the pause menu's CONTROLS panel
  const PS = { sword: 'R2', off: 'L2', roll: '{circle}', jump: '{cross}', shield: 'DPAD', side: '{square}', swap: '{triangle}' };
  const XN = PS;   // same buttons; psGlyph draws them as A / B / X / Y on non-PlayStation pads
  X.xb = () => G.inputMode === 'pad' && isXbox();
  X.btnName = id => (isPS() ? PS : XN)[id] || '?';

  // ---------- "press a button" (browsers only expose a controller after one of its buttons is pressed) ----------
  let hintT = 0;
  const _dt = drawTitle;
  drawTitle = function (ctx) {
    const r = _dt.apply(this, arguments);
    try {
      hintT += 1 / 60;
      if (!PAD.connected && navigator.getGamepads && hintT > 1.5 && !optOpen()) {
        const a = 0.45 + 0.25 * Math.sin(G.t * 2.4);
        ctx.save(); ctx.globalAlpha = a; text(ctx, 'CONTROLLER? PRESS ANY BUTTON', W - 6, 4, '#c8b8e0', 'right'); ctx.restore();
      }
    } catch (e) { X.err = String(e); }
    return r;
  };
})();
