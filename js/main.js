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

let currentDate = new Date();
let isManualTimeControl = false;
let timelineMode = 'auto';

const astronomicalEvents = [
    { year: 1054, month: 7, day: 4, name: "Supernova SN 1054 (Crab Nebula)", type: "supernova" },
    { year: 1543, month: 1, day: 1, name: "Copernicus: De revolutionibus", type: "publication" },
    { year: 1572, month: 11, day: 11, name: "Tycho's Supernova", type: "supernova" },
    { year: 1609, month: 1, day: 1, name: "Kepler's Laws", type: "discovery" },
    { year: 1610, month: 1, day: 1, name: "Galileo's Moons of Jupiter", type: "discovery" },
    { year: 1687, month: 7, day: 5, name: "Newton: Principia", type: "publication" },
    { year: 1758, month: 12, day: 25, name: "Halley's Comet predicted", type: "comet" },
    { year: 1781, month: 3, day: 13, name: "Discovery of Uranus", type: "planet" },
    { year: 1839, month: 1, day: 1, name: "First photograph of Sun", type: "photo" },
    { year: 1846, month: 9, day: 23, name: "Discovery of Neptune", type: "planet" },
    { year: 1868, month: 10, day: 20, name: "Discovery of Helium", type: "element" },
    { year: 1908, month: 6, day: 30, name: "Tunguska Event", type: "impact" },
    { year: 1915, month: 11, day: 25, name: "Einstein: General Relativity", type: "publication" },
    { year: 1928, month: 1, day: 1, name: "Discovery of Pluto", type: "planet" },
    { year: 1957, month: 10, day: 4, name: "Sputnik 1 launched", type: "spacecraft" },
    { year: 1961, month: 4, day: 12, name: "Yuri Gagarin: First human in space", type: "spacecraft" },
    { year: 1969, month: 7, day: 20, name: "Apollo 11: Moon landing", type: "spacecraft" },
    { year: 1977, month: 9, day: 5, name: "Voyager 1 launched", type: "spacecraft" },
    { year: 1986, month: 3, day: 9, name: "Halley's Comet closest approach", type: "comet" },
    { year: 1990, month: 4, day: 24, name: "Hubble Space Telescope", type: "spacecraft" },
    { year: 1997, month: 7, day: 4, name: "Mars Pathfinder", type: "spacecraft" },
    { year: 2006, month: 8, day: 24, name: "Pluto reclassified", type: "classification" },
    { year: 2012, month: 8, day: 6, name: "Curiosity: Mars landing", type: "spacecraft" },
    { year: 2015, month: 7, day: 14, name: "New Horizons: Pluto flyby", type: "spacecraft" },
    { year: 2019, month: 1, day: 1, name: "Voyager 2: Interstellar", type: "spacecraft" },
    { year: 2020, month: 7, day: 30, name: "Perseverance launch", type: "spacecraft" },
    { year: 2021, month: 2, day: 18, name: "Perseverance: Mars flight", type: "spacecraft" },
];

const orbitalElements = {
    Mercury: { a: 0.387, e: 0.2056, i: 7.0, L: 252.25, w: 77.46, node: 48.33, period: 87.97 },
    Venus: { a: 0.723, e: 0.0068, i: 3.39, L: 181.98, w: 131.53, node: 76.68, period: 224.7 },
    Earth: { a: 1.0, e: 0.0167, i: 0.0, L: 100.46, w: 102.95, node: 0.0, period: 365.25 },
    Mars: { a: 1.524, e: 0.0934, i: 1.85, L: 355.45, w: 336.04, node: 49.58, period: 687.0 },
    Jupiter: { a: 5.203, e: 0.0489, i: 1.3, L: 34.33, w: 14.75, node: 100.56, period: 4333 },
    Saturn: { a: 9.537, e: 0.0565, i: 2.48, L: 49.94, w: 92.43, node: 113.71, period: 10759 },
    Uranus: { a: 19.19, e: 0.0457, i: 0.77, L: 313.23, w: 170.96, node: 74.0, period: 30687 },
    Neptune: { a: 30.07, e: 0.0113, i: 1.77, L: 304.88, w: 44.97, node: 131.72, period: 60190 },
    Pluto: { a: 39.48, e: 0.2488, i: 17.16, L: 14.85, w: 224.27, node: 110.3, period: 90560 }
};

function julianDate(date) {
    return (date.getTime() / 86400000) + 2440587.5;
}

