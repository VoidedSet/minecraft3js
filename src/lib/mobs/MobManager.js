import * as THREE from 'three';

import { Mobs, MobType } from './Mobs.js';
import { PassiveMob } from './PassiveMob.js';
import { AggressiveMob } from './AggressiveMob.js';
import { BlockDict } from '../Blocks.js';

const GLOBAL_MOB_CAP = 32;

export class MobManager {
    constructor(world, player) {
        this.world = world;
        this.player = player;

        this.mobs = [];
        this.savedMobs = new Map();
        this.currentIsNight = false;
    }

    getSavedMobCount() {
        let count = 0;
        for (const list of this.savedMobs.values()) {
            count += list.length;
        }
        return count;
    }

    disposeMob(mob) {
        this.world.scene.remove(mob.mesh);

        requestAnimationFrame(() => {
            mob.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();

                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];

                        materials.forEach(mat => {
                            if (mat.map) mat.map.dispose();
                            mat.dispose();
                        });
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
                    hasInteracted: true
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
                        hasInteracted: true
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

        // 1. Restore Saved Mobs (Always allowed, ignores cap)
        if (this.savedMobs.has(key)) {
            const savedList = this.savedMobs.get(key);
            for (const data of savedList) {
                this.spawnMob(data.name, new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z), data);
            }
            this.generateAggressiveMobs(cx, cz);
        }
        // 2. Generate NEW Mobs (Respects Cap)
        else {
            this.generateMobsForChunk(cx, cz);
        }
    }

    generateMobsForChunk(cx, cz) {
        // --- CHECK 1: Global Mob Cap ---
        if (this.mobs.length >= GLOBAL_MOB_CAP) return;

        const chunkSize = this.world.chunkSize;
        const wx = cx * chunkSize;
        const wz = cz * chunkSize;
        const biome = this.world.getBiome(wx + 8, wz + 8);

        let possibleMobs = [];

        if (this.world.dimension === 'nether') {
            possibleMobs = ['zombie_pigman']
        } else {
            if (this.currentIsNight) {
                possibleMobs = ['zombie'];
            } else {
                if (biome === 'plains' || biome === 'hills') {
                    possibleMobs = ['cow', 'pig'];
                } else if (biome === 'mountains') {
                    possibleMobs = ['cow', 'dogs'];
                }
            }
        }

        if (possibleMobs.length === 0) return;
        if (Math.random() > 0.3) return;

        const mobType = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
        const count = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < count; i++) {
            // Check cap again inside loop
            if (this.mobs.length >= GLOBAL_MOB_CAP) break;

            const lx = Math.floor(Math.random() * chunkSize);
            const lz = Math.floor(Math.random() * chunkSize);
            const gx = wx + lx;
            const gz = wz + lz;

            let gy = 100;
            for (let y = 50; y > 15; y--) {
                if (this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y, gz)) === BlockDict.grass.id || this.world.chunkManager.returnBlockId(new THREE.Vector3(gx, y, gz)) === BlockDict.netherrack.id) {
                    gy = y + 2;
                    break;
                }
            }

            if (gy === 100)
                return
            this.spawnMob(mobType, new THREE.Vector3(gx + 0.5, gy, gz + 0.5));
        }

        // Try spawning enemies if space allows
        if (this.mobs.length < GLOBAL_MOB_CAP) {
            this.generateAggressiveMobs(cx, cz);
        }
    }

    generateAggressiveMobs(cx, cz) {
        if (this.mobs.length >= GLOBAL_MOB_CAP) return;

        if (this.world.dimension === 'overworld' && Math.random() < 0.05) {
            // ... (Add zombie logic here later) ...
        }
    }

    spawnMob(mobName, pos) {
        const config = Mobs[mobName];
        if (!config) {
            console.warn(`Mob '${mobName}' not found in Mobs.js`);
            return;
        }

        let mob;
        if (config.type === MobType.PASSIVE) {
            mob = new PassiveMob(this.world, pos, config, this.player);
        } else if (config.type === MobType.AGGRESSIVE) {
            mob = new AggressiveMob(this.world, pos, config, this.player);
        }

        if (mob) {
            this.mobs.push(mob);
        }
    }

    spawnBaby(mobName, pos) {
        const config = Mobs[mobName];
        if (!config) return;

        let baby;
        if (config.type === MobType.PASSIVE) {
            baby = new PassiveMob(this.world, pos, config, this.player);
        }

        if (baby) {
            baby.isBaby = true;

            baby.mesh.scale.set(0.5, 0.5, 0.5);

            baby.collider.size.multiplyScalar(0.5);
            baby.collider.offset.multiplyScalar(0.5);
            console.log(this.mobs)

            this.mobs.push(baby);
            console.log(this.mobs)
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

            if (mob.config.type === MobType.AGGRESSIVE && !isNight) {
                mob.takeDamage(delta * 0.1, mob.position);
                if (Math.random() < 0.1) mob.flashRed();
            }
        }
    }
}