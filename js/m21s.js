// ===== m21s: sprite collect cull. Drop sprites well behind the camera or past a
// generous far clip so draw/sort/occlusion skip work the player cannot see.
// Default look is unchanged: far clip is 48 tiles, behind margin is 0.6.
// Kill: ?m21s=0 / ?m21=0 | ?sprcull=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21s') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21S = {
    on: !off, sprcull: on('sprcull'),
    far: 48, behind: -0.6,
    n: { cull: 0, keep: 0, run: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, sprcull: M.sprcull, far: M.far, behind: M.behind,
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; return; }

  function hookCollect() {
    if (!M.sprcull || typeof collectSprites !== 'function' || collectSprites._m21s) return;
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        if (!M.sprcull || !S || !S.length || !cam) return S;
        const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
        const FAR = M.far, BACK = M.behind;
        let w = 0;
        for (let i = 0; i < S.length; i++) {
          const s = S[i];
          const depth = (s.x - cam.x) * dx + (s.y - cam.y) * dy;
          if (depth < BACK || depth > FAR) { M.n.cull++; continue; }
          S[w++] = s;
        }
        if (w !== S.length) S.length = w;
        M.n.keep += w;
        M.n.run++;
      } catch (e) { fail('cull', e); }
      return S;
    };
    collectSprites._m21s = 1;
    // keep earlier module flags (m21i tell, etc.) on the outer wrapper
    try {
      for (const k in _cs) if (Object.prototype.hasOwnProperty.call(_cs, k) && collectSprites[k] == null) collectSprites[k] = _cs[k];
    } catch (e) { fail('flags', e); }
  }

  try { hookCollect(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () { try { hookCollect(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
  setTimeout(function () { try { hookCollect(); } catch (e) { fail('late2', e); } }, 900);
})();
