// ===================== CONFIGURATION =====================
const CONFIG = {
    googleSheetId: '1NJV2sG6_UhhiRpYifnPcixs44hqOdMhk2bK1LpBNu6Q',
    apiKey: 'AIzaSyBgFXnQ1LWxQEGNS7lSVZFxlH0-ksucsoY',
    sheetRange: 'Sheet1!A:F',

    tableSize: { width: 20, height: 10 },
    gridSize: { x: 5, y: 4, z: 10 },
    helixRadius: 300,
    sphereRadius: 400
};

// ===================== GLOBALS =====================
let scene, camera, renderer, controls;
let objects = [];
let data = [];
let currentLayout = 'table';

// ===================== COLOR CODING =====================
function getColorForNetWorth(netWorth) {
    const value = parseFloat(netWorth.replace(/[$,]/g, ''));
    if (value < 100000) return '#ff4444';     // Red
    if (value <= 200000) return '#ffaa44';    // Orange
    return '#44ff44';                         // Green
}

// ===================== GOOGLE LOGIN =====================
function handleCredentialResponse() {
    document.getElementById('login').classList.add('hidden');
    document.getElementById('container').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
    init();
}

// ===================== INIT SCENE =====================
function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.z = 1200;

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    document.getElementById('container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    loadData();
    window.addEventListener('resize', onWindowResize);
    animate();
}

// ===================== LOAD GOOGLE SHEET =====================
async function loadData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.googleSheetId}/values/${CONFIG.sheetRange}?key=${CONFIG.apiKey}`;
        const res = await fetch(url);
        const json = await res.json();

        const rows = json.values.slice(1); // remove header
        data = rows.map(r => ({
            name: r[0],
            photo: r[1],
            age: r[2],
            country: r[3],
            interest: r[4],
            netWorth: r[5]
        }));

        createTiles();
        setLayout('table');

    } catch (err) {
        console.error('Sheet load failed, using sample data', err);
        useSampleData();
    }
}

// ===================== CREATE TILES =====================
function createTiles() {
    objects.forEach(o => scene.remove(o));
    objects = [];

    data.forEach(item => {
        const el = document.createElement('div');
        el.className = 'tile';
        el.style.backgroundColor = getColorForNetWorth(item.netWorth);

        el.innerHTML = `
            <img src="${item.photo}" onerror="this.src='https://via.placeholder.com/50'">
            <h4 title="${item.name}">${item.name}</h4>
            <p>Age: ${item.age}</p>
            <p>${item.country}</p>
            <p>${item.interest}</p>
            <p><b>${item.netWorth}</b></p>
        `;

        const obj = new THREE.CSS3DObject(el);
        objects.push(obj);
        scene.add(obj);
    });
}

// ===================== LAYOUT SWITCH =====================
function setLayout(layout) {
    currentLayout = layout;
    if (layout === 'table') layoutTable();
    if (layout === 'sphere') layoutSphere();
    if (layout === 'helix') layoutHelix();
    if (layout === 'grid') layoutGrid();
}

// ===================== TABLE 20x10 =====================
function layoutTable() {
    const { width, height } = CONFIG.tableSize;
    const spacingX = 180, spacingY = 180;

    objects.forEach((obj, i) => {
        const row = Math.floor(i / width);
        const col = i % width;
        if (row >= height) return;

        obj.position.set(
            (col - width / 2) * spacingX,
            (height / 2 - row) * spacingY,
            0
        );
        obj.rotation.set(0, 0, 0);
    });
}

// ===================== SPHERE =====================
function layoutSphere() {
    const r = CONFIG.sphereRadius;
    const n = objects.length;

    objects.forEach((obj, i) => {
        const phi = Math.acos(-1 + (2 * i) / n);
        const theta = Math.sqrt(n * Math.PI) * phi;

        obj.position.set(
            r * Math.cos(theta) * Math.sin(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(phi)
        );
        obj.lookAt(0, 0, 0);
    });
}

// ===================== TRUE DOUBLE HELIX =====================
function layoutHelix() {
    const radius = CONFIG.helixRadius;
    const height = 1200;
    const count = objects.length;
    const separation = height / (count / 2);

    objects.forEach((obj, i) => {
        const idx = Math.floor(i / 2);
        const isLeft = i % 2 === 0;
        const angle = (idx / (count / 2)) * Math.PI * 4;
        const offset = isLeft ? 0 : Math.PI;

        const x = radius * Math.cos(angle + offset);
        const y = (idx - count / 4) * separation;
        const z = radius * Math.sin(angle + offset);

        obj.position.set(x, y, z);
        obj.lookAt(0, y, 0);
    });
}

// ===================== GRID 5x4x10 =====================
function layoutGrid() {
    const { x: gx, y: gy, z: gz } = CONFIG.gridSize;
    const spacing = 200;
    let i = 0;

    for (let z = 0; z < gz; z++) {
        for (let y = 0; y < gy; y++) {
            for (let x = 0; x < gx; x++) {
                if (i >= objects.length) return;

                objects[i].position.set(
                    (x - gx / 2) * spacing,
                    (gy / 2 - y) * spacing,
                    (z - gz / 2) * spacing
                );
                objects[i].rotation.set(0, 0, 0);
                i++;
            }
        }
    }
}

// ===================== FALLBACK DATA =====================
function useSampleData() {
    data = [];
    for (let i = 0; i < 200; i++) {
        data.push({
            name: `Person ${i + 1}`,
            photo: 'https://via.placeholder.com/50',
            age: 20 + Math.floor(Math.random() * 40),
            country: ['MY', 'US', 'IN', 'CN'][i % 4],
            interest: ['Travel', 'Coding', 'Art', 'Music'][i % 4],
            netWorth: `$${(30000 + Math.random() * 300000).toFixed(0)}`
        });
    }
    createTiles();
    layoutTable();
}

// ===================== RESIZE =====================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===================== ANIMATION =====================
function animate() {
    requestAnimationFrame(animate);

    if (currentLayout === 'helix') {
        scene.rotation.y += 0.002;
    }

    if (currentLayout === 'sphere') {
        scene.rotation.y += 0.0015;
    }

    controls.update();
    renderer.render(scene, camera);
}
