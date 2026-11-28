// ===== m21l: never delete the currently playing (or last full) music buffer so a warp can't drop the bed and start a 9s ix stub.
// Kill: ?m21l=0 / ?m21=0 | ?ixkeep=0
// m16 / m13e release() now consults M21L.held when this is on. Hands, pixels, and music files are unchanged.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21l') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21L = {
    on: !off, ixkeep: on('ixkeep'),
    n: { hold: 0, note: 0 }, err: [], ready: 0, lastFull: null
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, ixkeep: M.ixkeep,
    n: Object.assign({}, M.n), err: M.err.slice(), lastFull: M.lastFull,
    hooked: !!(window.M16 && M16.release)
  });
  if (off) { M.ready = 1; return; }

  function isIx(n) { return !!(n && String(n).indexOf('trk:m19_ix_') === 0); }
  function isFull(fm) {
    return !!(fm && fm.name && fm.buf && fm.buf.duration > 20 && !isIx(fm.name));
  }
  function noteFull() {
    try {
      const fm = window.SFX && SFX.fm;
      if (isFull(fm)) { M.lastFull = fm.name; M.n.note++; }
    } catch (e) { fail('note', e); }
  }
  M.noteFull = noteFull;

  // called from m16 / m13e release(): keep the live voice's buffer and the last full bed
  M.held = function (kn, n, buf, liveBuf, playing) {
    if (!M.ixkeep) return false;
    try {
      noteFull();
      if (liveBuf && buf && buf === liveBuf) { M.n.hold++; return true; }
      const last = M.lastFull;
      if (last && (kn === last || n === last || ('trk:m16_' + n) === last || ('trk:m13e_' + n) === last)) {
        M.n.hold++;
        return true;
      }
    } catch (e) { fail('held', e); }
    return false;
  };

  function hookFM() {
    if (typeof SFX === 'undefined' || typeof SFX.fileMusic !== 'function' || SFX.fileMusic._m21l) return;
    const _fm = SFX.fileMusic;
    SFX.fileMusic = function () {
      noteFull();
      const r = _fm.apply(this, arguments);
      noteFull();
      return r;
    };
    SFX.fileMusic._m21l = 1;
  }

  try { hookFM(); noteFull(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookFM(); noteFull(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