function calculatePlanetPosition(name, jd) {
    const oe = orbitalElements[name];
    if (!oe) return { x: 0, z: 0 };
    
    if (isNaN(jd) || !isFinite(jd)) return { x: 0, z: 0 };
    
    const T = (jd - 2451545.0) / 36525;
    
    let M = oe.L + 36000.77 * T;
    M = (M % 360 + 360) % 360;
    
    const M_rad = M * Math.PI / 180;
    let E = M_rad;
    for (let i = 0; i < 5; i++) {
        E = M_rad + oe.e * Math.sin(E);
    }
    
    const xv = oe.a * (Math.cos(E) - oe.e);
    const yv = oe.a * Math.sqrt(1 - oe.e * oe.e) * Math.sin(E);
    
    let v = Math.atan2(yv, xv);
    let r = Math.sqrt(xv * xv + yv * yv);
    
    let N = oe.node * Math.PI / 180;
    let i = oe.i * Math.PI / 180;
    let w = oe.w * Math.PI / 180;
    
    let x = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
    let z = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
    
    return { x, z };
}

function getTimelineDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function initTimeline() {
    const yearSelect = document.getElementById('timeline-year');
    const monthSelect = document.getElementById('timeline-month');
    const daySelect = document.getElementById('timeline-day');
    const hourSelect = document.getElementById('timeline-hour');
    const minuteSelect = document.getElementById('timeline-minute');
    
    for (let y = 1; y <= 3000; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }
    
    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = String(m).padStart(2, '0');
        monthSelect.appendChild(opt);
    }
    
    for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = String(d).padStart(2, '0');
        daySelect.appendChild(opt);
    }
    
    for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = String(h).padStart(2, '0');
        hourSelect.appendChild(opt);
    }
    
    for (let m = 0; m < 60; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = String(m).padStart(2, '0');
        minuteSelect.appendChild(opt);
    }
    
    function updateFromDate() {
        yearSelect.value = currentDate.getFullYear();
        monthSelect.value = currentDate.getMonth() + 1;
        daySelect.value = currentDate.getDate();
        hourSelect.value = currentDate.getHours();
        minuteSelect.value = currentDate.getMinutes();
        
        document.getElementById('timeline-date').textContent = getTimelineDateString(currentDate);
        if (uiElements.simTimeValue) {
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentDate.getDate()).padStart(2, '0');
            uiElements.simTimeValue.textContent = `${y}-${m}-${d}`;
        }
        updateTimelinePosition();
    }
    
    function updateTimelineUI() {
        if (timelineMode !== 'auto') return;
        
        let year = currentDate.getFullYear();
        if (year < 1) year = 1;
        if (year > 3000) year = 3000;
        
        yearSelect.value = year;
        monthSelect.value = currentDate.getMonth() + 1;
        daySelect.value = currentDate.getDate();
        hourSelect.value = currentDate.getHours();
        minuteSelect.value = currentDate.getMinutes();
        
        document.getElementById('timeline-date').textContent = getTimelineDateString(currentDate);
        updateTimelinePosition();
    }
    
    yearSelect.addEventListener('change', () => {
        timelineMode = 'manual';
        currentDate.setFullYear(parseInt(yearSelect.value));
        updateFromDate();
    });
    
    monthSelect.addEventListener('change', () => {
        timelineMode = 'manual';
        currentDate.setMonth(parseInt(monthSelect.value) - 1);
        updateFromDate();
    });
    
    daySelect.addEventListener('change', () => {
        timelineMode = 'manual';
        currentDate.setDate(parseInt(daySelect.value));
        updateFromDate();
    });
    
    hourSelect.addEventListener('change', () => {
        timelineMode = 'manual';
        currentDate.setHours(parseInt(hourSelect.value));
        updateFromDate();
    });
    
    minuteSelect.addEventListener('change', () => {
        timelineMode = 'manual';
        currentDate.setMinutes(parseInt(minuteSelect.value));
        updateFromDate();
    });
    
    const track = document.getElementById('timeline-track');
    let isDragging = false;
    
    if (track) {
        track.addEventListener('mousedown', (e) => {
        isDragging = true;
        timelineMode = 'manual';
        handleTimelineClick(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) handleTimelineClick(e);
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    }
    
    function handleTimelineClick(e) {
        timelineMode = 'manual';
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const year = Math.round(x * 2999) + 1;
        currentDate.setFullYear(year);
        updateFromDate();
    }
    
    function updateTimelinePosition() {
        const year = currentDate.getFullYear();
        const progress = (year - 1) / 2999 * 100;
        document.getElementById('timeline-progress').style.width = progress + '%';
        document.getElementById('timeline-cursor').style.left = progress + '%';
    }
    
    function createEventMarkers() {
        const container = document.getElementById('event-markers');
        astronomicalEvents.forEach(event => {
            const pos = (event.year - 1) / 2999 * 100;
            const marker = document.createElement('div');
            marker.className = 'timeline-event-dot';
            marker.style.left = pos + '%';
            marker.title = event.name;
            marker.addEventListener('click', () => {
                timelineMode = 'manual';
                currentDate.setFullYear(event.year);
                currentDate.setMonth(event.month - 1);
                currentDate.setDate(event.day);
                currentDate.setHours(12);
                updateFromDate();
            });
            container.appendChild(marker);
        });
        
        const eventsList = document.getElementById('timeline-events');
        astronomicalEvents.forEach(event => {
            const div = document.createElement('div');
            div.textContent = `${event.year}: ${event.name}`;
            div.className = 'cursor-pointer hover:text-cyan-400';
            div.addEventListener('click', () => {
                timelineMode = 'manual';
                currentDate.setFullYear(event.year);
                currentDate.setMonth(event.month - 1);
                currentDate.setDate(event.day);
                currentDate.setHours(12);
                updateFromDate();
            });
            eventsList.appendChild(div);
        });
    }
    
    createEventMarkers();
    updateFromDate();
}

const celestialData = [
    { name: "Mercury", size: 0.8, dist: 25, speed: 0.047, period: 88, color: "#9e9e9e", incl: 7.0, texture: "textures/mercury.jpg" },
    { name: "Venus", size: 1.5, dist: 40, speed: 0.035, period: 225, color: "#e3bb76", incl: 3.4, texture: "textures/venus_surface.jpg" },
    { name: "Earth", size: 1.6, dist: 60, speed: 0.029, period: 365.25, color: "#2271b3", incl: 0, texture: "textures/earth_daymap.jpg", moons: [
        { name: "Moon", size: 0.4, dist: 4, speed: 0.8, texture: "textures/moon.jpg" }
    ]},
    { name: "Mars", size: 1.2, dist: 80, speed: 0.024, period: 687, color: "#e27b58", incl: 1.8, texture: "textures/mars.jpg", moons: [
        { name: "Phobos", size: 0.15, dist: 2.5, speed: 2.5, texture: "textures/phobos.jpg" },
        { name: "Deimos", size: 0.1, dist: 3.5, speed: 1.8, texture: "textures/phobos.jpg" }
    ]},
    { name: "Jupiter", size: 4.5, dist: 130, speed: 0.013, period: 4333, color: "#d39c7e", incl: 1.3, texture: "textures/jupiter.jpg", moons: [
        { name: "Io", size: 0.3, dist: 7, speed: 2.0, texture: "textures/io.jpg" },
        { name: "Europa", size: 0.25, dist: 8.5, speed: 1.8, texture: "textures/europa.jpg" },
        { name: "Ganymede", size: 0.4, dist: 10.5, speed: 1.5, texture: "textures/ganymede.jpg" },
        { name: "Callisto", size: 0.35, dist: 13, speed: 1.2, texture: "textures/callisto.jpg" }
    ]},
    { name: "Saturn", size: 3.8, dist: 180, speed: 0.009, period: 10759, color: "#c5ab6e", incl: 2.5, hasRings: true, texture: "textures/saturn.jpg", ringTexture: "textures/saturn_ring.png", moons: [
        { name: "Titan", size: 0.4, dist: 9, speed: 1.2, texture: "textures/titan.jpg" },
        { name: "Enceladus", size: 0.2, dist: 11, speed: 1.8, texture: "textures/enceladus.jpg" }
    ]},
    { name: "Uranus", size: 2.5, dist: 230, speed: 0.006, period: 30687, color: "#bbe1e4", incl: 0.8, texture: "textures/uranus.jpg", moons: [
        { name: "Titania", size: 0.25, dist: 6, speed: 1.5, texture: "textures/titania.jpg" },
        { name: "Oberon", size: 0.25, dist: 7.5, speed: 1.3, texture: "textures/titania.jpg" }
    ]},
    { name: "Neptune", size: 2.4, dist: 270, speed: 0.005, period: 60190, color: "#6081ff", incl: 1.8, texture: "textures/neptune.jpg", moons: [
        { name: "Triton", size: 0.3, dist: 6, speed: 1.4, texture: "textures/triton.jpg" }
    ]},
    { name: "Pluto", size: 0.6, dist: 310, speed: 0.004, period: 90560, color: "#937d64", incl: 17.2, texture: "textures/pluto.jpg", moons: [
        { name: "Charon", size: 0.2, dist: 2, speed: 2.0, texture: "textures/charon.jpg" }
    ]}
];

const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

function getPlanetInitialAngle(period) {
    const now = new Date();
    const daysSinceJ2000 = (now - J2000) / (1000 * 60 * 60 * 24);
    return (daysSinceJ2000 / period) * 2 * Math.PI;
}

const sunTextureUrl = "textures/sun.jpg";

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
        keyInput: document.getElementById('apiKeyInput'),
        simTimeValue: document.getElementById('sim-time-value')
    };

    uiElements.tooltip.style.display = 'none';

    initTimeline();

    if (uiElements.simTimeValue) {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        uiElements.simTimeValue.textContent = `${y}-${m}-${d}`;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 500, 1200);

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
    createConstellations();
    createSun();
    createPlanets();
    populateIndex();

    uiElements.speedRange.addEventListener('input', () => {
        if (parseFloat(uiElements.speedRange.value) > 0) {
            timelineMode = 'auto';
        }
    });

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('click', onSceneClick);
    window.addEventListener('touchend', onSceneClick);
    
    animate();
}

