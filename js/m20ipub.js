// ===== m20m public (buddy) build only: a fresh save per pinned link =====
// Every pinned rawcdn.githack.com link shares ONE origin, so earlier links' localStorage (save, unlocks, "prologue seen") leaked
// into each new buddy build: no story at the start and unlocks already owned. This build keeps its save under its own prefix,
// so a new player (or an old one on a new link) starts clean and sees the prologue. Old saves are left untouched (additive).
// Kill switch: ?freshsave=0 (uses the shared keys again).
(function () {
  if (/[?&]freshsave=0/.test(location.search)) return;
  const NS = /[?&]unlockall=1/.test(location.search) ? 'tub_m20o_all:' : 'tub_m20o:';
  let ls = null; try { ls = window.localStorage; } catch (e) { return; }
  if (!ls) return;
  const P = Storage.prototype, g = P.getItem, s = P.setItem, r = P.removeItem;
  P.getItem = function (k) { return g.call(this, this === ls ? NS + k : k); };
  P.setItem = function (k, v) { return s.call(this, this === ls ? NS + k : k, v); };
  P.removeItem = function (k) { return r.call(this, this === ls ? NS + k : k); };
  window.M20IPUB = { ns: NS };
})();
