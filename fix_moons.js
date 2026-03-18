const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// We want to move the moonGroup creation INSIDE the forEach loop
const badMoons = `        if (data.moons) {
            const moonGroup = new THREE.Group();
            mesh.add(moonGroup);
            data.moons.forEach(moonData => {
                const moonTexture = loadTextureWithFallback(moonData.texture, "#888888");
                const moonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(moonData.size, 16, 16),
                    new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 0.8 })
                );
                moonMesh.position.x = moonData.dist;
                moonMesh.userData = { name: moonData.name, isMoon: true, ...moonData };
                moonGroup.add(moonMesh);
                planets.push({ mesh: moonMesh, group: moonGroup, speed: moonData.speed, isMoon: true, parentPlanet: mesh });
            });
        }`;

const goodMoons = `        if (data.moons) {
            data.moons.forEach(moonData => {
                const moonGroup = new THREE.Group();
                mesh.add(moonGroup);
                
                // Add initial angle if period is present
                if (moonData.period) {
                    moonGroup.rotation.y = getPlanetAngle(moonData.period, moonData.j2000L0, new Date());
                } else {
                    moonGroup.rotation.y = Math.random() * 2 * Math.PI; // random start for unperiodized moons
                }

                const moonTexture = loadTextureWithFallback(moonData.texture, "#888888");
                const moonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(moonData.size, 16, 16),
                    new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 0.8 })
                );
                moonMesh.position.x = moonData.dist;
                moonMesh.userData = { name: moonData.name, isMoon: true, ...moonData };
                moonGroup.add(moonMesh);
                planets.push({ mesh: moonMesh, group: moonGroup, speed: moonData.speed, isMoon: true, parentPlanet: mesh });
            });
        }`;

code = code.replace(badMoons, goodMoons);

fs.writeFileSync('js/main.js', code);
console.log('done');
