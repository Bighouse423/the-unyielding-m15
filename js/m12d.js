// ===== m12d: Abyss identity =====
// - every corrupted lieutenant has its own Abyss lines (no more "another pilgrim for the nave" at depth 1); the stage-1
//   "Turn back, Baron" gate taunt is replaced by an Abyss whisper.
// - each depth has its own palette (haze / ambient / grade), so depth 1 no longer looks like a re-run of the crypt.
// - an ABYSS OMEN per depth (regular foes only - the corrupted bosses keep their m7 kit untouched):
//     ECHOING DARK - some slain foes rise again as void shades (max 6 a depth)
//     STARLESS     - the light dies down; foes' eyes and shots burn brighter
//     SOUL HARVEST - foes are 15% hardier, every kill feeds you 2 HP
(function () {
  const M12 = window.M12 || {}; if (!M12.on) return;
  if (typeof THEMES === 'undefined' || !THEMES.abyss) return;
  const D = M12.D = { risen: 0, omen: null, lines: 0 };
  const depth = () => (typeof abyssDepth === 'function' ? abyssDepth() : 0) | 0;
  const LINES = {
    vknight: ['"The Abyss gave me my blood back, Baron. All of it. Kneel."', '"Down here... even the dead... are drowned..."'],
    alphawolf: ['"No moon down here. Only teeth."', '"The dark... ate the pack... ate me..."'],
    minotaur: ['"No crowd. No sand. Only you and the dark, forever."', '"At last... the gate... is shut..."'],
    cerberax: ['"Three heads, and the Abyss whispers in every one."', '"Leash... me... again..."'],
    colossus: ['"The Abyss sent me more bones. Yours fit."', '"Scatter me... where it cannot... find me..."'],
    witch: ['"He lied, Kael. There is no dying here. Only this."', '"Free... at... last..."'],
    uknight: ['"My oath ended with him. The dark gave me a new one."', '"Forgive me... I could not stay... dead..."'],
    spider: ['"My children were born in the dark. They never needed eyes."', '"Hush... little... ones..."'],
    lich: ['"You took my throne. The Abyss gave me a deeper one."', '"There is... no bottom... Baron..."'],
    matriarch: ['"Stone sinks. So will you."', '"Silence... below... the bells..."'],
  };
  M12.ABYSS_LINES = LINES;
  // corrupted lines
  if (window.M9 && M9.say) {
    const _say = M9.say;
    M9.say = function (who, line, col, dur) {
      try {
        const b = G.boss, d = depth();
        if (d && b && M9.LINES && M9.LINES[b.type] && LINES[b.type]) {
          const i = M9.LINES[b.type].indexOf(line);
          if (i >= 0) { line = LINES[b.type][i]; col = i ? '#d0a0ff' : '#c890ff'; D.lines++; }
        }
      } catch (e) { M12.err = String(e); }
      return _say.call(this, who, line, col, dur);
    };
  }
  const _toast = toast;
  toast = function (t1, t2, col, dur) {
    try { if (depth() && t1 === '"Turn back, Baron. The Court has no use for you."') { t1 = '"There is no turning back down here, Baron."'; col = '#c890ff'; } } catch (e) { }
    return _toast.call(this, t1, t2, col, dur);
  };

  // per-depth palettes
  const BASE = { haze: THEMES.abyss.haze.slice(), ambient: THEMES.abyss.ambient.slice(), torch: THEMES.abyss.torch, sub: THEMES.abyss.sub };
  const PAL = [
    { haze: [56, 20, 104], ambient: [0.46, 0.40, 0.66], torch: 'green', sub: 'Below the throne, the dark goes on forever' },
    { haze: [18, 64, 84], ambient: [0.34, 0.52, 0.58], torch: 'green', sub: 'The drowned halls - cold water, colder things' },
    { haze: [88, 12, 40], ambient: [0.56, 0.30, 0.40], torch: 'orange', sub: 'The bleeding deep - the walls have a pulse' },
    { haze: [30, 30, 36], ambient: [0.40, 0.40, 0.46], torch: 'green', sub: 'The ash sea - nothing grows, nothing rests' },
    { haze: [70, 50, 12], ambient: [0.54, 0.46, 0.30], torch: 'orange', sub: 'The gilded rot - a cathedral of the damned' },
  ];
  const OMENS = [
    { id: 'echo', n: 'ECHOING DARK', d: 'the slain rise again as shades' },
    { id: 'starless', n: 'STARLESS', d: 'the light dies; their eyes do not' },
    { id: 'harvest', n: 'SOUL HARVEST', d: 'hardier foes - every kill feeds you' },
  ];
  M12.omen = () => { const d = depth(); return d ? OMENS[(d - 1) % OMENS.length] : null; };
  const _at = applyTheme;
  applyTheme = function () {
    try {
      const d = depth(), T = THEMES.abyss;
      const p = d ? PAL[(d - 1) % PAL.length] : BASE;
      T.haze = p.haze.slice(); T.ambient = p.ambient.slice(); T.torch = p.torch; T.sub = p.sub;
      if (d && M12.omen().id === 'starless') T.ambient = T.ambient.map(v => v * 0.72);
    } catch (e) { M12.err = String(e); }
    return _at.apply(this, arguments);
  };
  // the omen is announced with the depth toast
  const _si = stageIntro;
  stageIntro = function () {
    const r = _si.apply(this, arguments);
    try { const d = depth(); D.risen = 0; if (d) { const o = M12.omen(); D.omen = o.id; setTimeout(() => { if (G.state === 'play') _toast('OMEN OF THE DEEP: ' + o.n, o.d, '#b0f0ff', 3.6); }, 4800); } else D.omen = null; } catch (e) { M12.err = String(e); }
    return r;
  };
  const inArena = e => { const A = LEVEL.arena; return !!(A && e.x > A.x0 - 1 && e.x < A.x1 + 1 && e.y > A.y0 - 1 && e.y < A.y1 + 1); };
  const _post = rogueStagePost;
  rogueStagePost = function () {
    const r = _post.apply(this, arguments);
    try { if (depth() && M12.omen().id === 'harvest') for (const e of G.enemies) if (e.alive && !e.d.boss && !e.summoned && !inArena(e)) e.hp = e.maxhp = Math.round(e.maxhp * 1.15); } catch (e) { M12.err = String(e); }
    return r;
  };
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const was = e && e.alive; const r = _de.apply(this, arguments);
    try {
      const d = depth();
      if (d && was && e && !e.alive && !e.d.boss && !e.summoned && G.state === 'play') {
        const om = M12.omen().id;
        if (om === 'harvest') P.hp = Math.min(P.maxhp, P.hp + 2);
        else if (om === 'echo' && e.type !== 'voidshade' && !e.m12risen && D.risen < 6 && Math.random() < 0.25 && EDEF.voidshade) {
          D.risen++; const x = e.x, y = e.y;
          setTimeout(() => { try { if (G.state !== 'play' || depth() !== d) return; const s = makeEnemy('voidshade', x, y); s.m12risen = true; s.summoned = true; s.awake = true; s.hp = s.maxhp = Math.round(s.maxhp * 0.6); G.enemies.push(s); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; addP({ k: 'ecto', x: x + Math.cos(a) * 0.4, y: y + Math.sin(a) * 0.4, z: floorAt(x, y) + 0.2 + Math.random() * 1.2, vx: Math.cos(a) * 0.6, vy: Math.sin(a) * 0.6, vz: 0.6, size: 0.06, col: RGB(170, 80, 255), life: 0.7 }); } try { SFX.play('ghost', 0.5); } catch (er) { } } catch (er) { M12.err = String(er); } }, 1400);
        }
      }
    } catch (er) { M12.err = String(er); }
    return r;
  };
  // STARLESS: foes' shots / tells burn brighter (m12c halo reads this)
  M12.starless = () => D.omen === 'starless';
})();
