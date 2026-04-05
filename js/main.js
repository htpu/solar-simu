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

function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === `panel-${targetId}`) {
                    p.classList.add('active');
                }
            });
        });
    });
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
            updateSimTimeDisplay();
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
            div.className = 'timeline-event-item';
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
    { name: "Mercury", j2000L0: 252.25, mass: "3.30 × 10²³ kg", diameter: "4,880 km", rotation: "58.6 days", realPeriod: "88 days", size: 0.8, dist: 25, speed: 0.047, period: 88, color: "#9e9e9e", incl: 7.0, axialTilt: 0.03, texture: "textures/mercury.jpg" },
    { name: "Venus", j2000L0: 181.98, mass: "4.87 × 10²⁴ kg", diameter: "12,104 km", rotation: "243 days (retrograde)", realPeriod: "225 days", size: 1.5, dist: 40, speed: 0.035, period: 225, color: "#e3bb76", incl: 3.4, axialTilt: 177.4, texture: "textures/venus_surface.jpg" },
    { name: "Earth", j2000L0: 100.46, mass: "5.97 × 10²⁴ kg", diameter: "12,742 km", rotation: "23.9 hours", realPeriod: "365.25 days", size: 1.6, dist: 60, speed: 0.029, period: 365.25, color: "#2271b3", incl: 0, axialTilt: 23.5, texture: "textures/earth_daymap.jpg", moons: [
        { name: "Moon", j2000L0: 125.08, mass: "7.34 × 10²² kg", diameter: "3,474 km", rotation: "27.3 days", realPeriod: "27.3 days", size: 0.4, dist: 4, speed: 0.8, texture: "textures/moon.jpg" }
    ]},
    { name: "Mars", j2000L0: 355.45, mass: "6.42 × 10²³ kg", diameter: "6,779 km", rotation: "24.6 hours", realPeriod: "687 days", size: 1.2, dist: 80, speed: 0.024, period: 687, color: "#e27b58", incl: 1.8, axialTilt: 25.2, texture: "textures/mars.jpg", moons: [
        { name: "Phobos", mass: "1.06 × 10¹⁶ kg", diameter: "22.4 km", rotation: "7.66 hours", realPeriod: "7.66 hours", size: 0.15, dist: 2.5, speed: 2.5, texture: "textures/phobos.jpg" },
        { name: "Deimos", mass: "1.48 × 10¹⁵ kg", diameter: "12.4 km", rotation: "30.3 hours", realPeriod: "30.3 hours", size: 0.1, dist: 3.5, speed: 1.8, texture: "textures/phobos.jpg" }
    ]},
    { name: "Jupiter", j2000L0: 34.4, mass: "1.89 × 10²⁷ kg", diameter: "139,820 km", rotation: "9.9 hours", realPeriod: "11.86 years", size: 4.5, dist: 130, speed: 0.013, period: 4333, color: "#d39c7e", incl: 1.3, axialTilt: 3.1, texture: "textures/jupiter.jpg", moons: [
        { name: "Io", mass: "8.93 × 10²² kg", diameter: "3,643 km", rotation: "1.77 days", realPeriod: "1.77 days", size: 0.3, dist: 7, speed: 2.0, texture: "textures/io.jpg" },
        { name: "Europa", mass: "4.80 × 10²² kg", diameter: "3,121 km", rotation: "3.55 days", realPeriod: "3.55 days", size: 0.25, dist: 8.5, speed: 1.8, texture: "textures/europa.jpg" },
        { name: "Ganymede", mass: "1.48 × 10²³ kg", diameter: "5,268 km", rotation: "7.15 days", realPeriod: "7.15 days", size: 0.4, dist: 10.5, speed: 1.5, texture: "textures/ganymede.jpg" },
        { name: "Callisto", mass: "1.07 × 10²³ kg", diameter: "4,820 km", rotation: "16.68 days", realPeriod: "16.68 days", size: 0.35, dist: 13, speed: 1.2, texture: "textures/callisto.jpg" }
    ]},
    { name: "Saturn", j2000L0: 49.94, mass: "5.68 × 10²⁶ kg", diameter: "116,460 km", rotation: "10.7 hours", realPeriod: "29.45 years", size: 3.8, dist: 180, speed: 0.009, period: 10759, color: "#c5ab6e", incl: 2.5, axialTilt: 26.7, hasRings: true, texture: "textures/saturn.jpg", ringTexture: "textures/saturn_ring.png", moons: [
        { name: "Titan", mass: "1.34 × 10²³ kg", diameter: "5,149 km", rotation: "15.94 days", realPeriod: "15.94 days", size: 0.4, dist: 9, speed: 1.2, texture: "textures/titan.jpg" },
        { name: "Enceladus", mass: "1.08 × 10²⁰ kg", diameter: "504 km", rotation: "1.37 days", realPeriod: "1.37 days", size: 0.2, dist: 11, speed: 1.8, texture: "textures/enceladus.jpg" }
    ]},
    { name: "Uranus", j2000L0: 313.23, mass: "8.68 × 10²⁵ kg", diameter: "50,724 km", rotation: "17.2 hours (retrograde)", realPeriod: "84 years", size: 2.5, dist: 230, speed: 0.006, period: 30687, color: "#bbe1e4", incl: 0.8, axialTilt: 97.8, texture: "textures/uranus.jpg", moons: [
        { name: "Titania", mass: "3.40 × 10²¹ kg", diameter: "1,576 km", rotation: "8.7 days", realPeriod: "8.7 days", size: 0.25, dist: 6, speed: 1.5, texture: "textures/titania.jpg" },
        { name: "Oberon", mass: "3.01 × 10²¹ kg", diameter: "1,522 km", rotation: "13.46 days", realPeriod: "13.46 days", size: 0.25, dist: 7.5, speed: 1.3, texture: "textures/titania.jpg" }
    ]},
    { name: "Neptune", j2000L0: 304.88, mass: "1.02 × 10²⁶ kg", diameter: "49,244 km", rotation: "16.1 hours", realPeriod: "164.8 years", size: 2.4, dist: 270, speed: 0.005, period: 60190, color: "#6081ff", incl: 1.8, axialTilt: 28.3, texture: "textures/neptune.jpg", moons: [
        { name: "Triton", mass: "2.14 × 10²² kg", diameter: "2,706 km", rotation: "5.87 days (retrograde)", realPeriod: "5.87 days (retrograde)", size: 0.3, dist: 6, speed: 1.4, texture: "textures/triton.jpg" }
    ]},
    { name: "Pluto", j2000L0: 238.92, mass: "1.30 × 10²² kg", diameter: "2,376 km", rotation: "6.38 days (retrograde)", realPeriod: "248 years", size: 0.6, dist: 310, speed: 0.004, period: 90560, color: "#937d64", incl: 17.2, axialTilt: 122.5, texture: "textures/pluto.jpg", moons: [
        { name: "Charon", mass: "1.58 × 10²¹ kg", diameter: "1,212 km", rotation: "6.38 days", realPeriod: "6.38 days", size: 0.2, dist: 2, speed: 2.0, texture: "textures/charon.jpg" }
    ]}
];

