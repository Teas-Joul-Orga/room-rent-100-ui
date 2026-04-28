const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let replaced = content
        .replace(/\s*textTransform=["']uppercase["']/g, '')
        .replace(/\s*textTransform=\{\s*['"]uppercase['"]\s*\}/g, '')
        .replace(/\btextTransform:\s*['"]uppercase['"]\s*,?/g, '');
      if (content !== replaced) {
        fs.writeFileSync(fullPath, replaced);
        console.log('Updated ' + fullPath);
      }
    }
  }
}
walk('src');