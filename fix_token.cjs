const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  content = content.replace(/localStorage\.getItem\("token"\)/g, '(localStorage.getItem("token") || sessionStorage.getItem("token"))');
  content = content.replace(/localStorage\.getItem\('token'\)/g, "(localStorage.getItem('token') || sessionStorage.getItem('token'))");
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
});
console.log('Modified ' + count + ' files.');
