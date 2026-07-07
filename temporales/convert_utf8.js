const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'issues.json');
const content = fs.readFileSync(filePath, 'utf16le');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Conversion to UTF-8 complete.');
