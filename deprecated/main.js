import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeNoise2D } from 'open-simplex-noise';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(40, 40, 50);
controls.update();

const textureLoader = new THREE.TextureLoader();
const blockTexture = textureLoader.load('../blocks.png');

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
    return [
        x * UV_SCALE, y * UV_SCALE,          // bl)
        (x + 1) * UV_SCALE, y * UV_SCALE,    // br
        (x + 1) * UV_SCALE, (y + 1) * UV_SCALE, // tr
        x * UV_SCALE, (y + 1) * UV_SCALE     // tl
    ];
}

function createBlockGeometry(type) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const uvs = getUVs(type);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geometry;
}
const material = new THREE.MeshBasicMaterial({ map: blockTexture });
const noise2D = makeNoise2D(Date.now());
const chunks = []
const CHUNK_SIZE = 32;
const HEIGHT_SCALE = 30;
const WATER_LEVEL = 10;
const NUM_CHUNKS = 1;
const BLOCK_AIR = 0;
const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_WATER = 3;
const BLOCK_SAND = 6;
const BLOCK_STONE = 7;
const BLOCK_COAL = 8;
const BLOCK_IRON = 9;
function generateChunk(cx, cz) {
    let chunk = new Array(CHUNK_SIZE).fill().map(() =>
        new Array(CHUNK_SIZE).fill().map(() =>
            new Array(CHUNK_SIZE).fill(BLOCK_AIR)
        )
    );
    let grassCount = 0, dirtCount = 0, waterCount = 0, sandCount = 0, stoneCount = 0, coalCount = 0, ironCount = 0;
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            let worldX = cx * CHUNK_SIZE + x;
            let worldZ = cz * CHUNK_SIZE + z;

            let height = Math.floor((noise2D(worldX * 0.1, worldZ * 0.1) + 1) / 2 * HEIGHT_SCALE);
            let stoneDepth = Math.floor((noise2D(worldX * 0.2, worldZ * 0.2) + 1) * 1.5) + 1;

            for (let y = 0; y <= height; y++) {
                let blockType;

                if (y === height) {
                    blockType = BLOCK_GRASS;
                    grassCount++;
                } else if (y >= height - stoneDepth) {
                    blockType = BLOCK_DIRT;
                    dirtCount++;
                } else {
                    blockType = BLOCK_STONE;
                    stoneCount++;

                    // Random Ore Generation
                    let oreChance = Math.random();
                    if (y > 0 && y < 40 && oreChance < 0.05) {
                        blockType = BLOCK_COAL;  // 5% chance for coal
                        coalCount++;
                    }
                    if (y > 5 && y < 30 && oreChance < 0.02) {
                        blockType = BLOCK_IRON;  // 2% chance for iron
                        ironCount++;
                    }
                }

                chunk[x][y][z] = blockType;
            }

            for (let y = 0; y <= WATER_LEVEL; y++) {
                if (chunk[x][y][z] === BLOCK_AIR) {
                    chunk[x][y][z] = BLOCK_WATER;
                    waterCount++;
                }
                if (chunk[x][y][z] === BLOCK_GRASS) {
                    chunk[x][y][z] = BLOCK_SAND;
                    sandCount++;
                }
            }
        }
    }

    const grassGeometry = createBlockGeometry('grass');
    const dirtGeometry = createBlockGeometry('dirt');
    const waterGeometry = createBlockGeometry('water');
    const sandGeometry = createBlockGeometry('sand');
    const stoneGeometry = createBlockGeometry('stone');
    const coalGeometry = createBlockGeometry('coal');
    const ironGeometry = createBlockGeometry('iron');

    const grassMesh = new THREE.InstancedMesh(grassGeometry, material, grassCount);
    const dirtMesh = new THREE.InstancedMesh(dirtGeometry, material, dirtCount);
    const waterMesh = new THREE.InstancedMesh(waterGeometry, material, waterCount);
    const sandMesh = new THREE.InstancedMesh(sandGeometry, material, sandCount);
    const stoneMesh = new THREE.InstancedMesh(stoneGeometry, material, stoneCount);
    const coalMesh = new THREE.InstancedMesh(coalGeometry, material, coalCount);
    const ironMesh = new THREE.InstancedMesh(ironGeometry, material, ironCount);

    scene.add(grassMesh, sandMesh, dirtMesh, waterMesh, stoneMesh, coalMesh, ironMesh);

    let grassIndex = 0, dirtIndex = 0, waterIndex = 0, sandIndex = 0, stoneIndex = 0, coalIndex = 0, ironIndex = 0;
    const matrix = new THREE.Matrix4();

    // Place Blocks
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                if (chunk[x][y][z] === BLOCK_AIR) continue;

                let worldX = cx * CHUNK_SIZE + x;
                let worldZ = cz * CHUNK_SIZE + z;

                matrix.setPosition(worldX, y, worldZ);

                if (chunk[x][y][z] === BLOCK_GRASS) {
                    grassMesh.setMatrixAt(grassIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_DIRT) {
                    dirtMesh.setMatrixAt(dirtIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_WATER) {
                    waterMesh.setMatrixAt(waterIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_SAND) {
                    sandMesh.setMatrixAt(sandIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_STONE) {
                    stoneMesh.setMatrixAt(stoneIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_COAL) {
                    coalMesh.setMatrixAt(coalIndex++, matrix);
                } else if (chunk[x][y][z] === BLOCK_IRON) {
                    ironMesh.setMatrixAt(ironIndex++, matrix);
                }
            }
        }
    }


    grassMesh.instanceMatrix.needsUpdate = true;
    dirtMesh.instanceMatrix.needsUpdate = true;
    waterMesh.instanceMatrix.needsUpdate = true;
    sandMesh.instanceMatrix.needsUpdate = true;
    stoneMesh.instanceMatrix.needsUpdate = true;
    coalMesh.instanceMatrix.needsUpdate = true;
    ironMesh.instanceMatrix.needsUpdate = true;

    return chunk
}

for (let cx = 0; cx < NUM_CHUNKS; cx++) {
    for (let cz = 0; cz < NUM_CHUNKS; cz++) {
        chunks[`${cx},${cz}`] = generateChunk(cx, cz);
    }
}

function renderChunk(cx, cz, chunk) {
    let grassCount = 0, dirtCount = 0, waterCount = 0, sandCount = 0, stoneCount = 0, coalCount = 0, ironCount = 0;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                let block = chunk[x][y][z];

                if (block === BLOCK_GRASS) grassCount++;
                else if (block === BLOCK_DIRT) dirtCount++;
                else if (block === BLOCK_WATER) waterCount++;
                else if (block === BLOCK_SAND) sandCount++;
                else if (block === BLOCK_STONE) stoneCount++;
                else if (block === BLOCK_COAL) coalCount++;
                else if (block === BLOCK_IRON) ironCount++;
            }
        }
    }

    const grassMesh = new THREE.InstancedMesh(createBlockGeometry('grass'), material, grassCount);
    const dirtMesh = new THREE.InstancedMesh(createBlockGeometry('dirt'), material, dirtCount);
    const waterMesh = new THREE.InstancedMesh(createBlockGeometry('water'), material, waterCount);
    const sandMesh = new THREE.InstancedMesh(createBlockGeometry('sand'), material, sandCount);
    const stoneMesh = new THREE.InstancedMesh(createBlockGeometry('stone'), material, stoneCount);
    const coalMesh = new THREE.InstancedMesh(createBlockGeometry('coal'), material, coalCount);
    const ironMesh = new THREE.InstancedMesh(createBlockGeometry('iron'), material, ironCount);

    scene.add(grassMesh, sandMesh, dirtMesh, waterMesh, stoneMesh, coalMesh, ironMesh);

    let grassIndex = 0, dirtIndex = 0, waterIndex = 0, sandIndex = 0, stoneIndex = 0, coalIndex = 0, ironIndex = 0;
    const matrix = new THREE.Matrix4();

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                let block = chunk[x][y][z];
                if (block === BLOCK_AIR) continue;

                let worldX = cx * CHUNK_SIZE + x;
                let worldZ = cz * CHUNK_SIZE + z;
                matrix.setPosition(worldX, y, worldZ);

                if (block === BLOCK_GRASS) grassMesh.setMatrixAt(grassIndex++, matrix);
                else if (block === BLOCK_DIRT) dirtMesh.setMatrixAt(dirtIndex++, matrix);
                else if (block === BLOCK_WATER) waterMesh.setMatrixAt(waterIndex++, matrix);
                else if (block === BLOCK_SAND) sandMesh.setMatrixAt(sandIndex++, matrix);
                else if (block === BLOCK_STONE) stoneMesh.setMatrixAt(stoneIndex++, matrix);
                else if (block === BLOCK_COAL) coalMesh.setMatrixAt(coalIndex++, matrix);
                else if (block === BLOCK_IRON) ironMesh.setMatrixAt(ironIndex++, matrix);
            }
        }
    }

    grassMesh.instanceMatrix.needsUpdate = true;
    dirtMesh.instanceMatrix.needsUpdate = true;
    waterMesh.instanceMatrix.needsUpdate = true;
    sandMesh.instanceMatrix.needsUpdate = true;
    stoneMesh.instanceMatrix.needsUpdate = true;
    coalMesh.instanceMatrix.needsUpdate = true;
    ironMesh.instanceMatrix.needsUpdate = true;
}



// Animation Loop
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

function saveWorld() {
    const saveData = {};

    for (let key in chunks) {
        saveData[key] = chunks[key].map(layer => layer.map(row => [...row]));
        // Converts 3D arrays to plain JSON-compatible data
    }

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "world.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function loadWorld(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const loadedChunks = JSON.parse(e.target.result);
        clearScene(); // 🧹 Remove old terrain before loading

        for (let key in loadedChunks) {
            let [cx, cz] = key.split(',').map(Number);
            chunks[key] = loadedChunks[key]; // Restore block data
            renderChunk(cx, cz, chunks[key]); // Rebuild meshes
        }
    };
    reader.readAsText(file);
}

// 🧹 Clears previous terrain before loading a new one
function clearScene() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        if (obj instanceof THREE.InstancedMesh) {
            scene.remove(obj);
            obj.dispose();
        }
    }
}

// clearScene()

document.getElementById("loadFile").addEventListener("change", loadWorld);

// Call it after all chunks are generated:
// saveWorld();
