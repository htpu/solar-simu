const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/v0\.2\.5/g, 'v0.2.6');
fs.writeFileSync('index.html', html);

let spec = fs.readFileSync('SPEC.md', 'utf8');
spec = spec.replace(/v0\.2\.5/g, 'v0.2.6');
spec = spec.replace(/Version\*\*: 0\.2\.5/g, 'Version**: 0.2.6');
fs.writeFileSync('SPEC.md', spec);
