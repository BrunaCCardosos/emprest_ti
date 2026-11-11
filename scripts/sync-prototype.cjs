const { copyFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const destination = path.join(root, 'public');
mkdirSync(destination, { recursive: true });
for (const name of ['app.js', 'style.css']) {
  copyFileSync(path.join(root, name), path.join(destination, name));
}
