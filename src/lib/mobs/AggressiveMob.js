import * as THREE from 'three';
import { BaseMob } from './BaseMob.js';

export class AggressiveMob extends BaseMob {
    constructor(world, startPos, config, player) {
        super(world, startPos, config);
        this.player = player;
    }

    update(delta) {
        const dist = this.position.distanceTo(this.player.position);

        if (dist < 20 && dist > 1.0) {
            const direction = new THREE.Vector3()
                .subVectors(this.player.position, this.position)
                .normalize();

            this.velocity.x += direction.x * this.runSpeed * delta;
            this.velocity.z += direction.z * this.runSpeed * delta;

            if (this.onGround && Math.random() < 0.005) {
                this.velocity.y = 7;
                this.onGround = false;
            }
        }

        this.updatePhysics(delta);
    }
}