const https = require('https');
const fs = require('fs');

const skinQueries = [
  // Gallery Case
  'M4A1-S | Vaporwave',
  'Glock-18 | Gold Toof',
  'AK-47 | The Outsiders',
  'UMP-45 | Neo-Noir',
  'P250 | Epicenter',
  'SSG 08 | Rapid Transit',
  'MAC-10 | Saibā Oni',
  'M4A4 | Turbine',
  'Dual Berettas | Hydro Strike',
  'P90 | Randy Rush',
  'USP-S | 27',
  'Desert Eagle | Calligraffiti',
  'AUG | Luxe Trim',
  'SCAR-20 | Trail Blazer',
  'R8 Revolver | Tango',
  'MP5-SD | Statics',
  'M249 | Hypnosis',
  // Fever Case
  'AWP | Printstream',
  'FAMAS | Bad Trip',
  'AK-47 | Searing Rage',
  'Glock-18 | Shinobu',
  'UMP-45 | K.O. Factory',
  'Desert Eagle | Serpent Strike',
  'Galil AR | Control',
  'Nova | Rising Sun',
  'P90 | Wave Breaker',
  'Zeus x27 | Tosai',
  'M4A4 | Choppa',
  'MAG-7 | Resupply',
  'MP9 | Nexus',
  'P2000 | Sure Grip',
  'SSG 08 | Memorial',
  'USP-S | PC-GRN',
  // Overpass 2024
  'AK-47 | B the Monster',
  'Zeus x27 | Dragon Snore',
  'AWP | Crakow!',
  'XM1014 | Monster Melt',
  'Dual Berettas | Sweet Little Angels',
  'AUG | Eye of Zapems',
  'MAC-10 | Pipsqueak',
  'Nova | Wurst Hölle',
  'Glock-18 | Teal Graf',
  'MP5-SD | Neon Squeezer',
  // Sport & Field
  'M4A1-S | Fade',
  'Glock-18 | AXIA',
  'Galil AR | Rainbow Spoon',
  'UMP-45 | Crimson Foil',
  'Five-SeveN | Heat Treated',
  'MP9 | Arctic Tri-Tone',
  'USP-S | Alpine Camo',
  'SSG 08 | Zeno',
  // Graphic Collection
  'AWP | CMYK',
  'Desert Eagle | Starcade',
  'AUG | Lil\' Pig',
  'M4A4 | Polysoup',
  'P90 | Attack Vector',
  'CZ75-Auto | Slalom',
  'XM1014 | Halftone Shift',
  // Genesis Terminal
  'AK-47 | The Oligarch',
  'M4A4 | Full Throttle',
  'AWP | Ice Coaled',
  'Glock-18 | Mirror Mosaic',
  'MP7 | Smoking Kills',
  'M4A1-S | Liquidation',
  'UMP-45 | Continuum',
  'MAC-10 | Cat Fight',
  // Dead Hand Terminal
  'AWP | Queen\'s Gambit',
  'Glock-18 | Fully Tuned',
  'AK-47 | Crane Flight',
  'P90 | Deathgaze',
  'P250 | Kintsugi',
  'Desert Eagle | Firebreathing',
  'Galil AR | Galigator',
  'M4A1-S | Electrum',
  'Sport Gloves | Blaze',
  'Specialist Gloves | Big Swell'
];

function fetchSkin(q) {
  return new Promise((resolve) => {
    const url = 'https://steamcommunity.com/market/search/render/?query=' + encodeURIComponent(q) + '&start=0&count=3&norender=1';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const item = j.results?.find(r => r.name.toLowerCase().includes(q.toLowerCase())) || j.results?.[0];
          if (item) {
            const icon = 'https://community.cloudflare.steamstatic.com/economy/image/' + (item.asset_description?.icon_url_large || item.asset_description?.icon_url);
            const price = Math.round((item.sell_price || 100) / 100 * 85);
            resolve({ query: q, name: item.name, icon, priceDc: Math.max(120, price * 10) });
          } else {
            resolve({ query: q, notFound: true });
          }
        } catch(e) {
          resolve({ query: q, error: e.message });
        }
      });
    }).on('error', e => resolve({ query: q, error: e.message }));
  });
}

(async () => {
  const skinsMap = {};
  for (let i = 0; i < skinQueries.length; i++) {
    const q = skinQueries[i];
    const data = await fetchSkin(q);
    skinsMap[q] = data;
    console.log(`[${i+1}/${skinQueries.length}] ${q} -> ${data.icon ? 'OK' : 'MISSING'}`);
    await new Promise(r => setTimeout(r, 450));
  }
  fs.writeFileSync('scripts/fetched_skins.json', JSON.stringify(skinsMap, null, 2));
  console.log('Saved to scripts/fetched_skins.json');
})();
