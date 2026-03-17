# 3D Solar System Visualization - Specification

## Project Overview
- **Name**: 3D Solar System - AI Digital Twin
- **Version**: 0.1.7
- **Type**: Interactive 3D Web Application
- **Core Functionality**: Real-time 3D visualization of the solar system with AI-powered planetary analysis via Gemini API
- **Target Users**: Science enthusiasts, educators, students interested in astronomy

## Technical Stack
- **Rendering**: Three.js r128
- **UI Framework**: Tailwind CSS (via CDN)
- **Fonts**: Orbitron (headings), Share Tech Mono (body)
- **Deployment**: GitHub Pages (solar.htpu.net)
- **Textures**: Local textures in `textures/` directory

## File Structure
```
solar-simu/
├── index.html          # Main HTML
├── CNAME              # Custom domain (solar.htpu.net)
├── AGENTS.md          # Agent rules for development
├── SPEC.md            # This specification
├── js/
│   └── main.js        # JavaScript logic
├── css/
│   └── styles.css     # All CSS styles
└── textures/          # Planet and moon textures
    ├── sun.jpg
    ├── mercury.jpg
    ├── venus_surface.jpg
    ├── earth_daymap.jpg
    ├── moon.jpg
    ├── mars.jpg
    ├── phobos.jpg
    ├── jupiter.jpg
    ├── io.jpg
    ├── europa.jpg
    ├── ganymede.jpg
    ├── callisto.jpg
    ├── saturn.jpg
    ├── saturn_ring.png
    ├── titan.jpg
    ├── enceladus.jpg
    ├── uranus.jpg
    ├── titania.jpg
    ├── neptune.jpg
    ├── triton.jpg
    ├── pluto.jpg
    └── charon.jpg
```

## UI/UX Specification

### Layout Structure
- **Left Panel** (Celestial List): Fixed position, 200px width, scrollable
- **Right Panel** (Command Center): Fixed position, 320px width, controls
- **Bottom Panel** (AI Interface): Fixed position, centered, 800px max-width
- **Canvas**: Full viewport, z-index 0

### Visual Design
- **Color Palette**:
  - Primary: `#00f3ff` (neon cyan)
  - Secondary: `#0066ff` (neon blue)
  - Accent: `#bc13fe` (neon purple)
  - Background: `#000000` (black)
  - Panel BG: `rgba(5, 10, 20, 0.95)`
- **Typography**:
  - Headings: Orbitron, 16px, uppercase, letter-spacing 2px
  - Body: Share Tech Mono, monospace
  - Tooltips: 9-14px
- **Effects**:
  - Glassmorphism panels with backdrop blur (12px)
  - Neon glow on hover (box-shadow)
  - Scanline animation on tooltips
  - Planet pulse animation on hover

### Components
1. **Planet Tooltip**: Floating card showing name, orbital position (AU), status
2. **Celestial List**: Scrollable list with clickable planet buttons
3. **Command Center**:
   - Time rate slider (0-10x)
   - Toggle: Render orbits
   - Toggle: Scientific scale
   - Toggle: System pause
   - API Key input field
   - Recenter view button
 4. **AI Panel**:
    - Status indicator (ON/OFF pulse)
    - Mission Science Officer label
    - AI status text
    - Scan Data button
    - Audio playback button
 5. **Timeline Panel**:
    - Date/time display (YYYY-MM-DD HH:MM:SS)
    - Timeline slider (years 1-3000)
    - Year/Month/Day/Hour/Minute selectors
    - Astronomical event markers
    - Event list with click navigation

## Celestial Objects

### Sun
- Geometry: SphereGeometry(20, 64, 64)
- Material: MeshBasicMaterial with texture
- Position: Origin (0, 0, 0)
- Light source: PointLight(0xffffff, 2.5, 6000)

### Planets & Moons
| Planet   | Size | Distance | Orbital Speed | Inclination | Rings | Moons |
|----------|------|----------|---------------|-------------|-------|-------|
| Mercury  | 0.8  | 25       | 0.047         | 7.0°       | No    | -     |
| Venus    | 1.5  | 40       | 0.035         | 3.4°       | No    | -     |
| Earth    | 1.6  | 60       | 0.029         | 0°         | No    | Moon  |
| Mars     | 1.2  | 80       | 0.024         | 1.8°       | No    | Phobos, Deimos |
| Jupiter  | 4.5  | 130      | 0.013         | 1.3°       | No    | Io, Europa, Ganymede, Callisto |
| Saturn   | 3.8  | 180      | 0.009         | 2.5°       | Yes   | Titan, Enceladus |
| Uranus   | 2.5  | 230      | 0.006         | 0.8°       | No    | Titania, Oberon |
| Neptune  | 2.4  | 270      | 0.005         | 1.8°       | No    | Triton |
| Pluto    | 0.6  | 310      | 0.004         | 17.2°      | No    | Charon |

