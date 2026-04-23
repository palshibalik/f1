const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
let out = '';
data.forEach(file => {
  if (file.errorCount > 0 || file.warningCount > 0) {
    out += `\n${file.filePath}\n`;
    file.messages.forEach(msg => {
      out += `  Line ${msg.line}: ${msg.message} (${msg.ruleId})\n`;
    });
  }
});
fs.writeFileSync('eslint-summary.txt', out, 'utf8');
