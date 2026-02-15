import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 10;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const geometry = new THREE.IcosahedronGeometry(1.0, 2);
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    flatshading: true,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const wireMet = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
});

const wireMesh = new THREE.Mesh(geometry, wireMet);
wireMesh.scale.setScalar(1.01);
mesh.add(wireMesh);

const hemlight = new THREE.HemisphereLight(0x009ff, 0xaa5500);
scene.add(hemlight);

function animate(t=0) {
    //console.log(t);
    requestAnimationFrame(animate);
    mesh.rotation.y = t * 0.0001;
    //mesh .scale.setScalar(Math.cos(t * 0.001) + 1.0);
    renderer.render(scene, camera);
    controls.update();
}
animate();