### Orbital Visualization
- Geometry: TorusGeometry(dist, 0.08, 8, 160)
- Material: MeshBasicMaterial, cyan (#00f3ff), opacity 0.15

### Background
- **Stars**: 12,000 particles, BufferGeometry, white (#ffffff), size 1.2
- **Milky Way**: 50,000 particles, disk distribution (radius 800-4300), blue-white colors, opacity 0.6
- **Constellations**: 6 major constellations (Orion, Ursa Major, Cassiopeia, Scorpius, Leo, Cygnus) with lines and labels

## Functionality Specification

### Camera Controls
- Type: PerspectiveCamera(45, aspect, 0.1, 20000)
- Initial position: (0, 450, 900)
- Controls: OrbitControls with damping
- Zoom limits: Default Three.js OrbitControls

### Interaction
1. **Hover**: Raycasting to detect planet under cursor
   - Show tooltip with planet info
   - Pulse animation on hovered planet
   - Update AI status text
2. **Click**: Set target object for camera tracking
3. **List Click**: Jump to specific planet
4. **Drag**: Rotate camera around scene
5. **Scroll**: Zoom in/out

### Time Control
- Base velocity factor: 0.25
- Speed range: 0-10x
- Planets rotate around sun based on orbital speed
- Planets also rotate on their own axis

### AI Features (Gemini API)
- **Text Generation**: gemini-2.5-flash-preview-09-2025
  - Generates 100-word science briefing for selected planet
- **TTS**: gemini-2.5-flash-preview-tts
  - Voice: Charon
  - Audio format: WAV (24kHz, 16-bit, mono)
  - Playback via Web Audio API

### Toggles
- **Render Orbits**: Show/hide orbital paths
- **Scientific Scale**: Reduce planet size to 0.4x for visibility
- **System Pause**: Freeze all animation

## Animation Specifications
- Render loop: requestAnimationFrame
- Camera tracking: lerp with factor 0.08 (target), 0.04 (position)
- Hover pulse: sin wave, amplitude 0.05, frequency 0.005
- Tooltip position: Follows mouse with offset

## API Integration

### Gemini API Endpoints
```
Text: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent
TTS:  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent
```

### Request Format (Text)
```json
{
  "contents": [{
    "parts": [{
      "text": "High-level science briefing about {planet}. 100 words. English."
    }]
  }]
}
```

### Request Format (TTS)
```json
{
  "contents": [{ "parts": [{ "text": "{previous_text}" }] }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "voiceConfig": {
        "prebuiltVoiceConfig": { "voiceName": "Charon" }
      }
    }
  },
  "model": "gemini-2.5-flash-preview-tts"
}
```

## File Structure
```
solar-simu/
├── index.html          # Main HTML with UI structure
├── CNAME              # Custom domain (solar.htpu.net)
├── AGENTS.md          # Agent rules for development
├── SPEC.md            # This specification
├── js/
│   └── main.js        # JavaScript logic (Three.js, AI, Timeline)
├── css/
│   └── styles.css     # All CSS styles
└── textures/          # Planet and moon textures
```

## External Dependencies
- Three.js: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
- OrbitControls: https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js
- Tailwind: https://cdn.tailwindcss.com
- Fonts: Google Fonts (Orbitron, Share Tech Mono)
- Textures: raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/

## Timeline Functionality
- **Date Range**: Year 1 to Year 3000
- **Precision**: Year, Month, Day, Hour, Minute selectors
- **Modes**: Manual (user-selected date) and Auto (continuous animation)
- **Astronomical Events**: 27 famous events marked on timeline (clickable)
  - Supernovae (1054, 1572)
  - Planet discoveries (1781, 1846)
  - Space missions (1957-present)
- **Planet Position Calculation**: Uses Kepler's orbital elements
  - Semi-major axis (a), Eccentricity (e), Inclination (i)
  - Mean longitude (L), Argument of perihelion (w), Longitude of ascending node (node)
  - Solve Kepler's equation iteratively for accurate positions
- **Julian Date**: Used for astronomical calculations

## Browser Support
- Modern browsers with WebGL support
- Tested on: Chrome, Firefox, Safari, Edge

## Deployment

### GitHub Pages Setup
```bash
# 1. Initialize git and commit
git init
git add .
git commit -m "Initial commit"

# 2. Create public repo on GitHub
gh repo create solar-simu --public --source=. --clone=false

# 3. Add remote and push
git remote add origin https://github.com/htpu/solar-simu.git
git push -u origin main

# 4. Enable GitHub Pages (via API)
gh api repos/htpu/solar-simu/pages -X POST -F 'source[branch]=main' -F 'source[path]=/'
```

### DNS Configuration (AWS Route 53)
```bash
# Get hosted zone ID
aws route53 list-hosted-zones --query 'HostedZones[?Name==`htpu.net.`].Id'

# Create CNAME record
aws route53 change-resource-record-sets --hosted-zone-id Z11AW9Y2TX4DU6 --change-batch file://dns.json
```

dns.json:
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "solar.htpu.net",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{ "Value": "htpu.github.io" }]
    }
  }]
}
```

### URLs
- **GitHub Pages**: https://htpu.github.io/solar-simu/
- **Custom Domain**: http://solar.htpu.net (HTTPS pending certificate provisioning)

### Commands Summary
```bash
# Deploy updates
git add . && git commit -m "Update" && git push origin main

# Check deployment status
gh api repos/htpu/solar-simu/pages

# Check DNS
dig solar.htpu.net
```

## Known Limitations
- External textures require CORS-enabled hosting (works on GitHub Pages)
- No mobile touch controls
- Single-user (no state persistence)
- API key stored in session only (not persisted)
