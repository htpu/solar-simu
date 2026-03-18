const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Change default value from 3 (1 DAY/S) to 0 (1:1)
html = html.replace(/<input type="range" id="speedRange" min="0" max="7" step="1" value="3">/, '<input type="range" id="speedRange" min="0" max="7" step="1" value="0">');

// Bump version to 0.2.8
html = html.replace(/v0\.2\.7/g, 'v0.2.8');
html = html.replace(/js\/main\.js\?v=0\.2\.7/g, 'js/main.js?v=0.2.8');
html = html.replace(/css\/styles\.css\?v=0\.2\.7/g, 'css/styles.css?v=0.2.8');
html = html.replace(/<title>.*?<\/title>/g, '<title>3D Solar System - AI Digital Twin V0.2.8</title>');

fs.writeFileSync('index.html', html);

let spec = fs.readFileSync('SPEC.md', 'utf8');
spec = spec.replace(/v0\.2\.7/g, 'v0.2.8');
spec = spec.replace(/Version\*\*: 0\.2\.7/g, 'Version**: 0.2.8');
fs.writeFileSync('SPEC.md', spec);
