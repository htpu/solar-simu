const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const badSpeedCheck = `    uiElements.speedRange.addEventListener('input', () => {
        if (parseFloat(uiElements.speedRange.value) > 0) {
            timelineMode = 'auto';
        }
    });`;

const goodSpeedCheck = `    uiElements.speedRange.addEventListener('input', () => {
        timelineMode = 'auto';
    });`;
code = code.replace(badSpeedCheck, goodSpeedCheck);

const oldAnimateTop = `    const baseVelocityFactor = 1.0; 
    const spd = parseFloat(uiElements.speedRange.value);
    let speedText;
    if (spd >= 1) {
        speedText = (spd).toFixed(1) + 'y/s';
    } else if (spd >= 0.00274) {
        speedText = '1:1';
    } else {
        speedText = (spd * 365).toFixed(2) + 'y/s';
    }
    uiElements.speedVal.innerText = speedText;`;

const newAnimateTop = `    const baseVelocityFactor = 1.0; 
    
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
    uiElements.speedVal.innerText = speedLabels[speedIndex] || "1 DAY/S";`;

code = code.replace(oldAnimateTop, newAnimateTop);

fs.writeFileSync('js/main.js', code);
console.log('done');
