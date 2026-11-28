// ===== m21p: HUD text consistency. Play-HUD ratios match results / chapel spacing.
// Kill: ?m21p=0 / ?m21=0 | ?hudtxt=0
// "SECRETS 0/5", "KILLS 0/32", and "99999/99999" HP become "0 / 5" / "99999 / 99999".
// Draw-only. Does not change values, difficulty, bosses, vials, or prices.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21p') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21P = {
    on: !off, hudtxt: on('hudtxt'),
    n: { slash: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({ on: M.on, hudtxt: M.hudtxt, n: Object.assign({}, M.n), err: M.err.slice() });
  M.tidy = function (str) {
    if (typeof str !== 'string') return str;
    if (/^(SECRETS|KILLS) \d+\//.test(str)) return str.replace(/(\d+)\/(\d+)/, '$1 / $2');
    if (/^\d+\/\d+$/.test(str)) return str.replace('/', ' / ');
    return str;
  };
  if (off) { M.ready = 1; return; }

  function hookHUD() {
    if (typeof drawHUD !== 'function' || drawHUD._m21p) return;
    const _d = drawHUD;
    drawHUD = function (ctx, cam, rdt) {
      let _t = null;
      if (M.hudtxt && typeof text === 'function' && !text._m21pInner) {
        _t = text;
        text = function (c, str) {
          if (typeof str === 'string') {
            const next = M.tidy(str);
            if (next !== str) M.n.slash++;
            str = next;
          }
          return _t.apply(this, arguments.length > 2 ? [c, str].concat([].slice.call(arguments, 2)) : [c, str]);
        };
        text._m21pInner = 1;
      }
      try { return _d.apply(this, arguments); }
      catch (e) { fail('hud', e); throw e; }
      finally { if (_t) text = _t; }
    };
    drawHUD._m21p = 1;
  }

  try { hookHUD(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () { try { hookHUD(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
