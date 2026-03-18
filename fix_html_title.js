const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<title>.*?<\/title>/g, '<title>3D Solar System - AI Digital Twin V0.2.6</title>');
html = html.replace(/js\/main\.js\?v=0\.2\.5/g, 'js/main.js?v=0.2.6');
html = html.replace(/css\/styles\.css\?v=0\.2\.5/g, 'css/styles.css?v=0.2.6');

fs.writeFileSync('index.html', html);
