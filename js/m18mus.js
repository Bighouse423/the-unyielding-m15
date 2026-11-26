// ===== m18mus: distinct boss beds from the existing m16 Suno cuts (bar-aligned, already looped).
// Title/victory theme is untouched. ?bossmus=0 or ?m18=0 or ?suno=0 (m16 mus off).
(function () {
  if (!window.M18 || !M18.bossmus) return;
  if (typeof M16_MAP === 'undefined') return;
  const B18 = M18.bossmusState = { on: true, prev: JSON.parse(JSON.stringify(M16_MAP.boss || {})) };
  // each of the 9 regular bosses + lich + abyss + baron get a distinct loop from the existing cover cuts
  const NEXT = {
    1: ['boss_st', 'boss'],
    2: ['mini_st', 'mini'],
    3: ['boss_st', 's46c'],
    4: ['boss_st', 's9c'],
    5: ['mini_st', 'mini'],
    6: ['boss_st', 'abyss'],
    7: ['boss_st', 's9'],
    8: ['boss_st', 's78c'],
    9: ['boss_st', 's9c'],
    10: ['lich_st', 's10c'],
    abyss: ['boss_st', 'abyssc'],
    baron: ['boss_st', 'boss'],
    butcher: ['mini_st', 'mini'],
    abbess: ['mini_st', 'mini'],
    sexton: ['mini_st', 'mini'],
    ferrum: ['mini_st', 'mini']
  };
  Object.assign(M16_MAP.boss, NEXT);
  B18.map = M16_MAP.boss;
})();
