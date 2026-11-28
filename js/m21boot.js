// m21a: early save-recovery (must run before hub.js loadSave).
// If tu_save is missing or unparsable, restore the newest rotating backup.
// Fresh empty buddy saves are valid JSON and are left alone.
// Kill: ?m21a=0 or ?m21=0
(function () {
  if (/[?&]m21a=0(?:&|$)/.test(location.search) || /[?&]m21=0(?:&|$)/.test(location.search)) return;
  let ls;
  try { ls = window.localStorage; } catch (e) { return; }
  if (!ls) return;
  function parse(raw) {
    if (raw == null || raw === '') return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') throw new Error('not an object');
    return o;
  }
  let cur = null, bad = false;
  try { cur = parse(ls.getItem('tu_save')); } catch (e) { bad = true; }
  if (!bad) return;
  for (let i = 1; i <= 3; i++) {
    try {
      const b = ls.getItem('tu_save.bak' + i);
      if (!b) continue;
      parse(b);
      ls.setItem('tu_save', b);
      window.__TU_RECOVERED = i;
      return;
    } catch (e) { /* try next */ }
  }
})();
