const fs = require('fs');
const content = fs.readFileSync('dist/index.html', 'utf8');
console.log(content);
