#!/usr/bin/env node
import { syncAllSkins } from '../src/lib/steamSync.js';

console.log('[SteamSync CLI] Running catalog sync...');
syncAllSkins(false)
  .then(stats => {
    console.log('[SteamSync CLI] Completed successfully:', stats);
    process.exit(0);
  })
  .catch(err => {
    console.error('[SteamSync CLI] Error:', err);
    process.exit(1);
  });
