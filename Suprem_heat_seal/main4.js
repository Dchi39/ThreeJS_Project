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

const blockMesh = new THREE.Mesh(
  new THREE.BoxGeometry(blockSize, blockThickness, blockSize),
  new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.7,
    roughness: 0.35
  })
);
scene.add(blockMesh);

/* ================= HEAT MAP PLANE ================= */
const planeGeom = new THREE.PlaneGeometry(blockSize, blockSize, 80, 80);
const planeMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  metalness: 0.7,
  roughness: 0.35
});

const planeMesh = new THREE.Mesh(planeGeom, planeMat);
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.position.y = blockThickness / 2 + 0.01;
scene.add(planeMesh);

// Initialize colors
const colors = [];
for (let i = 0; i < planeGeom.attributes.position.count; i++) {
  colors.push(0, 0, 1);
}
planeGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

/* ================= COILS ================= */
const coils = [
  { radius: 2.5, power: 800 }, // 150°C
  { radius: 4.0, power: 240 }, // 130°C
  { radius: 5.5, power: 200 }, // 110°C
  { radius: 6.5, power: 160 }  // 80°C
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
const labelData = [
  { radius: coils[0].radius, z: 0,  temp: 150 },
  { radius: coils[1].radius, z: 1,  temp: 130 },
  { radius: coils[2].radius, z: 2,  temp: 110 },
  { radius: coils[3].radius, z: -1, temp: 80  }
];

new FontLoader().load(
  'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    labelData.forEach(d => {
      const geom = new TextGeometry(`${d.temp}°C`, {
        font,
        size: 0.8,
        height: 0.05
      });

      const mat = new THREE.MeshBasicMaterial({
        color: d.temp >= 130 ? 0xff0000 : 0xffaa00
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(d.radius, blockThickness / 2 + 0.5, d.z);
      mesh.rotation.y = Math.PI;
      scene.add(mesh);
    });
  }
);

/* ================= HEAT MAP ================= */
function updateHeatMap() {
  const pos = planeGeom.attributes.position;
  const col = planeGeom.attributes.color;
  const spread = 2.2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const r = Math.sqrt(x * x + z * z);

    let heat = 0;
    coils.forEach((c, idx) => {
      const dr = r - c.radius;
      const boost = idx === 0 ? 1.6 : 1.0;
      heat += boost * c.power * Math.exp(-(dr * dr) / (spread * spread));
    });

    const t = THREE.MathUtils.clamp(heat / 300, 0, 1);

    col.setXYZ(
      i,
      t,
      1.0 - Math.abs(t - 0.5) * 2.0,
      1.0 - t
    );
  }
  col.needsUpdate = true;
}

/* ================= ANIMATION LOOP ================= */
function animate() {
  requestAnimationFrame(animate);
  updateHeatMap();
  controls.update();
  renderer.render(scene, camera);
}

animate();

/* ================= RESIZE ================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});