const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const badMoonAnim = `            if (p.isMoon) {
                // Moons still use incremental for now as they lack real periods in data
                p.group.rotation.y += p.speed * spd * baseVelocityFactor;
                p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
            }`;

const goodMoonAnim = `            if (p.isMoon) {
                if (data.period) {
                    p.group.rotation.y = getPlanetAngle(data.period, data.j2000L0, currentDate);
                } else {
                    p.group.rotation.y += p.speed * spd * baseVelocityFactor;
                }
                p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
            }`;

code = code.replace(badMoonAnim, goodMoonAnim);
fs.writeFileSync('js/main.js', code);
console.log('done');
