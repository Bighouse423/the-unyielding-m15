// ===== m21q: additive stick settings. Default look curve / deadzones stay exactly as they are.
// New CONTROLLER rows: LOOK CURVE, LOOK DEADZONE, MOVE DEADZONE, RESET STICK FEEL.
// Stored in PADCFG only when changed from default (tu_pad stays additive).
// Kill: ?m21q=0 / ?m21=0 | ?stick=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21q') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21Q = {
    on: !off, stick: on('stick'), live: !off && on('stick'),
    n: { curve: 0, dz: 0, reset: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  const CURVES = ['default', 'linear', 'heavy'];
  const LAB = { default: 'DEFAULT', linear: 'LINEAR', heavy: 'HEAVY' };
  function clampDZ(v, def) {
    const n = +v;
    if (!isFinite(n)) return def;
    return Math.round(Math.max(0.06, Math.min(0.36, n)) * 100) / 100;
  }
  M.moveDZ = function () {
    if (typeof PADCFG === 'undefined' || PADCFG.ldz == null) return 0.22;
    return clampDZ(PADCFG.ldz, 0.22);
  };
  M.lookDZ = function () {
    if (typeof PADCFG === 'undefined' || PADCFG.rdz == null) return 0.18;
    return clampDZ(PADCFG.rdz, 0.18);
  };
  M.resp = function (m) {
    const c = (typeof PADCFG !== 'undefined' && PADCFG.curve) || 'default';
    if (c === 'linear') return m;
    if (c === 'heavy') return 0.1 * m + 0.9 * (Math.exp(3 * m) - 1) / (Math.exp(3) - 1);
    return 0.25 * m + 0.75 * (Math.exp(2 * m) - 1) / (Math.exp(2) - 1);
  };
  M.st = () => ({
    on: M.on, stick: M.stick, live: M.live,
    curve: (typeof PADCFG !== 'undefined' && PADCFG.curve) || 'default',
    ldz: M.moveDZ(), rdz: M.lookDZ(),
    def: M.isDefault(),
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  M.isDefault = function () {
    if (typeof PADCFG === 'undefined') return true;
    const c = PADCFG.curve; if (c && c !== 'default') return false;
    if (PADCFG.ldz != null && Math.abs(PADCFG.ldz - 0.22) > 1e-9) return false;
    if (PADCFG.rdz != null && Math.abs(PADCFG.rdz - 0.18) > 1e-9) return false;
    return true;
  };
  M.hooked = function () {
    return !!(typeof pmAct === 'function' && pmAct._m21q && typeof PM_PAD !== 'undefined' && PM_PAD._m21q);
  };
  if (off) { M.ready = 1; return; }

  function hookPadList() {
    if (typeof PM_PAD === 'undefined' || PM_PAD._m21q) return;
    const rows = [
      { id: 'pcurve', label: () => 'LOOK CURVE  ' + LAB[(typeof PADCFG !== 'undefined' && PADCFG.curve) || 'default'] },
      { id: 'prdz', label: () => 'LOOK DEADZONE  ' + Math.round(M.lookDZ() * 100) + '%' },
      { id: 'pldz', label: () => 'MOVE DEADZONE  ' + Math.round(M.moveDZ() * 100) + '%' },
      { id: 'pstickrst', label: () => 'RESET STICK FEEL TO DEFAULT' }
    ];
    const i = PM_PAD.findIndex(x => x && (x.id === 'pback' || x.id === 'padbinds'));
    if (i >= 0) PM_PAD.splice(i, 0, rows[0], rows[1], rows[2], rows[3]);
    else for (let k = 0; k < rows.length; k++) PM_PAD.push(rows[k]);
    PM_PAD._m21q = 1;
  }

  function hookAct() {
    if (typeof pmAct !== 'function' || pmAct._m21q) return;
    const _pm = pmAct;
    pmAct = function (id, dir) {
      try {
        if (id === 'pcurve' && M.stick) {
          const o = CURVES;
          const cur = (PADCFG.curve || 'default');
          const n = o[(o.indexOf(cur) + (dir < 0 ? o.length - 1 : 1)) % o.length];
          if (n === 'default') delete PADCFG.curve; else PADCFG.curve = n;
          if (typeof savePadCfg === 'function') savePadCfg();
          M.n.curve++;
          return;
        }
        if ((id === 'prdz' || id === 'pldz') && M.stick) {
          const key = id === 'prdz' ? 'rdz' : 'ldz';
          const def = key === 'rdz' ? 0.18 : 0.22;
          const cur = PADCFG[key] == null ? def : +PADCFG[key];
          const next = clampDZ(cur + (dir || 1) * 0.02, def);
          if (Math.abs(next - def) < 1e-9) delete PADCFG[key]; else PADCFG[key] = next;
          if (typeof savePadCfg === 'function') savePadCfg();
          M.n.dz++;
          return;
        }
        if (id === 'pstickrst' && M.stick) {
          if (!dir) {
            delete PADCFG.curve; delete PADCFG.ldz; delete PADCFG.rdz;
            if (typeof savePadCfg === 'function') savePadCfg();
            M.n.reset++;
            if (window.OPT) { OPT.msg = 'STICK FEEL RESET'; OPT.msgT = 1.6; }
          }
          return;
        }
      } catch (e) { fail('act', e); }
      return _pm.apply(this, arguments);
    };
    pmAct._m21q = 1;
  }

  function hookAll() {
    try { hookPadList(); hookAct(); } catch (e) { fail('hook', e); }
    M.ready = 1;
  }
  hookAll();
  // m21a boots again at 800ms and re-wraps pmAct; re-seat after that so DEFAULT stick rows stay hooked.
  setTimeout(hookAll, 0);
  setTimeout(hookAll, 900);
  setTimeout(hookAll, 2000);
})();
