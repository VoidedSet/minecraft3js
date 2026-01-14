import { Mobs, MobType } from './Mobs.js';
import { PassiveMob } from './PassiveMob.js';
import { AggressiveMob } from './AggressiveMob.js';

export class MobManager {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.mobs = [];
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

            this.mobs.push(baby);
            console.log("A baby was born!");
        }
    }

    update(delta) {
        this.mobs = this.mobs.filter(mob => {
            if (mob.isDead) {
                // Double check it's removed from scene
                this.world.scene.remove(mob.mesh);
                return false;
            }
            mob.update(delta);
            return true;
        });
    }
}