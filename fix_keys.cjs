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
const keys = ['isLoggedIn', 'user', 'role', 'currency', 'exchangeRate'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  keys.forEach(key => {
    const regex1 = new RegExp('localStorage\\.getItem\\("' + key + '"\\)', 'g');
    const regex2 = new RegExp("localStorage\\.getItem\\('" + key + "'\\)", 'g');
    content = content.replace(regex1, '(localStorage.getItem("' + key + '") || sessionStorage.getItem("' + key + '"))');
    content = content.replace(regex2, "(localStorage.getItem('" + key + "') || sessionStorage.getItem('" + key + "'))");
  });
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
});
console.log('Modified ' + count + ' files.');