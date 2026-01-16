import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { Mobs, MobType } from './Mobs.js';
import { PassiveMob } from './PassiveMob.js';
import { AggressiveMob } from './AggressiveMob.js';
import { NeutralMob } from './NeutralMob.js';
import { BlockDict } from '../Blocks.js';

const GLOBAL_MOB_CAP = 32;

export class MobManager {
    constructor(world, player) {
        this.world = world;
        this.player = player;

        this.mobs = [];
        this.savedMobs = new Map();
        this.currentIsNight = false;

        this.modelTemplates = new Map();
        this.areModelsLoaded = false;
        this.loadAssets();

        this.angrySpecies = {};
    }

    loadAssets() {
        const loader = new GLTFLoader();
        loader.load('/assets/models.glb', (gltf) => {
            // console.log("Mob models loaded.");

            gltf.scene.traverse((child) => {
                if (child.isMesh || child.isGroup) {
                    if (child.parent === gltf.scene) {
                        this.modelTemplates.set(child.name, child);
                    }
                }
            });
            this.areModelsLoaded = true;
        }, undefined, (error) => {
            console.error("Error loading mob models:", error);
        });
    }

    getSavedMobCount() {
        let count = 0;
        for (const list of this.savedMobs.values()) {
            count += list.length;
        }
        return count;
    }

    triggerAnger(speciesName) {
        if (!this.angrySpecies[speciesName]) {
            this.angrySpecies[speciesName] = true;
            console.log(`The ${speciesName}s are angry!`);
        }
    }

    isSpeciesAngry(speciesName) {
        return !!this.angrySpecies[speciesName];
    }

