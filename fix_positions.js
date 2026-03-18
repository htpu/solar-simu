const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// 1. Remove getPlanetInitialAngle and add getPlanetAngle
code = code.replace(/function getPlanetInitialAngle\(period\) \{[\s\S]*?\}/, `function getPlanetAngle(period, j2000L0_deg, date) {
    if (!period) return 0;
    const daysSinceJ2000 = (date - J2000) / (1000 * 60 * 60 * 24);
    const L0_rad = (j2000L0_deg || 0) * (Math.PI / 180);
    return L0_rad + (daysSinceJ2000 / period) * 2 * Math.PI;
}`);

// 2. Change initial angle assignment in createPlanets
code = code.replace(/const initialAngle = data\.period \? getPlanetInitialAngle\(data\.period\) : 0;/, `const initialAngle = data.period ? getPlanetAngle(data.period, data.j2000L0, new Date()) : 0;`);

// 3. Update moon initial angles (if they have periods, but they just use speed right now. Wait, they don't have period!)
// We'll leave moons as is for initial angle, or they don't have one set currently.

// 4. Update animate function to calculate absolute rotation
// First, update daysToAdd to reflect years per second
code = code.replace(/const daysToAdd = spd \* \(1 \/ 60\);/, `const daysToAdd = spd * 365.25 * (1 / 60);`);

// 5. Remove incremental rotation in animate and use absolute
const oldRotationLoop = `        planets.forEach(p => {
            if (p.isMoon) return;
            if (!p.group) return;
            p.group.rotation.y += p.speed * spd * baseVelocityFactor;
            p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
        });`;

const newRotationLoop = `        planets.forEach(p => {
            if (!p.group || !p.mesh) return;
            const data = p.mesh.userData;
            if (p.isMoon) {
                // Moons still use incremental for now as they lack real periods in data
                p.group.rotation.y += p.speed * spd * baseVelocityFactor;
                p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
            } else if (data.period) {
                const absoluteAngle = getPlanetAngle(data.period, data.j2000L0, currentDate);
                p.group.rotation.y = absoluteAngle;
                // Spin the planet itself
                if (data.rotation) {
                    // Try to extract rotation days from text "23.9 hours" or "58.6 days"
                    let rotDays = 1;
                    if (typeof data.rotation === 'string') {
                        if (data.rotation.includes('hours')) rotDays = parseFloat(data.rotation) / 24;
                        else if (data.rotation.includes('days')) rotDays = parseFloat(data.rotation);
                    }
                    const rotSign = data.rotation.includes('retrograde') ? -1 : 1;
                    const daysSinceJ2000 = (currentDate - J2000) / (1000 * 60 * 60 * 24);
                    p.mesh.rotation.y = rotSign * (daysSinceJ2000 / rotDays) * 2 * Math.PI;
                } else {
                    p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
                }
            }
        });`;

code = code.replace(oldRotationLoop, newRotationLoop);

fs.writeFileSync('js/main.js', code);
console.log('done');
