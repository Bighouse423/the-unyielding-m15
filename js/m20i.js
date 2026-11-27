// ===== m20i: readability / chains / gibs / text / story pass (t223u t224u t228u t230u) =====
// chainfix2 : hung ceiling chains used a 64x128 OPAQUE brick wall texture squeezed into a 0.18-wide billboard (64 texels -> a few
//             screen px = shimmering moire), and every sprite appended after the depth sort (hung chains/banners, floor-entrance
//             ladders/holes/seal chains) skipped the near-lens cull and drew out of depth order. Now: appended sprites get a depth,
//             the near-lens cull, a near fade for overhead chains/banners and a stable re-sort; the chain gets a real transparent
//             link sprite (gfx2) at >= 3 screen px.
// gibs2     : dead-enemy chunks: 3 of 5 spawned (deterministic counter, no RNG use), 18% smaller, gone after 14 s instead of 30,
//             max 70 resting (was 160), resting chunks tinted dark into the blood so they read as gore, not clutter. Blood untouched.
// read      : eye comfort folded into the colour LUT (shadow-detail lift, soft highlight knee, tamed over-saturation; built once,
//             zero per-frame cost), vignette 28% lighter, toast plates more opaque for legibility.
// txt2      : one style for every toast: short titles UPPERCASE without a trailing period, sentences end with punctuation.
// story2    : tightened prologue / epilogue / secret ending / chapter cards / lore (same plot, names, panels).
// daily     : Daily Descent removed from the title menu and run history (code kept; ?daily=1 brings it back).
// Kill switches: ?m20i=0 (all) | ?chainfix2=0 ?gfx2=0 ?gibs2=0 ?read=0 ?txt2=0 ?story2=0 | ?daily=1
(function () {
  const Q = location.search, off = /[?&](m20i|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20I = { on: !off, chain: fl('chainfix2') && !/[?&]chainfix=0/.test(Q), gfx: fl('gfx2') && !/[?&]chainfix=0/.test(Q), gibs: fl('gibs2'), read: fl('read'), txt: fl('txt2'), story: fl('story2'),
    noDaily: !off && !/[?&]daily=1/.test(Q) && !/[?&]m20=0/.test(Q), n: { culled: 0, gibDrop: 0, gibPrune: 0, txt: 0 }, err: [] };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  if (off) return;

  // ---------- chain sprite art ----------
  function chainArt() {
    if (!M.gfx || typeof Engine === 'undefined' || !Engine.tex || Engine.tex.m20i_hchain) return;
    const w = 8, h = 64, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const D = '#2a2632', MD = '#6c6878', HI = '#c8c4d6', RU = '#7a4a30';
    for (let y = 0, i = 0; y < h - 10; y += 6, i++) {
      if (i % 2 === 0) {   // face-on oval link
        x.fillStyle = D; x.fillRect(2, y, 4, 7); x.clearRect(3, y + 2, 2, 3);
        x.fillStyle = MD; x.fillRect(2, y + 1, 1, 5); x.fillRect(3, y, 2, 1); x.fillStyle = HI; x.fillRect(2, y + 2, 1, 2); x.fillRect(3, y, 1, 1);
        if (i % 5 === 2) { x.fillStyle = RU; x.fillRect(5, y + 4, 1, 2); }
      } else {             // edge-on link
        x.fillStyle = D; x.fillRect(3, y - 1, 2, 8); x.fillStyle = MD; x.fillRect(3, y, 1, 6); x.fillStyle = HI; x.fillRect(3, y + 1, 1, 2);
      }
    }
    // shackle at the bottom
    const y0 = h - 10; x.fillStyle = D; x.fillRect(1, y0, 6, 2); x.fillRect(0, y0 + 1, 2, 7); x.fillRect(6, y0 + 1, 2, 7); x.fillRect(1, y0 + 7, 6, 2);
    x.fillStyle = MD; x.fillRect(1, y0 + 2, 1, 5); x.fillRect(2, y0, 4, 1); x.fillStyle = HI; x.fillRect(1, y0 + 3, 1, 2); x.fillRect(2, y0, 2, 1);
    Engine.imgs && (Engine.imgs.m20i_hchain = c);
    const dd = x.getImageData(0, 0, w, h); Engine.tex.m20i_hchain = { w, h, d: new Uint32Array(dd.data.buffer) };
  }
  M.chainArt = chainArt;

  // ---------- sprite list fix-up (runs last: m18ceil + m20floor wrappers are inside) ----------
  const HUNG = { h_chain: 1, a_chain: 1, m20i_hchain: 1 }, HUNGB = { t_banner: 1, l_banner: 1 };
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        if (M.gfx && !Engine.tex.m20i_hchain) chainArt();
        const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang), ep = (typeof EP !== 'undefined' && EP > 0) ? EP : 300;
        let late = false;
        for (let i = S.length - 1; i >= 0; i--) {
          const s = S[i];
          if (M.gibs && typeof s.tex === 'string' && s.tex.charCodeAt(0) === 103 && s.tex.startsWith('gib') && s.rot !== undefined && !s.tint) { s.tint = GIBT; s.rim = 0.45; }
          if (s.dep !== undefined || !M.chain) continue;
          late = true;
          const d = (s.x - cam.x) * dx + (s.y - cam.y) * dy; s.dep = d;
          if (d < 0.42 && Math.abs(s.x - cam.x) < 0.5 && Math.abs(s.y - cam.y) < 0.5) { S.splice(i, 1); M.n.culled++; continue; }
          const tn = s.tex;
          if (HUNG[tn] || HUNGB[tn]) {
            const k = Math.max(0, Math.min(1, (d - 0.55) / 0.75));
            if (k <= 0) { S.splice(i, 1); M.n.culled++; continue; }
            s.alpha = (s.alpha === undefined ? 1 : s.alpha) * k;
            if (HUNG[tn] && Engine.tex.m20i_hchain) { s.tex = 'm20i_hchain'; s.w = Math.max(0.13, 3.0 * Math.max(d, 0.1) / ep); }
          }
        }
        if (late) S.sort((a, b) => b.dep - a.dep);
      } catch (e) { fail('sprites', e); }
      return S;
    };
  }
  const GIBT = [44, 6, 10, 0.34];

  // ---------- gibs ----------
  let gc = 0;
  if (M.gibs && typeof addP === 'function') {
    const _ap = addP;
    addP = function (p) {
      if (p && p.k === 'gib') {
        gc++; const r = gc % 5; if (r === 1 || r === 3) { M.n.gibDrop++; return p; }
        if (p.w) p.w *= 0.82; if (p.life > 14) p.life = 14;
      }
      return _ap.apply(this, arguments);
    };
  }
  M.pruneGibs = () => pruneGibs();
  function pruneGibs() {
    const A = G.particles; if (!A || A.length < 70) return;
    let rest = 0; for (let i = A.length - 1; i >= 0; i--) { const p = A[i]; if (p.k === 'gib' && p.rest) { rest++; if (rest > 70) { A.splice(i, 1); M.n.gibPrune++; } } }
  }

  // ---------- readability: LUT comfort + lighter vignette ----------
  function comfort(L) {
    if (!L || L.m20i) return;
    for (let i = 0; i < L.length; i++) {
      const q = L[i]; let r = (q & 255) / 255, g = ((q >> 8) & 255) / 255, b = ((q >> 16) & 255) / 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * b, lift = 0.032 * (1 - l) * (1 - l) * (1 - l);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx > 0 ? (mx - mn) / mx : 0;
      const ds = sat > 0.78 ? (sat - 0.78) * 0.35 : 0;
      r += (l - r) * ds + lift; g += (l - g) * ds + lift; b += (l - b) * ds + lift * 1.1;
      r = r > 0.86 ? 0.86 + (r - 0.86) * 0.72 : r; g = g > 0.86 ? 0.86 + (g - 0.86) * 0.72 : g; b = b > 0.86 ? 0.86 + (b - 0.86) * 0.72 : b;
      L[i] = (q & 0xff000000) | (Math.max(0, Math.min(255, Math.round(b * 255))) << 16) | (Math.max(0, Math.min(255, Math.round(g * 255))) << 8) | Math.max(0, Math.min(255, Math.round(r * 255)));
    }
    try { Object.defineProperty(L, 'm20i', { value: 1, writable: true, configurable: true }); } catch (e) { L.m20i = 1; }
  }
  if (M.read && typeof buildLUT === 'function') {
    const _bl = buildLUT;
    buildLUT = function () {
      try { if (FX.lut) FX.lut.m20i = 0; } catch (e) { }
      const r = _bl.apply(this, arguments);
      try { if (FX.lut) { FX.lut.m20i = 0; comfort(FX.lut); } } catch (e) { fail('lut', e); }
      return r;
    };
  }
  let vigOut = null;
  function softVig() {
    if (typeof FX === 'undefined' || !FX.vig || FX.vig === vigOut) return;
    const src = FX.vig, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.globalAlpha = 0.72; x.drawImage(src, 0, 0); vigOut = c; FX.vig = c;
  }

  // ---------- text style ----------
  const TC = new Map();
  M.txn = function (s, title) {
    if (!M.txt || typeof s !== 'string' || !s) return s;
    const key = (title ? '1' : '2') + s; let o = TC.get(key); if (o !== undefined) return o;
    o = s.replace(/\s+$/, '').replace(/^\s+/, '').replace(/ -- /g, ' - ').replace(/\.{4,}/g, '...');
    if (title) {
      if (o[0] !== '"' && o.length <= 30 && /[a-z]/.test(o)) o = o.toUpperCase();
      if (o.length <= 30 && /[^.]\.$/.test(o) && o[0] !== '"') o = o.slice(0, -1);
    } else if (o.length > 1 && o !== '-') {
      if (/^[a-z]/.test(o) && !/^[a-z]+:/.test(o)) o = o[0].toUpperCase() + o.slice(1);
      if (/\s/.test(o) && /[A-Za-z]$/.test(o) && !/\d/.test(o)) o += '.';   // stat lines with numbers keep their style
    }
    if (o !== s) M.n.txt++;
    if (TC.size > 600) TC.clear(); TC.set(key, o); return o;
  };

  // ---------- story ----------
  function story() {
    if (!M.story || typeof M9 === 'undefined' || !M9.SCENES) return;
    const SC = M9.SCENES, set = (k, L) => { const A = SC[k]; if (!A || A.length !== L.length) return fail('story ' + k, 'panel count'); for (let i = 0; i < A.length; i++) A[i] = Object.assign({}, A[i], { lines: L[i] }); };
    M.storyBefore = M.storyBefore || JSON.parse(JSON.stringify({ intro: SC.intro, ending: SC.ending, m13alt: SC.m13alt, ch: window.M10 && M10.chapters, lore: M9.LORE }));
    set('intro', [
      ['The year the sun went out, the Lich King took the Black Reliquary,', 'and the last sunrise with it.'],
      ['Without that sunrise, the dead forget they are dead.'],
      ['Ten lieutenants guard the way down.', 'Cathedral. Catacomb. Ossuary. Belfry. Arena. Throne.'],
      ['Kael was once first knight of the Lich\'s Black Court.', 'Then he burned his own banner on the cathedral steps.'],
      ['The Lich has been killing him ever since.', 'It never takes.'],
      ['Three deaths. Three times back on his feet.', 'They call him THE UNYIELDING.'],
      ['The Chapel keeps the last lit candle in the world.', 'Below it, the way down. Die, and wake by the candle.'],
    ]);
    set('ending', [
      ['The crown hits the floor.', 'For the first time in four hundred years, the throne is empty.'],
      ['"You were mine, Kael," says the dust.', '"I was nobody\'s. Not even death\'s."'],
      ['Kael opens the Reliquary.', 'The sky remembers how to be morning.'],
      ['In the Chapel, ten candles light themselves:', 'one for each lieutenant who stays down.'],
      ['The pilgrims step outside and see their shadows.', 'Some weep. Some, at last, lie down.'],
      ['But under the throne, something still breathes.', 'The Unyielding does not rest.'],
    ]);
    set('m13alt', [
      ['Under the throne waits the Black Baron: the knight Kael was', 'before the pyre. "You cannot burn what you are."'],
      ['Kael can. Once for the banner.', 'Once more for the man who carried it.'],
      ['At dawn a new banner flies: no crown, no skull, only a sun.', 'THE UNYIELDING has nothing left to kneel to.'],
    ]);
    if (window.M10 && M10.chapters) Object.assign(M10.chapters, {
      nave: ['The bells still ring for mass. No living hand pulls the ropes.', 'The Vampire Knight keeps the nave. He knelt first.'],
      witch: ['Green fire in the sconces. Every saint\'s face scratched away.', 'Someone here has been praying to the wrong thing.'],
      blood: ['The moon came through the windows and never left.', 'The Vampire Knight is drunk on it. Drunk men swing wide.'],
      crypt: ['The monks buried their own down here. Then came the plague.', 'Now the Brood Mother moves the bones.'],
      ossuary: ['Ten thousand skulls in the walls, all facing the door.', 'Not decoration. An audience. The Colossus is listening.'],
      courtyard: ['Hedges, statues, and a fountain that runs red.', 'The Alpha hunts here. He remembers being a man.'],
      belfry: ['The great bell waits to ring the day the Lich falls.', 'The gargoyles roost on it. Their Matriarch wants it silent.'],
      arena: ['The dead fill the seats and knock their jaws. It sounds like rain.', 'The Minotaur has never fought a man who will not stay down.'],
      necropolis: ['Mausoleums row on row. Every door open.', 'Morwen keeps the ledger. Beside your name: not for sale.'],
      kennels: ['The forges never cool. The chains are thick as a man.', 'Cerberax was a queen\'s lapdog. The queen died. He kept eating.'],
      cathedral: ['Glass on the floor. Storm in the rafters.', 'Sir Valcor guards the throne until the last king dies.'],
      throne: ['No more lieutenants. No more doors. Only the stair and the cold.', 'He has waited at the top since you burned the banner.'],
    });
    const LT = {
      s1: 'A candle for every pilgrim who walked into the cathedral. The candles ran out the first winter. The pilgrims did not.',
      s2: 'The catacomb stones sweat salt. The monks called it grief. The Brood Mother calls it seasoning.',
      s3: 'Ten thousand bones, one will. When the Lich called, the ossuary did not rise one by one. It rose as one.',
      s4: 'The moon turned red the night the Reliquary was taken. The wolves have sung about it ever since.',
      s5: 'The great bell was cast to ring the day the Lich King falls. Four hundred years of silence. Keep climbing.',
      s6: 'The dead still fill the arena seats. No tongues to cheer with, so they knock their jaws. It sounds like rain.',
      s7: 'Every name in this city is in her book, a price beside each one. Beside yours: not for sale.',
      s8: 'Cerberax was a lapdog once, a gift to a queen. The queen died. The dog kept eating.',
      s9: '"I swore to guard the throne until the last king died. Nobody told me he would refuse to."',
      s10: 'It holds the last sunrise. He locked it away so the dead would never see their shadows. Take it back, Baron.',
      saint: 'He prayed so long the god stopped listening. He kept praying to the silence. One night, the silence answered.',
      m13_reliq: 'When the Lich came, the monks walled up their treasures, then the masons. Listen for the draft. Look for bricks that do not match.',
      m13_sigil: 'Three seals were cut from the Black Court\'s banner and hidden in the dark. Carry all three to the throne and see what it hides.',
      m13_baron: 'Before the pyre, a knight served the Lich gladly. Kael left him in the chapel under the throne. He is still waiting.',
      m13_gilded: 'A tithe-collector so greedy that death gilded him. He still runs from anyone who might ask for change.',
      m13_pilgrim: 'She came to light a candle for her son and never found the way out. She left it burning, in case someone else got lost.',
      m13_eclipse: 'Some nights the moon bleeds into the crypts. The dead grow strong on it. So do their spoils.',
      m13_bastion: 'The Black Court\'s shield-wall. Slow to turn, never dropping the tower shield. Go round, bash it aside, or parry and punish.',
      m13_cantor: 'They sing the dead back up. Kill the singer and the choir falls silent.',
      m13_leaper: 'Hanged men who learned to jump. Watch for the crouch, then get out from under it.',
      m13_stalker: 'They step through the smoke and come out behind you. When the purple mist rises, turn around.',
      m13_butcher: 'He stocks the ossuary one carcass at a time. When he throws the hook, do not be on the end of it.',
      m13_abbess: 'The abbess who prayed to the Lich instead. Her curses fly in threes, then in fives.',
      m13_relics: 'Eight relics the Court\'s champions carried. They do not make a weapon stronger; they make it something else. Some of them like each other.',
      m14_gargoyle: 'Carved to keep the rain off the crypt, she grew tired of rain and started keeping off the living. When her shadow sharpens, move.',
      m14_knell: 'The belfry ringer counts the dead with his bell. Every toll rolls across the floor. Jump it, roll through it, never stand on glowing stone.',
      m14_twins: 'Penance takes the confession; Vigil burns the sin. While she lives, she mends him. Kill her first, or be quick.',
      m14_ghast: 'Kennel-keeper of the Abyss. He whistles and they come. Mind the iron jaws he leaves in the dust.',
      m15_sexton: 'Forty years keeping the courtyard graves, and not one stayed shut. When the ground glows toward you, step aside. When he laughs, the dead come up.',
      m15_ferrum: 'The arena\'s last champion sealed herself in an iron maiden so she could never lose. Her saw always comes back. Stay out of its lane.',
    };
    if (Array.isArray(M9.LORE)) for (const L of M9.LORE) if (L && LT[L[0]]) L[2] = LT[L[0]];
    M.storyDone = 1;
  }
  M.story2 = story;
  try { story(); } catch (e) { fail('story', e); }

  // ---------- daily descent off ----------
  function noDaily() {
    if (!M.noDaily || !window.M12 || !M12.MENU) return;
    const i = M12.MENU.findIndex(m => m.id === 'daily'); if (i >= 0) { M12.MENU.splice(i, 1); M.n.daily = 1; if (M12.TM && M12.TM.sel >= M12.MENU.length) M12.TM.sel = 0; }
  }
  try { noDaily(); } catch (e) { fail('daily', e); }

  // ---------- per frame (cheap) ----------
  if (typeof frameInner === 'function') {
    const _fi = frameInner;
    frameInner = function () {
      const r = _fi.apply(this, arguments);
      try {
        if (M.gibs) pruneGibs();
        if (M.read && typeof FX !== 'undefined') { if (FX.lut && !FX.lut.m20i) comfort(FX.lut); softVig(); }
        if (M.noDaily && window.M12 && M12.MENU && M12.MENU.length && M12.MENU.some(m => m.id === 'daily')) noDaily();
      } catch (e) { fail('frame', e); }
      return r;
    };
  }
  M.st = () => ({ on: M.on, chain: M.chain, gfx: M.gfx, gibs: M.gibs, read: M.read, txt: M.txt, story: M.story, noDaily: M.noDaily, n: M.n, err: M.err,
    chainTex: !!(Engine.tex && Engine.tex.m20i_hchain), lut: !!(FX.lut && FX.lut.m20i), menu: window.M12 && M12.MENU ? M12.MENU.map(m => m.id) : null });
})();
