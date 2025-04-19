import * as THREE from 'three';
import { OrbitControls, ThreeMFLoader } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement)

const blockTexture = new THREE.TextureLoader().load('../blocks.png')
blockTexture.magFilter = THREE.NearestFilter;
blockTexture.minFilter = THREE.NearestFilter;
blockTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
blockTexture.generateMipmaps = false;
blockTexture.flipY = false;
blockTexture.colorSpace = THREE.SRGBColorSpace;
blockTexture.transparent = true;
blockTexture.alphaTest = 0.5;

const ATLAS_SIZE = 256;
const TILE_SIZE = 16;
const UV_SCALE = TILE_SIZE / ATLAS_SIZE;

const UVs = {
    grass: { top: [0, 0], side: [1, 0], bottom: [2, 0] },
    dirt: { top: [2, 0], side: [2, 0], bottom: [2, 0] },
    stone: { top: [3, 0], side: [3, 0], bottom: [3, 0] },
    coal: { top: [4, 0], side: [4, 0], bottom: [4, 0] },
    iron: { top: [5, 0], side: [5, 0], bottom: [5, 0] },
    water: { top: [0, 15], side: [0, 15], bottom: [0, 15] },
    sand: { top: [0, 1], side: [0, 1], bottom: [0, 1] }
};


function getUVs(type) {
    if (!UVs[type]) {
        console.error(`UV mapping for ${type} not found`);
        return;
    }
    let { top, side, bottom } = UVs[type];
    const uvs = new Float32Array([
        ...getFaceUV(side),
        ...getFaceUV(side),
        ...getFaceUV(top),
        ...getFaceUV(bottom),
        ...getFaceUV(side),
        ...getFaceUV(side)
    ]);
    return uvs;
}

function getFaceUV([x, y]) {
    const sx = UV_SCALE;
    const sy = UV_SCALE;
    const eps = 0.001;

    return [
        x * sx + eps, y * sy + eps,
        (x + 1) * sx - eps, y * sy + eps,
        x * sx + eps, (y + 1) * sy - eps,
        (x + 1) * sx - eps, (y + 1) * sy - eps
    ];
}

function createBlockGeometry(type) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const uvs = getUVs(type);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geometry;
}
const cubegeometry = createBlockGeometry('grass');
const cubeMaterial = new THREE.MeshBasicMaterial({ map: blockTexture });
const instanceCount = 160 * 16 // 65536 cubes
const dummy = new THREE.Object3D();
const instancedMesh = new THREE.InstancedMesh(cubegeometry, cubeMaterial, instanceCount);
scene.add(instancedMesh);

instancedMesh.geometry.center()

let index = 0;
for (let cx = 0; cx < 1; cx++) {
    for (let cz = 0; cz < 1; cz++) {
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 10; y++) {
                for (let z = 0; z < 16; z++) {
                    let wx = x + cx * 16;
                    let wz = z + cz * 16;
                    dummy.position.set(wx, y, wz);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(index++, dummy.matrix);
                }
            }
        }
    }
}
instancedMesh.instanceMatrix.needsUpdate = true;

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x55eb34 })
)
cube.position.set(0, 0, 0)
// scene.add(cube)
camera.position.z = 5;



function animate() {


    // cube.rotation.y += 0.006

    // instancedMesh.rotation.y += 0.006
    renderer.render(scene, camera);

}