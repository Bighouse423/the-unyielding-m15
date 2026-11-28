// ===== m21wpre: early try-namespace wrap (must run before any save is read) =====
// When a ?try_* or ?tryall=1 flag is on, all localStorage for this tab lives under
// tub_m21w_try: (or tub_m21w_try_all: with ?unlockall=1). Absent flags: a no-op.
// Kill: ?m21w=0 | ?m21=0 | ?try=0 | ?freshsave=0
(function () {
  const Q = location.search || '';
  if (/[?&]freshsave=0/.test(Q) || /[?&](m21w|m21|try)=0/.test(Q)) return;
  const tryOn = /[?&]tryall=1/.test(Q) || /[?&]try_(hitstop|style|buffer|assist|daily|mutators|ascension)=1/.test(Q);
  if (!tryOn) { window.M21WNS = { on: false, ns: null }; return; }
  const all = /[?&]unlockall=1/.test(Q) && !/[?&]unlockall=0/.test(Q);
  const NS = all ? 'tub_m21w_try_all:' : 'tub_m21w_try:';
  if (window.M20IPUB && M20IPUB.ns) { window.M21WNS = { on: true, ns: M20IPUB.ns, pub: true }; return; }
  let ls = null; try { ls = window.localStorage; } catch (e) { return; }
  if (!ls) return;
  const P = Storage.prototype, g = P.getItem, s = P.setItem, r = P.removeItem;
  P.getItem = function (k) { return g.call(this, this === ls ? NS + k : k); };
  P.setItem = function (k, v) { return s.call(this, this === ls ? NS + k : k, v); };
  P.removeItem = function (k) { return r.call(this, this === ls ? NS + k : k); };
  window.M20IPUB = window.M20IPUB || { ns: NS };
  if (!window.M20IPUB.ns) window.M20IPUB.ns = NS;
  window.M21WNS = { on: true, ns: NS, pub: false };
})();
