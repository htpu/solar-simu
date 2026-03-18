// Script to calculate and inject J2000 longitudes into celestialData
const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const longitudes = {
    '"Mercury"': 252.25,
    '"Venus"': 181.98,
    '"Earth"': 100.46,
    '"Moon"': 125.08, // arbitrary for now
    '"Mars"': 355.45,
    '"Jupiter"': 34.40,
    '"Saturn"': 49.94,
    '"Uranus"': 313.23,
    '"Neptune"': 304.88,
    '"Pluto"': 238.92
};

for (const [name, lon] of Object.entries(longitudes)) {
    const regex = new RegExp(`name:\\s*${name}(?!\\w)`, 'g');
    code = code.replace(regex, `name: ${name}, j2000L0: ${lon}`);
}

fs.writeFileSync('js/main.js', code);
console.log('done');
