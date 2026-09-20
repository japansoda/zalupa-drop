export function getCaseThemeGlow(c: { id: string; name: string; category?: string; priceDc: number }): { rgb: string; hex: string } {
  const t = (c.id + ' ' + c.name + ' ' + (c.category || '')).toLowerCase();
  const price = c.priceDc || 0;

  // Ultra-tier (50,000+ DC, Oligarch, Sheikh, Diamond)
  if (price >= 50000 || t.includes('sheikh') || t.includes('oligarch') || t.includes('100000') || t.includes('diamond')) {
    return { rgb: '251, 191, 36', hex: '#fbbf24' }; // Mythic Sun Gold
  }

  // Highroller tier (25,000+ DC, Gold, Jackpot, Millionaire)
  if (price >= 25000 || t.includes('gold') || t.includes('jackpot') || t.includes('millionaire') || t.includes('royale') || t.includes('50000')) {
    return { rgb: '245, 158, 11', hex: '#f59e0b' }; // CS2 Amber Gold
  }

  // Specific custom themes
  if (t.includes('anubis') || t.includes('egypt') || t.includes('arabesque') || t.includes('emperor')) {
    return { rgb: '251, 191, 36', hex: '#fbbf24' }; // Egyptian Pharaoh Gold
  }
  if (t.includes('dragon') || t.includes('lore') || t.includes('lotus') || t.includes('gods_monsters') || t.includes('serpent') || t.includes('jungle')) {
    return { rgb: '16, 185, 129', hex: '#10b981' }; // Imperial Emerald / Aztec Green
  }
  if (t.includes('crimson') || t.includes('redline') || t.includes('bloodsport') || t.includes('red') || t.includes('clash') || t.includes('slaughter') || t.includes('howl') || t.includes('autotronic') || t.includes('racing') || t.includes('racer')) {
    return { rgb: '239, 68, 68', hex: '#ef4444' }; // Crimson Red
  }
  if (t.includes('fire') || t.includes('inferno') || t.includes('vulcan') || t.includes('phoenix') || t.includes('heat') || t.includes('breath') || t.includes('blaze')) {
    return { rgb: '249, 115, 22', hex: '#f97316' }; // Flame Orange
  }
  if (t.includes('ice') || t.includes('frost') || t.includes('blizzard') || t.includes('arctic') || t.includes('water') || t.includes('ocean') || t.includes('valhalla') || t.includes('norse')) {
    return { rgb: '6, 182, 212', hex: '#06b6d4' }; // Frost Cyan / Runic Frost
  }
  if (t.includes('superconductor') || t.includes('kilowatt') || t.includes('electric') || t.includes('quantum')) {
    return { rgb: '14, 165, 233', hex: '#0ea5e9' }; // High Voltage Electric Blue
  }
  if (t.includes('toxic') || t.includes('hazard') || t.includes('atomic') || t.includes('gamma') || t.includes('emerald') || t.includes('green') || t.includes('zalupa')) {
    return { rgb: '34, 197, 94', hex: '#22c55e' }; // Toxic Biohazard Green
  }
  if (t.includes('anime') || t.includes('waifu') || t.includes('bubblegum') || t.includes('candy') || t.includes('rush')) {
    return { rgb: '244, 63, 94', hex: '#f43f5e' }; // Neon Waifu Pink
  }
  if (t.includes('doppler') || t.includes('galaxy') || t.includes('space') || t.includes('fantasy') || t.includes('odyssey') || t.includes('universe')) {
    return { rgb: '168, 85, 247', hex: '#a855f7' }; // Cosmic Purple
  }
  if (t.includes('cyber') || t.includes('neon') || t.includes('tokyo') || t.includes('matrix') || t.includes('glitch') || t.includes('samurai') || t.includes('ninja') || t.includes('synth') || t.includes('retro')) {
    return { rgb: '217, 70, 239', hex: '#d946ef' }; // Cyber Magenta
  }
  if (t.includes('sniper') || t.includes('stealth') || t.includes('tactical') || t.includes('military') || t.includes('scout')) {
    return { rgb: '52, 211, 153', hex: '#34d399' }; // Stealth Tactical Mint
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
    return { rgb: '147, 51, 234', hex: '#9333ea' }; // Knives Royalty Purple
  }

  // Price-based tiers for non-themed cases
  if (price >= 10000) {
    return { rgb: '147, 51, 234', hex: '#9333ea' }; // Rare Royalty Purple
  }
  if (price >= 3500) {
    return { rgb: '56, 189, 248', hex: '#38bdf8' }; // Classified Sky Blue
  }

  // Vanilla / Normal / Budget cases -> Crisp Studio White
  return { rgb: '255, 255, 255', hex: '#ffffff' };
}

export function getOptimizedCaseImageUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('/')) {
    return src.replace('.png', '.webp');
  }
  if (src.includes('steamstatic.com') || src.includes('akamaihd.net') || src.includes('steamcommunity')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=440&output=webp&q=82`;
  }
  return src;
}
