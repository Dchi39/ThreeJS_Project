import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/* ================= BASIC SETUP ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222230);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 60, 100);

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

/* ================= ALUMINIUM BLOCK ================= */
const blockSize = 15;
const blockThickness = 2;

// Block mesh
const blockMesh = new THREE.Mesh(
  new THREE.BoxGeometry(blockSize, blockThickness, blockSize),
  new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.35 })
);
scene.add(blockMesh);

// Plane for heat map
const planeGeom = new THREE.PlaneGeometry(blockSize, blockSize, 80, 80);
const planeMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.35 });
const planeMesh = new THREE.Mesh(planeGeom, planeMat);
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.position.y = blockThickness / 2 + 0.01;
scene.add(planeMesh);

// Initialize vertex colors
const colors = [];
for (let i = 0; i < planeGeom.attributes.position.count; i++) {
  colors.push(0, 0, 1);
}
planeGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));



/* ================= CONCENTRIC COILS ================= */
const coils = [
  { radius: 2.5, power: 200 }, // 5 cm
  { radius: 4.0, power: 180 }, // 8 cm
  { radius: 5.5, power: 150 }, // 11 cm
  { radius: 6.5, power: 120 }  // 13 cm
];

// Draw coil rings
coils.forEach(c => {
  const ringGeo = new THREE.RingGeometry(c.radius - 0.15, c.radius + 0.15, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = blockThickness / 2 + 0.1;
  scene.add(ring);
});

/* ================= TEMPERATURE LABELS ================= */
const coilLabelPositions = [
  [coils[0].radius, 0],
  [coils[1].radius, 1],
  [coils[2].radius, 2],
  [coils[3].radius, -1]
];

const coilTempLabels = [];
let loadedFont = null;

const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', font => {
  loadedFont = font;

  coilLabelPositions.forEach((pos, idx) => {
    const geom = new TextGeometry("0", { font: loadedFont, size: 0.8, height: 0.05 });
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(pos[0], blockThickness / 2 + 0.5, pos[1]);
    mesh.rotation.y = Math.PI; // face camera
    scene.add(mesh);
    coilTempLabels.push(mesh);
  });
});

let lastLabelUpdate = 0; // timestamp for 1-second interval

/* ================= HEAT MAP ================= */
function updateHeatMap() {
  const pos = planeGeom.attributes.position;
  const col = planeGeom.attributes.color;
  const spread = 2.8;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);

    const r = Math.sqrt(x * x + z * z);

    let heat = 0;
    coils.forEach(c => {
      const dr = r - c.radius;
      heat += c.power * Math.exp(-(dr * dr) / (spread * spread));
    });

    const t = THREE.MathUtils.clamp(heat / 300, 0, 1);
    const rCol = t;
    const gCol = 1.0 - Math.abs(t - 0.5) * 2.0;
    const bCol = 1.0 - t;

    col.setXYZ(i, rCol, gCol, bCol);
  }
  col.needsUpdate = true;
}

/* ================= SIMULATE RANDOM TEMPERATURE ================= */
function simulateRandomTemperature() {
  coils.forEach(c => {
    const fluct = Math.random() * 40 - 20;
    c.power = Math.max(50, Math.min(250, c.power + fluct));
  });
}

/* ================= ANIMATION LOOP ================= */
function animate(time) {
  requestAnimationFrame(animate);

  simulateRandomTemperature();
  updateHeatMap();

  // Update coil labels every 1 second
  if (loadedFont && time - lastLabelUpdate > 1000) {
    coilTempLabels.forEach((label, idx) => {
      const temp = Math.floor(coils[idx].power / 2 + 20); // scale power → temperature
      label.geometry.dispose();
      label.geometry = new TextGeometry(temp.toString(), { font: loadedFont, size: 0.8, height: 0.05 });
    });
    lastLabelUpdate = time;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

/* ================= HANDLE RESIZE ================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});