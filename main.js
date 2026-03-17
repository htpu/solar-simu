const fallbackApiKey = "";
let scene, camera, renderer, controls, raycaster;
let mouse = new THREE.Vector2();
let planets = [];
let currentAudio = null;
let hoveredObject = null;
let targetObject = null;
let timeCount = 0;
let uiElements = {};
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

const celestialData = [
    { name: "Mercury", size: 0.8, dist: 25, speed: 0.047, color: "#9e9e9e", incl: 7.0, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury.jpg" },
    { name: "Venus", size: 1.5, dist: 40, speed: 0.035, color: "#e3bb76", incl: 3.4, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus.jpg" },
    { name: "Earth", size: 1.6, dist: 60, speed: 0.029, color: "#2271b3", incl: 0, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth.jpg" },
    { name: "Mars", size: 1.2, dist: 80, speed: 0.024, color: "#e27b58", incl: 1.8, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars.jpg" },
    { name: "Jupiter", size: 4.5, dist: 130, speed: 0.013, color: "#d39c7e", incl: 1.3, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter.jpg" },
    { name: "Saturn", size: 3.8, dist: 180, speed: 0.009, color: "#c5ab6e", incl: 2.5, hasRings: true, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn.jpg", ringTexture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring.png" },
    { name: "Uranus", size: 2.5, dist: 230, speed: 0.006, color: "#bbe1e4", incl: 0.8, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg" },
    { name: "Neptune", size: 2.4, dist: 270, speed: 0.005, color: "#6081ff", incl: 1.8, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune.jpg" },
    { name: "Pluto", size: 0.6, dist: 310, speed: 0.004, color: "#937d64", incl: 17.2, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/pluto.jpg" }
];

const sunTextureUrl = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg";

function getActiveApiKey() {
    return uiElements.keyInput.value.trim() || fallbackApiKey;
}

function promptForKey() {
    const input = uiElements.keyInput;
    uiElements.aiStatus.innerText = "Error: [ACCESS DENIED] Please enter API Key in right panel.";
    uiElements.detailedBox.innerHTML = "<span class='text-red-400'>[NOTICE]</span><br>AI system not ready. Gemini API Key required for scan feature. Please enter key in 'Neural Link Config'.";
    uiElements.detailedBox.classList.remove('hidden');
    input.focus();
    input.classList.add('error-glow');
    setTimeout(() => input.classList.remove('error-glow'), 3000);
}

function generatePlanetTexture(baseColorHex) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, size, size);
    for(let i=0; i<2500; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
        ctx.beginPath(); ctx.arc(Math.random()*size, Math.random()*size, Math.random()*25, 0, Math.PI*2); ctx.fill();
    }
    for(let i=0; i<800; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
        ctx.beginPath(); ctx.arc(Math.random()*size, Math.random()*size, Math.random()*15, 0, Math.PI*2); ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

function init() {
    uiElements = {
        speedRange: document.getElementById('speedRange'),
        speedVal: document.getElementById('speedVal'),
        showOrbits: document.getElementById('showOrbits'),
        trueScale: document.getElementById('trueScale'),
        pauseRotation: document.getElementById('pauseRotation'),
        tooltip: document.getElementById('planet-tooltip'),
        ttName: document.getElementById('tt-name'),
        ttDist: document.getElementById('tt-dist'),
        aiStatus: document.getElementById('ai-status'),
        aiPulse: document.getElementById('ai-pulse'),
        detailedBox: document.getElementById('ai-detailed-box'),
        intelBtn: document.getElementById('ai-intel-btn'),
        audioBtn: document.getElementById('audio-btn'),
        keyInput: document.getElementById('apiKeyInput')
    };

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 450, 900);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    raycaster = new THREE.Raycaster();

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 6000);
    scene.add(sunLight);

    createStars();
    createMilkyWay();
    createSun();
    createPlanets();
    populateIndex();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onSceneClick);
    
    animate();
}

function loadTexture(url) {
    return textureLoader.load(url);
}

function createSun() {
    const sunGeo = new THREE.SphereGeometry(20, 64, 64);
    const texture = loadTexture(sunTextureUrl);
    const sunMat = new THREE.MeshBasicMaterial({ map: texture });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.userData = { name: "Sun", dist: 0, baseScale: 1.0 };
    scene.add(sun);
    planets.push({ mesh: sun, speed: 0, group: new THREE.Group() });
}

function createPlanets() {
    celestialData.forEach(data => {
        const orbitGroup = new THREE.Group();
        orbitGroup.rotation.z = THREE.MathUtils.degToRad(data.incl);
        scene.add(orbitGroup);

        const orbitLine = new THREE.Mesh(
            new THREE.TorusGeometry(data.dist, 0.08, 8, 160),
            new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.15 })
        );
        orbitLine.rotation.x = Math.PI / 2;
        orbitGroup.add(orbitLine);

        const texture = loadTexture(data.texture);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(data.size, 32, 32),
            new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 })
        );
        mesh.position.x = data.dist;
        mesh.userData = { name: data.name, dist: data.dist, baseScale: 1.0 };
        orbitGroup.add(mesh);

        if (data.hasRings) {
            const ringTexture = loadTexture(data.ringTexture);
            const r = new THREE.Mesh(
                new THREE.RingGeometry(data.size * 1.5, data.size * 2.8, 64),
                new THREE.MeshBasicMaterial({ 
                    map: ringTexture, 
                    side: THREE.DoubleSide, 
                    transparent: true, 
                    opacity: 0.6 
                })
            );
            r.rotation.x = Math.PI / 2;
            mesh.add(r);
        }
        planets.push({ mesh, group: orbitGroup, orbitLine, speed: data.speed });
    });
}