function loadTexture(url) {
    const texture = textureLoader.load(url);
    return texture;
}

function loadTextureWithFallback(url, fallbackColor) {
    try {
        const texture = textureLoader.load(url);
        return texture;
    } catch (e) {
        return generatePlanetTexture(fallbackColor);
    }
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

        const initialAngle = data.period ? getPlanetInitialAngle(data.period) : 0;
        orbitGroup.rotation.y = initialAngle;

        const orbitLine = new THREE.Mesh(
            new THREE.TorusGeometry(data.dist, 0.08, 8, 160),
            new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.4 })
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

        if (data.moons) {
            const moonGroup = new THREE.Group();
            mesh.add(moonGroup);
            data.moons.forEach(moonData => {
                const moonTexture = loadTextureWithFallback(moonData.texture, "#888888");
                const moonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(moonData.size, 16, 16),
                    new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 0.8 })
                );
                moonMesh.position.x = moonData.dist;
                moonMesh.userData = { name: moonData.name, isMoon: true };
                moonGroup.add(moonMesh);
                planets.push({ mesh: moonMesh, group: moonGroup, speed: moonData.speed, isMoon: true, parentPlanet: mesh });
            });
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
    const pos = new Float32Array(50000 * 3);
    const colors = new Float32Array(50000 * 3);
    
    for (let i = 0; i < 50000; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 800 + Math.random() * 3500;
        const y = (Math.random() - 0.5) * 200;
        pos[i*3] = Math.cos(a) * r;
        pos[i*3+1] = y;
        pos[i*3+2] = Math.sin(a) * r;
        
        const brightness = 0.3 + Math.random() * 0.7;
        colors[i*3] = brightness * 0.9;
        colors[i*3+1] = brightness * 0.85;
        colors[i*3+2] = brightness;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const milkyWay = new THREE.Points(geo, new THREE.PointsMaterial({ 
        size: 2.5, 
        vertexColors: true, 
        transparent: true, 
        opacity: 0.6 
    }));
    milkyWay.rotation.x = Math.PI / 2;
    scene.add(milkyWay);
}

