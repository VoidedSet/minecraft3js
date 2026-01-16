import * as THREE from 'three';
import { PassiveMob } from './PassiveMob.js';

export class NeutralMob extends PassiveMob {
    constructor(world, startPos, config, player, model) {
        super(world, startPos, config, player, model);

        this.isTamed = false;
        this.tameAttempts = 0;
    }

    update(delta) {
        const isAngry = this.world.mobManager.isSpeciesAngry(this.config.name);

        if (isAngry && !this.isTamed) {
            this.aggressiveUpdate(delta);
        } else {
            super.update(delta);
        }
    }

    aggressiveUpdate(delta) {
        const dist = this.position.distanceTo(this.player.position);

        if (dist < 32 && dist > 1.0) {
            const direction = new THREE.Vector3()
                .subVectors(this.player.position, this.position)
                .normalize();

            this.velocity.x += direction.x * this.runSpeed * delta;
            this.velocity.z += direction.z * this.runSpeed * delta;

            if (this.onGround && Math.random() < 0.05) {
                this.velocity.y = 7;
                this.onGround = false;
            }

            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }

        this.updatePhysics(delta);
    }

    takeDamage(amount, attackerPos) {
        super.takeDamage(amount, attackerPos);

        if (!this.isTamed) {
            this.world.mobManager.triggerAnger(this.config.name);
        }
    }

    interact(itemHeld) {
        if (this.config.tamable && !this.isTamed && this.config.attraction_items.includes(itemHeld)) {
            this.tameAttempts++;
            this.hasInteracted = true;

            // 35% chance after first attempt
            if (this.tameAttempts > 1 && Math.random() < 0.35) {
                this.isTamed = true;
                this.showHearts(true); // Visual feedback
                console.log(`${this.config.name} tamed!`);
            } else {
                // Failed attempt logic (maybe smoke particles later)
                console.log("Taming failed...");
            }
            return true;
        }

        if (this.isTamed) {
            return super.interact(itemHeld);
        }

        return false;
    }

    // Helper to show hearts (can be expanded later)
    showHearts(success) {
        // Placeholder for particle effect
        if (success) {
            // Turn eyes green or something temporary
            this.flashColor(new THREE.Color(0, 1, 0));
        }
    }

    flashColor(color) {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.add(color);
                setTimeout(() => {
                    if (child.material) child.material.color.sub(color);
                }, 500);
            }
        });
    }
}