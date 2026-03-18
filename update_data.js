const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// The replacement script to add real data

const replacements = {
    '"Mercury"': { mass: "3.30 × 10²³ kg", diameter: "4,880 km", rotation: "58.6 days", realPeriod: "88 days" },
    '"Venus"': { mass: "4.87 × 10²⁴ kg", diameter: "12,104 km", rotation: "243 days (retrograde)", realPeriod: "225 days" },
    '"Earth"': { mass: "5.97 × 10²⁴ kg", diameter: "12,742 km", rotation: "23.9 hours", realPeriod: "365.25 days" },
    '"Moon"': { mass: "7.34 × 10²² kg", diameter: "3,474 km", rotation: "27.3 days", realPeriod: "27.3 days" },
    '"Mars"': { mass: "6.42 × 10²³ kg", diameter: "6,779 km", rotation: "24.6 hours", realPeriod: "687 days" },
    '"Phobos"': { mass: "1.06 × 10¹⁶ kg", diameter: "22.4 km", rotation: "7.66 hours", realPeriod: "7.66 hours" },
    '"Deimos"': { mass: "1.48 × 10¹⁵ kg", diameter: "12.4 km", rotation: "30.3 hours", realPeriod: "30.3 hours" },
    '"Jupiter"': { mass: "1.89 × 10²⁷ kg", diameter: "139,820 km", rotation: "9.9 hours", realPeriod: "11.86 years" },
    '"Io"': { mass: "8.93 × 10²² kg", diameter: "3,643 km", rotation: "1.77 days", realPeriod: "1.77 days" },
    '"Europa"': { mass: "4.80 × 10²² kg", diameter: "3,121 km", rotation: "3.55 days", realPeriod: "3.55 days" },
    '"Ganymede"': { mass: "1.48 × 10²³ kg", diameter: "5,268 km", rotation: "7.15 days", realPeriod: "7.15 days" },
    '"Callisto"': { mass: "1.07 × 10²³ kg", diameter: "4,820 km", rotation: "16.68 days", realPeriod: "16.68 days" },
    '"Saturn"': { mass: "5.68 × 10²⁶ kg", diameter: "116,460 km", rotation: "10.7 hours", realPeriod: "29.45 years" },
    '"Titan"': { mass: "1.34 × 10²³ kg", diameter: "5,149 km", rotation: "15.94 days", realPeriod: "15.94 days" },
    '"Enceladus"': { mass: "1.08 × 10²⁰ kg", diameter: "504 km", rotation: "1.37 days", realPeriod: "1.37 days" },
    '"Uranus"': { mass: "8.68 × 10²⁵ kg", diameter: "50,724 km", rotation: "17.2 hours (retrograde)", realPeriod: "84 years" },
    '"Titania"': { mass: "3.40 × 10²¹ kg", diameter: "1,576 km", rotation: "8.7 days", realPeriod: "8.7 days" },
    '"Oberon"': { mass: "3.01 × 10²¹ kg", diameter: "1,522 km", rotation: "13.46 days", realPeriod: "13.46 days" },
    '"Neptune"': { mass: "1.02 × 10²⁶ kg", diameter: "49,244 km", rotation: "16.1 hours", realPeriod: "164.8 years" },
    '"Triton"': { mass: "2.14 × 10²² kg", diameter: "2,706 km", rotation: "5.87 days (retrograde)", realPeriod: "5.87 days (retrograde)" },
    '"Pluto"': { mass: "1.30 × 10²² kg", diameter: "2,376 km", rotation: "6.38 days (retrograde)", realPeriod: "248 years" },
    '"Charon"': { mass: "1.58 × 10²¹ kg", diameter: "1,212 km", rotation: "6.38 days", realPeriod: "6.38 days" }
};

for (const [name, data] of Object.entries(replacements)) {
    const extraFields = `, mass: "${data.mass}", diameter: "${data.diameter}", rotation: "${data.rotation}", realPeriod: "${data.realPeriod}"`;
    // We want to insert these fields inside the object where name: "..." is found.
    const regex = new RegExp(`name:\\s*${name}(?!\\w)`, 'g');
    
    // Instead of simple replacement which might break other structures,
    // let's replace `name: "Mercury"` with `name: "Mercury", mass: "...", diameter: "...", ...`
    code = code.replace(regex, `name: ${name}${extraFields}`);
}

fs.writeFileSync('js/main.js', code);
console.log('done');
