import * as THREE from 'three';

import { BlockAtlas } from './lib/Blocks.js';
import { BlockGeometryFactory } from './lib/BlockGeometryFactory.js';
import { Player } from './lib/player/Player.js';
import ChunkManager from './lib/chunks/ChunkManager.js';
import World from './lib/World.js';
import { Environment } from './lib/Sky.js';
import { TickManager } from './lib/TickManager.js';
import { Cow } from './lib/mobs/Cow.js';
import { Zombie } from './lib/mobs/Zombie.js';

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

// const mobManager = new MobManager(world, player);

world.setDimension('overworld');
sky.setDimension('overworld');
world.safeSpawn(player);

// mobManager.spawnMob('cow', new THREE.Vector3(24, 20, 24));
// mobManager.spawnMob('zombie', new THREE.Vector3(30, 20, 30));

const cow = new Cow(world, new THREE.Vector3(26, 30, 26));
const zombie = new Zombie(world, new THREE.Vector3(28, 30, 28), player);

const tickManager = new TickManager(chunkManager, world);

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    delta = Math.min(delta, 0.05);
    sky.update(delta, player.position);

    factory.update(delta);

    player.update(delta, 1);
    chunkManager.chunkChangeCheck(player, world)

    cow.update(delta);
    zombie.update(delta);

    // tickManager.update(delta);
    player.UI.updateDebugInfo(player, world);
    world.fluidSim.update(delta);
    renderer.render(scene, camera);

}
animate();

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyN') {
        const currentPos = player.position.clone(); // 1. Save Position

        const newDim = world.dimension === 'overworld' ? 'nether' : 'overworld';

        // 2. Switch System Dimensions
        world.setDimension(newDim);
        sky.setDimension(newDim);

        // 3. Restore Position (TP to same coords)
        if (newDim === "nether")
            player.position.set(player.position.x / 8, player.position.y, player.position.z / 8);
        else player.position.set(player.position.x * 8, player.position.y, player.position.z * 8)

        player.velocity.set(0, 0, 0);
    }
});