const constellations = [
    {
        name: "ORION",
        stars: [
            { ra: 5.55, dec: -1.2 },
            { ra: 5.53, dec: -1.9 },
            { ra: 5.42, dec: -0.3 },
            { ra: 5.68, dec: 0.4 },
            { ra: 5.63, dec: -0.5 },
            { ra: 5.78, dec: -0.3 },
            { ra: 5.73, dec: -1.2 }
        ]
    },
    {
        name: "URSA MAJOR",
        stars: [
            { ra: 11.06, dec: 61.8 },
            { ra: 11.03, dec: 56.5 },
            { ra: 12.26, dec: 57.0 },
            { ra: 12.56, dec: 55.9 },
            { ra: 13.40, dec: 54.9 },
            { ra: 13.80, dec: 49.3 },
            { ra: 14.28, dec: 46.0 }
        ]
    },
    {
        name: "CASSIOPEIA",
        stars: [
            { ra: 0.95, dec: 60.7 },
            { ra: 1.43, dec: 60.2 },
            { ra: 1.91, dec: 60.7 },
            { ra: 2.29, dec: 60.5 },
            { ra: 2.84, dec: 60.2 }
        ]
    },
    {
        name: "SCORPIUS",
        stars: [
            { ra: 16.49, dec: -26.4 },
            { ra: 16.09, dec: -19.8 },
            { ra: 15.58, dec: -19.8 },
            { ra: 15.63, dec: -22.6 },
            { ra: 15.72, dec: -25.4 },
            { ra: 15.99, dec: -27.1 }
        ]
    },
    {
        name: "LEO",
        stars: [
            { ra: 10.67, dec: -7.7 },
            { ra: 10.85, dec: -6.3 },
            { ra: 11.23, dec: -6.4 },
            { ra: 11.28, dec: -8.4 },
            { ra: 11.43, dec: -14.8 },
            { ra: 11.52, dec: -14.0 }
        ]
    },
    {
        name: "CYGNUS",
        stars: [
            { ra: 20.37, dec: 45.1 },
            { ra: 20.77, dec: 42.0 },
            { ra: 20.62, dec: 40.3 },
            { ra: 20.53, dec: 37.3 },
            { ra: 20.12, dec: 36.0 }
        ]
    }
];

