import * as THREE from 'three';

import { BlockAtlas } from './lib/Blocks.js';
import { BlockGeometryFactory } from './lib/BlockGeometryFactory.js';
import { Player } from './lib/PlayerMovement.js';
import ChunkManager from './lib/chunks/ChunkManager.js';
import WorldBiomes from './lib/world.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
camera.name = 'PlayerPerspective'
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load Texture
const loader = new THREE.TextureLoader();
const texture = loader.load('../blocks.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;

texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
texture.flipY = false;
texture.colorSpace = THREE.SRGBColorSpace;
texture.alphaTest = 0.5;

const atlas = new BlockAtlas(texture);
const factory = new BlockGeometryFactory(atlas);
const material = new THREE.MeshBasicMaterial({ map: texture });

const world = new WorldBiomes(scene, factory, material);
const chunkManager = new ChunkManager(world.chunkSize, 16, world);

const player = new Player(scene, camera, chunkManager);
const clock = new THREE.Clock();


scene.fog = new THREE.FogExp2(0x87ceeb, 0.015); // sky blue, tweak density
renderer.setClearColor(0x87ceeb);

world.safeSpawn(player);

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    player.update(delta, 1);
    chunkManager.chunkChangeCheck(player, world)
    renderer.render(scene, camera);
}
animate();
