// ===== m21e: CPU perf toward Deck 30fps at 800p.
// Adaptive column stride (FULL / ADAPTIVE / HALF): ADAPTIVE stays at 1 until js p95
// is over 22ms (or a 30fps cap is on), then renders every 2nd ray and copies.
// Kill: ?m21e=0 / ?m21=0 (all) | ?colstride=0 | ?rayhalf=1 (force half)
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21e') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const forceHalf = Q.get('rayhalf') === '1';
  const M = window.M21E = {
    on: !off, colstride: on('colstride'),
    n: { stride: 0, adapt: 0 }, err: [], ready: 0, p95: 16, js: 16, step: 1
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, colstride: M.colstride, step: M.stride(), mode: mode(),
    p95: +M.p95.toFixed(2), js: +M.js.toFixed(2), n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; M.stride = () => 1; return; }

  const MODES = ['full', 'adapt', 'half'];
  function so() { return (window.OPT && OPT.S) || {}; }
  function mode() {
    if (forceHalf) return 'half';
    if (!M.colstride) return 'full';
    const v = so().m21ray;
    return v === 'half' || v === 2 ? 'half' : v === 'full' || v === 0 ? 'full' : 'adapt';
  }
  M.stride = function () {
    const m = mode();
    if (m === 'full') { M.step = 1; return 1; }
    if (m === 'half') { M.step = 2; return 2; }
    // adaptive: 30fps cap or a live p95 over 22ms (Deck-ish budget) -> half
    const cap = window.OPT && OPT.S && +OPT.S.m21fps;
    const heavy = (M.p95 > 22) || (cap && cap <= 30 && M.js > 20);
    M.step = heavy ? 2 : 1;
    if (heavy) M.n.adapt++;
    return M.step;
  };

  // sample js time from m20l if present, else wrap frameInner
  function hookTime() {
    if (typeof frameInner !== 'function' || frameInner._m21e) return;
    const _fi = frameInner;
    const buf = [];
    frameInner = function (now) {
      const t0 = performance.now();
      const r = _fi.apply(this, arguments);
      const dt = performance.now() - t0;
      M.js = dt;
      buf.push(dt); if (buf.length > 90) buf.shift();
      if (buf.length >= 20) {
        const s = buf.slice().sort((a, b) => a - b);
        M.p95 = s[Math.floor(s.length * 0.95)] || dt;
      }
      return r;
    };
    frameInner._m21e = 1;
  }

  function hookOpt() {
    if (!window.OPT || OPT._m21e) return;
    OPT._m21e = 1;
    if (OPT.S && OPT.S.m21ray == null) OPT.S.m21ray = 'adapt';
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if (this.page && this.page !== 'main') return L;
      if (L.some(r => r && r.id === 'm21ray')) return L;
      const row = { t: 'opt', id: 'm21ray', l: 'RAY QUALITY', v: () => ({ full: 'FULL', adapt: 'ADAPTIVE', half: 'HALF' })[mode()] || 'ADAPTIVE' };
      const fi = L.findIndex(r => r && (r.id === 'm21pix' || r.id === 'm21fps' || r.id === 'm21deck' || r.id === 'hd'));
      if (fi >= 0) L.splice(fi + 1, 0, row);
      else L.push(row);
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && (OPT.page === 'main' || !OPT.page)) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && r.id === 'm21ray') {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK;
            if (left || right || MBP[0]) {
              const cur = mode();
              const i = Math.max(0, MODES.indexOf(cur === 'half' && forceHalf ? 'half' : cur));
              const n = MODES[(i + (left ? MODES.length - 1 : 1)) % MODES.length];
              OPT.S.m21ray = n;
              if (typeof OPT.save === 'function') OPT.save();
              if (KP) { delete KP.ArrowLeft; delete KP.KeyA; delete KP.ArrowRight; delete KP.KeyD; delete KP.Enter; delete KP.Space; delete KP.PadOK; }
              MBP[0] = false;
            }
          }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
  }

  try { hookTime(); } catch (e) { fail('time', e); }
  try { hookOpt(); } catch (e) { fail('opt-h', e); }
  M.ready = 1;
  setTimeout(function () { try { hookTime(); hookOpt(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