    disposeMob(mob) {
        this.world.scene.remove(mob.mesh);
        requestAnimationFrame(() => {
            mob.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => mat.dispose());
                    }
                }
            });
        });
    }

    unloadAll() {
        const chunkSize = this.world.chunkSize;
        console.log(`Unloading all mobs from ${this.world.dimension}...`);

        for (const mob of this.mobs) {
            if (mob.hasInteracted) {
                const cx = Math.floor(mob.position.x / chunkSize);
                const cz = Math.floor(mob.position.z / chunkSize);
                const key = `${this.world.dimension}:${cx},${cz}`;

                if (!this.savedMobs.has(key)) {
                    this.savedMobs.set(key, []);
                }

                this.savedMobs.get(key).push({
                    name: mob.config.name.toLowerCase(),
                    pos: { x: mob.position.x, y: mob.position.y, z: mob.position.z },
                    health: mob.health,
                    isBaby: mob.isBaby,
                    hasInteracted: true,
                    isTamed: mob.isTamed || false
                });
            }
            this.disposeMob(mob);
        }
        this.mobs = [];
    }

    unloadMobs(cx, cz) {
        const chunkSize = this.world.chunkSize;
        const minX = cx * chunkSize;
        const maxX = (cx + 1) * chunkSize;
        const minZ = cz * chunkSize;
        const maxZ = (cz + 1) * chunkSize;

        const mobsToSave = [];

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            const p = mob.position;

            if (p.x >= minX && p.x < maxX && p.z >= minZ && p.z < maxZ) {
                if (mob.hasInteracted) {
                    mobsToSave.push({
                        name: mob.config.name.toLowerCase(),
                        pos: { x: p.x, y: p.y, z: p.z },
                        health: mob.health,
                        isBaby: mob.isBaby,
                        hasInteracted: true,
                        isTamed: mob.isTamed || false
                    });
                }

                this.disposeMob(mob);
                this.mobs.splice(i, 1);
            }
        }

        const key = `${this.world.dimension}:${cx},${cz}`;
        if (mobsToSave.length > 0) {
            this.savedMobs.set(key, mobsToSave);
        } else {
            this.savedMobs.delete(key);
        }
    }

    loadMobs(cx, cz) {
        const key = `${this.world.dimension}:${cx},${cz}`;
        if (this.savedMobs.has(key)) {
            const savedList = this.savedMobs.get(key);
            for (const data of savedList) {
                const mob = this.spawnMob(data.name, new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z));
                if (mob) {
                    mob.health = data.health;
                    mob.isBaby = data.isBaby;
                    mob.hasInteracted = true;
                    if (data.isTamed) mob.isTamed = true;
                    if (mob.isBaby) mob.mesh.scale.set(0.5, 0.5, 0.5);
                }
            }
            // this.generateAggressiveMobs(cx, cz);
        } else {
            this.generateMobsForChunk(cx, cz);
        }
    }

    generateMobsForChunk(cx, cz) {
        if (!this.areModelsLoaded) return;
        if (this.mobs.length >= GLOBAL_MOB_CAP) return;

        const attempts = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < attempts; i++) {
            if (this.mobs.length >= GLOBAL_MOB_CAP) break;

            if (Math.random() > 0.7) continue;

            const chunkSize = this.world.chunkSize;
            const lx = Math.floor(Math.random() * chunkSize);
            const lz = Math.floor(Math.random() * chunkSize);
            const gx = (cx * chunkSize) + lx;
            const gz = (cz * chunkSize) + lz;

            // --- Y SCANNING ---
            let gy = -1;

            if (this.world.dimension === 'nether') {
                for (let y = 33; y < 65; y++) {
                    const blockId = this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y, gz));

                    if (blockId !== BlockDict.air.id && blockId !== BlockDict.lava.id && blockId !== BlockDict.water.id) {
                        const blockAbove = this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y + 1, gz));

                        if (blockAbove === BlockDict.air.id) {
                            gy = y + 1;
                            break;
                        }
                    }
                }
            } else {
                for (let y = 85; y > 12; y--) {
                    const blockId = this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y, gz));

                    if (blockId === BlockDict.grass.id || blockId === BlockDict.dirt.id || blockId === BlockDict.snow) {
                        const blockAbove = this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y + 1, gz));

                        if (blockAbove === BlockDict.air.id) {
                            gy = y + 1;
                            break
                        }
                    }
                }
            }

            if (gy === -1) continue;

            // --- MOB SELECTION ---
            let mobType = null;

            if (this.world.dimension === 'nether') {
                if (gy > 50 && gy < 65)
                    mobType = 'zombie';
                else
                    mobType = 'zombie_pigman';
            } else if (this.currentIsNight) {
                mobType = 'zombie';
            } else {
                const biome = this.world.getBiome(gx, gz);
                const options = [];

                if (biome === 'plains') {
                    options.push('pig', 'pig', 'pig', 'cow', 'cow');
                } else if (biome === 'hills') {
                    options.push('cow');
                } else if (biome === 'mountains') {
                    options.push('dog');
                } else {
                    options.push('pig', 'cow');
                }

                if (options.length > 0) {
                    mobType = options[Math.floor(Math.random() * options.length)];
                }
            }

            if (mobType) {
                this.spawnMob(mobType, new THREE.Vector3(gx + 0.5, gy, gz + 0.5));
            }
        }
    }

    generateAggressiveMobs(cx, cz) {
        if (!this.areModelsLoaded) return;
        if (this.mobs.length >= GLOBAL_MOB_CAP) return;

        if (this.world.dimension === 'overworld' && this.currentIsNight && Math.random() < 0.05) {
        }
    }

    spawnMob(mobName, pos) {
        const config = Mobs[mobName];
        if (!config) {
            console.warn(`Mob '${mobName}' not found in Mobs.js`);
            return null;
        }

        const modelTemplate = this.modelTemplates.get(config.modelSrc);
        if (!modelTemplate) return null;

        let mob;
        if (config.type === MobType.PASSIVE) {
            mob = new PassiveMob(this.world, pos, config, this.player, modelTemplate);
        } else if (config.type === MobType.AGGRESSIVE) {
            mob = new AggressiveMob(this.world, pos, config, this.player, modelTemplate);
        } else if (config.type === MobType.NEUTRAL) {
            mob = new NeutralMob(this.world, pos, config, this.player, modelTemplate);
        }

        if (mob) {
            this.mobs.push(mob);
        }
        return mob;
    }

    spawnBaby(mobName, pos) {
        const config = Mobs[mobName];
        if (!config) return;

        const modelTemplate = this.modelTemplates.get(config.modelSrc);
        let baby;

        if (config.type === MobType.PASSIVE) {
            baby = new PassiveMob(this.world, pos, config, this.player, modelTemplate);
        } else if (config.type === MobType.NEUTRAL) {
            baby = new NeutralMob(this.world, pos, config, this.player, modelTemplate);
            baby.isTamed = true;
        }

        if (baby) {
            baby.isBaby = true;
            baby.mesh.scale.set(0.5, 0.5, 0.5);
            baby.collider.size.multiplyScalar(0.5);
            baby.collider.offset.multiplyScalar(0.5);

            this.mobs.push(baby);
            console.log("A baby was born!");
        }
    }

    update(delta, isNight) {
        this.currentIsNight = isNight;

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];

            if (mob.isDead) {
                this.disposeMob(mob)
                this.mobs.splice(i, 1);
            } else {
                mob.update(delta);
            }

            if (mob.config.type === MobType.AGGRESSIVE && !isNight && this.world.dimension === 'overworld') {
                mob.takeDamage(delta * 0.1, mob.position);
                if (Math.random() < 0.1) mob.flashRed();
            }
        }
    }
}