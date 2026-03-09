const fs = require('fs');
const path = require('path');

const replacements = [
  // gray.800 -> #161b22 (Card bg)
  { from: /useColorModeValue\((["'])(.*)(["']), (["'])gray\.800(["'])\)/g, to: 'useColorModeValue($1$2$3, $4#161b22$5)' },
  
  // gray.700 -> #30363d (Border/Secondary bg)
  { from: /useColorModeValue\((["'])(.*)(["']), (["'])gray\.700(["'])\)/g, to: 'useColorModeValue($1$2$3, $4#30363d$5)' },
  
  // gray.900 -> #0d1117 (Main bg)
  { from: /useColorModeValue\((["'])(.*)(["']), (["'])gray\.900(["'])\)/g, to: 'useColorModeValue($1$2$3, $4#0d1117$5)' },

  // gray.700/50 -> #30363d/50
  { from: /gray\.700\/50/g, to: '#31363f/50' },

  // Handle ternary operators
  { from: /colorMode === ("|')light("|') \? ("|')white("|') : ("|')gray\.800("|')/g, to: 'colorMode === $1light$2 ? $3white$4 : $5#161b22$6' },
  { from: /colorMode === ("|')light("|') \? ("|')gray\.900("|') : ("|')gray\.700("|')/g, to: 'colorMode === $1light$2 ? $3#161b22$4 : $5#1c2333$6' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      replacements.forEach(r => {
        content = content.replace(r.from, r.to);
      });
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

const targetDir = path.join(__dirname, 'src', 'page');
console.log(`Starting migration in ${targetDir}...`);
walk(targetDir);
console.log('Migration complete!');
