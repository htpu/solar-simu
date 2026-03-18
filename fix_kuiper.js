const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const createPlanetsCall = `    createSun();
    createPlanets();
    populateIndex();`;

const createPlanetsWithKuiper = `    createSun();
    createPlanets();
    createKuiperBelt();
    populateIndex();`;

code = code.replace(createPlanetsCall, createPlanetsWithKuiper);

const createKuiperBeltFunc = `
function createKuiperBelt() {
    const kuiperGroup = new THREE.Group();
    scene.add(kuiperGroup);
    
    const count = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Kuiper Belt parameters
    // Scale matching Pluto's 310 dist, extending to ~400
    const innerRadius = 300;
    const outerRadius = 450;
    
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
        // Random distribution with density falling off
        const radius = innerRadius + Math.random() * Math.random() * (outerRadius - innerRadius);
        const theta = Math.random() * Math.PI * 2;
        
        // Inclination
        // Kuiper belt is somewhat thick (up to 30 deg inclination, usually less)
        const maxInclination = (15 * Math.PI) / 180;
        const phi = (Math.random() - 0.5) * maxInclination * (radius / innerRadius);
        
        positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
        positions[i * 3 + 1] = radius * Math.sin(phi);
        positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
        
        // Icey grayish colors
        const lightness = 0.4 + Math.random() * 0.4;
        color.setHSL(0.6, 0.1, lightness);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        sizes[i] = Math.random() * 1.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // We don't have custom size attribute support in basic material easily,
    // so we'll just use a uniform size PointsMaterial
    const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    kuiperGroup.add(particles);
    
    // Push a dummy object to animate it slowly
    planets.push({ mesh: particles, group: kuiperGroup, speed: 0.001, isBelt: true });
}
`;

code = code.replace(/function createPlanets\(\) \{/, createKuiperBeltFunc + '\nfunction createPlanets() {');

// Prevent raycaster from hitting belt
const badHits = `        const hits = raycaster.intersectObjects(planets.map(p => p.mesh));`;
const goodHits = `        // Filter out belt/particle systems which might not have normal meshes
        const raycastableMeshes = planets
            .filter(p => p.mesh && !p.isBelt)
            .map(p => p.mesh);
        const hits = raycaster.intersectObjects(raycastableMeshes);`;

code = code.replace(badHits, goodHits); // first occurrence in onSceneClick
code = code.replace(badHits, goodHits); // second occurrence in animate

// Also fix animate to rotate belt
const animReplace = `            if (p.isMoon) {
                if (data.period) {
                    p.group.rotation.y = getPlanetAngle(data.period, data.j2000L0, currentDate);
                } else {
                    p.group.rotation.y += p.speed * spd * baseVelocityFactor;
                }
                p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
            } else if (data.period) {`;

const animNew = `            if (p.isBelt) {
                p.group.rotation.y -= p.speed * spd * baseVelocityFactor * 0.1; // slow retrograde
                return;
            }
            if (p.isMoon) {
                if (data.period) {
                    p.group.rotation.y = getPlanetAngle(data.period, data.j2000L0, currentDate);
                } else {
                    p.group.rotation.y += p.speed * spd * baseVelocityFactor;
                }
                p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
            } else if (data && data.period) {`;

code = code.replace(animReplace, animNew);

fs.writeFileSync('js/main.js', code);
console.log('done');