function createStars() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(12000 * 3);
    for (let i = 0; i < 12000; i++) {
        pos[i*3] = (Math.random()-0.5)*10000; pos[i*3+1] = (Math.random()-0.5)*10000; pos[i*3+2] = (Math.random()-0.5)*10000;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 })));
}

function createMilkyWay() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(30000 * 3);
    for (let i = 0; i < 30000; i++) {
        const a = Math.random()*Math.PI*2; const r = 1500 + Math.random()*3000;
        pos[i*3] = Math.cos(a)*r; pos[i*3+1] = (Math.random()-0.5)*500; pos[i*3+2] = Math.sin(a)*r;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x3355ff, size: 2, transparent: true, opacity: 0.1 })));
}

function populateIndex() {
    const container = document.getElementById('planet-btns');
    celestialData.forEach(d => {
        const btn = document.createElement('button');
        btn.className = 'btn-sci';
        btn.innerText = `[${d.name.toUpperCase()}]`;
        btn.onclick = () => jumpTo(d.name);
        container.appendChild(btn);
    });
}

function jumpTo(name) {
    targetObject = null;
    document.querySelectorAll('.btn-sci').forEach(b => b.classList.remove('active'));
    const found = planets.find(p => p.mesh.userData.name === name);
    if (found) {
        targetObject = found.mesh;
        const btn = Array.from(document.querySelectorAll('.btn-sci')).find(b => b.innerText.includes(name.toUpperCase()));
        if(btn) btn.classList.add('active');
    }
}

function resetView() { targetObject = null; controls.target.set(0, 0, 0); }
function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}
function onSceneClick() { if (hoveredObject) targetObject = hoveredObject; }

async function generateDetailedIntel() {
    const obj = hoveredObject || targetObject;
    const key = getActiveApiKey();
    if (!obj) return;
    if (!key) { promptForKey(); return; }

    uiElements.intelBtn.disabled = true; uiElements.intelBtn.innerText = "QUERYING...";
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;
        const res = await fetch(url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `High-level science briefing about ${obj.userData.name}. 100 words. English.` }] }] })
        }).then(r => r.json());
        const text = res.candidates[0].content.parts[0].text;
        uiElements.detailedBox.innerHTML = text.replace(/\n/g, '<br>');
        uiElements.detailedBox.classList.remove('hidden');
        uiElements.audioBtn.style.display = 'block';
        window.currentAiText = text;
        uiElements.aiStatus.innerText = `"Spectral sync complete. Analysis received."`;
    } catch(e) { uiElements.aiStatus.innerText = "Error: Signal lost. Verify your API Key."; }
    finally { uiElements.intelBtn.disabled = false; uiElements.intelBtn.innerText = "✨ SCAN DATA"; }
}

