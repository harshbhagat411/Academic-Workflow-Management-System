const fs = require('fs');
const { execSync } = require('child_process');

try {
  execSync('node server.js', { encoding: 'utf-8' });
} catch (e) {
  fs.writeFileSync('crash.log', e.stderr, 'utf-8');
}
