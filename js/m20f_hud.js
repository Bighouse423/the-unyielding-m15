// m20f HUD2: declutter. Toast queue (m18ui one-at-a-time) gets dedupe, a cap of 5 and drops stale (>9s) entries; toast width keeps clear of the minimap, set list fades out during
// fights, elite plates keep clear of the minimap. Kill switch: ?hud2=0 (or ?m20f=0).
(function () {
  const Q = new URLSearchParams(location.search);
  if (Q.get('hud2') === '0' || Q.get('m20f') === '0') { window.HUD2 = { on: false }; return; }
  const ST = { queued: 0, popped: 0, dropped: 0, stale: 0 };
  let fightT = 0, setA = 1, lastT = 0;
  const fight = () => fightT > 0;
  function step() {
    const now = G.t || 0, dt = Math.max(0, Math.min(0.1, now - lastT)); lastT = now;
    if (G.state !== 'play') return;
    let hot = G.combo > 0 && G.comboT > 0;
    if (!hot) for (const e of G.enemies) { if (e.alive && e.awake && !e.hidden && !e.summoned && (e.state === 'chase' || e.state === 'windup' || e.state === 'strike' || e.state === 'recover') && Math.abs(e.x - P.x) < 9 && Math.abs(e.y - P.y) < 9) { hot = true; break; } }
    if (G.boss && G.boss.alive && G.boss.awake && !G.boss.hidden) hot = true;
    fightT = hot ? 2.5 : Math.max(0, fightT - dt);
    setA = Math.max(0, Math.min(1, setA + (fight() ? -dt * 4 : dt * 2)));
  }
  const up0 = updatePlayer;
  updatePlayer = function () { const r = up0.apply(this, arguments); try { step(); } catch (e) { } return r; };
  window.HUD2 = {
    on: true, n: ST, setA: () => setA, fight,
    tw: () => { const mb = G.m20mmBox; return mb ? Math.max(200, W - 2 * (W - mb[0]) - 8) : W - 28; },
    st: () => Object.assign({ q: (window.M18 && M18.uiState && M18.uiState.toastQ || []).length, fight: fight(), setA }, ST),
  };
})();
