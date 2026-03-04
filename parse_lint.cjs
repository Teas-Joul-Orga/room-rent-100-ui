const fs = require('fs');
const report = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
let out = '';
report.forEach(file => {
  if (file.errorCount > 0 || file.warningCount > 0) {
    file.messages.forEach(m => {
      out += `${file.filePath}:${m.line} - ${m.message} (${m.ruleId})\n`;
    });
  }
});
fs.writeFileSync('lint_summary_clean.log', out);
console.log('Saved to lint_summary_clean.log');
