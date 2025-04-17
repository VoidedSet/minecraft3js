import * as THREE from 'three';
import { NonSolidBlockIds } from '../Blocks.js';

export class PlayerPhysics {
    constructor(player, chunkManager) {
        this.player = player;
        this.chunkManager = chunkManager;

        // Collider aligned bottom-center, 2 blocks tall
        this.collider = {
            size: new THREE.Vector3(0.6, 2.0, 0.6),
            offset: new THREE.Vector3(0, 1.0, 0) // center of the collider is at y = 1.0 (half the height)
        };

        this.overlapRegion = {
            startPos: new THREE.Vector3(),
            endPos: new THREE.Vector3()
        };
    }

    update(velocity) {
        let onGround = false;

        this.updateCollider();

        const min = this.colliderMin;
        const max = this.colliderMax;

        const start = this.overlapRegion.startPos;
        const end = this.overlapRegion.endPos;

        for (let x = start.x; x <= end.x; x++) {
            for (let y = start.y; y <= end.y; y++) {
                for (let z = start.z; z <= end.z; z++) {
                    const blockId = this.chunkManager.returnBlockId(new THREE.Vector3(x, y, z));
                    if (!NonSolidBlockIds.has(blockId)) {
                        const blockMin = new THREE.Vector3(x, y, z);
                        const blockMax = new THREE.Vector3(x + 1, y + 1, z + 1);

                        if (this.aabbIntersect(min, max, blockMin, blockMax)) {
                            const collidedBelow = this.resolveCollision(min, max, blockMin, blockMax, velocity);
                            if (collidedBelow) onGround = true;
                        }
                    }
                }
            }
        }

        // Final grounded state
        this.player.onGround = onGround;
    }

    updateCollider() {
        const pos = this.player.position.clone().sub(this.collider.offset);
        const halfSize = this.collider.size.clone().multiplyScalar(0.5);

        this.colliderMin = pos.clone().sub(halfSize);
        this.colliderMax = pos.clone().add(halfSize);

        this.overlapRegion.startPos.set(
            Math.floor(this.colliderMin.x),
            Math.floor(this.colliderMin.y),
            Math.floor(this.colliderMin.z)
        );

        this.overlapRegion.endPos.set(
            Math.floor(this.colliderMax.x),
            Math.floor(this.colliderMax.y),
            Math.floor(this.colliderMax.z)
        );
    }

    aabbIntersect(minA, maxA, minB, maxB) {
        return (
            minA.x < maxB.x && maxA.x > minB.x &&
            minA.y < maxB.y && maxA.y > minB.y &&
            minA.z < maxB.z && maxA.z > minB.z
        );
    }

    resolveCollision(minA, maxA, minB, maxB, velocity) {
        const overlaps = {
            x: Math.min(maxA.x - minB.x, maxB.x - minA.x),
            y: Math.min(maxA.y - minB.y, maxB.y - minA.y),
            z: Math.min(maxA.z - minB.z, maxB.z - minA.z)
        };

        const axis = this.smallestAxis(overlaps);

        if (axis === 'x') {
            const push = maxA.x - minB.x < maxB.x - minA.x ? -overlaps.x : overlaps.x;
            this.player.position.x += push;
            velocity.x = 0;
        } else if (axis === 'y') {
            const push = maxA.y - minB.y < maxB.y - minA.y ? -overlaps.y : overlaps.y;
            this.player.position.y += push;
            velocity.y = 0;
            return push > 0; // if pushed from above, we're on the ground
        } else if (axis === 'z') {
            const push = maxA.z - minB.z < maxB.z - minA.z ? -overlaps.z : overlaps.z;
            this.player.position.z += push;
            velocity.z = 0;
        }

        return false;
    }

    smallestAxis(overlaps) {
        const sorted = Object.entries(overlaps).sort((a, b) => a[1] - b[1]);
        return sorted[0][0];
    }
}
