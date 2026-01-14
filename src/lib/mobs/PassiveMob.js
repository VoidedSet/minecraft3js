import * as THREE from 'three';
import { BaseMob } from './BaseMob.js';
import { BlockDict } from '../Blocks.js';

export class PassiveMob extends BaseMob {
    constructor(world, startPos, config, player) {
        super(world, startPos, config);

        this.config;
        this.player = player;
        this.state = 'idle'; // idle, walk, panic, inLove, follow_mate
        this.timer = 0;
        this.list = []
        this.moveDir = new THREE.Vector3();

        this.inLove = false;
        this.loveTimer = 0;
    }

    takeDamage(amount, attackerPos) {
        super.takeDamage(amount, attackerPos);

        // Enter Panic Mode when hit!
        if (!this.isDead) {
            this.state = 'panic';
            this.timer = 5.0; // Run for 5 seconds
            this.moveSpeed = this.runSpeed;

            // Run AWAY from attacker
            const runDir = new THREE.Vector3().subVectors(this.position, attackerPos).normalize();
            this.moveDir.copy(runDir);
        }
    }

    interact(itemHeld) {
        if (this.config.attraction_items.includes(itemHeld)) {

            if (this.health < this.maxHealth) {
                this.health = Math.min(this.health + 4, this.maxHealth);
                return true;
            }
            else if (!this.isBaby && !this.inLove) {
                this.inLove = true;
                this.loveTimer = 10.0;
                return true;
            }
        }
        return false;
    }

    update(delta) {
        this.aiUpdate(delta);

        if (this.state === 'walk') {
            this.velocity.x += this.moveDir.x * this.walkSpeed * delta;
            this.velocity.z += this.moveDir.z * this.walkSpeed * delta;

            if (this.onGround && Math.random() < 0.002) {
                this.velocity.y = 7;
                this.onGround = false;
            }
        }

        if (this.config.attraction_items.includes(this.player.itemHeld)) {
            this.followPlayer(delta);
        }

        this.updatePhysics(delta);
    }

    aiUpdate(delta) {
        this.timer -= delta;

        if (this.inLove) {
            this.loveTimer -= delta;
            if (this.loveTimer <= 0) this.inLove = false;
            else this.findMate();
        }

        if (this.timer <= 0) {
            if (this.state === 'panic') {
                this.state = 'idle';
            }
            this.pickNewState();
        }
    }

    followPlayer(delta) {
        const dist = this.position.distanceTo(this.player.position);

        if (dist < 16 && dist > 1.0) {
            const direction = new THREE.Vector3()
                .subVectors(this.player.position, this.position)
                .normalize();

            this.velocity.x += direction.x * this.runSpeed * delta;
            this.velocity.z += direction.z * this.runSpeed * delta;

            if (this.onGround && Math.random() < 0.01) {
                this.velocity.y = 7;
                this.onGround = false;
            }
        }
    }

    pickNewState() {
        if (Math.random() < 0.4) {
            this.state = 'idle';
            this.timer = 2;
        } else {
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const testDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
                const lookAhead = this.position.clone().add(testDir.clone().multiplyScalar(2));

                const blockPos = new THREE.Vector3(Math.floor(lookAhead.x), Math.floor(lookAhead.y), Math.floor(lookAhead.z));
                const groundBlockId = this.world.chunkManager.returnBlockId(new THREE.Vector3(blockPos.x, blockPos.y, blockPos.z));

                if (groundBlockId !== BlockDict.air.id || groundBlockId !== BlockDict.water.id || groundBlockId !== BlockDict.lava.id) {
                    this.state = 'walk';
                    this.moveDir = testDir;
                    this.timer = 3;
                    return;
                }
            }
            this.state = 'idle';
        }
    }

    findMate() {
        const mobs = this.player.mobManager.mobs;

        let closestMate = null;
        let minDist = 10;

        for (const mob of mobs) {
            // Must be same type, not self, in love, and not baby
            if (mob !== this && mob.config.name === this.config.name && mob.inLove && !mob.isBaby) {
                const dist = this.position.distanceTo(mob.position);
                if (dist < minDist) {
                    minDist = dist;
                    closestMate = mob;
                }
            }
        }
        if (closestMate) {
            this.state = 'follow_mate';

            // Move towards mate
            const dir = new THREE.Vector3().subVectors(closestMate.position, this.position).normalize();
            this.moveDir.copy(dir);

            // If touching, MAKE BABY
            if (minDist < 1.5) {
                this.inLove = false;
                closestMate.inLove = false;
                this.state = 'idle';
                closestMate.state = 'idle';

                this.player.mobManager.spawnBaby(this.config.name.toLowerCase(), this.position);
            }
        }
    }
}