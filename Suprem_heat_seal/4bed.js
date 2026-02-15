import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/* ================= BASIC SETUP ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222230);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 80, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ================= LIGHTING ================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
dir1.position.set(50, 100, 50);
scene.add(dir1);

const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
dir2.position.set(-50, 100, -50);
scene.add(dir2);

/* ================= BLOCK SETTINGS ================= */
const blockSize = 15;
const blockThickness = 2;
const blockCount = 5;
const circleRadius = 40; // radius of circle pattern
const blocks = [];
let loadedFont = null;

//Rotating settings
let currentStep = 0;                     // which step we are on (0–4 for 5 steps)
const totalSteps = 5;                    // 360 / 72 = 5 steps
const stepAngle = THREE.MathUtils.degToRad(72); // 72 degrees in radians
let targetRotationY = 0;                 // rotation target
let lastStepTime = performance.now();    // time when last step finished
const waitTime = 5000;                  // 10 seconds pause
const rotationSpeed = 0.02;              // radians per frame

/* ================= FONT LOADER ================= */
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', font => {
    loadedFont = font;
});

/* ================= CREATE BLOCK FUNCTION ================= */
function createBlock(xPos, zPos) {
    // Block mesh
    const blockMesh = new THREE.Mesh(
        new THREE.BoxGeometry(blockSize, blockThickness, blockSize),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.35 })
    );
    blockMesh.position.set(xPos, 0, zPos);

    // Plane for heat map
    const planeGeom = new THREE.PlaneGeometry(blockSize, blockSize, 80, 80);
    const planeMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        metalness: 0.7,
        roughness: 0.35
    });
    const planeMesh = new THREE.Mesh(planeGeom, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.set(xPos, blockThickness / 2 + 0.01, zPos);

    // Initialize vertex colors
    const colors = [];
    for (let i = 0; i < planeGeom.attributes.position.count; i++) colors.push(0, 0, 1);
    planeGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Coils
    const coils = [
        { radius: 2.5, power: 300 },
        { radius: 4.0, power: 180 },
        { radius: 5.5, power: 150 },
        { radius: 6.5, power: 120 }
    ];

    // Create rings
    const coilMeshes = [];
    coils.forEach(c => {
        const ringGeo = new THREE.RingGeometry(c.radius - 0.15, c.radius + 0.15, 128);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(xPos, blockThickness / 2 + 0.1, zPos);
        coilMeshes.push(ring);
    });

    // Temperature labels
    const tempLabels = [];
    if (loadedFont) {
        coils.forEach((c, idx) => {
            const geom = new TextGeometry(Math.floor(c.power).toString(), {
                font: loadedFont,
                size: 0.8,
                height: 0.05
            });
            const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(xPos + c.radius, blockThickness / 2 + 0.5, zPos);
            tempLabels.push(mesh);
        });
    }

    return { blockMesh, planeMesh, coils, centerX: xPos, centerZ: zPos, tempLabels, coilMeshes };
}

/* ================= ROTATING GROUP ================= */
const rotatingGroup = new THREE.Group();
scene.add(rotatingGroup);

/* ================= CIRCULAR BASE support2 ================= */
const baseRadius2 = 15;
const baseThickness2 = 50;
const baseGeom2 = new THREE.CylinderGeometry(baseRadius2, baseRadius2, baseThickness2, 128);
const baseMat2 = new THREE.MeshStandardMaterial({ color: 0xdeadaf, metalness: 0.7, roughness: 0.7 });
const baseMesh2 = new THREE.Mesh(baseGeom2, baseMat2);
baseMesh2.position.y = baseThickness2 / 2;
rotatingGroup.add(baseMesh2);

/* ================= CREATE 5 BLOCKS AFTER FONT LOAD ================= */
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', font => {
    loadedFont = font;

    const angleOffset = -Math.PI / 2;
    for (let i = 0; i < blockCount; i++) {
        const angle = (i / blockCount) * Math.PI * 2 + angleOffset;
        const x = Math.cos(angle) * circleRadius;
        const z = Math.sin(angle) * circleRadius;
        const blockData = createBlock(x, z);

        // Add to rotating group
        rotatingGroup.add(blockData.blockMesh);
        rotatingGroup.add(blockData.planeMesh);
        blockData.coilMeshes.forEach(c => rotatingGroup.add(c));
        blockData.tempLabels.forEach(t => rotatingGroup.add(t));

        blocks.push(blockData);
    }
});