async function toggleAudio() {
    const key = getActiveApiKey();
    if (!key) { promptForKey(); return; }
    if (currentAudio && !currentAudio.paused) { currentAudio.pause(); currentAudio = null; uiElements.audioBtn.innerText = "🔊"; return; }
    uiElements.audioBtn.innerText = "⏳";
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
        const res = await fetch(url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: window.currentAiText }] }],
                generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } } },
                model: "gemini-2.5-flash-preview-tts"
            })
        }).then(r => r.json());
        const audioData = res.candidates[0].content.parts[0].inlineData.data;
        const binary = atob(audioData);
        const bytes = new Uint8Array(binary.length);
        for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const buffer = new ArrayBuffer(44 + bytes.length);
        const view = new DataView(buffer);
        const wStr = (o, s) => { for(let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
        wStr(0, 'RIFF'); view.setUint32(4, 36+bytes.length, true); wStr(8, 'WAVE'); wStr(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
        view.setUint32(24, 24000, true); view.setUint32(28, 48000, true);
        view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        wStr(36, 'data'); view.setUint32(40, bytes.length, true);
        for(let i=0; i<bytes.length; i++) view.setUint8(44+i, bytes[i]);
        currentAudio = new Audio(URL.createObjectURL(new Blob([buffer], {type:'audio/wav'})));
        currentAudio.play(); uiElements.audioBtn.innerText = "🛑";
        currentAudio.onended = () => uiElements.audioBtn.innerText = "🔊";
    } catch(e) { uiElements.audioBtn.innerText = "ERR"; }
}

function animate() {
    requestAnimationFrame(animate);
    if (!uiElements.speedRange) return;

    const baseVelocityFactor = 0.25; 
    const spd = parseFloat(uiElements.speedRange.value);
    uiElements.speedVal.innerText = spd.toFixed(1) + 'x';
    const paused = uiElements.pauseRotation.checked;
    const trueScale = uiElements.trueScale.checked;

    const keyPresent = getActiveApiKey() !== "";
    uiElements.aiPulse.innerText = keyPresent ? "ON" : "OFF";
    uiElements.aiPulse.style.color = keyPresent ? "var(--neon-cyan)" : "#666";

    if (!paused) {
        timeCount += 0.01 * spd * baseVelocityFactor;
        planets.forEach(p => {
            p.group.rotation.y += p.speed * spd * baseVelocityFactor;
            p.mesh.rotation.y += 0.01 * spd * baseVelocityFactor;
        });
    }

    planets.forEach(p => {
        const baseS = trueScale && p.mesh.userData.name !== "Sun" ? 0.4 : 1.0;
        p.mesh.scale.set(baseS, baseS, baseS);
        if (p.orbitLine) p.orbitLine.visible = uiElements.showOrbits.checked;
    });

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (hits.length > 0) {
        const obj = hits[0].object;
        if (hoveredObject !== obj) {
            hoveredObject = obj;
            uiElements.tooltip.style.display = 'block';
            uiElements.ttName.innerText = obj.userData.name.toUpperCase();
            uiElements.ttDist.innerText = `${(obj.userData.dist / 60).toFixed(2)} AU`;
            if(keyPresent) {
                uiElements.aiStatus.innerText = `"Neural Link Active: Focusing on ${obj.userData.name}."`;
            } else {
                uiElements.aiStatus.innerText = "Target Locked. AI Offline: Input API Key in Command Center.";
            }
        }
        const baseS = (trueScale && obj.userData.name !== "Sun") ? 0.4 : 1.0;
        const pulse = baseS * (1.1 + Math.sin(Date.now() * 0.005) * 0.05);
        obj.scale.set(pulse, pulse, pulse);
        
        uiElements.tooltip.style.left = (mouse.x * 0.5 + 0.5) * window.innerWidth + 20 + 'px';
        uiElements.tooltip.style.top = (-mouse.y * 0.5 + 0.5) * window.innerHeight - 80 + 'px';
    } else {
        hoveredObject = null;
        uiElements.tooltip.style.display = 'none';
    }

    if (targetObject) {
        const worldPos = new THREE.Vector3();
        targetObject.getWorldPosition(worldPos);
        controls.target.lerp(worldPos, 0.08);
        const radius = targetObject.geometry.parameters.radius || 1;
        const idealDist = radius * (trueScale && targetObject.userData.name !== "Sun" ? 30 : 12);
        const camDir = camera.position.clone().sub(worldPos).normalize().multiplyScalar(idealDist).add(worldPos);
        camera.position.lerp(camDir, 0.04);
    }

    controls.update();
    renderer.render(scene, camera);
}

window.onload = init;
