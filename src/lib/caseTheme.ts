export function getCaseThemeGlow(c: { id: string; name: string; category?: string; priceDc: number }): { rgb: string; hex: string } {
  const t = (c.id + ' ' + c.name + ' ' + (c.category || '')).toLowerCase();
  if (t.includes('gold') || t.includes('sheikh') || t.includes('millionaire') || t.includes('oligarch') || t.includes('souvenir') || t.includes('diamond') || c.priceDc >= 25000) {
    return { rgb: '245, 158, 11', hex: '#f59e0b' }; // Gold
  }
  if (t.includes('crimson') || t.includes('redline') || t.includes('bloodsport') || t.includes('red') || t.includes('clash') || t.includes('slaughter') || t.includes('howl')) {
    return { rgb: '239, 68, 68', hex: '#ef4444' }; // Crimson Red
  }
  if (t.includes('fire') || t.includes('inferno') || t.includes('vulcan') || t.includes('phoenix') || t.includes('heat') || t.includes('breath') || t.includes('blaze')) {
    return { rgb: '249, 115, 22', hex: '#f97316' }; // Flame Orange
  }
  if (t.includes('ice') || t.includes('frost') || t.includes('blizzard') || t.includes('arctic') || t.includes('water') || t.includes('ocean')) {
    return { rgb: '6, 182, 212', hex: '#06b6d4' }; // Frost Cyan
  }
  if (t.includes('toxic') || t.includes('hazard') || t.includes('atomic') || t.includes('gamma') || t.includes('emerald') || t.includes('green') || t.includes('zalupa')) {
    return { rgb: '34, 197, 94', hex: '#22c55e' }; // Toxic Green
  }
  if (t.includes('anime') || t.includes('waifu') || t.includes('bubblegum') || t.includes('candy') || t.includes('rush')) {
    return { rgb: '244, 63, 94', hex: '#f43f5e' }; // Neon Waifu Pink
  }
  if (t.includes('doppler') || t.includes('galaxy') || t.includes('space') || t.includes('purple') || t.includes('fantasy') || t.includes('odyssey') || t.includes('universe')) {
    return { rgb: '168, 85, 247', hex: '#a855f7' }; // Cosmic Purple
  }
  if (t.includes('cyber') || t.includes('neon') || t.includes('tokyo') || t.includes('matrix') || t.includes('glitch') || t.includes('samurai') || t.includes('ninja') || t.includes('synth') || t.includes('retro')) {
    return { rgb: '217, 70, 239', hex: '#d946ef' }; // Cyber Magenta
  }
  if (t.includes('fade') || t.includes('spectrum') || t.includes('prisma') || t.includes('marble')) {
    return { rgb: '192, 132, 252', hex: '#c084fc' }; // Rainbow Chroma
  }
  if (t.includes('asiimov') || t.includes('mecha') || t.includes('printstream') || t.includes('velocity')) {
    return { rgb: '249, 115, 22', hex: '#f97316' }; // Asiimov Orange
  }
  if (t.includes('glove') || t.includes('specialist') || t.includes('driver')) {
    return { rgb: '245, 158, 11', hex: '#f59e0b' }; // Glove Amber
  }
  if (c.category === 'knives' || t.includes('knife') || t.includes('bayonet') || t.includes('karambit') || t.includes('butterfly')) {
    return { rgb: '147, 51, 234', hex: '#9333ea' }; // Knives Purple
  }
  return { rgb: '56, 189, 248', hex: '#38bdf8' }; // Tactical Sky Blue
}
