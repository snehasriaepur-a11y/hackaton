const { rmSync, existsSync } = require('fs');
const { join } = require('path');

const stale = join(__dirname, '..', 'frontend', '.next');
const target = process.argv[2];

if (!existsSync(stale)) {
  if (target === 'force') console.log('[clean] nothing to remove');
  process.exit(0);
}

for (let attempt = 0; attempt < 4; attempt += 1) {
  try {
    rmSync(stale, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    if (target === 'force') console.log('[clean] removed frontend/.next');
    process.exit(0);
  } catch (err) {
    if (attempt === 3) {
      console.warn('[clean] could not remove frontend/.next:', err.code || err.message);
      process.exit(0);
    }
  }
}
