import * as THREE from 'three';

import { BlockAtlas } from './lib/Blocks.js';
import { BlockGeometryFactory } from './lib/BlockGeometryFactory.js';
import { Player } from './lib/player/Player.js';
import ChunkManager from './lib/chunks/ChunkManager.js';
import World from './lib/World.js';
import { Environment } from './lib/Sky.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
camera.name = 'PlayerPerspective'
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // or BasicShadowMap for performance
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setClearColor(0x87ceeb);

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
const material = new THREE.MeshLambertMaterial({
    map: texture,
    vertexColors: true
});

const world = new World(scene, factory, material);
const chunkManager = new ChunkManager(world.chunkSize, 8, world, world.modifiedMap);

const player = new Player(scene, camera, chunkManager, world);
const clock = new THREE.Clock();

world.safeSpawn(player);

const sky = new Environment(scene, renderer);

const light = new THREE.AmbientLight(0xffffff, 4)
// scene.add(light)

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    delta = Math.min(delta, 0.05);
    sky.update(delta, player.position);

    player.update(delta, 1);
    chunkManager.chunkChangeCheck(player, world)

    world.fluidSim.update(delta);
    renderer.render(scene, camera);

}
animate();