function createConstellations() {
    const scale = 4000;
    const offsetY = 1500;
    
    constellations.forEach(constellation => {
        const points = [];
        
        constellation.stars.forEach(star => {
            if (star.ra === undefined || star.dec === undefined) return;
            const ra = star.ra * (Math.PI / 12);
            const dec = star.dec * (Math.PI / 180);
            const x = scale * Math.cos(dec) * Math.cos(ra);
            const y = scale * Math.sin(dec) + offsetY;
            const z = scale * Math.cos(dec) * Math.sin(ra);
            if (isNaN(x) || isNaN(y) || isNaN(z)) return;
            points.push(new THREE.Vector3(x, y, z));
        });
        
        for (let i = 0; i < points.length - 1; i++) {
            if (!points[i] || !points[i+1]) continue;
            const pts = [points[i], points[i+1]];
            if (pts[0].x === undefined || pts[1].x === undefined) continue;
            const geometry = new THREE.BufferGeometry().setFromPoints(pts);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x00ffff, 
                transparent: true, 
                opacity: 0.4 
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        }
        
        const firstStar = points[0];
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(constellation.name, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true, 
            opacity: 0.7 
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        let centerX = 0, centerY = 0, centerZ = 0;
        points.forEach(p => {
            centerX += p.x;
            centerY += p.y;
            centerZ += p.z;
        });
        sprite.position.set(
            centerX / points.length + 100,
            centerY / points.length + 50,
            centerZ / points.length
        );
        sprite.scale.set(400, 100, 1);
        scene.add(sprite);
    });
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
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
}
function onSceneClick(e) {
    if (e && e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(planets.map(p => p.mesh));
        if (hits.length > 0) {
            targetObject = hits[0].object;
        }
    } else if (hoveredObject) {
        targetObject = hoveredObject;
    }
}

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

    const baseVelocityFactor = 1.0; 
    const spd = parseFloat(uiElements.speedRange.value);
    let speedText;
    if (spd >= 1) {
        speedText = (spd).toFixed(1) + 'y/s';
    } else if (spd >= 0.00274) {
        speedText = '1:1';
    } else {
        speedText = (spd * 365).toFixed(2) + 'y/s';
    }
    uiElements.speedVal.innerText = speedText;
    
    const paused = uiElements.pauseRotation && uiElements.pauseRotation.checked;
    if (!paused && uiElements.simTimeValue) {
        const daysToAdd = spd * (1 / 60);
        currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        uiElements.simTimeValue.textContent = `${y}-${m}-${d}`;
    }
    
    const trueScale = uiElements.trueScale && uiElements.trueScale.checked;

    const keyPresent = getActiveApiKey() !== "";
    uiElements.aiPulse.innerText = keyPresent ? "ON" : "OFF";
    uiElements.aiPulse.style.color = keyPresent ? "var(--neon-cyan)" : "#666";

    if (!paused) {
        timeCount += spd * baseVelocityFactor;
        planets.forEach(p => {
            if (p.isMoon) return;
            if (!p.group) return;
            p.group.rotation.y += p.speed * spd * baseVelocityFactor;
            p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
        });
    }
    
    planets.forEach(p => {
        if (!p.mesh) return;
        const baseS = trueScale && p.mesh.userData.name !== "Sun" ? 0.4 : 1.0;
        p.mesh.scale.set(baseS, baseS, baseS);
        if (p.orbitLine) p.orbitLine.visible = uiElements.showOrbits && uiElements.showOrbits.checked;
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

function toggleMenu() {
    const menu = document.getElementById('main-menu');
    const overlay = document.getElementById('main-menu-overlay');
    menu.classList.toggle('collapsed');
    overlay.classList.toggle('hidden');
}

window.onload = init;
