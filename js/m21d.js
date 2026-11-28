// ===== m21d: pad + key prompt swap, pad button rebinding, Deck 800p layout.
// Keys already rebound in m8; this adds a PAD BINDINGS page, live glyphs that
// follow those binds, and an integer-scale option checked at 1280x800.
// Kill: ?m21d=0 / ?m21=0 (all) | ?padbind=0 | ?prompts=0 | ?intscale=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21d') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21D = {
    on: !off, padbind: on('padbind'), prompts: on('prompts'), intscale: on('intscale'),
    n: { bind: 0, prompt: 0, scale: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, padbind: M.padbind, prompts: M.prompts, intscale: M.intscale,
    binds: (typeof PADCFG !== 'undefined' && PADCFG.binds) ? Object.assign({}, PADCFG.binds) : {},
    pix: !!(window.OPT && OPT.S && OPT.S.m21pix),
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  const PACTS = [
    ['jump', 'JUMP', 0],
    ['roll', 'ROLL', 1],
    ['side', 'HOLY SIDEARM', 2],
    ['swap', 'SWAP WHIP / SHIELD', 3],
    ['off', 'OFF-HAND', 6],
    ['sword', 'SWORD', 7],
    ['run', 'SPRINT', 10],
    ['pause', 'PAUSE', 9],
    ['tip', 'DISMISS TIP', 8],
  ];
  const GLYPH = { 0: 'cross', 1: 'circle', 2: 'square', 3: 'triangle', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'CREATE', 9: 'OPTIONS', 10: 'L3', 11: 'R3' };
  function binds() {
    if (typeof PADCFG === 'undefined') return {};
    if (!PADCFG.binds || typeof PADCFG.binds !== 'object') PADCFG.binds = {};
    return PADCFG.binds;
  }
  function bound(act, def) {
    if (typeof padBind === 'function') return padBind(act, def);
    const v = binds()[act]; return (v == null) ? def : v;
  }
  function nm(i) { return (typeof padName === 'function' ? padName(i) : (GLYPH[i] || ('B' + i))); }
  M.pacts = PACTS;
  M.glyph = act => {
    const def = (PACTS.find(a => a[0] === act) || [])[2];
    const i = bound(act, def == null ? 0 : def);
    const g = GLYPH[i];
    return g ? '{' + g + '}' : nm(i);
  };

  function assignPad(act, btn) {
    const B = binds();
    const a = PACTS.find(x => x[0] === act); if (!a) return;
    // swap if taken
    for (const [id] of PACTS) if (id !== act && bound(id, (PACTS.find(x => x[0] === id) || [])[2]) === btn) {
      const cur = bound(act, a[2]);
      if (cur === (PACTS.find(x => x[0] === id)[2])) delete B[id]; else B[id] = cur;
    }
    if (btn === a[2]) delete B[act]; else B[act] = btn;
    if (typeof savePadCfg === 'function') savePadCfg();
    M.n.bind++;
  }

  // ---------- settings: PAD BINDINGS page + INTEGER SCALE ----------
  function hookOpt() {
    if (!window.OPT || OPT._m21d) return;
    OPT._m21d = 1;
    if (OPT.S && OPT.S.m21pix == null) OPT.S.m21pix = false;
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if (this.page === 'padbinds' && M.padbind) {
        const r = PACTS.map(a => ({ t: 'key', id: 'pb_' + a[0], l: a[1], v: () => nm(bound(a[0], a[2])) }));
        r.push({ t: 'btn', id: 'rpad', l: 'RESET PAD BUTTONS TO DEFAULT' }, { t: 'btn', id: 'pbbback', l: '<  BACK' });
        return r;
      }
      if (this.page === 'pad' && M.padbind && !L.some(r => r && r.id === 'padbinds')) {
        const i = L.findIndex(r => r && r.id === 'kback');
        const row = { t: 'btn', id: 'padbinds', l: 'PAD BINDINGS  >' };
        if (i >= 0) L.splice(i, 0, row); else L.push(row);
      }
      if ((this.page === 'main' || !this.page) && M.intscale && !L.some(r => r && r.id === 'm21pix')) {
        const fi = L.findIndex(r => r && (r.id === 'm21vsync' || r.id === 'full' || r.id === 'm21deck'));
        const row = { t: 'opt', id: 'm21pix', l: 'PIXEL SCALE', v: () => OPT.S.m21pix ? 'INTEGER' : 'FILL' };
        if (fi >= 0) L.splice(fi + 1, 0, row);
        else {
          const help = L.findIndex(r => r && r.t === 'hdr' && /HELP|ACCESS/i.test(r.l || ''));
          if (help >= 0) L.splice(help, 0, row); else L.push(row);
        }
      }
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && OPT.page === 'padbinds' && OPT.cap && String(OPT.cap).indexOf('pb_') === 0) {
          // capture a pad button; Escape / PadBack already handled by m8
          const g = padNow();
          if (g) {
            for (let i = 0; i < 16; i++) {
              const b = g.buttons[i]; const down = b && (b.pressed || b.value > 0.5);
              if (down && !M._capPrev[i]) {
                if (i >= 12 && i <= 15) { OPT.msg = 'D-PAD IS RESERVED FOR MENUS'; OPT.msgT = 1.4; OPT.cap = null; break; }
                assignPad(OPT.cap.slice(3), i); OPT.cap = null;
                try { if (SFX && SFX.ctx) SFX.ev('ui_click', 0.5, ['clink']); } catch (e) { }
                break;
              }
            }
            M._capPrev = Array.from(g.buttons || [], b => !!(b && (b.pressed || b.value > 0.5)));
          }
        } else {
          M._capPrev = [];
        }
        if (OPT.open && (OPT.page === 'main' || !OPT.page)) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && r.id === 'm21pix') {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK;
            if (left || right || MBP[0]) {
              OPT.S.m21pix = !OPT.S.m21pix;
              if (typeof OPT.save === 'function') OPT.save();
              applyPix();
              if (KP) { delete KP.ArrowLeft; delete KP.KeyA; delete KP.ArrowRight; delete KP.KeyD; delete KP.Enter; delete KP.Space; delete KP.PadOK; }
              MBP[0] = false;
            }
          }
        }
        // buttons on pad / padbinds pages
        if (OPT.open && (KP.Enter || KP.Space || KP.PadOK || MBP[0])) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && r.id === 'padbinds') {
            OPT.page = 'padbinds'; OPT.sel = 0; OPT.top = 0; OPT.cap = null;
            if (KP) { delete KP.Enter; delete KP.Space; delete KP.PadOK; } MBP[0] = false;
          } else if (r && r.id === 'pbbback') {
            OPT.page = 'pad'; OPT.sel = 0; OPT.top = 0; OPT.cap = null;
            if (KP) { delete KP.Enter; delete KP.Space; delete KP.PadOK; } MBP[0] = false;
          } else if (r && r.id === 'rpad') {
            binds(); PADCFG.binds = {}; if (typeof savePadCfg === 'function') savePadCfg();
            OPT.msg = 'PAD BUTTONS RESET'; OPT.msgT = 1.6;
            if (KP) { delete KP.Enter; delete KP.Space; delete KP.PadOK; } MBP[0] = false;
          } else if (r && r.t === 'key' && String(r.id).indexOf('pb_') === 0 && !OPT.cap) {
            OPT.cap = r.id; M._capPrev = [];
            OPT.msg = 'PRESS A PAD BUTTON   ESC CANCELS'; OPT.msgT = 2;
            if (KP) { delete KP.Enter; delete KP.Space; delete KP.PadOK; } MBP[0] = false;
          }
        }
        if (OPT.open && OPT.page === 'padbinds' && (KP.Escape || KP.PadBack || KP.Backspace) && !OPT.cap) {
          OPT.page = 'pad'; OPT.sel = 0; OPT.top = 0;
          if (KP) { delete KP.Escape; delete KP.PadBack; delete KP.Backspace; }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
  }
  function padNow() {
    try {
      const l = navigator.getGamepads ? navigator.getGamepads() : [];
      if (typeof PAD !== 'undefined' && PAD.idx >= 0 && l[PAD.idx]) return l[PAD.idx];
      for (const g of l) if (g && g.connected) return g;
    } catch (e) { }
    return null;
  }

  // ---------- live prompts: gameplay rows follow current binds ----------
  function hookTitle() {
    if (!window.OPT || typeof OPT.draw !== 'function' || OPT.draw._m21d) return;
    const _od = OPT.draw.bind(OPT);
    OPT.draw = function (ctx) {
      let ret;
      const _t = text;
      try {
        if (this.page === 'padbinds') {
          text = function (c, str) { if (str === 'SETTINGS') arguments[1] = 'PAD BINDINGS'; return _t.apply(this, arguments); };
        }
        ret = _od(ctx);
      } catch (e) { fail('title', e); try { ret = _od(ctx); } catch (e2) {} }
      text = _t;
      return ret;
    };
    OPT.draw._m21d = 1;
  }
  function hookPrompts() {
    if (!M.prompts || typeof promptRow !== 'function' || promptRow._m21d) return;
    const _pr = promptRow;
    promptRow = function (ctx, parts, x, y, col, align) {
      try {
        if (G && G.inputMode === 'pad' && Array.isArray(parts)) {
          parts = parts.map(p => {
            if (p === '{R2}') return M.glyph('sword');
            if (p === '{L2}') return M.glyph('off');
            if (p === '{R1}' && false) return p; // menu tabs stay
            return p;
          });
          M.n.prompt++;
        }
      } catch (e) { fail('pr', e); }
      return _pr.call(this, ctx, parts, x, y, col, align);
    };
    promptRow._m21d = 1;
    // title / pause control list uses kn() for keys already; pad list stays glyph-based (above)
  }

  // ---------- integer pixel scale (sharper on Deck 800p) ----------
  function applyPix() {
    try {
      if (typeof resize === 'function') resize();
      M.n.scale++;
    } catch (e) { fail('pix', e); }
  }
  function hookScale() {
    if (!M.intscale || typeof resize !== 'function' || resize._m21d) return;
    const _rs = resize;
    resize = function () {
      const want = !!(window.OPT && OPT.S && OPT.S.m21pix);
      if (!want) return _rs.apply(this, arguments);
      const s0 = Math.min(innerWidth / 480, innerHeight / 270);
      const s = Math.max(1, Math.floor(s0 + 1e-6));
      try {
        SCALE = s;
        let bs = s;
        if (typeof RK !== 'undefined' && RK > 1) { bs = Math.max(2, s); bs -= bs & 1; }
        screen.width = 480 * bs; screen.height = 270 * bs; SCALE = bs;
        screen.style.width = (480 * s) + 'px'; screen.style.height = (270 * s) + 'px';
      } catch (e) { fail('rs', e); return _rs.apply(this, arguments); }
    };
    resize._m21d = 1;
  }

  function hookAll() {
    try { hookOpt(); } catch (e) { fail('opt-h', e); }
    try { hookTitle(); } catch (e) { fail('ti-h', e); }
    try { hookPrompts(); } catch (e) { fail('pr-h', e); }
    try { hookScale(); } catch (e) { fail('sc-h', e); }
    M.ready = 1;
  }
  hookAll();
  setTimeout(function () { try { hookOpt(); hookTitle(); hookPrompts(); hookScale(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
