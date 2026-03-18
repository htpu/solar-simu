const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

code = code.replace(/function getPlanetAngle\(period, j2000L0_deg, date\) \{[\s\S]*?\}/, `function getPlanetAngle(period, j2000L0_deg, date) {
    if (!period) return 0;
    const daysSinceJ2000 = (date - J2000) / (1000 * 60 * 60 * 24);
    const L0_rad = (j2000L0_deg || 0) * (Math.PI / 180);
    const orbits = daysSinceJ2000 / period;
    const fractionalOrbit = orbits - Math.floor(orbits);
    return L0_rad + fractionalOrbit * 2 * Math.PI;
}`);

code = code.replace(/const daysSinceJ2000 = \(currentDate - J2000\) \/ \(1000 \* 60 \* 60 \* 24\);\s+p\.mesh\.rotation\.y = rotSign \* \(daysSinceJ2000 \/ rotDays\) \* 2 \* Math\.PI;/, `const daysSinceJ2000 = (currentDate - J2000) / (1000 * 60 * 60 * 24);
                    const orbits = daysSinceJ2000 / rotDays;
                    const fractionalOrbit = orbits - Math.floor(orbits);
                    p.mesh.rotation.y = rotSign * fractionalOrbit * 2 * Math.PI;`);

fs.writeFileSync('js/main.js', code);
console.log('done');
