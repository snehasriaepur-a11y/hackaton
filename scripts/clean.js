const { rmSync, existsSync } = require('fs');
const { join } = require('path');

const stale = join(__dirname, '..', 'frontend', '.next');
if (!existsSync(stale)) process.exit(0);

for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    rmSync(stale, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    process.exit(0);
  } catch {
    if (attempt === 4) process.exit(0);
  }
}