/* ================= OTHER STATIC BASES ================= */
// Just adding them to scene directly (not rotating)
const baseRadius = 60;
const baseThickness = 2;
const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseThickness, 128);
const baseMat = new THREE.MeshStandardMaterial({ color: 0xbebea0, metalness: 0.7, roughness: 0.7 });
const baseMesh = new THREE.Mesh(baseGeom, baseMat);
baseMesh.position.y = -baseThickness / 2;
scene.add(baseMesh);

const baseGeom3 = new THREE.CylinderGeometry(60, 60, 50, 10);
const baseMat3 = new THREE.MeshStandardMaterial({ color: 0xe5e5e5, metalness: 0.4, roughness: 0.7 });
const baseMesh3 = new THREE.Mesh(baseGeom3, baseMat3);
baseMesh3.position.y = -50 / 2 - 2;
scene.add(baseMesh3);

const baseGeom5 = new THREE.CylinderGeometry(60, 60, 4, 10);
const baseMat5 = new THREE.MeshStandardMaterial({ color: 0x240c0c, metalness: 0.7, roughness: 0.7 });
const baseMesh5 = new THREE.Mesh(baseGeom5, baseMat5);
baseMesh5.position.y = -4 / 2 - 52;
scene.add(baseMesh5);

const baseGeom4 = new THREE.CylinderGeometry(60, 60, 2, 128);
const baseMat4 = new THREE.MeshStandardMaterial({ color: 0xe5e5e5, metalness: 0.7, roughness: 0.7 });
const baseMesh4 = new THREE.Mesh(baseGeom4, baseMat4);
baseMesh4.position.y = -2 / 2 + 52;
scene.add(baseMesh4);

/* ================= UPDATE HEAT MAPS ================= */
function updateHeatMaps() {
    blocks.forEach(block => {
        const { planeMesh, coils, centerX, centerZ, tempLabels } = block;
        const geom = planeMesh.geometry;
        const pos = geom.attributes.position;
        const col = geom.attributes.color;
        const spread = 2.8;

        for (let i = 0; i < pos.count; i++) {
            const localX = pos.getX(i);
            const localZ = pos.getY(i);
            const r = Math.sqrt(localX * localX + localZ * localZ);

            let heat = 0;
            coils.forEach(c => {
                const dr = r - c.radius;
                heat += c.power * Math.exp(-(dr * dr) / (spread * spread));
            });

            const t = THREE.MathUtils.clamp(heat / 300, 0, 1);
            col.setXYZ(i, t, 1 - Math.abs(t - 0.5) * 2, 1 - t);
        }
        col.needsUpdate = true;

        // Update temperature labels
        if (loadedFont) {
            tempLabels.forEach((label, idx) => {
                const temp = Math.floor(coils[idx].power);
                label.geometry.dispose();
                label.geometry = new TextGeometry(temp.toString(), { font: loadedFont, size: 0.8, height: 0.05 });
                label.position.set(centerX + coils[idx].radius, blockThickness / 2 + 0.5, centerZ);
                label.lookAt(camera.position);
            });
        }
    });
}

/* ================= RANDOM TEMPERATURE ================= */
function simulateRandomTemperatures() {
    blocks.forEach(({ coils }) => {
        coils.forEach(c => {
            const fluct = Math.random() * 40 - 20;
            c.power = Math.max(50, Math.min(300, c.power + fluct));
        });
    });
}

/* ================= ANIMATION LOOP ================= */
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    
    // Check if we should start a new step
    if (now - lastStepTime >= waitTime) {
        targetRotationY += stepAngle;
        currentStep = (currentStep + 1) % totalSteps;
        lastStepTime = now;
    }

    // Smoothly rotate towards target
    const delta = targetRotationY - rotatingGroup.rotation.y;
    if (Math.abs(delta) > 0.001) {
        const step = Math.sign(delta) * Math.min(Math.abs(delta), rotationSpeed);
        rotatingGroup.rotation.y += step;
    } else {
        rotatingGroup.rotation.y = targetRotationY; // snap exactly
    }

    // Update temperatures
    simulateRandomTemperatures();
    updateHeatMaps();

    controls.update();
    renderer.render(scene, camera);
}

animate();

animate();

/* ================= HANDLE RESIZE ================= */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});