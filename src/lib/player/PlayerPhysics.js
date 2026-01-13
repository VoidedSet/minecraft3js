import * as THREE from 'three';
import { NonSolidBlockIds } from '../Blocks.js';

export class PlayerPhysics {
    constructor(player, chunkManager) {
        this.player = player;
        this.chunkManager = chunkManager;

        this.collider = {
            size: new THREE.Vector3(0.6, 2.0, 0.6),
            offset: new THREE.Vector3(0, 1.0, 0)
        };

        this.overlapRegion = {
            startPos: new THREE.Vector3(),
            endPos: new THREE.Vector3()
        };
    }

    update(velocity) {
        this.updateCollider();

        // 1. CLONE the bounds so we can modify them during the loop
        const min = this.colliderMin.clone();
        const max = this.colliderMax.clone();

        const start = this.overlapRegion.startPos;
        const end = this.overlapRegion.endPos;

        let onGround = false;

        for (let x = start.x; x <= end.x; x++) {
            for (let y = start.y; y <= end.y; y++) {
                for (let z = start.z; z <= end.z; z++) {
                    const blockId = this.chunkManager.returnBlockId(new THREE.Vector3(x, y, z));
                    if (!NonSolidBlockIds.has(blockId)) {
                        const blockMin = new THREE.Vector3(x, y, z);
                        const blockMax = new THREE.Vector3(x + 1, y + 1, z + 1);

                        if (this.aabbIntersect(min, max, blockMin, blockMax)) {
                            // 2. Pass 'min' and 'max' to be updated if a collision occurs
                            const below = this.resolveCollision(min, max, blockMin, blockMax, velocity);
                            if (below) onGround = true;
                        }
                    }
                }
            }
        }

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

            // 3. SHIFT THE CHECKING BOX
            minA.x += push;
            maxA.x += push;

            velocity.x = 0;
        } else if (axis === 'y') {
            const push = maxA.y - minB.y < maxB.y - minA.y ? -overlaps.y : overlaps.y;
            this.player.position.y += push;

            // 3. SHIFT THE CHECKING BOX
            minA.y += push;
            maxA.y += push;

            velocity.y = 0;
            return push > 0;
        } else if (axis === 'z') {
            const push = maxA.z - minB.z < maxB.z - minA.z ? -overlaps.z : overlaps.z;
            this.player.position.z += push;

            // 3. SHIFT THE CHECKING BOX
            minA.z += push;
            maxA.z += push;

            velocity.z = 0;
        }

        return false;
    }

    smallestAxis(overlaps) {
        return Object.entries(overlaps).sort((a, b) => a[1] - b[1])[0][0];
    }
}