import * as THREE from 'three';

import { BlockAtlas } from './lib/Blocks.js';
import { BlockGeometryFactory } from './lib/BlockGeometryFactory.js';
import { Player } from './lib/player/Player.js';
import ChunkManager from './lib/chunks/ChunkManager.js';
import World from './lib/World.js';
import { Environment } from './lib/Sky.js';
import { TickManager } from './lib/TickManager.js';
import { MobManager } from './lib/mobs/MobManager.js';
import { VRAMUsage } from './lib/VRAMUsage.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
camera.name = 'PlayerPerspective'
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// renderer.setClearColor(0x87ceeb);
renderer.setClearColor(0x200505);

// load texture
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
const chunkManager = new ChunkManager(world.chunkSize, 6, world, world.modifiedMap);

const player = new Player(scene, camera, chunkManager, world);
const clock = new THREE.Clock();
const sky = new Environment(scene, renderer);

world.chunkManager = chunkManager;

const mobManager = new MobManager(world, player);

world.setDimension('overworld');
sky.setDimension('overworld');
world.safeSpawn(player);

player.mobManager = mobManager;
world.mobManager = mobManager;

// const tickManager = new TickManager(chunkManager, world);

const vramTracker = new VRAMUsage(renderer, scene);
let vramTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    delta = Math.min(delta, 0.05);
    sky.update(delta, player.position);

    factory.update(delta);

    player.update(delta, 1);
    chunkManager.chunkChangeCheck(player, world)

    const isNight = sky.time > 0.5 && sky.time < 0.9;

    mobManager.update(delta, isNight);

    player.UI.updateMobCounts(mobManager.mobs.length, mobManager.getSavedMobCount());

    // tickManager.update(delta);
    player.UI.updateDebugInfo(player, world);
    world.fluidSim.update(delta);

    vramTimer += delta;
    if (vramTimer > 1.0) {
        vramTimer = 0;
        const stats = vramTracker.getStats(world);
        player.UI.updatevramDebugInfo(stats);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyN') {
        const newDim = world.dimension === 'overworld' ? 'nether' : 'overworld';

        world.setDimension(newDim);
        sky.setDimension(newDim);

        if (newDim === "nether")
            player.position.set(player.position.x / 8, player.position.y, player.position.z / 8);
        else player.position.set(player.position.x * 8, player.position.y, player.position.z * 8)

        player.velocity.set(0, 0, 0);
    }
});