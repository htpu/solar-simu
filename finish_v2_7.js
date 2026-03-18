const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/v0\.2\.6/g, 'v0.2.7');
html = html.replace(/js\/main\.js\?v=0\.2\.6/g, 'js/main.js?v=0.2.7');
html = html.replace(/css\/styles\.css\?v=0\.2\.6/g, 'css/styles.css?v=0.2.7');
html = html.replace(/<title>.*?<\/title>/g, '<title>3D Solar System - AI Digital Twin V0.2.7</title>');

fs.writeFileSync('index.html', html);

let spec = fs.readFileSync('SPEC.md', 'utf8');
spec = spec.replace(/v0\.2\.6/g, 'v0.2.7');
spec = spec.replace(/Version\*\*: 0\.2\.6/g, 'Version**: 0.2.7');
fs.writeFileSync('SPEC.md', spec);
