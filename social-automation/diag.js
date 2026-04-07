const fs = require('fs');
const f = fs.readFileSync('social-automation/workflows/workflow-content-publishing.json', 'utf8');
let inStr = false;
let esc = false;
for (let i = 0; i < f.length; i++) {
  const c = f[i];
  if (esc) { esc = false; continue; }
  if (c === '\\') { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (!inStr) {
    const valid = ':,{}[] \n\r\t'.includes(c) || c === 'n' || c === 't' || c === 'f' || c === 'u' || (c >= '0' && c <= '9') || c === '.' || c === '-' || c === '+' || c === 'e' || c === 'E';
    if (!valid) {
      console.log('Unexpected char at pos', i, ':', JSON.stringify(c), 'charCode:', c.charCodeAt(0));
      console.log('Context:', JSON.stringify(f.substring(i - 40, i + 40)));
      break;
    }
  }
}
console.log('Scan complete');
