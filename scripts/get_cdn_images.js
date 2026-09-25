const https = require('https');

const items = [
  'Gallery Case',
  'Kilowatt Case',
  'Sealed Genesis Terminal',
  'Sealed Dead Hand Terminal'
];

async function fetchImg(name) {
  return new Promise((resolve) => {
    const url = 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(name);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/economy\/image\/([a-zA-Z0-9_\-]+)/g);
        resolve({ name, img: matches ? matches.slice(0, 3) : null });
      });
    }).on('error', e => resolve({ name, error: e.message }));
  });
}

(async () => {
  for (const item of items) {
    const res = await fetchImg(item);
    console.log(JSON.stringify(res));
  }
})();
