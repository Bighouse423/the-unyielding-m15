// ===== m21t: UI / audio mix. Menu ui_click sits on its own bus, slightly under SFX,
// so combat and his original music beds stay as they are. Default UI bus is 0.8.
// Settings AUDIO gains a UI VOLUME slider (additive).
// Kill: ?m21t=0 / ?m21=0 | ?uimix=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21t') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21T = {
    on: !off, uimix: on('uimix'),
    def: 0.8,
    n: { ui: 0, row: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.k = function () {
    if (!M.uimix) return 1;
    const v = window.OPT && OPT.S && OPT.S.m21ui;
    return (v == null || !isFinite(+v)) ? M.def : Math.max(0, Math.min(1, +v));
  };
  M.hooked = function () { return !!(typeof SFX !== 'undefined' && SFX.ev && SFX.ev._m21t); };
  M.st = () => ({
    on: M.on, uimix: M.uimix, k: M.k(), def: M.def, hooked: M.hooked(),
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  function defUi() {
    if (window.OPT && OPT.S && OPT.S.m21ui == null) OPT.S.m21ui = M.def;
  }

  function hookOpt() {
    if (!window.OPT || OPT._m21t) return;
    OPT._m21t = 1;
    defUi();
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if ((this.page === 'main' || !this.page) && M.uimix && !L.some(r => r && r.id === 'm21ui')) {
        const i = L.findIndex(r => r && r.id === 'sfx');
        const row = { t: 'slider', id: 'm21ui', l: 'UI VOLUME' };
        if (i >= 0) L.splice(i + 1, 0, row); else L.splice(1, 0, row);
        M.n.row++;
      }
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && (this.page === 'main' || !this.page) && M.uimix) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && r.id === 'm21ui') {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD;
            if (left || right) {
              defUi();
              const d = left ? -0.1 : 0.1;
              OPT.S.m21ui = Math.round(Math.max(0, Math.min(1, (+OPT.S.m21ui || M.def) + d)) * 10) / 10;
              if (typeof OPT.save === 'function') OPT.save();
              delete KP.ArrowLeft; delete KP.KeyA; delete KP.ArrowRight; delete KP.KeyD;
            }
          }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
  }

  function hookSfx() {
    if (!M.uimix || typeof SFX === 'undefined' || typeof SFX.ev !== 'function' || SFX.ev._m21t) return;
    const _ev = SFX.ev.bind(SFX);
    SFX.ev = function (name, vol, hush, hd) {
      try {
        if (M.uimix && name === 'ui_click') {
          vol = (vol == null ? 1 : vol) * M.k();
          M.n.ui++;
        }
      } catch (e) { fail('ev', e); }
      return _ev(name, vol, hush, hd);
    };
    SFX.ev._m21t = 1;
    try {
      for (const k in _ev) if (Object.prototype.hasOwnProperty.call(_ev, k) && SFX.ev[k] == null) SFX.ev[k] = _ev[k];
    } catch (e) { fail('flags', e); }
  }

  function hookAll() {
    try { hookOpt(); } catch (e) { fail('opt-h', e); }
    try { hookSfx(); } catch (e) { fail('sfx-h', e); }
    M.ready = 1;
  }
  hookAll();
  setTimeout(hookAll, 0);
  setTimeout(hookAll, 900);
})();
