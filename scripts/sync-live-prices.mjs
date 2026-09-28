import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncPrices() {
  console.log('Fetching live CS2 market prices from Skinport API...');
  const res = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=USD', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const items = await res.json();
  const pricesMap = {};

  for (const item of items) {
    const usd = item.suggested_price || item.min_price || item.median_price || 0;
    if (usd > 0 && item.market_hash_name) {
      pricesMap[item.market_hash_name] = Math.max(1, Math.round(usd * 100));
    }
  }

  const targetPath = path.resolve(__dirname, '../src/data/live_market_prices.json');
  fs.writeFileSync(targetPath, JSON.stringify(pricesMap));
  console.log(`Saved ${Object.keys(pricesMap).length} real live CS2 prices to ${targetPath}`);
}

syncPrices().catch(err => {
  console.error('Error syncing prices:', err);
  process.exit(1);
});
