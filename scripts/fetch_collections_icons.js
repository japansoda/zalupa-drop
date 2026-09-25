const https = require('https');

const queries = [
  'The Overpass 2024 Collection',
  'The Sport & Field Collection',
  'The Graphic Collection',
  'The Spy Tech Collection',
  'The Arabesque Collection',
  'Heat Treated'
];

function querySteam(q) {
  return new Promise((resolve) => {
    const url = 'https://steamcommunity.com/market/search/render/?query=' + encodeURIComponent(q) + '&start=0&count=5&norender=1';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const item = j.results?.find(r => r.name.toLowerCase().includes(q.toLowerCase())) || j.results?.[0];
          if (item) {
            const icon = 'https://community.cloudflare.steamstatic.com/economy/image/' + (item.asset_description?.icon_url_large || item.asset_description?.icon_url);
            resolve({ query: q, name: item.name, icon });
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
  for (const q of queries) {
    const res = await querySteam(q);
    console.log(JSON.stringify(res));
    await new Promise(r => setTimeout(r, 600));
  }
})();
