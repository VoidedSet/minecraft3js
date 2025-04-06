import * as THREE from 'three';

import { BlockAtlas } from './lib/Blocks.js';
import { BlockGeometryFactory } from './lib/BlockGeometryFactory.js';
import { Chunk } from './lib/Chunk.js';
import { ChunkRenderer } from './lib/ChunkRender.js';
import { Player } from './lib/PlayerMovement.js';
import WorldBiomes from './lib/world.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 0);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// const controls = new OrbitControls(camera, renderer.domElement);

// Load Texture
const loader = new THREE.TextureLoader();
const texture = loader.load('../blocks.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
texture.flipY = false;
texture.colorSpace = THREE.SRGBColorSpace;
texture.alphaTest = 0.5;

const atlas = new BlockAtlas(texture);
const factory = new BlockGeometryFactory(atlas);
const material = new THREE.MeshBasicMaterial({ map: texture });

const world = new WorldBiomes(scene, factory, material);

// const rendererChunk = new ChunkRenderer(scene, factory, material, 32);

// const chunk = new Chunk(0, 0, 32, 30, 10);
// const chunk1 = new Chunk(1, 1, 32, 30, 10);
// const chunk2 = new Chunk(0, 1, 32, 30, 10);
// const chunk3 = new Chunk(1, 0, 32, 30, 10);
// rendererChunk.render(chunk, 0, 0);
// rendererChunk.render(chunk1, 1, 1)
// rendererChunk.render(chunk2, 0, 1);
// rendererChunk.render(chunk3, 1, 0);

const player = new Player(scene, camera);
const clock = new THREE.Clock();


function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    player.update(delta, 1);
    renderer.render(scene, camera);
}
animate();