const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

function getPlanetAngle(period, j2000L0_deg, date) {
    if (!period) return 0;
    const daysSinceJ2000 = (date - J2000) / (1000 * 60 * 60 * 24);
    const L0_rad = (j2000L0_deg || 0) * (Math.PI / 180);
    const orbits = daysSinceJ2000 / period;
    const fractionalOrbit = orbits - Math.floor(orbits);
    return L0_rad + fractionalOrbit * 2 * Math.PI;
}

const sunTextureUrl = "textures/sun.jpg";

function getActiveApiKey() {
    return uiElements.keyInput.value.trim() || fallbackApiKey;
}

function promptForKey() {
    const input = uiElements.keyInput;
    uiElements.aiStatus.innerText = "API key required. Enter it in the AI Analysis tab.";
    uiElements.detailedBox.textContent = "Please enter your Gemini API key above to enable AI-powered planet analysis.";
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

let showAxes = true;

function init() {
    uiElements = {
        speedRange: document.getElementById('speedRange'),
        speedVal: document.getElementById('speedVal'),
        showOrbits: document.getElementById('showOrbits'),
        trueScale: document.getElementById('trueScale'),
        pauseRotation: document.getElementById('pauseRotation'),
        showAxes: document.getElementById('showAxes'),
        tooltip: document.getElementById('planet-tooltip'),
        ttName: document.getElementById('tt-name'),
        ttDist: document.getElementById('tt-dist'),
        ttMass: document.getElementById('tt-mass'),
        ttDiameter: document.getElementById('tt-diameter'),
        ttRotation: document.getElementById('tt-rotation'),
        ttPeriod: document.getElementById('tt-period'),
        aiStatus: document.getElementById('ai-status'),
        aiPulse: document.getElementById('ai-pulse'),
        detailedBox: document.getElementById('ai-detailed-box'),
        intelBtn: document.getElementById('ai-intel-btn'),
        audioBtn: document.getElementById('audio-btn'),
        keyInput: document.getElementById('apiKeyInput'),
        simTimeValue: document.getElementById('sim-time-value'),
        simTimeHours: document.getElementById('sim-time-hours'),
        celestialMiniList: document.getElementById('celestial-mini-list')
    };

    uiElements.tooltip.style.display = 'none';
    
    initMenuTabs();
    initTimeline();

    if (uiElements.simTimeValue) {
        updateSimTimeDisplay();
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
    createKuiperBelt();
    populateIndex();

    uiElements.speedRange.addEventListener('input', () => {
        timelineMode = 'auto';
    });

    uiElements.showAxes.addEventListener('change', () => {
        showAxes = uiElements.showAxes.checked;
        planets.forEach(p => {
            if (p.mesh.userData.axisLine) {
                p.mesh.userData.axisLine.visible = showAxes;
            }
        });
    });

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onMouseMove);
    
    // Use pointer events to distinguish click from drag
    let pointerDownPos = { x: 0, y: 0 };
    window.addEventListener('pointerdown', (e) => {
        pointerDownPos.x = e.clientX;
        pointerDownPos.y = e.clientY;
    });
    window.addEventListener('pointerup', (e) => {
        // Calculate distance moved
        const dx = e.clientX - pointerDownPos.x;
        const dy = e.clientY - pointerDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If moved less than 5 pixels, consider it a click
        if (distance < 5) {
            // Only trigger if clicking on the canvas (avoid UI clicks)
            if (e.target.tagName === 'CANVAS') {
                onSceneClick(e);
            }
        }
    });
    
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
    sun.userData = { name: "Sun", dist: 0, baseScale: 1.0, mass: "1.989 × 10³⁰ kg", diameter: "1.39 million km", rotation: "27 days", realPeriod: "Galactic orbit ~230M years" };
    scene.add(sun);
    planets.push({ mesh: sun, speed: 0, group: new THREE.Group() });
}


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

function createPlanets() {
    celestialData.forEach(data => {
        const orbitGroup = new THREE.Group();
        orbitGroup.rotation.z = THREE.MathUtils.degToRad(data.incl);
        scene.add(orbitGroup);

        const initialAngle = data.period ? getPlanetAngle(data.period, data.j2000L0, new Date()) : 0;
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
        mesh.userData = { name: data.name, dist: data.dist, baseScale: 1.0, ...data };
        orbitGroup.add(mesh);

        // Add axis line with actual axial tilt
        const axisLength = data.size * 2.5;
        const axisPoints = [
            new THREE.Vector3(0, axisLength, 0),
            new THREE.Vector3(0, -axisLength, 0)
        ];
        const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPoints);
        const axisMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        const axisLine = new THREE.Line(axisGeo, axisMat);
        // Apply axial tilt to axis
        axisLine.rotation.z = THREE.MathUtils.degToRad(data.axialTilt || 0);
        mesh.add(axisLine);
        mesh.userData.axisLine = axisLine;

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

function populateIndex() {
    const container = document.getElementById('celestial-mini-list');
    if (!container) return;
    
    celestialData.forEach(d => {
        const item = document.createElement('div');
        item.className = 'celestial-mini-item';
        item.innerHTML = `<span class="planet-dot"></span><span>${d.name.toUpperCase()}</span>`;
        item.onclick = () => jumpTo(d.name);
        container.appendChild(item);
    });
    
    if (uiElements.celestialMiniList) {
        uiElements.celestialMiniList.innerHTML = '';
        celestialData.forEach(d => {
            const item = document.createElement('div');
            item.className = 'celestial-mini-item';
            item.innerHTML = `<span class="planet-dot"></span><span>${d.name.toUpperCase()}</span>`;
            item.onclick = () => jumpTo(d.name);
            uiElements.celestialMiniList.appendChild(item);
        });
    }
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

function jumpTo(name) {
    targetObject = null;
    document.querySelectorAll('.celestial-mini-item').forEach(b => b.classList.remove('active'));
    
    const found = planets.find(p => p.mesh.userData.name === name);
    if (found) {
        targetObject = found.mesh;
        const btn = Array.from(document.querySelectorAll('.btn-sci')).find(b => b.innerText.includes(name.toUpperCase()));
        if(btn) btn.classList.add('active');
    }
}

function resetView() { 
    targetObject = null; 
    controls.target.set(0, 0, 0); 
    document.querySelectorAll('.btn-sci').forEach(b => b.classList.remove('active'));
}
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
    let clientX, clientY;
    
    if (e && e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else if (e) {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    if (clientX !== undefined && clientY !== undefined) {
        // Calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const clickMouse = new THREE.Vector2();
        clickMouse.x = (clientX / window.innerWidth) * 2 - 1;
        clickMouse.y = -(clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(clickMouse, camera);
        // Filter out belt/particle systems which might not have normal meshes
        const raycastableMeshes = planets
            .filter(p => p.mesh && !p.isBelt)
            .map(p => p.mesh);
        const hits = raycaster.intersectObjects(raycastableMeshes);
        
        if (hits.length > 0) {
            jumpTo(hits[0].object.userData.name);
            return;
        }
    }
    
    // If clicked on empty space, reset view
    resetView();
}

async function generateDetailedIntel() {
    const obj = hoveredObject || targetObject;
    const key = getActiveApiKey();
    if (!obj) return;
    if (!key) { promptForKey(); return; }

    uiElements.intelBtn.disabled = true; uiElements.intelBtn.innerText = "SCANNING...";
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
        uiElements.aiStatus.innerText = `Analysis complete for ${obj.userData.name}.`;
    } catch(e) { uiElements.aiStatus.innerText = "Error: Could not reach API. Check your key and try again."; }
    finally { uiElements.intelBtn.disabled = false; uiElements.intelBtn.innerText = "Analyze Planet"; }
}

async function toggleAudio() {
    const key = getActiveApiKey();
    if (!key) { promptForKey(); return; }
    if (currentAudio && !currentAudio.paused) { currentAudio.pause(); currentAudio = null; return; }
    uiElements.intelBtn.innerText = "LOADING...";
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
        currentAudio.play();
        currentAudio.onended = () => {};
    } catch(e) { uiElements.intelBtn.innerText = "ERROR"; }
}

function animate() {
    requestAnimationFrame(animate);
    if (!uiElements.speedRange) return;

    const baseVelocityFactor = 1.0; 
    
    const speedIndex = parseInt(uiElements.speedRange.value);
    const speedMapping = [
        (1 / (365.25 * 24 * 60 * 60)), // 0: 1:1 (1 real sec = 1 sim sec)
        (60 / (365.25 * 24 * 60 * 60)), // 1: 1 min / sec
        (3600 / (365.25 * 24 * 60 * 60)), // 2: 1 hr / sec
        (1 / 365.25), // 3: 1 day / sec
        (7 / 365.25), // 4: 1 wk / sec
        (30 / 365.25), // 5: 1 mo / sec
        1, // 6: 1 yr / sec
        10 // 7: 10 yr / sec
    ];
    const speedLabels = [
        "1:1",
        "1 MIN/S",
        "1 HR/S",
        "1 DAY/S",
        "1 WK/S",
        "1 MO/S",
        "1 YR/S",
        "10 YR/S"
    ];
    
    const spd = speedMapping[speedIndex] !== undefined ? speedMapping[speedIndex] : speedMapping[3];
    uiElements.speedVal.innerText = speedLabels[speedIndex] || "1 DAY/S";
    
    const paused = uiElements.pauseRotation && uiElements.pauseRotation.checked;
    if (!paused && uiElements.simTimeValue) {
        const daysToAdd = spd * 365.25 * (1 / 60);
        currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const h = String(currentDate.getHours()).padStart(2, '0');
        const min = String(currentDate.getMinutes()).padStart(2, '0');
        const s = String(currentDate.getSeconds()).padStart(2, '0');
        updateSimTimeDisplay();
    }
    
    const trueScale = uiElements.trueScale && uiElements.trueScale.checked;

    const keyPresent = getActiveApiKey() !== "";
    uiElements.aiPulse.innerText = keyPresent ? "ON" : "OFF";
    uiElements.aiPulse.style.color = keyPresent ? "var(--secondary)" : "#666";

    if (!paused) {
        timeCount += spd * baseVelocityFactor;
        planets.forEach(p => {
            if (!p.group || !p.mesh) return;
            const data = p.mesh.userData;
            if (p.isBelt) {
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
            } else if (data && data.period) {
                const absoluteAngle = getPlanetAngle(data.period, data.j2000L0, currentDate);
                p.group.rotation.y = absoluteAngle;
                if (data.rotation) {
                    let rotDays = 1;
                    if (typeof data.rotation === 'string') {
                        if (data.rotation.includes('hours')) rotDays = parseFloat(data.rotation) / 24;
                        else if (data.rotation.includes('days')) rotDays = parseFloat(data.rotation);
                    }
                    const rotSign = data.rotation.includes('retrograde') ? -1 : 1;
                    
                    // Real-time Earth rotation based on currentDate (Simulation Time)
                    if (data.name === 'Earth') {
                        // Calculate Earth rotation using UTC time from currentDate
                        // Earth rotates ~15° per hour
                        // At UTC 12:00, 0° longitude faces Sun (noon)
                        // At UTC 0:00, 0° longitude faces opposite Sun (midnight)
                        const utcHours = currentDate.getUTCHours() + currentDate.getUTCMinutes() / 60 + currentDate.getUTCSeconds() / 3600;
                        
                        // Use J2000.0 as reference: Jan 1, 2000 12:00 TT ≈ Jan 1, 2000 11:58:56 UTC
                        const daysSinceJ2000 = (currentDate - J2000) / (1000 * 60 * 60 * 24);
                        
                        // Earth sidereal rotation period: 0.99726968 days
                        const rotDays = 0.99726968;
                        const fractionalRotation = ((daysSinceJ2000 / rotDays) + utcHours / 24) % 1;
                        if (fractionalRotation < 0) fractionalRotation += 1;
                        
                        p.mesh.rotation.y = fractionalRotation * 2 * Math.PI;
                        
                        // Apply axial tilt
                        const axialTilt = data.axialTilt || 0;
                        p.mesh.rotation.z = THREE.MathUtils.degToRad(axialTilt);
                    } else {
                        const daysSinceJ2000 = (currentDate - J2000) / (1000 * 60 * 60 * 24);
                        const orbits = daysSinceJ2000 / rotDays;
                        const fractionalOrbit = orbits - Math.floor(orbits);
                        p.mesh.rotation.y = rotSign * fractionalOrbit * 2 * Math.PI;
                    }
                } else {
                    p.mesh.rotation.y += p.speed * spd * baseVelocityFactor;
                }
            }
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
        if (obj && obj.userData && obj.userData.name && hoveredObject !== obj) {
            hoveredObject = obj;
            uiElements.tooltip.style.display = 'block';
            uiElements.ttName.innerText = obj.userData.name.toUpperCase();
            uiElements.ttDist.innerText = obj.userData.name === "Sun" ? "0 AU" : `${(obj.userData.dist / 60).toFixed(2)} AU`;
            uiElements.ttMass.innerText = obj.userData.mass || "Unknown";
            uiElements.ttDiameter.innerText = obj.userData.diameter || "Unknown";
            uiElements.ttRotation.innerText = obj.userData.rotation || "Unknown";
            uiElements.ttPeriod.innerText = obj.userData.realPeriod || "Unknown";
            if(keyPresent) {
                uiElements.aiStatus.innerText = `Ready — hover over ${obj.userData.name} and click Analyze.`;
            } else {
                uiElements.aiStatus.innerText = "Enter API key to enable AI analysis.";
            }
        }
        const baseS = (trueScale && obj.userData.name !== "Sun") ? 0.4 : 1.0;
        const pulse = baseS * (1.1 + Math.sin(Date.now() * 0.005) * 0.05);
        obj.scale.set(pulse, pulse, pulse);
        
        uiElements.tooltip.style.left = (mouse.x * 0.5 + 0.5) * window.innerWidth + 20 + 'px';
        uiElements.tooltip.style.top = (-mouse.y * 0.5 + 0.5) * window.innerHeight - 80 + 'px';
    } else {
        if (hoveredObject) {
            hoveredObject.scale.set(1, 1, 1);
        }
        hoveredObject = null;
        uiElements.tooltip.style.display = 'none';
    }

    if (targetObject && targetObject.userData && targetObject.userData.name) {
        const worldPos = new THREE.Vector3();
        targetObject.getWorldPosition(worldPos);
        controls.target.lerp(worldPos, 0.08);
        const radius = targetObject.geometry ? (targetObject.geometry.parameters?.radius || 1) : 1;
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

function syncToRealTime() {
    currentDate = new Date();
    timelineMode = 'auto';
    uiElements.speedRange.value = 0;
    updateSimTimeDisplay();
}

function updateSimTimeDisplay() {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const h = String(currentDate.getHours()).padStart(2, '0');
    const min = String(currentDate.getMinutes()).padStart(2, '0');
    const s = String(currentDate.getSeconds()).padStart(2, '0');
    
    if (uiElements.simTimeValue) {
        uiElements.simTimeValue.textContent = `${y}-${m}-${d}`;
    }
    if (uiElements.simTimeHours) {
        uiElements.simTimeHours.textContent = `${h}:${min}:${s}`;
    }
}

// --- Onboarding ---
function initOnboarding() {
    if (localStorage.getItem('solar-simu-onboarded')) return;
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    let step = 0;
    const steps = overlay.querySelectorAll('.onboarding-step');
    const dots = overlay.querySelectorAll('.dot');
    const nextBtn = document.getElementById('onboarding-next');
    const skipBtn = document.getElementById('onboarding-skip');

    function showStep(n) {
        steps.forEach(s => s.classList.add('hidden'));
        dots.forEach(d => d.classList.remove('active'));
        steps[n].classList.remove('hidden');
        dots[n].classList.add('active');
        nextBtn.textContent = n === steps.length - 1 ? 'Start' : 'Next';
    }

    nextBtn.addEventListener('click', () => {
        if (step < steps.length - 1) { step++; showStep(step); }
        else { closeOnboarding(); }
    });
    skipBtn.addEventListener('click', closeOnboarding);
    dots.forEach(d => {
        d.addEventListener('click', () => { step = parseInt(d.dataset.dot); showStep(step); });
    });

    function closeOnboarding() {
        overlay.classList.add('hidden');
        localStorage.setItem('solar-simu-onboarded', '1');
    }
}

// --- Keyboard shortcuts ---
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (uiElements.pauseRotation) {
                    uiElements.pauseRotation.checked = !uiElements.pauseRotation.checked;
                }
                break;
            case '+':
            case '=':
                e.preventDefault();
                if (uiElements.speedRange) {
                    const v = Math.min(7, parseInt(uiElements.speedRange.value) + 1);
                    uiElements.speedRange.value = v;
                    timelineMode = 'auto';
                }
                break;
            case '-':
            case '_':
                e.preventDefault();
                if (uiElements.speedRange) {
                    const v = Math.max(0, parseInt(uiElements.speedRange.value) - 1);
                    uiElements.speedRange.value = v;
                    timelineMode = 'auto';
                }
                break;
            case 'r':
            case 'R':
                resetView();
                break;
            case 'm':
            case 'M':
                toggleMenu();
                break;
            case 'Escape':
                const menu = document.getElementById('main-menu');
                if (!menu.classList.contains('collapsed')) toggleMenu();
                break;
        }
    });
}

// --- Mobile planet bar ---
function populateMobilePlanetBar() {
    const container = document.getElementById('mobile-planet-list');
    if (!container) return;
    celestialData.forEach(d => {
        const item = document.createElement('div');
        item.className = 'mobile-planet-item';
        const dot = document.createElement('span');
        dot.className = 'planet-dot';
        const label = document.createElement('span');
        label.textContent = d.name;
        item.appendChild(dot);
        item.appendChild(label);
        item.onclick = () => jumpTo(d.name);
        container.appendChild(item);
    });
}

window.onload = function() {
    init();
    initOnboarding();
    initKeyboardShortcuts();
    populateMobilePlanetBar();
};
