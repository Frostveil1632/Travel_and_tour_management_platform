// build.js - copies the static site into dist/ (this folder is what gets deployed)
const fs = require('fs');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');

fs.readdirSync('.')
  .filter(name => name.endsWith('.html') || name.endsWith('.css'))
  .forEach(name => fs.copyFileSync(name, 'dist/' + name));

fs.cpSync('js', 'dist/js', { recursive: true });
fs.cpSync('data', 'dist/data', { recursive: true });

console.log('Built static site into dist/');
